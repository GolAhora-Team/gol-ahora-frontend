import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import { http, API_BASE_URL } from '../services/apiConfig';
import { asistenciaService } from '../services/asistenciaService';
import { claseService } from '../services/claseService';

export default function ClasesProfeScreen({ route, navigation }) {
  const { role, idPersona, nombreUsuario } = route.params || { role: "PROFE", idPersona: null, nombreUsuario: "" };
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedClaseId, setExpandedClaseId] = useState(null);

  const [asistenciaModalVisible, setAsistenciaModalVisible] = useState(false);
  const [selectedClase, setSelectedClase] = useState(null);
  const [presentesIds, setPresentesIds] = useState([]);
  const [asistenciaDate, setAsistenciaDate] = useState(new Date().toISOString().split('T')[0]);
  const [loadingAsistencia, setLoadingAsistencia] = useState(false);

  useEffect(() => {
    fetchClases();
  }, []);

  const fetchClases = async () => {
    try {
      setLoading(true);
      const data = await http.get(`${API_BASE_URL}/Clase`);
      // Filtrar las clases por profesor usando el idPersona
      const misClases = data.filter(c => c.profesor && c.profesor.id === idPersona);
      setClases(misClases);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar tus clases.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedClaseId(expandedClaseId === id ? null : id);
  };

  const openAsistenciaModal = async (clase) => {
    setSelectedClase(clase);
    setAsistenciaModalVisible(true);
    setLoadingAsistencia(true);
    try {
      const result = await asistenciaService.getAsistenciasPorClaseYFecha(clase.id, asistenciaDate);
      if (result && result.length > 0) {
        const pre = result.filter(a => a.presente).map(a => a.clienteId);
        setPresentesIds(pre);
      } else {
        setPresentesIds([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAsistencia(false);
    }
  };

  const toggleAsistencia = (alumnoId) => {
    if (presentesIds.includes(alumnoId)) {
      setPresentesIds(presentesIds.filter(id => id !== alumnoId));
    } else {
      setPresentesIds([...presentesIds, alumnoId]);
    }
  };

  const saveAsistencia = async () => {
    if (!selectedClase) return;
    try {
      // Registrar manualmente la asistencia de cada presente
      const promises = presentesIds.map(clienteId =>
        asistenciaService.registrarManual(selectedClase.id, clienteId, true)
          .catch(() => null) // ignorar duplicados del mismo día
      );
      await Promise.all(promises);
      Alert.alert('Éxito', 'La asistencia fue registrada correctamente.');
      setAsistenciaModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Hubo un error al guardar la asistencia.');
    }
  };

  const handleDescargarPulsera = async (clase, alumno) => {
    try {
      const blob = await claseService.descargarPulsera(clase.id, alumno.id);
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Pulsera_${alumno.nombre}_${alumno.apellido}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        Alert.alert('Pulsera', 'Descarga disponible solo en la versión web.');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo generar la pulsera.');
    }
  };

  return (
    <ScreenTemplate userRole={role} navigation={navigation}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.mainTitle}>Mis Clases a Cargo</Text>
          {nombreUsuario ? (
            <Text style={{ color: '#ffb300', fontSize: 16, fontWeight: '800', marginTop: 4 }}>
              Profesor: {nombreUsuario}
            </Text>
          ) : null}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#009b3a" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1 }}>
          {clases.length === 0 ? (
            <Text style={styles.emptyText}>No tienes clases asignadas.</Text>
          ) : (
            clases.map(clase => {
              const isExpanded = expandedClaseId === clase.id;
              const alumnos = clase.alumnos || [];

              return (
                <View key={clase.id} style={styles.card}>
                  <TouchableOpacity 
                    style={styles.cardHeader} 
                    onPress={() => toggleExpand(clase.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.infoSide}>
                      <Text style={styles.claseTitle}>{clase.nombre}</Text>
                      <View style={styles.specRow}>
                        <MaterialCommunityIcons name="calendar" size={16} color="#64748b" />
                        <Text style={styles.specText}>
                          {new Date(clase.fecha).toLocaleDateString()}
                        </Text>
                        <MaterialCommunityIcons name="clock-outline" size={16} color="#64748b" style={{marginLeft: 10}} />
                        <Text style={styles.specText}>
                          {clase.horaInicio} - {clase.horaFin}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.actionSide}>
                      <View style={styles.alumnosBadge}>
                        <MaterialCommunityIcons name="account-group" size={16} color="#fff" />
                        <Text style={styles.alumnosBadgeText}>{alumnos.length}/{clase.capacidadMax}</Text>
                      </View>
                      <MaterialCommunityIcons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={28} 
                        color="#94a3b8" 
                      />
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 12 }}>
                        <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Alumnos Inscriptos</Text>
                        <TouchableOpacity style={styles.takeAsistenciaBtn} onPress={() => openAsistenciaModal(clase)}>
                          <MaterialCommunityIcons name="clipboard-check-outline" size={18} color="#fff" />
                          <Text style={styles.takeAsistenciaBtnText}>TOMAR ASISTENCIA</Text>
                        </TouchableOpacity>
                      </View>
                      
                      {alumnos.length === 0 ? (
                        <Text style={styles.emptyAlumnosText}>Aún no hay alumnos inscriptos.</Text>
                      ) : (
                        alumnos.map((alumno, index) => (
                          <View key={alumno.id || index} style={styles.alumnoRow}>
                            <MaterialCommunityIcons name="account" size={20} color="#009b3a" />
                            <Text style={[styles.alumnoName, { flex: 1 }]}>{alumno.nombre} {alumno.apellido}</Text>
                            <TouchableOpacity
                              style={styles.pulseraSmallBtn}
                              onPress={() => handleDescargarPulsera(clase, alumno)}
                            >
                              <MaterialCommunityIcons name="download" size={14} color="#6366f1" />
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <Modal visible={asistenciaModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Asistencia - {selectedClase?.nombre}</Text>
              <TouchableOpacity onPress={() => setAsistenciaModalVisible(false)}>
                <MaterialCommunityIcons name="close-circle" size={32} color="#009b3a" />
              </TouchableOpacity>
            </View>
            <Text style={styles.dateSubtitle}>Fecha: {asistenciaDate}</Text>

            {loadingAsistencia ? (
              <ActivityIndicator size="large" color="#009b3a" style={{ marginVertical: 30 }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={true} style={{ maxHeight: 400 }}>
                {selectedClase?.alumnos && selectedClase.alumnos.length > 0 ? (
                  selectedClase.alumnos.map(alumno => {
                    const isPresente = presentesIds.includes(alumno.id);
                    return (
                      <TouchableOpacity 
                        key={alumno.id} 
                        style={styles.asistenciaRow} 
                        onPress={() => toggleAsistencia(alumno.id)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialCommunityIcons name="account" size={24} color="#64748b" />
                          <Text style={styles.alumnoNameModal}>{alumno.nombre} {alumno.apellido}</Text>
                        </View>
                        <MaterialCommunityIcons 
                          name={isPresente ? "checkbox-marked" : "checkbox-blank-outline"} 
                          size={28} 
                          color={isPresente ? "#009b3a" : "#94a3b8"} 
                        />
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.emptyAlumnosText}>No hay alumnos inscriptos en esta clase.</Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={saveAsistencia}>
              <Text style={styles.saveBtnText}>GUARDAR ASISTENCIA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mainTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  emptyText: { color: '#fff', textAlign: 'center', marginTop: 20, fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 16, overflow: 'hidden', elevation: 3 },
  cardHeader: { flexDirection: 'row', padding: 18, alignItems: 'center', justifyContent: 'space-between' },
  infoSide: { flex: 1 },
  claseTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 6 },
  specRow: { flexDirection: 'row', alignItems: 'center' },
  specText: { color: '#64748b', fontSize: 14, marginLeft: 4, fontWeight: '600' },
  actionSide: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alumnosBadge: { flexDirection: 'row', backgroundColor: '#6366f1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignItems: 'center', gap: 4 },
  alumnosBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  expandedContent: { padding: 18, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#475569', marginBottom: 12, marginTop: 12 },
  emptyAlumnosText: { color: '#94a3b8', fontStyle: 'italic', fontSize: 14 },
  alumnoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  alumnoName: { fontSize: 15, color: '#1e293b', marginLeft: 10, fontWeight: '500' },
  pulseraSmallBtn: { backgroundColor: '#ede9fe', width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  takeAsistenciaBtn: { backgroundColor: '#009b3a', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  takeAsistenciaBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginLeft: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxWidth: 500, backgroundColor: '#fff', borderRadius: 24, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  modalHeaderTitle: { fontSize: 20, fontWeight: '900', color: '#009b3a' },
  dateSubtitle: { fontSize: 14, color: '#64748b', fontWeight: '600', marginBottom: 20 },
  asistenciaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  alumnoNameModal: { fontSize: 16, color: '#1e293b', fontWeight: '600', marginLeft: 12 },
  saveBtn: { backgroundColor: '#009b3a', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 25 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
