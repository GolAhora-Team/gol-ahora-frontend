import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TIPO_COLORS = { F5: '#10b981', F7: '#3b82f6', F11: '#f59e0b' };
const TIPO_LABELS = { F5: 'Fútbol 5', F7: 'Fútbol 7', F11: 'Fútbol 11' };

export default function EquipoCard({ item, canModify, onEdit, onDelete, onAddJugadores, onRemoveJugadores, onVerJugadores, onFormacion }) {
  const tipoColor = item.tipoCancha ? TIPO_COLORS[item.tipoCancha] : null;

  return (
    <View style={styles.card}>
      <View style={styles.infoSide}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>EQUIPO</Text>
          </View>
          {item.tipoCancha && (
            <View style={[styles.tipoBadge, { backgroundColor: tipoColor + '22' }]}>
              <Text style={[styles.tipoBadgeText, { color: tipoColor }]}>
                {TIPO_LABELS[item.tipoCancha]}
              </Text>
            </View>
          )}
          {item.formacion && (
            <View style={styles.formBadge}>
              <Text style={styles.formBadgeText}>{item.formacion}</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{item.nombre}</Text>
        <Text style={styles.detailSub}>{item.descripcion || 'Sin descripción'}</Text>

        {item.capitan && (
          <View style={styles.capitanRow}>
            <Text style={styles.capitanIcon}>🏅</Text>
            <Text style={styles.capitanText}>Capitán asignado</Text>
          </View>
        )}
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
            <Text style={[styles.actionText, { color: '#f59e0b' }]}>Eliminar jugadores</Text>
          </TouchableOpacity>
        </View>
        {canModify && (
          <>
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={onFormacion} style={styles.actionBtn}>
                <MaterialCommunityIcons name="soccer-field" size={20} color="#009b3a" />
                <Text style={[styles.actionText, { color: '#009b3a', fontWeight: '900' }]}>Formación</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.iconRow}>
              <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
                <MaterialCommunityIcons name="pencil" size={22} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
                <MaterialCommunityIcons name="trash-can-outline" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </>
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
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 5, alignItems: 'center' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#3b82f6' },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  tipoBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tipoBadgeText: { fontWeight: '900', fontSize: 10 },
  formBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#f1f5f9' },
  formBadgeText: { color: '#475569', fontWeight: '900', fontSize: 10 },
  title: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  detailSub: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '600' },
  capitanRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  capitanIcon: { fontSize: 11 },
  capitanText: { fontSize: 10, color: '#92400e', fontWeight: '700' },
  actions: { alignItems: 'flex-end', gap: 6 },
  actionRow: { marginBottom: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 11, fontWeight: '700', color: '#009b3a' },
  iconRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  iconBtn: { padding: 4 },
});
