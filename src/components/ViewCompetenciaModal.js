import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ViewCompetenciaModal({ visible, onClose, competicion }) {
  if (!competicion) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="trophy" size={28} color="#009b3a" />
            <Text style={styles.modalTitle}>Detalles de Competencia</Text>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={styles.scrollContent}>
            <View style={styles.infoGroup}>
              <Text style={styles.label}>Nombre</Text>
              <Text style={styles.value}>{competicion.nombre}</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.infoGroup, { flex: 1 }]}>
                <Text style={styles.label}>Tipo</Text>
                <View style={[styles.badge, { backgroundColor: competicion.tipo === 'LIGA' ? '#009b3a' : '#fbbf24' }]}>
                  <Text style={styles.badgeText}>{competicion.tipo}</Text>
                </View>
              </View>
              <View style={[styles.infoGroup, { flex: 1 }]}>
                <Text style={styles.label}>Tipo de Cancha</Text>
                <View style={styles.badgeNeutral}>
                  <Text style={styles.badgeNeutralText}>Fútbol {competicion.tipoCancha || 5}</Text>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.infoGroup, { flex: 1 }]}>
                <Text style={styles.label}>Estado</Text>
                <Text style={styles.value}>{competicion.estado.replace('_', ' ').toUpperCase()}</Text>
              </View>
              <View style={[styles.infoGroup, { flex: 1 }]}>
                <Text style={styles.label}>Equipos</Text>
                <Text style={styles.value}>{competicion.inscriptos} / {competicion.maxEquipos}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.infoGroup, { flex: 1 }]}>
                <Text style={styles.label}>Fecha de Inicio</Text>
                <Text style={styles.value}>{competicion.fechaInicio || 'Sin definir'}</Text>
              </View>
              <View style={[styles.infoGroup, { flex: 1 }]}>
                <Text style={styles.label}>Fecha de Finalización</Text>
                <Text style={styles.value}>{competicion.fechaFin || 'Sin definir'}</Text>
              </View>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.label}>Descripción</Text>
              <Text style={styles.value}>{competicion.descripcion || 'Sin descripción'}</Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>CERRAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 25, padding: 25, width: '90%', maxWidth: 400, elevation: 10, maxHeight: '80%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  modalTitle: { color: '#1e293b', fontSize: 20, fontWeight: '900' },
  scrollContent: { paddingBottom: 10 },
  row: { flexDirection: 'row', gap: 15 },
  infoGroup: { marginBottom: 15 },
  label: { color: '#64748b', fontSize: 12, fontWeight: '800', marginBottom: 4 },
  value: { color: '#1e293b', fontSize: 16, fontWeight: '600' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  badgeNeutral: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#e2e8f0' },
  badgeNeutralText: { color: '#64748b', fontSize: 12, fontWeight: '800' },
  closeBtn: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  closeText: { color: '#1e293b', fontWeight: '800', fontSize: 14 }
});
