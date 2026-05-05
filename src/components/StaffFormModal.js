import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function StaffFormModal({ visible, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    especialidad: '',
    certificado: '', // ✅ RF-PE-01: Registro de certificación deportiva
    email: '',
    role: 'PROFE'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ nombre: '', apellido: '', especialidad: '', certificado: '', email: '', role: 'PROFE' });
    }
  }, [initialData, visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{initialData ? 'Editar Profesor' : 'Nuevo Profesor'}</Text>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput 
              style={styles.input} 
              value={formData.nombre} 
              onChangeText={(t) => setFormData({...formData, nombre: t})}
            />

            <Text style={styles.label}>Apellido</Text>
            <TextInput 
              style={styles.input} 
              value={formData.apellido} 
              onChangeText={(t) => setFormData({...formData, apellido: t})}
            />

            <Text style={styles.label}>Especialidad (F5, F11, etc.)</Text>
            <TextInput 
              style={styles.input} 
              value={formData.especialidad} 
              onChangeText={(t) => setFormData({...formData, especialidad: t})}
              placeholder="Ej: Entrenamiento de Arqueros"
            />

            {/* ✅ RF-PE-01: Campo obligatorio para certificación */}
            <Text style={styles.label}>Nro. de Certificación Deportiva</Text>
            <TextInput 
              style={[styles.input, { borderColor: '#009b3a', borderWidth: 1.5 }]} 
              value={formData.certificado} 
              onChangeText={(t) => setFormData({...formData, certificado: t})}
              placeholder="Obligatorio para el alta"
            />

            <Text style={styles.label}>Email de Contacto</Text>
            <TextInput 
              style={styles.input} 
              value={formData.email} 
              keyboardType="email-address"
              onChangeText={(t) => setFormData({...formData, email: t})}
            />
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>CANCELAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={() => onSave(formData)}>
              <Text style={styles.saveText}>GUARDAR</Text>
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
  input: { backgroundColor: '#f1f5f9', color: '#1e293b', padding: 12, borderRadius: 12, fontSize: 14 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  cancelBtn: { padding: 15, borderRadius: 12, flex: 0.45, alignItems: 'center' },
  cancelText: { color: '#64748b', fontWeight: '800' },
  saveBtn: { backgroundColor: '#009b3a', padding: 15, borderRadius: 12, flex: 0.45, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '900' }
});