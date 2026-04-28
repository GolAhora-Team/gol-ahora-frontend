import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomInput from './CustomInput';

export default function ReservaFormModal({ visible, onClose, formData, setFormData, onSave, canchas = [], reservasActuales = [], currentUserRole }) {
  
  // Seguridad: Si horaInicio es nulo, usamos un default
  const horaActual = formData?.horaInicio || "19:00";

  const adjustTime = (type, amount) => {
    let [h, m] = horaActual.split(':').map(Number);
    if (type === 'h') h = (h + amount + 24) % 24;
    else m = (m + amount + 60) % 60;
    
    const newTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    setFormData({ ...formData, horaInicio: newTime });
  };

  const checkDisponibilidad = () => {
    if (!formData?.canchaId) return { status: 'pending', msg: 'Seleccioná una cancha' };
    
    const cancha = canchas.find(c => c.id === formData.canchaId);
    if (cancha?.enMantenimiento) return { status: 'error', msg: 'Cancha en mantenimiento' };

    const conflicto = reservasActuales.find(r => 
      r.canchaId === formData.canchaId && 
      r.id !== formData.id && 
      horaActual >= r.horaInicio && horaActual < r.horaFin
    );

    return conflicto ? { status: 'error', msg: `Ocupada por ${conflicto.clienteNombre}` } : { status: 'success', msg: 'Horario disponible' };
  };

  const disp = checkDisponibilidad();
  const [hora, minuto] = horaActual.split(':');

  // REGLA: ¿Es un usuario administrativo?
  const isStaff = currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL';

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>NUEVA RESERVA</Text>
            <TouchableOpacity onPress={onClose}><MaterialCommunityIcons name="close" size={30} color="#94a3b8" /></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Banner de estado */}
            <View style={[styles.statusBanner, disp.status === 'error' ? styles.bgRed : disp.status === 'success' ? styles.bgGreen : styles.bgGray]}>
              <Text style={styles.bannerText}>{disp.msg.toUpperCase()}</Text>
            </View>

            {/* REGLA APLICADA: El campo CLIENTE es editable solo para STAFF */}
            <CustomInput 
              label="CLIENTE" 
              value={formData.clienteNombre} 
              editable={isStaff}
              onChangeText={v => setFormData({...formData, clienteNombre: v})} 
              containerStyle={!isStaff && { backgroundColor: '#f1f5f9', opacity: 0.8 }}
            />

            <Text style={styles.label}>SELECCIONAR CANCHA</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 10}}>
              {canchas.map(c => (
                <TouchableOpacity 
                  key={c.id} 
                  style={[styles.choiceBtn, formData.canchaId === c.id && styles.activeBtn]} 
                  onPress={() => setFormData({...formData, canchaId: c.id, canchaNombre: c.nombre})}
                >
                  <Text style={[styles.choiceText, formData.canchaId === c.id && {color: '#fff'}]}>{c.nombre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>HORARIO (FLECHAS)</Text>
            <View style={styles.timePickerContainer}>
              <View style={styles.timeBlock}>
                <TouchableOpacity onPress={() => adjustTime('h', 1)}><MaterialCommunityIcons name="chevron-up" size={40} color="#009b3a" /></TouchableOpacity>
                <Text style={styles.timeValue}>{hora}</Text>
                <TouchableOpacity onPress={() => adjustTime('h', -1)}><MaterialCommunityIcons name="chevron-down" size={40} color="#009b3a" /></TouchableOpacity>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeBlock}>
                <TouchableOpacity onPress={() => adjustTime('m', 15)}><MaterialCommunityIcons name="chevron-up" size={40} color="#009b3a" /></TouchableOpacity>
                <Text style={styles.timeValue}>{minuto}</Text>
                <TouchableOpacity onPress={() => adjustTime('m', -15)}><MaterialCommunityIcons name="chevron-down" size={40} color="#009b3a" /></TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, disp.status !== 'success' && {backgroundColor: '#cbd5e1'}]} 
              onPress={onSave}
              disabled={disp.status !== 'success'}
            >
              <Text style={styles.saveBtnText}>CONFIRMAR TURNO</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { width: '100%', maxWidth: 500, backgroundColor: '#fff', borderRadius: 30, padding: 25, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  label: { color: '#009b3a', fontWeight: '900', fontSize: 13, marginBottom: 10, marginTop: 15 },
  statusBanner: { padding: 12, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  bgRed: { backgroundColor: '#ef4444' }, bgGreen: { backgroundColor: '#009b3a' }, bgGray: { backgroundColor: '#94a3b8' },
  bannerText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  timePickerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: 20, padding: 15 },
  timeBlock: { alignItems: 'center', width: 70 },
  timeValue: { fontSize: 35, fontWeight: '900', color: '#1e293b' },
  timeSeparator: { fontSize: 35, fontWeight: '900', color: '#cbd5e1', marginHorizontal: 10 },
  choiceBtn: { padding: 12, borderRadius: 12, borderWidth: 2, borderColor: '#009b3a', marginRight: 8 },
  activeBtn: { backgroundColor: '#009b3a' },
  choiceText: { fontWeight: '800', color: '#009b3a' },
  saveBtn: { backgroundColor: '#009b3a', padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 25 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 17 }
});