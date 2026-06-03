import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CompetenciaCard({ item, canModify, yaInscripto, onInscribir, onDelete, onVerFixture }) {
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
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.verFixtureBtn} onPress={onVerFixture}>
            <Text style={styles.verFixtureText}>VER FIXTURE</Text>
          </TouchableOpacity>
          {yaInscripto ? (
            <View style={styles.doneBadge}>
              <MaterialCommunityIcons name="check-decagram" size={16} color="#009b3a" />
              <Text style={styles.doneText}>YA INSCRIPTO</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.inscribirBtn} onPress={onInscribir}>
              <Text style={styles.inscribirText}>INSCRIBIR</Text>
            </TouchableOpacity>
          )}
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
  actions: { alignItems: 'flex-end', gap: 8, flexDirection: 'column' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verFixtureBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  verFixtureText: { color: '#1e293b', fontWeight: '900', fontSize: 11 },
  inscribirBtn: { backgroundColor: '#009b3a', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  inscribirText: { color: '#fff', fontWeight: '900', fontSize: 11 },
  doneBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 8, borderRadius: 10 },
  doneText: { color: '#009b3a', fontWeight: '900', fontSize: 11, marginLeft: 5 },
  deleteBtn: { padding: 5 }
});
