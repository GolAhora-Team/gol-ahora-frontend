import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import AsistenciaModal from '../components/AsistenciaModal';
import AssignClassModal from '../components/AssignClassModal';
import VerAlumnosModal from '../components/VerAlumnosModal';
import CreateActivityModal from '../components/CreateActivityModal';
import { claseService } from '../services/claseService';
import { entrenamientoService } from '../services/entrenamientoService';
import { userService } from '../services/userService';

export default function StaffScreen({ route, navigation }) {
  const { role: currentUserRole, userName = "NombreProfe ApellidoProfe" } = route.params || { role: "PROFE" };

  const [todasLasClases, setTodasLasClases] = useState([]);
  const [todosLosEntrenamientos, setTodosLosEntrenamientos] = useState([]);
  const [activeTab, setActiveTab] = useState('CLASES');
  const [loading, setLoading] = useState(true);

  const [asistenciaModalVisible, setAsistenciaModalVisible] = useState(false);
  const [claseSeleccionada, setClaseSeleccionada] = useState("");
  
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [alumnosModalVisible, setAlumnosModalVisible] = useState(false);
  const [claseParaAlumnos, setClaseParaAlumnos] = useState(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createType, setCreateType] = useState('CLASE');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clasesData, entrenamientosData] = await Promise.all([
        claseService.getAll().catch(() => []),
        entrenamientoService.getAll().catch(() => [])
      ]);
      
      const mappedClases = (clasesData || []).map(c => ({
        ...c,
        id: c.id?.toString(),
        profe: c.profesorNombre || c.profe || 'Sin asignar',
        alumnos: c.cantidadAlumnos || c.alumnos || c.clientes?.length || c.asistencias?.length || 0,
        precio: c.precioInscripcion || c.precio || 0,
        capacidad: c.capacidadMax || c.capacidad || 20,
        horario: c.descripcion || `${c.horaInicio} - ${c.horaFin}`
      }));
      setTodasLasClases(mappedClases);

      const mappedEntrenamientos = (entrenamientosData || []).map(e => ({
        ...e,
        id: e.id?.toString(),
        profe: e.profesorNombre || e.profe || 'Sin asignar',
        alumnos: e.cantidadAlumnos || e.alumnos || e.clientes?.length || 0,
        precio: e.precio || 0,
        capacidad: e.cupoMaximo || 20,
        horario: e.fecha ? e.fecha.split('T')[0] : 'Sin fecha'
      }));
      setTodosLosEntrenamientos(mappedEntrenamientos);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const itemsVisibles = () => {
    const lista = activeTab === 'CLASES' ? todasLasClases : todosLosEntrenamientos;
    if (currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL') {
      return lista;
    }
    return lista.filter(item => item.profe === userName);
  };

  const abrirAsistencia = (clase) => {
    setClaseSeleccionada(clase);
    setAsistenciaModalVisible(true);
  };

  const handleOpenCreate = (type) => {
    setCreateType(type);
    setCreateModalVisible(true);
  };

  const handleCreateSave = async (payload, type) => {
    // Esta función es llamada desde CreateActivityModal.
    // El modal re-lanza el error si falla, así que lo manejamos aquí
    // y mostramos UNA SOLA alerta al usuario.
    if (type === 'CLASE') {
      await claseService.create(payload);
    } else {
      await entrenamientoService.create(payload);
    }
    // Si llegamos acá, fue exitoso
    Alert.alert(
      '✅ ¡Creado con éxito!',
      `${type === 'CLASE' ? 'La clase' : 'El entrenamiento'} "${payload.nombre}" se guardó en la base de datos.`
    );
    loadData();
  };

  const abrirVerAlumnos = (clase) => {
    setClaseParaAlumnos(clase);
    setAlumnosModalVisible(true);
  };

  if (loading) {
    return (
      <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#009b3a" />
          <Text style={{ color: '#fff', marginTop: 10, fontWeight: '600' }}>Cargando...</Text>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {currentUserRole === 'PROFE' ? 'Mis Clases' : 'Gestión de Cuerpo Técnico'}
          </Text>
          <Text style={styles.subTitle}>
            {currentUserRole === 'PROFE' ? `Profesor: ${userName}` : 'Panel Administrativo'}
          </Text>
        </View>
      </View>

      {(currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL') && (
        <>
          <View style={styles.adminActions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6366f1' }]} onPress={() => handleOpenCreate('CLASE')}>
              <MaterialCommunityIcons name="plus-box" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Crear Clase</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f97316' }]} onPress={() => handleOpenCreate('ENTRENAMIENTO')}>
              <MaterialCommunityIcons name="whistle" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Crear Entrenamiento</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.adminActions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={() => setAssignModalVisible(true)}>
              <MaterialCommunityIcons name="clipboard-account" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Asignar Clase</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'CLASES' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('CLASES')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'CLASES' && styles.tabBtnTextActive]}>Ver Clases</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'ENTRENAMIENTOS' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('ENTRENAMIENTOS')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'ENTRENAMIENTOS' && styles.tabBtnTextActive]}>Ver Entrenamientos</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {itemsVisibles().map(item => (
          <View key={item.id} style={styles.claseCard}>
            <View style={styles.cardInfo}>
              <Text style={styles.claseTitle}>{item.nombre}</Text>
              <Text style={styles.claseDetail}>
                <Text style={{ fontWeight: '900' }}>Horario/Fecha:</Text> {item.horario}
              </Text>
              <Text style={styles.claseDetail}>
                <Text style={{ fontWeight: '900' }}>Precio:</Text> ${item.precio}
              </Text>
              <Text style={styles.claseDetail}>
                <Text style={{ fontWeight: '900' }}>Capacidad:</Text> {item.alumnos} / {item.capacidad} inscriptos
              </Text>
              {(currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL') && (
                <Text style={styles.claseDetail}>
                  <Text style={{ fontWeight: '900' }}>Profesor:</Text> {item.profe}
                </Text>
              )}
            </View>
            
            <View style={styles.badgeContainer}>
              <View style={styles.alumnosBadge}>
                <Text style={styles.badgeText}>{item.alumnos} Alumnos</Text>
              </View>
              <View style={styles.btnRow}>
                <TouchableOpacity 
                  style={styles.verAlumnosBtn} 
                  onPress={() => abrirVerAlumnos(item)}
                >
                  <Text style={styles.btnTextInfo}>VER ALUMNOS</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.asistenciaBtn} 
                  onPress={() => abrirAsistencia(item)}
                >
                  <Text style={styles.btnText}>ASISTENCIA</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {itemsVisibles().length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay {activeTab === 'CLASES' ? 'clases' : 'entrenamientos'} para mostrar.</Text>
          </View>
        )}
      </ScrollView>

      <AsistenciaModal 
        visible={asistenciaModalVisible} 
        onClose={() => setAsistenciaModalVisible(false)} 
        claseId={claseSeleccionada?.id}
        claseNombre={claseSeleccionada?.nombre || claseSeleccionada} 
      />

      <AssignClassModal
        visible={assignModalVisible}
        onClose={() => setAssignModalVisible(false)}
        onAssignSuccess={loadData}
      />

      <VerAlumnosModal
        visible={alumnosModalVisible}
        onClose={() => setAlumnosModalVisible(false)}
        claseId={claseParaAlumnos?.id}
        claseNombre={claseParaAlumnos?.nombre}
      />

      <CreateActivityModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSave={handleCreateSave}
        title={createType === 'CLASE' ? 'Crear Nueva Clase' : 'Crear Nuevo Entrenamiento'}
        type={createType}
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },
  subTitle: { fontSize: 13, color: '#ffb300', fontWeight: '700', marginTop: 2 },
  adminActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: { backgroundColor: '#009b3a', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, flex: 1, justifyContent: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '900', marginLeft: 8, fontSize: 13 },
  claseCard: { 
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 12, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
  },
  cardInfo: { flex: 1 },
  claseTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b', marginBottom: 5 },
  claseDetail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  badgeContainer: { alignItems: 'flex-end' },
  alumnosBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#009b3a' },
  btnRow: { flexDirection: 'row', gap: 8 },
  asistenciaBtn: { backgroundColor: '#009b3a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  verAlumnosBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  btnText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  btnTextInfo: { color: '#64748b', fontSize: 11, fontWeight: '900' },
  emptyContainer: { marginTop: 50, alignItems: 'center' },
  emptyText: { color: '#fff', fontSize: 14, fontStyle: 'italic', opacity: 0.8 },
  tabsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#009b3a' },
  tabBtnText: { color: '#a1a1aa', fontWeight: '800', fontSize: 13 },
  tabBtnTextActive: { color: '#ffffff' }
});