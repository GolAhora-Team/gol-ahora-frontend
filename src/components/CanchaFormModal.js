import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomInput from './CustomInput';

export default function CanchaFormModal({ visible, onClose, isEditing, formData, setFormData, onSave, errorMessage }) {
  const tipos = ['F5', 'F7', 'F11'];
  const superficies = ['Sintético', 'Césped Natural', 'Parquet', 'Cemento'];

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{isEditing ? 'EDITAR CANCHA' : 'NUEVA CANCHA'}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close-circle" size={35} color="#009b3a" />
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>1. ESPECIFICACIONES TÉCNICAS</Text>
              <CustomInput 
                label="NOMBRE DE LA CANCHA" 
                value={formData.nombre} 
                onChangeText={v => setFormData({...formData, nombre: v})} 
                containerStyle={styles.cleanInput}
                labelStyle={styles.greenLabelBold}
                inputStyle={styles.greenInputText}
              />
              
              <Text style={styles.greenLabelBold}>CATEGORIZACIÓN (TIPO)</Text>
              <View style={styles.choiceRow}>
                {tipos.map(t => (
                  <TouchableOpacity 
                    key={t} 
                    style={[styles.choiceBtn, formData.tipo === t && styles.activeBtn]} 
                    onPress={() => {
                      let cap = "0";
                      let dim = "";
                      let precio = 0;
                      if (t === 'F5') { cap = "10"; dim = "20x40m"; precio = 30000; }
                      if (t === 'F7') { cap = "14"; dim = "30x50m"; precio = 65000; }
                      if (t === 'F11') { cap = "22"; dim = "45x90m"; precio = 120000; }
                      setFormData({...formData, tipo: t, capacidad: cap, dimensiones: dim, precioBase: precio});
                    }}
                  >
                    <Text style={[styles.choiceText, formData.tipo === t ? styles.whiteText : styles.greenText]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.greenLabelBold}>SUPERFICIE</Text>
              <View style={styles.grid}>
                {superficies.map(s => (
                  <TouchableOpacity key={s} style={[styles.gridBtn, formData.superficie === s && styles.activeBtn]} onPress={() => setFormData({...formData, superficie: s})}>
                    <Text style={[styles.choiceText, formData.superficie === s ? styles.whiteText : styles.greenText]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <CustomInput 
                label="CAPACIDAD MÁXIMA (Jugadores) - Autocalculado" 
                value={formData.capacidad ? formData.capacidad.toString() : ""} 
                editable={false}
                containerStyle={[styles.cleanInput, { backgroundColor: '#e2e8f0', borderColor: '#cbd5e1' }]}
                labelStyle={styles.greenLabelBold}
                inputStyle={[styles.greenInputText, { color: '#64748b' }]}
              />

              <CustomInput 
                label="PRECIO POR HORA - Autocalculado" 
                value={formData.precioBase ? `$${formData.precioBase}` : ""} 
                editable={false}
                containerStyle={[styles.cleanInput, { backgroundColor: '#e2e8f0', borderColor: '#cbd5e1' }]}
                labelStyle={styles.greenLabelBold}
                inputStyle={[styles.greenInputText, { color: '#64748b' }]}
              />
            </View>

            {/* SECCIÓN DE MANTENIMIENTO TIPO USUARIO */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>2. ESTADO OPERATIVO</Text>
              <View style={[styles.statusBox, formData.enMantenimiento ? styles.statusBoxOn : styles.statusBoxOff]}>
                <View style={styles.statusInfo}>
                   <MaterialCommunityIcons 
                    name={formData.enMantenimiento ? "tools" : "check-decagram"} 
                    size={24} 
                    color={formData.enMantenimiento ? "#fff" : "#009b3a"} 
                   />
                   <View style={{marginLeft: 12}}>
                      <Text style={[styles.statusTitle, formData.enMantenimiento ? styles.whiteText : styles.greenText]}>MODO MANTENIMIENTO</Text>
                      <Text style={[styles.statusSub, formData.enMantenimiento ? styles.whiteText : styles.statusSubOff]}>
                        {formData.enMantenimiento ? "Cancha fuera de servicio" : "Disponible para turnos"}
                      </Text>
                   </View>
                </View>
                <Switch
                  trackColor={{ false: "#cbd5e1", true: "#004d1a" }}
                  thumbColor={formData.enMantenimiento ? "#ffb300" : "#f4f3f4"}
                  onValueChange={(v) => setFormData({...formData, enMantenimiento: v})}
                  value={formData.enMantenimiento}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
              <Text style={styles.saveBtnText}>GUARDAR CONFIGURACIÓN</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 15 },
  container: { width: '100%', maxWidth: 650, backgroundColor: '#fff', borderRadius: 32, padding: 25, maxHeight: '92%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 15 },
  headerTitle: { color: '#009b3a', fontSize: 22, fontWeight: '900' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', padding: 12, borderRadius: 12, marginBottom: 20 },
  errorText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 8, fontSize: 14 },
  formSection: { marginBottom: 25 },
  sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '900', marginBottom: 15, letterSpacing: 2 },
  greenLabelBold: { color: '#009b3a', fontSize: 13, fontWeight: '900', marginBottom: 8 },
  cleanInput: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: '#e2e8f0' },
  greenInputText: { color: '#009b3a', fontWeight: '800' },
  choiceRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
  choiceBtn: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 2, borderColor: '#009b3a', alignItems: 'center' },
  gridBtn: { width: '48%', padding: 14, borderRadius: 14, borderWidth: 2, borderColor: '#009b3a', alignItems: 'center' },
  activeBtn: { backgroundColor: '#009b3a' },
  greenText: { color: '#009b3a', fontWeight: '800' },
  whiteText: { color: '#fff', fontWeight: '800' },
  statusBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 18, borderWidth: 2 },
  statusBoxOn: { backgroundColor: '#ef4444', borderColor: '#991b1b' },
  statusBoxOff: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1', borderStyle: 'dashed' },
  statusInfo: { flexDirection: 'row', alignItems: 'center' },
  statusTitle: { fontWeight: '900', fontSize: 13 },
  statusSub: { fontSize: 11, fontWeight: '600' },
  statusSubOff: { color: '#64748b' },
  saveBtn: { backgroundColor: '#009b3a', padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 15 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 17 }
});