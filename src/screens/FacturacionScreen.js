import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Platform, TextInput, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ScreenTemplate from './ScreenTemplate';
import GenerarImpresion from '../components/GenerarImpresion';
import { facturaService } from '../services/facturaService';
import { pagoService } from '../services/pagoService';
import { reportHistoryService } from '../services/reportHistoryService';
import { clienteService } from '../services/clienteService';

export default function FacturacionScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { role: currentUserRole } = route.params || { role: "ADMIN" };
  const [comprobantesReservas, setComprobantesReservas] = useState([]);
  const [comprobantesMembresias, setComprobantesMembresias] = useState([]);
  const [facturasOficiales, setFacturasOficiales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('FACTURAS');
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingComprobante, setViewingComprobante] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingFactura, setEditingFactura] = useState(null);
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [editTotal, setEditTotal] = useState('');
  const [editClienteId, setEditClienteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [clientesList, setClientesList] = useState([]);
  const [anuladasMap, setAnuladasMap] = useState({});
  const [sortDesc, setSortDesc] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);


      // Cargar facturas
      try {
        const facturas = await facturaService.getAll();
        const clientes = await clienteService.getAll();
        setClientesList(clientes || []);
        const clienteMap = {};
        (clientes || []).forEach(c => { clienteMap[c.id] = c; });

        const anuladas = {};
        (facturas || []).forEach(f => {
          if (f.concepto === 'ANULACION' && f.descripcion) {
            const originalId = parseInt(f.descripcion);
            if (!isNaN(originalId)) anuladas[originalId] = true;
          }
        });
        setAnuladasMap(anuladas);

        const itemsF = (facturas || []).map(f => {
          const cliente = clienteMap[f.clienteId];
          const nombreCliente = cliente ? `${cliente.nombre} ${cliente.apellido}` : `Cliente #${f.clienteId}`;
          const fecha = f.fechaEmision ? new Date(f.fechaEmision) : new Date();
          const html = generateFacturaAfipHtml(f, nombreCliente, fecha);
          
          let dni = cliente && cliente.dni ? cliente.dni : 'SINDNI';
          let refStr = f.id.toString().padStart(8, '0');
          if ((f.total || 0) < 0 && f.descripcion) {
             refStr = String(f.descripcion).padStart(8, '0');
          }
          let pdfName = (f.total || 0) < 0 ? `Nota de Credito - ${nombreCliente.toUpperCase()} - ${dni} - Comp. Nro. ${refStr}` : `Factura B - ${nombreCliente.toUpperCase()} - ${dni} - Comp. Nro. ${refStr}`;

          return {
            id: f.id,
            clienteId: f.clienteId,
            nombreCliente,
            total: f.total || 2000,
            fecha: fecha.toISOString(),
            fileName: pdfName,
            isAnulada: !!anuladas[f.id],
            html
          };
        });
        setFacturasOficiales(itemsF);
      } catch (e) { console.error('Error cargando facturas oficiales:', e); }

      // Cargar comprobantes de reservas
      try {
        const reportes = await reportHistoryService.getReportes();
        const reservaReports = (reportes || []).filter(r => 
          r.fileName && r.fileName.includes('Comprobante-Reserva')
        );
        setComprobantesReservas(reservaReports);
      } catch (e) { console.error('Error cargando comprobantes:', e); }

      // Cargar comprobantes de membresias
      try {
        const [facturas, clientes] = await Promise.all([
          facturaService.getAll(),
          clienteService.getAll()
        ]);
        const clienteMap = {};
        (clientes || []).forEach(c => { clienteMap[c.id] = c; });

        const items = (facturas || []).map(f => {
          const cliente = clienteMap[f.clienteId];
          const nombreCliente = cliente ? `${cliente.nombre} ${cliente.apellido}` : `Cliente #${f.clienteId}`;
          const fecha = f.fechaEmision ? new Date(f.fechaEmision) : new Date();
          const html = generateMembresiaHtml(f, nombreCliente, fecha);
          return {
            id: f.id,
            clienteId: f.clienteId,
            nombreCliente,
            total: f.total || 2000,
            fecha: fecha.toISOString(),
            fileName: `Membresia-${nombreCliente.replace(/\s+/g, '_')}`,
            html
          };
        });
        setComprobantesMembresias(items);
      } catch (e) { console.error('Error cargando membresias:', e); }

    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos de facturación.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (comprobante) => {
    try {
      if (Platform.OS === 'web') {
        const html2pdf = require('html2pdf.js');
        const element = document.createElement('div');
        element.innerHTML = comprobante.html;
        html2pdf().from(element).set({
          margin: 10,
          filename: (comprobante.fileName || 'Comprobante') + '.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).save();
      } else {
        const { uri } = await Print.printToFileAsync({ html: comprobante.html });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo descargar el comprobante.');
    }
  };

  const printComprobante = async (comprobante) => {
    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(comprobante.html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      } else {
        await Print.printAsync({ html: comprobante.html });
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo imprimir el comprobante.');
    }
  };

  const editComprobante = (comprobante) => {
    setEditingFactura(comprobante);
    setIsEditingForm(false);
    setEditModalVisible(true);
  };

  const handleAnularFactura = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro que deseas emitir una Nota de Crédito para esta factura? Esto no se puede deshacer.')) {
        ejecutarNotaDeCredito();
      }
    } else {
      Alert.alert('Emitir Nota de Crédito', '¿Estás seguro que deseas emitir una Nota de Crédito para esta factura? Esto no se puede deshacer.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, Emitir', style: 'destructive', onPress: ejecutarNotaDeCredito }
      ]);
    }
  };

  const ejecutarNotaDeCredito = async () => {
    try {
      // Crear una nueva factura con el total en negativo para anular la original (Nota de Crédito)
      const payload = {
        total: -(Math.abs(editingFactura.total || 0)),
        fechaEmision: new Date().toISOString(),
        clienteId: editingFactura.clienteId,
        concepto: "ANULACION",
        descripcion: editingFactura.id.toString()
      };
      await facturaService.create(payload);
      setEditModalVisible(false);
      if (Platform.OS !== 'web') Alert.alert('Éxito', 'Nota de Crédito emitida correctamente.');
      loadData();
    } catch (e) {
      if (Platform.OS !== 'web') Alert.alert('Error', 'No se pudo generar la Nota de Crédito.');
      else window.alert('Error: No se pudo generar la Nota de Crédito.');
    }
  };

  const handleRectificarCompleto = async () => {
    if (!editClienteId) {
      if (Platform.OS !== 'web') Alert.alert('Error', 'Debe seleccionar un cliente válido de la lista.');
      else window.alert('Error: Debe seleccionar un cliente válido de la lista.');
      return;
    }
    if (!editTotal || isNaN(editTotal)) {
      if (Platform.OS !== 'web') Alert.alert('Error', 'Debe ingresar un monto válido.');
      else window.alert('Error: Debe ingresar un monto válido.');
      return;
    }
    
    try {
      // 1. Emitir Nota de Crédito (Anular la vieja)
      const ncPayload = {
        total: -(Math.abs(editingFactura.total || 0)),
        fechaEmision: new Date().toISOString(),
        clienteId: editingFactura.clienteId,
        concepto: "ANULACION",
        descripcion: editingFactura.id.toString()
      };
      await facturaService.create(ncPayload);

      // 2. Emitir Factura Nueva Rectificada
      const nuevaPayload = {
        total: parseFloat(editTotal),
        fechaEmision: new Date().toISOString(),
        clienteId: editClienteId || editingFactura.clienteId
      };
      await facturaService.create(nuevaPayload);

      setEditModalVisible(false);
      if (Platform.OS !== 'web') Alert.alert('Éxito', 'Factura rectificada (NC + Factura Nueva generadas).');
      loadData();
    } catch (e) {
      if (Platform.OS !== 'web') Alert.alert('Error', 'Hubo un error al rectificar.');
      else window.alert('Error: Hubo un error al rectificar.');
    }
  };


  const generateFacturaAfipHtml = (factura, nombreCliente, fecha) => {
    const pad = (n) => n.toString().padStart(2, '0');
    const formatDateStr = (d) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    const fechaStr = formatDateStr(fecha);

    const numFactura = String(factura.id).padStart(8, '0');
    const cae = Math.floor(10000000000000 + Math.random() * 90000000000000); 
    const vtoCae = formatDateStr(new Date(fecha.getTime() + 10 * 24 * 60 * 60 * 1000));
    const esNotaDeCredito = (factura.total || 0) < 0;
    const tipoDocumento = esNotaDeCredito ? "NOTA DE CRÉDITO" : "FACTURA";
    const codigoDocumento = esNotaDeCredito ? "COD. 008" : "COD. 006";
    const totalAbsoluto = Math.abs(factura.total || 2000);
    const totalFormat = (esNotaDeCredito ? "- " : "") + totalAbsoluto.toLocaleString('es-AR', {minimumFractionDigits: 2});
    
    let compRefNro = numFactura;
    if (esNotaDeCredito && factura.descripcion) {
       compRefNro = String(factura.descripcion).padStart(8, '0');
    }
    
    return `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; color: #000; background: #fff; font-size: 11px; margin: 0; padding: 20px; }
            .factura-wrapper { max-width: 800px; margin: 0 auto; }
            
            .top-header { text-align: center; font-size: 14px; font-weight: bold; padding: 5px; border: 1px solid #000; border-bottom: none; }
            .main-border { border: 1px solid #000; }
            
            .header-flex { display: flex; position: relative; border-bottom: 1px solid #000; }
            .header-left { width: 50%; padding: 15px; border-right: 1px solid #000; box-sizing: border-box; }
            .header-right { width: 50%; padding: 15px; box-sizing: border-box; padding-left: 40px; }
            
            .letra-box { position: absolute; left: 50%; top: 0; transform: translateX(-50%); width: 45px; background: #fff; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; text-align: center; }
            .letra-b { font-size: 32px; font-weight: bold; line-height: 36px; }
            .letra-cod { font-size: 8px; font-weight: bold; padding-bottom: 3px; border-top: 1px solid #000; }

            .company-name { font-size: 22px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; }
            .company-details { line-height: 1.6; }
            
            .factura-title { font-size: 24px; font-weight: bold; margin-bottom: 15px; }
            .factura-details { line-height: 1.6; }
            
            .period-row { display: flex; border-bottom: 1px solid #000; padding: 5px 15px; font-weight: bold; justify-content: space-between; }
            
            .client-box { display: flex; padding: 10px 15px; border-bottom: 1px solid #000; }
            .client-col-1 { width: 40%; line-height: 1.6; }
            .client-col-2 { width: 60%; line-height: 1.6; }
            
            .items-table { width: 100%; border-collapse: collapse; }
            .items-table th { background: #d1d5db; border-bottom: 1px solid #000; padding: 4px 8px; font-size: 10px; text-align: left; }
            .items-table td { border-left: 1px solid #000; padding: 6px 8px; font-size: 11px; vertical-align: top; }
            .items-table td:first-child { border-left: none; }
            .items-table .td-right { text-align: right; }
            .items-table .td-center { text-align: center; }
            
            .spacer-row td { padding: 80px 0; border-bottom: 1px solid #000; }
            
            .bottom-box { border-bottom: 1px solid #000; padding: 15px; display: flex; justify-content: flex-end; }
            .totals { width: 250px; line-height: 1.8; font-weight: bold; }
            .total-line { display: flex; justify-content: space-between; }
            .total-final { font-size: 13px; margin-top: 5px; }
            
            .footer { display: flex; margin-top: 15px; align-items: center; }
            .qr-code { width: 100px; height: 100px; }
            .afip-logo-area { flex: 1; text-align: left; padding-left: 15px; }
            .afip-sub { font-size: 11px; font-weight: bold; font-style: italic; margin-top: 5px; }
            .afip-disclaimer { font-size: 8px; margin-top: 5px; }
            
            .pag-info { font-weight: bold; font-size: 11px; margin-right: 30px; }
            .cae-area { text-align: right; font-weight: bold; line-height: 1.5; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="factura-wrapper">
            <div class="top-header">ORIGINAL</div>
            <div class="main-border">
              
              <div class="header-flex">
                <div class="letra-box">
                  <div class="letra-b">B</div>
                  <div class="letra-cod">${codigoDocumento}</div>
                </div>
                
                <div class="header-left">
                  <div class="company-name">COMPLEJO GOL AHORA SRL</div>
                  <div class="company-details">
                    <strong>Razón Social:</strong> COMPLEJO GOL AHORA SRL<br><br>
                    <strong>Domicilio Comercial:</strong> Av Calchaqui 6200 - Florencio Varela, Provincia de Buenos Aires<br><br>
                    <strong>Condición frente al IVA:</strong> IVA Responsable Inscripto
                  </div>
                </div>
                
                <div class="header-right">
                  <div class="factura-title">${tipoDocumento}</div>
                  <div class="factura-details">
                    <strong>Punto de Venta: 0001</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Comp. Nro: ${compRefNro}</strong><br>
                    <strong>Fecha de Emisión: ${fechaStr}</strong><br><br>
                    <strong>CUIT:</strong> 30-12345678-9<br>
                    <strong>Ingresos Brutos:</strong> 30-12345678-9<br>
                    <strong>Fecha de Inicio de Actividades:</strong> 01/01/2026
                  </div>
                </div>
              </div>

              <div class="period-row">
                <div>Período Facturado Desde: &nbsp;&nbsp;${fechaStr}</div>
                <div>Hasta: &nbsp;&nbsp;${fechaStr}</div>
                <div>Fecha de Vto. para el pago: &nbsp;&nbsp;${fechaStr}</div>
              </div>

              <div class="client-box">
                <div class="client-col-1">
                  <strong>CUIT:</strong> Consumidor Final<br>
                  <strong>Condición frente al IVA:</strong> IVA Sujeto Exento<br>
                  <strong>Condición de venta:</strong> Contado / Otra
                </div>
                <div class="client-col-2">
                  <strong>Apellido y Nombre / Razón Social:</strong> ${nombreCliente.toUpperCase()}<br>
                  <strong>Domicilio:</strong> PROVINCIA DE BUENOS AIRES
                </div>
              </div>

              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 8%;">Código</th>
                    <th style="width: 37%;">Producto / Servicio</th>
                    <th style="width: 8%; text-align:center;">Cantidad</th>
                    <th style="width: 10%; text-align:center;">U. Medida</th>
                    <th style="width: 12%; text-align:right;">Precio Unit.</th>
                    <th style="width: 8%; text-align:right;">% Bonif</th>
                    <th style="width: 8%; text-align:right;">Imp. Bonif.</th>
                    <th style="width: 13%; text-align:right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>SRV-001</td>
                    <td>${esNotaDeCredito ? 'Anulación de comprobante anterior' : 'Servicios Deportivos y Reservas'}</td>
                    <td class="td-center">1,00</td>
                    <td class="td-center">otras unidades</td>
                    <td class="td-right">${totalFormat}</td>
                    <td class="td-right">0,00</td>
                    <td class="td-right">0,00</td>
                    <td class="td-right">${totalFormat}</td>
                  </tr>
                  <tr class="spacer-row">
                    <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                  </tr>
                </tbody>
              </table>

              <div class="bottom-box">
                <div class="totals">
                  <div class="total-line">
                    <span>Subtotal: $</span>
                    <span>${totalFormat}</span>
                  </div>
                  <div class="total-line">
                    <span>Importe Otros Tributos: $</span>
                    <span>0,00</span>
                  </div>
                  <div class="total-line total-final">
                    <span>Importe Total: $</span>
                    <span>${totalFormat}</span>
                  </div>
                </div>
              </div>

            </div>

            <div class="footer">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.afip.gob.ar" class="qr-code" alt="QR" />
              <div class="afip-logo-area">
                <img src="data:image/jpeg;base64,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ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAMZpMD0FLRQAmB6CloooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoorG8Ya9D4a8N32rXA3Lbx5VM43ueFX8SQKANmivKvhn8V/+Et15tLv7KKyleMvAVl3byOSvIHOOfwNeq0AFFFcN4++JejeD3+zSiS81EruFtCQNvpvY/d/U+1AHc0V8/N8c9buC8tl4eh+zJy3zvJtHuwAH6V0PhT44abqV5Ha61YvprSEKs6yeZHn/AGuAV/WnYD2CimxussavGwZGGQw6EV5T8TPipdeD/En9l2+mQ3K+SspkeUqcnPGAPakB6xRXz3/wv3Uf+gFbf9/2/wDiacnx71J3VV0G3ZicACdsn/x2gD6Coqvp87XVhbXDxmNpYlkKHqpIBx+FeVax8YRo/ju40W+05BYQz+Q9ysvzKOPmxjGBn1osB67RTIZUnhSWF1eN1DKynIIPQiqev350rRL6/CeYbaFpducZwM4oAv0VwPwn8dzeOLbUXuLJLRrR0UBHLBgwPt7V31ABRXm/jn4uaL4ZuZLK2jk1O/T7yRMFjQ+jPzz9AfeuG/4XlrjA3CeHoPsY6tucj/vrGP0p2A+gaK8y8D/F/R/Ed1HZXsL6ZfSHCLI4eNz6B8Dn2IFemE4BNIBaK86+E/xCn8czamk9hHaC0WNl2SFt24t14/2a9FoAKKp6vqEOlaVd390cQW0TSvj0AzXlPgf4y/8ACQeKbfS77To7OG5JSKUS7sN1UHIHXGPqRQB7FRRRQAUUVQ16/Ol6Ne3yx+a1vE0gTON2B0oAv0V89j4+6h/0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" style="width: 150px; margin-bottom: 5px;" alt="ARCA Logo" />
                <div class="afip-sub">Comprobante Autorizado</div>
                <div class="afip-disclaimer">Esta Administración Federal no se responsabiliza por los datos ingresados en el detalle de la operación</div>
              </div>
              <div class="pag-info">Pág. 1/1</div>
              <div class="cae-area">
                CAE N°: <span style="font-weight:normal;">${cae}</span><br>
                Fecha de Vto. de CAE: <span style="font-weight:normal;">${vtoCae}</span>
              </div>
            </div>

          </div>
        </body>
      </html>
    `;
  };

  const generateMembresiaHtml = (factura, nombreCliente, fecha) => {
    return `
      <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #1e293b; background: #fff; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { color: #009b3a; font-size: 42px; font-weight: 900; margin: 0; }
            .sub { font-size: 13px; color: #64748b; font-weight: 600; margin-top: 5px; }
            .divider { border-bottom: 2px solid #e2e8f0; margin: 20px 0; }
            .title { font-size: 20px; font-weight: 800; color: #ec4899; text-align: center; margin-bottom: 20px; }
            .info-grid { margin: 0 auto; max-width: 500px; }
            .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
            .label { font-weight: 700; color: #64748b; font-size: 14px; }
            .value { font-weight: 800; color: #1e293b; font-size: 14px; }
            .total-row { display: flex; justify-content: space-between; padding: 16px 20px; background: #f0fdf4; border-radius: 12px; margin-top: 20px; }
            .total-label { font-weight: 900; color: #009b3a; font-size: 18px; }
            .total-value { font-weight: 900; color: #009b3a; font-size: 18px; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="logo">GOL AHORA</h1>
            <p class="sub">SISTEMA DE GESTIÓN DEPORTIVA</p>
          </div>
          <div class="divider"></div>
          <div class="title">FACTURA DE MEMBRESÍA - SOCIO ACTIVO</div>
          <div class="info-grid">
            <div class="row"><span class="label">N° Factura</span> <span class="value">#${factura.id}</span></div>
            <div class="row"><span class="label">Cliente</span> <span class="value">${nombreCliente}</span></div>
            <div class="row"><span class="label">Fecha de Emisión</span> <span class="value">${fecha.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</span></div>
            <div class="row"><span class="label">Hora</span> <span class="value">${fecha.toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false })} hs</span></div>
            <div class="row"><span class="label">Concepto</span> <span class="value">Suscripción Socio Activo</span></div>
            <div class="total-row">
              <span class="total-label">TOTAL ABONADO</span>
              <span class="total-value">$${(factura.total || 2000).toLocaleString('es-AR')}</span>
            </div>
          </div>
          <div class="footer">
            Generado automáticamente por Gol Ahora - ${fecha.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
          </div>
        </body>
      </html>
    `;
  };

  const viewComprobante = (comprobante) => {
    setViewingComprobante(comprobante);
    setViewModalVisible(true);
  };

  // Parse the HTML to extract data for the "Ver" view
  const extractDataFromHtml = (html) => {
    if (!html) return [];
    const rows = [];
    const regex = /<span class="label[^"]*">(.*?)<\/span>\s*<span class="[^"]*">(.*?)<\/span>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      rows.push({ label: match[1].replace(/<[^>]*>/g, ''), value: match[2].replace(/<[^>]*>/g, '') });
    }
    // Extract total
    const totalMatch = html.match(/TOTAL:\s*(\$[\d.,]+)/);
    if (totalMatch) {
      rows.push({ label: 'TOTAL', value: totalMatch[1], isTotal: true });
    }
    return rows;
  };

  const filteredFacturas = facturasOficiales.filter(f => 
    (f.fileName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (f.nombreCliente || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReservas = comprobantesReservas.filter(c => 
    (c.fileName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMembresias = comprobantesMembresias.filter(c => 
    (c.fileName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#009b3a" />
          <Text style={{ color: '#fff', marginTop: 10, fontWeight: '600' }}>Cargando facturación...</Text>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
      <View style={[styles.searchWrapper, isSearchFocused && styles.searchWrapperFocused]}>
        <View style={styles.searchInner}>
            <MaterialCommunityIcons name="magnify" size={22} color={isSearchFocused ? "#009b3a" : "#94a3b8"} />
            <TextInput
              style={[styles.searchInputNav, { outlineStyle: 'none' }]}
              placeholder="Buscar comprobante o cliente..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
        </View>
      </View>

      <Text style={styles.title}>Facturación y Cobros</Text>

      {/* Tabs */}
      <View style={[styles.tabRow, isMobile && { flexDirection: 'column' }]}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'FACTURAS' && styles.tabBtnActive, isMobile && { flex: undefined }]}
          onPress={() => setActiveTab('FACTURAS')}
        >
          <MaterialCommunityIcons name="receipt" size={18} color={activeTab === 'FACTURAS' ? '#fff' : '#009b3a'} />
          <Text style={[styles.tabText, activeTab === 'FACTURAS' && { color: '#fff' }]}>Facturas</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'COMPROBANTES' && styles.tabBtnActive, isMobile && { flex: undefined }]}
          onPress={() => setActiveTab('COMPROBANTES')}
        >
          <MaterialCommunityIcons name="text-box-check-outline" size={18} color={activeTab === 'COMPROBANTES' ? '#fff' : '#009b3a'} />
          <Text style={[styles.tabText, activeTab === 'COMPROBANTES' && { color: '#fff' }]}>Comprobantes de Reservas</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'MEMBRESIAS' && styles.tabBtnActive, isMobile && { flex: undefined }]}
          onPress={() => setActiveTab('MEMBRESIAS')}
        >
          <MaterialCommunityIcons name="card-account-details-star" size={18} color={activeTab === 'MEMBRESIAS' ? '#fff' : '#009b3a'} />
          <Text style={[styles.tabText, activeTab === 'MEMBRESIAS' && { color: '#fff' }]}>Comprobantes de Membresias</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={true}>
        {activeTab === 'FACTURAS' ? (
          <>
            {filteredFacturas.length > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{filteredFacturas.length} facturas</Text>
                <TouchableOpacity onPress={() => setSortDesc(!sortDesc)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#009b3a', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}>
                  <MaterialCommunityIcons name={sortDesc ? "sort-calendar-descending" : "sort-calendar-ascending"} size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 6 }}>
                    {sortDesc ? 'Más recientes' : 'Más antiguas'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {filteredFacturas.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="receipt" size={50} color="#94a3b8" />
                <Text style={styles.emptyText}>No se encontraron facturas.</Text>
              </View>
            ) : (
              [...filteredFacturas].sort((a, b) => {
                return sortDesc ? b.id - a.id : a.id - b.id;
              }).map(comp => (
                <View key={comp.id} style={styles.comprobanteCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <MaterialCommunityIcons name="file-pdf-box" size={36} color="#ef4444" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.comprobanteName, comp.isAnulada && { color: '#64748b', textDecorationLine: 'line-through' }]}>
                        {comp.fileName} {comp.isAnulada && '(ANULADA)'}
                      </Text>
                      <Text style={styles.comprobanteFecha}>
                        {comp.nombreCliente} - {new Date(comp.fecha?.endsWith('Z') ? comp.fecha : comp.fecha + 'Z').toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour12: false })} hs
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.comprobanteBtns, isMobile && { flexWrap: 'wrap' }]}>
                    <TouchableOpacity 
                      style={[styles.compBtn, { backgroundColor: '#009b3a' }, isMobile && { flexGrow: 1, justifyContent: 'center' }]}
                      onPress={() => downloadPdf(comp)}
                    >
                      <MaterialCommunityIcons name="download" size={16} color="#fff" />
                      <Text style={styles.compBtnText}>Descargar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.compBtn, { backgroundColor: '#3b82f6' }, isMobile && { flexGrow: 1, justifyContent: 'center' }]}
                      onPress={() => viewComprobante(comp)}
                    >
                      <MaterialCommunityIcons name="eye" size={16} color="#fff" />
                      <Text style={styles.compBtnText}>Ver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.compBtn, { backgroundColor: '#ffb300' }, isMobile && { flexGrow: 1, justifyContent: 'center' }]}
                      onPress={() => printComprobante(comp)}
                    >
                      <MaterialCommunityIcons name="printer" size={16} color="#000" />
                      <Text style={[styles.compBtnText, { color: '#000' }]}>Imprimir</Text>
                    </TouchableOpacity>
                    {(!comp.isAnulada && comp.total > 0) && (
                      <TouchableOpacity 
                        style={[styles.compBtn, { backgroundColor: '#ef4444' }, isMobile && { flexGrow: 1, justifyContent: 'center' }]}
                        onPress={() => editComprobante(comp)}
                      >
                        <MaterialCommunityIcons name="pencil-remove" size={16} color="#fff" />
                        <Text style={styles.compBtnText}>Editar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
        ) : activeTab === 'COMPROBANTES' ? (
          <>
            {filteredReservas.length > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{filteredReservas.length} comprobantes</Text>
                <TouchableOpacity onPress={() => setSortDesc(!sortDesc)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#009b3a', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}>
                  <MaterialCommunityIcons name={sortDesc ? "sort-calendar-descending" : "sort-calendar-ascending"} size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 6 }}>
                    {sortDesc ? 'Más recientes' : 'Más antiguos'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {filteredReservas.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="file-document-outline" size={50} color="#94a3b8" />
                <Text style={styles.emptyText}>No se encontraron comprobantes de reservas.</Text>
              </View>
            ) : (
              [...filteredReservas].sort((a, b) => {
                const d1 = new Date(a.fecha?.endsWith('Z') ? a.fecha : a.fecha + 'Z').getTime();
                const d2 = new Date(b.fecha?.endsWith('Z') ? b.fecha : b.fecha + 'Z').getTime();
                return sortDesc ? d2 - d1 : d1 - d2;
              }).map(comp => (
                <View key={comp.id} style={styles.comprobanteCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <MaterialCommunityIcons name="file-pdf-box" size={36} color="#ef4444" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.comprobanteName}>{comp.fileName || 'Comprobante de Reserva'}</Text>
                      <Text style={styles.comprobanteFecha}>
                        {new Date(comp.fecha?.endsWith('Z') ? comp.fecha : comp.fecha + 'Z').toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.comprobanteBtns, isMobile && { flexWrap: 'wrap' }]}>
                    <TouchableOpacity 
                      style={[styles.compBtn, { backgroundColor: '#009b3a' }, isMobile && { flexGrow: 1, justifyContent: 'center' }]}
                      onPress={() => downloadPdf(comp)}
                    >
                      <MaterialCommunityIcons name="download" size={16} color="#fff" />
                      <Text style={styles.compBtnText}>Descargar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.compBtn, { backgroundColor: '#3b82f6' }, isMobile && { flexGrow: 1, justifyContent: 'center' }]}
                      onPress={() => viewComprobante(comp)}
                    >
                      <MaterialCommunityIcons name="eye" size={16} color="#fff" />
                      <Text style={styles.compBtnText}>Ver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.compBtn, { backgroundColor: '#ffb300' }, isMobile && { flexGrow: 1, justifyContent: 'center' }]}
                      onPress={() => printComprobante(comp)}
                    >
                      <MaterialCommunityIcons name="printer" size={16} color="#000" />
                      <Text style={[styles.compBtnText, { color: '#000' }]}>Imprimir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        ) : activeTab === 'MEMBRESIAS' ? (
          <>
            {filteredMembresias.length > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{filteredMembresias.length} comprobantes</Text>
                <TouchableOpacity onPress={() => setSortDesc(!sortDesc)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#009b3a', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}>
                  <MaterialCommunityIcons name={sortDesc ? "sort-calendar-descending" : "sort-calendar-ascending"} size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 6 }}>
                    {sortDesc ? 'Más recientes' : 'Más antiguos'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {filteredMembresias.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="file-document-outline" size={50} color="#94a3b8" />
                <Text style={styles.emptyText}>No se encontraron comprobantes de membresías.</Text>
              </View>
            ) : (
              [...filteredMembresias].sort((a, b) => {
                const d1 = new Date(a.fecha?.endsWith('Z') ? a.fecha : a.fecha + 'Z').getTime();
                const d2 = new Date(b.fecha?.endsWith('Z') ? b.fecha : b.fecha + 'Z').getTime();
                return sortDesc ? d2 - d1 : d1 - d2;
              }).map(comp => (
                <View key={comp.id} style={styles.comprobanteCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <MaterialCommunityIcons name="file-pdf-box" size={36} color="#ef4444" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.comprobanteName}>{comp.fileName || 'Comprobante de Membresía'}</Text>
                      <Text style={styles.comprobanteFecha}>
                        {new Date(comp.fecha?.endsWith('Z') ? comp.fecha : comp.fecha + 'Z').toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour12: false })} hs
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.comprobanteBtns, isMobile && { flexWrap: 'wrap' }]}>
                    <TouchableOpacity 
                      style={[styles.compBtn, { backgroundColor: '#009b3a' }, isMobile && { flexGrow: 1, justifyContent: 'center' }]}
                      onPress={() => downloadPdf(comp)}
                    >
                      <MaterialCommunityIcons name="download" size={16} color="#fff" />
                      <Text style={styles.compBtnText}>Descargar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.compBtn, { backgroundColor: '#3b82f6' }, isMobile && { flexGrow: 1, justifyContent: 'center' }]}
                      onPress={() => viewComprobante(comp)}
                    >
                      <MaterialCommunityIcons name="eye" size={16} color="#fff" />
                      <Text style={styles.compBtnText}>Ver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.compBtn, { backgroundColor: '#ffb300' }, isMobile && { flexGrow: 1, justifyContent: 'center' }]}
                      onPress={() => printComprobante(comp)}
                    >
                      <MaterialCommunityIcons name="printer" size={16} color="#000" />
                      <Text style={[styles.compBtnText, { color: '#000' }]}>Imprimir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        ) : null}
      </ScrollView>

      {/* Modal Ver Comprobante */}
      <Modal visible={viewModalVisible} animationType="fade" transparent={true}>
        <View style={styles.viewOverlay}>
          <View style={styles.viewContainer}>
            <View style={styles.viewHeader}>
              <Text style={styles.viewTitle}>Detalle del Comprobante</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <MaterialCommunityIcons name="close-circle" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={true}>
              {Platform.OS === 'web' ? (
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
                  <iframe 
                    srcDoc={viewingComprobante?.html} 
                    style={{ width: '100%', minWidth: 800, height: 600, border: 'none', backgroundColor: '#fff' }} 
                  />
                </ScrollView>
              ) : (
                <>
                  <View style={styles.viewBrand}>
                    <Text style={styles.viewBrandText}>GOL AHORA</Text>
                    <Text style={styles.viewBrandSub}>COMPROBANTE</Text>
                  </View>
                  <View style={styles.viewDivider} />

                  {viewingComprobante && extractDataFromHtml(viewingComprobante.html).map((row, i) => (
                    <View key={i} style={[styles.viewRow, row.isTotal && styles.viewRowTotal]}>
                      <Text style={[styles.viewLabel, row.isTotal && { fontWeight: '900', color: '#1e293b' }]}>{row.label}</Text>
                      <Text style={[styles.viewValue, row.isTotal && { fontSize: 20, color: '#009b3a' }]}>{row.value}</Text>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Editar Comprobante */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.viewOverlay}>
          <View style={[styles.viewContainer, { maxWidth: 500 }]}>
            <View style={styles.viewHeader}>
              <Text style={styles.viewTitle}>Editar Factura #{editingFactura?.id}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialCommunityIcons name="close-circle" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 15, lineHeight: 20 }}>
                Las facturas emitidas y autorizadas por ARCA no pueden ser modificadas directamente. 
                Debe generar una Nota de Crédito para anularla y emitir una nueva.
              </Text>

              <View style={{ backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, marginBottom: 20 }}>
                <Text style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: 5 }}>Cliente:</Text>
                <Text style={{ color: '#475569', marginBottom: 15 }}>{editingFactura?.nombreCliente}</Text>
                
                <Text style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: 5 }}>Total Actual:</Text>
                <Text style={{ color: '#009b3a', fontSize: 18, fontWeight: '900' }}>
                  ${(editingFactura?.total || 0).toLocaleString('es-AR')}
                </Text>
              </View>

              {!isEditingForm ? (
                <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'space-between' }}>
                  <TouchableOpacity 
                    style={{ flex: 1, backgroundColor: '#10b981', padding: 15, borderRadius: 12, alignItems: 'center' }}
                    onPress={handleAnularFactura}
                  >
                    <MaterialCommunityIcons name="receipt-text-minus" size={24} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 5 }}>Emitir Nota de Crédito</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={{ flex: 1, backgroundColor: '#3b82f6', padding: 15, borderRadius: 12, alignItems: 'center' }}
                    onPress={() => {
                       setEditTotal(String(editingFactura?.total || 0));
                       setEditClienteId(editingFactura?.clienteId);
                       setSearchQuery(editingFactura?.nombreCliente || '');
                       setShowDropdown(false);
                       setIsEditingForm(true);
                    }}
                  >
                    <MaterialCommunityIcons name="file-document-edit" size={24} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 5 }}>Rectificar Datos</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: 5 }}>Nuevo Cliente:</Text>
                  <TextInput 
                    style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 16, marginBottom: showDropdown ? 0 : 15 }}
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      setShowDropdown(true);
                      setEditClienteId(null);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Escriba para buscar un cliente..."
                  />
                  {showDropdown && (
                    <ScrollView style={{ maxHeight: 150, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderTopWidth: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, marginBottom: 15 }}>
                      {clientesList.filter(c => (c.nombre + ' ' + c.apellido).toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                        <Text style={{ padding: 10, color: '#64748b' }}>No se encontraron clientes.</Text>
                      ) : (
                        clientesList.filter(c => (c.nombre + ' ' + c.apellido).toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                          <TouchableOpacity 
                            key={c.id} 
                            style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: editClienteId === c.id ? '#e2e8f0' : 'transparent' }}
                            onPress={() => {
                              setSearchQuery(`${c.nombre} ${c.apellido}`);
                              setEditClienteId(c.id);
                              setShowDropdown(false);
                            }}
                          >
                            <Text style={{ color: '#333', fontWeight: editClienteId === c.id ? 'bold' : 'normal' }}>{c.nombre} {c.apellido}</Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  )}
                  
                  <Text style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: 5 }}>Nuevo Total:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                    <Text style={{ fontSize: 18, color: '#1e293b', fontWeight: 'bold', marginRight: 5 }}>$</Text>
                    <TextInput 
                      style={{ flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 16 }}
                      keyboardType="numeric"
                      value={editTotal}
                      onChangeText={setEditTotal}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'space-between' }}>
                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: '#94a3b8', padding: 15, borderRadius: 12, alignItems: 'center' }}
                      onPress={() => setIsEditingForm(false)}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: '#009b3a', padding: 15, borderRadius: 12, alignItems: 'center' }}
                      onPress={handleRectificarCompleto}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Rectificar y Generar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 15 },

  // Search
  searchWrapper: { width: '100%', backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, elevation: 4, borderWidth: 1, borderColor: '#f1f5f9' },
  searchWrapperFocused: { borderColor: '#009b3a', borderWidth: 1.5 },
  searchInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 55 },
  searchInputNav: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#1e293b' },

  // Tabs
  tabRow: { flexDirection: 'row', marginBottom: 18, gap: 8 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 14, backgroundColor: '#fff', gap: 6, elevation: 2 },
  tabBtnActive: { backgroundColor: '#009b3a' },
  tabText: { fontSize: 12, fontWeight: '800', color: '#009b3a' },

  // Pagos
  pagoCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 18, 
    marginBottom: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    elevation: 3 
  },
  pagoInfo: { flex: 1 },
  pagoConcepto: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  pagoMeta: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '600' },
  pagoEstado: { fontSize: 11, fontWeight: '900', marginTop: 4 },
  pagoAction: { alignItems: 'flex-end', justifyContent: 'space-between' },
  pagoMonto: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  printButton: { 
    alignItems: 'center', 
    marginTop: 10,
    padding: 5
  },
  printLabel: { 
    fontSize: 9, 
    fontWeight: '900', 
    color: '#009b3a', 
    marginTop: 2 
  },

  // Comprobantes
  comprobanteCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, elevation: 3 },
  comprobanteName: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  comprobanteFecha: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  comprobanteBtns: { flexDirection: 'row', gap: 8, marginTop: 12 },
  compBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, gap: 5 },
  compBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  // Empty
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '600', marginTop: 10 },

  // View Modal
  viewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  viewContainer: { width: '100%', maxWidth: 850, backgroundColor: '#fff', borderRadius: 24, padding: 25, maxHeight: '90%' },
  viewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  viewTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  viewBrand: { alignItems: 'center', marginBottom: 10 },
  viewBrandText: { fontSize: 28, fontWeight: '900', color: '#009b3a' },
  viewBrandSub: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 1 },
  viewDivider: { height: 3, backgroundColor: '#009b3a', marginVertical: 15, borderRadius: 2 },
  viewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  viewRowTotal: { borderTopWidth: 2, borderTopColor: '#009b3a', marginTop: 10, paddingTop: 15, borderBottomWidth: 0 },
  viewLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  viewValue: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
});
