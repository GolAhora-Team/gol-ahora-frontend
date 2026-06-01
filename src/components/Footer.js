import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Footer = () => {
  const handleSocialPress = (network, url) => {
    const mensaje = `¿Deseas ser redirigido a ${network}?`;
    
    if (Platform.OS === 'web') {
      const confirm = window.confirm(mensaje);
      if (confirm) {
        window.open(url, '_blank');
      }
    } else {
      Alert.alert(
        'Redirección',
        mensaje,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sí, continuar', onPress: () => Linking.openURL(url) },
        ]
      );
    }
  };

  return (
    <View style={styles.externalFooter}>
      <View style={styles.socialIconsContainer}>
        <TouchableOpacity onPress={() => handleSocialPress('Instagram', 'https://www.instagram.com/')}>
          <MaterialCommunityIcons name="instagram" size={28} color="#fff" style={styles.socialIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleSocialPress('Facebook', 'https://www.facebook.com/')}>
          <MaterialCommunityIcons name="facebook" size={28} color="#fff" style={styles.socialIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleSocialPress('WhatsApp', 'https://api.whatsapp.com/')}>
          <MaterialCommunityIcons name="whatsapp" size={28} color="#fff" style={styles.socialIcon} />
        </TouchableOpacity>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.addressText}>
          Av. Calchaquí 6200 | Florencio Varela, Buenos Aires, Argentina
        </Text>
        <Text style={styles.copyrightText}>
          © 2026 Complejo Gol Ahora. Todos los derechos reservados.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  externalFooter: { marginTop: 20, alignItems: 'center', width: '100%', paddingBottom: 20 },
  socialIconsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
  socialIcon: { marginHorizontal: 15, textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  textContainer: { alignItems: 'center', paddingHorizontal: 20 },
  addressText: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 5 },
  copyrightText: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, fontWeight: '500', letterSpacing: 0.5, textAlign: 'center' },
});

export default Footer;