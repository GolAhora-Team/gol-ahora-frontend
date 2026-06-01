import React, { useState } from 'react';
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
  Alert
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
  const [contactoEmergencia, setContactoEmergencia] = useState('');
  const [errors, setErrors] = useState({});
  const [successVisible, setSuccessVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleRegister = async () => {
    let newErrors = {};

    if (!dni) newErrors.dni = 'El DNI es obligatorio';
    if (!password) newErrors.password = 'La contraseña es obligatoria';
    else if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
      newErrors.password = 'Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 especial';
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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setGlobalError('');

    setIsLoading(true);
    try {
      const payload = {
        Email: dni, // El DNI se usa como Email (usuario) para el login
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
          ObraSocial: "",
          AptoFisico: true
        }
      };

      await userService.createUsuarioCliente(payload);
      setSuccessVisible(true);
    } catch (error) {
      setGlobalError(error.message || "Ocurrió un error al registrar el usuario.");
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

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            overScrollMode="never"
          >

            <View style={[styles.pitchContainer, !isWeb && styles.pitchMobile]}>
              <BackgroundLogin />

              <View style={[StyleSheet.absoluteFillObject, styles.contentOverlay]}>

                <View style={styles.headerClean}>
                  <Text style={styles.preTitle}>Complejo</Text>
                  <Text style={styles.mainTitle}>GOL AHORA</Text>
                  <View style={styles.roleTag}>
                    <Text style={styles.roleTagText}>REGISTRATE</Text>
                  </View>
                </View>

                <View style={styles.solidGlassCard}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ maxHeight: windowHeight * 0.45 }}
                    nestedScrollEnabled={true}
                  >
                    <View style={styles.warningContainer}>
                      <MaterialCommunityIcons name="information" size={16} color="#009b3a" />
                      <Text style={styles.warningText}>Importante: Tu DNI será tu usuario para iniciar sesión.</Text>
                    </View>

                    <CustomInput
                      label="DNI"
                      iconName="card-account-details"
                      keyboardType="numeric"
                      value={dni}
                      onChangeText={(text) => setDni(text.replace(/[^0-9]/g, ''))}
                      error={errors.dni}
                    />



                    <CustomInput
                      label="Nombre"
                      iconName="account"
                      value={nombre}
                      onChangeText={setNombre}
                      error={errors.nombre}
                    />

                    <CustomInput
                      label="Apellido"
                      iconName="account"
                      value={apellido}
                      onChangeText={setApellido}
                      error={errors.apellido}
                    />


                    <Text style={styles.labelInterno}>Género</Text>
                    <View style={[styles.genderContainer, errors.genero && { marginBottom: 5, borderColor: '#dc2626', borderWidth: 1, borderRadius: 12, padding: 2 }]}>
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

                    <View style={{marginBottom: 15, width: '100%'}}>
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
                      label="Teléfono" 
                      iconName="phone" 
                      keyboardType="phone-pad" 
                      value={telefono} 
                      onChangeText={(text) => setTelefono(text.replace(/[^0-9]/g, ''))}
                      error={errors.telefono}
                    />
                    <CustomInput
                      label="Dirección"
                      iconName="map-marker"
                      value={direccion}
                      onChangeText={setDireccion}
                      error={errors.direccion}
                    />
                    <CustomInput
                      label="Email"
                      iconName="email"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={setEmail}
                      error={errors.email}
                      autoCapitalize="none"
                    />
                    <CustomInput
                      label="Contacto Emergencia"
                      iconName="alert-circle"
                      value={contactoEmergencia}
                      onChangeText={setContactoEmergencia}
                      error={errors.contactoEmergencia}
                    />

                    <CustomInput
                      label="Contraseña"
                      iconName="lock"
                      isPassword={true}
                      value={password}
                      onChangeText={setPassword}
                      error={errors.password}
                    />

                    <CustomInput
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
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  headerClean: { alignItems: 'center', marginBottom: 15 },
  preTitle: { color: '#fff', fontSize: 14, fontWeight: '300', letterSpacing: 3, textTransform: 'uppercase' },
  mainTitle: { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  roleTag: { backgroundColor: '#ffb300', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 4, marginTop: 5 },
  roleTagText: { color: '#000', fontSize: 10, fontWeight: '900' },

  pitchContainer: {
    width: isWeb ? 480 : '94%',
    height: isWeb ? 880 : windowHeight * 0.9,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'relative'
  },
  contentOverlay: { justifyContent: 'center', alignItems: 'center', padding: 15 },
  solidGlassCard: {
    width: '90%',
    padding: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
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
  modalButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});