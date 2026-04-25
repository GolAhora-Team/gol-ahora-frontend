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

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' && windowWidth > 768;

export default function RegisterScreen({ navigation }) {
  const [genero, setGenero] = useState(null); 

  const handleRegister = () => {
    if (!genero) {
      Alert.alert("Atención", "Por favor selecciona un género.");
      return;
    }

    const message = "¡Registro exitoso! Recibirás un mail para activar tu cuenta.";
    
    if (Platform.OS === 'web') {
      window.alert(message);
      navigation.navigate('Login');
    } else {
      Alert.alert(
        "Verifica tu cuenta",
        message,
        [{ text: "Entendido", onPress: () => navigation.navigate('Login') }]
      );
    }
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
                    <CustomInput label="DNI" iconName="card-account-details" keyboardType="numeric" />
                    
                    <View style={styles.row}>
                        <View style={{flex: 1, marginRight: 5}}>
                            <CustomInput label="Nombre" iconName="account" />
                        </View>
                        <View style={{flex: 1, marginLeft: 5}}>
                            <CustomInput label="Apellido" iconName="account" />
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

                    <CustomInput label="Fecha de Nacimiento" iconName="calendar" placeholder="DD/MM/AAAA" />
                    <CustomInput label="Teléfono" iconName="phone" keyboardType="phone-pad" />
                    <CustomInput label="Dirección" iconName="map-marker" />
                    <CustomInput label="Email" iconName="email" keyboardType="email-address" />
                    <CustomInput label="Contacto Emergencia" iconName="alert-circle" />
                  </ScrollView>

                  <TouchableOpacity 
                    style={styles.mainButton} 
                    activeOpacity={0.8}
                    onPress={handleRegister}
                  >
                    <LinearGradient colors={['#ffb300', '#ff9100']} style={styles.gradientButton}>
                      <Text style={styles.buttonText}>REGISTRARME</Text>
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
});