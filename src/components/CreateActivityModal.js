import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { profesorService } from '../services/profesorService';

export default function CreateActivityModal({ visible, onClose, onSave, title, type }) {
  const [formData, setFormData] = useState({
    nombre: '',
    horario: '',
    maxAlumnos: '20',
    profesorId: null
  });
  
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      loadProfesores();
      setFormData({ nombre: '', horario: '', maxAlumnos: '20', profesorId: null });
    }
  }, [visible]);

  const loadProfesores = async () => {
    setLoading(true);
    try {
      const data = await profesorService.getAll();
      setProfesores(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.horario || !formData.maxAlumnos) {
      Alert.alert('Atención', 'Nombre, horario y capacidad son obligatorios.');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        nombre: formData.nombre,
        horario: formData.horario,
        maxAlumnos: parseInt(formData.maxAlumnos) || 20,
        capacidad: parseInt(formData.maxAlumnos) || 20, // por si el back usa otro nombre
        profesorId: formData.profesorId,
        clientes: [] // Lista vacía por defecto
      };
      
      await onSave(payload, type);
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo crear la actividad.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={28} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ej: Fútbol 5 Inicial"
              value={formData.nombre}
              onChangeText={text => setFormData({...formData, nombre: text})}
            />

            <Text style={styles.label}>Horario</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ej: Lunes y Miércoles 18:00"
              value={formData.horario}
              onChangeText={text => setFormData({...formData, horario: text})}
            />

            <Text style={styles.label}>Capacidad Máxima</Text>
            <TextInput 
              style={styles.input} 
              placeholder="20"
              keyboardType="numeric"
              value={formData.maxAlumnos}
              onChangeText={text => setFormData({...formData, maxAlumnos: text.replace(/[^0-9]/g, '')})}
            />

            <Text style={styles.label}>Profesor (Opcional)</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#009b3a" style={{ alignSelf: 'flex-start', marginVertical: 10 }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
                <TouchableOpacity 
                  style={[styles.profCard, formData.profesorId === null && styles.profCardSelected]}
                  onPress={() => setFormData({...formData, profesorId: null})}
                >
                  <MaterialCommunityIcons name="account-cancel" size={24} color={formData.profesorId === null ? '#fff' : '#64748b'} />
                  <Text style={[styles.profName, formData.profesorId === null && { color: '#fff' }]}>Sin Asignar</Text>
                </TouchableOpacity>

                {profesores.map(p => (
                  <TouchableOpacity 
                    key={p.id} 
                    style={[styles.profCard, formData.profesorId === p.id && styles.profCardSelected]}
                    onPress={() => setFormData({...formData, profesorId: p.id})}
                  >
                    <MaterialCommunityIcons name="whistle" size={24} color={formData.profesorId === p.id ? '#fff' : '#009b3a'} />
                    <Text style={[styles.profName, formData.profesorId === p.id && { color: '#fff' }]}>{p.nombre} {p.apellido}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </ScrollView>

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'GUARDANDO...' : 'CREAR ACTIVIDAD'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 25, width: '100%', maxWidth: 500, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  label: { fontSize: 13, fontWeight: '800', color: '#64748b', marginBottom: 5, marginTop: 15 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 15, color: '#1e293b' },
  hScroll: { flexDirection: 'row', paddingBottom: 10, marginTop: 5 },
  profCard: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, marginRight: 10, alignItems: 'center', width: 110 },
  profCardSelected: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  profName: { fontSize: 12, fontWeight: '700', color: '#1e293b', marginTop: 5, textAlign: 'center' },
  saveBtn: { backgroundColor: '#009b3a', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 }
});
