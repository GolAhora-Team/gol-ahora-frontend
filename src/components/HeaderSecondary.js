import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Platform,
  useWindowDimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const HeaderSecondary = ({ title, userRole, isWeb, onBack }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const [isPressed, setIsPressed] = useState(false);
  const [weather, setWeather] = useState({ temp: null, icon: 'weather-cloudy' });

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
  }, []);

  const getBadgeColor = () => {
    switch (userRole) {
      case 'ADMIN': return '#ffb300';
      case 'PERSONAL': return '#ffb300';
      case 'CLIENTE': return '#ffb300';
       case 'PROFE': return '#ffb300';
      default: return '#ffb300';
    }
  };

  return (
    <View style={[styles.header, isWeb && styles.headerWeb, isMobile && styles.headerMobile]}>
      <View style={styles.headerInfo}>
        <Text 
          style={[styles.headerBrand, isMobile && styles.headerBrandMobile]} 
          numberOfLines={1}
          selectable={false}
        >
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
          <View style={styles.weatherContainer}>
            <MaterialCommunityIcons name={weather.icon} size={isMobile ? 22 : 26} color="#fff" />
            <Text style={[styles.weatherText, isMobile && { fontSize: 14 }]} selectable={false}>{weather.temp}°</Text>
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.headerBtn, 
            isMobile && styles.headerBtnMobile,
            isPressed && styles.btnActive
          ]} 
          activeOpacity={1}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          onPress={onBack}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={isMobile ? 22 : 28} 
            color={isPressed ? "#000" : "#fff"} 
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
  headerMobile: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginHorizontal: 10,
    borderRadius: 20,
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
    ...Platform.select({
      web: { userSelect: 'none' }
    })
  },
  headerBrandMobile: {
    fontSize: 22,
    lineHeight: 28,
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
    ...Platform.select({
      web: { userSelect: 'none' }
    })
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
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
  },
  btnActive: {
    backgroundColor: '#ffb300',
    transform: [{ scale: 0.92 }],
  }
});

export default HeaderSecondary;
