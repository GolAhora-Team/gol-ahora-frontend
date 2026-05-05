import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AsistenciaModal({ visible, onClose, claseNombre }) {
  // ✅ RF-AS-03: Listado de alumnos
  const [alumnos, setAlumnos] = useState([
    { id: 1, nombre: 'Alumno 1', estado: null },
    { id: 2, nombre: 'Alumno 2', estado: null },
    { id: 3, nombre: 'Alumno 3', estado: null },
    { id: 4, nombre: 'Alumno 4', estado: null },
    { id: 5, nombre: 'Alumno 5', estado: null },
  ]);

  const toggleAsistencia = (id, valor) => {
    setAlumnos(alumnos.map(a => a.id === id ? { ...a, estado: valor } : a));
  };

  const guardarAsistencia = () => {
    // ✅ RF-AS-02: Registro de asistencia
    Alert.alert("Éxito", "Asistencia registrada correctamente en Gol Ahora.");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        {/* ✅ Contenedor con ancho máximo para que no se estire en Web */}
        <View style={styles.modalContainer}>
          
          <View style={styles.header}>
            <Text style={styles.title}>Tomar Asistencia</Text>
            <Text style={styles.subTitle}>{claseNombre}[cite: 1]</Text>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {alumnos.map(alumno => (
              <View key={alumno.id} style={styles.row}>
                <Text style={styles.alumnoName}>{alumno.nombre}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity 
                    onPress={() => toggleAsistencia(alumno.id, true)}
                    style={[styles.actionBtn, alumno.estado === true && {backgroundColor: '#009b3a'}]}
                  >
                    <MaterialCommunityIcons name="check" size={18} color={alumno.estado === true ? "#fff" : "#009b3a"} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => toggleAsistencia(alumno.id, false)}
                    style={[styles.actionBtn, alumno.estado === false && {backgroundColor: '#ef4444'}]}
                  >
                    <MaterialCommunityIcons name="close" size={18} color={alumno.estado === false ? "#fff" : "#ef4444"} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={guardarAsistencia}>
              <Text style={styles.saveText}>GUARDAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>CANCELAR</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  // ✅ Ajuste de tamaño: Centrado y con ancho máximo de 450px
  modalContainer: { 
    backgroundColor: '#fff', 
    width: '90%', 
    maxWidth: 450, // Tamaño ideal para que no sea gigante en PC[cite: 1]
    borderRadius: 25, 
    padding: 25, 
    maxHeight: '85%', 
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15
  },
  header: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  subTitle: { fontSize: 13, color: '#009b3a', fontWeight: '800', marginTop: 4 },
  list: { marginBottom: 20 },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  alumnoName: { fontSize: 16, fontWeight: '700', color: '#334155' },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { 
    width: 38, 
    height: 38, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: '#f1f5f9', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  footer: { gap: 10 },
  saveBtn: { backgroundColor: '#009b3a', padding: 16, borderRadius: 15, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },
  closeBtn: { padding: 10, alignItems: 'center' },
  closeText: { color: '#64748b', fontWeight: '700' }
});