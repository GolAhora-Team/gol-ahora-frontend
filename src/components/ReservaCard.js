import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ReservaCard({ item, onEdit, onDelete, canModify }) {
  return (
    <View style={styles.card}>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{item.horaInicio}</Text>
        <View style={styles.timeDivider} />
        <Text style={styles.timeText}>{item.horaFin}</Text>
      </View>

      <View style={styles.infoSide}>
        <Text style={styles.canchaName}>{item.canchaNombre}</Text>
        <Text style={styles.clienteName}>{item.clienteNombre}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.estado.toUpperCase()}</Text>
        </View>
      </View>

      {canModify && (
        <View style={styles.actionSide}>
          <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
            <MaterialCommunityIcons name="pencil" size={24} color="#009b3a" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item)} style={styles.actionBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  timeContainer: { alignItems: 'center', paddingRight: 15, borderRightWidth: 1, borderRightColor: '#f1f5f9', width: 80 },
  timeText: { fontSize: 16, fontWeight: '900', color: '#009b3a' },
  timeDivider: { height: 2, width: 20, backgroundColor: '#ffb300', marginVertical: 4 },
  infoSide: { flex: 1, paddingLeft: 15 },
  canchaName: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  clienteName: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  statusBadge: { backgroundColor: '#f1f5f9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 5 },
  statusText: { fontSize: 10, fontWeight: '900', color: '#475569' },
  actionSide: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn: { padding: 8 }
});