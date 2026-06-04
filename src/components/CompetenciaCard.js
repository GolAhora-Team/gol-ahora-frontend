import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const getEstadoInfo = (item) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const parseFecha = (fechaStr) => {
    if (!fechaStr) return null;
    const parts = fechaStr.split('/');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  const inicio = parseFecha(item.fechaInicio);
  const fin = parseFecha(item.fechaFin);

  if (inicio && fin) {
    if (hoy < inicio) return { label: 'AÚN NO INICIÓ', color: '#64748b', bg: '#f1f5f9' };
    if (hoy > fin) return { label: 'FINALIZADO', color: '#ef4444', bg: '#fef2f2' };
    return { label: 'EN JUEGO', color: '#009b3a', bg: '#f0fdf4' };
  }
  if (inicio) {
    if (hoy < inicio) return { label: 'AÚN NO INICIÓ', color: '#64748b', bg: '#f1f5f9' };
    return { label: 'EN JUEGO', color: '#009b3a', bg: '#f0fdf4' };
  }
  return { label: 'SIN FECHA', color: '#94a3b8', bg: '#f8fafc' };
};

export default function CompetenciaCard({ item, canModify, onInscribir, onEliminarEquipos, onDelete, onVerFixture, onVerDetalle, onGenerarFixture, onIniciar, onEstado }) {
  const cupoCompleto = item.inscriptos >= parseInt(item.maxEquipos);
  const estadoInfo = getEstadoInfo(item);

  return (
    <View style={styles.card}>
      <View style={styles.infoSide}>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 5 }}>
          <View style={[styles.badge, { backgroundColor: item.tipo === 'LIGA' ? '#009b3a' : '#fbbf24' }]}>
            <Text style={styles.badgeText}>{item.tipo}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: estadoInfo.bg, borderWidth: 1, borderColor: estadoInfo.color }]}>
            <Text style={[styles.badgeText, { color: estadoInfo.color }]}>{estadoInfo.label}</Text>
          </View>
        </View>
        <Text style={styles.title}>{item.nombre}</Text>
        <Text style={styles.dateText}>Inicia: {item.fechaInicio}{item.fechaFin ? ` — Fin: ${item.fechaFin}` : ''}</Text>
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
          <TouchableOpacity 
            style={[styles.inscribirBtn, (item.estado === 'en_juego' || cupoCompleto) && styles.disabledBtn]} 
            onPress={(item.estado !== 'en_juego' && !cupoCompleto) ? onInscribir : null}
            disabled={item.estado === 'en_juego' || cupoCompleto}
          >
            <Text style={[styles.inscribirText, (item.estado === 'en_juego' || cupoCompleto) && styles.disabledText]}>INSCRIBIR EQUIPOS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.eliminarBtn, item.estado === 'en_juego' && styles.disabledBtn]} 
            onPress={item.estado !== 'en_juego' ? onEliminarEquipos : null}
            disabled={item.estado === 'en_juego'}
          >
            <Text style={[styles.eliminarText, item.estado === 'en_juego' && styles.disabledText]}>ELIMINAR EQUIPOS</Text>
          </TouchableOpacity>
        </View>

        {/* Row 3: GENERAR FIXTURE / INICIAR / ESTADO */}
        {item.estado === 'inscripcion' && !item.fixtureGenerado && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.generarBtn, !cupoCompleto && styles.disabledBtn]} 
              onPress={cupoCompleto ? onGenerarFixture : null}
              disabled={!cupoCompleto}
            >
              <MaterialCommunityIcons name="shuffle-variant" size={16} color={cupoCompleto ? '#fff' : '#94a3b8'} />
              <Text style={[styles.generarText, !cupoCompleto && styles.disabledText]}>GENERAR FIXTURE</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.estado === 'inscripcion' && item.fixtureGenerado && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.iniciarBtn} onPress={onIniciar}>
              <MaterialCommunityIcons name="play-circle" size={16} color="#fff" />
              <Text style={styles.iniciarText}>INICIAR</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.estado === 'en_juego' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.estadoBtn} onPress={onEstado}>
              <MaterialCommunityIcons name="chart-bar" size={16} color="#fff" />
              <Text style={styles.estadoText}>ESTADO</Text>
            </TouchableOpacity>
          </View>
        )}

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
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  title: { fontSize: 17, fontWeight: '800', color: '#1e293b' }, 
  dateText: { fontSize: 11, color: '#009b3a', fontWeight: '700', marginTop: 2 },
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
  generarText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  iniciarBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  iniciarText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  estadoBtn: { backgroundColor: '#8b5cf6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  estadoText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  disabledBtn: { backgroundColor: '#e2e8f0' },
  disabledText: { color: '#94a3b8' },
  deleteBtn: { padding: 5 }
});
