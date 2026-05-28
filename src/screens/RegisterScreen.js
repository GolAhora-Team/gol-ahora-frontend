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
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    let newErrors = {};

    if (!dni) newErrors.dni = 'El DNI es obligatorio';
    if (!password) newErrors.password = 'La contraseña es obligatoria';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirma tu contraseña';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    if (!nombre) newErrors.nombre = 'Obligatorio';
    if (!apellido) newErrors.apellido = 'Obligatorio';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    if (!genero) {
      Alert.alert("Atención", "Por favor selecciona un género.");
      return;
    }

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
          FechaNacimiento: fechaNacimiento || "2000-01-01T00:00:00.000Z",
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
      Alert.alert("Error de Registro", error.message || "Ocurrió un error al registrar el usuario.");
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
                    <CustomInput 
                      label="DNI" 
                      iconName="card-account-details" 
                      keyboardType="numeric" 
                      value={dni}
                      onChangeText={setDni}
                      error={errors.dni}
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
                    
                    <View style={styles.row}>
                        <View style={{flex: 1, marginRight: 5}}>
                            <CustomInput 
                              label="Nombre" 
                              iconName="account" 
                              value={nombre} 
                              onChangeText={setNombre} 
                              error={errors.nombre}
                            />
                        </View>
                        <View style={{flex: 1, marginLeft: 5}}>
                            <CustomInput 
                              label="Apellido" 
                              iconName="account" 
                              value={apellido} 
                              onChangeText={setApellido} 
                              error={errors.apellido}
                            />
                        </View>
                    </View>

                    <Text style={styles.labelInterno}>Género</Text>
                    <View style={styles.genderContainer}>
                      <TouchableOpacity 
                        style={[styles.genderBtn, genero === 'MASCULINO' && styles.genderBtnActive]}
                        onPress={() => setGenero('MASCULINO')}
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
                        onPress={() => setGenero('FEMENINO')}
                      >
                        <MaterialCommunityIcons 
                          name="gender-female" 
                          size={20} 
                          color={genero === 'FEMENINO' ? '#000' : '#666'} 
                        />
                        <Text style={[styles.genderBtnText, genero === 'FEMENINO' && styles.textActive]}>FEMENINO</Text>
                      </TouchableOpacity>
                    </View>

                    <CustomInput 
                      label="Fecha de Nacimiento" 
                      iconName="calendar" 
                      placeholder="AAAA-MM-DD" 
                      value={fechaNacimiento} 
                      onChangeText={setFechaNacimiento} 
                    />
                    <CustomInput 
                      label="Teléfono" 
                      iconName="phone" 
                      keyboardType="phone-pad" 
                      value={telefono} 
                      onChangeText={setTelefono} 
                    />
                    <CustomInput 
                      label="Dirección" 
                      iconName="map-marker" 
                      value={direccion} 
                      onChangeText={setDireccion} 
                    />
                    <CustomInput 
                      label="Email" 
                      iconName="email" 
                      keyboardType="email-address" 
                      value={email} 
                      onChangeText={setEmail} 
                    />
                    <CustomInput 
                      label="Contacto Emergencia" 
                      iconName="alert-circle" 
                      value={contactoEmergencia} 
                      onChangeText={setContactoEmergencia} 
                    />

                    <View style={styles.warningContainer}>
                      <MaterialCommunityIcons name="information" size={16} color="#009b3a" />
                      <Text style={styles.warningText}>Importante: Tu DNI será tu usuario para iniciar sesión.</Text>
                    </View>
                  </ScrollView>

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
  warningContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 10, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#bbf7d0' },
  warningText: { color: '#009b3a', fontSize: 12, fontWeight: '600', marginLeft: 5 },
});