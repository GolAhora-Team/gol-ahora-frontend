import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Platform, 
  StatusBar 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Background from '../components/Background';
import BackgroundLogin from '../components/BackgroundLogin';
import Footer from '../components/Footer';
import Header from '../components/Header';
import StatCards from '../components/StatCards';

const { width: windowWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' && windowWidth > 768;

// CONFIGURACIÓN DE MÓDULOS CON SUS PANTALLAS VINCULADAS
const ALL_MODULES = [
  { id: "usuarios", title: "Usuarios", screen: "UserScreen", icon: "account-group", desc: "Clientes y Personal", color: "#3b82f6" },
  { id: "canchas", title: "Canchas", screen: "CanchasScreen", icon: "soccer-field", desc: "F5, F7 y F11", color: "#22c55e" },
  { id: "reservas", title: "Reservas", screen: "ReservasScreen", icon: "calendar-clock", desc: "Agenda de Turnos", color: "#a855f7" },
  { id: "competencias", title: "Competencias", screen: "CompetenciasScreen", icon: "trophy-variant", desc: "Ligas y Torneos", color: "#eab308" },
  { id: "staff", title: "Cuerpo Técnico", screen: "staffScreen", icon: "account-tie-voice", desc: "Profesores y Entrenadores", color: "#ef4444" },
  { id: "inscripciones", title: "Inscripciones", screen: "InscripcionesScreen", icon: "soccer", desc: "CLASES Y ENTRENAMIENTOS", color: "#6366f1" },
  { id: "facturacion", title: "Facturación", screen: "FacturacionScreen", icon: "cash-register", desc: "Caja y Cobros", color: "#06b6d4" },
  { id: "reportes", title: "Reportes", screen: "ReportesScreen", icon: "chart-bar", desc: "Estadísticas", color: "#f97316" },
];

const ModuleCard = ({ module, currentRole, navigation }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        isWeb && styles.cardWeb,
        isPressed && styles.cardPressed
      ]} 
      activeOpacity={1} 
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={() => {
        if (module.screen) {
          navigation.navigate(module.screen, { role: currentRole });
        }
      }}
    >
      <View style={[
        styles.iconContainer, 
        { backgroundColor: isPressed ? 'rgba(0,0,0,0.1)' : module.color + '20' }
      ]}>
        <MaterialCommunityIcons 
          name={module.icon} 
          size={32} 
          color={isPressed ? '#000' : module.color} 
        />
      </View>
      <View style={styles.cardTextContent}>
        <Text style={[styles.cardTitle, isPressed && styles.textPressed]} selectable={false}>
          {module.title}
        </Text>
        <Text style={[styles.cardDesc, isPressed && styles.textPressed]} numberOfLines={1} selectable={false}>
          {module.desc}
        </Text>
      </View>
      <View style={[styles.arrowContainer, isPressed && { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
        <MaterialCommunityIcons 
          name="chevron-right" 
          size={28} 
          color={isPressed ? '#000' : '#cbd5e1'} 
        />
      </View>
    </TouchableOpacity>
  );
};

export default function Dashboard({ route, navigation }) {
  const { role } = route.params || { role: "ADMIN" };
  
  // VARIABLE DE NOMBRE VINCULAR A FUTURO CON EL USERNAME
  const [userName] = useState("NOMBRE"); 


  const getVisibleModules = () => {
    switch (role) {
      case 'ADMIN':
        return ALL_MODULES;

      case 'PERSONAL':
        return ALL_MODULES.map(m => {
          if (m.id === 'usuarios') return { ...m, title: "Clientes", desc: "Alta de Clientes" };
          return m;
        });

      case 'CLIENTE':
        const allowedCliente = ['canchas', 'reservas', 'competencias', 'inscripciones'];
        return ALL_MODULES
          .filter(m => allowedCliente.includes(m.id))
          .map(m => m.id === 'inscripciones' 
            ? { ...m, desc: "Mis clases y turnos" } 
            : m
          );

      case 'PROFE': 
      case 'PROFESORES':
        const allowedProfe = ['inscripciones', 'reservas', 'staff'];
        return ALL_MODULES
          .filter(m => allowedProfe.includes(m.id))
          .map(m => {
            if (m.id === 'inscripciones') return { ...m, title: "Mis Clases", desc: "Listado de Alumnos" };
            if (m.id === 'staff') return { ...m, desc: "Mi Legajo y Colegas" };
            return m;
          });

      default:
        return [];
    }
  };

  const getBannerContent = () => {
    if (role === 'ADMIN' || role === 'PERSONAL') {
      return {
        title: "PANEL DE CONTROL",
        sub: 'Gestión estratégica "Gol Ahora"'
      };
    } else if (role === 'CLIENTE') {
      return {
        title: `BIENVENIDO ${userName}`,
        sub: "Puedes realizar tus reservas o inscripciones de forma online."
      };
    } else if (role === 'PROFE' || role === 'PROFESORES') {
      return {
        title: `BIENVENIDO PROFESOR | ENTRENADOR ${userName}`,
        sub: "Puedes gestionar tus alumnos y clases."
      };
    }
    return { title: "GOL AHORA", sub: "Bienvenido al sistema" };
  };

  const visibleModules = getVisibleModules();
  const banner = getBannerContent();

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Background />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.topContent}>
            <View style={styles.centralContainer}>
              
              <Header title="GOL AHORA" userRole={role} isWeb={isWeb} />

              <View style={styles.pitchContainer}>
                <BackgroundLogin /> 
                <View style={styles.innerContent}>
                  
                  <View style={styles.welcomeBanner}>
                    <View style={styles.yellowStripe} />
                    <View style={styles.bannerInfo}>
                      <Text style={styles.welcomeTitle} selectable={false}>{banner.title}</Text>
                      <Text style={styles.welcomeSub} selectable={false}>{banner.sub}</Text>
                    </View>
                    <MaterialCommunityIcons name="shield-check-outline" size={40} color="#f1f5f9" style={styles.bannerDecoration} />
                  </View>

                  <View style={styles.grid}>
                    {visibleModules.map((item) => (
                      <ModuleCard 
                        key={item.id} 
                        module={item} 
                        currentRole={role} 
                        navigation={navigation} 
                      />
                    ))}
                  </View>
                </View>
              </View>

              {(role === 'ADMIN' || role === 'PERSONAL') && (
                <View style={styles.statsOuterContainer}>
                  <StatCards />
                </View>
              )}

            </View>
          </View>
          <Footer />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 0 },
  scrollContent: { flexGrow: 1, justifyContent: 'space-between', paddingBottom: 30 },
  topContent: { width: '100%' },
  centralContainer: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 16 },
  pitchContainer: { width: '100%', borderRadius: 35, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)', position: 'relative', marginTop: 15 },
  innerContent: { padding: 16 },
  statsOuterContainer: { marginTop: 20, width: '100%' },
  welcomeBanner: { backgroundColor: '#fff', padding: 24, borderRadius: 24, marginBottom: 20, flexDirection: 'row', alignItems: 'center', position: 'relative', overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15 },
  yellowStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: '#ffb300' },
  bannerDecoration: { position: 'absolute', right: -10, top: -5, opacity: 0.4 },
  welcomeTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b', letterSpacing: -0.5 },
  welcomeSub: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.92)', width: '100%', flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  cardWeb: { width: '48.5%' },
  cardPressed: { backgroundColor: '#ffb300', borderColor: '#e6a100', transform: [{ scale: 0.98 }] },
  textPressed: { color: '#000' },
  iconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardTextContent: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', ...Platform.select({ web: { userSelect: 'none' } }) },
  cardDesc: { fontSize: 12, color: '#64748b', fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3, ...Platform.select({ web: { userSelect: 'none' } }) },
  arrowContainer: { padding: 4, backgroundColor: '#f8fafc', borderRadius: 12 },
});