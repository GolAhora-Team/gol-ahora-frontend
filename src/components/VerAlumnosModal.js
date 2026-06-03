import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { claseService } from '../services/claseService';

export default function VerAlumnosModal({ visible, onClose, claseId, claseNombre }) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && claseId) {
      loadAlumnos();
    }
  }, [visible, claseId]);

  const loadAlumnos = async () => {
    setLoading(true);
    try {
      const clase = await claseService.getById(claseId);
      // Asumimos que la clase tiene un array 'clientes' o 'alumnos'
      setAlumnos(clase?.clientes || clase?.alumnos || []);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar los alumnos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Alumnos Inscriptos</Text>
              <Text style={styles.subtitle}>{claseNombre}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={28} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#009b3a" style={{ marginVertical: 30 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={true}>
              {alumnos.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="account-group-outline" size={40} color="#cbd5e1" />
                  <Text style={styles.emptyText}>No hay alumnos inscriptos en esta clase.</Text>
                </View>
              ) : (
                alumnos.map((alumno, idx) => (
                  <View key={alumno.id || idx} style={styles.alumnoCard}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(alumno.nombre?.[0] || '')}{(alumno.apellido?.[0] || '')}
                      </Text>
                    </View>
                    <View style={styles.alumnoInfo}>
                      <Text style={styles.alumnoName}>{alumno.nombre} {alumno.apellido}</Text>
                      <Text style={styles.alumnoDni}>DNI: {alumno.dni}</Text>
                    </View>
                    {alumno.esSocioActivo && (
                      <View style={styles.socioBadge}>
                        <MaterialCommunityIcons name="star" size={12} color="#fff" />
                        <Text style={styles.socioText}>SOCIO</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>CERRAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 25, width: '100%', maxWidth: 450, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  subtitle: { fontSize: 14, fontWeight: '700', color: '#009b3a', marginTop: 2 },
  alumnoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#009b3a', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  alumnoInfo: { flex: 1 },
  alumnoName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  alumnoDni: { fontSize: 13, color: '#64748b', marginTop: 2 },
  socioBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffb300', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  socioText: { fontSize: 10, fontWeight: '900', color: '#fff', marginLeft: 2 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#94a3b8', marginTop: 10, fontWeight: '600' },
  closeBtn: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  closeBtnText: { color: '#64748b', fontWeight: '900', fontSize: 14 }
});
