import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { profesorService } from '../services/profesorService';

const DIAS = [
  { key: 'Lun', label: 'Lun' },
  { key: 'Mar', label: 'Mar' },
  { key: 'Mié', label: 'Mié' },
  { key: 'Jue', label: 'Jue' },
  { key: 'Vie', label: 'Vie' },
  { key: 'Sáb', label: 'Sáb' },
  { key: 'Dom', label: 'Dom' },
];

export default function CreateActivityModal({ visible, onClose, onSave, title, type }) {
  const [formData, setFormData] = useState({
    nombre: '',
    diasSeleccionados: [],
    horaInicio: '',
    horaFin: '',
    maxAlumnos: '20',
    profesorId: null,
    precio: '5000'
  });
  
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      loadProfesores();
      setFormData({ nombre: '', diasSeleccionados: [], horaInicio: '', horaFin: '', maxAlumnos: '20', profesorId: null, precio: '5000' });
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

  const toggleDia = (diaKey) => {
    setFormData(prev => {
      const dias = prev.diasSeleccionados.includes(diaKey)
        ? prev.diasSeleccionados.filter(d => d !== diaKey)
        : [...prev.diasSeleccionados, diaKey];
      return { ...prev, diasSeleccionados: dias };
    });
  };

  const buildHorarioString = () => {
    const diasStr = formData.diasSeleccionados.join(', ');
    if (!diasStr) return '';
    return `${diasStr} ${formData.horaInicio}-${formData.horaFin}`;
  };

  // Formatea una hora "HH:mm" o "HH:mm:ss" a siempre devolver "HH:mm:ss"
  const formatTimeSpan = (hora) => {
    if (!hora) return '00:00:00';
    const parts = hora.trim().split(':');
    const h = parts[0]?.padStart(2, '0') || '00';
    const m = parts[1]?.padStart(2, '0') || '00';
    const s = parts[2]?.padStart(2, '0') || '00';
    return `${h}:${m}:${s}`;
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      Alert.alert('Atención', 'El nombre es obligatorio.');
      return;
    }
    if (formData.diasSeleccionados.length === 0) {
      Alert.alert('Atención', 'Seleccioná al menos un día.');
      return;
    }
    if (!formData.horaInicio || !formData.horaFin) {
      Alert.alert('Atención', 'Ingresá la hora de inicio y fin.');
      return;
    }
    if (!formData.profesorId) {
      Alert.alert('Atención', 'Debes seleccionar un Profesor. El profesor debe tener certificado vigente.');
      return;
    }
    
    setSaving(true);
    try {
      // Usar +3 días para evitar problemas de zona horaria con la validación del backend (DateTime.UtcNow)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const safeFecha = futureDate.toISOString();

      let payload;
      if (type === 'CLASE') {
        payload = {
          nombre: formData.nombre.trim(),
          descripcion: buildHorarioString(),
          capacidadMax: parseInt(formData.maxAlumnos) || 20,
          fecha: safeFecha,
          horaInicio: formatTimeSpan(formData.horaInicio),
          horaFin: formatTimeSpan(formData.horaFin),
          precioInscripcion: parseFloat(formData.precio) || 5000,
          profesorId: parseInt(formData.profesorId)
        };
      } else {
        payload = {
          nombre: formData.nombre.trim(),
          fecha: safeFecha,
          cupoMaximo: parseInt(formData.maxAlumnos) || 20,
          profesorId: parseInt(formData.profesorId)
        };
      }
      
      await onSave(payload, type);
      onClose();
    } catch (error) {
      // Mostramos el mensaje de error devuelto por el backend al usuario
      const msg = error?.message || 'No se pudo guardar. Verificá los datos e intentá nuevamente.';
      Alert.alert('Error al guardar', msg);
      console.error('[CreateActivityModal] Error al guardar:', error);
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
              placeholderTextColor="#94a3b8"
              value={formData.nombre}
              onChangeText={text => setFormData({...formData, nombre: text})}
            />

            {/* SELECTOR DE DÍAS */}
            <Text style={styles.label}>Días de la semana</Text>
            <View style={styles.diasGrid}>
              {DIAS.map(dia => {
                const isSelected = formData.diasSeleccionados.includes(dia.key);
                return (
                  <TouchableOpacity
                    key={dia.key}
                    style={[styles.diaBtn, isSelected && styles.diaBtnSelected]}
                    onPress={() => toggleDia(dia.key)}
                  >
                    <Text style={[styles.diaBtnText, isSelected && styles.diaBtnTextSelected]}>
                      {dia.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* HORARIO: INICIO Y FIN */}
            <Text style={styles.label}>Horario</Text>
            <View style={styles.horarioRow}>
              <View style={styles.horarioField}>
                <Text style={styles.horarioLabel}>Inicio</Text>
                <TextInput
                  style={styles.horarioInput}
                  placeholder="18:00"
                  placeholderTextColor="#94a3b8"
                  value={formData.horaInicio}
                  onChangeText={text => setFormData({...formData, horaInicio: text})}
                />
              </View>
              <View style={styles.horarioSeparator}>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#64748b" />
              </View>
              <View style={styles.horarioField}>
                <Text style={styles.horarioLabel}>Fin</Text>
                <TextInput
                  style={styles.horarioInput}
                  placeholder="19:30"
                  placeholderTextColor="#94a3b8"
                  value={formData.horaFin}
                  onChangeText={text => setFormData({...formData, horaFin: text})}
                />
              </View>
            </View>

            {/* PREVIEW */}
            {formData.diasSeleccionados.length > 0 && formData.horaInicio && formData.horaFin && (
              <View style={styles.previewBox}>
                <MaterialCommunityIcons name="calendar-clock" size={16} color="#009b3a" />
                <Text style={styles.previewText}>{buildHorarioString()}</Text>
              </View>
            )}

            <Text style={styles.label}>Capacidad Máxima</Text>
            <TextInput 
              style={styles.input} 
              placeholder="20"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={formData.maxAlumnos}
              onChangeText={text => setFormData({...formData, maxAlumnos: text.replace(/[^0-9]/g, '')})}
            />

            <Text style={styles.label}>Precio de inscripción ($)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="5000"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={formData.precio}
              onChangeText={text => setFormData({...formData, precio: text.replace(/[^0-9]/g, '')})}
            />

            <Text style={styles.label}>Profesor <Text style={{ color: '#ef4444' }}>(Obligatorio — debe tener certificado vigente)</Text></Text>
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
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 25, width: '100%', maxWidth: 500, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  label: { fontSize: 13, fontWeight: '800', color: '#64748b', marginBottom: 5, marginTop: 15 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 15, color: '#1e293b' },
  
  // Días
  diasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diaBtn: { 
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, 
    borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
    minWidth: 55, alignItems: 'center'
  },
  diaBtnSelected: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  diaBtnText: { fontSize: 13, fontWeight: '800', color: '#64748b' },
  diaBtnTextSelected: { color: '#fff' },
  
  // Horario
  horarioRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  horarioField: { flex: 1 },
  horarioLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 4 },
  horarioInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 15, color: '#1e293b', textAlign: 'center' },
  horarioSeparator: { paddingTop: 18 },
  
  // Preview
  previewBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 10, padding: 10, marginTop: 10 },
  previewText: { marginLeft: 8, fontSize: 13, fontWeight: '700', color: '#15803d' },
  
  // Profesores
  hScroll: { flexDirection: 'row', paddingBottom: 10, marginTop: 5 },
  profCard: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, marginRight: 10, alignItems: 'center', width: 110 },
  profCardSelected: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  profName: { fontSize: 12, fontWeight: '700', color: '#1e293b', marginTop: 5, textAlign: 'center' },
  
  saveBtn: { backgroundColor: '#009b3a', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 }
});
