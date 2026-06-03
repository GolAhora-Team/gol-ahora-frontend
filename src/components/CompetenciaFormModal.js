import React from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CompetenciaFormModal({ visible, onClose, formData, setFormData, onSave }) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Nueva Competencia</Text>
          
          <ScrollView showsVerticalScrollIndicator={true}>
            <Text style={styles.label}>Nombre de la Liga/Torneo</Text>
            <TextInput 
              style={styles.input} 
              value={formData.nombre} 
              onChangeText={(t) => setFormData({...formData, nombre: t})}
              placeholder="Ej: Liga de los Martes"
            />

            <Text style={styles.label}>Descripción</Text>
            <TextInput 
              style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]} 
              value={formData.descripcion} 
              onChangeText={(t) => setFormData({...formData, descripcion: t})}
              placeholder="Ej: Torneo nocturno de fin de año..."
              multiline={true}
              numberOfLines={3}
            />

            <Text style={styles.label}>Tipo de Competencia</Text>
            <View style={styles.selectorRow}>
              <TouchableOpacity 
                style={[styles.selectorBtn, formData.tipo === 'LIGA' && styles.selectorActive]} 
                onPress={() => setFormData({...formData, tipo: 'LIGA', maxEquipos: '10'})}
              >
                <MaterialCommunityIcons 
                  name="format-list-numbered" 
                  size={20} 
                  color={formData.tipo === 'LIGA' ? '#fff' : '#64748b'} 
                />
                <Text style={[styles.selectorText, formData.tipo === 'LIGA' && styles.textActive]}>LIGA</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.selectorBtn, formData.tipo === 'TORNEO' && styles.selectorActive]} 
                onPress={() => setFormData({...formData, tipo: 'TORNEO', maxEquipos: '8'})}
              >
                <MaterialCommunityIcons 
                  name="tournament" 
                  size={20} 
                  color={formData.tipo === 'TORNEO' ? '#fff' : '#64748b'} 
                />
                <Text style={[styles.selectorText, formData.tipo === 'TORNEO' && styles.textActive]}>TORNEO</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Fecha de Inicio</Text>
            <TextInput 
              style={styles.input} 
              value={formData.fechaInicio} 
              onChangeText={(t) => setFormData({...formData, fechaInicio: t})}
              placeholder="DD/MM/YYYY"
            />

            <Text style={styles.label}>Cantidad de Equipos</Text>
            <View style={styles.selectorRow}>
              {(formData.tipo === 'LIGA' ? ['10', '20'] : ['4', '8', '16']).map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.selectorBtn, formData.maxEquipos === num && styles.selectorActive]}
                  onPress={() => setFormData({...formData, maxEquipos: num})}
                >
                  <Text style={[styles.selectorText, formData.maxEquipos === num && styles.textActive]}>
                    {num} equipos
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>CANCELAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
              <Text style={styles.saveText}>CREAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 25, padding: 25, width: '90%', maxWidth: 400, elevation: 10 },
  modalTitle: { color: '#1e293b', fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  label: { color: '#64748b', fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f1f5f9', color: '#1e293b', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 14 },
  selectorRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  selectorBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  selectorActive: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  selectorText: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  textActive: { color: '#fff' },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  cancelBtn: { padding: 15, borderRadius: 12, flex: 0.45, alignItems: 'center' },
  cancelText: { color: '#64748b', fontWeight: '800' },
  saveBtn: { backgroundColor: '#009b3a', padding: 15, borderRadius: 12, flex: 0.45, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '900' }
});
