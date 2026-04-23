import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  SafeAreaView, ScrollView, Dimensions, Platform, 
  KeyboardAvoidingView, StatusBar 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';

// Obtenemos dimensiones dinámicas para que el diseño se adapte a cualquier pantalla
const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

// Lógica de detección de plataforma y tamaño para modo responsivo (Web vs Mobile)
const isWeb = Platform.OS === 'web' && windowWidth > 768;

const LoginScreen = ({ navigation }) => {
  // Estados para capturar lo que el usuario escribe
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estado para saber qué input está seleccionado y aplicar estilos de resaltado
  const [focusedInput, setFocusedInput] = useState(null);

  useEffect(() => {
    // Mejora visual exclusiva para Android: pinta la barra de navegación del sistema (la de abajo)
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#004d1a');
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* StatusBar: Controla el color de la barra de batería/hora del celular */}
      <StatusBar barStyle="light-content" backgroundColor="#06230e" />
      
      {/* Fondo de la app con un degradado que va de verde oscuro a brillante */}
      <LinearGradient
        colors={['#06230e', '#004d1a', '#007a2e']} 
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Evita que el teclado tape los campos de texto al escribir en móviles */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled" // Permite cerrar el teclado al tocar fuera
          >
            
            {/* Contenedor principal que dibuja visualmente la cancha de fútbol */}
            <View style={[styles.pitchContainer, !isWeb && styles.pitchMobile]}>
              
              {/* Dibujo técnico de las líneas blancas de la cancha */}
              <View style={styles.midLineHorizontal} />
              <View style={styles.centerCircle} />
              <View style={styles.topArea} />
              <View style={styles.bottomArea} />

              {/* Capa superior que contiene el texto y el formulario sobre la cancha */}
              <View style={[StyleSheet.absoluteFillObject, styles.contentOverlay]}>
                
                {/* Cabecera con el nombre del complejo y el badge amarillo */}
                <View style={styles.headerClean}>   
                  <Text style={styles.preTitle}>Complejo</Text>
                  <Text style={styles.mainTitle}>GOL AHORA</Text>
                  <View style={styles.badgeLine}>
                    <Text style={styles.subtitleText}>SISTEMA DE GESTIÓN DEPORTIVA</Text>
                  </View>
                </View>

                {/* Tarjeta blanca semitransparente (Efecto Glassmorphism sólido) */}
                <View style={styles.solidGlassCard}>
                  
                  {/* Grupo de Input para Usuario */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Usuario</Text>
                    <View style={[
                      styles.inputWrapper, 
                      focusedInput === 'user' && styles.inputFocused // Aplica borde verde si está seleccionado
                    ]}>
                      <MaterialCommunityIcons 
                        name="account" 
                        size={22} 
                        color={focusedInput === 'user' ? '#009b3a' : '#666'} 
                      />
                      <TextInput 
                        style={styles.input} 
                        placeholder="Ingresa tu usuario" 
                        placeholderTextColor="#999"
                        onFocus={() => setFocusedInput('user')} // Activa resaltado
                        onBlur={() => setFocusedInput(null)}   // Quita resaltado
                        onChangeText={setEmail}
                        value={email}
                        autoCapitalize="none"
                        underlineColorAndroid="transparent"
                      />
                    </View>
                  </View>

                  {/* Grupo de Input para Contraseña */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Contraseña</Text>
                    <View style={[
                      styles.inputWrapper, 
                      focusedInput === 'pass' && styles.inputFocused
                    ]}>
                      <MaterialCommunityIcons 
                        name="lock" 
                        size={22} 
                        color={focusedInput === 'pass' ? '#009b3a' : '#666'} 
                      />
                      <TextInput 
                        style={styles.input} 
                        placeholder="Ingresa tu contraseña" 
                        placeholderTextColor="#999"
                        secureTextEntry // Oculta los caracteres
                        onFocus={() => setFocusedInput('pass')}
                        onBlur={() => setFocusedInput(null)}
                        onChangeText={setPassword}
                        value={password}
                        underlineColorAndroid="transparent"
                      />
                    </View>
                  </View>

                  {/* Botón de acceso con degradado amarillo/naranja */}
                  <TouchableOpacity style={styles.mainButton} activeOpacity={0.8}>
                    <LinearGradient
                      colors={['#ffb300', '#ff9100']}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.buttonText}>INGRESAR AL CAMPO</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Enlaces secundarios para navegación */}
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

            {/* Pie de página externo (Fuera de la cancha) */}
            <View style={styles.externalFooter}>
              {/* Contenedor horizontal para logos de redes sociales */}
              <View style={styles.socialIconsContainer}>
                <TouchableOpacity onPress={() => console.log('Instagram')}>
                  <MaterialCommunityIcons name="instagram" size={28} color="#fff" style={styles.socialIcon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => console.log('Facebook')}>
                  <MaterialCommunityIcons name="facebook" size={28} color="#fff" style={styles.socialIcon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => console.log('WhatsApp')}>
                  <MaterialCommunityIcons name="whatsapp" size={28} color="#fff" style={styles.socialIcon} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.copyrightText}>
                © 2026 Complejo Gol Ahora. Todos los derechos reservados.
              </Text>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Estilos del contenedor de scroll para centrar todo el contenido
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 20 
  },
  
  // Estilos de la cabecera (Títulos)
  headerClean: { alignItems: 'center', marginBottom: 25 },
  preTitle: { color: '#fff', fontSize: 16, fontWeight: '300', letterSpacing: 3 },
  mainTitle: { fontSize: 50, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  badgeLine: { backgroundColor: '#ffb300', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 4, marginTop: 5 },
  subtitleText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  // Estilo visual del "Contenedor Cancha"
  pitchContainer: {
    width: isWeb ? 450 : '92%', height: isWeb ? 850 : windowHeight * 0.85, 
    borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)'
  },
  
  // Líneas de dibujo del campo de juego (Posicionamiento absoluto)
  midLineHorizontal: { position: 'absolute', left: 0, right: 0, top: '50%', height: 1.5, backgroundColor: 'rgba(255,255,255,0.3)' },
  centerCircle: { position: 'absolute', top: '50%', left: '50%', width: 140, height: 140, borderRadius: 70, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', transform: [{ translateX: -70 }, { translateY: -70 }] },
  topArea: { position: 'absolute', top: 0, left: '20%', right: '20%', height: '10%', borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  bottomArea: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '10%', borderTopWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },

  contentOverlay: { justifyContent: 'center', alignItems: 'center' },
  
  // Estilo de la tarjeta blanca sólida con sombra profunda (elevation para Android)
  solidGlassCard: {
    width: '88%', padding: 25, borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.93)',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  // Estilos de etiquetas e inputs
  label: { color: '#333', fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', height: 58, borderRadius: 12,
    paddingHorizontal: 15, backgroundColor: '#f5f5f5',
    borderWidth: 1.5, borderColor: '#eee'
  },
  inputFocused: { borderColor: '#009b3a', backgroundColor: '#fff' },
  input: { 
    flex: 1, 
    color: '#000', 
    marginLeft: 10, 
    fontSize: 16,
    // Elimina el recuadro negro feo al hacer clic en la versión Web
    ...Platform.select({
      web: { outlineStyle: 'none' }
    })
  },

  // Estilos del botón y sus links inferiores
  mainButton: { marginTop: 15, borderRadius: 15, overflow: 'hidden', elevation: 5 },
  gradientButton: { height: 60, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  footerLinks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, paddingHorizontal: 5 },
  linkText: { color: '#009b3a', fontSize: 13, fontWeight: '700' },

  // Estilos del Footer (Redes Sociales y Copyright)
  externalFooter: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
    paddingBottom: 20,
  },
  socialIconsContainer: {
    flexDirection: 'row', 
    justifyContent: 'center',
    marginBottom: 10,
  },
  socialIcon: {
    marginHorizontal: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  copyrightText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default LoginScreen;