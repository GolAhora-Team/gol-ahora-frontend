import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { claseService } from '../services/claseService';
import { entrenamientoService } from '../services/entrenamientoService';

const abrirPdfBlob = (blob, filename) => {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    Alert.alert('PDF', 'Descarga disponible solo en versión web.');
  }
};

export default function VerAlumnosModal({ visible, onClose, claseId, claseNombre, esEntrenamiento = false }) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (visible && claseId) {
      loadAlumnos();
    }
  }, [visible, claseId]);

  const loadAlumnos = async () => {
    setLoading(true);
    try {
      let data;
      if (esEntrenamiento) {
        data = await entrenamientoService.getById(claseId);
      } else {
        data = await claseService.getById(claseId);
      }
      setAlumnos(data?.clientes || data?.alumnos || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los alumnos.');
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarPulsera = async (alumno) => {
    setDownloadingId(alumno.id);
    try {
      let blob;
      if (esEntrenamiento) {
        blob = await entrenamientoService.descargarPulsera(claseId, alumno.id);
      } else {
        blob = await claseService.descargarPulsera(claseId, alumno.id);
      }
      abrirPdfBlob(blob, `Pulsera_${alumno.nombre}_${alumno.apellido}.pdf`);
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo generar la pulsera.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
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
                    {/* ── Botón descarga pulsera PDF ── */}
                    <TouchableOpacity
                      style={[styles.pulseraBtn, downloadingId === alumno.id && { opacity: 0.5 }]}
                      onPress={() => handleDescargarPulsera(alumno)}
                      disabled={downloadingId === alumno.id}
                    >
                      {downloadingId === alumno.id
                        ? <ActivityIndicator size="small" color="#6366f1" />
                        : <MaterialCommunityIcons name="download" size={18} color="#6366f1" />
                      }
                    </TouchableOpacity>
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
  alumnoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8fafc', padding: 13, borderRadius: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#009b3a', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  alumnoInfo: { flex: 1 },
  alumnoName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  alumnoDni: { fontSize: 13, color: '#64748b', marginTop: 2 },
  socioBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffb300', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  socioText: { fontSize: 10, fontWeight: '900', color: '#fff', marginLeft: 2 },
  pulseraBtn: {
    backgroundColor: '#ede9fe', width: 34, height: 34, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center'
  },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#94a3b8', marginTop: 10, fontWeight: '600' },
  closeBtn: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  closeBtnText: { color: '#64748b', fontWeight: '900', fontSize: 14 },
});
