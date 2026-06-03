import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { jugadorService } from '../services/jugadorService';
import { clienteService } from '../services/clienteService';

const POSICION_LABELS = { 0: 'Sin posición', 1: 'ARQ', 2: 'DEF', 3: 'MED', 4: 'DEL' };
const POSICION_COLORS = { 0: '#94a3b8', 1: '#f59e0b', 2: '#3b82f6', 3: '#10b981', 4: '#ef4444' };

export default function VerJugadoresModal({ visible, onClose, equipoId, equipoNombre }) {
  const [jugadores, setJugadores] = useState([]);
  const [clientes, setClientes] = useState({});
  const [loading, setLoading] = useState(false);

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

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="account-group" size={26} color="#009b3a" />
            <Text style={styles.title}>Jugadores de {equipoNombre}</Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>{jugadores.length} jugador{jugadores.length !== 1 ? 'es' : ''}</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#009b3a" style={{ marginVertical: 30 }} />
          ) : (
            <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={true}>
              {jugadores.map((jugador, index) => (
                <View key={jugador.id} style={styles.jugadorRow}>
                  <View style={[styles.numberBadge, { backgroundColor: POSICION_COLORS[jugador.posicion] || '#94a3b8' }]}>
                    <Text style={styles.numberText}>{jugador.numero || '-'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.jugadorNombre}>{getClienteNombre(jugador.clienteId)}</Text>
                    <View style={styles.posRow}>
                      <View style={[styles.posBadge, { backgroundColor: (POSICION_COLORS[jugador.posicion] || '#94a3b8') + '20' }]}>
                        <Text style={[styles.posText, { color: POSICION_COLORS[jugador.posicion] || '#94a3b8' }]}>
                          {POSICION_LABELS[jugador.posicion] || 'Sin posición'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
              {jugadores.length === 0 && (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="account-off-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyText}>No hay jugadores en este equipo.</Text>
                </View>
              )}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>CERRAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: '#fff', borderRadius: 25, padding: 25, width: '92%', maxWidth: 420, elevation: 10, maxHeight: '80%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  title: { color: '#1e293b', fontSize: 18, fontWeight: '900', flex: 1 },
  countBadge: { alignSelf: 'flex-start', backgroundColor: '#e6f5eb', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  countText: { color: '#009b3a', fontWeight: '800', fontSize: 12 },
  listScroll: { maxHeight: 350 },
  jugadorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  numberBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  numberText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  jugadorNombre: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  posRow: { flexDirection: 'row', marginTop: 3 },
  posBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  posText: { fontSize: 10, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 10, fontSize: 13 },
  closeBtn: { backgroundColor: '#f1f5f9', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  closeText: { color: '#475569', fontWeight: '800' }
});
