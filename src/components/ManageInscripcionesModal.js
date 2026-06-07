import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { claseService } from '../services/claseService';
import { entrenamientoService } from '../services/entrenamientoService';

export default function ManageInscripcionesModal({ visible, onClose, actividad, onUpdate }) {
  const [inscriptos, setInscriptos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [actualErrorMessage, setActualErrorMessage] = useState('');

  useEffect(() => {
    if (visible && actividad) {
      setShowError(false);
      setShowSuccess(false);
      setUserToRemove(null);
      setActualErrorMessage('');
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
      console.error('Error in loadData:', error);
      setActualErrorMessage(error?.message || 'Error desconocido al cargar datos.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (user) => {
    setUserToRemove(user);
    setShowConfirm(true);
  };

  const executeRemove = async () => {
    if (!userToRemove) return;
    setActionLoading(true);
    setShowConfirm(false);
    try {
      if (actividad.tipo === 'CLASE') {
        await claseService.removeCliente(actividad.id, userToRemove.id);
      } else if (actividad.tipo === 'ENTRENAMIENTO') {
        await entrenamientoService.removeCliente(actividad.id, userToRemove.id);
      }
      await loadData();
      if (onUpdate) onUpdate();
      setShowSuccess(true);
    } catch (error) {
      console.error('Error in executeRemove:', error);
      setActualErrorMessage(error?.message || 'Error desconocido al eliminar el alumno.');
      setShowError(true);
    } finally {
      setActionLoading(false);
      setUserToRemove(null);
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

      {/* CONFIRM OVERLAY */}
      {showConfirm && (
        <View style={[StyleSheet.absoluteFill, styles.alertOverlay]}>
          <View style={styles.alertContent}>
            <View style={styles.iconCircleError}>
              <MaterialCommunityIcons name="alert" size={32} color="#ef4444" />
            </View>
            <Text style={styles.alertTitle}>Eliminar Alumno</Text>
            <Text style={styles.alertMessage}>
              ¿Está seguro de eliminar al alumno {userToRemove?.nombre} {userToRemove?.apellido}?
            </Text>
            <View style={styles.alertButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowConfirm(false)}>
                <Text style={styles.cancelButtonText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={executeRemove}>
                <Text style={styles.confirmButtonText}>ELIMINAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* SUCCESS OVERLAY */}
      {showSuccess && (
        <View style={[StyleSheet.absoluteFill, styles.alertOverlay]}>
          <View style={styles.alertContent}>
            <View style={styles.iconCircleSuccess}>
              <MaterialCommunityIcons name="check" size={40} color="#009b3a" />
            </View>
            <Text style={styles.alertTitle}>¡Éxito!</Text>
            <Text style={styles.alertMessage}>Se eliminó correctamente el alumno de la clase.</Text>
            <TouchableOpacity style={styles.okButton} onPress={() => setShowSuccess(false)}>
              <Text style={styles.okButtonText}>ENTENDIDO</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ERROR OVERLAY */}
      {showError && (
        <View style={[StyleSheet.absoluteFill, styles.alertOverlay]}>
          <View style={styles.alertContent}>
            <View style={styles.iconCircleError}>
              <MaterialCommunityIcons name="close" size={40} color="#ef4444" />
            </View>
            <Text style={styles.alertTitle}>Error</Text>
            <Text style={styles.alertMessage}>{actualErrorMessage || 'No se pudo completar la operación. Por favor intenta de nuevo.'}</Text>
            <TouchableOpacity style={styles.okButtonError} onPress={() => setShowError(false)}>
              <Text style={styles.okButtonText}>CERRAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
  removeBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 },
  
  // Custom Alerts (Absolute Overlays)
  alertOverlay: { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  alertContent: { backgroundColor: '#fff', borderRadius: 24, padding: 25, width: '85%', maxWidth: 350, alignItems: 'center', elevation: 10 },
  iconCircleError: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  iconCircleSuccess: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  alertTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 10, textAlign: 'center' },
  alertMessage: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  alertButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelButton: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { color: '#64748b', fontWeight: '800', fontSize: 13 },
  confirmButton: { flex: 1, backgroundColor: '#ef4444', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  okButton: { width: '100%', backgroundColor: '#009b3a', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  okButtonError: { width: '100%', backgroundColor: '#ef4444', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  okButtonText: { color: '#fff', fontWeight: '900', fontSize: 13 }
});
