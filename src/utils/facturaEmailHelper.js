import { facturaService } from '../services/facturaService';
import { http, API_BASE_URL } from '../services/apiConfig';

/**
 * Utility to generate an invoice PDF in memory and send it via email.
 * @param {Object} options
 * @param {string} options.html - The HTML string representing the invoice.
 * @param {string} options.fileName - The name of the PDF file to attach.
 * @param {string} options.toEmail - The recipient's email address.
 * @param {string} options.nombrePersona - The name of the person for the email greeting.
 * @param {string} options.motivo - The reason for the invoice (e.g. "Reserva de cancha").
 * @param {number|null} options.clienteId - The ID of the client, used for sending notifications on failure. null if guest.
 */
export const generarYEnviarFactura = async ({ html, fileName, toEmail, nombrePersona, motivo, clienteId }) => {
  if (!toEmail) {
    console.warn("No email provided for invoice delivery.");
    return;
  }

  try {
    // Dynamically import html2pdf to avoid issues in non-browser environments or initial load
    const module = await import('html2pdf.js');
    const html2pdf = module.default || module;

    // Create a temporary hidden container
    const element = document.createElement('div');
    element.innerHTML = html;
    element.style.position = 'absolute';
    element.style.top = '-9999px';
    element.style.left = '-9999px';
    document.body.appendChild(element);

    // Generate the PDF as a base64 string
    const pdfBase64 = await html2pdf().from(element).set({
      margin: 10,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).outputPdf('datauristring');

    document.body.removeChild(element);

    const bodyHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#004d1a;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, #004d1a 0%, #00290e 100%);background-color:#004d1a;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;border-radius:35px;overflow:hidden;border:1.5px solid rgba(255,255,255,0.15);background-color:#02591e;position:relative;">
          <!-- Líneas de cancha decorativas -->
          <tr>
            <td style="height:0;position:relative;">
              <div style="position:absolute;top:0;left:20%;right:20%;height:40px;border-bottom:2px solid rgba(255,255,255,0.2);border-left:2px solid rgba(255,255,255,0.2);border-right:2px solid rgba(255,255,255,0.2);"></div>
            </td>
          </tr>
          <!-- Header -->
          <tr>
            <td align="center" style="padding:50px 30px 20px 30px;">
              <p style="color:#ffffff;font-size:14px;font-weight:300;letter-spacing:3px;margin:0 0 5px 0;">Complejo</p>
              <h1 style="color:#ffffff;font-size:42px;font-weight:900;letter-spacing:-1px;margin:0;">GOL AHORA</h1>
              <div style="display:inline-block;background-color:#ffb300;padding:4px 14px;border-radius:4px;margin-top:8px;">
                <span style="color:#000000;font-size:10px;font-weight:900;letter-spacing:1px;">NUEVA FACTURA DISPONIBLE</span>
              </div>
            </td>
          </tr>
          <!-- Card blanca -->
          <tr>
            <td align="center" style="padding:0 25px 40px 25px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:25px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.3);">
                <tr>
                  <td style="padding:35px 30px;">
                    <!-- Icono -->
                    <div style="text-align:center;margin-bottom:20px;">
                      <div style="display:inline-block;width:60px;height:60px;border-radius:50%;background-color:#f0fdf4;line-height:60px;text-align:center;">
                        <span style="font-size:30px;">🧾</span>
                      </div>
                    </div>
                    <p style="color:#1e293b;font-size:18px;font-weight:700;text-align:center;margin:0 0 10px 0;">¡Hola ${nombrePersona}!</p>
                    <p style="color:#475569;font-size:14px;line-height:22px;text-align:center;margin:0 0 25px 0;">
                      Se generó una nueva factura correspondiente a tu <strong style="color:#009b3a;">${motivo}</strong>.
                      La adjuntamos en este correo en formato PDF.
                    </p>

                    <!-- Info -->
                    <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 15px;margin-bottom:20px;">
                      <p style="color:#16a34a;font-size:12px;font-weight:600;margin:0;text-align:center;">
                        ✅ Podés descargar y guardar el comprobante adjunto.
                      </p>
                    </div>
                    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0 0 15px 0;">
                      Si tenés alguna duda o consulta, por favor comunicate con la administración del complejo.
                    </p>
                    <!-- Línea divisoria -->
                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
                    <p style="color:#cbd5e1;font-size:11px;text-align:center;margin:0;">
                      Complejo Gol Ahora · Sistema de Gestión Deportiva<br/>
                      S.A. CUIT: 30-12345678-3
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Líneas de cancha decorativas inferiores -->
          <tr>
            <td style="height:40px;position:relative;">
              <div style="position:absolute;bottom:0;left:20%;right:20%;height:40px;border-top:2px solid rgba(255,255,255,0.2);border-left:2px solid rgba(255,255,255,0.2);border-right:2px solid rgba(255,255,255,0.2);"></div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send the email request
    const payload = {
      toEmail,
      subject: `Gol Ahora-Factura ${motivo} ${nombrePersona}`,
      body: bodyHtml,
      pdfBase64,
      fileName
    };

    await facturaService.enviarFacturaEmail(payload);
    console.log(`Invoice email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error("Error sending invoice email:", error);
    // If it's a registered client, send a system notification
    if (clienteId) {
      try {
        const notiPayload = {
          usuarioId: clienteId,
          tipo: 'SISTEMA',
          titulo: 'Demora en envío de factura',
          mensaje: `El envío de tu factura por ${motivo} está con demoras, pero pronto la recibirás en tu correo.`,
          fechaCreacion: new Date().toISOString(),
          leida: false
        };
        await http.post(`${API_BASE_URL}/Notificacion`, notiPayload);
      } catch (notiError) {
        console.error("Failed to send fallback notification to client:", notiError);
      }
    }
  }
};
