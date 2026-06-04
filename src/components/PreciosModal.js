import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { canchaService } from '../services/canchaService';

export default function PreciosModal({ visible, onClose, onPreciosUpdated }) {
  const [precioF5, setPrecioF5] = useState('');
  const [precioF7, setPrecioF7] = useState('');
  const [precioF11, setPrecioF11] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        precioF5: parseFloat(precioF5) || 0,
        precioF7: parseFloat(precioF7) || 0,
        precioF11: parseFloat(precioF11) || 0
      };
      
      if (payload.precioF5 === 0 && payload.precioF7 === 0 && payload.precioF11 === 0) {
        Alert.alert("Aviso", "No has ingresado ningún precio para actualizar.");
        setSaving(false);
        return;
      }

      await canchaService.updatePrecios(payload);
      Alert.alert("Éxito", "Los precios se han actualizado correctamente.");
      setPrecioF5('');
      setPrecioF7('');
      setPrecioF11('');
      if (onPreciosUpdated) onPreciosUpdated();
      onClose();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Ocurrió un error al intentar actualizar los precios.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="cash-multiple" size={24} color="#fff" />
            <Text style={styles.title}>Actualizar Precios</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.infoText}>
              Ingresá el nuevo precio base para cada tipo de cancha. Esto actualizará todas las canchas de ese tipo. Dejá en blanco los que no quieras modificar.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Precio Fútbol 5 (F5)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 35000"
                keyboardType="numeric"
                value={precioF5}
                onChangeText={setPrecioF5}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Precio Fútbol 7 (F7)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 65000"
                keyboardType="numeric"
                value={precioF7}
                onChangeText={setPrecioF7}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Precio Fútbol 11 (F11)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 120000"
                keyboardType="numeric"
                value={precioF11}
                onChangeText={setPrecioF11}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
              onPress={handleSave} 
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>ACTUALIZAR PRECIOS</Text>
                </>
              )}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden'
  },
  header: {
    backgroundColor: '#0f172a',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative'
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10
  },
  closeBtn: {
    position: 'absolute',
    right: 15,
    top: 20
  },
  content: {
    padding: 24
  },
  infoText: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    outlineStyle: 'none'
  },
  saveBtn: {
    backgroundColor: '#009b3a',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800'
  }
});
