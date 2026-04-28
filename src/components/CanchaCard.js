import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CanchaCard({ item, onEdit, onDelete, canModify }) {
  const isMaint = item.enMantenimiento;

  return (
    <View style={[styles.card, isMaint && styles.cardMaint]}>
      <View style={styles.infoSide}>
        <View style={styles.headerCardRow}>
          <View style={[styles.typeBadge, isMaint && {backgroundColor: '#ef4444'}]}>
            <Text style={[styles.typeText, isMaint && {color: '#fff'}]}>
              {isMaint ? 'EN MANTENIMIENTO' : item.tipo}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.canchaTitle, isMaint && {color: '#94a3b8'}]}>{item.nombre}</Text>
        
        <View style={styles.specRow}>
          <MaterialCommunityIcons name="soccer-field" size={16} color={isMaint ? "#cbd5e1" : "#94a3b8"} />
          <Text style={[styles.specText, isMaint && {color: '#cbd5e1'}]}>{item.superficie}</Text>
          <MaterialCommunityIcons name="account-group" size={16} color={isMaint ? "#cbd5e1" : "#94a3b8"} style={{marginLeft: 10}} />
          <Text style={[styles.specText, isMaint && {color: '#cbd5e1'}]}>{item.capacidad} jugadores</Text>
        </View>
      </View>

      {canModify && (
        <View style={styles.actionSide}>
          <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
            <MaterialCommunityIcons name="pencil" size={24} color={isMaint ? "#94a3b8" : "#009b3a"} />
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
  cardMaint: { borderColor: '#ef4444', borderWidth: 1, opacity: 0.85 },
  infoSide: { flex: 1 },
  headerCardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  typeBadge: { backgroundColor: '#ffb300', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  typeText: { fontWeight: '900', fontSize: 10, color: '#000' },
  canchaTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginTop: 5 },
  specRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  specText: { color: '#64748b', fontSize: 13, marginLeft: 4, fontWeight: '600' },
  actionSide: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn: { padding: 10, borderRadius: 8 }
});