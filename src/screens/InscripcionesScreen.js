import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import { claseService } from '../services/claseService';
import { competicionService } from '../services/competicionService';
import { entrenamientoService } from '../services/entrenamientoService';
import ManageInscripcionesModal from '../components/ManageInscripcionesModal';
import InscripcionPagoModal from '../components/InscripcionPagoModal';
import SuccessModal from '../components/SuccessModal';
import { pagoService } from '../services/pagoService';
import { Platform } from 'react-native';

export default function InscripcionesScreen({ route, navigation }) {
  const { role: currentUserRole, idPersona, nombreUsuario } = route.params || { role: "ADMIN" };

  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState(null);

  const [pagoModalVisible, setPagoModalVisible] = useState(false);
  const [actividadParaPago, setActividadParaPago] = useState(null);
  
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMode, setErrorMode] = useState(false);

  useEffect(() => {
    loadActividades();

    if (Platform.OS === 'web') {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('collection_status');
      const isMpReturn = urlParams.get('mp_return') === 'true';

      if (status === 'approved') {
        const pendingStr = window.localStorage.getItem('pendingInscripcion');
        if (pendingStr) {
          const processReturn = async () => {
            try {
              const pending = JSON.parse(pendingStr);
              window.localStorage.removeItem('pendingInscripcion');

              if (pending.pagoId) {
                try {
                  const pagos = await pagoService.getAll();
                  const p = pagos.find(x => x.id?.toString() === pending.pagoId?.toString() || x.Id?.toString() === pending.pagoId?.toString());
                  if (p) {
                    await pagoService.update(p.id || p.Id, { ...p, estado: 2 }); // 2 = Pagado
                  }
                } catch(e) { console.log('Error update pago', e); }
              }

              window.history.replaceState({}, document.title, window.location.pathname);
              
              setSuccessMessage('La inscripción se ha registrado y pagado correctamente.');
              setErrorMode(false);
              setSuccessModalVisible(true);
            } catch(e) {
              console.error("Error procesando inscripcion pendiente", e);
            }
          };
          processReturn();
        }
      } else if (isMpReturn || status === 'rejected' || status === 'null') {
        const pendingStr = window.localStorage.getItem('pendingInscripcion');
        if (pendingStr) {
          window.localStorage.removeItem('pendingInscripcion');
          window.history.replaceState({}, document.title, window.location.pathname);
          
          setSuccessMessage('El pago no se pudo completar. Estás inscripto en la actividad pero el pago quedó PENDIENTE.');
          setErrorMode(true);
          setSuccessModalVisible(true);
        }
      }
    }
  }, []);

  const loadActividades = async () => {
    try {
      setLoading(true);
      let items = [];

      try {
        const clases = await claseService.getAll();
        items = [...items, ...(clases || []).map(c => ({
          ...c, id: c.id?.toString(), tipo: 'CLASE',
          cupo: c.cantidadAlumnos || c.alumnos?.length || c.clientes?.length || 0, 
          max: c.capacidadMax || c.maxAlumnos || c.capacidad || 20,
          profe: c.profesor?.nombre ? `${c.profesor.nombre} ${c.profesor.apellido || ''}` : c.profesorNombre || c.profe || 'Sin Asignar',
          precio: c.precioInscripcion || c.precio || 5000
        }))];
      } catch (e) { /* clases puede fallar */ }

      try {
        const entrenamientos = await entrenamientoService.getAll();
        items = [...items, ...(entrenamientos || []).map(e => {
          const formattedHorario = e.diasSemana && e.horaInicio && e.horaFin 
            ? `${e.diasSemana} ${e.horaInicio.substring(0,5)}-${e.horaFin.substring(0,5)}` 
            : (e.fecha ? e.fecha.split('T')[0] : 'Sin fecha');

          return {
            ...e, id: e.id?.toString(), tipo: 'ENTRENAMIENTO',
            cupo: e.cantidadAlumnos || e.alumnos?.length || e.clientes?.length || 0, 
            max: e.cupoMaximo || e.capacidad || e.maxAlumnos || 20,
            profe: e.profesor?.nombre ? `${e.profesor.nombre} ${e.profesor.apellido || ''}` : e.profesorNombre || e.profe || 'Sin Asignar',
            precio: e.precioInscripcion || 5000,
            horario: formattedHorario
          };
        })];
      } catch (e) { /* entrenamientos puede fallar */ }

      try {
        const competencias = await competicionService.getAll();
        items = [...items, ...(competencias || []).map(c => ({
          ...c, id: c.id?.toString(), tipo: c.tipo === 1 ? 'LIGA' : 'TORNEO',
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
  const handleManage = (item) => {
    if (item.tipo === 'LIGA' || item.tipo === 'TORNEO') {
      Alert.alert('Información', 'La gestión de equipos se maneja desde Competencias.');
      return;
    }
    setSelectedActividad(item);
    setManageModalVisible(true);
  };

  const handleInscribirse = (item) => {
    if (item.tipo === 'LIGA' || item.tipo === 'TORNEO') {
      Alert.alert('Información', 'Para inscribirte en una Competencia, dirigite a Competencias.');
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
    if (item.tipo === 'TORNEO') return '#ffb300';
    return '#009b3a';
  };

  const renderActividad = (item) => (
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
        </View>
      </View>
      
      <View style={[styles.btnColumn, { alignItems: 'flex-end' }]}>
        {item.precio > 0 && (
          <Text style={[styles.precioText, { marginBottom: 2 }]}>${item.precio?.toLocaleString('es-AR')}</Text>
        )}
        
        {canCreate && item.tipo !== 'LIGA' && item.tipo !== 'TORNEO' && (
          <TouchableOpacity 
            style={[styles.manageBtn, { backgroundColor: '#3b82f6' }]}
            onPress={() => handleManage(item)}
          >
            <MaterialCommunityIcons name="account-group" size={20} color="#fff" />
            <Text style={styles.btnTextSmall}>Gestionar</Text>
          </TouchableOpacity>
        )}

        {item.tipo !== 'LIGA' && item.tipo !== 'TORNEO' && (
          <TouchableOpacity 
            style={[styles.inscribirBtn, item.cupo >= item.max && { opacity: 0.5 }]}
            onPress={() => handleInscribirse(item)}
            disabled={item.cupo >= item.max}
          >
            <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
            <Text style={styles.btnTextSmall}>{isCliente ? 'Inscribirme' : 'Inscribir'}</Text>
          </TouchableOpacity>
        )}

        {(item.tipo === 'LIGA' || item.tipo === 'TORNEO') && (
          <TouchableOpacity 
            style={[styles.manageBtn, { backgroundColor: '#64748b' }]}
            onPress={() => handleManage(item)}
          >
            <MaterialCommunityIcons name="trophy" size={20} color="#fff" />
            <Text style={styles.btnTextSmall}>Ver Competición</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const sections = [
    { key: "CLASE", titulo: "CLASES", icon: "school", data: actividades.filter(a => a.tipo === 'CLASE') },
    { key: "ENTRENAMIENTO", titulo: "ENTRENAMIENTOS", icon: "whistle", data: actividades.filter(a => a.tipo === 'ENTRENAMIENTO') },
    { key: "TORNEO", titulo: "TORNEOS", icon: "tournament", data: actividades.filter(a => a.tipo === 'TORNEO') },
    { key: "LIGA", titulo: "LIGAS", icon: "format-list-numbered", data: actividades.filter(a => a.tipo === 'LIGA') }
  ].filter(s => s.data.length > 0);

  return (
    <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isCliente ? 'Clases y Entrenamientos' : 'Gestión de Inscripciones'}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 20 }}>
        {sections.map(section => (
          <View key={section.key} style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <View style={{ backgroundColor: '#fbbf24', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
                <MaterialCommunityIcons name={section.icon} size={20} color="#000" />
                <Text style={{ color: '#000', fontWeight: '900', fontSize: 16, marginLeft: 8, textTransform: 'uppercase' }}>{section.titulo}</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, marginLeft: 10 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{section.data.length}</Text>
              </View>
            </View>
            {section.data.map(renderActividad)}
          </View>
        ))}

        {actividades.length === 0 && (
          <Text style={styles.emptyText}>No hay actividades disponibles.</Text>
        )}
      </ScrollView>

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
        onSuccess={() => {
          loadActividades();
          setSuccessModalVisible(true);
        }}
      />

      <SuccessModal
        visible={successModalVisible}
        onClose={() => {
          setSuccessModalVisible(false);
          setSuccessMessage('');
          setErrorMode(false);
        }}
        title={errorMode ? "Pago Pendiente" : "¡Inscripción Exitosa!"}
        message={successMessage || "La inscripción se ha registrado correctamente en la actividad."}
        isError={errorMode}
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 15 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },
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
  emptyText: { color: '#cbd5e1', fontSize: 14, textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 15, paddingLeft: 5 }
});
