import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ScreenTemplate from './ScreenTemplate';
import ReservaCard from '../components/ReservaCard';
import ReservaFormModal from '../components/ReservaFormModal';
import SuccessModal from '../components/SuccessModal';
import ConfirmModal from '../components/ConfirmModal';
import { reservaService } from '../services/reservaService';
import { canchaService } from '../services/canchaService';
import { clienteService } from '../services/clienteService';
import { reportHistoryService } from '../services/reportHistoryService';
import { facturaService } from '../services/facturaService';
import { pagoService } from '../services/pagoService';

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
  
  // Success/Error modal
  const [successVisible, setSuccessVisible] = useState(false);
  const [successPdfData, setSuccessPdfData] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMode, setErrorMode] = useState(false);

  // Cancel detail modal
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [reservaToCancel, setReservaToCancel] = useState(null);
  const [cancelInfo, setCancelInfo] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // View detail modal
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingReserva, setViewingReserva] = useState(null);

  // --- NUEVOS ESTADOS DASHBOARD ---
  const [activeCourtsCount, setActiveCourtsCount] = useState(0);
  const [todayReservationsCount, setTodayReservationsCount] = useState(0);

  // --- Refs para Scroll de Navegación ---
  const scrollViewRef = useRef(null);
  const sectionOffsets = useRef({});

  const scrollToSection = (key) => {
    if (Platform.OS === 'web') {
      const el = document.getElementById(key === 'top' ? 'top-reservas' : 'section-' + key);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      if (key === 'top' && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
        return;
      }
      const y = sectionOffsets.current[key];
      if (y !== undefined && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: y, animated: true });
      }
    }
  };

  // --- Modales para Dashboard ---
  const [canchasUsoModalVisible, setCanchasUsoModalVisible] = useState(false);

  useEffect(() => {
    loadData();

    // Verificación de retorno exitoso o fallido de Mercado Pago
    if (Platform.OS === 'web') {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('collection_status');
      const prefId = urlParams.get('preference_id');
      const isMpReturn = urlParams.get('mp_return') === 'true';
      
      if (status === 'approved') {
        const pendingResStr = window.localStorage.getItem('pendingReservation');
        if (pendingResStr) {
          const processReturn = async () => {
            try {
              const pending = JSON.parse(pendingResStr);
              window.localStorage.removeItem('pendingReservation');
              
              // Forzar actualización manual del backend comprobando el estado antes de mostrar el éxito
              const extRef = urlParams.get('external_reference') || pending.reservaId?.toString();
              const paymentId = urlParams.get('payment_id');
              
              if (extRef) {
                try {
                  const { mercadoPagoService } = await import('../services/mercadoPagoService');
                  const isApproved = await mercadoPagoService.checkPaymentStatus(extRef);
                  
                  if (isApproved) {
                    // Intento 1: Actualizar a través del endpoint de Reserva (solo funcionará si el backend tiene el último deploy)
                    const { reservaService } = await import('../services/reservaService');
                    const { pagoService } = await import('../services/pagoService');
                    
                    if (pending.reservaId) {
                       try {
                          const reservas = await reservaService.getAll();
                          const r = reservas.find(x => x.id?.toString() === pending.reservaId?.toString() || x.Id?.toString() === pending.reservaId?.toString());
                          if (r) {
                              await reservaService.update(r.id || r.Id, { ...r, estado: 'Confirmada', Estado: 1 });
                          }
                       } catch(e) { console.log('Error update res', e); }
                    }
                    
                    if (pending.pagoId) {
                       try {
                          const pagos = await pagoService.getAll();
                          const p = pagos.find(x => x.id?.toString() === pending.pagoId?.toString() || x.Id?.toString() === pending.pagoId?.toString());
                          if (p) {
                              await pagoService.update(p.id || p.Id, { ...p, estado: 2 });
                          }
                       } catch(e) { console.log('Error update pago', e); }
                    }
                    
                    // Intento 2: Forzar el Webhook del backend remoto enviando el paymentId exacto
                    if (paymentId) {
                      try {
                        const { API_BASE_URL } = await import('../services/apiConfig');
                        await fetch(`${API_BASE_URL}/MercadoPago/webhook?type=payment&data.id=${paymentId}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'payment', data: { id: paymentId } })
                        });
                        console.log('Webhook disparado manualmente con exito');
                      } catch (e) {
                        console.log('Error disparando webhook manual', e);
                      }
                    }
                  }
                } catch (err) {
                  console.log('Error manual check:', err);
                }
              }
              
              window.history.replaceState({}, document.title, window.location.pathname);
              
              // Mostramos el modal de éxito (esto recargará las reservas desde la BD ya actualizada)
              handleReservaCreated({
                html: pending.html, fileName: pending.fileName, persona: pending.persona, 
                cancha: pending.cancha, fecha: new Date(pending.fecha), 
                hora: pending.hora, montoFinal: pending.montoFinal, 
                metodoPago: pending.metodoPago, isEdit: pending.isEdit
              });
            } catch(e) {
              console.error("Error procesando reserva pendiente", e);
            }
          };
          processReturn();
        }
      } else if (isMpReturn || status === 'rejected' || status === 'null' || (prefId && status !== 'approved')) {
        // El pago falló o el usuario lo canceló
        const pendingResStr = window.localStorage.getItem('pendingReservation');
        if (pendingResStr) {
          try {
            const pending = JSON.parse(pendingResStr);
            window.localStorage.removeItem('pendingReservation');
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // LA RESERVA QUEDA EN ESTADO PENDIENTE PARA QUE PUEDA PAGARLA LUEGO
            // No la cancelamos.

            setTimeout(() => {
              setSuccessMessage('El pago no se pudo completar. La reserva quedó en estado PENDIENTE, por favor intentá pagarla desde la opción "Pagar" en el detalle del turno.');
              setErrorMode(true);
              setSuccessVisible(true);
            }, 500);
          } catch(e) {
            console.error("Error procesando fallo de reserva", e);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    const updateActiveCourts = () => {
      if (!reservas || reservas.length === 0) {
        setActiveCourtsCount(0);
        setTodayReservationsCount(0);
        return;
      }
      
      const now = new Date();
      const localDateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      
      let inUse = 0;
      let todayCount = 0;
      
      reservas.forEach(r => {
        let resDateStr = r.fecha ? (r.fecha.includes('T') ? r.fecha.split('T')[0] : r.fecha) : '';
        if (resDateStr === localDateStr) {
          todayCount++;
        }
        if (r.estado === 'En Juego') {
          inUse++;
        }
      });
      
      setActiveCourtsCount(inUse);
      setTodayReservationsCount(todayCount);
    };

    updateActiveCourts();
    const intervalId = setInterval(updateActiveCourts, 60000); // Actualiza cada minuto
    return () => clearInterval(intervalId);
  }, [reservas]);

  const formatGroupDate = (date) => {
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const groupedReservas = React.useMemo(() => {
    const sorted = [...reservas].sort((a, b) => {
      let fA = a.fecha || '';
      let fB = b.fecha || '';
      if (fA !== fB) return fA.localeCompare(fB);
      return (a.horaInicio || '').localeCompare(b.horaInicio || '');
    });

    const groups = { hoy: [], manana: [], estaSemana: [], proximas: [], anteriores: [] };
    const now = new Date();
    const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const dManana = new Date(hoy); dManana.setDate(dManana.getDate() + 1);
    // Fin de la semana (domingo inclusive, hasta 6 días después de hoy)
    const dFinSemana = new Date(hoy); dFinSemana.setDate(dFinSemana.getDate() + 6);

    const sHoy = hoy.toISOString().split('T')[0];
    const sManana = dManana.toISOString().split('T')[0];
    const sFinSemana = dFinSemana.toISOString().split('T')[0];
    const dHaceUnaSemana = new Date(hoy); dHaceUnaSemana.setDate(dHaceUnaSemana.getDate() - 7);
    const sHaceUnaSemana = dHaceUnaSemana.toISOString().split('T')[0];

    sorted.forEach(r => {
      let resDateStr = r.fecha ? (r.fecha.includes('T') ? r.fecha.split('T')[0] : r.fecha) : '';
      if (resDateStr === sHoy) groups.hoy.push(r);
      else if (resDateStr === sManana) groups.manana.push(r);
      else if (resDateStr < sHoy && resDateStr >= sHaceUnaSemana) groups.anteriores.push(r);
      else if (resDateStr <= sFinSemana && resDateStr > sHoy) groups.estaSemana.push(r);
      else if (resDateStr > sFinSemana) groups.proximas.push(r);
      // Las reservas con fecha anterior a hace 1 semana no se incluyen
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

    return { groups, sHoy: hoy, sManana: dManana };
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
            // Si falta para que empiece, mostrar el estado real de la BD (Confirmada o Pendiente)
            return r.estado && r.estado.toLowerCase() === 'confirmada' ? 'Confirmada' : 'Pendiente';
          }
        } catch {
          return r.estado || 'Pendiente';
        }
      };

      const calculateAge = (dobString) => {
        if (!dobString) return null;
        try {
          const dob = new Date(dobString);
          const today = new Date();
          let age = today.getFullYear() - dob.getFullYear();
          const m = today.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
          }
          return age;
        } catch(e) { return null; }
      };

      const reservasData = await reservaService.getAll();
      let mappedReservas = (reservasData || []).map(r => ({
        ...r,
        id: r.id?.toString(),
        canchaId: r.canchaId?.toString() || r.cancha?.id?.toString(),
        canchaNombre: r.cancha?.nombre || r.canchaNombre || '',
        canchaType: r.cancha?.tipo || '',
        clienteNombre: r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido || ''}`.trim() : (r.clienteNombre || ''),
        clienteDni: r.cliente?.dni || r.clienteDni || '',
        clienteEdad: r.cliente?.fechaNacimiento ? calculateAge(r.cliente.fechaNacimiento) : null,
        horaInicio: r.horaInicio?.substring(0, 5) || r.horaInicio,
        horaFin: r.horaFin?.substring(0, 5) || r.horaFin,
        estado: getEstadoDerivado(r),
        fecha: r.fecha,
      }));

      if (currentUserRole === 'CLIENTE') {
        mappedReservas = mappedReservas.filter(r => r.clienteNombre === currentUserName);
      }

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

  const handlePayPending = async (res) => {
    try {
      setLoading(true);
      const canchaIdStr = res.cancha ? res.cancha.id : res.canchaId;
      // Tratar de buscar el precio desde la lista de canchas del context
      let montoFinal = 15000;
      if (canchas && canchas.length > 0) {
        const c = canchas.find(x => x.id == canchaIdStr);
        if (c && c.precioPorHora) {
          montoFinal = c.precioPorHora;
        }
      }

      const title = `Pago Pendiente - Cancha ${res.canchaNombre || ''}`;
      let baseUrl = 'https://golahora.runasp.net';
      if (Platform.OS === 'web') {
        baseUrl = window.location.href.split('?')[0]; 
      }
      const currentUrl = baseUrl + '?mp_return=true';
      const webhookUrl = `http://golahora.runasp.net/api/MercadoPago/webhook`;
      
      // Llamada a MP
      const mpResponse = await mercadoPagoService.createPreference(
        title, 
        montoFinal, 
        currentUrl, 
        webhookUrl, 
        res.id.toString()
      );
      
      if (Platform.OS === 'web') {
        window.location.href = mpResponse.initPoint;
      } else {
        const { Linking } = require('react-native');
        Linking.openURL(mpResponse.initPoint);
      }
    } catch (error) {
      console.error("Error al re-pagar:", error);
      Alert.alert('Error', 'No se pudo iniciar el pago. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderReservaList = (list) => {
    return list.map(item => (
      <ReservaCard 
        key={item.id} 
        item={item} 
        canModify={puedeOperarTurno(item)}
        onView={handleViewReserva}
        onPay={handlePayPending}
        onEdit={(res) => {
          setEditingReserva(res);
          setModalVisible(true);
        }}
        onDelete={async (res) => {
          setCancelLoading(true);
          setReservaToCancel(res);
          setCancelModalVisible(true);
          try {
            const info = await reservaService.getCancelacionInfo(res.id);
            setCancelInfo(info);
          } catch (err) {
            setCancelInfo(null);
          } finally {
            setCancelLoading(false);
          }
        }} 
      />
    ));
  };

  return (
    <ScreenTemplate 
      userRole={currentUserRole} 
      navigation={navigation}
      floatingComponent={
        <TouchableOpacity style={styles.fabUp} onPress={() => scrollToSection('top')}>
          <MaterialCommunityIcons name="arrow-up" size={24} color="#fff" />
        </TouchableOpacity>
      }
    >

      <View style={styles.headerRow} nativeID="top-reservas">
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
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContainer}>
        {groupedReservas.groups.hoy.length > 0 && (
          <TouchableOpacity style={styles.filterBtn} onPress={() => scrollToSection('hoy')}>
            <Text style={styles.filterBtnText}>Hoy</Text>
          </TouchableOpacity>
        )}
        {groupedReservas.groups.manana.length > 0 && (
          <TouchableOpacity style={styles.filterBtn} onPress={() => scrollToSection('manana')}>
            <Text style={styles.filterBtnText}>Mañana</Text>
          </TouchableOpacity>
        )}
        {groupedReservas.groups.estaSemana.length > 0 && (
          <TouchableOpacity style={styles.filterBtn} onPress={() => scrollToSection('estaSemana')}>
            <Text style={styles.filterBtnText}>Esta Semana</Text>
          </TouchableOpacity>
        )}
        {groupedReservas.groups.proximas.length > 0 && (
          <TouchableOpacity style={styles.filterBtn} onPress={() => scrollToSection('proximas')}>
            <Text style={styles.filterBtnText}>Próximas</Text>
          </TouchableOpacity>
        )}
        {groupedReservas.groups.anteriores.length > 0 && (
          <TouchableOpacity style={styles.filterBtn} onPress={() => scrollToSection('anteriores')}>
            <Text style={styles.filterBtnText}>Anteriores</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 40 }}>
        {reservas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={60} color="#94a3b8" />
            <Text style={styles.emptyText}>No hay reservas registradas.</Text>
          </View>
        ) : (
          <>
            {groupedReservas.groups.hoy.length > 0 && (
              <View style={styles.groupSection} nativeID="section-hoy" onLayout={(e) => sectionOffsets.current['hoy'] = e.nativeEvent.layout.y}>
                <Text style={styles.groupTitle}>Reservas para hoy - {formatGroupDate(groupedReservas.sHoy)}</Text>
                {renderReservaList(groupedReservas.groups.hoy)}
              </View>
            )}
            {groupedReservas.groups.manana.length > 0 && (
              <View style={styles.groupSection} nativeID="section-manana" onLayout={(e) => sectionOffsets.current['manana'] = e.nativeEvent.layout.y}>
                <Text style={styles.groupTitle}>Reservas para mañana - {formatGroupDate(groupedReservas.sManana)}</Text>
                {renderReservaList(groupedReservas.groups.manana)}
              </View>
            )}
            {groupedReservas.groups.estaSemana.length > 0 && (
              <View style={styles.groupSection} nativeID="section-estaSemana" onLayout={(e) => sectionOffsets.current['estaSemana'] = e.nativeEvent.layout.y}>
                <Text style={styles.groupTitle}>Reservas de esta semana</Text>
                {renderReservaList(groupedReservas.groups.estaSemana)}
              </View>
            )}
            {groupedReservas.groups.proximas.length > 0 && (
              <View style={styles.groupSection} nativeID="section-proximas" onLayout={(e) => sectionOffsets.current['proximas'] = e.nativeEvent.layout.y}>
                <Text style={styles.groupTitle}>Próximas reservas</Text>
                {renderReservaList(groupedReservas.groups.proximas)}
              </View>
            )}
            {groupedReservas.groups.anteriores.length > 0 && (
              <View style={styles.groupSection} nativeID="section-anteriores" onLayout={(e) => sectionOffsets.current['anteriores'] = e.nativeEvent.layout.y}>
                <Text style={styles.groupTitle}>Historial Anteriores</Text>
                {renderReservaList(groupedReservas.groups.anteriores)}
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
        onClose={() => { 
          setSuccessVisible(false); 
          // Esperamos a que termine la animación de cierre (300ms) para limpiar el estado y evitar parpadeos
          setTimeout(() => {
            setSuccessPdfData(null); 
            setSuccessMessage(''); 
            setErrorMode(false); 
          }, 350);
        }}
        title={errorMode ? "Pago Cancelado" : (successMessage ? "¡Operación exitosa!" : (successPdfData?.isEdit ? "¡Reserva editada!" : "¡Reserva confirmada!"))}
        message={successMessage || (successPdfData?.isEdit ? "La reserva se modificó con éxito." : "La reserva se registró con éxito.")}
        actionButtonText={successPdfData ? "DESCARGAR PDF" : null}
        onAction={successPdfData ? downloadPdf : null}
        isError={errorMode}
      />

      {/* Modal Confirmar Cancelación con Info de Penalización */}
      <Modal visible={cancelModalVisible} animationType="fade" transparent={true}>
        <View style={styles.viewOverlay}>
          <View style={[styles.viewContainer, { maxWidth: 450 }]}>
            <View style={styles.viewHeader}>
              <Text style={styles.viewTitle}>Cancelar Reserva</Text>
              <TouchableOpacity onPress={() => { setCancelModalVisible(false); setReservaToCancel(null); setCancelInfo(null); }}>
                <MaterialCommunityIcons name="close-circle" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>

            {cancelLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#009b3a" />
                <Text style={{ marginTop: 10, color: '#64748b', fontWeight: '700' }}>Calculando penalización...</Text>
              </View>
            ) : reservaToCancel && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Detalles de la reserva */}
                <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 15, marginBottom: 15 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <MaterialCommunityIcons name="soccer-field" size={20} color="#009b3a" />
                    <Text style={{ marginLeft: 8, fontWeight: '800', color: '#1e293b', fontSize: 15 }}>{reservaToCancel.canchaNombre}</Text>
                  </View>
                  <Text style={{ color: '#64748b', fontWeight: '600' }}>
                    {formatFecha(reservaToCancel.fecha)} • {reservaToCancel.horaInicio}
                  </Text>
                  {currentUserRole !== 'CLIENTE' && (
                    <Text style={{ color: '#64748b', fontWeight: '600', marginTop: 4 }}>
                      Cliente: {reservaToCancel.clienteNombre}
                    </Text>
                  )}
                </View>

                {/* Info de penalización */}
                {cancelInfo && (
                  <View style={{ marginBottom: 15 }}>
                    {/* Estado del plazo */}
                    <View style={[
                      { padding: 12, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
                      cancelInfo.dentroDePlazo 
                        ? { backgroundColor: '#f0fdf4' }
                        : { backgroundColor: '#fef2f2' }
                    ]}>
                      <MaterialCommunityIcons 
                        name={cancelInfo.dentroDePlazo ? "check-circle" : "alert-circle"} 
                        size={22} 
                        color={cancelInfo.dentroDePlazo ? "#16a34a" : "#ef4444"} 
                      />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={{ fontWeight: '800', color: cancelInfo.dentroDePlazo ? '#16a34a' : '#ef4444', fontSize: 13 }}>
                          {cancelInfo.dentroDePlazo ? 'DENTRO DEL PLAZO' : 'FUERA DEL PLAZO'}
                        </Text>
                        <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                          Faltan {cancelInfo.horasRestantes}hs para el turno (mínimo: {cancelInfo.horasAntelacionMinima}hs)
                        </Text>
                      </View>
                    </View>

                    {/* Desglose financiero */}
                    <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 15 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: '#64748b', fontWeight: '700' }}>Monto original</Text>
                        <Text style={{ color: '#1e293b', fontWeight: '800' }}>${cancelInfo.montoOriginal?.toLocaleString('es-AR')}</Text>
                      </View>
                      {!cancelInfo.dentroDePlazo && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ color: '#ef4444', fontWeight: '700' }}>Penalización ({cancelInfo.porcentajePenalizacion}%)</Text>
                          <Text style={{ color: '#ef4444', fontWeight: '800' }}>-${cancelInfo.montoPenalizacion?.toLocaleString('es-AR')}</Text>
                        </View>
                      )}
                      <View style={{ borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#009b3a', fontWeight: '900', fontSize: 15 }}>Reintegro</Text>
                        <Text style={{ color: '#009b3a', fontWeight: '900', fontSize: 15 }}>${cancelInfo.montoReintegro?.toLocaleString('es-AR')}</Text>
                      </View>
                    </View>

                    {!cancelInfo.dentroDePlazo && (
                      <View style={{ backgroundColor: '#fffbeb', padding: 12, borderRadius: 10, marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="alert" size={18} color="#f59e0b" />
                        <Text style={{ marginLeft: 8, color: '#92400e', fontSize: 11, fontWeight: '700', flex: 1 }}>
                          La cancelación fuera de plazo implica una penalización del {cancelInfo.porcentajePenalizacion}%. ¿Desea continuar?
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Botones */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <TouchableOpacity 
                    style={{ flex: 1, backgroundColor: '#f1f5f9', padding: 14, borderRadius: 12, alignItems: 'center' }}
                    onPress={() => { setCancelModalVisible(false); setReservaToCancel(null); setCancelInfo(null); }}
                  >
                    <Text style={{ fontWeight: '800', color: '#64748b' }}>No, volver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ flex: 1, backgroundColor: '#ef4444', padding: 14, borderRadius: 12, alignItems: 'center' }}
                    onPress={async () => {
                      if (!reservaToCancel) return;
                      try {
                        await reservaService.cancelar(reservaToCancel.id);
                        setReservas(prev => prev.map(r => r.id === reservaToCancel.id ? { ...r, estado: 'Cancelada' } : r));
                        setCancelModalVisible(false);
                        setCancelInfo(null);
                        setReservaToCancel(null);
                        setSuccessMessage('La reserva ha sido cancelada correctamente.' + 
                          (cancelInfo?.montoReintegro > 0 ? ` Se generó un reintegro de $${cancelInfo.montoReintegro?.toLocaleString('es-AR')}.` : '')
                        );
                        setSuccessVisible(true);
                      } catch (error) {
                        Alert.alert('Error', error.message || 'No se pudo cancelar la reserva.');
                      }
                    }}
                  >
                    <Text style={{ fontWeight: '800', color: '#fff' }}>Sí, cancelar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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
              <ScrollView showsVerticalScrollIndicator={true}>
                <View style={styles.viewBrand}>
                  <MaterialCommunityIcons name="soccer-field" size={40} color="#009b3a" />
                  <Text style={styles.viewBrandText}>GOL AHORA</Text>
                </View>
                <View style={styles.viewDivider} />

                <View style={styles.viewRow}>
                  <Text style={styles.viewLabel}>CLIENTE</Text>
                  <Text style={styles.viewValue}>{viewingReserva.clienteNombre || 'N/A'} {viewingReserva.clienteEdad ? `(${viewingReserva.clienteEdad} años)` : ''}</Text>
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
            <ScrollView showsVerticalScrollIndicator={true}>
              {reservas.filter(r => r.estado === 'En Juego').map((reserva) => {
                const now = new Date();
                const [h, m] = (reserva.horaFin || '00:00').split(':').map(Number);
                const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
                const diff = endTime.getTime() - now.getTime();
                const mins = diff > 0 ? Math.floor(diff / 60000) : 0;

                return (
                  <View key={reserva.id} style={[styles.viewRow, { justifyContent: 'space-between', gap: 10 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <MaterialCommunityIcons name="whistle" size={20} color="#009b3a" />
                      <Text style={[styles.viewValue, { textAlign: 'left', marginLeft: 0 }]}>{reserva.canchaNombre}</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#ef4444' }}>Faltan {mins} min</Text>
                  </View>
                );
              })}
              {reservas.filter(r => r.estado === 'En Juego').length === 0 && (
                <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 20 }}>No hay canchas en uso en este momento.</Text>
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
  
  filtersScroll: { flexGrow: 0, marginBottom: 15, maxHeight: 40 },
  filtersContainer: { gap: 10, paddingHorizontal: 5, alignItems: 'center' },
  filterBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  filterBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  groupSection: { marginBottom: 25 },
  groupTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 12, marginLeft: 4, letterSpacing: 0.5 },

  fabUp: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#009b3a',
    width: 55,
    height: 55,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },

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
