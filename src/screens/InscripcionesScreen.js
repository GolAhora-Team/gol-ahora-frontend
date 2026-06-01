import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import { claseService } from '../services/claseService';
import { competicionService } from '../services/competicionService';
import { entrenamientoService } from '../services/entrenamientoService';

import CreateActivityModal from '../components/CreateActivityModal';
import ManageInscripcionesModal from '../components/ManageInscripcionesModal';

export default function InscripcionesScreen({ route, navigation }) {
  const { role: currentUserRole } = route.params || { role: "ADMIN" };

  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createType, setCreateType] = useState('CLASE'); // CLASE o ENTRENAMIENTO
  
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState(null);

  useEffect(() => {
    loadActividades();
  }, []);

  const loadActividades = async () => {
    try {
      setLoading(true);
      let items = [];

      try {
        const clases = await claseService.getAll();
        items = [...items, ...(clases || []).map(c => ({
          ...c, id: c.id?.toString(), tipo: 'CLASE',
          cupo: c.cantidadAlumnos || c.alumnos?.length || c.clientes?.length || 0, max: c.maxAlumnos || 20,
          profe: c.profesorNombre || c.profe || 'Sin Asignar'
        }))];
      } catch (e) { /* clases puede fallar */ }

      try {
        const entrenamientos = await entrenamientoService.getAll();
        items = [...items, ...(entrenamientos || []).map(e => ({
          ...e, id: e.id?.toString(), tipo: 'ENTRENAMIENTO',
          cupo: e.cantidadAlumnos || e.alumnos?.length || e.clientes?.length || 0, max: e.capacidad || e.maxAlumnos || 20,
          profe: e.profesorNombre || e.profe || 'Sin Asignar'
        }))];
      } catch (e) { /* entrenamientos puede fallar */ }

      try {
        const competencias = await competicionService.getAll();
        items = [...items, ...(competencias || []).map(c => ({
          ...c, id: c.id?.toString(), tipo: 'LIGA',
          cupo: c.inscriptos || 0, max: c.maxEquipos || 20,
          profe: 'N/A'
        }))];
      } catch (e) { /* competencias puede fallar */ }

      setActividades(items);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las actividades.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = (type) => {
    setCreateType(type);
    setCreateModalVisible(true);
  };

  const handleCreateSave = async (payload, type) => {
    if (type === 'CLASE') {
      await claseService.create(payload);
    } else {
      await entrenamientoService.create(payload);
    }
    Alert.alert('Éxito', `${type} creada correctamente.`);
    loadActividades();
  };

  const handleManage = (item) => {
    if (item.tipo === 'LIGA') {
      Alert.alert('Información', 'La gestión de equipos de Liga se maneja desde Competencias.');
      return;
    }
    setSelectedActividad(item);
    setManageModalVisible(true);
  };

  if (loading) {
    return (
      <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#009b3a" />
          <Text style={{ color: '#fff', marginTop: 10, fontWeight: '600' }}>Cargando inscripciones...</Text>
        </View>
      </ScreenTemplate>
    );
  }

  const canCreate = currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL';

  return (
    <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Inscripciones</Text>
      </View>

      {canCreate && (
        <View style={styles.createActions}>
          <TouchableOpacity style={styles.createBtn} onPress={() => handleOpenCreate('CLASE')}>
            <MaterialCommunityIcons name="plus-box" size={20} color="#fff" />
            <Text style={styles.createBtnText}>Crear Clase</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.createBtn, { backgroundColor: '#3b82f6' }]} onPress={() => handleOpenCreate('ENTRENAMIENTO')}>
            <MaterialCommunityIcons name="whistle" size={20} color="#fff" />
            <Text style={styles.createBtnText}>Crear Entrenamiento</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {actividades.map(item => (
          <View key={item.id + item.tipo} style={styles.card}>
            <View style={styles.info}>
              <View style={[styles.badge, { backgroundColor: item.cupo >= item.max ? '#ef4444' : '#009b3a' }]}>
                <Text style={styles.badgeText}>{item.tipo}</Text>
              </View>
              <Text style={styles.actividadName}>{item.nombre}</Text>
              <Text style={styles.actividadDetail}>Profesor: {item.profe}</Text>
              <Text style={styles.actividadDetail}>Cupos Usados: {item.cupo} / {item.max}</Text>
            </View>
            <TouchableOpacity 
              style={styles.btn}
              onPress={() => handleManage(item)}
            >
              <MaterialCommunityIcons name="account-group" size={24} color="#fff" />
              <Text style={styles.btnTextIcon}>Gestionar</Text>
            </TouchableOpacity>
          </View>
        ))}
        {actividades.length === 0 && (
          <Text style={styles.emptyText}>No hay actividades disponibles.</Text>
        )}
      </ScrollView>

      <CreateActivityModal 
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSave={handleCreateSave}
        title={createType === 'CLASE' ? 'Crear Nueva Clase' : 'Crear Nuevo Entrenamiento'}
        type={createType}
      />

      <ManageInscripcionesModal
        visible={manageModalVisible}
        onClose={() => setManageModalVisible(false)}
        actividad={selectedActividad}
        onUpdate={loadActividades}
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 15 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },
  createActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  createBtn: { flex: 1, backgroundColor: '#009b3a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12 },
  createBtnText: { color: '#fff', fontWeight: '900', marginLeft: 8, fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  info: { flex: 1 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 5 },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  actividadName: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  actividadDetail: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '600' },
  btn: { backgroundColor: '#0f172a', padding: 12, borderRadius: 12, alignItems: 'center' },
  btnTextIcon: { color: '#fff', fontSize: 10, fontWeight: '800', marginTop: 2 },
  emptyText: { color: '#cbd5e1', fontSize: 14, textAlign: 'center', marginTop: 40, fontStyle: 'italic' }
});