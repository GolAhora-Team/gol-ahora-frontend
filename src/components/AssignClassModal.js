import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { profesorService } from '../services/profesorService';
import { claseService } from '../services/claseService';

export default function AssignClassModal({ visible, onClose, onAssignSuccess }) {
  const [profesores, setProfesores] = useState([]);
  const [clases, setClases] = useState([]);
  const [selectedProfesor, setSelectedProfesor] = useState(null);
  const [selectedClase, setSelectedClase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
    } else {
      setSelectedProfesor(null);
      setSelectedClase(null);
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profData, claseData] = await Promise.all([
        profesorService.getAll(),
        claseService.getAll()
      ]);
      setProfesores(profData || []);
      setClases((claseData || []).filter(c => !c.profesorId && !c.profe)); // Mostrar clases sin profesor asignado o todas? Mostraremos todas por las dudas
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedProfesor || !selectedClase) {
      Alert.alert('Atención', 'Debes seleccionar un profesor y una clase.');
      return;
    }
    setAssigning(true);
    try {
      await claseService.addProfesor(selectedClase.id, selectedProfesor.id);
      Alert.alert('Éxito', 'Profesor asignado a la clase correctamente.');
      if (onAssignSuccess) onAssignSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo asignar el profesor a la clase.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Asignar Clase a Profesor</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={28} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#009b3a" style={{ marginVertical: 30 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={true}>
              <Text style={styles.label}>1. Selecciona un Profesor</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
                {profesores.map(p => (
                  <TouchableOpacity 
                    key={p.id} 
                    style={[styles.card, selectedProfesor?.id === p.id && styles.cardSelected]}
                    onPress={() => setSelectedProfesor(p)}
                  >
                    <MaterialCommunityIcons name="whistle" size={24} color={selectedProfesor?.id === p.id ? '#fff' : '#009b3a'} />
                    <Text style={[styles.cardTitle, selectedProfesor?.id === p.id && { color: '#fff' }]}>{p.nombre} {p.apellido}</Text>
                    <Text style={[styles.cardSub, selectedProfesor?.id === p.id && { color: '#d1fae5' }]}>DNI: {p.dni}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {profesores.length === 0 && <Text style={styles.emptyText}>No hay profesores registrados.</Text>}

              <Text style={styles.label}>2. Selecciona una Clase / Entrenamiento</Text>
              <View style={styles.listContainer}>
                {clases.map(c => (
                  <TouchableOpacity 
                    key={c.id} 
                    style={[styles.listItem, selectedClase?.id === c.id && styles.listItemSelected]}
                    onPress={() => setSelectedClase(c)}
                  >
                    <View>
                      <Text style={[styles.listTitle, selectedClase?.id === c.id && { color: '#fff' }]}>{c.nombre}</Text>
                      <Text style={[styles.listSub, selectedClase?.id === c.id && { color: '#d1fae5' }]}>
                        Horario: {c.horario} • Capacidad: {c.capacidad}
                      </Text>
                      {(c.profesorNombre || c.profe) && (
                        <Text style={styles.warnText}>Ya tiene profesor asignado: {c.profesorNombre || c.profe}</Text>
                      )}
                    </View>
                    {selectedClase?.id === c.id && <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
              {clases.length === 0 && <Text style={styles.emptyText}>No hay clases disponibles.</Text>}
            </ScrollView>
          )}

          <TouchableOpacity 
            style={[styles.saveBtn, (!selectedProfesor || !selectedClase || assigning) && { opacity: 0.5 }]} 
            onPress={handleAssign}
            disabled={!selectedProfesor || !selectedClase || assigning}
          >
            <Text style={styles.saveText}>{assigning ? 'ASIGNANDO...' : 'CONFIRMAR ASIGNACIÓN'}</Text>
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
  label: { fontSize: 14, fontWeight: '800', color: '#64748b', marginTop: 15, marginBottom: 10 },
  hScroll: { flexDirection: 'row', paddingBottom: 10 },
  card: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 15, marginRight: 10, width: 140, alignItems: 'center' },
  cardSelected: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#1e293b', marginTop: 8, textAlign: 'center' },
  cardSub: { fontSize: 11, color: '#64748b', marginTop: 4 },
  listContainer: { gap: 10 },
  listItem: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listItemSelected: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  listTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  listSub: { fontSize: 12, color: '#64748b', marginTop: 4 },
  warnText: { fontSize: 11, color: '#fb923c', marginTop: 4, fontWeight: 'bold' },
  emptyText: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginVertical: 10 },
  saveBtn: { backgroundColor: '#009b3a', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontWeight: '900', fontSize: 14 }
});
