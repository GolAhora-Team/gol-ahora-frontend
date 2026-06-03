import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../components/Background';
import BackgroundLogin from '../components/BackgroundLogin';
import Footer from '../components/Footer';
import { userService } from '../services/userService';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' && windowWidth > 768;

const NuevaClaveScreen = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSecure, setIsSecure] = useState(true);
  const [isSecureConfirm, setIsSecureConfirm] = useState(true);
  const [focusedInput, setFocusedInput] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  const route = useRoute();
  const navigation = useNavigation();

  useEffect(() => {
    if (route.params?.token) {
      setToken(route.params.token);
    } else if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (urlToken) {
        setToken(urlToken);
      }
    }
  }, [route]);

  const handleReset = async () => {
    setErrorMessage('');

    if (!token) {
      setErrorMessage('Falta el token de recuperación en la URL o parámetros.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      setErrorMessage('Por favor, completa ambos campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>_+\-\[\]\\\/]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setErrorMessage(
        'La contraseña debe tener como mínimo 8 caracteres, al menos una letra mayúscula y al menos un carácter especial.'
      );
      return;
    }

    setLoading(true);
    try {
      await userService.resetPassword(token, newPassword);
      Alert.alert(
        'Éxito',
        'Contraseña restablecida correctamente.',
        [
          {
            text: 'Aceptar',
            onPress: () => navigation.navigate('Login')
          }
        ],
        { cancelable: false }
      );
      // Redirección de respaldo por si el diálogo no bloquea en web/ciertas plataformas
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1500);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Ocurrió un error al restablecer la contraseña.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#06230e" />
      <Background />

      <SafeAreaView style={{ flex: 1, backgroundColor: '#006400' }}>
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
                  <Text style={styles.preTitle}>Restablecer</Text>
                  <Text style={styles.mainTitle}>NUEVA CLAVE</Text>
                  <View style={styles.badgeLine}>
                    <Text style={styles.subtitleText}>COMPLEJO GOL AHORA</Text>
                  </View>
                </View>

                <View style={styles.solidGlassCard}>
                  <Text style={styles.introText}>
                    Ingresá tu nueva contraseña de acceso. Asegurate de cumplir con las políticas de seguridad.
                  </Text>

                  {/* NUEVA CONTRASEÑA */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nueva Contraseña</Text>
                    <View style={[styles.inputWrapper, focusedInput === 'newPass' && styles.inputFocused]}>
                      <MaterialCommunityIcons
                        name="lock"
                        size={22}
                        color={focusedInput === 'newPass' ? '#009b3a' : '#666'}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Mínimo 8 caracteres, 1 Mayús., 1 Especial"
                        placeholderTextColor="#999"
                        secureTextEntry={isSecure}
                        onFocus={() => { setFocusedInput('newPass'); setErrorMessage(''); }}
                        onBlur={() => setFocusedInput(null)}
                        onChangeText={setNewPassword}
                        value={newPassword}
                        underlineColorAndroid="transparent"
                        returnKeyType="next"
                      />
                      <TouchableOpacity onPress={() => setIsSecure(!isSecure)} style={{ padding: 5 }}>
                        <MaterialCommunityIcons name={isSecure ? "eye-off" : "eye"} size={22} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* CONFIRMAR CONTRASEÑA */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirmar Contraseña</Text>
                    <View style={[styles.inputWrapper, focusedInput === 'confirmPass' && styles.inputFocused]}>
                      <MaterialCommunityIcons
                        name="lock-check"
                        size={22}
                        color={focusedInput === 'confirmPass' ? '#009b3a' : '#666'}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Repetí la contraseña ingresada"
                        placeholderTextColor="#999"
                        secureTextEntry={isSecureConfirm}
                        onFocus={() => { setFocusedInput('confirmPass'); setErrorMessage(''); }}
                        onBlur={() => setFocusedInput(null)}
                        onChangeText={setConfirmPassword}
                        value={confirmPassword}
                        underlineColorAndroid="transparent"
                        returnKeyType="done"
                        onSubmitEditing={handleReset}
                      />
                      <TouchableOpacity onPress={() => setIsSecureConfirm(!isSecureConfirm)} style={{ padding: 5 }}>
                        <MaterialCommunityIcons name={isSecureConfirm ? "eye-off" : "eye"} size={22} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* MENSAJE DE ERROR DINÁMICO */}
                  {errorMessage !== '' && (
                    <View style={styles.errorContainer}>
                      <MaterialCommunityIcons name="alert-circle" size={18} color="#ef4444" />
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                  )}

                  {/* BOTÓN GUARDAR */}
                  <TouchableOpacity
                    style={[styles.mainButton, loading && { opacity: 0.7 }]}
                    activeOpacity={0.8}
                    onPress={handleReset}
                    disabled={loading}
                  >
                    <LinearGradient colors={['#ffb300', '#ff9100']} style={styles.gradientButton}>
                      {loading ? (
                        <ActivityIndicator color="#000" size="small" />
                      ) : (
                        <Text style={styles.buttonText}>ESTABLECER NUEVA CLAVE</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.footerLinks}>
                    <TouchableOpacity onPress={() => navigation?.navigate('Login')} style={{ width: '100%', alignItems: 'center' }}>
                      <Text style={styles.linkText}>Volver al Login</Text>
                    </TouchableOpacity>
                  </View>
                </View>

              </View>
            </View>

            <Footer />
            
            <View style={styles.dataFiscalContainer}>
              <View style={styles.dataFiscalTextContainer}>
                <Text style={styles.dataFiscalText}>Complejo Gol Ahora</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: isWeb ? 20 : 10 },
  headerClean: { alignItems: 'center', marginBottom: isWeb ? 25 : 15, marginTop: isWeb ? 0 : 15 },
  preTitle: { color: '#fff', fontSize: isWeb ? 16 : 14, fontWeight: '300', letterSpacing: 3, ...Platform.select({ web: { userSelect: 'none' } }) },
  mainTitle: { fontSize: isWeb ? 40 : 32, fontWeight: '900', color: '#fff', letterSpacing: -1, textAlign: 'center', ...Platform.select({ web: { userSelect: 'none' } }) },
  badgeLine: { backgroundColor: '#ffb300', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 4, marginTop: 5 },
  subtitleText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1, ...Platform.select({ web: { userSelect: 'none' } }) },
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
  pitchMobile: {
    width: '95%',
    height: undefined,
    minHeight: windowHeight * 0.78,
    flex: 1,
  },
  contentOverlay: { justifyContent: 'center', alignItems: 'center', paddingVertical: isWeb ? 0 : 20 },
  solidGlassCard: { width: isWeb ? '88%' : '95%', padding: isWeb ? 25 : 20, borderRadius: 25, backgroundColor: 'rgba(255, 255, 255, 0.93)', elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 10 },
  introText: { color: '#475569', fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20, paddingHorizontal: 5 },
  inputGroup: { width: '100%', marginBottom: 20 },
  label: { color: '#333', fontSize: 13, fontWeight: '700', marginBottom: 8, marginLeft: 4, ...Platform.select({ web: { userSelect: 'none' } }) },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', height: 58, borderRadius: 12, paddingHorizontal: 15, backgroundColor: '#f5f5f5', borderWidth: 1.5, borderColor: '#eee' },
  inputFocused: { borderColor: '#009b3a', backgroundColor: '#fff' },
  input: {
    flex: 1, color: '#000', marginLeft: 10, fontSize: 15,
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
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  mainButton: { marginTop: 10, borderRadius: 15, overflow: 'hidden', elevation: 5 },
  gradientButton: { height: 60, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: '900', fontSize: 15, letterSpacing: 0.5, ...Platform.select({ web: { userSelect: 'none' } }) },
  footerLinks: { flexDirection: 'row', justifyContent: 'center', marginTop: 25, paddingHorizontal: 5 },
  linkText: { color: '#009b3a', fontSize: 14, fontWeight: '700', ...Platform.select({ web: { userSelect: 'none' } }) },
  dataFiscalContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 40, paddingTop: 10 },
  dataFiscalTextContainer: { marginRight: 15, alignItems: 'center' },
  dataFiscalText: { color: '#cbd5e1', fontWeight: 'bold', fontSize: 13, textAlign: 'center', ...Platform.select({ web: { userSelect: 'none' } }) },
  dataFiscalImage: { width: 45, height: 60, resizeMode: 'contain', borderRadius: 4, ...Platform.select({ web: { userSelect: 'none' } }) }
});

export default NuevaClaveScreen;
