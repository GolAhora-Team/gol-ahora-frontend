import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DeleteModal({ visible, onClose, onConfirm, itemName, title = "Eliminar Registro" }) {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={50} color="#ef4444" />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>
            ¿Estás seguro de que deseas eliminar <Text style={styles.bold}>{itemName}</Text>? Esta acción no se puede deshacer.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.deleteButton} onPress={() => {
              onConfirm();
              onClose();
            }}>
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  iconContainer: {
    marginBottom: 15,
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 15,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 10,
    alignItems: 'center',
    elevation: 2,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
