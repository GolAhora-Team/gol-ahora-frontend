import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { jugadorService } from '../services/jugadorService';

const POSICIONES = [
  { id: 1, label: 'Arquero', icon: 'hand-back-left' },
  { id: 2, label: 'Defensor', icon: 'shield-account' },
  { id: 3, label: 'Mediocampista', icon: 'run-fast' },
  { id: 4, label: 'Delantero', icon: 'soccer-field' }
];

export default function SetPosicionModal({ visible, onClose, jugadorId, equipoNombre, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [selectedPos, setSelectedPos] = useState(null);

  const handleSave = async () => {
    if (!selectedPos) return;
    try {
      setLoading(true);
      // Fetcheamos el jugador completo para no perder datos en el PUT
      const jugadorFull = await jugadorService.getById(jugadorId);
      await jugadorService.update(jugadorId, {
        ...jugadorFull,
        posicion: selectedPos
      });
      setLoading(false);
      onSuccess();
    } catch (error) {
      setLoading(false);
      alert('Error al guardar la posición');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Definir Mi Posición</Text>
          <Text style={styles.subtitle}>En el equipo {equipoNombre}</Text>

          <View style={styles.grid}>
            {POSICIONES.map(pos => (
              <TouchableOpacity
                key={pos.id}
                style={[styles.posCard, selectedPos === pos.id && styles.posCardSelected]}
                onPress={() => setSelectedPos(pos.id)}
              >
                <MaterialCommunityIcons 
                  name={pos.icon} 
                  size={32} 
                  color={selectedPos === pos.id ? '#fff' : '#009b3a'} 
                />
                <Text style={[styles.posText, selectedPos === pos.id && styles.posTextSelected]}>
                  {pos.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveBtn, (!selectedPos || loading) && { opacity: 0.7 }]} 
              onPress={handleSave}
              disabled={!selectedPos || loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Guardar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  title: { fontSize: 20, fontWeight: '900', color: '#1e293b', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  posCard: { 
    width: '45%', 
    backgroundColor: '#f1f5f9', 
    padding: 15, 
    borderRadius: 15, 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  posCardSelected: { backgroundColor: '#009b3a', borderColor: '#007a2e' },
  posText: { marginTop: 8, fontSize: 13, fontWeight: '700', color: '#1e293b' },
  posTextSelected: { color: '#fff' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 10 },
  cancelBtn: { padding: 12, borderRadius: 10, backgroundColor: '#f1f5f9' },
  cancelText: { color: '#64748b', fontWeight: 'bold' },
  saveBtn: { padding: 12, borderRadius: 10, backgroundColor: '#009b3a' },
  saveText: { color: '#fff', fontWeight: 'bold' },
});
