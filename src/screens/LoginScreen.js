import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  SafeAreaView, ScrollView, Dimensions, Platform, 
  KeyboardAvoidingView, StatusBar, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import Background from '../components/Background';
import BackgroundLogin from '../components/BackgroundLogin';
import Footer from '../components/Footer';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' && windowWidth > 768;

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#004d1a');
    }
  }, []);

  // LÓGICA DE CONEXIÓN CON EL DASHBOARD
  const handleLogin = () => {
    const passCorrecta = "1234";
    const usuarioLimpio = email.toLowerCase().trim();

    // 1. Validar que no estén vacíos
    if (!email || !password) {
      Alert.alert("Atención", "Por favor, completa todos los campos.");
      return;
    }

    if (password !== passCorrecta) {
      Alert.alert("Error", "Contraseña incorrecta.");
      return;
    }

    // 3. Determinar el ROL según el usuario ingresado
    let role = "";
    if (usuarioLimpio === "admin") {
      role = "ADMIN";
    } else if (usuarioLimpio === "personal") {
      role = "PERSONAL";
    } else if (usuarioLimpio === "cliente") {
      role = "CLIENTE";
    } else if (usuarioLimpio === "profe") { 
      role = "PROFE";
    } else {
      Alert.alert("Error", "Usuario no encontrado. Prueba con: admin, empleado o personal.");
      return;
    }

    // 4. Navegar al Dashboard pasando el parámetro 'role'
    navigation.navigate('Dashboard', { role: role });
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
                    <Text style={styles.label}>Usuario</Text>
                    <View style={[styles.inputWrapper, focusedInput === 'user' && styles.inputFocused]}>
                      <MaterialCommunityIcons 
                        name="account" 
                        size={22} 
                        color={focusedInput === 'user' ? '#009b3a' : '#666'} 
                      />
                      <TextInput 
                        style={styles.input} 
                        placeholder="Ingresa tu usuario" 
                        placeholderTextColor="#999"
                        onFocus={() => setFocusedInput('user')}
                        onBlur={() => setFocusedInput(null)}
                        onChangeText={setEmail}
                        value={email}
                        autoCapitalize="none"
                        underlineColorAndroid="transparent"
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
                        secureTextEntry
                        onFocus={() => setFocusedInput('pass')}
                        onBlur={() => setFocusedInput(null)}
                        onChangeText={setPassword}
                        value={password}
                        underlineColorAndroid="transparent"
                      />
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.mainButton} 
                    activeOpacity={0.8}
                    onPress={handleLogin} // Conectado aquí
                  >
                    <LinearGradient colors={['#ffb300', '#ff9100']} style={styles.gradientButton}>
                      <Text style={styles.buttonText}>INGRESAR AL CAMPO</Text>
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

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  mainButton: { marginTop: 15, borderRadius: 15, overflow: 'hidden', elevation: 5 },
  gradientButton: { height: 60, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  footerLinks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, paddingHorizontal: 5 },
  linkText: { color: '#009b3a', fontSize: 13, fontWeight: '700' },
});

export default LoginScreen;