import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  TouchableOpacity,
  KeyboardAvoidingView,
  StatusBar,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Background from '../components/Background';
import BackgroundLogin from '../components/BackgroundLogin';
import CustomInput from '../components/CustomInput';
import Footer from '../components/Footer';
import SuccessModal from '../components/SuccessModal';
import DatePickerModal from '../components/DatePickerModal';
import { userService } from '../services/userService';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' && windowWidth > 768;

export default function RegisterScreen({ navigation }) {
  const [genero, setGenero] = useState(null);
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [contactoEmergencia, setContactoEmergencia] = useState('');
  const [errors, setErrors] = useState({});
  const [availabilityErrors, setAvailabilityErrors] = useState({});
  const [availableFields, setAvailableFields] = useState({});
  const [successVisible, setSuccessVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const innerScrollViewRef = useRef(null);
  const fieldPositions = useRef({});

  const handleLayout = (field) => (event) => {
    fieldPositions.current[field] = event.nativeEvent.layout.y;
  };

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (!dni && !email && !username) {
        setAvailabilityErrors({});
        setAvailableFields({});
        return;
      }
      try {
        const response = await userService.checkAvailability(
          dni ? parseInt(dni) : 0, 
          email || '', 
          username || ''
        );
        // apiConfig returns the parsed array directly if it's JSON
        const takenFields = Array.isArray(response) ? response : (response.data || []);
        
        const newAvErrors = { ...availabilityErrors };
        const newAvSuccess = { ...availableFields };

        if (dni && dni.length > 5) {
          if (takenFields.includes('DNI')) {
            newAvErrors.dni = 'Este DNI ya está registrado';
            newAvSuccess.dni = false;
          } else {
            delete newAvErrors.dni;
            newAvSuccess.dni = true;
          }
        }
        
        if (email && email.includes('@')) {
          if (takenFields.includes('Email')) {
            newAvErrors.email = 'Este Email ya está en uso';
            newAvSuccess.email = false;
          } else {
            delete newAvErrors.email;
            newAvSuccess.email = true;
          }
        }

        if (username && username.length >= 3) {
          if (takenFields.includes('Username')) {
            newAvErrors.username = 'Este Nombre de usuario ya está en uso';
            newAvSuccess.username = false;
          } else {
            delete newAvErrors.username;
            newAvSuccess.username = true;
          }
        }

        setAvailabilityErrors(newAvErrors);
        setAvailableFields(newAvSuccess);
      } catch (error) {
        console.error('Error verificando disponibilidad', error);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [dni, email, username]);

  const [tieneObraSocial, setTieneObraSocial] = useState(false);
  const [obraSocial, setObraSocial] = useState('');
  const [showObraSocialSuggestions, setShowObraSocialSuggestions] = useState(false);

  const topObrasSociales = [
    "OSDE", "Swiss Medical", "Galeno", "Sancor Salud", "Medifé", 
    "OSECAC", "IOMA", "PAMI", "Accord Salud", "Omint", 
    "Unión Personal", "ObSBA", "OSPRERA", "OSPE", "Prevención Salud", 
    "Jerárquicos Salud", "Luis Pasteur", "OSDEPYM", "OSUTHGRA", "Hospital Italiano"
  ];

  const filteredObrasSociales = obraSocial 
    ? topObrasSociales.filter(os => os.toLowerCase().includes(obraSocial.toLowerCase()))
    : topObrasSociales;

  const handleRegister = async () => {
    let newErrors = {};

    if (!dni) {
      newErrors.dni = 'El DNI es obligatorio';
    } else if (!/^\d{6,9}$/.test(dni.trim())) {
      newErrors.dni = 'Debe tener entre 6 y 9 dígitos y solo números';
    }
    if (!password) newErrors.password = 'La contraseña es obligatoria';
    else if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
      newErrors.password = 'Al menos 1 mayúscula, 1 número, 1 símbolo y mínimo 8 caracteres';
    }
    if (!confirmPassword) newErrors.confirmPassword = 'Confirma tu contraseña';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    if (!nombre) newErrors.nombre = 'Obligatorio';
    if (!apellido) newErrors.apellido = 'Obligatorio';
    if (!genero) newErrors.genero = 'Debe seleccionar un género';
    if (!fechaNacimiento) newErrors.fechaNacimiento = 'Debe seleccionar fecha';
    if (!telefono) newErrors.telefono = 'Obligatorio';
    if (!direccion) newErrors.direccion = 'Obligatorio';
    if (!email) newErrors.email = 'Obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Debe ser un email válido';
    if (!contactoEmergencia) newErrors.contactoEmergencia = 'Obligatorio';
    if (!termsAccepted) newErrors.terms = 'Debes aceptar los Términos y Condiciones';

    // Mezclar errores de disponibilidad (DNI, Email, Username duplicados)
    if (Object.keys(availabilityErrors).length > 0) {
      newErrors = { ...newErrors, ...availabilityErrors };
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      let minY = Infinity;
      Object.keys(newErrors).forEach(field => {
        const yPos = fieldPositions.current[field];
        if (yPos !== undefined && yPos < minY) {
          minY = yPos;
        }
      });

      if (minY !== Infinity && innerScrollViewRef.current) {
        innerScrollViewRef.current.scrollTo({ y: Math.max(0, minY - 20), animated: true });
      }

      return;
    }
    setErrors({});
    setGlobalError('');

    setIsLoading(true);
    try {
      const payload = {
        Email: email, // Ahora el email va correctamente
        Username: username, // El nuevo username
        Password: password,
        Cliente: {
          Dni: parseInt(dni) || 0,
          Nombre: nombre,
          Apellido: apellido,
          Genero: genero,
          FechaNacimiento: fechaNacimiento ? `${fechaNacimiento}T00:00:00.000Z` : "2000-01-01T00:00:00.000Z",
          Telefono: telefono || "",
          Direccion: direccion || "",
          Localidad: "",
          CodigoPostal: "",
          Provincia: "",
          Pais: "",
          ContactoEmergencia: contactoEmergencia || "",
          Email: email || "",
          ObraSocial: tieneObraSocial ? obraSocial : "",
          AptoFisico: true
        }
      };

      await userService.createUsuarioCliente(payload);
      setSuccessVisible(true);
    } catch (error) {
      let friendlyError = error.message || "Ocurrió un error al registrar el usuario.";
      const lowerErr = friendlyError.toLowerCase();
      if (lowerErr.includes('system.int32') && lowerErr.includes('dni')) {
        friendlyError = 'El DNI ingresado no es válido. Asegúrese de ingresar entre 6 y 9 dígitos y solo números.';
      }
      setGlobalError(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessVisible(false);
    navigation.navigate('Login');
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#06230e" />
      <Background />

      <SafeAreaView style={{ flex: 1, backgroundColor: '#006400' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            overScrollMode="never"
          >

            <View style={[styles.pitchContainer, !isWeb && styles.pitchMobile]}>
              <BackgroundLogin />

              <View style={styles.contentOverlay}>

                <View style={styles.headerClean}>
                  <Text style={styles.preTitle}>Complejo</Text>
                  <Text style={styles.mainTitle}>GOL AHORA</Text>
                  <View style={styles.badgeLine}>
                    <Text style={styles.subtitleText}>REGISTRATE</Text>
                  </View>
                </View>

                <View style={styles.solidGlassCard}>
                  <ScrollView
                    ref={innerScrollViewRef}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    <View style={styles.warningContainer}>
                      <MaterialCommunityIcons name="information" size={16} color="#009b3a" />
                      <Text style={styles.warningText}>Importante: Tu DNI será tu usuario para iniciar sesión.</Text>
                    </View>

                    <CustomInput
                      onLayout={handleLayout('dni')}
                      label="DNI"
                      iconName="card-account-details"
                      keyboardType="numeric"
                      value={dni}
                      onChangeText={(text) => {
                        setDni(text.replace(/[^0-9]/g, ''));
                        setAvailableFields(prev => ({ ...prev, dni: false }));
                        if (availabilityErrors.dni) {
                          setAvailabilityErrors(prev => { const n = {...prev}; delete n.dni; return n; });
                        }
                      }}
                      error={errors.dni || availabilityErrors.dni}
                      success={availableFields.dni}
                    />

                    <CustomInput
                      onLayout={handleLayout('username')}
                      label="Nombre de usuario"
                      iconName="at"
                      value={username}
                      onChangeText={(text) => {
                        setUsername(text);
                        setAvailableFields(prev => ({ ...prev, username: false }));
                        if (availabilityErrors.username) {
                          setAvailabilityErrors(prev => { const n = {...prev}; delete n.username; return n; });
                        }
                      }}
                      error={errors.username || availabilityErrors.username}
                      success={availableFields.username}
                      autoCapitalize="none"
                    />

                    <CustomInput
                      onLayout={handleLayout('nombre')}
                      label="Nombre"
                      iconName="account"
                      value={nombre}
                      onChangeText={setNombre}
                      error={errors.nombre}
                    />

                    <CustomInput
                      onLayout={handleLayout('apellido')}
                      label="Apellido"
                      iconName="account-outline"
                      value={apellido}
                      onChangeText={setApellido}
                      error={errors.apellido}
                    />

                    <Text style={styles.labelInterno}>Género</Text>
                    <View onLayout={handleLayout('genero')} style={[styles.genderContainer, errors.genero && { marginBottom: 5, borderColor: '#dc2626', borderWidth: 1, borderRadius: 12, padding: 2 }]}>
                      <TouchableOpacity 
                        style={[styles.genderBtn, genero === 'MASCULINO' && styles.genderBtnActive]}
                        onPress={() => { setGenero('MASCULINO'); setErrors({...errors, genero: null}); }}
                      >
                        <MaterialCommunityIcons
                          name="gender-male"
                          size={20}
                          color={genero === 'MASCULINO' ? '#000' : '#666'}
                        />
                        <Text style={[styles.genderBtnText, genero === 'MASCULINO' && styles.textActive]}>MASCULINO</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.genderBtn, genero === 'FEMENINO' && styles.genderBtnActive]}
                        onPress={() => { setGenero('FEMENINO'); setErrors({...errors, genero: null}); }}
                      >
                        <MaterialCommunityIcons
                          name="gender-female"
                          size={20}
                          color={genero === 'FEMENINO' ? '#000' : '#666'}
                        />
                        <Text style={[styles.genderBtnText, genero === 'FEMENINO' && styles.textActive]}>FEMENINO</Text>
                      </TouchableOpacity>
                    </View>
                    {errors.genero ? <Text style={styles.inlineError}>{errors.genero}</Text> : null}

                    <View onLayout={handleLayout('fechaNacimiento')} style={{marginBottom: 15, width: '100%'}}>
                      <Text style={styles.labelInterno}>Fecha de Nacimiento</Text>
                      <TouchableOpacity 
                        style={[{flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 10, backgroundColor: '#fff', height: 45}, errors.fechaNacimiento && {borderColor: '#dc2626'}]}
                        onPress={() => setCalendarVisible(true)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="calendar" size={20} color="#666" style={{marginRight: 10}} />
                        <Text style={{ color: fechaNacimiento ? '#333' : '#999', fontSize: 14, flex: 1 }}>
                          {fechaNacimiento ? fechaNacimiento : "Seleccionar fecha"}
                        </Text>
                      </TouchableOpacity>
                      {errors.fechaNacimiento ? <Text style={[styles.inlineError, {marginTop: 4}]}>{errors.fechaNacimiento}</Text> : null}
                    </View>
                    <CustomInput 
                      onLayout={handleLayout('telefono')}
                      label="Teléfono" 
                      iconName="phone" 
                      keyboardType="phone-pad" 
                      value={telefono} 
                      onChangeText={(text) => setTelefono(text.replace(/[^0-9]/g, ''))}
                      error={errors.telefono}
                    />
                    <CustomInput
                      onLayout={handleLayout('direccion')}
                      label="Dirección"
                      iconName="map-marker"
                      value={direccion}
                      onChangeText={setDireccion}
                      error={errors.direccion}
                    />
                    <CustomInput
                      onLayout={handleLayout('email')}
                      label="Email"
                      iconName="email"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setAvailableFields(prev => ({ ...prev, email: false }));
                        if (availabilityErrors.email) {
                          setAvailabilityErrors(prev => { const n = {...prev}; delete n.email; return n; });
                        }
                      }}
                      error={errors.email || availabilityErrors.email}
                      success={availableFields.email}
                      autoCapitalize="none"
                    />
                    
                    <View style={{ marginBottom: 15, width: '100%' }}>
                      <TouchableOpacity 
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }} 
                        onPress={() => {
                          setTieneObraSocial(!tieneObraSocial);
                          if (tieneObraSocial) setObraSocial('');
                        }}
                      >
                        <MaterialCommunityIcons 
                          name={tieneObraSocial ? "checkbox-marked" : "checkbox-blank-outline"} 
                          size={22} 
                          color="#009b3a" 
                        />
                        <Text style={{ marginLeft: 8, color: '#333', fontSize: 13, fontWeight: '700' }}>
                          ¿Tiene Obra Social / Prepaga?
                        </Text>
                      </TouchableOpacity>

                      {tieneObraSocial && (
                        <View style={{ zIndex: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 10, backgroundColor: '#fff', height: 45 }}>
                            <MaterialCommunityIcons name="hospital-box" size={20} color="#666" style={{marginRight: 10}} />
                            <TextInput
                              style={{ flex: 1, fontSize: 14, color: '#333', ...Platform.select({ web: { outlineStyle: 'none' } }) }}
                              value={obraSocial}
                              onChangeText={v => {
                                setObraSocial(v);
                                setShowObraSocialSuggestions(true);
                              }}
                              onFocus={() => setShowObraSocialSuggestions(true)}
                              placeholder="Ej: OSDE, Swiss Medical..."
                              placeholderTextColor="#999"
                            />
                          </View>
                          
                          {showObraSocialSuggestions && filteredObrasSociales.length > 0 && (
                            <View style={styles.suggestionsContainer}>
                              <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                                {filteredObrasSociales.map((os, index) => (
                                  <TouchableOpacity 
                                    key={index} 
                                    style={styles.suggestionItem}
                                    onPress={() => {
                                      setObraSocial(os);
                                      setShowObraSocialSuggestions(false);
                                    }}
                                  >
                                    <Text style={styles.suggestionText}>{os}</Text>
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    <CustomInput
                      onLayout={handleLayout('contactoEmergencia')}
                      label="Contacto de Emergencia"
                      iconName="phone-alert"
                      value={contactoEmergencia}
                      onChangeText={setContactoEmergencia}
                      error={errors.contactoEmergencia}
                    />

                    <View style={{ width: '100%' }}>
                      <CustomInput
                        onLayout={handleLayout('password')}
                        label="Contraseña"
                        iconName="lock"
                        isPassword={true}
                        value={password}
                        onChangeText={setPassword}
                        error={errors.password}
                      />
                      <Text style={{ color: '#64748b', fontSize: 11, marginTop: -10, marginBottom: 15, marginLeft: 4 }}>
                        Requisitos: Al menos 1 mayúscula, 1 número, 1 símbolo y mín. 8 caracteres.
                      </Text>
                    </View>

                    <CustomInput
                      onLayout={handleLayout('confirmPassword')}
                      label="Confirmar Contraseña"
                      iconName="lock-check"
                      isPassword={true}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      error={errors.confirmPassword}
                    />

                    {globalError ? (
                      <View style={styles.globalErrorContainer}>
                        <MaterialCommunityIcons name="alert-circle" size={16} color="#dc2626" />
                        <Text style={styles.globalErrorText}>{globalError}</Text>
                      </View>
                    ) : null}
                  </ScrollView>

                  <View style={{ marginTop: 10, marginBottom: 5 }}>
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', alignItems: 'center' }} 
                      onPress={() => setTermsAccepted(!termsAccepted)}
                    >
                      <MaterialCommunityIcons 
                        name={termsAccepted ? "checkbox-marked" : "checkbox-blank-outline"} 
                        size={22} 
                        color={termsAccepted ? "#009b3a" : "#666"} 
                      />
                      <Text style={{ marginLeft: 8, color: '#1e293b', fontSize: 13, fontWeight: '600' }}>
                        Acepto los <Text style={{ color: '#009b3a', textDecorationLine: 'underline' }} onPress={() => setShowTermsModal(true)}>Términos y Condiciones</Text>
                      </Text>
                    </TouchableOpacity>
                    {errors.terms ? <Text style={[styles.inlineError, { marginTop: 5 }]}>{errors.terms}</Text> : null}
                  </View>

                  <TouchableOpacity
                    style={[styles.mainButton, isLoading && { opacity: 0.7 }]}
                    activeOpacity={0.8}
                    onPress={handleRegister}
                    disabled={isLoading}
                  >
                    <LinearGradient colors={['#ffb300', '#ff9100']} style={styles.gradientButton}>
                      <Text style={styles.buttonText}>{isLoading ? 'REGISTRANDO...' : 'REGISTRARME'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('Login')}
                    style={styles.backLink}
                  >
                    <Text style={styles.backLinkText}>¿Ya tienes cuenta? Volver al campo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <Footer />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <SuccessModal
        visible={successVisible}
        onClose={handleSuccessClose}
        title="¡Registro exitoso!"
        message="Recibirás un mail para activar tu cuenta."
      />

      <DatePickerModal 
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        onSelect={(date) => setFechaNacimiento(date)}
        initialDate={fechaNacimiento}
      />

      <Modal visible={showTermsModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Términos y Condiciones</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
              <Text style={styles.modalText}>
                Términos y Condiciones de Uso – Gol Ahora{"\n"}
                Última actualización: 1 de Junio de 2026{"\n\n"}
                
                El presente documento establece los Términos y Condiciones generales (en adelante, los "Términos") aplicables al uso de las instalaciones del complejo deportivo y del sistema de gestión a través de nuestro sitio web.{"\n\n"}
                
                Al registrarse, reservar una cancha, inscribirse a un torneo o contratar cualquier servicio en Gol Ahora, el usuario acepta de manera expresa y voluntaria los presentes Términos.{"\n\n"}
                
                1. Servicios Ofrecidos{"\n"}
                Gol Ahora facilita la gestión y reserva de espacios deportivos, ofreciendo los siguientes servicios:{"\n"}
                - Alquiler de canchas por turnos.{"\n"}
                - Gestión de clases y entrenamientos con profesores.{"\n"}
                - Organización e inscripción a torneos y ligas.{"\n"}
                - Aplicación de beneficios y descuentos para clientes frecuentes o estudiantes.{"\n\n"}
                
                2. Tipos de Usuarios{"\n"}
                Clientes/Jugadores: Toda persona que realice una reserva de cancha o asista a jugar. El titular de la reserva es el responsable solidario por el comportamiento de todos los jugadores de su turno.{"\n"}
                Estudiantes: Usuarios inscriptos en clases, escuelitas o entrenamientos dictados en el complejo.{"\n"}
                Profesores: Personal que dicta clases en las instalaciones. Deberán regirse por las normativas internas del complejo respecto al uso del material y horarios asignados.{"\n\n"}
                
                3. Política de Reservas y Pagos{"\n"}
                Confirmación: Las reservas de canchas y clases solo se considerarán confirmadas una vez abonada la seña o la totalidad del turno, según lo requiera el sistema al momento de la gestión.{"\n"}
                Descuentos y Promociones: Cualquier beneficio, cupón o descuento (por ser estudiante, cliente frecuente, etc.) debe ser aplicado en el sistema antes de finalizar el pago. Los descuentos no son acumulables ni canjeables por dinero en efectivo.{"\n"}
                Atrasos: El tiempo de reserva es estricto. Si el cliente o su equipo llegan tarde, el turno finalizará en el horario originalmente estipulado, sin derecho a compensación de tiempo o dinero.{"\n\n"}
                
                4. Política de Cancelaciones y Devoluciones{"\n"}
                Cancelación por parte del Usuario: Para acceder a la devolución de la seña o reagendar el turno sin costo, el usuario deberá cancelar la reserva a través del sistema con una anticipación mínima de 24 horas. Las cancelaciones fuera de este plazo no tendrán derecho a reembolso.{"\n"}
                Clases y Estudiantes: Las inasistencias a clases particulares o grupales no son reembolsables, salvo que se notifique al profesor con la anticipación que este disponga en su propia planificación.{"\n"}
                Torneos: La seña de inscripción a torneos no es reembolsable si el equipo decide darse de baja una vez que el fixture ya ha sido sorteado y publicado.{"\n"}
                Causas de Fuerza Mayor o Clima: En caso de lluvia fuerte, tormenta eléctrica o factores que impidan el uso de las instalaciones por razones de seguridad, Gol Ahora reprogramará el turno o reembolsará el dinero abonado.{"\n\n"}
                
                5. Torneos y Competencias{"\n"}
                Todos los equipos inscriptos en los torneos organizados por Gol Ahora declaran conocer y aceptar el reglamento específico de la competencia.{"\n"}
                El complejo se reserva el derecho de admisión y permanencia. Las actitudes antideportivas, agresiones físicas o verbales hacia árbitros, rivales o personal del complejo serán sancionadas con la expulsión inmediata del torneo sin derecho a reembolso.{"\n\n"}
                
                6. Normas de Convivencia y Cuidado de las Instalaciones{"\n"}
                Es obligatorio el uso de indumentaria deportiva y calzado adecuado para el tipo de superficie de la cancha.{"\n"}
                Está prohibido el ingreso a las canchas con bebidas alcohólicas, envases de vidrio o alimentos.{"\n"}
                Cualquier daño intencional causado a las instalaciones (redes, césped, alambrados, vestuarios) deberá ser abonado económicamente por el titular de la reserva o el infractor.{"\n\n"}
                
                7. Responsabilidad y Salud{"\n"}
                Apto Físico: El cliente, estudiante o jugador declara bajo su exclusiva responsabilidad encontrarse en óptimas condiciones de salud y aptitud física para la práctica deportiva.{"\n"}
                Lesiones: Gol Ahora no se hace responsable por lesiones, accidentes o problemas de salud que puedan sufrir los usuarios durante su permanencia en el complejo, derivado de la práctica deportiva.{"\n"}
                Pertenencias: El complejo no se responsabiliza por la pérdida, robo o hurto de objetos personales, teléfonos, dinero o bicicletas/vehículos dentro de las instalaciones o en el área de estacionamiento.{"\n\n"}
                
                8. Modificaciones y Jurisdicción{"\n"}
                Gol Ahora se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios entrarán en vigencia desde su publicación en el sitio web.{"\n"}
                Para cualquier controversia legal que pudiera derivarse del presente acuerdo, las partes se someten a la jurisdicción de los Tribunales Ordinarios competentes de la Provincia de Buenos Aires, República Argentina.
              </Text>
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => { setShowTermsModal(false); setTermsAccepted(true); }}
            >
              <Text style={styles.modalButtonText}>ACEPTAR TÉRMINOS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: isWeb ? 20 : 10 },
  headerClean: { alignItems: 'center', marginBottom: isWeb ? 25 : 15, marginTop: isWeb ? 0 : 15 },
  preTitle: { color: '#fff', fontSize: isWeb ? 16 : 14, fontWeight: '300', letterSpacing: 3, ...Platform.select({ web: { userSelect: 'none' } }) },
  mainTitle: { fontSize: isWeb ? 50 : 38, fontWeight: '900', color: '#fff', letterSpacing: -1, textAlign: 'center', ...Platform.select({ web: { userSelect: 'none' } }) },
  badgeLine: { backgroundColor: '#ffb300', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 4, marginTop: 5 },
  subtitleText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1, ...Platform.select({ web: { userSelect: 'none' } }) },

  pitchContainer: {
    width: isWeb ? 480 : '92%',
    height: isWeb ? 850 : windowHeight * 0.85,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'relative'
  },
  pitchMobile: {
    width: '95%',
    height: undefined,
    minHeight: windowHeight * 0.85,
    flex: 1,
  },
  contentOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: isWeb ? 30 : 20 },
  solidGlassCard: { width: isWeb ? '88%' : '95%', flexShrink: 1, padding: isWeb ? 25 : 20, borderRadius: 25, backgroundColor: 'rgba(255, 255, 255, 0.93)', elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 10 },
  labelInterno: { color: '#333', fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  genderContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  genderBtn: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#eee'
  },
  genderBtnActive: { backgroundColor: '#ffb300', borderColor: '#ff9100' },
  genderBtnText: { marginLeft: 8, fontSize: 12, fontWeight: '700', color: '#666' },
  textActive: { color: '#000' },

  row: { flexDirection: 'row', width: '100%' },
  mainButton: { marginTop: 15, borderRadius: 12, overflow: 'hidden', elevation: 5 },
  gradientButton: { height: 55, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  backLink: { marginTop: 15, alignItems: 'center' },
  backLinkText: { color: '#009b3a', fontSize: 13, fontWeight: '700' },
  warningContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 10, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#bbf7d0' },
  warningText: { color: '#009b3a', fontSize: 12, fontWeight: '600', marginLeft: 5 },
  globalErrorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 10, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#fca5a5' },
  globalErrorText: { color: '#dc2626', fontSize: 12, fontWeight: '600', marginLeft: 5 },
  inlineError: { color: '#dc2626', fontSize: 12, marginTop: -5, marginBottom: 15, marginLeft: 4, fontWeight: '500' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '90%', maxHeight: '80%', borderRadius: 15, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  modalBody: { padding: 20 },
  modalText: { fontSize: 14, color: '#475569', lineHeight: 22, textAlign: 'justify' },
  modalButton: { backgroundColor: '#009b3a', padding: 15, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  suggestionsContainer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginTop: 5, paddingVertical: 5, elevation: 3, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 3 },
  suggestionItem: { paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  suggestionText: { color: '#333', fontSize: 13, fontWeight: '600' }
});
