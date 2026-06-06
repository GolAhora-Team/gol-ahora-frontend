import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import { facturaService } from '../services/facturaService';

export default function MisRecibosScreen({ route, navigation }) {
  const { role, idPersona } = route.params || {};
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortNewest, setSortNewest] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [facturaToPreview, setFacturaToPreview] = useState(null);

  useEffect(() => {
    loadFacturas();
  }, []);

  const loadFacturas = async () => {
    setLoading(true);
    try {
      const data = await facturaService.getByClienteId(idPersona);
      setFacturas(data || []);
    } catch (error) {
      console.error('Error cargando facturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return 0;
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    } catch {
      return 0;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + '-03:00');
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return '-';
    }
  };

  const sortedFacturas = [...facturas].sort((a, b) => {
    const timeA = parseDate(a.fechaEmision);
    const timeB = parseDate(b.fechaEmision);
    return sortNewest ? (timeB - timeA) : (timeA - timeB);
  });

  // Module color mapping based on concepto - matches Dashboard ALL_MODULES colors
  const getConceptoTheme = (concepto) => {
    if (!concepto) return { icon: 'receipt', color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', label: 'Pago' };
    const c = concepto.toLowerCase();
    if (c.includes('inscripción') || c.includes('inscripc') || c.includes('competencia') || c.includes('torneo') || c.includes('liga')) {
      return { icon: 'trophy-variant', color: '#eab308', bg: '#fefce8', border: '#fde68a', label: 'Competencias' };
    }
    if (c.includes('membresía') || c.includes('membresia') || c.includes('socio')) {
      return { icon: 'card-account-details', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', label: 'Membresía' };
    }
    if (c.includes('reserva') || c.includes('cancha') || c.includes('turno')) {
      return { icon: 'calendar-clock', color: '#a855f7', bg: '#faf5ff', border: '#e9d5ff', label: 'Reservas' };
    }
    if (c.includes('clase') || c.includes('entrenamiento') || c.includes('inscripcion')) {
      return { icon: 'whistle', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', label: 'Clases' };
    }
    if (c.includes('factura') || c.includes('cobro') || c.includes('caja')) {
      return { icon: 'cash-register', color: '#06b6d4', bg: '#ecfeff', border: '#a5f3fc', label: 'Facturación' };
    }
    return { icon: 'receipt', color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', label: 'Pago' };
  };

  const generateHtml = (factura) => {
    return `
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 40px; background: #f8fafc; }
          .container { max-width: 600px; margin: auto; background: #fff; border-radius: 20px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border-top: 8px solid #009b3a; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
          .header h1 { color: #009b3a; font-size: 28px; margin: 0; }
          .header p { color: #64748b; margin-top: 5px; font-weight: 600; }
          .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #e2e8f0; }
          .label { color: #64748b; font-weight: 600; }
          .value { color: #1e293b; font-weight: 800; }
          .total { font-size: 24px; color: #009b3a; text-align: center; margin-top: 20px; font-weight: 900; background: #f0fdf4; padding: 15px; border-radius: 12px; }
          .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>GOL AHORA</h1>
            <p>Comprobante de Pago</p>
          </div>
          <div class="row"><span class="label">N° Factura</span><span class="value">#${factura.id}</span></div>
          <div class="row"><span class="label">Fecha</span><span class="value">${formatDate(factura.fechaEmision)}</span></div>
          <div class="row"><span class="label">Concepto</span><span class="value">${factura.concepto || 'General'}</span></div>
          <div class="row"><span class="label">Descripción</span><span class="value">${factura.descripcion || '-'}</span></div>
          <div class="total">Total: $${(factura.total || 0).toLocaleString('es-AR')}</div>
          <div class="footer">
            <p>Este comprobante fue generado electrónicamente por Gol Ahora.</p>
            <p>Fecha de generación: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleVer = (factura) => {
    setFacturaToPreview(factura);
    setPreviewVisible(true);
  };

  const handleDescargar = async (factura) => {
    if (Platform.OS === 'web') {
      try {
        const html2pdf = (await import('html2pdf.js')).default;
        const htmlContent = generateHtml(factura);
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        const opt = {
          margin: 0,
          filename: `Factura_${factura.id}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
      } catch (e) {
        console.error('Error al descargar PDF:', e);
      }
    } else {
      Alert.alert('Info', 'Disponible en versión web.');
    }
  };

  const handleImprimir = (factura) => {
    if (Platform.OS === 'web') {
      const htmlContent = generateHtml(factura);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } else {
      Alert.alert('Info', 'Disponible en versión web.');
    }
  };

  if (loading) {
    return (
      <ScreenTemplate userRole={role} navigation={navigation}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#009b3a" />
          <Text style={{ color: '#94a3b8', marginTop: 10, fontWeight: '700' }}>Cargando recibos...</Text>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate userRole={role} navigation={navigation}>
      <View style={s.headerRow}>
        <View>
          <Text style={s.mainTitle}>Mis Recibos</Text>
          <Text style={s.subtitle}>{facturas.length} comprobante{facturas.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={s.sortBtn} onPress={() => setSortNewest(!sortNewest)}>
          <MaterialCommunityIcons name={sortNewest ? "sort-calendar-descending" : "sort-calendar-ascending"} size={20} color="#fff" />
          <Text style={s.sortBtnText}>{sortNewest ? 'Más reciente' : 'Más antiguo'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 100 }}>
        {sortedFacturas.length === 0 ? (
          <View style={s.emptyState}>
            <MaterialCommunityIcons name="receipt" size={60} color="#475569" />
            <Text style={s.emptyTitle}>Sin recibos</Text>
            <Text style={s.emptyDesc}>Todavía no tenés comprobantes de pago.</Text>
          </View>
        ) : (
          sortedFacturas.map(factura => {
            const theme = getConceptoTheme(factura.concepto);
            return (
              <View key={factura.id} style={[s.card, { backgroundColor: theme.bg, borderColor: theme.border, borderLeftColor: theme.color, borderLeftWidth: 5 }]}>
                <View style={s.cardTop}>
                  <View style={s.cardLeft}>
                    <View style={[s.iconCircle, { backgroundColor: theme.color + '25' }]}>
                      <MaterialCommunityIcons name={theme.icon} size={22} color={theme.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.cardConcepto, { color: theme.color }]}>{factura.concepto || 'Pago'}</Text>
                      {factura.descripcion ? <Text style={s.cardDesc} numberOfLines={2}>{factura.descripcion}</Text> : null}
                    </View>
                  </View>
                  <View style={s.cardRight}>
                    <Text style={[s.cardTotal, { color: theme.color }]}>${(factura.total || 0).toLocaleString('es-AR')}</Text>
                  </View>
                </View>
                <View style={s.cardBottom}>
                  <View style={[s.moduleBadge, { backgroundColor: theme.color + '18' }]}>
                    <MaterialCommunityIcons name={theme.icon} size={12} color={theme.color} />
                    <Text style={[s.moduleBadgeText, { color: theme.color }]}>{theme.label}</Text>
                  </View>
                  <Text style={s.cardDate}>{formatDate(factura.fechaEmision)}</Text>
                  <View style={s.cardActions}>
                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#fff', borderColor: theme.color + '40' }]} onPress={() => handleVer(factura)}>
                      <MaterialCommunityIcons name="eye" size={14} color={theme.color} />
                      <Text style={[s.actionBtnText, { color: theme.color }]}>Ver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#fff', borderColor: '#10b981' + '40' }]} onPress={() => handleDescargar(factura)}>
                      <MaterialCommunityIcons name="download" size={14} color="#10b981" />
                      <Text style={[s.actionBtnText, { color: '#10b981' }]}>PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#fff', borderColor: '#f59e0b' + '40' }]} onPress={() => handleImprimir(factura)}>
                      <MaterialCommunityIcons name="printer" size={14} color="#f59e0b" />
                      <Text style={[s.actionBtnText, { color: '#f59e0b' }]}>Imprimir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* MODAL DE VISTA PREVIA */}
      <Modal visible={previewVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Vista Previa</Text>
              <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            {facturaToPreview && (
              <ScrollView style={s.receiptPreview} showsVerticalScrollIndicator={false}>
                <View style={s.receiptHeader}>
                  <Text style={s.receiptLogo}>GOL AHORA</Text>
                  <Text style={s.receiptSub}>Comprobante de Pago</Text>
                </View>
                
                <View style={s.receiptRow}>
                  <Text style={s.receiptLabel}>N° Factura</Text>
                  <Text style={s.receiptValue}>#{facturaToPreview.id}</Text>
                </View>
                <View style={s.receiptRow}>
                  <Text style={s.receiptLabel}>Fecha</Text>
                  <Text style={s.receiptValue}>{formatDate(facturaToPreview.fechaEmision)}</Text>
                </View>
                <View style={s.receiptRow}>
                  <Text style={s.receiptLabel}>Concepto</Text>
                  <Text style={s.receiptValue}>{facturaToPreview.concepto || 'General'}</Text>
                </View>
                <View style={s.receiptRow}>
                  <Text style={s.receiptLabel}>Descripción</Text>
                  <Text style={s.receiptValue}>{facturaToPreview.descripcion || '-'}</Text>
                </View>
                
                <View style={s.receiptTotalContainer}>
                  <Text style={s.receiptTotalLabel}>Total:</Text>
                  <Text style={s.receiptTotalValue}>${(facturaToPreview.total || 0).toLocaleString('es-AR')}</Text>
                </View>
                
                <View style={s.receiptFooter}>
                  <Text style={s.receiptFooterText}>Este comprobante fue generado electrónicamente por Gol Ahora.</Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScreenTemplate>
  );
}

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  mainTitle: { fontSize: 24, fontWeight: '900', color: '#fff' },
  subtitle: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginTop: 2 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  sortBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#94a3b8', marginTop: 12 },
  emptyDesc: { fontSize: 13, color: '#64748b', marginTop: 4 },
  card: { borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1.5 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 10 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  cardConcepto: { fontSize: 14, fontWeight: '900' },
  cardDesc: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardTotal: { fontSize: 18, fontWeight: '900' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', flexWrap: 'wrap', gap: 8 },
  moduleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  moduleBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardDate: { fontSize: 11, color: '#64748b', fontWeight: '700', flex: 1 },
  cardActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, gap: 4 },
  actionBtnText: { fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxWidth: 450, backgroundColor: '#f8fafc', borderRadius: 20, overflow: 'hidden', maxHeight: '90%', elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  receiptPreview: { padding: 30, backgroundColor: '#fff', margin: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  receiptHeader: { alignItems: 'center', marginBottom: 25, borderBottomWidth: 2, borderBottomColor: '#009b3a', paddingBottom: 15 },
  receiptLogo: { fontSize: 24, fontWeight: '900', color: '#009b3a' },
  receiptSub: { fontSize: 12, color: '#64748b', fontWeight: '700', marginTop: 4 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', borderStyle: 'dashed' },
  receiptLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  receiptValue: { fontSize: 14, color: '#1e293b', fontWeight: '800', maxWidth: '60%', textAlign: 'right' },
  receiptTotalContainer: { backgroundColor: '#f0fdf4', padding: 18, borderRadius: 12, marginTop: 25, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  receiptTotalLabel: { fontSize: 18, color: '#15803d', fontWeight: '700' },
  receiptTotalValue: { fontSize: 22, color: '#009b3a', fontWeight: '900' },
  receiptFooter: { marginTop: 25, alignItems: 'center' },
  receiptFooterText: { fontSize: 10, color: '#94a3b8', textAlign: 'center' }
});

