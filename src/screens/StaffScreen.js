import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import AsistenciaModal from '../components/AsistenciaModal';
import StaffFormModal from '../components/StaffFormModal';
import AssignClassModal from '../components/AssignClassModal';
import VerAlumnosModal from '../components/VerAlumnosModal';
import { claseService } from '../services/claseService';
import { userService } from '../services/userService';

export default function StaffScreen({ route, navigation }) {
  const { role: currentUserRole, userName = "NombreProfe ApellidoProfe" } = route.params || { role: "PROFE" };

  const [todasLasClases, setTodasLasClases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [asistenciaModalVisible, setAsistenciaModalVisible] = useState(false);
  const [claseSeleccionada, setClaseSeleccionada] = useState("");
  
  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [alumnosModalVisible, setAlumnosModalVisible] = useState(false);
  const [claseParaAlumnos, setClaseParaAlumnos] = useState(null);

  useEffect(() => {
    loadClases();
  }, []);

  const loadClases = async () => {
    try {
      setLoading(true);
      const data = await claseService.getAll();
      const mapped = (data || []).map(c => ({
        ...c,
        id: c.id?.toString(),
        profe: c.profesorNombre || c.profe || 'Sin asignar',
        alumnos: c.cantidadAlumnos || c.alumnos || c.clientes?.length || 0,
      }));
      setTodasLasClases(mapped);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las clases.');
    } finally {
      setLoading(false);
    }
  };

  const clasesVisibles = (currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL')
    ? todasLasClases 
    : todasLasClases.filter(clase => clase.profe === userName);

  const abrirAsistencia = (nombre) => {
    setClaseSeleccionada(nombre);
    setAsistenciaModalVisible(true);
  };

  const abrirVerAlumnos = (clase) => {
    setClaseParaAlumnos(clase);
    setAlumnosModalVisible(true);
  };

  const handleCreateProfesor = async (formData) => {
    try {
      setLoading(true);
      const mappedData = { 
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: 0,
        especialidad: formData.especialidad || 'General',
        certificacion: formData.certificado || 'Ninguna',
        telefono: '',
        direccion: '',
        localidad: '',
        codigoPostal: '',
        provincia: 'Buenos Aires',
        pais: 'Argentina',
        email: formData.email,
        fechaNacimiento: "2000-01-01T00:00:00.000Z",
        genero: "Otro",
        activo: true
      };
      
      const payload = {
        email: formData.email,
        password: "1234",
        request: mappedData
      };

      await userService.createUsuarioProfesor(payload);
      Alert.alert('Éxito', `Profesor creado.\nUsuario: ${formData.email}\nContraseña: 1234`);
      setStaffModalVisible(false);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo crear el profesor.');
    } finally {
      setLoading(false);
    }
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
        <View style={styles.adminActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setStaffModalVisible(true)}>
            <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Nuevo Profesor</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={() => setAssignModalVisible(true)}>
            <MaterialCommunityIcons name="clipboard-account" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Asignar Clase</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {clasesVisibles.map(clase => (
          <View key={clase.id} style={styles.claseCard}>
            <View style={styles.cardInfo}>
              <Text style={styles.claseTitle}>{clase.nombre}</Text>
              <Text style={styles.claseDetail}>
                <Text style={{ fontWeight: '900' }}>Horario:</Text> {clase.horario}
              </Text>
              {(currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL') && (
                <Text style={styles.claseDetail}>
                  <Text style={{ fontWeight: '900' }}>Profesor:</Text> {clase.profe}
                </Text>
              )}
            </View>
            
            <View style={styles.badgeContainer}>
              <View style={styles.alumnosBadge}>
                <Text style={styles.badgeText}>{clase.alumnos} Alumnos</Text>
              </View>
              <View style={styles.btnRow}>
                <TouchableOpacity 
                  style={styles.verAlumnosBtn} 
                  onPress={() => abrirVerAlumnos(clase)}
                >
                  <Text style={styles.btnTextInfo}>VER ALUMNOS</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.asistenciaBtn} 
                  onPress={() => abrirAsistencia(clase.nombre)}
                >
                  <Text style={styles.btnText}>ASISTENCIA</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {clasesVisibles.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay clases programadas para mostrar.</Text>
          </View>
        )}
      </ScrollView>

      <AsistenciaModal 
        visible={asistenciaModalVisible} 
        onClose={() => setAsistenciaModalVisible(false)} 
        claseNombre={claseSeleccionada} 
      />
      
      <StaffFormModal
        visible={staffModalVisible}
        onClose={() => setStaffModalVisible(false)}
        onSave={handleCreateProfesor}
      />

      <AssignClassModal
        visible={assignModalVisible}
        onClose={() => setAssignModalVisible(false)}
        onAssignSuccess={loadClases}
      />

      <VerAlumnosModal
        visible={alumnosModalVisible}
        onClose={() => setAlumnosModalVisible(false)}
        claseId={claseParaAlumnos?.id}
        claseNombre={claseParaAlumnos?.nombre}
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
  emptyText: { color: '#fff', fontSize: 14, fontStyle: 'italic', opacity: 0.8 }
});