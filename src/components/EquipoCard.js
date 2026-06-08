import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TIPO_COLORS = { F5: '#10b981', F7: '#3b82f6', F11: '#f59e0b' };
const TIPO_LABELS = { F5: 'Fútbol 5', F7: 'Fútbol 7', F11: 'Fútbol 11' };

export default function EquipoCard({ item, canModify, onEdit, onDelete, onAddJugadores, onRemoveJugadores, onVerJugadores, onFormacion, onDefinirPosicion, necesitaPosicion, esMiembro }) {
  const tipoColor = item.tipoCancha ? TIPO_COLORS[item.tipoCancha] : null;

  const colorPrimario = item.colorPrimario || '#ffffff';
  const colorSecundario = item.colorSecundario || '#f1f5f9';

  return (
    <View style={styles.card}>
      <View style={styles.escudoContainer}>
        <MaterialCommunityIcons name="shield" size={56} color={colorPrimario} style={styles.escudoIcon} />
        <MaterialCommunityIcons name="shield-half-full" size={56} color={colorSecundario} style={styles.escudoIcon} />
      </View>
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

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{item.nombre}</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.detailSub}>{item.descripcion || 'Sin descripción'}</Text>
        </View>

        {item.capitan && (
          <View style={styles.capitanRow}>
            <Text style={styles.capitanIcon}>🏅</Text>
            <View style={styles.titleContainer}>
              <Text style={styles.capitanText}>Capitán asignado</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={onVerJugadores} style={styles.actionBtn}>
            <MaterialCommunityIcons name="eye" size={20} color="#1e293b" />
            <View style={styles.btnTextBg}><Text style={[styles.actionText, { color: '#1e293b' }]}>Ver jugadores</Text></View>
          </TouchableOpacity>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={onAddJugadores} style={styles.actionBtn}>
            <MaterialCommunityIcons name="account-plus" size={20} color="#1e293b" />
            <View style={styles.btnTextBg}><Text style={[styles.actionText, { color: '#1e293b' }]}>Agregar jugadores</Text></View>
          </TouchableOpacity>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={onRemoveJugadores} style={styles.actionBtn}>
            <MaterialCommunityIcons name="account-minus" size={20} color="#1e293b" />
            <View style={styles.btnTextBg}><Text style={[styles.actionText, { color: '#1e293b' }]}>Eliminar jugadores</Text></View>
          </TouchableOpacity>
        </View>
        
        {necesitaPosicion && (
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onDefinirPosicion} style={[styles.actionBtn, { backgroundColor: '#fef3c7', borderColor: '#f59e0b', borderWidth: 1 }]}>
              <MaterialCommunityIcons name="run-fast" size={20} color="#d97706" />
              <View style={styles.btnTextBg}><Text style={[styles.actionText, { color: '#d97706', fontWeight: '900' }]}>¡Definir mi posición!</Text></View>
            </TouchableOpacity>
          </View>
        )}

        {(canModify || esMiembro) && (
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onFormacion} style={styles.actionBtn}>
              <MaterialCommunityIcons name="soccer-field" size={20} color="#1e293b" />
              <View style={styles.btnTextBg}><Text style={[styles.actionText, { color: '#1e293b', fontWeight: '900' }]}>Formación</Text></View>
            </TouchableOpacity>
          </View>
        )}

        {canModify && (
          <>
            <View style={styles.iconRow}>
              <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
                <MaterialCommunityIcons name="pencil" size={22} color="#1e293b" />
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
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  escudoContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  escudoIcon: {
    position: 'absolute',
  },
  infoSide: { flex: 1 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 5, alignItems: 'center' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#3b82f6' },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  tipoBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.8)' },
  tipoBadgeText: { fontWeight: '900', fontSize: 10 },
  formBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.8)' },
  formBadgeText: { color: '#475569', fontWeight: '900', fontSize: 10 },
  titleContainer: { backgroundColor: 'rgba(255,255,255,0.6)', alignSelf: 'flex-start', paddingHorizontal: 4, borderRadius: 4, marginBottom: 2 },
  title: { fontSize: 17, fontWeight: '900', color: '#1e293b' },
  detailSub: { fontSize: 11, color: '#64748b', fontWeight: '700' },
  capitanRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  capitanIcon: { fontSize: 11 },
  capitanText: { fontSize: 10, color: '#475569', fontWeight: '800' },
  actions: { alignItems: 'flex-end', gap: 6 },
  actionRow: { marginBottom: 2 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 8 },
  btnTextBg: { backgroundColor: 'transparent' },
  actionText: { fontSize: 11, fontWeight: '800' },
  iconRow: { flexDirection: 'row', gap: 8, marginTop: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  iconBtn: { padding: 4 },
});
