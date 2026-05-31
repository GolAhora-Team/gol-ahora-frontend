import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EquipoCard({ item, canModify, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.infoSide}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>EQUIPO</Text>
        </View>
        <Text style={styles.title}>{item.nombre}</Text>
        <Text style={styles.detailSub}>{item.descripcion || 'Sin descripción'}</Text>
      </View>

      <View style={styles.actions}>
        {canModify && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 15, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoSide: { flex: 1 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 5, backgroundColor: '#3b82f6' },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  title: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  detail: { fontSize: 12, color: '#009b3a', fontWeight: '700', marginTop: 2 },
  detailSub: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '600' },
  actions: { alignItems: 'flex-end', gap: 10 },
  deleteBtn: { padding: 5 }
});
