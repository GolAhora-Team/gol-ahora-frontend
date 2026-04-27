import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function UserCard({ item, onEdit, onDelete, canModify }) {
  return (
    <View style={styles.userCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{item.nombre} {item.apellido}</Text>
        <Text style={styles.cardInfo}>DNI: {item.dni} • Tel: {item.telefono || 'N/A'}</Text>
        <Text style={styles.cardMail}>{item.email}</Text>
      </View>
      {canModify && (
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => onEdit(item)} style={{ marginRight: 10 }}>
            <MaterialCommunityIcons name="pencil-circle" size={36} color="#009b3a" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item)}>
            <MaterialCommunityIcons name="delete-circle" size={36} color="#ff4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  userCard: { backgroundColor: '#fff', borderRadius: 18, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  cardName: { fontSize: 17, fontWeight: '800', color: '#009b3a' },
  cardInfo: { fontSize: 11, color: '#64748b', fontWeight: '700', marginTop: 2 },
  cardMail: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
});