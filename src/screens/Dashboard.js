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
  StatusBar,
  useWindowDimensions,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { clienteService } from '../services/clienteService';
import { mercadoPagoService } from '../services/mercadoPagoService';
import { userService } from '../services/userService';
import Background from '../components/Background';
import BackgroundLogin from '../components/BackgroundLogin';
import Footer from '../components/Footer';
import Header from '../components/Header';
import StatCards from '../components/StatCards';
import InfoCarousel from '../components/InfoCarousel';

const { width: windowWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' && windowWidth > 768;

// CONFIGURACIÓN DE MÓDULOS CON SUS PANTALLAS VINCULADAS
const ALL_MODULES = [
  { id: "usuarios", title: "Usuarios", screen: "UserScreen", icon: "account-group", desc: "Clientes y Personal", color: "#3b82f6" },
  { id: "canchas", title: "Canchas", screen: "CanchasScreen", icon: "soccer-field", desc: "F5, F7 y F11", color: "#22c55e" },
  { id: "reservas", title: "Reservas", screen: "ReservasScreen", icon: "calendar-clock", desc: "Agenda de Turnos", color: "#a855f7" },
  { id: "competencias", title: "Competencias", screen: "CompetenciasScreen", icon: "trophy-variant", desc: "Ligas y Torneos", color: "#eab308" },
  { id: "staff", title: "Cuerpo Técnico", screen: "StaffScreen", icon: "account-tie-voice", desc: "Profesores y Entrenadores", color: "#ef4444" },
  { id: "inscripciones", title: "Inscripciones", screen: "InscripcionesScreen", icon: "soccer", desc: "CLASES Y ENTRENAMIENTOS", color: "#6366f1" },
  { id: "facturacion", title: "Facturación", screen: "FacturacionScreen", icon: "cash-register", desc: "Caja y Cobros", color: "#06b6d4" },
  { id: "reportes", title: "Reportes", screen: "ReportesScreen", icon: "chart-bar", desc: "Estadísticas", color: "#f97316" },
  { id: "clases-profe", title: "Clases a Cargo", screen: "ClasesProfeScreen", icon: "whistle", desc: "Ver alumnos inscriptos", color: "#6366f1" },
];

const ModuleCard = ({ module, currentRole, idPersona, userName, navigation, isMobile }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        isWeb && styles.cardWeb,
        isMobile && styles.cardMobile,
        isPressed && styles.cardPressed
      ]} 
      activeOpacity={1} 
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={() => {
        if (module.screen) {
          navigation.navigate(module.screen, { role: currentRole, idPersona, nombreUsuario: userName });
        }
      }}
    >
      <View style={[
        styles.iconContainer, 
        isMobile && styles.iconContainerMobile,
        { backgroundColor: isPressed ? 'rgba(0,0,0,0.1)' : module.color + '20' }
      ]}>
        <MaterialCommunityIcons 
          name={module.icon} 
          size={isMobile ? 26 : 32} 
          color={isPressed ? '#000' : module.color} 
        />
      </View>
      <View style={styles.cardTextContent}>
        <Text style={[styles.cardTitle, isMobile && styles.cardTitleMobile, isPressed && styles.textPressed]} selectable={false}>
          {module.title}
        </Text>
        <Text style={[styles.cardDesc, isMobile && styles.cardDescMobile, isPressed && styles.textPressed]} numberOfLines={1} selectable={false}>
          {module.desc}
        </Text>
      </View>
      <View style={[styles.arrowContainer, isMobile && styles.arrowContainerMobile, isPressed && { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
        <MaterialCommunityIcons 
          name="chevron-right" 
          size={isMobile ? 22 : 28} 
          color={isPressed ? '#000' : '#cbd5e1'} 
        />
      </View>
    </TouchableOpacity>
  );
};

export default function Dashboard({ route, navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  const { role, idPersona, idUsuario, nombreUsuario } = route.params || { role: "ADMIN", idPersona: null, idUsuario: null, nombreUsuario: "NOMBRE" };
  
  const [userName] = useState(nombreUsuario || "NOMBRE"); 
  const [currentCliente, setCurrentCliente] = useState(null);

  React.useEffect(() => {
    if (role === 'CLIENTE' && idPersona) {
      loadCliente();
    }
  }, [role, idPersona]);

  const loadCliente = async () => {
    try {
      const cliente = await clienteService.getById(idPersona);
      setCurrentCliente(cliente);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('collection_status') && urlParams.get('collection_status') === 'approved') {
        if (urlParams.has('pagoSocio')) {
          // El cliente pagó la membresía
          if (role === 'CLIENTE' && idPersona) {
            clienteService.getById(idPersona).then(c => {
              if (c) {
                clienteService.update(idPersona, { ...c, esSocioActivo: true }).then(() => {
                  loadCliente();
                  alert("¡Pago exitoso! Ahora eres Socio Activo.");
                  // Limpiar URL
                  window.history.replaceState({}, document.title, window.location.pathname + window.location.search.replace(/pagoSocio=[^&]+&?/, ''));
                });
              }
            });
          }
        } else {
          navigation.navigate('ReservasScreen', { role, idPersona, nombreUsuario: userName });
        }
      } else if (urlParams.has('preference_id') || urlParams.has('mp_return')) {
        navigation.navigate('ReservasScreen', { role, idPersona, nombreUsuario: userName });
      }
    }
  }, []);

  const handlePaySocio = async () => {
    try {
      const baseUrl = window.location.href.split('?')[0];
      let returnUrl = baseUrl + `?role=${role}&idPersona=${idPersona}&nombreUsuario=${userName}&pagoSocio=true`;
      const response = await mercadoPagoService.createPreference("Suscripción Socio Activo", 2000, returnUrl);
      if (response && response.initPoint) {
        window.location.href = response.initPoint;
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el pago.');
    }
  };

  const handleUploadAptoMedico = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (file.size > 2 * 1024 * 1024) {
          alert('El archivo excede el límite de 2MB.');
          return;
        }
        const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
        
        // Asignar fechas por defecto: hoy y en 1 año
        const hoy = new Date();
        const unAnio = new Date();
        unAnio.setFullYear(hoy.getFullYear() + 1);

        await userService.uploadAptoMedico({
          clienteId: idPersona,
          archivoBase64: base64,
          fechaInicio: hoy.toISOString(),
          fechaFin: unAnio.toISOString()
        });

        alert("Apto médico subido correctamente.");
        loadCliente();
      }
    } catch (e) {
      console.error(e);
      alert("Error al subir el apto médico.");
    }
  };

  const getVisibleModules = () => {
    switch (role) {
      case 'ADMIN':
        return ALL_MODULES.filter(m => m.id !== 'clases-profe');

      case 'PERSONAL':
        return ALL_MODULES.filter(m => m.id !== 'clases-profe').map(m => {
          if (m.id === 'usuarios') return { ...m, title: "Usuarios", desc: "Alta de Profesores y Clientes" };
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
        const allowedProfe = ['staff', 'reservas', 'clases-profe'];
        return ALL_MODULES
          .filter(m => allowedProfe.includes(m.id))
          .map(m => {
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
          bounces={false}
          overScrollMode="never"
        >
          <View style={styles.topContent}>
            <View style={styles.centralContainer}>
              
              <Header title="GOL AHORA" userRole={role} isWeb={isWeb} idPersona={idPersona} idUsuario={idUsuario} />

              <View style={styles.pitchContainer}>
                <BackgroundLogin /> 
                <View style={styles.innerContent}>
                  
                  <View style={[styles.welcomeBanner, isMobile && styles.welcomeBannerMobile]}>
                    <View style={styles.yellowStripe} />
                    <View style={styles.bannerInfo}>
                      <Text style={[styles.welcomeTitle, isMobile && styles.welcomeTitleMobile]} selectable={false}>{banner.title}</Text>
                      <Text style={[styles.welcomeSub, isMobile && styles.welcomeSubMobile]} selectable={false}>{banner.sub}</Text>
                    </View>
                    <MaterialCommunityIcons name="shield-check-outline" size={isMobile ? 32 : 40} color="#f1f5f9" style={styles.bannerDecoration} />
                  </View>

                  {role === 'CLIENTE' && currentCliente && (
                    <View style={styles.statusPanel}>
                      <Text style={styles.statusPanelTitle}>MI ESTADO</Text>
                      <View style={styles.statusCardsRow}>
                        {/* Tarjeta Socio */}
                        <View style={styles.statusCard}>
                          <MaterialCommunityIcons 
                            name={currentCliente.esSocioActivo ? "check-decagram" : "close-octagon"} 
                            size={28} 
                            color={currentCliente.esSocioActivo ? "#009b3a" : "#ef4444"} 
                          />
                          <Text style={styles.statusCardTitle}>
                            {currentCliente.esSocioActivo ? "SOCIO ACTIVO" : "NO SOCIO"}
                          </Text>
                          {!currentCliente.esSocioActivo && (
                            <TouchableOpacity style={styles.actionBtn} onPress={handlePaySocio}>
                              <Text style={styles.actionBtnText}>HACERME SOCIO ($2000)</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Tarjeta Apto Médico */}
                        <View style={styles.statusCard}>
                          <MaterialCommunityIcons 
                            name={currentCliente.aptoFisico ? "heart-pulse" : "heart-off"} 
                            size={28} 
                            color={currentCliente.aptoFisico ? "#009b3a" : "#ef4444"} 
                          />
                          <Text style={styles.statusCardTitle}>
                            {currentCliente.aptoFisico ? "APTO MÉDICO VIGENTE" : "SIN APTO MÉDICO"}
                          </Text>
                          {!currentCliente.aptoFisico && (
                            <TouchableOpacity style={styles.actionBtn} onPress={handleUploadAptoMedico}>
                              <Text style={styles.actionBtnText}>SUBIR APTO MÉDICO</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  )}

                  <View style={styles.grid}>
                    {visibleModules.map((item) => (
                      <ModuleCard 
                        key={item.id} 
                        module={item} 
                        currentRole={role} 
                        idPersona={idPersona}
                        userName={userName}
                        navigation={navigation} 
                        isMobile={isMobile}
                      />
                    ))}
                  </View>

                  <InfoCarousel />
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
  mainContainer: { flex: 1, backgroundColor: '#004d1a' },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 0 },
  scrollContent: { flexGrow: 1, justifyContent: 'space-between', paddingBottom: 30 },
  topContent: { width: '100%' },
  centralContainer: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 16 },
  pitchContainer: { width: '100%', borderRadius: 35, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)', position: 'relative', marginTop: 15 },
  innerContent: { padding: 16 },
  statsOuterContainer: { marginTop: 20, width: '100%' },
  welcomeBanner: { backgroundColor: '#fff', padding: 24, borderRadius: 24, marginBottom: 20, flexDirection: 'row', alignItems: 'center', position: 'relative', overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15 },
  welcomeBannerMobile: { padding: 16, borderRadius: 18, marginBottom: 15 },
  yellowStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: '#ffb300' },
  bannerDecoration: { position: 'absolute', right: -10, top: -5, opacity: 0.4 },
  welcomeTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b', letterSpacing: -0.5 },
  welcomeTitleMobile: { fontSize: 15 },
  welcomeSub: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 2 },
  welcomeSubMobile: { fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.92)', width: '100%', flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  cardWeb: { width: '48.5%' },
  cardMobile: { padding: 14, borderRadius: 20, marginBottom: 12 },
  cardPressed: { backgroundColor: '#ffb300', borderColor: '#e6a100', transform: [{ scale: 0.98 }] },
  textPressed: { color: '#000' },
  iconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  iconContainerMobile: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  cardTextContent: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', ...Platform.select({ web: { userSelect: 'none' } }) },
  cardTitleMobile: { fontSize: 16 },
  cardDesc: { fontSize: 12, color: '#64748b', fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3, ...Platform.select({ web: { userSelect: 'none' } }) },
  cardDescMobile: { fontSize: 10, marginTop: 0 },
  arrowContainer: { padding: 4, backgroundColor: '#f8fafc', borderRadius: 12 },
  arrowContainerMobile: { padding: 2, borderRadius: 8 },
  statusPanel: { marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  statusPanelTitle: { fontSize: 13, fontWeight: '900', color: '#475569', marginBottom: 12, letterSpacing: 1 },
  statusCardsRow: { flexDirection: 'row', gap: 12 },
  statusCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, shadowRadius: 5 },
  statusCardTitle: { fontSize: 12, fontWeight: '800', color: '#1e293b', marginTop: 8, textAlign: 'center', minHeight: 32 },
  actionBtn: { marginTop: 10, backgroundColor: '#ffb300', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, width: '100%', alignItems: 'center' },
  actionBtnText: { fontSize: 11, fontWeight: '800', color: '#000' }
});