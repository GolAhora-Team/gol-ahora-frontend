import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ScreenTemplate from './ScreenTemplate';
import ReservaCard from '../components/ReservaCard';
import ReservaFormModal from '../components/ReservaFormModal';
import SuccessModal from '../components/SuccessModal';
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
  const [editingReserva, setEditingReserva] = useState(null);
  
  // Success modal
  const [successVisible, setSuccessVisible] = useState(false);
  const [successPdfData, setSuccessPdfData] = useState(null);

  // View detail modal
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingReserva, setViewingReserva] = useState(null);

  // --- NUEVOS ESTADOS DASHBOARD ---
  const [activeCourtsCount, setActiveCourtsCount] = useState(0);
  const [todayReservationsCount, setTodayReservationsCount] = useState(0);

  // --- Modales para Dashboard ---
  const [canchasUsoModalVisible, setCanchasUsoModalVisible] = useState(false);
  const [reservasHoyModalVisible, setReservasHoyModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const updateActiveCourts = () => {
      if (!reservas || reservas.length === 0) {
        setActiveCourtsCount(0);
        setTodayReservationsCount(0);
        return;
      }
      
      const now = new Date();
      // Asumiendo horario de Argentina (GMT-3) manual
      const argTime = new Date(now.getTime() - (3 * 60 * 60 * 1000)); 
      const argDateStr = argTime.toISOString().split('T')[0];
      const currentHours = argTime.getUTCHours().toString().padStart(2, '0');
      const currentMinutes = argTime.getUTCMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      
      let inUse = 0;
      let todayCount = 0;
      
      reservas.forEach(r => {
        let resDateStr = r.fecha ? (r.fecha.includes('T') ? r.fecha.split('T')[0] : r.fecha) : '';
        if (resDateStr === argDateStr) {
          todayCount++;
          if ((r.estado || 'Confirmada').toLowerCase() === 'confirmada') {
            if (currentTimeStr >= r.horaInicio && currentTimeStr <= r.horaFin) {
              inUse++;
            }
          }
        }
      });
      
      setActiveCourtsCount(inUse);
      setTodayReservationsCount(todayCount);
    };

    updateActiveCourts();
    const intervalId = setInterval(updateActiveCourts, 60000); // Actualiza cada minuto
    return () => clearInterval(intervalId);
  }, [reservas]);

  const groupedReservas = React.useMemo(() => {
    const sorted = [...reservas].sort((a, b) => {
      let fA = a.fecha || '';
      let fB = b.fecha || '';
      if (fA !== fB) return fA.localeCompare(fB);
      return (a.horaInicio || '').localeCompare(b.horaInicio || '');
    });

    const groups = { hoy: [], manana: [], pasado: [], proximas: [], anteriores: [] };
    const now = new Date();
    const argTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    argTime.setUTCHours(0,0,0,0);
    
    const dManana = new Date(argTime); dManana.setDate(dManana.getDate() + 1);
    const dPasado = new Date(argTime); dPasado.setDate(dPasado.getDate() + 2);

    const sHoy = argTime.toISOString().split('T')[0];
    const sManana = dManana.toISOString().split('T')[0];
    const sPasado = dPasado.toISOString().split('T')[0];

    sorted.forEach(r => {
      let resDateStr = r.fecha ? (r.fecha.includes('T') ? r.fecha.split('T')[0] : r.fecha) : '';
      if (resDateStr === sHoy) groups.hoy.push(r);
      else if (resDateStr === sManana) groups.manana.push(r);
      else if (resDateStr === sPasado) groups.pasado.push(r);
      else if (resDateStr < sHoy) groups.anteriores.push(r);
      else groups.proximas.push(r);
    });

    // Ordenar 'hoy' para que 'En Juego' vaya primero y 'Finalizado' al final
    groups.hoy.sort((a, b) => {
      const getWeight = (estado) => {
        if (estado === 'En Juego') return 0;
        if (estado === 'Finalizado') return 2;
        return 1; // Pendiente, Confirmada u otros
      };
      const wA = getWeight(a.estado);
      const wB = getWeight(b.estado);
      if (wA !== wB) return wA - wB;
      return (a.horaInicio || '').localeCompare(b.horaInicio || '');
    });

    return groups;
  }, [reservas]);

  const loadData = async () => {
    try {
      setLoading(true);

      const getEstadoDerivado = (r) => {
        if (r.estado && (r.estado.toLowerCase() === 'cancelada' || r.estado.toLowerCase() === 'cancelado')) {
          return r.estado;
        }
        const now = new Date();
        try {
          const fechaStr = r.fecha?.split('T')[0];
          if (!fechaStr) return r.estado || 'Pendiente';
          
          const [year, month, day] = fechaStr.split('-').map(Number);
          const [hInicio, mInicio] = (r.horaInicio || '00:00').split(':').map(Number);
          const [hFin, mFin] = (r.horaFin || '00:00').split(':').map(Number);
          
          const inicio = new Date(year, month - 1, day, hInicio, mInicio, 0);
          const fin = new Date(year, month - 1, day, hFin, mFin, 0);
          
          if (now >= fin) {
            return 'Finalizado';
          } else if (now >= inicio && now < fin) {
            return 'En Juego';
          } else {
            return 'Pendiente';
          }
        } catch {
          return r.estado || 'Pendiente';
        }
      };

      const reservasData = await reservaService.getAll();
      const mappedReservas = (reservasData || []).map(r => ({
        ...r,
        id: r.id?.toString(),
        canchaId: r.canchaId?.toString() || r.cancha?.id?.toString(),
        canchaNombre: r.cancha?.nombre || r.canchaNombre || '',
        canchaType: r.cancha?.tipo || '',
        clienteNombre: r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido || ''}`.trim() : (r.clienteNombre || ''),
        clienteDni: r.cliente?.dni || r.clienteDni || '',
        horaInicio: r.horaInicio?.substring(0, 5) || r.horaInicio,
        horaFin: r.horaFin?.substring(0, 5) || r.horaFin,
        estado: getEstadoDerivado(r),
        fecha: r.fecha,
      }));
      setReservas(mappedReservas);

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

  const puedeOperarTurno = (reserva) => {
    if (currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL') return true;
    return reserva.clienteNombre === currentUserName;
  };

  const handleReservaCreated = (successData) => {
    setSuccessPdfData(successData);
    setSuccessVisible(true);
    loadData();
  };

  const downloadPdf = async () => {
    if (!successPdfData) return;
    try {
      if (Platform.OS === 'web') {
        const html2pdf = require('html2pdf.js');
        const element = document.createElement('div');
        element.innerHTML = successPdfData.html;
        html2pdf().from(element).set({
          margin: 10,
          filename: successPdfData.fileName + '.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).save();
      } else {
        const { uri } = await Print.printToFileAsync({ html: successPdfData.html });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo descargar el comprobante.');
    }
  };

  const handleViewReserva = (reserva) => {
    setViewingReserva(reserva);
    setViewModalVisible(true);
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return fecha; }
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

  const renderReservaList = (list) => {
    return list.map(item => (
      <ReservaCard 
        key={item.id} 
        item={item} 
        canModify={puedeOperarTurno(item)}
        onView={handleViewReserva}
        onEdit={() => { setEditingReserva(item); setModalVisible(true); }} 
        onDelete={async (res) => {
          try {
            await reservaService.cancelar(res.id);
            setReservas(prev => prev.filter(r => r.id !== res.id));
          } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo cancelar la reserva.');
          }
        }} 
      />
    ));
  };

  return (
    <ScreenTemplate userRole={currentUserRole} navigation={navigation}>

      <View style={styles.headerRow}>
        <Text style={styles.mainTitle}>Cronograma</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <MaterialCommunityIcons name="calendar-plus" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Nueva reserva</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dashboardContainer}>
        <TouchableOpacity style={styles.dashCard} onPress={() => setCanchasUsoModalVisible(true)}>
          <MaterialCommunityIcons name="whistle" size={28} color="#009b3a" />
          <View style={styles.dashCardInfo}>
            <Text style={styles.dashCardValue}>{activeCourtsCount}</Text>
            <Text style={styles.dashCardLabel}>Canchas en Uso</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dashCard} onPress={() => setReservasHoyModalVisible(true)}>
          <MaterialCommunityIcons name="calendar-today" size={28} color="#f59e0b" />
          <View style={styles.dashCardInfo}>
            <Text style={styles.dashCardValue}>{todayReservationsCount}</Text>
            <Text style={styles.dashCardLabel}>Reservas Hoy</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {reservas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={60} color="#94a3b8" />
            <Text style={styles.emptyText}>No hay reservas registradas.</Text>
          </View>
        ) : (
          <>
            {groupedReservas.hoy.length > 0 && (
              <View style={styles.groupSection}>
                <Text style={styles.groupTitle}>Reservas para Hoy</Text>
                {renderReservaList(groupedReservas.hoy)}
              </View>
            )}
            {groupedReservas.manana.length > 0 && (
              <View style={styles.groupSection}>
                <Text style={styles.groupTitle}>Mañana</Text>
                {renderReservaList(groupedReservas.manana)}
              </View>
            )}
            {groupedReservas.pasado.length > 0 && (
              <View style={styles.groupSection}>
                <Text style={styles.groupTitle}>Pasado Mañana</Text>
                {renderReservaList(groupedReservas.pasado)}
              </View>
            )}
            {groupedReservas.proximas.length > 0 && (
              <View style={styles.groupSection}>
                <Text style={styles.groupTitle}>Próximas Reservas</Text>
                {renderReservaList(groupedReservas.proximas)}
              </View>
            )}
            {groupedReservas.anteriores.length > 0 && (
              <View style={styles.groupSection}>
                <Text style={styles.groupTitle}>Historial Anteriores</Text>
                {renderReservaList(groupedReservas.anteriores)}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <ReservaFormModal 
        visible={modalVisible} 
        onClose={() => { setModalVisible(false); setEditingReserva(null); }} 
        reservaToEdit={editingReserva}
        canchas={canchas}
        clientes={clientes}
        reservasActuales={reservas}
        currentUserRole={currentUserRole}
        nombreUsuario={currentUserName}
        onReservaCreated={handleReservaCreated}
      />

      <SuccessModal
        visible={successVisible}
        onClose={() => { setSuccessVisible(false); setSuccessPdfData(null); }}
        title={successPdfData?.isEdit ? "¡Reserva editada!" : "¡Reserva confirmada!"}
        message={successPdfData?.isEdit ? "La reserva se modificó con éxito." : "La reserva se registró con éxito."}
        actionButtonText={successPdfData ? "DESCARGAR PDF" : null}
        onAction={successPdfData ? downloadPdf : null}
      />

      {/* Modal Ver Detalle Reserva */}
      <Modal visible={viewModalVisible} animationType="fade" transparent={true}>
        <View style={styles.viewOverlay}>
          <View style={styles.viewContainer}>
            <View style={styles.viewHeader}>
              <Text style={styles.viewTitle}>Detalle de Reserva</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <MaterialCommunityIcons name="close-circle" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>

            {viewingReserva && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.viewBrand}>
                  <MaterialCommunityIcons name="soccer-field" size={40} color="#009b3a" />
                  <Text style={styles.viewBrandText}>GOL AHORA</Text>
                </View>
                <View style={styles.viewDivider} />

                <View style={styles.viewRow}>
                  <Text style={styles.viewLabel}>CLIENTE</Text>
                  <Text style={styles.viewValue}>{viewingReserva.clienteNombre || 'N/A'}</Text>
                </View>
                <View style={styles.viewRow}>
                  <Text style={styles.viewLabel}>CANCHA</Text>
                  <Text style={styles.viewValue}>{viewingReserva.canchaNombre || 'N/A'}</Text>
                </View>
                <View style={styles.viewRow}>
                  <Text style={styles.viewLabel}>DÍA</Text>
                  <Text style={styles.viewValue}>{formatFecha(viewingReserva.fecha)}</Text>
                </View>
                <View style={styles.viewRow}>
                  <Text style={styles.viewLabel}>HORARIO</Text>
                  <Text style={styles.viewValue}>{viewingReserva.horaInicio} - {viewingReserva.horaFin}</Text>
                </View>
                <View style={styles.viewRow}>
                  <Text style={styles.viewLabel}>ESTADO</Text>
                  <View style={styles.estadoBadge}>
                    <Text style={styles.estadoBadgeText}>{(viewingReserva.estado || '').toUpperCase()}</Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Canchas en Uso */}
      <Modal visible={canchasUsoModalVisible} animationType="slide" transparent={true}>
        <View style={styles.viewOverlay}>
          <View style={styles.viewContainer}>
            <View style={styles.viewHeader}>
              <Text style={styles.viewTitle}>Canchas en Uso</Text>
              <TouchableOpacity onPress={() => setCanchasUsoModalVisible(false)}>
                <MaterialCommunityIcons name="close-circle" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {reservas.filter(r => r.estado === 'En Juego').map((reserva) => (
                <View key={reserva.id} style={[styles.viewRow, { justifyContent: 'flex-start', gap: 10 }]}>
                   <MaterialCommunityIcons name="whistle" size={20} color="#009b3a" />
                   <Text style={[styles.viewValue, { textAlign: 'left', marginLeft: 0 }]}>{reserva.canchaNombre}</Text>
                </View>
              ))}
              {reservas.filter(r => r.estado === 'En Juego').length === 0 && (
                <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 20 }}>No hay canchas en uso en este momento.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Reservas de Hoy */}
      <Modal visible={reservasHoyModalVisible} animationType="slide" transparent={true}>
        <View style={styles.viewOverlay}>
          <View style={[styles.viewContainer, { maxHeight: '85%', padding: 15 }]}>
            <View style={styles.viewHeader}>
              <Text style={styles.viewTitle}>Reservas de Hoy</Text>
              <TouchableOpacity onPress={() => setReservasHoyModalVisible(false)}>
                <MaterialCommunityIcons name="close-circle" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
              {groupedReservas.hoy.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 20 }}>No hay reservas para hoy.</Text>
              ) : (
                renderReservaList(groupedReservas.hoy)
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

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

  // Dashboard y Secciones
  dashboardContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  dashCard: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5 },
  dashCardInfo: { marginLeft: 12 },
  dashCardValue: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  dashCardLabel: { fontSize: 11, color: '#64748b', fontWeight: '800', textTransform: 'uppercase' },
  groupSection: { marginBottom: 25 },
  groupTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 12, marginLeft: 4, letterSpacing: 0.5 },

  // View modal
  viewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  viewContainer: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 24, padding: 25, maxHeight: '75%' },
  viewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  viewTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  viewBrand: { alignItems: 'center', marginBottom: 10, gap: 5 },
  viewBrandText: { fontSize: 24, fontWeight: '900', color: '#009b3a' },
  viewDivider: { height: 3, backgroundColor: '#009b3a', marginVertical: 12, borderRadius: 2 },
  viewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  viewLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5 },
  viewValue: { fontSize: 14, fontWeight: '800', color: '#1e293b', textAlign: 'right', flex: 1, marginLeft: 15 },
  estadoBadge: { backgroundColor: '#f0fdf4', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  estadoBadgeText: { fontSize: 11, fontWeight: '900', color: '#009b3a' },
});