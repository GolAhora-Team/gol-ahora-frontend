import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE_URL } from '../services/apiConfig';

const NotificationDropdown = ({ visible, onClose, token, userRole }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState('Todas');
  
  const isAdminOrPersonal = userRole === 'ADMIN' || userRole === 'PERSONAL';

  useEffect(() => {
    if (visible && token) {
      fetchNotificaciones().then(() => {
        marcarLeidas();
      });
    }
  }, [visible, token]);

  const fetchNotificaciones = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Notificacion`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotificaciones(data || []);
      }
    } catch (e) {
      console.log('Error fetching notificaciones:', e);
    } finally {
      setLoading(false);
    }
  };

  const marcarLeidas = async () => {
    try {
      await fetch(`${API_BASE_URL}/Notificacion/leidas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) {
      console.log('Error marking as read:', e);
    }
  };

  const handleAccionInvitacion = async (notifId, accion) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Notificacion/${notifId}/${accion}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setNotificaciones(prev => prev.map(n => 
          n.id === notifId 
            ? { ...n, estadoAccion: accion === 'aceptar' ? 'Aceptada' : 'Rechazada', accionRequerida: false }
            : n
        ));
      }
    } catch (e) {
      console.log(`Error ${accion} invitación:`, e);
    }
  };

  const notificacionesFiltradas = notificaciones.filter(item => {
    if (!isAdminOrPersonal) return true;
    if (filtro === 'Todas') return true;
    if (filtro === 'Reservas') return item.tipo === 'Reserva' || (item.mensaje && item.mensaje.toLowerCase().includes('reserva cancelada'));
    if (filtro === 'Competiciones') return item.tipo === 'Equipo' || item.tipo === 'Torneo';
    if (filtro === 'Membresías') return item.tipo === 'Membresia' || (item.mensaje && (item.mensaje.toLowerCase().includes('socio') || item.mensaje.toLowerCase().includes('membresía')));
    if (filtro === 'Clases y Entrenamientos') return item.tipo === 'Clase' || item.tipo === 'Entrenamiento' || (item.mensaje && item.mensaje.toLowerCase().includes('se ha inscrito a'));
    if (filtro === 'Nuevos Usuarios') return item.tipo === 'NuevoRegistro';
    if (filtro === 'Documentación') return item.tipo === 'Documentacion';
    return true;
  });

  const renderItem = ({ item }) => {
    const isNew = !item.leida;
    const isInvitacion = item.tipo === 'InvitacionEquipo';
    const isPendiente = item.estadoAccion === 'Pendiente';
    
    let iconName = "bell-outline";
    let iconColor = "#000";
    if (item.tipo === "Reserva") { iconName = "calendar-check"; iconColor = "#28a745"; }
    else if (item.tipo === "NuevoRegistro") { iconName = "account-plus"; iconColor = "#17a2b8"; }
    else if (item.tipo === "Documentacion") { iconName = "file-document-alert"; iconColor = "#dc3545"; }
    else if (item.tipo === "Equipo" || item.tipo === "Torneo") { iconName = "trophy-outline"; iconColor = "#ffb300"; }
    else if (item.tipo === "Clase" || item.tipo === "Entrenamiento") { iconName = "run"; iconColor = "#6610f2"; }
    else if (item.tipo === "InvitacionEquipo") { iconName = "account-group"; iconColor = "#009b3a"; }
    else if (item.tipo === "InvitacionAceptada") { iconName = "check-circle"; iconColor = "#16a34a"; }
    else if (item.tipo === "InvitacionRechazada") { iconName = "close-circle"; iconColor = "#ef4444"; }

    return (
      <View style={[styles.notificationItem, isNew && styles.newItem]}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.message, isNew && styles.newMessage]}>{item.mensaje}</Text>
          <Text style={styles.date}>{new Date(item.fechaCreacion.endsWith('Z') ? item.fechaCreacion : item.fechaCreacion + 'Z').toLocaleString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })}</Text>
          {isInvitacion && isPendiente && (
            <View style={styles.actionBtns}>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccionInvitacion(item.id, 'aceptar')}>
                <MaterialCommunityIcons name="check" size={16} color="#fff" />
                <Text style={styles.acceptBtnText}>Aceptar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAccionInvitacion(item.id, 'rechazar')}>
                <MaterialCommunityIcons name="close" size={16} color="#fff" />
                <Text style={styles.rejectBtnText}>Rechazar</Text>
              </TouchableOpacity>
            </View>
          )}
          {isInvitacion && item.estadoAccion === 'Aceptada' && (
            <View style={styles.statusBadgeOk}>
              <Text style={styles.statusBadgeOkText}>✓ Aceptada</Text>
            </View>
          )}
          {isInvitacion && item.estadoAccion === 'Rechazada' && (
            <View style={styles.statusBadgeRej}>
              <Text style={styles.statusBadgeRejText}>✗ Rechazada</Text>
            </View>
          )}
        </View>
        {isNew && <View style={styles.newBadge} />}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modalCard} activeOpacity={1} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.currentSectionTitle}>NOTIFICACIONES</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close-circle" size={26} color="#ef4444" />
            </TouchableOpacity>
          </View>
          {isAdminOrPersonal && (
            <View style={styles.filterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={Platform.OS === 'web'} contentContainerStyle={styles.filterScroll}>
                {['Todas', 'Reservas', 'Competiciones', 'Membresías', 'Clases y Entrenamientos', 'Nuevos Usuarios', 'Documentación'].map(f => (
                  <TouchableOpacity 
                    key={f} 
                    style={[styles.filterBtn, filtro === f && styles.filterBtnActive]}
                    onPress={() => setFiltro(f)}
                  >
                    <Text style={[styles.filterBtnText, filtro === f && styles.filterBtnTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="large" color="#ffb300" style={styles.loader} />
          ) : notificacionesFiltradas.length === 0 ? (
            <Text style={styles.emptyText}>No tienes notificaciones en esta categoría.</Text>
          ) : (
            <FlatList
              data={notificacionesFiltradas}
              keyExtractor={item => item.id.toString()}
              renderItem={renderItem}
              style={styles.list}
            />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    width: '90%',
    maxWidth: 450,
    maxHeight: '85%',
    borderRadius: 30,
    padding: 25,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  currentSectionTitle: { 
    fontSize: 11, 
    fontWeight: '900', 
    color: '#009b3a', 
    letterSpacing: 1.2 
  },
  closeBtn: {
    padding: 5,
  },
  loader: {
    marginVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 40,
    fontSize: 16,
  },
  list: {
    flexGrow: 0,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  newItem: {
    backgroundColor: '#fff8e1',
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    paddingLeft: 10,
  },
  message: {
    fontSize: 14,
    color: '#333',
  },
  newMessage: {
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  newBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffb300',
    marginLeft: 10,
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  acceptBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  rejectBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  statusBadgeOk: {
    marginTop: 6,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusBadgeOkText: { color: '#16a34a', fontWeight: '800', fontSize: 11 },
  statusBadgeRej: {
    marginTop: 6,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusBadgeRejText: { color: '#ef4444', fontWeight: '800', fontSize: 11 },
  filterContainer: {
    marginBottom: 10,
    paddingBottom: Platform.OS === 'web' ? 8 : 0,
  },
  filterScroll: {
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  filterBtnActive: {
    backgroundColor: '#009b3a',
    borderColor: '#009b3a',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
});

export default NotificationDropdown;
