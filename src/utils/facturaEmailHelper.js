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

    // Send the email request
    const payload = {
      toEmail,
      subject: `Gol Ahora-Factura ${motivo} ${nombrePersona}`,
      body: `Hola ${nombrePersona}! A continuación te adjuntamos tu factura correspondiente a ${motivo}.`,
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
