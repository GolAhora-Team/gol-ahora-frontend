import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import ReservaCard from '../components/ReservaCard';
import ReservaFormModal from '../components/ReservaFormModal';
import { confirmarEliminacion } from '../components/Delete';
import { reservaService } from '../services/reservaService';

export default function ReservaScreen({ route, navigation }) {
  // --- CAPTURAMOS USUARIO ---
  const { role: currentUserRole, nombreUsuario: currentUserName } = route.params || { 
    role: "CLIENTE", 
    nombreUsuario: "Julián Antunes" 
  };

  const [canchas] = useState([
    { id: '1', nombre: 'Maracaná 1', enMantenimiento: false },
    { id: '2', nombre: 'Centenario', enMantenimiento: true },
    { id: '3', nombre: 'Wembley', enMantenimiento: false },
  ]);

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // --- REGLA: El form nace con el nombre del usuario si no es STAFF ---
  const initialForm = { 
    clienteNombre: (currentUserRole === 'CLIENTE' || currentUserRole === 'PROFE') ? currentUserName : '', 
    canchaId: '1', 
    canchaNombre: 'Maracaná 1', 
    horaInicio: '19:00', 
    duracion: 60, 
    estado: 'confirmado' 
  };
  
  const [formData, setFormData] = useState(initialForm);

  // CARGA INICIAL DESDE EL BACKEND
  useEffect(() => {
    loadReservas();
  }, []);

  const loadReservas = async () => {
    try {
      setLoading(true);
      const data = await reservaService.getAll();
      const mapped = (data || []).map(r => ({
        ...r,
        id: r.id?.toString(),
        canchaId: r.canchaId?.toString(),
      }));
      setReservas(mapped);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las reservas.');
    } finally {
      setLoading(false);
    }
  };

  // LÓGICA DE PERMISOS
  const puedeOperarTurno = (reserva) => {
    if (currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL') return true;
    return reserva.clienteNombre === currentUserName;
  };

  const getStatusCancha = (canchaId) => {
    const cancha = canchas.find(c => c.id === canchaId);
    if (cancha?.enMantenimiento) return { label: 'MANTENIMIENTO', color: '#ef4444', icon: 'tools' };
    const ahora = "15:30"; 
    const ocupada = reservas.find(r => r.canchaId === canchaId && ahora >= r.horaInicio && ahora < r.horaFin);
    if (ocupada) return { label: `OCUPADA (Libera ${ocupada.horaFin})`, color: '#ffb300', icon: 'clock-outline' };
    return { label: 'LIBRE', color: '#009b3a', icon: 'check-circle-outline' };
  };

  const handleOpenModal = (reserva = null) => {
    if (reserva) {
      if (!puedeOperarTurno(reserva)) {
        Alert.alert("Acceso denegado", "Solo podés modificar tus propias reservas.");
        return;
      }
      setFormData({ ...reserva });
      setIsEditing(true);
    } else {
      setFormData(initialForm);
      setIsEditing(false);
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.clienteNombre || !formData.canchaId || !formData.horaInicio) {
        Alert.alert("Atención", "Completa todos los campos obligatorios.");
        return;
      }

      const [hStr, mStr] = formData.horaInicio.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      const date = new Date();
      date.setHours(h, m + formData.duracion);
      const horaFinStr = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

      if (isEditing) {
        await reservaService.update(formData.id, { ...formData, horaFin: horaFinStr });
        setReservas(prev => prev.map(r => r.id === formData.id ? { ...formData, horaFin: horaFinStr } : r));
      } else {
        const result = await reservaService.create({ ...formData, horaFin: horaFinStr });
        const nueva = { ...formData, id: result?.id?.toString() || Date.now().toString(), horaFin: horaFinStr };
        setReservas(prev => [...prev, nueva]);
      }
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", error.message || "Ocurrió un problema al procesar la reserva.");
    }
  };

  if (loading) {
    return (
      <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#009b3a" />
          <Text style={{ color: '#fff', marginTop: 10, fontWeight: '600' }}>Cargando reservas...</Text>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
      
      {/* MONITOR DE CANCHAS */}
      <View style={styles.monitorSection}>
        <Text style={styles.sectionTitle}>MONITOR DE CANCHAS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {canchas.map(c => {
            const status = getStatusCancha(c.id);
            return (
              <View key={c.id} style={[styles.statusCard, { borderColor: status.color }]}>
                <MaterialCommunityIcons name={status.icon} size={20} color={status.color} />
                <View style={styles.statusInfo}>
                  <Text style={styles.statusCanchaName}>{c.nombre}</Text>
                  <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.mainTitle}>Cronograma</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
          <MaterialCommunityIcons name="calendar-plus" size={24} color="#fff" />
          <Text style={styles.addButtonText}>NUEVA</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {reservas.map(item => (
          <ReservaCard 
            key={item.id} 
            item={item} 
            canModify={puedeOperarTurno(item)} 
            onEdit={handleOpenModal} 
            onDelete={async (res) => {
              try {
                await reservaService.cancelar(res.id);
                setReservas(prev => prev.filter(r => r.id !== res.id));
              } catch (error) {
                Alert.alert('Error', error.message || 'No se pudo cancelar la reserva.');
              }
            }} 
          />
        ))}
      </ScrollView>

      <ReservaFormModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        formData={formData} 
        setFormData={setFormData} 
        onSave={handleSave} 
        canchas={canchas} 
        reservasActuales={reservas}
        currentUserRole={currentUserRole}
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  monitorSection: { marginBottom: 30 },
  sectionTitle: { color: '#94a3b8', fontWeight: '900', fontSize: 11, letterSpacing: 1.5, marginBottom: 15 },
  statusCard: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginRight: 12, borderWidth: 2, minWidth: 160, elevation: 2 },
  statusInfo: { marginLeft: 10 },
  statusCanchaName: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  statusLabel: { fontSize: 10, fontWeight: '900', marginTop: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mainTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  addButton: { backgroundColor: '#009b3a', flexDirection: 'row', padding: 10, borderRadius: 12, alignItems: 'center' },
  addButtonText: { fontWeight: '900', marginLeft: 5, color: '#fff' },
});