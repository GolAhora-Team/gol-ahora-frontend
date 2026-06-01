import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  SafeAreaView, ScrollView, Dimensions, Platform, 
  KeyboardAvoidingView, StatusBar, Modal, Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import Background from '../components/Background';
import BackgroundLogin from '../components/BackgroundLogin';
import Footer from '../components/Footer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' && windowWidth > 768;

const LoginScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSecure, setIsSecure] = useState(true);
  const [focusedInput, setFocusedInput] = useState(null);
  const [errorMessage, setErrorMessage] = useState(''); // Estado para el error
  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (route?.params?.sessionClosedByInactivity) {
      setShowInactivityModal(true);
      const timer = setTimeout(() => {
        setShowInactivityModal(false);
      }, 60000); // 1 minuto
      return () => clearTimeout(timer);
    }
  }, [route?.params?.sessionClosedByInactivity]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#004d1a');
    }

    const loadRememberedUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('GOL_AHORA_REMEMBER_USER');
        if (savedUser) {
          setEmail(savedUser);
          setRememberMe(true);
        }
      } catch (error) {
        console.log('Error loading remembered user', error);
      }
    };
    loadRememberedUser();

    // Auto-login if session exists
    if (Platform.OS === 'web') {
      try {
        const savedSession = localStorage.getItem('GOL_AHORA_SESSION');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          navigation.replace('Dashboard', parsed);
        }
      } catch (e) {}
    }
  }, []);

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage("Por favor, completa todos los campos.");
      return;
    }

    setIsLoading(true);
    try {
      // Llamada real al backend: POST /api/User/login
      const response = await userService.login({
        email: email.trim(),
        password: password,
      });

      // El backend retorna tipoUsuario como número (1: Cliente, 2: Profesor, 3: Administrador)
      let role = 'CLIENTE';
      if (response.tipoUsuario === 3) {
        role = response.identificador === 101 ? 'PERSONAL' : 'ADMIN';
      }
      else if (response.tipoUsuario === 2) role = 'PROFE';
      else if (response.tipoUsuario === 1) role = 'CLIENTE';
      else if (response.rol || response.role) {
        role = response.rol || response.role;
      }

      const nombreUsuario = response.nombre
        ? `${response.nombre} ${response.apellido || ''}`
        : email;

      const sessionData = { 
        role: role.toUpperCase(), 
        nombreUsuario,
        idPersona: response.idPersona,
        idUsuario: response.idUsuario
      };

      if (Platform.OS === 'web') {
        localStorage.setItem('GOL_AHORA_SESSION', JSON.stringify(sessionData));
      }

      if (rememberMe) {
        await AsyncStorage.setItem('GOL_AHORA_REMEMBER_USER', email.trim());
      } else {
        await AsyncStorage.removeItem('GOL_AHORA_REMEMBER_USER');
      }

      navigation.replace('Dashboard', sessionData);
    } catch (error) {
      setErrorMessage(error.message || 'Usuario o contraseña incorrectos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
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
                  <View style={styles.badgeLine}>
                    <Text style={styles.subtitleText}>SISTEMA DE GESTIÓN DEPORTIVA</Text>
                  </View>
                </View>

                <View style={styles.solidGlassCard}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Usuario / DNI</Text>
                    <View style={[styles.inputWrapper, focusedInput === 'user' && styles.inputFocused]}>
                      <MaterialCommunityIcons 
                        name="account" 
                        size={22} 
                        color={focusedInput === 'user' ? '#009b3a' : '#666'} 
                      />
                      <TextInput 
                        style={styles.input} 
                        placeholder="Ingresa tu usuario o DNI" 
                        placeholderTextColor="#999"
                        onFocus={() => { setFocusedInput('user'); setErrorMessage(''); }}
                        onBlur={() => setFocusedInput(null)}
                        onChangeText={(text) => setEmail(text)}
                        keyboardType="default"
                        value={email}
                        autoCapitalize="none"
                        underlineColorAndroid="transparent"
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Contraseña</Text>
                    <View style={[styles.inputWrapper, focusedInput === 'pass' && styles.inputFocused]}>
                      <MaterialCommunityIcons 
                        name="lock" 
                        size={22} 
                        color={focusedInput === 'pass' ? '#009b3a' : '#666'} 
                      />
                      <TextInput 
                        style={styles.input} 
                        placeholder="Ingresa tu contraseña" 
                        placeholderTextColor="#999"
                        secureTextEntry={isSecure}
                        onFocus={() => { setFocusedInput('pass'); setErrorMessage(''); }}
                        onBlur={() => setFocusedInput(null)}
                        onChangeText={setPassword}
                        value={password}
                        underlineColorAndroid="transparent"
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                        blurOnSubmit={true}
                      />
                      <TouchableOpacity onPress={() => setIsSecure(!isSecure)} style={{ padding: 5 }}>
                        <MaterialCommunityIcons name={isSecure ? "eye-off" : "eye"} size={22} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* CHECKBOX RECORDAR USUARIO */}
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 }} 
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <MaterialCommunityIcons 
                      name={rememberMe ? "checkbox-marked" : "checkbox-blank-outline"} 
                      size={24} 
                      color={rememberMe ? "#009b3a" : "#666"} 
                    />
                    <Text style={{ marginLeft: 8, color: '#1e293b', fontSize: 14, fontWeight: '600' }}>
                      Mantener la sesión iniciada
                    </Text>
                  </TouchableOpacity>

                  {/* MENSAJE DE ERROR DINÁMICO */}
                  {errorMessage !== '' && (
                    <View style={styles.errorContainer}>
                      <MaterialCommunityIcons name="alert-circle" size={18} color="#ef4444" />
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                  )}

                  <TouchableOpacity 
                    style={[styles.mainButton, isLoading && { opacity: 0.7 }]} 
                    activeOpacity={0.8}
                    onPress={handleLogin}
                    disabled={isLoading}
                  >
                    <LinearGradient colors={['#ffb300', '#ff9100']} style={styles.gradientButton}>
                      <Text style={styles.buttonText}>{isLoading ? 'INICIANDO SESIÓN...' : 'INGRESAR AL CAMPO'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.footerLinks}>
                    <TouchableOpacity onPress={() => navigation?.navigate('Register')}>
                      <Text style={styles.linkText}>Registrarme</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation?.navigate('ForgotPassword')}>
                      <Text style={styles.linkText}>Olvidé mi contraseña</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
            <Footer />
            <View style={styles.dataFiscalContainer}>
              <View style={styles.dataFiscalTextContainer}>
                <Text style={styles.dataFiscalText}>Complejo Gol Ahora Argentina</Text>
                <Text style={styles.dataFiscalText}>S.A. CUIT: 30-12345678-3</Text>
              </View>
              <Image 
                source={{ uri: 'https://www.afip.gob.ar/images/f960/DATAWEB.jpg' }} 
                style={styles.dataFiscalImage} 
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={showInactivityModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', padding: 25, borderRadius: 20, alignItems: 'center', width: '80%', maxWidth: 400 }}>
            <MaterialCommunityIcons name="timer-sand" size={50} color="#ffb300" />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 15, textAlign: 'center' }}>
              Sesión cerrada
            </Text>
            <Text style={{ fontSize: 14, color: '#64748b', marginTop: 10, textAlign: 'center' }}>
              Tu sesión se ha cerrado por inactividad.
            </Text>
            <TouchableOpacity 
              style={{ marginTop: 20, backgroundColor: '#009b3a', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 }}
              onPress={() => setShowInactivityModal(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  headerClean: { alignItems: 'center', marginBottom: 25 },
  preTitle: { color: '#fff', fontSize: 16, fontWeight: '300', letterSpacing: 3 },
  mainTitle: { fontSize: 50, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  badgeLine: { backgroundColor: '#ffb300', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 4, marginTop: 5 },
  subtitleText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  pitchContainer: {
    width: isWeb ? 450 : '92%', 
    height: isWeb ? 850 : windowHeight * 0.85, 
    borderRadius: 30, 
    borderWidth: 1.5, 
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden', 
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'relative'
  },
  contentOverlay: { justifyContent: 'center', alignItems: 'center' },
  solidGlassCard: { width: '88%', padding: 25, borderRadius: 25, backgroundColor: 'rgba(255, 255, 255, 0.93)', elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 10 },
  label: { color: '#333', fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', height: 58, borderRadius: 12, paddingHorizontal: 15, backgroundColor: '#f5f5f5', borderWidth: 1.5, borderColor: '#eee' },
  inputFocused: { borderColor: '#009b3a', backgroundColor: '#fff' },
  input: { 
    flex: 1, color: '#000', marginLeft: 10, fontSize: 16,
    ...Platform.select({ web: { outlineStyle: 'none' } })
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  mainButton: { marginTop: 10, borderRadius: 15, overflow: 'hidden', elevation: 5 },
  gradientButton: { height: 60, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  footerLinks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, paddingHorizontal: 5 },
  linkText: { color: '#009b3a', fontSize: 13, fontWeight: '700' },
  dataFiscalContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 40, paddingTop: 10 },
  dataFiscalTextContainer: { marginRight: 15, alignItems: 'center' },
  dataFiscalText: { color: '#cbd5e1', fontWeight: 'bold', fontSize: 13, textAlign: 'center' },
  dataFiscalImage: { width: 45, height: 60, resizeMode: 'contain', borderRadius: 4 }
});

export default LoginScreen;