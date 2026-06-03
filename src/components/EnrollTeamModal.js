import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EnrollTeamModal({ visible, onClose, availableEquipos, onSelectEquipo }) {
  if (!availableEquipos) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Seleccionar Equipo</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={28} color="#64748b" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Elige qué equipo deseas inscribir en la competición:</Text>
          
          <ScrollView style={styles.list}>
            {availableEquipos.map(equipo => (
              <TouchableOpacity key={equipo.id} style={styles.equipoCard} onPress={() => onSelectEquipo(equipo)}>
                <MaterialCommunityIcons name="shield" size={32} color={equipo.colorPrimario || '#1e293b'} />
                <View style={styles.info}>
                  <Text style={styles.equipoName}>{equipo.nombre}</Text>
                  <Text style={styles.equipoDesc}>{equipo.descripcion || 'Sin descripción'}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
            {availableEquipos.length === 0 && (
              <Text style={styles.emptyText}>No tienes equipos disponibles para inscribir.</Text>
            )}
          </ScrollView>
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
  info: { flex: 1, marginLeft: 12 },
  equipoName: { fontSize: 16, fontWeight: '800', color: '#334155' },
  equipoDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 20, fontWeight: '600' }
});
