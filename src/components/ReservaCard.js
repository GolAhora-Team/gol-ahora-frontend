import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ReservaCard({ item, onEdit, onDelete, onView, canModify }) {
  const formatFecha = (fecha) => {
    if (!fecha) return '';
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    } catch { return ''; }
  };

  return (
    <View style={styles.card}>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{item.horaInicio}</Text>
        <View style={styles.timeDivider} />
        <Text style={styles.timeText}>{item.horaFin}</Text>
        {item.fecha && (
          <Text style={styles.dateText}>{formatFecha(item.fecha)}</Text>
        )}
      </View>

      <View style={styles.infoSide}>
        <Text style={styles.canchaName}>{item.canchaNombre}</Text>
        <Text style={styles.clienteName}>{item.clienteNombre}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{(item.estado || '').toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.actionSide}>
        {/* Botón ojo para ver detalle */}
        {onView && (
          <TouchableOpacity onPress={() => onView(item)} style={[styles.actionBtn, { backgroundColor: '#f0f9ff' }]}>
            <MaterialCommunityIcons name="eye-outline" size={22} color="#3b82f6" />
          </TouchableOpacity>
        )}

        {canModify && (
          <TouchableOpacity onPress={() => onDelete(item)} style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]}>
            <MaterialCommunityIcons name="trash-can-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  timeContainer: { alignItems: 'center', paddingRight: 15, borderRightWidth: 1, borderRightColor: '#f1f5f9', width: 80 },
  timeText: { fontSize: 16, fontWeight: '900', color: '#009b3a' },
  timeDivider: { height: 2, width: 20, backgroundColor: '#ffb300', marginVertical: 4 },
  dateText: { fontSize: 10, fontWeight: '700', color: '#94a3b8', marginTop: 4 },
  infoSide: { flex: 1, paddingLeft: 15 },
  canchaName: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  clienteName: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  statusBadge: { backgroundColor: '#f1f5f9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 5 },
  statusText: { fontSize: 10, fontWeight: '900', color: '#475569' },
  actionSide: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn: { padding: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }
});