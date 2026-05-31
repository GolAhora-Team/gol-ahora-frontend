import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EquipoFormModal({ visible, onClose, onSave, competencias }) {
  const initialState = {
    nombre: '',
    descripcion: '',
    cantidadMaxJugadores: '',
    competicionId: ''
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

    if (!formData.cantidadMaxJugadores) {
      newErrors.cantidadMaxJugadores = 'La cantidad de jugadores es obligatoria.';
      valid = false;
    } else {
      const cant = parseInt(formData.cantidadMaxJugadores, 10);
      if (isNaN(cant) || cant < 5 || cant > 16) {
        newErrors.cantidadMaxJugadores = 'Debe ser un número entre 5 y 16.';
        valid = false;
      }
    }

    if (!formData.competicionId) {
      newErrors.competicionId = 'Debe seleccionar una competencia.';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSave = () => {
    if (validate()) {
      onSave({
        ...formData,
        cantidadMaxJugadores: parseInt(formData.cantidadMaxJugadores, 10)
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

            <Text style={styles.label}>Cantidad de Jugadores * (Mín. 5 - Máx. 16)</Text>
            <TextInput 
              style={[styles.input, errors.cantidadMaxJugadores && styles.inputError]} 
              value={formData.cantidadMaxJugadores} 
              keyboardType="numeric"
              onChangeText={(t) => setFormData({...formData, cantidadMaxJugadores: t.replace(/[^0-9]/g, '')})}
              placeholder="Ej: 11"
            />
            {errors.cantidadMaxJugadores && <Text style={styles.errorText}>{errors.cantidadMaxJugadores}</Text>}

            <Text style={styles.label}>Descripción</Text>
            <TextInput 
              style={styles.input} 
              value={formData.descripcion} 
              onChangeText={(t) => setFormData({...formData, descripcion: t})}
              placeholder="Ej: Equipo amateur de la zona sur"
              multiline
            />

            <Text style={styles.label}>Competencia *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.competicionesScroll}>
              {competencias.map(comp => (
                <TouchableOpacity 
                  key={comp.id}
                  style={[styles.selectorBtn, formData.competicionId === comp.id && styles.selectorActive]} 
                  onPress={() => setFormData({...formData, competicionId: comp.id})}
                >
                  <MaterialCommunityIcons 
                    name={comp.tipo === 'LIGA' ? "format-list-numbered" : "tournament"} 
                    size={20} 
                    color={formData.competicionId === comp.id ? '#fff' : '#64748b'} 
                  />
                  <Text style={[styles.selectorText, formData.competicionId === comp.id && styles.textActive]}>
                    {comp.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.competicionId && <Text style={styles.errorText}>{errors.competicionId}</Text>}
            {competencias.length === 0 && (
              <Text style={styles.warningText}>No hay competencias disponibles. Debe crear una competencia primero.</Text>
            )}

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
  warningText: { color: '#f59e0b', fontSize: 11, marginTop: 4, fontWeight: '600' },
  competicionesScroll: { flexDirection: 'row', paddingVertical: 5 },
  selectorBtn: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 10 },
  selectorActive: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  selectorText: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  textActive: { color: '#fff' },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  cancelBtn: { padding: 15, borderRadius: 12, flex: 0.45, alignItems: 'center' },
  cancelText: { color: '#64748b', fontWeight: '800' },
  saveBtn: { backgroundColor: '#009b3a', padding: 15, borderRadius: 12, flex: 0.45, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '900' }
});
