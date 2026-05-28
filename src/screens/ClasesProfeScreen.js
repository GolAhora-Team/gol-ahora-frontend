import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import { http, API_BASE_URL } from '../services/apiConfig';

export default function ClasesProfeScreen({ route, navigation }) {
  const { role, idPersona } = route.params || { role: "PROFE", idPersona: null };
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedClaseId, setExpandedClaseId] = useState(null);

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

  return (
    <ScreenTemplate userRole={role} navigation={navigation}>
      <View style={styles.headerRow}>
        <Text style={styles.mainTitle}>Mis Clases a Cargo</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#009b3a" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
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
                      <Text style={styles.sectionTitle}>Alumnos Inscriptos</Text>
                      {alumnos.length === 0 ? (
                        <Text style={styles.emptyAlumnosText}>Aún no hay alumnos inscriptos.</Text>
                      ) : (
                        alumnos.map((alumno, index) => (
                          <View key={alumno.id || index} style={styles.alumnoRow}>
                            <MaterialCommunityIcons name="account" size={20} color="#009b3a" />
                            <Text style={styles.alumnoName}>{alumno.nombre} {alumno.apellido}</Text>
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
  alumnoName: { fontSize: 15, color: '#1e293b', marginLeft: 10, fontWeight: '500' }
});
