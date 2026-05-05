import { Platform } from 'react-native';
import * as Print from 'expo-print';

const GenerarImpresion = async (pago) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=GOLAHO-ID-${pago.id}`;

  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 30px; color: #1e293b; }
          .header { text-align: center; border-bottom: 4px solid #009b3a; padding-bottom: 15px; }
          .logo { font-size: 26px; font-weight: 900; color: #009b3a; margin: 0; }
          .container { margin-top: 25px; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; background: #f8fafc; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .label { font-weight: bold; color: #64748b; font-size: 10px; text-transform: uppercase; }
          .total { font-size: 22px; font-weight: 900; color: #1e293b; text-align: right; margin-top: 15px; border-top: 2px solid #009b3a; }
          .qr-section { text-align: center; margin-top: 20px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="logo">GOL AHORA</h1>
          <p style="font-size: 10px; font-weight: bold;">Comprobante Oficial - Trabajo Práctico UNAJ</p>
        </div>
        <div class="container">
          <div class="row"><span class="label">Transaccion</span> <b>#${pago.id}</b></div>
          <div class="row"><span class="label">Fecha</span> <b>${pago.fecha}</b></div>
          <div class="row"><span class="label">Cliente</span> <b>${pago.usuario}</b></div>
          <div class="row"><span class="label">Concepto</span> <b>${pago.concepto}</b></div>
          <div class="row"><span class="label">Metodo</span> <b>${pago.metodo}</b></div>
          <p class="total">PAGADO: $${pago.monto}</p>
          <div class="qr-section">
            <img src="${qrUrl}" width="110" height="110" />
            <p style="font-size: 8px; color: #94a3b8;">Escanee para validar el pago en el complejo</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    if (Platform.OS === 'web') {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.onload = () => {
          win.print();
          URL.revokeObjectURL(url);
        };
      }
    } else {
      await Print.printAsync({ html: htmlContent });
    }
  } catch (error) {
    console.error("Error en GenerarImpresion:", error);
  }
};

export default GenerarImpresion;