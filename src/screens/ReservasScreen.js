import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import ReservaCard from '../components/ReservaCard';
import ReservaFormModal from '../components/ReservaFormModal';
import { reservaService } from '../services/reservaService';
import { canchaService } from '../services/canchaService';
import { clienteService } from '../services/clienteService';

export default function ReservaScreen({ route, navigation }) {
  const { role: currentUserRole, nombreUsuario: currentUserName } = route.params || { 
    role: "CLIENTE", 
    nombreUsuario: "Julián Antunes" 
  };

  const [reservas, setReservas] = useState([]);
  const [canchas, setCanchas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // CARGA INICIAL DESDE EL BACKEND
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar reservas
      const reservasData = await reservaService.getAll();
      const mappedReservas = (reservasData || []).map(r => ({
        ...r,
        id: r.id?.toString(),
        canchaId: r.canchaId?.toString() || r.cancha?.id?.toString(),
        canchaNombre: r.cancha?.nombre || r.canchaNombre || '',
        clienteNombre: r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido}` : (r.clienteNombre || ''),
        horaInicio: r.horaInicio?.substring(0, 5) || r.horaInicio,
        horaFin: r.horaFin?.substring(0, 5) || r.horaFin,
        estado: r.estado || 'confirmado',
        fecha: r.fecha,
      }));
      setReservas(mappedReservas);

      // Cargar canchas
      try {
        const canchasData = await canchaService.getAll();
        const mappedCanchas = (canchasData || []).map(c => ({
          id: c.id.toString(),
          nombre: c.nombre,
          tipo: c.tipo === "Futbol5" ? "F5" : (c.tipo === "Futbol7" ? "F7" : "F11"),
          superficie: c.superficie === 1 ? "Sintético" : c.superficie === 2 ? "Césped Natural" : c.superficie === 3 ? "Parquet" : "Cemento",
          capacidad: c.capacidad?.toString(),
          enMantenimiento: c.estado === 'Mantenimiento',
          precioPorHora: c.precioPorHora || 30000,
          original: c
        }));
        setCanchas(mappedCanchas);
      } catch (e) { console.error('Error cargando canchas:', e); }

      // Cargar clientes
      try {
        const clientesData = await clienteService.getAll();
        setClientes(clientesData || []);
      } catch (e) { console.error('Error cargando clientes:', e); }

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

      <View style={styles.headerRow}>
        <Text style={styles.mainTitle}>Cronograma</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <MaterialCommunityIcons name="calendar-plus" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Nueva reserva</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {reservas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={60} color="#94a3b8" />
            <Text style={styles.emptyText}>No hay reservas registradas.</Text>
          </View>
        ) : (
          reservas.map(item => (
            <ReservaCard 
              key={item.id} 
              item={item} 
              canModify={puedeOperarTurno(item)} 
              onEdit={() => {}} 
              onDelete={async (res) => {
                try {
                  await reservaService.cancelar(res.id);
                  setReservas(prev => prev.filter(r => r.id !== res.id));
                } catch (error) {
                  Alert.alert('Error', error.message || 'No se pudo cancelar la reserva.');
                }
              }} 
            />
          ))
        )}
      </ScrollView>

      <ReservaFormModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        canchas={canchas}
        clientes={clientes}
        reservasActuales={reservas}
        currentUserRole={currentUserRole}
        onReservaCreated={loadData}
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mainTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  addButton: { backgroundColor: '#009b3a', flexDirection: 'row', padding: 10, borderRadius: 12, alignItems: 'center' },
  addButtonText: { fontWeight: '900', marginLeft: 5, color: '#fff' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: '#94a3b8', fontSize: 15, fontWeight: '600', marginTop: 12 },
});