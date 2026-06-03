import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EnrollTeamModal({ visible, onClose, availableEquipos, onSelectEquipo }) {
  const [selected, setSelected] = useState([]);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelected([]);
      setIsConfirming(false);
    }
  }, [visible]);

  if (!availableEquipos) return null;

  const toggleSelect = (equipo) => {
    if (selected.find(e => e.id === equipo.id)) {
      setSelected(prev => prev.filter(e => e.id !== equipo.id));
    } else {
      setSelected(prev => [...prev, equipo]);
    }
  };

  const handleConfirm = async () => {
    if (selected.length === 0) return;
    setIsConfirming(true);
    await onSelectEquipo(selected);
    setIsConfirming(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Inscribir Equipos</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={28} color="#64748b" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Seleccioná los equipos que deseas inscribir en la competición:</Text>
          
          <ScrollView style={styles.list}>
            {availableEquipos.map(equipo => {
              const isSel = selected.some(s => s.id === equipo.id);
              return (
                <TouchableOpacity 
                  key={equipo.id} 
                  style={[styles.equipoCard, isSel && styles.equipoCardSelected]} 
                  onPress={() => toggleSelect(equipo)}
                >
                  <MaterialCommunityIcons 
                    name={isSel ? "checkbox-marked-circle" : "shield"} 
                    size={32} 
                    color={isSel ? "#009b3a" : (equipo.colorPrimario || '#1e293b')} 
                  />
                  <View style={styles.info}>
                    <Text style={styles.equipoName}>{equipo.nombre}</Text>
                    <Text style={styles.equipoDesc}>{equipo.descripcion || 'Sin descripción'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {availableEquipos.length === 0 && (
              <Text style={styles.emptyText}>No tienes equipos disponibles para inscribir.</Text>
            )}
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>CANCELAR</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmBtn, (selected.length === 0 || isConfirming) && styles.confirmBtnDisabled]} 
              onPress={handleConfirm}
              disabled={selected.length === 0 || isConfirming}
            >
              {isConfirming ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmText}>INSCRIBIR ({selected.length})</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 24,
    padding: 20,
    elevation: 5,
    shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.2, shadowRadius: 4
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  title: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  closeBtn: { padding: 4 },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 15, fontWeight: '600' },
  list: { flexGrow: 0 },
  equipoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  equipoCardSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  info: { flex: 1, marginLeft: 12 },
  equipoName: { fontSize: 16, fontWeight: '800', color: '#334155' },
  equipoDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 20, fontWeight: '600' },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  cancelBtn: { padding: 14, borderRadius: 12, flex: 0.45, alignItems: 'center' },
  cancelText: { color: '#64748b', fontWeight: '800' },
  confirmBtn: { backgroundColor: '#009b3a', padding: 14, borderRadius: 12, flex: 0.45, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#94a3b8' },
  confirmText: { color: '#fff', fontWeight: '900', fontSize: 12 },
});
