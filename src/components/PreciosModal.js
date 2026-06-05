import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { canchaService } from '../services/canchaService';

export default function PreciosModal({ visible, onClose, onPreciosUpdated, canchas }) {
  const [precioF5, setPrecioF5] = useState('');
  const [precioF7, setPrecioF7] = useState('');
  const [precioF11, setPrecioF11] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && canchas && canchas.length > 0) {
      const f5 = canchas.find(c => c.tipo === 'F5');
      const f7 = canchas.find(c => c.tipo === 'F7');
      const f11 = canchas.find(c => c.tipo === 'F11');

      if (f5) setPrecioF5(f5.original?.precioPorHora?.toString() || '');
      if (f7) setPrecioF7(f7.original?.precioPorHora?.toString() || '');
      if (f11) setPrecioF11(f11.original?.precioPorHora?.toString() || '');
    }
  }, [visible, canchas]);

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
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Actualizar Precios</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>
                Ingresá el nuevo valor base por hora.

              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Precio ($) de Fútbol 5</Text>
              <TextInput
                style={styles.input}
                placeholder="35000"
                keyboardType="numeric"
                value={precioF5}
                onChangeText={setPrecioF5}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Precio ($) de Fútbol 7</Text>
              <TextInput
                style={styles.input}
                placeholder="65000"
                keyboardType="numeric"
                value={precioF7}
                onChangeText={setPrecioF7}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Precio ($) de Fútbol 11</Text>
              <TextInput
                style={styles.input}
                placeholder="120000"
                keyboardType="numeric"
                value={precioF11}
                onChangeText={setPrecioF11}
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onClose} disabled={saving}>
                <Text style={styles.btnTextCancel}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSave, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnTextSave}>GUARDAR</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    alignItems: 'center',
    padding: 20
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  body: {
    padding: 20
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center'
  },
  infoText: {
    color: '#1e40af',
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 10,
    flex: 1,
    fontWeight: '600'
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0f172a'
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10
  },
  btnCancel: {
    backgroundColor: '#f1f5f9'
  },
  btnSave: {
    backgroundColor: '#009b3a'
  },
  btnTextCancel: {
    color: '#64748b',
    fontWeight: 'bold'
  },
  btnTextSave: {
    color: '#fff',
    fontWeight: 'bold'
  }
});
