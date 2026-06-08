import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import { claseService } from '../services/claseService';
import { entrenamientoService } from '../services/entrenamientoService';
import ConfirmModal from '../components/ConfirmModal';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';

export default function MisClasesClienteScreen({ route, navigation }) {
  const { role, idPersona, nombreUsuario } = route.params || { role: "CLIENTE", idPersona: null, nombreUsuario: "" };
  
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [expandedId, setExpandedId] = useState(null);
  
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [actividadParaBaja, setActividadParaBaja] = useState(null);
  
  const [successModalMessage, setSuccessModalMessage] = useState(null);
  const [errorModalMessage, setErrorModalMessage] = useState(null);

  useEffect(() => {
    if (idPersona) {
      loadMisActividades();
    } else {
      setLoading(false);
      setErrorModalMessage("No se pudo identificar tu usuario.");
    }
  }, [idPersona]);

  const loadMisActividades = async () => {
    try {
      setLoading(true);
      let items = [];

      try {
        const clases = await claseService.getAll();
        const misClases = clases.filter(c => c.alumnos && c.alumnos.some(a => a.id === idPersona || a.Id === idPersona));
        items = [...items, ...misClases.map(c => ({
          ...c, id: c.id?.toString(), tipo: 'CLASE',
          cupo: c.cantidadAlumnos || c.alumnos?.length || 0, 
          max: c.capacidadMax || 20,
          profe: c.profesor?.nombre ? `${c.profesor.nombre} ${c.profesor.apellido || ''}` : 'Sin Asignar',
          precio: c.precioInscripcion || 5000,
          horario: `${c.diasSemana || ''} ${c.horaInicio?.substring(0,5) || ''}-${c.horaFin?.substring(0,5) || ''}`
        }))];
      } catch (e) { console.error("Error al cargar clases", e); }

      try {
        const entrenamientos = await entrenamientoService.getAll();
        const misEntrenamientos = entrenamientos.filter(e => e.clientes && e.clientes.some(c => c.id === idPersona || c.Id === idPersona));
        items = [...items, ...misEntrenamientos.map(e => ({
          ...e, id: e.id?.toString(), tipo: 'ENTRENAMIENTO',
          cupo: e.cantidadAlumnos || e.clientes?.length || 0, 
          max: e.cupoMaximo || 20,
          profe: e.profesor?.nombre ? `${e.profesor.nombre} ${e.profesor.apellido || ''}` : 'Sin Asignar',
          precio: e.precioInscripcion || 5000,
          horario: `${e.diasSemana || ''} ${e.horaInicio?.substring(0,5) || ''}-${e.horaFin?.substring(0,5) || ''}`
        }))];
      } catch (e) { console.error("Error al cargar entrenamientos", e); }

      setActividades(items);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar tus actividades.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerClick = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const confirmarBaja = (item) => {
    setActividadParaBaja(item);
    setConfirmModalVisible(true);
  };

  const handleBajaSubmit = async () => {
    try {
      if (actividadParaBaja.tipo === 'CLASE') {
        await claseService.removeCliente(actividadParaBaja.id, idPersona);
      } else if (actividadParaBaja.tipo === 'ENTRENAMIENTO') {
        await entrenamientoService.removeCliente(actividadParaBaja.id, idPersona);
      }
      setSuccessModalMessage(`Te has dado de baja exitosamente de la actividad: ${actividadParaBaja.nombre}`);
      setActividadParaBaja(null);
      loadMisActividades();
    } catch (error) {
      console.error(error);
      setErrorModalMessage(error.message || "No se pudo dar de baja la actividad.");
    } finally {
      setConfirmModalVisible(false);
    }
  };

  if (loading) {
    return (
      <ScreenTemplate userRole={role} navigation={navigation}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#009b3a" />
          <Text style={{ color: '#fff', marginTop: 10, fontWeight: '600' }}>Cargando tus actividades...</Text>
        </View>
      </ScreenTemplate>
    );
  }

  const getBadgeColor = (tipo) => {
    return tipo === 'CLASE' ? '#6366f1' : '#f97316';
  };

  return (
    <ScreenTemplate userRole={role} navigation={navigation}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Clases y Entrenamientos</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 20 }}>
        {actividades.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-off-outline" size={60} color="rgba(255,255,255,0.4)" />
            <Text style={styles.emptyText}>Aún no estás inscripto en ninguna clase o entrenamiento.</Text>
          </View>
        ) : (
          actividades.map((item) => (
            <View key={item.id + item.tipo} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.infoColumn}>
                  <View style={[styles.badge, { backgroundColor: getBadgeColor(item.tipo) }]}>
                    <Text style={styles.badgeText}>{item.tipo}</Text>
                  </View>
                  <Text style={styles.actividadName}>{item.nombre}</Text>
                  <Text style={styles.actividadDetail}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color="#64748b" /> {item.horario}
                  </Text>
                  
                  {expandedId === item.id + item.tipo && (
                    <View style={styles.expandedDetails}>
                      <Text style={styles.expandedText}><Text style={{ fontWeight: 'bold' }}>Profesor:</Text> {item.profe}</Text>
                      <Text style={styles.expandedText}><Text style={{ fontWeight: 'bold' }}>Cancha:</Text> {item.canchaNombre || 'Sin Cancha'}</Text>
                      <Text style={styles.expandedText}><Text style={{ fontWeight: 'bold' }}>Precio Inscripción:</Text> ${item.precio?.toLocaleString('es-AR')}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.btnColumn}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]}
                    onPress={() => handleVerClick(item.id + item.tipo)}
                  >
                    <MaterialCommunityIcons name={expandedId === item.id + item.tipo ? "eye-off" : "eye"} size={20} color="#fff" />
                    <Text style={styles.btnTextSmall}>{expandedId === item.id + item.tipo ? "Ocultar" : "Ver"}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
                    onPress={() => confirmarBaja(item)}
                  >
                    <MaterialCommunityIcons name="cancel" size={20} color="#fff" />
                    <Text style={styles.btnTextSmall}>Darme de baja</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <ConfirmModal
        visible={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        onConfirm={handleBajaSubmit}
        title="Darme de baja"
        message={`¿Estás seguro de que querés darte de baja de la actividad: ${actividadParaBaja?.nombre}?`}
        confirmText="Sí, dar de baja"
        cancelText="Cancelar"
        icon="alert-circle-outline"
        color="#ef4444"
      />

      <SuccessModal
        visible={!!successModalMessage}
        message={successModalMessage}
        onClose={() => setSuccessModalMessage(null)}
      />

      <ErrorModal
        visible={!!errorModalMessage}
        message={errorModalMessage}
        onClose={() => setErrorModalMessage(null)}
      />

    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 15 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#cbd5e1', fontSize: 16, textAlign: 'center', marginTop: 15, fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 12, elevation: 3 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  infoColumn: { flex: 1, paddingRight: 10 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 5 },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  actividadName: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  actividadDetail: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  expandedDetails: { marginTop: 10, padding: 10, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  expandedText: { fontSize: 13, color: '#334155', marginBottom: 4 },
  btnColumn: { gap: 8, alignItems: 'stretch', width: 130 },
  actionBtn: { paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 },
  btnTextSmall: { color: '#fff', fontSize: 12, fontWeight: '800' }
});
