import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Platform, Modal, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import ScreenTemplate from './ScreenTemplate';
import { getEstadisticas } from '../components/DataReportes';
import { reportHistoryService } from '../services/reportHistoryService';

export default function ReportesScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  const { role: currentUserRole } = route.params || { role: "ADMIN" };
  const [reporteActivo, setReporteActivo] = useState("Ingresos"); 
  const [historialCanchas, setHistorialCanchas] = useState([]);
  const [historialUsuarios, setHistorialUsuarios] = useState([]);
  const [ordenFecha, setOrdenFecha] = useState('desc');
  const [modalVerVisible, setModalVerVisible] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const estadisticas = getEstadisticas();
  const dataActual = estadisticas[reporteActivo];

  React.useEffect(() => {
    if (reporteActivo === 'Canchas' || reporteActivo === 'Usuarios') {
      reportHistoryService.getReportes().then(reports => {
        const canchasFiltered = (reports || []).filter(r => r.fileName && r.fileName.includes("Canchas"));
        const usuariosFiltered = (reports || []).filter(r => r.fileName && r.fileName.includes("Usuario"));
        setHistorialCanchas(canchasFiltered);
        setHistorialUsuarios(usuariosFiltered);
      });
    }
  }, [reporteActivo]);

  const downloadPdf = async (pdfData) => {
    if (Platform.OS === 'web') {
      const html2pdf = require('html2pdf.js');
      const element = document.createElement('div');
      element.innerHTML = pdfData.html;
      html2pdf().from(element).set({
        margin: 10,
        filename: (pdfData.fileName || 'Reporte') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save();
    } else {
      const { uri } = await Print.printToFileAsync({ html: pdfData.html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    }
  };

  const printHtml = async (htmlContent) => {
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } else {
      await Print.printAsync({ html: htmlContent });
    }
  };

  const viewHtml = async (htmlContent) => {
    if (Platform.OS === 'web') {
      const viewWindow = window.open('', '_blank');
      viewWindow.document.write(htmlContent);
      viewWindow.document.close();
      viewWindow.focus();
    } else {
      await Print.printAsync({ html: htmlContent });
    }
  };

  const handleExportExcel = async () => {
    const dias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    let csvContent = `Reporte: ${reporteActivo}\nTotal: ${dataActual.total}\nDetalle: ${dataActual.detalle}\n\nDia,Valor\n`;
    dataActual.datosSemanales.forEach((v, i) => { csvContent += `${dias[i]},${v}\n` });

    if (Platform.OS === 'web') {
      const element = document.createElement("a");
      const file = new Blob([csvContent], { type: 'text/csv' });
      element.href = URL.createObjectURL(file);
      element.download = `Gol_Ahora_${reporteActivo}.csv`;
      element.click();
    } else {
      const path = `${FileSystem.documentDirectory}reporte_${reporteActivo}.csv`;
      await FileSystem.writeAsStringAsync(path, csvContent);
      await Sharing.shareAsync(path);
    }
  };

  const handlePrint = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #000; }
            .header { text-align: center; margin-bottom: 30px; }
            .brand { color: #009b3a; font-size: 50px; font-weight: 900; margin: 0; }
            .subtitle { font-size: 14px; font-weight: bold; margin-top: 5px; }
            .line { border-bottom: 2px solid #000; margin: 20px 0; }
            .content { margin-top: 20px; font-size: 18px; line-height: 1.6; }
            .report-name { font-size: 22px; text-decoration: underline; margin-bottom: 10px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #444; border-top: 1px solid #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="brand">GOL AHORA</h1>
            <div class="subtitle">SISTEMA DE GESTIÓN DEPORTIVA</div>
          </div>
          <div class="line"></div>
          <div class="content">
            <div class="report-name">REPORTE DE ${reporteActivo.toUpperCase()}</div>
            <p><b>VALOR TOTAL:</b> ${dataActual.total}</p>
            <p><b>PERIODO:</b> ${dataActual.detalle}</p>
            <p><b>DESCRIPCIÓN:</b> ${dataActual.descripcion}</p>
          </div>
          <div class="footer">
            Generado por ${currentUserRole} - ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;

    try {
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert("Error", "No se pudo iniciar la impresión.");
    }
  };

  const sortedHistorialCanchas = [...historialCanchas].sort((a, b) => {
    const dateA = new Date(a.fecha.endsWith('Z') ? a.fecha : a.fecha + 'Z').getTime();
    const dateB = new Date(b.fecha.endsWith('Z') ? b.fecha : b.fecha + 'Z').getTime();
    return ordenFecha === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const sortedHistorialUsuarios = [...historialUsuarios].sort((a, b) => {
    const dateA = new Date(a.fecha.endsWith('Z') ? a.fecha : a.fecha + 'Z').getTime();
    const dateB = new Date(b.fecha.endsWith('Z') ? b.fecha : b.fecha + 'Z').getTime();
    return ordenFecha === 'asc' ? dateA - dateB : dateB - dateA;
  });

  return (
    <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
      <Text style={styles.title}>Panel de Reportes</Text>

      <View style={[styles.selectorGrid, isMobile && styles.selectorGridMobile]}>
        {Object.keys(estadisticas).map((key) => (
          <TouchableOpacity 
            key={key}
            style={[styles.selBtn, isMobile && styles.selBtnMobile, reporteActivo === key && { backgroundColor: estadisticas[key].color }]} 
            onPress={() => setReporteActivo(key)}
          >
            <MaterialCommunityIcons 
              name={estadisticas[key].icon} 
              size={24} 
              color={reporteActivo === key ? "#fff" : estadisticas[key].color} 
            />
            <Text style={[styles.selText, reporteActivo === key && { color: "#fff" }]}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.mainVisualArea}>
        {reporteActivo === 'Canchas' || reporteActivo === 'Usuarios' ? (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={styles.kpiCard}>
              <MaterialCommunityIcons name={dataActual.icon} size={32} color={dataActual.color} />
              <View style={{ marginLeft: 15 }}>
                <Text style={styles.kpiLabel}>{reporteActivo.toUpperCase()}</Text>
                <Text style={styles.kpiValue}>{reporteActivo === 'Canchas' ? historialCanchas.length : historialUsuarios.length} Reportes</Text>
                <Text style={styles.kpiSub}>{dataActual.detalle}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15 }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, elevation: 2 }}
                onPress={() => setOrdenFecha(prev => prev === 'desc' ? 'asc' : 'desc')}
              >
                <Text style={{ color: '#1e293b', fontSize: 12, fontWeight: '800', marginRight: 5 }}>Ordenar por fecha</Text>
                <MaterialCommunityIcons name={ordenFecha === 'asc' ? "arrow-up" : "arrow-down"} size={16} color="#1e293b" />
              </TouchableOpacity>
            </View>

            {reporteActivo === 'Canchas' ? (
              sortedHistorialCanchas.map(rep => (
                <View key={rep.id} style={[styles.historyCard, isMobile && styles.historyCardMobile]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginBottom: isMobile ? 12 : 0 }}>
                    <MaterialCommunityIcons name="file-pdf-box" size={isMobile ? 24 : 30} color="#ef4444" />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={{ fontWeight: '800', color: '#1e293b', fontSize: isMobile ? 13 : 15 }}>{rep.fileName || 'Reporte de Estado'}</Text>
                      <Text style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(rep.fecha.endsWith('Z') ? rep.fecha : rep.fecha + 'Z').toLocaleString()}</Text>
                    </View>
                  </View>
                  <View style={[styles.historyActionRow, isMobile && { width: '100%', justifyContent: 'flex-end' }]}>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#3b82f6' }, isMobile && { flex: 1 }]}
                      onPress={() => { setReporteSeleccionado(rep); setModalVerVisible(true); }}
                    >
                      <MaterialCommunityIcons name="eye" size={18} color="#fff" />
                      {!isMobile && <Text style={styles.actionButtonText}>Ver</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#009b3a' }, isMobile && { flex: 1 }]}
                      onPress={() => downloadPdf(rep)}
                    >
                      <MaterialCommunityIcons name="download" size={18} color="#fff" />
                      {!isMobile && <Text style={styles.actionButtonText}>Descargar</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#ffb300' }, isMobile && { flex: 1 }]}
                      onPress={() => printHtml(rep.html)}
                    >
                      <MaterialCommunityIcons name="printer" size={18} color="#000" />
                      {!isMobile && <Text style={[styles.actionButtonText, { color: '#000' }]}>Imprimir</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              sortedHistorialUsuarios.map(rep => (
                <View key={rep.id} style={[styles.historyCard, isMobile && styles.historyCardMobile]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginBottom: isMobile ? 12 : 0 }}>
                    <MaterialCommunityIcons name="file-pdf-box" size={isMobile ? 24 : 30} color="#ef4444" />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={{ fontWeight: '800', color: '#1e293b', fontSize: isMobile ? 13 : 15 }}>{rep.fileName || 'Reporte de Usuario'}</Text>
                      <Text style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(rep.fecha.endsWith('Z') ? rep.fecha : rep.fecha + 'Z').toLocaleString()}</Text>
                    </View>
                  </View>
                  <View style={[styles.historyActionRow, isMobile && { width: '100%', justifyContent: 'flex-end' }]}>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#3b82f6' }, isMobile && { flex: 1 }]}
                      onPress={() => { setReporteSeleccionado(rep); setModalVerVisible(true); }}
                    >
                      <MaterialCommunityIcons name="eye" size={18} color="#fff" />
                      {!isMobile && <Text style={styles.actionButtonText}>Ver</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#009b3a' }, isMobile && { flex: 1 }]}
                      onPress={() => downloadPdf(rep)}
                    >
                      <MaterialCommunityIcons name="download" size={18} color="#fff" />
                      {!isMobile && <Text style={styles.actionButtonText}>Descargar</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#ffb300' }, isMobile && { flex: 1 }]}
                      onPress={() => printHtml(rep.html)}
                    >
                      <MaterialCommunityIcons name="printer" size={18} color="#000" />
                      {!isMobile && <Text style={[styles.actionButtonText, { color: '#000' }]}>Imprimir</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={styles.kpiCard}>
              <MaterialCommunityIcons name={dataActual.icon} size={32} color={dataActual.color} />
              <View style={{ marginLeft: 15 }}>
                <Text style={styles.kpiLabel}>{reporteActivo.toUpperCase()}</Text>
                <Text style={styles.kpiValue}>{dataActual.total}</Text>
                <Text style={styles.kpiSub}>{dataActual.detalle}</Text>
              </View>
            </View>

            <Text style={styles.chartTitle}>Flujo Semanal</Text>
            <View style={styles.barChart}>
              {dataActual.datosSemanales.map((val, i) => (
                <View key={i} style={styles.barWrapper}>
                  <View style={[styles.bar, { height: val, backgroundColor: dataActual.color }]} />
                  <Text style={styles.barDay}>{['L','M','M','J','V','S','D'][i]}</Text>
                </View>
              ))}
            </View>
            
            <Text style={styles.description}>{dataActual.descripcion}</Text>
            <View style={{ height: 100 }} /> 
          </ScrollView>
        )}

        {reporteActivo !== 'Canchas' && reporteActivo !== 'Usuarios' && (
          <View style={styles.recuadroRojoAcciones}>
            <TouchableOpacity 
              style={[styles.btnFlotante, { backgroundColor: '#ffb300' }]} 
              onPress={handlePrint}
            >
              <MaterialCommunityIcons name="printer" size={24} color="#000" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btnFlotante, { backgroundColor: '#ffb300' }]} 
              onPress={handleExportExcel}
            >
              <MaterialCommunityIcons name="microsoft-excel" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={modalVerVisible} animationType="fade" transparent={true}>
        <View style={styles.viewOverlay}>
          <View style={styles.viewContainer}>
            <View style={styles.viewHeader}>
              <Text style={styles.viewTitle}>Vista de Reporte</Text>
              <TouchableOpacity onPress={() => setModalVerVisible(false)}>
                <MaterialCommunityIcons name="close-circle" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, marginTop: 10, backgroundColor: '#f8fafc', borderRadius: 8, overflow: 'hidden' }}>
              {Platform.OS === 'web' && reporteSeleccionado?.html ? (
                <iframe 
                  srcDoc={reporteSeleccionado.html} 
                  style={{ width: '100%', height: '100%', border: 'none' }} 
                  title="Reporte PDF"
                />
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 15 }}>
                  <Text style={{ textAlign: 'center', color: '#64748b', fontSize: 16, marginTop: 20 }}>
                    La previsualización está optimizada para Web. Utilice "Imprimir" para visualizar el documento en el visor nativo del dispositivo.
                  </Text>
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 20 },
  selectorGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 8 },
  selectorGridMobile: { flexWrap: 'wrap', justifyContent: 'center' },
  selBtn: { backgroundColor: '#fff', flex: 1, padding: 12, borderRadius: 15, alignItems: 'center', elevation: 3 },
  selBtnMobile: { flexBasis: '47%', marginBottom: 8, flex: 0 },
  selText: { fontSize: 10, fontWeight: '800', color: '#1e293b', marginTop: 5 },
  mainVisualArea: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 25, padding: 20, position: 'relative', overflow: 'hidden' },
  kpiCard: { backgroundColor: '#fff', flexDirection: 'row', padding: 15, borderRadius: 18, alignItems: 'center', marginBottom: 20 },
  kpiLabel: { fontSize: 10, fontWeight: '900', color: '#64748b' },
  kpiValue: { fontSize: 24, fontWeight: '900', color: '#1e293b' },
  kpiSub: { fontSize: 11, color: '#009b3a', fontWeight: '700' },
  chartTitle: { color: '#fff', fontWeight: '800', marginBottom: 15, fontSize: 14 },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, marginBottom: 10 },
  barWrapper: { alignItems: 'center' },
  bar: { width: 12, borderRadius: 6 },
  barDay: { color: '#94a3b8', fontSize: 10, marginTop: 8, fontWeight: '800' },
  description: { color: '#cbd5e1', fontSize: 12, marginTop: 20, fontStyle: 'italic', textAlign: 'center' },

  recuadroRojoAcciones: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    flexDirection: 'row',
    zIndex: 999,
  },
  btnFlotante: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 2,
    borderColor: '#000',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // View Modal
  viewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  viewContainer: { width: '100%', maxWidth: 800, height: '80%', backgroundColor: '#fff', borderRadius: 24, padding: 25 },
  viewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  viewTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  historyCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyCardMobile: { flexDirection: 'column', alignItems: 'flex-start' },
  historyActionRow: { flexDirection: 'row', gap: 10 },
  actionButton: { padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: '#fff', fontWeight: '800', marginLeft: 5, fontSize: 12 }
});