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
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { clienteService } from '../services/clienteService';
import { profesorService } from '../services/profesorService';
import { mercadoPagoService } from '../services/mercadoPagoService';
import { userService } from '../services/userService';
import { facturaService } from '../services/facturaService';
import Background from '../components/Background';
import BackgroundLogin from '../components/BackgroundLogin';
import Footer from '../components/Footer';
import Header from '../components/Header';
import StatCards from '../components/StatCards';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';
import ConfirmModal from '../components/ConfirmModal';
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
  { id: "mis-recibos", title: "Mis Recibos", screen: "MisRecibosScreen", icon: "receipt", desc: "Comprobantes de pago", color: "#ec4899" },
];

const ModuleCard = ({ module, currentRole, idPersona, idUsuario, userName, navigation, isMobile }) => {
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
          navigation.navigate(module.screen, { role: currentRole, idPersona, idUsuario, nombreUsuario: userName });
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

const getFlagUrl = (team) => {
  if (!team) return 'un'; // default
  const name = team.toLowerCase();
  if (name.includes('argentina')) return 'ar';
  if (name.includes('algeria')) return 'dz';
  if (name.includes('austria')) return 'at';
  if (name.includes('jordan')) return 'jo';
  if (name.includes('brazil') || name.includes('brasil')) return 'br';
  if (name.includes('france')) return 'fr';
  if (name.includes('spain') || name.includes('españa')) return 'es';
  if (name.includes('england') || name.includes('inglaterra')) return 'gb-eng';
  if (name.includes('uruguay')) return 'uy';
  if (name.includes('chile')) return 'cl';
  if (name.includes('colombia')) return 'co';
  if (name.includes('ecuador')) return 'ec';
  if (name.includes('peru') || name.includes('perú')) return 'pe';
  if (name.includes('venezuela')) return 've';
  if (name.includes('bolivia')) return 'bo';
  if (name.includes('paraguay')) return 'py';
  if (name.includes('mexico') || name.includes('méxico')) return 'mx';
  if (name.includes('usa') || name.includes('estados unidos')) return 'us';
  if (name.includes('canada') || name.includes('canadá')) return 'ca';
  return 'un';
};

const convertToArgentinaTime = (timeStr) => {
  if (!timeStr) return '';
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s+UTC([+-]\d+)/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const utcOffset = parseInt(match[3], 10);
    const diff = -3 - utcOffset;
    hours = (hours + diff + 24) % 24;
    const formattedHours = hours.toString().padStart(2, '0');
    return `${formattedHours}:${minutes} hs (Hora Arg)`;
  }
  return timeStr;
};

