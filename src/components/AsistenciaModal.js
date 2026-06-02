import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { claseService } from '../services/claseService';

// Helper para guardar/leer asistencia en localStorage
const asistenciaStorage = {
  getKey: (claseId, fecha) => `asistencia_${claseId}_${fecha}`,
  save: (claseId, fecha, registros) => {
    if (Platform.OS === 'web') {
      const key = asistenciaStorage.getKey(claseId, fecha);
      localStorage.setItem(key, JSON.stringify(registros));
      // También guardar índice de fechas por clase
      const indexKey = `asistencia_index_${claseId}`;
      const existingIndex = JSON.parse(localStorage.getItem(indexKey) || '[]');
      if (!existingIndex.includes(fecha)) {
        existingIndex.push(fecha);
        localStorage.setItem(indexKey, JSON.stringify(existingIndex));
      }
    }
  },
  get: (claseId, fecha) => {
    if (Platform.OS === 'web') {
      const key = asistenciaStorage.getKey(claseId, fecha);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
    return null;
  },
  getAllDates: (claseId) => {
    if (Platform.OS === 'web') {
      const indexKey = `asistencia_index_${claseId}`;
      return JSON.parse(localStorage.getItem(indexKey) || '[]');
    }
    return [];
  },
  getAll: (claseId) => {
    const dates = asistenciaStorage.getAllDates(claseId);
    const all = {};
    dates.forEach(fecha => {
      const data = asistenciaStorage.get(claseId, fecha);
      if (data) all[fecha] = data;
    });
    return all;
  }
};

export { asistenciaStorage };

export default function AsistenciaModal({ visible, onClose, claseId, claseNombre }) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const fechaHoy = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (visible && claseId) {
      loadAlumnos();
    }
  }, [visible, claseId]);

  const loadAlumnos = async () => {
    setLoading(true);
    try {
      const clase = await claseService.getById(claseId);
      const clientesRaw = clase?.clientes || clase?.alumnos || [];
      
      // Check if there's already saved attendance for today
      const saved = asistenciaStorage.get(claseId, fechaHoy);
      
      const mapped = clientesRaw.map(c => {
        const savedState = saved ? saved.find(s => s.id === c.id) : null;
        return {
          id: c.id,
          nombre: `${c.nombre} ${c.apellido || ''}`.trim(),
          estado: savedState ? savedState.estado : null
        };
      });
      setAlumnos(mapped);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar los alumnos.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAsistencia = (id, valor) => {
    setAlumnos(alumnos.map(a => a.id === id ? { ...a, estado: valor } : a));
  };

  const guardarAsistencia = () => {
    const sinMarcar = alumnos.filter(a => a.estado === null);
    if (sinMarcar.length > 0) {
      Alert.alert('Atención', `Hay ${sinMarcar.length} alumno(s) sin marcar. ¿Desea guardar igual?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Guardar', onPress: () => ejecutarGuardado() }
      ]);
      return;
    }
    ejecutarGuardado();
  };

  const ejecutarGuardado = () => {
    const registros = alumnos.map(a => ({
      id: a.id,
      nombre: a.nombre,
      estado: a.estado // true = presente, false = ausente, null = sin marcar
    }));
    asistenciaStorage.save(claseId, fechaHoy, registros);
    Alert.alert("Éxito", "Asistencia registrada correctamente.");
    onClose();
  };

  const presentes = alumnos.filter(a => a.estado === true).length;
  const ausentes = alumnos.filter(a => a.estado === false).length;

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Tomar Asistencia</Text>
              <Text style={styles.subTitle}>{claseNombre}</Text>
              <Text style={styles.dateText}>{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={28} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Resumen rápido */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryItem, { backgroundColor: '#f0fdf4' }]}>
              <Text style={[styles.summaryCount, { color: '#16a34a' }]}>{presentes}</Text>
              <Text style={styles.summaryLabel}>Presentes</Text>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: '#fef2f2' }]}>
              <Text style={[styles.summaryCount, { color: '#ef4444' }]}>{ausentes}</Text>
              <Text style={styles.summaryLabel}>Ausentes</Text>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: '#f8fafc' }]}>
              <Text style={[styles.summaryCount, { color: '#64748b' }]}>{alumnos.length}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#009b3a" style={{ marginVertical: 30 }} />
          ) : alumnos.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="account-group-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>No hay alumnos inscriptos en esta clase.</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {alumnos.map((alumno, idx) => (
                <View key={alumno.id || idx} style={styles.row}>
                  <View style={styles.alumnoLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.alumnoName}>{alumno.nombre}</Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity 
                      onPress={() => toggleAsistencia(alumno.id, true)}
                      style={[styles.actionBtn, alumno.estado === true && {backgroundColor: '#009b3a'}]}
                    >
                      <MaterialCommunityIcons name="check" size={18} color={alumno.estado === true ? "#fff" : "#009b3a"} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={() => toggleAsistencia(alumno.id, false)}
                      style={[styles.actionBtn, alumno.estado === false && {backgroundColor: '#ef4444'}]}
                    >
                      <MaterialCommunityIcons name="close" size={18} color={alumno.estado === false ? "#fff" : "#ef4444"} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={guardarAsistencia} disabled={alumnos.length === 0}>
              <MaterialCommunityIcons name="content-save-check" size={20} color="#fff" />
              <Text style={styles.saveText}>GUARDAR ASISTENCIA</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>CANCELAR</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { 
    backgroundColor: '#fff', width: '90%', maxWidth: 450,
    borderRadius: 25, padding: 25, maxHeight: '85%', 
    elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 15
  },
  header: { marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  subTitle: { fontSize: 13, color: '#009b3a', fontWeight: '800', marginTop: 4 },
  dateText: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  summaryItem: { flex: 1, padding: 10, borderRadius: 12, alignItems: 'center' },
  summaryCount: { fontSize: 20, fontWeight: '900' },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', marginTop: 2 },
  emptyBox: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { color: '#94a3b8', fontWeight: '600', marginTop: 10 },
  list: { marginBottom: 15 },
  row: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' 
  },
  alumnoLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  alumnoName: { fontSize: 14, fontWeight: '700', color: '#334155', flex: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { 
    width: 38, height: 38, borderRadius: 12, 
    borderWidth: 2, borderColor: '#f1f5f9', 
    justifyContent: 'center', alignItems: 'center' 
  },
  footer: { gap: 10 },
  saveBtn: { backgroundColor: '#009b3a', padding: 16, borderRadius: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  saveText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
  closeBtn: { padding: 10, alignItems: 'center' },
  closeText: { color: '#64748b', fontWeight: '700' }
});