import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import { claseService } from '../services/claseService';
import { competicionService } from '../services/competicionService';
import { entrenamientoService } from '../services/entrenamientoService';

import CreateActivityModal from '../components/CreateActivityModal';
import ManageInscripcionesModal from '../components/ManageInscripcionesModal';
import InscripcionPagoModal from '../components/InscripcionPagoModal';

export default function InscripcionesScreen({ route, navigation }) {
  const { role: currentUserRole, idPersona, nombreUsuario } = route.params || { role: "ADMIN" };

  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createType, setCreateType] = useState('CLASE');
  
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState(null);

  const [pagoModalVisible, setPagoModalVisible] = useState(false);
  const [actividadParaPago, setActividadParaPago] = useState(null);

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
          cupo: c.cantidadAlumnos || c.alumnos?.length || c.clientes?.length || 0, max: c.maxAlumnos || c.capacidad || 20,
          profe: c.profesorNombre || c.profe || 'Sin Asignar',
          precio: c.precio || 5000
        }))];
      } catch (e) { /* clases puede fallar */ }

      try {
        const entrenamientos = await entrenamientoService.getAll();
        items = [...items, ...(entrenamientos || []).map(e => ({
          ...e, id: e.id?.toString(), tipo: 'ENTRENAMIENTO',
          cupo: e.cantidadAlumnos || e.alumnos?.length || e.clientes?.length || 0, max: e.capacidad || e.maxAlumnos || 20,
          profe: e.profesorNombre || e.profe || 'Sin Asignar',
          precio: e.precio || 5000
        }))];
      } catch (e) { /* entrenamientos puede fallar */ }

      try {
        const competencias = await competicionService.getAll();
        items = [...items, ...(competencias || []).map(c => ({
          ...c, id: c.id?.toString(), tipo: 'LIGA',
          cupo: c.inscriptos || 0, max: c.maxEquipos || 20,
          profe: 'N/A',
          precio: 0
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
    Alert.alert('Éxito', `${type === 'CLASE' ? 'Clase' : 'Entrenamiento'} creada correctamente.`);
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

  const handleInscribirse = (item) => {
    if (item.tipo === 'LIGA') {
      Alert.alert('Información', 'Para inscribirte en una Liga, dirigite a Competencias.');
      return;
    }
    if (item.cupo >= item.max) {
      Alert.alert('Cupo lleno', 'Esta actividad ya no tiene cupos disponibles.');
      return;
    }
    setActividadParaPago(item);
    setPagoModalVisible(true);
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
  const isCliente = currentUserRole === 'CLIENTE';

  const getBadgeColor = (item) => {
    if (item.cupo >= item.max) return '#ef4444';
    if (item.tipo === 'CLASE') return '#6366f1';
    if (item.tipo === 'ENTRENAMIENTO') return '#f97316';
    return '#009b3a';
  };

  return (
    <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isCliente ? 'Clases y Entrenamientos' : 'Gestión de Inscripciones'}
        </Text>
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
              <View style={[styles.badge, { backgroundColor: getBadgeColor(item) }]}>
                <Text style={styles.badgeText}>{item.tipo}</Text>
              </View>
              <Text style={styles.actividadName}>{item.nombre}</Text>
              <Text style={styles.actividadDetail}>
                <Text style={{ fontWeight: '900' }}>Horario: </Text>{item.horario || 'Sin definir'}
              </Text>
              <Text style={styles.actividadDetail}>
                <Text style={{ fontWeight: '900' }}>Profesor: </Text>{item.profe}
              </Text>
              <View style={styles.cupoRow}>
                <Text style={styles.actividadDetail}>
                  <Text style={{ fontWeight: '900' }}>Cupos: </Text>{item.cupo} / {item.max}
                </Text>
                {item.precio > 0 && (
                  <Text style={styles.precioText}>${item.precio?.toLocaleString('es-AR')}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.btnColumn}>
              {/* Admin/Personal: Gestionar inscriptos */}
              {canCreate && item.tipo !== 'LIGA' && (
                <TouchableOpacity 
                  style={styles.manageBtn}
                  onPress={() => handleManage(item)}
                >
                  <MaterialCommunityIcons name="account-group" size={20} color="#fff" />
                  <Text style={styles.btnTextSmall}>Gestionar</Text>
                </TouchableOpacity>
              )}

              {/* Admin/Personal/Cliente: Inscribir con pago */}
              {item.tipo !== 'LIGA' && (
                <TouchableOpacity 
                  style={[styles.inscribirBtn, item.cupo >= item.max && { opacity: 0.5 }]}
                  onPress={() => handleInscribirse(item)}
                  disabled={item.cupo >= item.max}
                >
                  <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
                  <Text style={styles.btnTextSmall}>{isCliente ? 'Inscribirme' : 'Inscribir'}</Text>
                </TouchableOpacity>
              )}

              {item.tipo === 'LIGA' && (
                <TouchableOpacity 
                  style={[styles.manageBtn, { backgroundColor: '#64748b' }]}
                  onPress={() => handleManage(item)}
                >
                  <MaterialCommunityIcons name="trophy" size={20} color="#fff" />
                  <Text style={styles.btnTextSmall}>Ver Liga</Text>
                </TouchableOpacity>
              )}
            </View>
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

      <InscripcionPagoModal
        visible={pagoModalVisible}
        onClose={() => setPagoModalVisible(false)}
        actividad={actividadParaPago}
        currentUserRole={currentUserRole}
        idPersona={idPersona}
        nombreUsuario={nombreUsuario}
        onSuccess={loadActividades}
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
  cupoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  precioText: { fontSize: 14, fontWeight: '900', color: '#16a34a' },
  btnColumn: { gap: 8 },
  manageBtn: { backgroundColor: '#0f172a', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', gap: 5 },
  inscribirBtn: { backgroundColor: '#009b3a', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', gap: 5 },
  btnTextSmall: { color: '#fff', fontSize: 11, fontWeight: '800' },
  emptyText: { color: '#cbd5e1', fontSize: 14, textAlign: 'center', marginTop: 40, fontStyle: 'italic' }
});