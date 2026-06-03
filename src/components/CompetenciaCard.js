import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CompetenciaCard({ item, canModify, onInscribir, onEliminarEquipos, onDelete, onVerFixture, onVerDetalle, onGenerarFixture }) {
  const cupoCompleto = item.inscriptos >= parseInt(item.maxEquipos);

  return (
    <View style={styles.card}>
      <View style={styles.infoSide}>
        <View style={[styles.badge, { backgroundColor: item.tipo === 'LIGA' ? '#009b3a' : '#fbbf24' }]}>
          <Text style={styles.badgeText}>{item.tipo}</Text>
        </View>
        <Text style={styles.title}>{item.nombre}</Text>
        <Text style={styles.dateText}>Inicia: {item.fechaInicio}</Text>
        <Text style={styles.detail}>Cupos: {item.inscriptos} / {item.maxEquipos}</Text>
      </View>

      <View style={styles.actions}>
        {/* Row 1: VER + FIXTURE */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={onVerDetalle}>
            <Text style={styles.actionBtnText}>VER</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onVerFixture}>
            <Text style={styles.actionBtnText}>FIXTURE</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: INSCRIBIR EQUIPOS + ELIMINAR EQUIPOS */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.inscribirBtn} onPress={onInscribir}>
            <Text style={styles.inscribirText}>INSCRIBIR EQUIPOS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.eliminarBtn} onPress={onEliminarEquipos}>
            <Text style={styles.eliminarText}>ELIMINAR EQUIPOS</Text>
          </TouchableOpacity>
        </View>

        {/* Row 3: GENERAR FIXTURE (disabled if not enough teams) */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.generarBtn, !cupoCompleto && styles.generarBtnDisabled]} 
            onPress={cupoCompleto ? onGenerarFixture : null}
            disabled={!cupoCompleto}
          >
            <MaterialCommunityIcons name="shuffle-variant" size={16} color={cupoCompleto ? '#fff' : '#94a3b8'} />
            <Text style={[styles.generarText, !cupoCompleto && styles.generarTextDisabled]}>GENERAR FIXTURE</Text>
          </TouchableOpacity>
        </View>

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
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 5 },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  title: { fontSize: 17, fontWeight: '800', color: '#1e293b' }, 
  dateText: { fontSize: 12, color: '#009b3a', fontWeight: '700', marginTop: 2 },
  detail: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '600' },
  actions: { alignItems: 'flex-end', gap: 6, flexDirection: 'column' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  actionBtnText: { color: '#1e293b', fontWeight: '900', fontSize: 11 },
  inscribirBtn: { backgroundColor: '#009b3a', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  inscribirText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  eliminarBtn: { backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  eliminarText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  generarBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  generarBtnDisabled: { backgroundColor: '#e2e8f0' },
  generarText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  generarTextDisabled: { color: '#94a3b8' },
  deleteBtn: { padding: 5 }
});
