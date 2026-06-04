import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
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
  const { role: currentUserRole } = route.params || { role: "ADMIN" };
  const [pagos, setPagos] = useState([]);
  const [comprobantesReservas, setComprobantesReservas] = useState([]);
  const [comprobantesMembresias, setComprobantesMembresias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('RECIBOS');
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingComprobante, setViewingComprobante] = useState(null);
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      let items = [];

      try {
        const facturas = await facturaService.getAll();
        items = [...items, ...(facturas || []).map(f => ({
          ...f, 
          id: f.id?.toString(),
          concepto: f.concepto || 'Factura',
          monto: f.total || 0,
          fecha: f.fechaEmision ? new Date(f.fechaEmision).toLocaleDateString() : '-',
          metodo: '-',
          estado: 'EMITIDA'
        }))];
      } catch (e) { /* facturas endpoint puede fallar */ }

      try {
        const pagosData = await pagoService.getAll();
        
        const getMetodo = (m) => {
          if (m === 1 || m === 'Efectivo') return 'Efectivo';
          if (m === 2 || m === 'Tarjeta') return 'Tarjeta';
          if (m === 3 || m === 'Transferencia') return 'Transferencia';
          return 'Otro';
        };

        const getEstado = (e) => {
          if (e === 1 || e === 'Pendiente') return 'PENDIENTE';
          if (e === 2 || e === 'Pagado') return 'PAGADO';
          if (e === 3 || e === 'Cancelado') return 'CANCELADO';
          if (e === 4 || e === 'Reintegro') return 'REINTEGRO';
          return 'DESCONOCIDO';
        };

        items = [...items, ...(pagosData || []).map(p => ({
          ...p, 
          id: p.id?.toString(),
          concepto: 'Pago de Reserva',
          monto: p.monto || 0,
          fecha: p.fechaPago ? new Date(p.fechaPago).toLocaleDateString() : '-',
          metodo: getMetodo(p.metodo),
          estado: getEstado(p.estado)
        }))];
      } catch (e) { /* pagos endpoint puede fallar */ }

      setPagos(items);

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
            <div class="row"><span class="label">Fecha de Emisión</span> <span class="value">${fecha.toLocaleDateString('es-AR')}</span></div>
            <div class="row"><span class="label">Hora</span> <span class="value">${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span></div>
            <div class="row"><span class="label">Concepto</span> <span class="value">Suscripción Socio Activo</span></div>
            <div class="total-row">
              <span class="total-label">TOTAL ABONADO</span>
              <span class="total-value">$${(factura.total || 2000).toLocaleString('es-AR')}</span>
            </div>
          </div>
          <div class="footer">
            Generado automáticamente por Gol Ahora - ${fecha.toLocaleDateString('es-AR')}
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
      <Text style={styles.title}>Facturación y Cobros</Text>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'RECIBOS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('RECIBOS')}
        >
          <MaterialCommunityIcons name="cash-register" size={18} color={activeTab === 'RECIBOS' ? '#fff' : '#009b3a'} />
          <Text style={[styles.tabText, activeTab === 'RECIBOS' && { color: '#fff' }]}>Recibos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'COMPROBANTES' && styles.tabBtnActive]}
          onPress={() => setActiveTab('COMPROBANTES')}
        >
          <MaterialCommunityIcons name="receipt" size={18} color={activeTab === 'COMPROBANTES' ? '#fff' : '#009b3a'} />
          <Text style={[styles.tabText, activeTab === 'COMPROBANTES' && { color: '#fff' }]}>Comprobantes Reservas</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'MEMBRESIAS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('MEMBRESIAS')}
        >
          <MaterialCommunityIcons name="card-account-details-star" size={18} color={activeTab === 'MEMBRESIAS' ? '#fff' : '#009b3a'} />
          <Text style={[styles.tabText, activeTab === 'MEMBRESIAS' && { color: '#fff' }]}>Comprobantes Membresías</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={true}>
        {activeTab === 'RECIBOS' ? (
          <>
            {pagos.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="cash-remove" size={50} color="#94a3b8" />
                <Text style={styles.emptyText}>No hay recibos registrados.</Text>
              </View>
            ) : (
              pagos.map(pago => (
                <View key={pago.id} style={styles.pagoCard}>
                  <View style={styles.pagoInfo}>
                    <Text style={styles.pagoConcepto}>{pago.concepto}</Text>
                    <Text style={styles.pagoMeta}>{pago.fecha} • {pago.metodo}</Text>
                    <Text style={[styles.pagoEstado, { color: pago.estado === 'PAGADO' ? '#009b3a' : '#ffb300' }]}>
                      {pago.estado}
                    </Text>
                  </View>
                  
                  <View style={styles.pagoAction}>
                    <Text style={styles.pagoMonto}>${pago.monto}</Text>
                    
                    <TouchableOpacity 
                      style={styles.printButton}
                      onPress={async () => {
                        // Descargar el PDF del recibo usando expo-sharing o Linking si es web
                        const reciboUrl = `http://localhost:5031/api/Recibo/GenerarPdf/${pago.id}`; // O la URL de tu backend
                        if (Platform.OS === 'web') {
                          window.open(reciboUrl, '_blank');
                        } else {
                          // TODO: Usar expo-file-system para descargar y compartir si es en móvil
                          Alert.alert('Recibo', 'La URL del recibo es: ' + reciboUrl);
                        }
                      }}
                    >
                      <MaterialCommunityIcons name="file-pdf-box" size={26} color="#009b3a" />
                      <Text style={styles.printLabel}>RECIBO PDF</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            {comprobantesReservas.length > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{comprobantesReservas.length} comprobantes</Text>
                <TouchableOpacity onPress={() => setSortDesc(!sortDesc)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#009b3a', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}>
                  <MaterialCommunityIcons name={sortDesc ? "sort-calendar-descending" : "sort-calendar-ascending"} size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 6 }}>
                    {sortDesc ? 'Más recientes' : 'Más antiguos'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {comprobantesReservas.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="file-document-outline" size={50} color="#94a3b8" />
                <Text style={styles.emptyText}>No hay comprobantes de reservas.</Text>
              </View>
            ) : (
              [...comprobantesReservas].sort((a, b) => {
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
                  <View style={styles.comprobanteBtns}>
                    <TouchableOpacity 
                      style={[styles.compBtn, { backgroundColor: '#009b3a' }]}
                      onPress={() => downloadPdf(comp)}
                    >
                      <MaterialCommunityIcons name="download" size={16} color="#fff" />
                      <Text style={styles.compBtnText}>Descargar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.compBtn, { backgroundColor: '#3b82f6' }]}
                      onPress={() => viewComprobante(comp)}
                    >
                      <MaterialCommunityIcons name="eye" size={16} color="#fff" />
                      <Text style={styles.compBtnText}>Ver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.compBtn, { backgroundColor: '#ffb300' }]}
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
            {comprobantesMembresias.length > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{comprobantesMembresias.length} comprobantes</Text>
                <TouchableOpacity onPress={() => setSortDesc(!sortDesc)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#009b3a', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}>
                  <MaterialCommunityIcons name={sortDesc ? "sort-calendar-descending" : "sort-calendar-ascending"} size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 6 }}>
                    {sortDesc ? 'Más recientes' : 'Más antiguos'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {comprobantesMembresias.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="file-document-outline" size={50} color="#94a3b8" />
                <Text style={styles.emptyText}>No hay comprobantes de membresías.</Text>
              </View>
            ) : (
              [...comprobantesMembresias].sort((a, b) => {
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
                        {new Date(comp.fecha?.endsWith('Z') ? comp.fecha : comp.fecha + 'Z').toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.comprobanteBtns}>
                    <TouchableOpacity 
                      style={[styles.compBtn, { backgroundColor: '#009b3a' }]}
                      onPress={() => downloadPdf(comp)}
                    >
                      <MaterialCommunityIcons name="download" size={16} color="#fff" />
                      <Text style={styles.compBtnText}>Descargar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.compBtn, { backgroundColor: '#3b82f6' }]}
                      onPress={() => viewComprobante(comp)}
                    >
                      <MaterialCommunityIcons name="eye" size={16} color="#fff" />
                      <Text style={styles.compBtnText}>Ver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.compBtn, { backgroundColor: '#ffb300' }]}
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
              <View style={styles.viewBrand}>
                <Text style={styles.viewBrandText}>GOL AHORA</Text>
                <Text style={styles.viewBrandSub}>COMPROBANTE DE RESERVA</Text>
              </View>
              <View style={styles.viewDivider} />

              {viewingComprobante && extractDataFromHtml(viewingComprobante.html).map((row, i) => (
                <View key={i} style={[styles.viewRow, row.isTotal && styles.viewRowTotal]}>
                  <Text style={[styles.viewLabel, row.isTotal && { fontWeight: '900', color: '#1e293b' }]}>{row.label}</Text>
                  <Text style={[styles.viewValue, row.isTotal && { fontSize: 20, color: '#009b3a' }]}>{row.value}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 15 },

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
  viewContainer: { width: '100%', maxWidth: 450, backgroundColor: '#fff', borderRadius: 24, padding: 25, maxHeight: '80%' },
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
