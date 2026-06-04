import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DatePickerModal from './DatePickerModal';

const formatDateInput = (text, previousText) => {
  // Remove all non-numeric characters
  const digits = text.replace(/\D/g, '');
  
  // Limit to 8 digits (DDMMYYYY)
  const limited = digits.substring(0, 8);
  
  // Auto-insert slashes
  if (limited.length <= 2) return limited;
  if (limited.length <= 4) return `${limited.substring(0, 2)}/${limited.substring(2)}`;
  return `${limited.substring(0, 2)}/${limited.substring(2, 4)}/${limited.substring(4)}`;
};

export default function CompetenciaFormModal({ visible, onClose, formData, setFormData, onSave }) {
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [activeDateField, setActiveDateField] = useState('');

  const handleDateChange = (field, text) => {
    const formatted = formatDateInput(text, formData[field]);
    setFormData({...formData, [field]: formatted});
  };

  const handleDateSelect = (dateStr) => {
    // dateStr comes as YYYY-MM-DD. Convert to DD/MM/AAAA
    const [y, m, d] = dateStr.split('-');
    const formatted = `${d}/${m}/${y}`;
    setFormData({...formData, [activeDateField]: formatted});
  };

  const openDatePicker = (field) => {
    setActiveDateField(field);
    setDatePickerVisible(true);
  };

  // Convert DD/MM/AAAA to YYYY-MM-DD for the date picker initial value
  const getInitialDate = (field) => {
    const val = formData[field];
    if (val && val.length === 10) {
      const [d, m, y] = val.split('/');
      return `${y}-${m}-${d}`;
    }
    return '';
  };

  const getMinDate = () => {
    if (activeDateField === 'fechaFin' && formData.fechaInicio) {
      const [d, m, y] = formData.fechaInicio.split('/');
      if (d && m && y) return `${y}-${m}-${d}`;
    }
    return new Date().toISOString().split('T')[0];
  };

  const handleSaveLocal = () => {
    if (!formData.nombre || !formData.tipo || !formData.maxEquipos || !formData.fechaInicio || !formData.fechaFin) {
      Alert.alert("Campos incompletos", "Por favor completa todos los campos requeridos para crear la competición.");
      return;
    }
    onSave();
  };

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
                onPress={() => setFormData({...formData, tipo: 'LIGA', maxEquipos: '8'})}
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
            <TouchableOpacity onPress={() => openDatePicker('fechaInicio')} style={styles.dateInputContainer} activeOpacity={0.7}>
              <TextInput 
                style={[styles.input, { flex: 1, borderWidth: 0, color: '#1e293b' }]} 
                value={formData.fechaInicio} 
                placeholder="DD/MM/AAAA"
                editable={false}
                pointerEvents="none"
              />
              <View style={styles.calendarIconBtn}>
                <MaterialCommunityIcons name="calendar-range" size={24} color="#009b3a" />
              </View>
            </TouchableOpacity>

            <Text style={styles.label}>Fecha de Finalización</Text>
            <TouchableOpacity 
              onPress={() => {
                if (!formData.fechaInicio) {
                  Alert.alert("Atención", "Debes seleccionar una fecha de inicio primero.");
                  return;
                }
                openDatePicker('fechaFin');
              }} 
              style={[styles.dateInputContainer, !formData.fechaInicio && { opacity: 0.5 }]} 
              activeOpacity={0.7}
            >
              <TextInput 
                style={[styles.input, { flex: 1, borderWidth: 0, color: '#1e293b' }]} 
                value={formData.fechaFin} 
                placeholder="DD/MM/AAAA"
                editable={false}
                pointerEvents="none"
              />
              <View style={styles.calendarIconBtn}>
                <MaterialCommunityIcons name="calendar-range" size={24} color="#009b3a" />
              </View>
            </TouchableOpacity>

            <Text style={styles.label}>Tipo de Cancha</Text>
            <View style={styles.selectorRow}>
              {[5, 7, 11].map((cancha) => (
                <TouchableOpacity
                  key={cancha}
                  style={[styles.selectorBtn, formData.tipoCancha === cancha && styles.selectorActive]}
                  onPress={() => setFormData({...formData, tipoCancha: cancha})}
                >
                  <Text style={[styles.selectorText, formData.tipoCancha === cancha && styles.textActive]}>
                    Cancha de {cancha}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveLocal}>
              <Text style={styles.saveText}>CREAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <DatePickerModal 
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={handleDateSelect}
        initialDate={getInitialDate(activeDateField)}
        minDate={getMinDate()}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 25, padding: 25, width: '90%', maxWidth: 400, elevation: 10, maxHeight: '85%' },
  modalTitle: { color: '#1e293b', fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  label: { color: '#64748b', fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f1f5f9', color: '#1e293b', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 14 },
  dateInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  calendarIconBtn: { padding: 10, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' },
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
