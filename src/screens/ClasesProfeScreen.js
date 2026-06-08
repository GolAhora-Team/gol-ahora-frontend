import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import AsistenciaModal from '../components/AsistenciaModal';
import { http, API_BASE_URL } from '../services/apiConfig';
import { asistenciaService } from '../services/asistenciaService';
import { claseService } from '../services/claseService';

export default function ClasesProfeScreen({ route, navigation }) {
  const { role, idPersona, nombreUsuario } = route.params || { role: "PROFE", idPersona: null, nombreUsuario: "" };
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedClaseId, setExpandedClaseId] = useState(null);

  // Mapa de asistencias por clase: { [claseId]: [{ clienteId, presente }] }
  const [asistenciasMap, setAsistenciasMap] = useState({});
  const [loadingAsistenciaMap, setLoadingAsistenciaMap] = useState({});

  const [asistenciaModalVisible, setAsistenciaModalVisible] = useState(false);
  const [selectedClase, setSelectedClase] = useState(null);

  useEffect(() => {
    fetchClases();
  }, []);

  const fetchClases = async () => {
    try {
      setLoading(true);
      const data = await http.get(`${API_BASE_URL}/Clase`);
      const misClases = data.filter(c => c.profesor && c.profesor.id === idPersona);
      setClases(misClases);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar tus clases.');
    } finally {
      setLoading(false);
    }
  };

  const loadAsistenciaParaClase = async (claseId) => {
    if (asistenciasMap[claseId] !== undefined) return; // ya cargado
    setLoadingAsistenciaMap(prev => ({ ...prev, [claseId]: true }));
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const result = await asistenciaService.getAsistenciasPorActividadYFecha(claseId, hoy, true);
      setAsistenciasMap(prev => ({ ...prev, [claseId]: result || [] }));
    } catch (e) {
      setAsistenciasMap(prev => ({ ...prev, [claseId]: [] }));
    } finally {
      setLoadingAsistenciaMap(prev => ({ ...prev, [claseId]: false }));
    }
  };

  const toggleExpand = (id) => {
    const newId = expandedClaseId === id ? null : id;
    setExpandedClaseId(newId);
    if (newId) {
      loadAsistenciaParaClase(newId);
    }
  };

  const openAsistenciaModal = (clase) => {
    setSelectedClase(clase);
    setAsistenciaModalVisible(true);
  };

  const handleDescargarPulsera = async (clase, alumno) => {
    const alumnoId = alumno.id || alumno.Id;
    const alumnoNombre = alumno.nombre || alumno.Nombre || '';
    const alumnoApellido = alumno.apellido || alumno.Apellido || '';
    try {
      const blob = await claseService.descargarPulsera(clase.id, alumnoId);
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Pulsera_${alumnoNombre}_${alumnoApellido}.pdf`;
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
              const asistencias = asistenciasMap[clase.id] || [];
              const isLoadingAsist = loadingAsistenciaMap[clase.id] || false;

              // Calcular presentes y ausentes usando los datos del día de hoy
              const presentesHoy = asistencias.filter(a => a.presente).map(a => a.clienteId);
              const alumnosPresentes = alumnos.filter(al => presentesHoy.includes(al.id));
              const alumnosAusentes = alumnos.filter(al => !presentesHoy.includes(al.id));
              const tieneDatosAsistencia = asistencias.length > 0;

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
                        <MaterialCommunityIcons name="clock-outline" size={16} color="#64748b" style={{ marginLeft: 10 }} />
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
                      {/* Botón tomar asistencia */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 16 }}>
                        <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Alumnos Inscriptos</Text>
                        <TouchableOpacity style={styles.takeAsistenciaBtn} onPress={() => openAsistenciaModal(clase)}>
                          <MaterialCommunityIcons name="clipboard-check-outline" size={18} color="#fff" />
                          <Text style={styles.takeAsistenciaBtnText}>TOMAR ASISTENCIA</Text>
                        </TouchableOpacity>
                      </View>

                      {alumnos.length === 0 ? (
                        <Text style={styles.emptyAlumnosText}>Aún no hay alumnos inscriptos.</Text>
                      ) : (
                        <>
                          {/* Resumen del día */}
                          {isLoadingAsist ? (
                            <ActivityIndicator size="small" color="#009b3a" style={{ marginBottom: 12 }} />
                          ) : (
                            <View style={styles.asistenciaSummaryCard}>
                              <Text style={styles.summaryTitle}>
                                Asistencia de hoy — {new Date().toLocaleDateString('es-AR')}
                              </Text>
                              {!tieneDatosAsistencia ? (
                                <Text style={styles.noAsistenciaText}>
                                  Aún no se registró asistencia para hoy.
                                </Text>
                              ) : (
                                <View style={styles.summaryColumns}>
                                  {/* Presentes */}
                                  <View style={styles.summaryCol}>
                                    <View style={styles.summaryColHeader}>
                                      <MaterialCommunityIcons name="check-circle" size={18} color="#009b3a" />
                                      <Text style={[styles.summaryColTitle, { color: '#009b3a' }]}>
                                        Presentes ({alumnosPresentes.length})
                                      </Text>
                                    </View>
                                    {alumnosPresentes.length === 0 ? (
                                      <Text style={styles.summaryEmpty}>Ninguno</Text>
                                    ) : (
                                      alumnosPresentes.map(al => (
                                        <View key={al.id} style={styles.summaryAlumnoRow}>
                                          <MaterialCommunityIcons name="account-check" size={15} color="#009b3a" />
                                          <Text style={[styles.summaryAlumnoName, { color: '#15803d' }]}>
                                            {al.nombre} {al.apellido}
                                          </Text>
                                        </View>
                                      ))
                                    )}
                                  </View>

                                  <View style={styles.summarySeparator} />

                                  {/* Ausentes */}
                                  <View style={styles.summaryCol}>
                                    <View style={styles.summaryColHeader}>
                                      <MaterialCommunityIcons name="close-circle" size={18} color="#ef4444" />
                                      <Text style={[styles.summaryColTitle, { color: '#ef4444' }]}>
                                        Ausentes ({alumnosAusentes.length})
                                      </Text>
                                    </View>
                                    {alumnosAusentes.length === 0 ? (
                                      <Text style={styles.summaryEmpty}>Ninguno</Text>
                                    ) : (
                                      alumnosAusentes.map(al => (
                                        <View key={al.id} style={styles.summaryAlumnoRow}>
                                          <MaterialCommunityIcons name="account-remove" size={15} color="#ef4444" />
                                          <Text style={[styles.summaryAlumnoName, { color: '#b91c1c' }]}>
                                            {al.nombre} {al.apellido}
                                          </Text>
                                        </View>
                                      ))
                                    )}
                                  </View>
                                </View>
                              )}
                            </View>
                          )}

                          {/* Lista completa de alumnos */}
                          <Text style={styles.sectionTitle}>Lista de Alumnos</Text>
                          {alumnos.map((alumno, index) => {
                            const alumnoId = alumno.id || alumno.Id;
                            const alumnoNombre = alumno.nombre || alumno.Nombre || '';
                            const alumnoApellido = alumno.apellido || alumno.Apellido || '';
                            return (
                            <View key={alumnoId || index} style={styles.alumnoRow}>
                              <MaterialCommunityIcons name="account" size={20} color="#009b3a" />
                              <Text style={[styles.alumnoName, { flex: 1 }]}>{alumnoNombre} {alumnoApellido}</Text>
                              <TouchableOpacity
                                style={styles.pulseraSmallBtn}
                                onPress={() => handleDescargarPulsera(clase, alumno)}
                              >
                                <MaterialCommunityIcons name="download" size={14} color="#6366f1" />
                              </TouchableOpacity>
                            </View>
                          )})}
                        </>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <AsistenciaModal
        visible={asistenciaModalVisible}
        onClose={() => {
          setAsistenciaModalVisible(false);
          // Refrescar asistencia de esa clase en el mapa
          if (selectedClase) {
            setAsistenciasMap(prev => { const n = { ...prev }; delete n[selectedClase.id]; return n; });
            loadAsistenciaParaClase(selectedClase.id);
          }
        }}
        claseId={selectedClase?.id}
        claseNombre={selectedClase?.nombre || ''}
        esEntrenamiento={false}
      />

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
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#475569', marginBottom: 10, marginTop: 14 },
  emptyAlumnosText: { color: '#94a3b8', fontStyle: 'italic', fontSize: 14 },
  alumnoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  alumnoName: { fontSize: 15, color: '#1e293b', marginLeft: 10, fontWeight: '500' },
  pulseraSmallBtn: { backgroundColor: '#ede9fe', width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  takeAsistenciaBtn: { backgroundColor: '#009b3a', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  takeAsistenciaBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginLeft: 6 },

  // Resumen de asistencia
  asistenciaSummaryCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryTitle: { fontSize: 13, fontWeight: '800', color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  noAsistenciaText: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic' },
  summaryColumns: { flexDirection: 'row' },
  summaryCol: { flex: 1 },
  summaryColHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  summaryColTitle: { fontSize: 13, fontWeight: '900' },
  summaryAlumnoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3 },
  summaryAlumnoName: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  summaryEmpty: { color: '#94a3b8', fontSize: 12, fontStyle: 'italic' },
  summarySeparator: { width: 1, backgroundColor: '#e2e8f0', marginHorizontal: 12 },

});