export default function Dashboard({ route, navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  // Si no hay params (ej. refresh de página), vamos al login para que el auto-login restaure el estado
  React.useEffect(() => {
    if (!route.params || !route.params.role) {
      navigation.replace('Login');
    }
  }, [route.params]);

  const { role, idPersona, idUsuario, nombreUsuario } = route.params || { role: "ADMIN", idPersona: null, idUsuario: null, nombreUsuario: "NOMBRE" };
  
  const [userName] = useState(nombreUsuario || "NOMBRE"); 
  const [currentCliente, setCurrentCliente] = useState(null);
  const [currentProfesor, setCurrentProfesor] = useState(null);
  const [successModalMessage, setSuccessModalMessage] = useState(null);
  const [errorModalMessage, setErrorModalMessage] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [unsubscribeModalVisible, setUnsubscribeModalVisible] = useState(false);

  const getPrecioMembresia = () => {
    try {
      const saved = localStorage.getItem('GOL_AHORA_PRECIO_MEMBRESIA');
      if (saved) return parseInt(saved);
    } catch (e) { /* ignore */ }
    return 2000;
  };

  React.useEffect(() => {
    if (role === 'CLIENTE' && idPersona) {
      loadCliente();
    } else if (role === 'PROFE' && idPersona) {
      loadProfesor();
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

  const loadProfesor = async () => {
    try {
      const profe = await profesorService.getById(idPersona);
      setCurrentProfesor(profe);
    } catch (e) {
      console.error("Error al cargar profesor:", e);
    }
  };

  const [worldCupMatches, setWorldCupMatches] = useState([]);
  const [loadingWorldCup, setLoadingWorldCup] = useState(true);

  React.useEffect(() => {
    const fetchWorldCup = async () => {
      try {
        setLoadingWorldCup(true);
        const res = await fetch("https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json");
        const json = await res.json();
        if (json && json.matches) {
          // Filtrar partidos de Argentina
          const argMatches = json.matches.filter(match => 
            (match.team1 && match.team1.toLowerCase().includes('argentina')) || 
            (match.team2 && match.team2.toLowerCase().includes('argentina'))
          );
          setWorldCupMatches(argMatches);
        }
      } catch (e) {
        console.error("Error fetching world cup matches", e);
      } finally {
        setLoadingWorldCup(false);
      }
    };
    fetchWorldCup();
  }, []);

  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const urlParams = new URLSearchParams(window.location.search);
      const getParam = (key) => urlParams.get(key) || route.params?.[key];
      const hasParam = (key) => urlParams.has(key) || (route.params && route.params[key] !== undefined);


      const cleanUpUrl = () => {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search.replace(/pagoSocio=[^&]+&?/, '').replace(/collection_status=[^&]+&?/, ''));
        navigation.setParams({ pagoSocio: undefined, collection_status: undefined, mp_return: undefined, preference_id: undefined, mp_module: undefined });
      };

      if (hasParam('collection_status') && getParam('collection_status') === 'approved') {
        if (hasParam('pagoSocio')) {
          // El cliente pagó la membresía
          if (role === 'CLIENTE' && idPersona) {
            clienteService.getById(idPersona).then(async c => {
              if (c) {
                try {
                  const now = new Date();
                  now.setHours(now.getHours() - 3);
                  await facturaService.create({
                    fechaEmision: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, -1),
                    total: getPrecioMembresia(),
                    estado: 2,
                    tipo: 1,
                    descripcion: `Suscripción Socio Activo - Online (MERCADOPAGO)`,
                    clienteId: idPersona
                  });
                } catch (e) { console.error("Error creating factura", e); }

                clienteService.update(idPersona, { ...c, esSocioActivo: true }).then(() => {
                  loadCliente();
                  setSuccessModalMessage("Felicidades ahora eres socio de Gol Ahora.");
                  cleanUpUrl();
                }).catch(err => {
                  console.error("Error actualizando socio", err);
                  setErrorModalMessage("Ocurrió un error al intentar activar tu membresía.");
                  cleanUpUrl();
                });
              }
            }).catch(err => {
              console.error("Error obteniendo cliente", err);
              setErrorModalMessage("Ocurrió un error al intentar verificar tus datos.");
              cleanUpUrl();
            });
          }
        } else {
          const targetModule = getParam('mp_module') || 'ReservasScreen';
          navigation.navigate(targetModule, { 
            role, 
            idPersona, 
            nombreUsuario: userName,
            collection_status: getParam('collection_status'),
            mp_return: getParam('mp_return')
          });
        }
      } else if (hasParam('pagoSocio') && hasParam('collection_status') && getParam('collection_status') !== 'approved') {
        setErrorModalMessage("El pago no se pudo completar y no se pudo dar de alta para ser socio.");
        cleanUpUrl();
      } else if (hasParam('pagoSocio') && !hasParam('collection_status')) {
        // En caso de que haya tocado volver a la tienda antes de pagar, a veces no manda collection_status
        setErrorModalMessage("El pago no se pudo completar y no se pudo dar de alta para ser socio.");
        cleanUpUrl();
      } else if (hasParam('preference_id') || hasParam('mp_return')) {
        const targetModule = getParam('mp_module') || 'ReservasScreen';
        navigation.navigate(targetModule, { 
          role, 
          idPersona, 
          nombreUsuario: userName,
          collection_status: getParam('collection_status'),
          mp_return: getParam('mp_return')
        });
      }
    }
  }, []);

  const handlePaySocio = async () => {
    try {
      let returnUrl = window.location.origin + `/dashboard?role=${role}&idPersona=${idPersona}&nombreUsuario=${userName}&pagoSocio=true`;
      const response = await mercadoPagoService.createPreference("Suscripción Socio Activo", getPrecioMembresia(), returnUrl);
      if (response && response.initPoint) {
        window.location.href = response.initPoint;
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el pago.');
    }
  };

  const handleUnsubscribeSocio = async () => {
    try {
      if (currentCliente) {
        await clienteService.update(idPersona, { ...currentCliente, esSocioActivo: false });
        await loadCliente();
        setSuccessModalMessage("Te has dado de baja como socio de Gol Ahora.");
      }
    } catch (error) {
      console.error("Error al dar de baja", error);
      setErrorModalMessage("Ocurrió un error al intentar darte de baja.");
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

        const proceedUpload = async (base64) => {
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
        };

        if (Platform.OS === 'web') {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64 = reader.result.split(',')[1];
            await proceedUpload(base64);
          };
          reader.readAsDataURL(file.file);
        } else {
          const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
          await proceedUpload(base64);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Error al subir el apto médico.");
    }
  };

  const handleUploadCertificado = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (file.size > 4 * 1024 * 1024) {
          alert('El archivo excede el límite de 4MB.');
          return;
        }

        const proceedUpload = async (base64) => {
          // Asignar fechas por defecto: hoy y en 1 año
          const hoy = new Date();
          const unAnio = new Date();
          unAnio.setFullYear(hoy.getFullYear() + 1);

          // Llamar a profesorService.updateSimple para actualizar el certificado
          const currentData = currentProfesor || {};
          await profesorService.updateSimple(idPersona, {
            telefono: currentData.telefono || "",
            direccion: currentData.direccion || "",
            localidad: currentData.localidad || "",
            codigoPostal: currentData.codigoPostal || "",
            provincia: currentData.provincia || "",
            pais: currentData.pais || "",
            contactoEmergencia: currentData.contactoEmergencia || "",
            email: currentData.email || "",
            certificadoBase64: base64,
            certificadoFechaInicio: hoy.toISOString(),
            certificadoFechaFin: unAnio.toISOString()
          });

          alert("Certificado profesional subido correctamente.");
          loadProfesor();
        };

        if (Platform.OS === 'web') {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64 = reader.result.split(',')[1];
            await proceedUpload(base64);
          };
          reader.readAsDataURL(file.file);
        } else {
          const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
          await proceedUpload(base64);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Error al subir el certificado profesional.");
    }
  };

  const getVisibleModules = () => {
    switch (role) {
      case 'ADMIN':
        return ALL_MODULES.filter(m => m.id !== 'clases-profe' && m.id !== 'mis-recibos');

      case 'PERSONAL':
        return ALL_MODULES.filter(m => m.id !== 'clases-profe' && m.id !== 'mis-recibos').map(m => {
          if (m.id === 'usuarios') return { ...m, title: "Usuarios", desc: "Alta de Profesores y Clientes" };
          return m;
        });

      case 'CLIENTE':
        const allowedCliente = ['canchas', 'reservas', 'competencias', 'inscripciones', 'mis-recibos'];
        return ALL_MODULES
          .filter(m => allowedCliente.includes(m.id))
          .map(m => {
            if (m.id === 'inscripciones') return { ...m, desc: "Mis clases y turnos" };
            return m;
          });

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
          showsVerticalScrollIndicator={true}
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
                          {!currentCliente.esSocioActivo ? (
                            <TouchableOpacity style={styles.actionBtn} onPress={() => setConfirmModalVisible(true)}>
                              <Text style={styles.actionBtnText}>HACERME SOCIO (${getPrecioMembresia().toLocaleString('es-AR')})</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={() => setUnsubscribeModalVisible(true)}>
                              <Text style={styles.actionBtnText}>DARSE DE BAJA</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Tarjeta Apto Médico */}
                        <View style={styles.statusCard}>
                          <MaterialCommunityIcons 
                            name={currentCliente.tieneAptoMedicoArchivo ? "heart-pulse" : "heart-off"} 
                            size={28} 
                            color={currentCliente.tieneAptoMedicoArchivo ? "#009b3a" : "#ef4444"} 
                          />
                          <Text style={styles.statusCardTitle}>
                            {currentCliente.tieneAptoMedicoArchivo ? "APTO MÉDICO VIGENTE" : "SIN APTO MÉDICO"}
                          </Text>
                          <TouchableOpacity style={styles.actionBtn} onPress={handleUploadAptoMedico}>
                            <Text style={styles.actionBtnText}>
                              {currentCliente.tieneAptoMedicoArchivo ? "ACTUALIZAR APTO MÉDICO" : "SUBIR APTO MÉDICO"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}

                  {role === 'PROFE' && currentProfesor && (
                    <View style={styles.statusPanel}>
                      <Text style={styles.statusPanelTitle}>MI ESTADO</Text>
                      <View style={styles.statusCardsRow}>
                        {/* Tarjeta Certificado Profesional */}
                        <View style={styles.statusCard}>
                          <MaterialCommunityIcons 
                            name={currentProfesor.tieneCertificado ? "check-decagram" : "alert-decagram"} 
                            size={28} 
                            color={currentProfesor.tieneCertificado ? "#009b3a" : "#ef4444"} 
                          />
                          <Text style={styles.statusCardTitle}>
                            {currentProfesor.tieneCertificado ? "CERTIFICADO VIGENTE" : "SIN CERTIFICADO VÁLIDO"}
                          </Text>
                          <TouchableOpacity style={styles.actionBtn} onPress={handleUploadCertificado}>
                            <Text style={styles.actionBtnText}>
                              {currentProfesor.tieneCertificado ? "ACTUALIZAR CERTIFICADO" : "SUBIR CERTIFICADO"}
                            </Text>
                          </TouchableOpacity>
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
                        idUsuario={idUsuario}
                        userName={userName}
                        navigation={navigation} 
                        isMobile={isMobile}
                      />
                    ))}
                  </View>

                   <InfoCarousel />

                  {(role === 'ADMIN' || role === 'PERSONAL') && (
                    <View style={styles.statsOuterContainer}>
                      <StatCards />
                    </View>
                  )}

                </View>
              </View>
              
              {/* WIDGET MUNDIAL 2026 - Responsive Horizontal Cards (Afuera de la cancha) */}
              <View style={{ paddingHorizontal: 16 }}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 5, gap: 15, alignItems: 'stretch', flexGrow: 1 }}
                  style={{ marginTop: 15, marginBottom: 15, flexDirection: 'row' }}
                >
                  {/* Title Card */}
                  <View style={[styles.worldCupCard, styles.worldCupTitleCard, isMobile && styles.worldCupCardMobile]}>
                    <View style={{ marginRight: 12, justifyContent: 'center' }}>
                      <Image 
                        source={require('../../assets/logo-mundial.png')} 
                        style={{ width: 38, height: 50 }} 
                        resizeMode="contain" 
                      />
                    </View>
                    <View style={styles.worldCupBarTitleContainer}>
                      <Text style={[styles.worldCupBarTitle, isMobile && styles.worldCupBarTitleMobile]} selectable={false}>MUNDIAL DE LA FIFA 2026</Text>
                      <Text style={styles.worldCupBarSubtitle} selectable={false}>PRÓXIMOS PARTIDOS DE LA SCALONETA</Text>
                    </View>
                  </View>

                  {loadingWorldCup ? (
                    <ActivityIndicator size="small" color="#ffb300" style={{ marginHorizontal: 30 }} />
                  ) : worldCupMatches.length === 0 ? (
                    <Text style={styles.worldCupBarNoMatches}>No hay partidos programados.</Text>
                  ) : (
                    worldCupMatches.map((match, idx) => (
                      <View key={idx} style={[styles.worldCupCard, styles.worldCupMatchCard, isMobile && styles.worldCupCardMobile]}>
                        <View style={styles.worldCupBarMatchHeader}>
                          <Text style={styles.worldCupBarMatchday}>MATCHDAY {match.matchday || idx + 1}</Text>
                          <Text style={styles.worldCupBarMatchday}>{match.ground || ''}</Text>
                        </View>
                        <View style={styles.worldCupBarTeamsRow}>
                          <View style={styles.teamContainer}>
                            <Image 
                              source={{ uri: `https://flagcdn.com/w40/${getFlagUrl(match.team1)}.png` }} 
                              style={styles.flagIcon} 
                              resizeMode="contain" 
                            />
                            <Text style={[styles.worldCupBarTeamLeft, isMobile && styles.worldCupBarTeamMobile]} numberOfLines={1}>
                              {match.team1}
                            </Text>
                          </View>
                          <View style={styles.worldCupBarVsBadge}>
                            <Text style={styles.worldCupBarVsText}>VS</Text>
                          </View>
                          <View style={styles.teamContainer}>
                            <Text style={[styles.worldCupBarTeamRight, isMobile && styles.worldCupBarTeamMobile]} numberOfLines={1}>
                              {match.team2}
                            </Text>
                            <Image 
                              source={{ uri: `https://flagcdn.com/w40/${getFlagUrl(match.team2)}.png` }} 
                              style={styles.flagIcon} 
                              resizeMode="contain" 
                            />
                          </View>
                        </View>
                        <View style={styles.worldCupBarTimeRow}>
                          <MaterialCommunityIcons name="clock-outline" size={11} color="#94a3b8" />
                          <Text style={[styles.worldCupBarMatchday, { color: '#94a3b8', fontWeight: '700' }]}>
                            {match.date} a las {convertToArgentinaTime(match.time)}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          </View>
          <Footer />
        </ScrollView>
      </SafeAreaView>

      <SuccessModal
        visible={!!successModalMessage}
        message={successModalMessage}
        onClose={() => setSuccessModalMessage(null)}
      />
      <ErrorModal
        visible={!!errorModalMessage}
        message={errorModalMessage}
        onClose={() => setErrorModalMessage(null)}
      />
      <ConfirmModal
        visible={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        onConfirm={handlePaySocio}
        title="Confirmar Suscripción"
        message="¿Estás seguro de que quieres hacerte socio? Serás redirigido a Mercado Pago para efectuar el pago de la membresía."
        confirmText="Ir a Pagar"
        cancelText="Cancelar"
      />
      <ConfirmModal
        visible={unsubscribeModalVisible}
        onClose={() => setUnsubscribeModalVisible(false)}
        onConfirm={handleUnsubscribeSocio}
        title="Darse de Baja"
        message="¿Estás seguro de darte de baja como socio de Gol Ahora? Perderás todos tus beneficios exclusivos."
        confirmText="Sí, dar de baja"
        cancelText="Conservar membresía"
        icon="alert-circle-outline"
        color="#ef4444"
      />
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
  actionBtnText: { fontSize: 11, fontWeight: '800', color: '#000' },
  
  // ESTILOS WIDGET MUNDIAL 2026 - Tarjetas horizontales
  worldCupCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)', 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.5)', 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 10,
    justifyContent: 'center',
    padding: 14,
  },
  worldCupTitleCard: {
    flexDirection: 'row', 
    alignItems: 'center', 
    minWidth: isWeb ? 260 : 200,
    flex: 1,
  },
  worldCupBarIcon: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    backgroundColor: 'rgba(255,179,0,0.15)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12,
  },
  worldCupBarTitleContainer: { 
    flexShrink: 1,
  },
  worldCupBarTitle: { 
    color: '#0f172a', 
    fontSize: isWeb ? 14 : 12, 
    fontWeight: '900', 
    letterSpacing: 0.5,
    ...Platform.select({ web: { userSelect: 'none' } }),
  },
  worldCupBarSubtitle: { 
    color: '#94a3b8', 
    fontSize: isWeb ? 10 : 8, 
    fontWeight: '700', 
    marginTop: 3, 
    letterSpacing: 0.3,
    ...Platform.select({ web: { userSelect: 'none' } }),
  },
  worldCupMatchCard: {
    minWidth: isWeb ? 240 : 200,
    flex: 1,
  },
  worldCupBarMatchHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 6,
  },
  worldCupBarMatchday: { 
    color: '#475569', 
    fontSize: 10, 
    fontWeight: '900', 
    letterSpacing: 0.5,
    ...Platform.select({ web: { userSelect: 'none' } }),
  },
  worldCupBarGround: { 
    color: '#94a3b8', 
    fontSize: 9, 
    fontWeight: '700',
    ...Platform.select({ web: { userSelect: 'none' } }),
  },
  worldCupBarTeamsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8,
  },
  teamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flagIcon: {
    width: 20,
    height: 14,
    borderRadius: 2,
  },
  worldCupBarTeamLeft: { 
    color: '#1e293b', 
    fontSize: 13, 
    fontWeight: '800',
    ...Platform.select({ web: { userSelect: 'none' } }),
  },
  worldCupBarTeamRight: { 
    color: '#1e293b', 
    fontSize: 13, 
    fontWeight: '800',
    ...Platform.select({ web: { userSelect: 'none' } }),
  },
  worldCupBarTeamCode: { 
    color: '#94a3b8', 
    fontSize: 10, 
    fontWeight: '600',
  },
  worldCupBarVsBadge: { 
    paddingHorizontal: 6, 
    paddingVertical: 1, 
    borderRadius: 4,
  },
  worldCupBarVsText: { 
    color: '#ffb300', 
    fontSize: 11, 
    fontWeight: '900',
  },
  worldCupBarTimeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    marginTop: 6,
  },
  worldCupBarTimeText: { 
    color: '#ef4444', 
    fontSize: 10, 
    fontWeight: '700',
    ...Platform.select({ web: { userSelect: 'none' } }),
  },
  worldCupBarNoMatches: { 
    color: '#94a3b8', 
    fontSize: 11, 
    fontStyle: 'italic', 
    marginHorizontal: 20,
    ...Platform.select({ web: { userSelect: 'none' } }),
  },
  // MOBILE OVERRIDES para el widget del mundial
  worldCupCardMobile: {
    borderRadius: 16,
    padding: 12,
  },
  worldCupBarTitleMobile: {
    fontSize: 11,
  },
  worldCupBarScrollMobile: {
    maxHeight: 110,
  },
  worldCupBarMatchMobile: {
    minWidth: 180,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  worldCupBarTeamMobile: {
    fontSize: 11,
  },
});
