import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SuccessModal({ visible, onClose, title = "¡Éxito!", message }) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="check-circle" size={60} color="#009b3a" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>ENTENDIDO</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12
  },
  iconContainer: {
    marginBottom: 15,
    backgroundColor: '#e6f5eb',
    borderRadius: 50,
    padding: 10
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 10,
    textAlign: 'center'
  },
  message: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22
  },
  button: {
    backgroundColor: '#009b3a',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1
  }
});
