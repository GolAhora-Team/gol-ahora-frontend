import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { clienteService } from '../services/clienteService';

export default function AddJugadoresModal({ visible, onClose, onConfirm, equipoId }) {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedClientes, setSelectedClientes] = useState([]);

  useEffect(() => {
    if (visible) {
      loadClientes();
      setSelectedClientes([]);
      setSearch('');
    }
  }, [visible]);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await clienteService.getAll();
      setClientes(data || []);
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

  const isSelected = (clienteId) => selectedClientes.some(sc => sc.id === clienteId);

  const toggleCliente = (cliente) => {
    if (isSelected(cliente.id)) {
      setSelectedClientes(prev => prev.filter(sc => sc.id !== cliente.id));
    } else {
      setSelectedClientes(prev => [...prev, cliente]);
    }
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

          {selectedClientes.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={styles.selectedLabel}>Seleccionados ({selectedClientes.length}):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedClientes.map(sc => (
                  <View key={sc.id} style={styles.chip}>
                    <Text style={styles.chipText}>{sc.nombre} {sc.apellido}</Text>
                    <TouchableOpacity onPress={() => toggleCliente(sc)}>
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
                  onPress={() => toggleCliente(cliente)}
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
              style={[styles.confirmBtn, selectedClientes.length === 0 && styles.confirmBtnDisabled]}
              onPress={() => {
                if (selectedClientes.length > 0) {
                  onConfirm(selectedClientes);
                }
              }}
              disabled={selectedClientes.length === 0}
            >
              <Text style={styles.confirmText}>CONFIRMAR ({selectedClientes.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e6f5eb', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginRight: 6, gap: 5 },
  chipText: { fontSize: 11, fontWeight: '700', color: '#009b3a' },
  listScroll: { maxHeight: 280 },
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
  confirmText: { color: '#fff', fontWeight: '900', fontSize: 12 }
});
