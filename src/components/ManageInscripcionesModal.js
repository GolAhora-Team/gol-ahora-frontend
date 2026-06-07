import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { claseService } from '../services/claseService';
import { entrenamientoService } from '../services/entrenamientoService';

export default function ManageInscripcionesModal({ visible, onClose, actividad, onUpdate }) {
  const [inscriptos, setInscriptos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (visible && actividad) {
      loadData();
    }
  }, [visible, actividad]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar los inscriptos de la actividad actual
      let currentInscriptos = [];
      if (actividad.tipo === 'CLASE') {
        const data = await claseService.getById(actividad.id);
        currentInscriptos = data.clientes || data.alumnos || [];
      } else if (actividad.tipo === 'ENTRENAMIENTO') {
        const data = await entrenamientoService.getById(actividad.id);
        currentInscriptos = data.clientes || data.alumnos || [];
      } else {
        // En caso de ligas no lo soportamos en este modal, pero para evitar errores:
        currentInscriptos = [];
      }
      setInscriptos(currentInscriptos);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (user) => {
    Alert.alert(
      'Eliminar alumno',
      `¿Está seguro de eliminar al alumno ${user.nombre} ${user.apellido}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => executeRemove(user) }
      ]
    );
  };

  const executeRemove = async (user) => {
    setActionLoading(true);
    try {
      if (actividad.tipo === 'CLASE') {
        await claseService.removeCliente(actividad.id, user.id);
      } else if (actividad.tipo === 'ENTRENAMIENTO') {
        await entrenamientoService.removeCliente(actividad.id, user.id);
      }
      await loadData();
      if (onUpdate) onUpdate();
      Alert.alert('Éxito', 'Se eliminó correctamente el alumno de la clase');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar al alumno.');
    } finally {
      setActionLoading(false);
    }
  };



  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Gestionar Inscriptos</Text>
              <Text style={styles.subtitle}>{actividad?.nombre} ({actividad?.tipo})</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={actionLoading}>
              <MaterialCommunityIcons name="close" size={28} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#009b3a" style={{ marginVertical: 30 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 20 }}>
              
              <Text style={styles.sectionLabel}>Usuarios Inscriptos ({inscriptos.length})</Text>
              {inscriptos.length === 0 ? (
                <Text style={styles.emptyText}>No hay nadie inscripto aún.</Text>
              ) : (
                inscriptos.map((user, idx) => (
                  <View key={user.id || idx} style={styles.userCard}>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.nombre} {user.apellido}</Text>
                      <Text style={styles.userDni}>DNI: {user.dni}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.removeBtn} 
                      onPress={() => handleRemove(user)}
                      disabled={actionLoading}
                    >
                      <MaterialCommunityIcons name="account-remove" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  subtitle: { fontSize: 13, fontWeight: '700', color: '#009b3a', marginTop: 2 },
  sectionLabel: { fontSize: 15, fontWeight: '800', color: '#64748b', marginTop: 10, marginBottom: 10 },
  emptyText: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginBottom: 15 },
  userCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  userDni: { fontSize: 12, color: '#64748b', marginTop: 2 },
  removeBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 }
});
