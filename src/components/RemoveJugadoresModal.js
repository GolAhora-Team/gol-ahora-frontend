import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { jugadorService } from '../services/jugadorService';
import { clienteService } from '../services/clienteService';
import ConfirmModal from './ConfirmModal';

export default function RemoveJugadoresModal({ visible, onClose, equipoId, equipoNombre, onJugadorRemoved }) {
  const [jugadores, setJugadores] = useState([]);
  const [clientes, setClientes] = useState({});
  const [loading, setLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [jugadorToRemove, setJugadorToRemove] = useState(null);

  useEffect(() => {
    if (visible && equipoId) {
      loadJugadoresDelEquipo();
    }
  }, [visible, equipoId]);

  const loadJugadoresDelEquipo = async () => {
    try {
      setLoading(true);
      const allJugadores = await jugadorService.getAll();
      const equipoJugadores = (allJugadores || []).filter(j => j.equipoId?.toString() === equipoId?.toString());

      // Load client names
      const allClientes = await clienteService.getAll();
      const clienteMap = {};
      (allClientes || []).forEach(c => { clienteMap[c.id] = c; });
      setClientes(clienteMap);
      setJugadores(equipoJugadores);
    } catch (error) {
      console.error('Error loading jugadores:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClienteNombre = (clienteId) => {
    const c = clientes[clienteId];
    return c ? `${c.nombre} ${c.apellido}` : `Jugador #${clienteId}`;
  };

  const handleRemove = async () => {
    if (!jugadorToRemove) return;
    try {
      await jugadorService.delete(jugadorToRemove.id);
      setJugadores(prev => prev.filter(j => j.id !== jugadorToRemove.id));
      if (onJugadorRemoved) onJugadorRemoved(jugadorToRemove);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo eliminar el jugador.');
    }
  };

  const askRemove = (jugador) => {
    setJugadorToRemove(jugador);
    setConfirmVisible(true);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Jugadores de {equipoNombre}</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#009b3a" style={{ marginVertical: 30 }} />
          ) : (
            <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
              {jugadores.map(jugador => (
                <View key={jugador.id} style={styles.jugadorRow}>
                  <View style={styles.jugadorInfo}>
                    <MaterialCommunityIcons name="account" size={22} color="#3b82f6" />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.jugadorNombre}>{getClienteNombre(jugador.clienteId)}</Text>
                      <Text style={styles.jugadorDetail}>Número: {jugador.numero} | Posición: {jugador.posicion}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => askRemove(jugador)} style={styles.removeBtn}>
                    <MaterialCommunityIcons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {jugadores.length === 0 && (
                <Text style={styles.emptyText}>No hay jugadores en este equipo.</Text>
              )}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>CERRAR</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ConfirmModal
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        onConfirm={handleRemove}
        title="Eliminar Jugador"
        message={`¿Está seguro que quiere eliminar a ${jugadorToRemove ? getClienteNombre(jugadorToRemove.clienteId) : ''} del equipo?`}
        confirmText="ELIMINAR"
        cancelText="Cancelar"
        icon="account-remove"
        color="#ef4444"
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: '#fff', borderRadius: 25, padding: 25, width: '92%', maxWidth: 420, elevation: 10, maxHeight: '80%' },
  title: { color: '#1e293b', fontSize: 20, fontWeight: '900', marginBottom: 15, textAlign: 'center' },
  listScroll: { maxHeight: 350 },
  jugadorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  jugadorInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  jugadorNombre: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  jugadorDetail: { fontSize: 11, color: '#64748b', marginTop: 2 },
  removeBtn: { padding: 5 },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 30, marginBottom: 20 },
  closeBtn: { backgroundColor: '#f1f5f9', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  closeText: { color: '#475569', fontWeight: '800' }
});
