import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  Dimensions, 
  Platform, 
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../components/Background';
import BackgroundLogin from '../components/BackgroundLogin';
import CustomInput from '../components/CustomInput';
import Footer from '../components/Footer';
import SuccessModal from '../components/SuccessModal';
import { userService } from '../services/userService';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' && windowWidth > 768;

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Atención", "Por favor ingresa tu correo electrónico.");
      return;
    }

    setIsLoading(true);
    try {
      await userService.forgotPassword(email.trim());
      setShowSuccessModal(true);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Hubo un error al intentar enviar el correo. Por favor, intenta de nuevo.";
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#06230e" />
      <Background />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            overScrollMode="never"
          >
            <View style={styles.centerContainer}>
              
              {/* Burbuja de Cancha */}
              <View style={[styles.pitchContainer, !isWeb && styles.pitchMobile]}>
                <BackgroundLogin />

                <View style={[StyleSheet.absoluteFillObject, styles.contentOverlay]}>
                  
                  <View style={styles.headerClean}>   
                    <Text style={styles.preTitle}>Recuperación</Text>
                    <Text style={styles.mainTitle}>GOL AHORA</Text>
                  </View>

                  <View style={styles.solidGlassCard}>
                    <Text style={styles.infoText}>
                      Ingresá tu email para recibir el link de recuperación de contraseña.
                    </Text>

                    <CustomInput 
                      label="Email" 
                      iconName="email" 
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    <TouchableOpacity 
                      style={[styles.mainButton, isLoading && { opacity: 0.7 }]} 
                      activeOpacity={0.8}
                      onPress={handleReset}
                      disabled={isLoading}
                    >
                      <LinearGradient colors={['#ffb300', '#ff9100']} style={styles.gradientButton}>
                        <Text style={styles.buttonText}>{isLoading ? 'ENVIANDO...' : 'ENVIAR LINK'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => navigation.goBack()}
                      style={styles.backLink}
                    >
                      <Text style={styles.backLinkText}>Volver atrás</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <Footer />
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
  mainContainer: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerClean: { alignItems: 'center', marginBottom: 25 },
  preTitle: { color: '#fff', fontSize: 14, fontWeight: '300', letterSpacing: 3, textTransform: 'uppercase' },
  mainTitle: { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  
  pitchContainer: {
    width: isWeb ? 450 : '90%', 
    height: isWeb ? 600 : 500, // Más corta porque tiene pocos campos
    borderRadius: 35, 
    borderWidth: 1.5, 
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden', 
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'relative'
  },
  contentOverlay: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  solidGlassCard: { 
    width: '100%', 
    padding: 25, 
    borderRadius: 25, 
    backgroundColor: 'rgba(255, 255, 255, 0.96)', 
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10 
  },
  infoText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    fontWeight: '500'
  },
  mainButton: { marginTop: 10, borderRadius: 12, overflow: 'hidden', elevation: 5 },
  gradientButton: { height: 55, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  backLink: { marginTop: 20, alignItems: 'center' },
  backLinkText: { color: '#009b3a', fontSize: 14, fontWeight: '700' },
});