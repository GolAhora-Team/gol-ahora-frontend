import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Footer = () => {
  return (
    <View style={styles.externalFooter}>
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
  );
};

const styles = StyleSheet.create({
  externalFooter: { marginTop: 20, alignItems: 'center', width: '100%', paddingBottom: 20 },
  socialIconsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  socialIcon: { marginHorizontal: 15, textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  copyrightText: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
});

export default Footer;