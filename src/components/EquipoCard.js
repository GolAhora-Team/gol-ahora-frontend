import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EquipoCard({ item, canModify, onEdit, onDelete, onAddJugadores, onRemoveJugadores, onVerJugadores }) {
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
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={onVerJugadores} style={styles.actionBtn}>
            <MaterialCommunityIcons name="eye" size={20} color="#6366f1" />
            <Text style={[styles.actionText, { color: '#6366f1' }]}>Ver jugadores</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={onAddJugadores} style={styles.actionBtn}>
            <MaterialCommunityIcons name="account-plus" size={20} color="#009b3a" />
            <Text style={styles.actionText}>Agregar jugadores</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={onRemoveJugadores} style={styles.actionBtn}>
            <MaterialCommunityIcons name="account-minus" size={20} color="#f59e0b" />
            <Text style={[styles.actionText, {color: '#f59e0b'}]}>Eliminar jugadores</Text>
          </TouchableOpacity>
        </View>
        {canModify && (
          <View style={styles.iconRow}>
            <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
              <MaterialCommunityIcons name="pencil" size={22} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
              <MaterialCommunityIcons name="trash-can-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>
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
  detailSub: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '600' },
  actions: { alignItems: 'flex-end', gap: 6 },
  actionRow: { marginBottom: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 11, fontWeight: '700', color: '#009b3a' },
  iconRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  iconBtn: { padding: 4 }
});
