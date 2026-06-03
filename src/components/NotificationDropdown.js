import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Platform,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE_URL } from '../services/apiConfig';

const NotificationDropdown = ({ visible, onClose, token }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && token) {
      fetchNotificaciones();
      marcarLeidas();
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

  const renderItem = ({ item }) => {
    const isNew = !item.leida;
    
    let iconName = "bell-outline";
    let iconColor = "#000";
    if (item.tipo === "Reserva") { iconName = "calendar-check"; iconColor = "#28a745"; }
    else if (item.tipo === "NuevoRegistro") { iconName = "account-plus"; iconColor = "#17a2b8"; }
    else if (item.tipo === "Documentacion") { iconName = "file-document-alert"; iconColor = "#dc3545"; }
    else if (item.tipo === "Equipo" || item.tipo === "Torneo") { iconName = "trophy-outline"; iconColor = "#ffb300"; }
    else if (item.tipo === "Clase" || item.tipo === "Entrenamiento") { iconName = "run"; iconColor = "#6610f2"; }

    return (
      <View style={[styles.notificationItem, isNew && styles.newItem]}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.message, isNew && styles.newMessage]}>{item.mensaje}</Text>
          <Text style={styles.date}>{new Date(item.fechaCreacion).toLocaleString()}</Text>
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
        <TouchableOpacity style={styles.dropdown} activeOpacity={1} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notificaciones</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#ffb300" style={styles.loader} />
          ) : notificaciones.length === 0 ? (
            <Text style={styles.emptyText}>No tienes notificaciones nuevas.</Text>
          ) : (
            <FlatList
              data={notificaciones}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: Platform.OS === 'web' ? 'flex-start' : 'center',
    alignItems: Platform.OS === 'web' ? 'flex-end' : 'center',
  },
  dropdown: {
    backgroundColor: '#fff',
    width: Platform.OS === 'web' ? 400 : '90%',
    maxHeight: Platform.OS === 'web' ? '80%' : '70%',
    marginRight: Platform.OS === 'web' ? 50 : 0,
    marginTop: Platform.OS === 'web' ? 80 : 0,
    borderRadius: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f9fa'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
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
  }
});

export default NotificationDropdown;
