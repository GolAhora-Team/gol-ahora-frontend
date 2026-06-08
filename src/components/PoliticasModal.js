import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { configuracionService } from '../services/configuracionService';

export default function PoliticasModal({ visible, onClose }) {
  const [loading, setLoading] = useState(false);
  const [horas, setHoras] = useState('24');
  const [penalizacion, setPenalizacion] = useState('50');

  useEffect(() => {
    if (visible) {
      loadConfig();
    }
  }, [visible]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await configuracionService.get();
      if (data) {
        setHoras(data.horasAntelacionMinima?.toString() || '24');
        setPenalizacion(data.porcentajePenalizacion?.toString() || '50');
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo cargar la configuración de cancelaciones.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await configuracionService.update({
        HorasAntelacionMinima: parseInt(horas) || 0,
        PorcentajePenalizacion: parseFloat(penalizacion) || 0
      });
      Alert.alert("Éxito", "Las políticas de cancelación se han guardado correctamente.");
      onClose();
    } catch (error) {
      Alert.alert("Error", "Ocurrió un error al guardar las políticas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Políticas de Cancelación</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#009b3a" style={{ marginVertical: 40 }} />
          ) : (
            <ScrollView style={styles.body}>
              <View style={styles.infoBox}>
                <MaterialCommunityIcons name="information-outline" size={20} color="#3b82f6" />
                <Text style={styles.infoText}>
                  Ingresá las reglas generales. El porcentaje de penalización se aplicará automáticamente si el cliente cancela fuera de plazo.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Horas de antelación mínima (sin penalización)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={horas}
                  onChangeText={setHoras}
                  placeholder="Ej: 24"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Penalización fuera de plazo (%)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={penalizacion}
                  onChangeText={setPenalizacion}
                  placeholder="Ej: 50"
                />
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onClose}>
                  <Text style={styles.btnTextCancel}>CANCELAR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={handleSave}>
                  <Text style={styles.btnTextSave}>GUARDAR</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
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
    borderRadius: 8,
    marginBottom: 20,
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
