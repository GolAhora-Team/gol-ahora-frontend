import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import { facturaService } from '../services/facturaService';

export default function MisRecibosScreen({ route, navigation }) {
  const { role, idPersona } = route.params || {};
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortNewest, setSortNewest] = useState(true);

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
    return date.toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const sortedFacturas = [...facturas].sort((a, b) => {
    const dateA = new Date(a.fechaEmision);
    const dateB = new Date(b.fechaEmision);
    return sortNewest ? dateB - dateA : dateA - dateB;
  });

  const getConceptoIcon = (concepto) => {
    if (!concepto) return { icon: 'file-document', color: '#64748b' };
    const c = concepto.toLowerCase();
    if (c.includes('inscripción') || c.includes('competencia')) return { icon: 'trophy', color: '#eab308' };
    if (c.includes('membresía') || c.includes('socio')) return { icon: 'card-account-details', color: '#3b82f6' };
    if (c.includes('reserva')) return { icon: 'calendar-check', color: '#a855f7' };
    if (c.includes('clase')) return { icon: 'whistle', color: '#6366f1' };
    return { icon: 'receipt', color: '#ec4899' };
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
    if (Platform.OS === 'web') {
      const htmlContent = generateHtml(factura);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } else {
      Alert.alert('Info', 'Disponible en versión web.');
    }
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
            const { icon, color } = getConceptoIcon(factura.concepto);
            return (
              <View key={factura.id} style={[s.card, { borderColor: color + '50', borderLeftColor: color, borderLeftWidth: 6, backgroundColor: color + '05' }]}>
                <View style={s.cardLeft}>
                  <View style={[s.iconCircle, { backgroundColor: color + '20' }]}>
                    <MaterialCommunityIcons name={icon} size={22} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardConcepto, { color: color }]}>{factura.concepto || 'Pago'}</Text>
                    {factura.descripcion ? <Text style={s.cardDesc}>{factura.descripcion}</Text> : null}
                    <Text style={s.cardDate}>{formatDate(factura.fechaEmision)}</Text>
                  </View>
                </View>
                <View style={s.cardRight}>
                  <Text style={[s.cardTotal, { color: color }]}>${(factura.total || 0).toLocaleString('es-AR')}</Text>
                  <View style={s.cardActions}>
                    <TouchableOpacity style={[s.actionBtn, { borderColor: color + '40', backgroundColor: '#fff' }]} onPress={() => handleVer(factura)}>
                      <MaterialCommunityIcons name="eye" size={14} color={color} />
                      <Text style={[s.actionBtnText, { color: color }]}>Ver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.actionBtn, { borderColor: color + '40', backgroundColor: '#fff' }]} onPress={() => handleDescargar(factura)}>
                      <MaterialCommunityIcons name="download" size={14} color={color} />
                      <Text style={[s.actionBtnText, { color: color }]}>Descargar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.actionBtn, { borderColor: color + '40', backgroundColor: '#fff' }]} onPress={() => handleImprimir(factura)}>
                      <MaterialCommunityIcons name="printer" size={14} color={color} />
                      <Text style={[s.actionBtnText, { color: color }]}>Imprimir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 10 },
  iconCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  cardConcepto: { fontSize: 14, fontWeight: '900', color: '#1e293b' },
  cardDesc: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 },
  cardDate: { fontSize: 10, color: '#94a3b8', fontWeight: '700', marginTop: 3 },
  cardRight: { alignItems: 'flex-end' },
  cardTotal: { fontSize: 16, fontWeight: '900', color: '#009b3a', marginBottom: 8 },
  cardActions: { flexDirection: 'row', gap: 6, marginTop: 4 },
  actionBtn: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, gap: 4 },
  actionBtnText: { fontSize: 11, fontWeight: '700' },
});
