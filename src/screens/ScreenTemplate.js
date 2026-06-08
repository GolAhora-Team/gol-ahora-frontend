import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  SafeAreaView, 
  ScrollView, 
  Platform, 
  StatusBar 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Background from '../components/Background';
import BackgroundLogin from '../components/BackgroundLogin';
import Footer from '../components/Footer';
import HeaderSecondary from '../components/HeaderSecondary';

export default function ScreenTemplate({ userRole = "ADMIN", navigation, children, isWeb = false, floatingComponent }) {
  
  const handleBack = () => {
    if (navigation && navigation.goBack) navigation.goBack();
  };

  useEffect(() => {
    const verifySession = async () => {
      try {
        let storedSession = null;
        if (Platform.OS === 'web') {
          const item = localStorage.getItem('GOL_AHORA_SESSION');
          if (item) storedSession = JSON.parse(item);
        } else {
          const item = await AsyncStorage.getItem('GOL_AHORA_SESSION');
          if (item) storedSession = JSON.parse(item);
        }
        
        if (!storedSession) {
          if (navigation && navigation.replace) {
            navigation.replace('Login');
          }
        }
      } catch (e) {
        if (navigation && navigation.replace) navigation.replace('Login');
      }
    };
    verifySession();

    if (Platform.OS === 'web') {
      const urlParams = new URLSearchParams(window.location.search);
      let changed = false;
      ['role', 'idPersona', 'idUsuario', 'nombreUsuario'].forEach(key => {
        if (urlParams.has(key)) {
          urlParams.delete(key);
          changed = true;
        }
      });
      if (changed) {
        const newSearch = urlParams.toString();
        const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '');
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [navigation]);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Background />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={true}
          bounces={false}
          overScrollMode="never"
        >
          <View style={styles.centralContainer}>
            
            <View style={styles.headerContainer}>
              <HeaderSecondary 
                userRole={userRole} 
                isWeb={isWeb} 
                onBack={handleBack} 
              />
            </View>

            <View style={styles.pitchContainer}>
              <BackgroundLogin /> 
              <View style={styles.innerContent}>
                {children}
              </View>
            </View>

          </View>
          
          <Footer />
        </ScrollView>
      </SafeAreaView>
      {floatingComponent}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#004d1a' },
  safeArea: { 
    flex: 1, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 0 
  },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'space-between',
    paddingBottom: 30 
  },
  centralContainer: { 
    width: '100%', 
    maxWidth: 1400, 
    alignSelf: 'center', 
  },
  headerContainer: {
    paddingHorizontal: 16, 
    width: '100%',
  },
  pitchContainer: {
    width: '95%', 
    alignSelf: 'center',
    borderRadius: 35, 
    borderWidth: 1.5, 
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden', 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    position: 'relative', 
    marginTop: 15,
    minHeight: 500, 
  },
  innerContent: { 
    padding: 16,
    flex: 1 
  },
});
