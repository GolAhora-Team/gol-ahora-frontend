import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { clienteService } from '../services/clienteService';
import { jugadorService } from '../services/jugadorService';

const POSICIONES = [
  { label: 'ARQ', value: 1, color: '#f59e0b', icon: 'account-outline' },
  { label: 'DEF', value: 2, color: '#3b82f6', icon: 'shield-account' },
  { label: 'MED', value: 3, color: '#10b981', icon: 'run' },
  { label: 'DEL', value: 4, color: '#ef4444', icon: 'soccer' },
];

export default function AddJugadoresModal({ visible, onClose, onConfirm, equipoId }) {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedJugadores, setSelectedJugadores] = useState([]);

  // Sub-modal state: when a client is clicked, show position/number picker
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [clienteToConfig, setClienteToConfig] = useState(null);
  const [selectedPosicion, setSelectedPosicion] = useState(null);
  const [numeroCamiseta, setNumeroCamiseta] = useState('');

  useEffect(() => {
    if (visible) {
      loadClientes();
      setSelectedJugadores([]);
      setSearch('');
    }
  }, [visible]);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const [data, allJugadores] = await Promise.all([
        clienteService.getAll(),
        jugadorService.getAll()
      ]);
      const equipoJugadores = (allJugadores || []).filter(j => j.equipoId?.toString() === equipoId?.toString());
      const equipoClientesIds = new Set(equipoJugadores.map(j => j.clienteId?.toString()));
      const clientesDisponibles = (data || []).filter(c => !equipoClientesIds.has(c.id?.toString()));
      
      setClientes(clientesDisponibles);
    } catch (error) {
      console.error('Error loading clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = clientes.filter(c => {
    const term = search.toLowerCase();
    const nombre = (c.nombre || '').toLowerCase();
    const apellido = (c.apellido || '').toLowerCase();
    const dni = (c.dni || '').toString();
    return nombre.includes(term) || apellido.includes(term) || dni.includes(term);
  });

  const isSelected = (clienteId) => selectedJugadores.some(sj => sj.clienteId === clienteId);

  const handleClientePress = (cliente) => {
    if (isSelected(cliente.id)) {
      // Already added, remove from list
      setSelectedJugadores(prev => prev.filter(sj => sj.clienteId !== cliente.id));
      return;
    }
    // Open config sub-modal
    setClienteToConfig(cliente);
    setSelectedPosicion(null);
    setNumeroCamiseta('');
    setConfigModalVisible(true);
  };

  const handleAddJugador = () => {
    if (!selectedPosicion) {
      return Alert.alert('Atención', 'Seleccioná una posición.');
    }
    const num = parseInt(numeroCamiseta);
    if (!numeroCamiseta || isNaN(num) || num < 1 || num > 99) {
      return Alert.alert('Atención', 'Ingresá un número de camiseta válido (1-99).');
    }
    setSelectedJugadores(prev => [...prev, {
      clienteId: clienteToConfig.id,
      nombre: clienteToConfig.nombre,
      apellido: clienteToConfig.apellido,
      posicion: selectedPosicion.value,
      posicionLabel: selectedPosicion.label,
      numero: num
    }]);
    setConfigModalVisible(false);
  };

  const getPosicionColor = (posValue) => {
    const pos = POSICIONES.find(p => p.value === posValue);
    return pos ? pos.color : '#94a3b8';
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Agregar Jugadores</Text>

          <View style={styles.searchRow}>
            <MaterialCommunityIcons name="magnify" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre o DNI..."
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {selectedJugadores.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={styles.selectedLabel}>Seleccionados ({selectedJugadores.length}):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedJugadores.map(sj => (
                  <View key={sj.clienteId} style={styles.chip}>
                    <View style={[styles.chipNumBadge, { backgroundColor: getPosicionColor(sj.posicion) }]}>
                      <Text style={styles.chipNum}>{sj.numero}</Text>
                    </View>
                    <Text style={styles.chipText}>{sj.nombre} {sj.apellido}</Text>
                    <Text style={[styles.chipPos, { color: getPosicionColor(sj.posicion) }]}>{sj.posicionLabel}</Text>
                    <TouchableOpacity onPress={() => setSelectedJugadores(prev => prev.filter(j => j.clienteId !== sj.clienteId))}>
                      <MaterialCommunityIcons name="close-circle" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="large" color="#009b3a" style={{ marginVertical: 20 }} />
          ) : (
            <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
              {filtered.map(cliente => (
                <TouchableOpacity
                  key={cliente.id}
                  style={[styles.clienteRow, isSelected(cliente.id) && styles.clienteRowSelected]}
                  onPress={() => handleClientePress(cliente)}
                >
                  <View style={styles.clienteInfo}>
                    <MaterialCommunityIcons
                      name={isSelected(cliente.id) ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                      size={22}
                      color={isSelected(cliente.id) ? "#009b3a" : "#94a3b8"}
                    />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.clienteNombre}>{cliente.nombre} {cliente.apellido}</Text>
                      <Text style={styles.clienteDni}>DNI: {cliente.dni}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {filtered.length === 0 && (
                <Text style={styles.emptyText}>No se encontraron clientes.</Text>
              )}
            </ScrollView>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>CANCELAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, (selectedJugadores.length === 0 || isConfirming) && styles.confirmBtnDisabled]}
              onPress={async () => {
                if (selectedJugadores.length > 0 && !isConfirming) {
                  setIsConfirming(true);
                  await onConfirm(selectedJugadores);
                  setIsConfirming(false);
                }
              }}
              disabled={selectedJugadores.length === 0 || isConfirming}
            >
              {isConfirming ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmText}>CONFIRMAR ({selectedJugadores.length})</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Sub-modal: Position & Number picker ── */}
      <Modal visible={configModalVisible} animationType="fade" transparent={true}>
        <View style={styles.overlay}>
          <View style={styles.configContainer}>
            <Text style={styles.configTitle}>Configurar Jugador</Text>
            <Text style={styles.configName}>
              {clienteToConfig?.nombre} {clienteToConfig?.apellido}
            </Text>

            <Text style={styles.configLabel}>Posición</Text>
            <View style={styles.posRow}>
              {POSICIONES.map(pos => (
                <TouchableOpacity
                  key={pos.value}
                  style={[
                    styles.posBtn,
                    selectedPosicion?.value === pos.value && { backgroundColor: pos.color, borderColor: pos.color }
                  ]}
                  onPress={() => setSelectedPosicion(pos)}
                >
                  <MaterialCommunityIcons
                    name={pos.icon}
                    size={20}
                    color={selectedPosicion?.value === pos.value ? '#fff' : pos.color}
                  />
                  <Text style={[
                    styles.posBtnText,
                    selectedPosicion?.value === pos.value && { color: '#fff' }
                  ]}>{pos.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.configLabel}>Número de camiseta (1-99)</Text>
            <TextInput
              style={styles.numInput}
              value={numeroCamiseta}
              onChangeText={(t) => {
                const cleaned = t.replace(/[^0-9]/g, '');
                if (cleaned === '' || (parseInt(cleaned) >= 1 && parseInt(cleaned) <= 99)) {
                  setNumeroCamiseta(cleaned);
                }
              }}
              keyboardType="numeric"
              placeholder="Ej: 10"
              maxLength={2}
            />

            <View style={styles.configBtnRow}>
              <TouchableOpacity style={styles.configCancelBtn} onPress={() => setConfigModalVisible(false)}>
                <Text style={styles.configCancelText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.configAddBtn} onPress={handleAddJugador}>
                <MaterialCommunityIcons name="account-plus" size={18} color="#fff" />
                <Text style={styles.configAddText}>AGREGAR JUGADOR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: '#fff', borderRadius: 25, padding: 25, width: '92%', maxWidth: 420, elevation: 10, maxHeight: '85%' },
  title: { color: '#1e293b', fontSize: 20, fontWeight: '900', marginBottom: 15, textAlign: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1e293b' },
  selectedSection: { marginBottom: 10 },
  selectedLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 5 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20, marginRight: 6, gap: 4, borderWidth: 1, borderColor: '#bbf7d0' },
  chipNumBadge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  chipNum: { color: '#fff', fontWeight: '900', fontSize: 9 },
  chipText: { fontSize: 10, fontWeight: '700', color: '#1e293b' },
  chipPos: { fontSize: 9, fontWeight: '900' },
  listScroll: { maxHeight: 240 },
  clienteRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  clienteRowSelected: { backgroundColor: '#f0fdf4', borderRadius: 10 },
  clienteInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  clienteNombre: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  clienteDni: { fontSize: 11, color: '#64748b' },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 20 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  cancelBtn: { padding: 14, borderRadius: 12, flex: 0.45, alignItems: 'center' },
  cancelText: { color: '#64748b', fontWeight: '800' },
  confirmBtn: { backgroundColor: '#009b3a', padding: 14, borderRadius: 12, flex: 0.45, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#94a3b8' },
  confirmText: { color: '#fff', fontWeight: '900', fontSize: 12 },

  // Config sub-modal styles
  configContainer: { backgroundColor: '#fff', borderRadius: 25, padding: 25, width: '88%', maxWidth: 380, elevation: 12 },
  configTitle: { color: '#1e293b', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  configName: { color: '#009b3a', fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 18 },
  configLabel: { color: '#64748b', fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 6 },
  posRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginBottom: 14 },
  posBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', gap: 4 },
  posBtnText: { fontSize: 11, fontWeight: '900', color: '#64748b' },
  numInput: { backgroundColor: '#f1f5f9', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 18, fontWeight: '700', textAlign: 'center', color: '#1e293b' },
  configBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 10 },
  configCancelBtn: { padding: 14, borderRadius: 12, flex: 0.4, alignItems: 'center' },
  configCancelText: { color: '#64748b', fontWeight: '800' },
  configAddBtn: { backgroundColor: '#009b3a', padding: 14, borderRadius: 12, flex: 0.6, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  configAddText: { color: '#fff', fontWeight: '900', fontSize: 12 }
});
