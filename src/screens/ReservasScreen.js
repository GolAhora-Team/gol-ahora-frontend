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
  
  // Success modal
  const [successVisible, setSuccessVisible] = useState(false);
  const [successPdfData, setSuccessPdfData] = useState(null);

  // View detail modal
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingReserva, setViewingReserva] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

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
        estado: r.estado || 'Confirmada',
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
              onView={handleViewReserva}
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
        nombreUsuario={currentUserName}
        onReservaCreated={handleReservaCreated}
      />

      <SuccessModal
        visible={successVisible}
        onClose={() => { setSuccessVisible(false); setSuccessPdfData(null); }}
        title="¡Reserva confirmada!"
        message="La reserva se registró con éxito."
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