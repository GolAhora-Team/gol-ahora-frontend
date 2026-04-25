import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Platform, 
  Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; 

const Header = ({ title, userRole, isWeb }) => {
  const navigation = useNavigation();
  const [pressedSettings, setPressedSettings] = useState(false);
  const [pressedLogout, setPressedLogout] = useState(false);

  const getBadgeColor = () => {
    switch (userRole) {
      case 'ADMIN': return '#ffb300';
      case 'PERSONAL': return '#ffb300';
      case 'CLIENTE': return '#ffb300';
      case 'PROFE': return '#ffb300';
      default: return '#ffb300';
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // Lógica para Web
      const confirmWeb = window.confirm("¿Estás seguro que deseas cerrar sesión?");
      if (confirmWeb) navigation.navigate('Login');
    } else {
      // Lógica para Android/iOS
      Alert.alert(
        "Cerrar Sesión",
        "¿Estás seguro que deseas cerrar sesión?",
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Salir", 
            onPress: () => navigation.navigate('Login'),
            style: "destructive" 
          }
        ]
      );
    }
  };

  return (
    <View style={[styles.header, isWeb && styles.headerWeb]}>
      <View style={styles.headerInfo}>
        <Text style={styles.headerBrand} numberOfLines={1} selectable={false}>
          {title || "GOL AHORA"}
        </Text>
        <View style={[styles.roleBadge, { backgroundColor: getBadgeColor() }]}>
          <Text style={styles.roleText} selectable={false}>
            {userRole}
          </Text>
        </View>
      </View>
      
      <View style={styles.headerIcons}>
        <TouchableOpacity 
          style={[styles.headerBtn, pressedSettings && styles.btnActive]} 
          activeOpacity={1}
          onPressIn={() => setPressedSettings(true)}
          onPressOut={() => setPressedSettings(false)}
        >
          <MaterialCommunityIcons 
            name="cog-outline" 
            size={28} 
            color={pressedSettings ? "#000" : "#fff"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.headerBtn, pressedLogout && styles.btnActive]} 
          activeOpacity={1}
          onPressIn={() => setPressedLogout(true)}
          onPressOut={() => setPressedLogout(false)}
          onPress={handleLogout} 
        >
          <MaterialCommunityIcons 
            name="logout" 
            size={28} 
            color={pressedLogout ? "#000" : "#fff"} 
          />
        </TouchableOpacity>
      </View>
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
    marginHorizontal: 15,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    marginTop: Platform.OS === 'android' ? 5 : 0,
  },
  headerWeb: { 
    maxWidth: 1200, 
    alignSelf: 'center', 
    width: '95%' 
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
    ...Platform.select({ web: { userSelect: 'none' } })
  },
  roleBadge: { 
    alignSelf: 'flex-start', 
    paddingHorizontal: 10, 
    paddingVertical: 3, 
    borderRadius: 6, 
    marginTop: 2 
  },
  roleText: { 
    fontSize: 16, 
    fontWeight: '900', 
    color: '#000', 
    textTransform: 'uppercase',
    ...Platform.select({ web: { userSelect: 'none' } })
  },
  headerIcons: { 
    flexDirection: 'row', 
    alignItems: 'center' 
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
  btnActive: {
    backgroundColor: '#ffb300',
    transform: [{ scale: 0.92 }],
  }
});

export default Header;