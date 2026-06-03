import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Platform, 
  Alert,
  Modal,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native'; 
import SettingsModal from './SettingsModal';
import ConfirmModal from './ConfirmModal';
import NotificationDropdown from './NotificationDropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../services/apiConfig';

const Header = ({ title, userRole, isWeb, idPersona, idUsuario }) => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const isFocused = useIsFocused();
  
  // Estados para efectos visuales y modales
  const [pressedSettings, setPressedSettings] = useState(false);
  const [pressedLogout, setPressedLogout] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [weather, setWeather] = useState({ temp: null, icon: 'weather-cloudy' });
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [token, setToken] = useState(null);

  React.useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-34.7964&longitude=-58.2758&current_weather=true')
      .then(res => res.json())
      .then(data => {
        if (data && data.current_weather) {
          const temp = Math.round(data.current_weather.temperature);
          const code = data.current_weather.weathercode;
          let icon = 'weather-cloudy';
          if (code === 0) icon = 'weather-sunny';
          else if (code >= 1 && code <= 3) icon = 'weather-partly-cloudy';
          else if (code === 45 || code === 48) icon = 'weather-fog';
          else if (code >= 51 && code <= 55) icon = 'weather-partly-rainy';
          else if (code >= 61 && code <= 65) icon = 'weather-pouring';
          else if (code >= 71 && code <= 75) icon = 'weather-snowy';
          else if (code >= 95) icon = 'weather-lightning';
          setWeather({ temp, icon });
        }
      })
      .catch(e => console.log('Weather fetch error:', e));

    const checkToken = async () => {
      try {
        const storedToken = Platform.OS === 'web' 
          ? localStorage.getItem('GOL_AHORA_SESSION') 
          : await AsyncStorage.getItem('userToken');
        if (storedToken) {
          setToken(storedToken);
          fetchUnreadCount(storedToken);
        }
      } catch (e) { }
    };
    checkToken();
    
    // Polling every 60s
    const interval = setInterval(() => {
      checkToken();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (token) fetchUnreadCount();
  }, [token, isFocused]);

  const fetchUnreadCount = async () => {
    try {
      if (token && isFocused) {
        fetch(`${API_BASE_URL}/Notificacion`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          const noLeidas = (data || []).filter(n => !n.leida).length;
          setUnreadCount(noLeidas);
        })
        .catch(e => console.log('Error notificaciones:', e));
      }
    } catch(e) {}
  };

  const getBadgeColor = () => {
    switch (userRole) {
      case 'ADMIN': return '#ffb300';
      case 'PERSONAL': return '#ffb300';
      case 'PROFE': return '#ffb300';
      case 'CLIENTE': return '#ffb300';
      default: return '#ffb300';
    }
  };

  const handleLogout = () => {
    setConfirmLogoutVisible(true);
  };

  const executeLogout = () => {
    setIsLoggingOut(true);
    if (Platform.OS === 'web') {
      localStorage.removeItem('GOL_AHORA_SESSION');
    }
    setTimeout(() => {
      setIsLoggingOut(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }, 1500);
  };

  return (
    <View style={[styles.header, isWeb && styles.headerWeb, isMobile && styles.headerMobile]}>
      <View style={styles.headerInfo}>
        <Text style={[styles.headerBrand, isMobile && styles.headerBrandMobile]} numberOfLines={1} selectable={false}>
          {title || "GOL AHORA"}
        </Text>
        <View style={[styles.roleBadge, { backgroundColor: getBadgeColor() }]}>
          <Text style={[styles.roleText, isMobile && { fontSize: 12 }]} selectable={false}>
            {userRole}
          </Text>
        </View>
      </View>
      
      <View style={styles.headerIcons}>
      
        {weather.temp !== null && (
          <View style={[styles.weatherContainer, isMobile && styles.weatherContainerMobile]}>
            <MaterialCommunityIcons name={weather.icon} size={isMobile ? 20 : 26} color="#fff" />
            <Text style={[styles.weatherText, isMobile && { fontSize: 13, marginLeft: 4 }]} selectable={false}>{weather.temp}°</Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.headerBtn, isMobile && styles.headerBtnMobile, notificationsVisible && styles.btnActive]} 
          onPress={() => {
            setNotificationsVisible(true);
            setUnreadCount(0);
          }}
        >
          <MaterialCommunityIcons 
            name={unreadCount > 0 ? "bell-badge-outline" : "bell-outline"} 
            size={isMobile ? 22 : 28} 
            color={notificationsVisible ? "#000" : "#fff"} 
          />
          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.headerBtn, isMobile && styles.headerBtnMobile, pressedSettings && styles.btnActive]} 
          activeOpacity={1}
          onPressIn={() => setPressedSettings(true)}
          onPressOut={() => setPressedSettings(false)}
          onPress={() => setModalVisible(true)}
        >
          <MaterialCommunityIcons 
            name="cog-outline" 
            size={isMobile ? 22 : 28} 
            color={pressedSettings ? "#000" : "#fff"} 
          />
        </TouchableOpacity>
        
        
        <TouchableOpacity 
          style={[styles.headerBtn, isMobile && styles.headerBtnMobile, pressedLogout && styles.btnActive]} 
          activeOpacity={1}
          onPressIn={() => setPressedLogout(true)}
          onPressOut={() => setPressedLogout(false)}
          onPress={handleLogout} 
        >
          <MaterialCommunityIcons 
            name="logout" 
            size={isMobile ? 22 : 28} 
            color={pressedLogout ? "#000" : "#fff"} 
          />
        </TouchableOpacity>
      </View>

      
      <SettingsModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        userRole={userRole}
        userName={title}
        idPersona={idPersona}
        idUsuario={idUsuario}
      />

      <NotificationDropdown 
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        token={token}
      />

      <ConfirmModal
        visible={confirmLogoutVisible}
        onClose={() => setConfirmLogoutVisible(false)}
        onConfirm={executeLogout}
        title="Cerrar Sesión"
        message="¿Estás seguro que deseas cerrar sesión?"
        confirmText="Salir"
        cancelText="Cancelar"
      />

      <Modal visible={isLoggingOut} transparent={true} animationType="fade">
        <View style={styles.logoutOverlay}>
          <ActivityIndicator size="large" color="#009b3a" />
          <Text style={styles.logoutText}>Cerrando sesión...</Text>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18, 
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 17.5,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    marginTop: Platform.OS === 'android' ? 5 : 0,
    elevation: 5,
  },
  headerMobile: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginHorizontal: 10,
    borderRadius: 20,
  },
  headerWeb: { 
    // width: '95%' y maxWidth eliminados para que respete marginHorizontal
  },
  headerInfo: { 
    flex: 1, 
    flexDirection: 'column', 
    justifyContent: 'center' 
  },
  headerBrand: { 
    color: '#fff', 
    fontSize: 32, 
    fontWeight: '900', 
    letterSpacing: -1,
    lineHeight: 40,
    textTransform: 'uppercase',
    ...Platform.select({ web: { userSelect: 'none' } })
  },
  headerBrandMobile: {
    fontSize: 18,
    lineHeight: 22,
  },
  roleBadge: { 
    alignSelf: 'flex-start', 
    paddingHorizontal: 10, 
    paddingVertical: 3, 
    borderRadius: 6, 
    marginTop: 2 
  },
  roleText: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: '#000', 
    textTransform: 'uppercase',
    ...Platform.select({ web: { userSelect: 'none' } })
  },
  headerIcons: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  weatherContainerMobile: {
    marginRight: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  weatherText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
    ...Platform.select({ web: { userSelect: 'none' } })
  },
  headerBtn: { 
    marginLeft: 12,
    width: 48,
    height: 48,
    borderRadius: 24, 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerBtnMobile: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 4,
  },
  btnActive: {
    backgroundColor: '#ffb300',
    transform: [{ scale: 0.92 }],
  },
  logoutOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.85)', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  logoutText: {
    color: '#fff', 
    marginTop: 15, 
    fontSize: 18, 
    fontWeight: 'bold',
    letterSpacing: 1
  },
  badgeContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  }
});

export default Header;
