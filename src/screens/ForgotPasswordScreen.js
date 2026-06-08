import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../components/Background';
import BackgroundLogin from '../components/BackgroundLogin';
import Footer from '../components/Footer';
import SuccessModal from '../components/SuccessModal';
import { userService } from '../services/userService';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' && windowWidth > 768;

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleReset = async () => {
    setErrorMessage('');
    if (!email) {
      setErrorMessage('Por favor ingresa tu correo electrónico.');
      return;
    }

    setIsLoading(true);
    try {
      await userService.forgotPassword(email.trim());
      setShowSuccessModal(true);
    } catch (error) {
      const msg = error.response?.data?.message || 'Hubo un error al intentar enviar el correo. Por favor, intenta de nuevo.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
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
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            overScrollMode="never"
          >
            <View style={[styles.pitchContainer, !isWeb && styles.pitchMobile]}>
              <BackgroundLogin />

              <View style={[StyleSheet.absoluteFillObject, styles.contentOverlay]}>

                <View style={styles.headerClean}>
                  <Text style={styles.preTitle}>Recuperación</Text>
                  <Text style={styles.mainTitle}>GOL AHORA</Text>
                  <View style={styles.badgeLine}>
                    <Text style={styles.subtitleText}>COMPLEJO GOL AHORA</Text>
                  </View>
                </View>

                <View style={styles.solidGlassCard}>
                  <Text style={styles.introText}>
                    Ingresá tu email registrado y te enviaremos un enlace para restablecer tu contraseña.
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <View style={[styles.inputWrapper, focusedInput === 'email' && styles.inputFocused]}>
                      <MaterialCommunityIcons
                        name="email"
                        size={22}
                        color={focusedInput === 'email' ? '#009b3a' : '#666'}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Ingresa tu correo electrónico"
                        placeholderTextColor="#999"
                        onFocus={() => { setFocusedInput('email'); setErrorMessage(''); }}
                        onBlur={() => setFocusedInput(null)}
                        onChangeText={setEmail}
                        value={email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        underlineColorAndroid="transparent"
                        returnKeyType="done"
                        onSubmitEditing={handleReset}
                      />
                    </View>
                  </View>

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
                    onPress={handleReset}
                    disabled={isLoading}
                  >
                    <LinearGradient colors={['#ffb300', '#ff9100']} style={styles.gradientButton}>
                      {isLoading ? (
                        <ActivityIndicator color="#000" size="small" />
                      ) : (
                        <Text style={styles.buttonText}>ENVIAR LINK DE RECUPERACIÓN</Text>
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

      <SuccessModal
        visible={showSuccessModal}
        message="Correo de recuperación enviado exitosamente. Por favor, revisa tu bandeja de entrada."
        onClose={() => {
          setShowSuccessModal(false);
          navigation.navigate('Login');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: isWeb ? 20 : 10 },
  headerClean: { alignItems: 'center', marginBottom: isWeb ? 25 : 15, marginTop: isWeb ? 0 : 15 },
  preTitle: { color: '#fff', fontSize: isWeb ? 16 : 14, fontWeight: '300', letterSpacing: 3, ...Platform.select({ web: { userSelect: 'none' } }) },
  mainTitle: { fontSize: isWeb ? 50 : 38, fontWeight: '900', color: '#fff', letterSpacing: -1, textAlign: 'center', ...Platform.select({ web: { userSelect: 'none' } }) },
  badgeLine: { backgroundColor: '#ffb300', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 4, marginTop: 5 },
  subtitleText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1, ...Platform.select({ web: { userSelect: 'none' } }) },
  pitchContainer: {
    width: isWeb ? 450 : '92%',
    height: isWeb ? 650 : windowHeight * 0.7,
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
    minHeight: windowHeight * 0.65,
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
  dataFiscalImage: { width: 45, height: 60, resizeMode: 'contain', borderRadius: 4, ...Platform.select({ web: { userSelect: 'none' } }) },
});
