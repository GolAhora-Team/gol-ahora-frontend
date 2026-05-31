import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';

export default function EquipoFormModal({ visible, onClose, onSave }) {
  const initialState = {
    nombre: '',
    descripcion: ''
  };

  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});

  const validate = () => {
    let valid = true;
    let newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio.';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSave = () => {
    if (validate()) {
      onSave({
        ...formData,
        cantidadMaxJugadores: 0,
        competicionId: 0
      });
      setFormData(initialState);
    } else {
      Alert.alert('Error', 'Por favor, corrija los errores en el formulario.');
    }
  };

  const handleClose = () => {
    setFormData(initialState);
    setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Agregar Equipo</Text>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Nombre del Equipo *</Text>
            <TextInput 
              style={[styles.input, errors.nombre && styles.inputError]} 
              value={formData.nombre} 
              onChangeText={(t) => setFormData({...formData, nombre: t})}
              placeholder="Ej: Los Pumas"
            />
            {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}

            <Text style={styles.label}>Descripción</Text>
            <TextInput 
              style={styles.input} 
              value={formData.descripcion} 
              onChangeText={(t) => setFormData({...formData, descripcion: t})}
              placeholder="Ej: Equipo amateur de la zona sur"
              multiline
            />
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>CANCELAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>REGISTRAR EQUIPO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 25, padding: 25, width: '90%', maxWidth: 400, elevation: 10, maxHeight: '80%' },
  modalTitle: { color: '#1e293b', fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  label: { color: '#64748b', fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f1f5f9', color: '#1e293b', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 14 },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  errorText: { color: '#ef4444', fontSize: 11, marginTop: 4, fontWeight: '600' },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  cancelBtn: { padding: 15, borderRadius: 12, flex: 0.45, alignItems: 'center' },
  cancelText: { color: '#64748b', fontWeight: '800' },
  saveBtn: { backgroundColor: '#009b3a', padding: 15, borderRadius: 12, flex: 0.45, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '900' }
});
