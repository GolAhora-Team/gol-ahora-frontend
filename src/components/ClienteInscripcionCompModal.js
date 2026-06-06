import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { equipoService } from '../services/equipoService';
import { mercadoPagoService } from '../services/mercadoPagoService';
import { facturaService } from '../services/facturaService';

export default function ClienteInscripcionCompModal({ visible, onClose, competencia, idPersona, idUsuario, onSuccess }) {
  const [step, setStep] = useState(1);
  const [equipos, setEquipos] = useState([]);
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const precio = 50000;

  useEffect(() => {
    if (visible && idPersona) {
      setStep(1);
      setSelectedEquipo(null);
      loadMisEquipos();
    }
  }, [visible]);

  const loadMisEquipos = async () => {
    setLoading(true);
    try {
      const data = await equipoService.getByClienteId(idPersona);
      // Solo equipos que NO están ya inscritos en una competencia
      const disponibles = (data || []).filter(e => !e.competicionId);
      setEquipos(disponibles);
    } catch (e) {
      console.error('Error cargando equipos:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!selectedEquipo) {
        Alert.alert('Atención', 'Seleccioná un equipo para inscribir.');
        return;
      }
      setStep(2);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      // Inscribir equipo a competencia (update equipo con competicionId)
      await equipoService.update(selectedEquipo.id, {
        ...selectedEquipo,
        competicionId: parseInt(competencia.id)
      });

      // Crear factura
      try {
        await facturaService.create({
          clienteId: idPersona,
          total: precio,
          concepto: 'Inscripción a torneo',
          descripcion: `Inscripción equipo "${selectedEquipo.nombre}" al torneo ${competencia.nombre}`,
          fechaEmision: new Date().toISOString()
        });
      } catch (factErr) {
        console.log('Factura creation error (non-blocking):', factErr);
      }

      // Intentar pago con MercadoPago
      try {
        const mpTitle = `Inscripción ${selectedEquipo.nombre} - ${competencia.nombre}`;
        if (Platform.OS === 'web') {
          const baseUrl = window.location.href.split('?')[0];
          const currentUrl = baseUrl + '?mp_return=true';
          const mpResponse = await mercadoPagoService.createPreference(mpTitle, precio, currentUrl);
          if (mpResponse?.initPoint) {
            window.location.href = mpResponse.initPoint;
            return;
          }
        }
      } catch (mpError) {
        console.log('MP redirect error (non-blocking):', mpError);
      }

      Alert.alert('¡Éxito!', `Tu equipo "${selectedEquipo.nombre}" fue inscrito en "${competencia.nombre}" correctamente.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Error', error?.mensaje || error?.message || 'No se pudo completar la inscripción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={s.overlay}>
        <View style={s.container}>
          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.headerTitle}>INSCRIBIR MI EQUIPO</Text>
              <Text style={s.headerSub}>{competencia?.nombre}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={28} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#009b3a" style={{ marginVertical: 40 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1 }}>
              {/* STEP 1: Seleccionar equipo */}
              {step === 1 && (
                <View>
                  <View style={s.infoCard}>
                    <View style={s.infoRow}>
                      <MaterialCommunityIcons name="trophy" size={20} color="#eab308" />
                      <Text style={s.infoLabel}>{competencia?.nombre}</Text>
                    </View>
                    <View style={s.infoRow}>
                      <MaterialCommunityIcons name="account-group" size={16} color="#64748b" />
                      <Text style={s.infoDetail}>Cupos: {competencia?.inscriptos || 0} / {competencia?.maxEquipos}</Text>
                    </View>
                    <View style={s.infoRow}>
                      <MaterialCommunityIcons name="cash" size={16} color="#16a34a" />
                      <Text style={[s.infoDetail, { color: '#16a34a', fontWeight: '900' }]}>${precio.toLocaleString('es-AR')}</Text>
                    </View>
                  </View>

                  <Text style={s.stepTitle}>Seleccioná tu equipo</Text>
                  
                  {equipos.length === 0 ? (
                    <View style={s.emptyCard}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={32} color="#94a3b8" />
                      <Text style={s.emptyText}>No tenés equipos disponibles para inscribir.</Text>
                      <Text style={s.emptyHint}>Creá un equipo primero desde la pestaña "Mis equipos".</Text>
                    </View>
                  ) : (
                    equipos.map(eq => {
                      const isSelected = selectedEquipo?.id === eq.id;
                      return (
                        <TouchableOpacity
                          key={eq.id}
                          style={[s.equipoItem, isSelected && s.equipoItemSelected]}
                          onPress={() => setSelectedEquipo(eq)}
                        >
                          <View style={[s.colorDot, { backgroundColor: eq.colorPrimario || '#009b3a' }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={[s.equipoName, isSelected && { color: '#fff' }]}>{eq.nombre}</Text>
                            {eq.descripcion ? <Text style={[s.equipoDesc, isSelected && { color: '#d1fae5' }]}>{eq.descripcion}</Text> : null}
                          </View>
                          {isSelected && <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}

              {/* STEP 2: Confirmación */}
              {step === 2 && (
                <View>
                  <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <MaterialCommunityIcons name="help-circle-outline" size={55} color="#ffb300" />
                    <Text style={s.confirmTitle}>¿Estás seguro?</Text>
                  </View>

                  <View style={s.confirmCard}>
                    <View style={s.confirmRow}>
                      <Text style={s.confirmLabel}>Competencia</Text>
                      <Text style={s.confirmValue}>{competencia?.nombre}</Text>
                    </View>
                    <View style={s.confirmRow}>
                      <Text style={s.confirmLabel}>Equipo</Text>
                      <Text style={s.confirmValue}>{selectedEquipo?.nombre}</Text>
                    </View>
                    <View style={[s.confirmRow, { borderBottomWidth: 0 }]}>
                      <Text style={s.confirmLabel}>Monto</Text>
                      <Text style={[s.confirmValue, { color: '#009b3a', fontSize: 18 }]}>${precio.toLocaleString('es-AR')}</Text>
                    </View>
                  </View>

                  <View style={s.warningCard}>
                    <MaterialCommunityIcons name="information" size={20} color="#d97706" />
                    <Text style={s.warningText}>
                      Al confirmar, serás redirigido a Mercado Pago para completar el pago de la inscripción.
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {/* Footer */}
          {!loading && step === 1 && equipos.length > 0 && (
            <View style={s.footerBtns}>
              <View />
              <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
                <Text style={s.nextBtnText}>Siguiente</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {!loading && step === 2 && (
            <View style={s.footerBtns}>
              <TouchableOpacity style={s.backBtn} onPress={() => setStep(1)}>
                <MaterialCommunityIcons name="arrow-left" size={20} color="#64748b" />
                <Text style={s.backBtnText}>Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm} disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-bold" size={20} color="#fff" />
                    <Text style={s.confirmBtnText}>Continuar al pago</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 15 },
  container: { width: '100%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 28, padding: 22, maxHeight: '92%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  headerSub: { fontSize: 12, fontWeight: '700', color: '#eab308', marginTop: 2 },
  infoCard: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoLabel: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  infoDetail: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  stepTitle: { fontSize: 16, fontWeight: '900', color: '#1e293b', marginBottom: 12, marginTop: 5 },
  emptyCard: { alignItems: 'center', padding: 30, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyText: { fontSize: 14, fontWeight: '700', color: '#64748b', marginTop: 10, textAlign: 'center' },
  emptyHint: { fontSize: 12, color: '#94a3b8', marginTop: 5, textAlign: 'center' },
  equipoItem: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 10 },
  equipoItemSelected: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  colorDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#cbd5e1' },
  equipoName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  equipoDesc: { fontSize: 11, color: '#64748b', marginTop: 2 },
  confirmTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginTop: 12 },
  confirmCard: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  confirmLabel: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  confirmValue: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  warningCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', padding: 15, borderRadius: 14, gap: 10, borderWidth: 1, borderColor: '#fde68a' },
  warningText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#92400e' },
  footerBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  backBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 5 },
  backBtnText: { color: '#64748b', fontWeight: '800' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#009b3a', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, gap: 5 },
  nextBtnText: { color: '#fff', fontWeight: '900' },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#009b3a', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, gap: 5 },
  confirmBtnText: { color: '#fff', fontWeight: '900' },
});
