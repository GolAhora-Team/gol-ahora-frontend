import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { descuentoService } from '../services/descuentoService';

export default function DescuentosModal({ visible, onClose }) {
  const [loading, setLoading] = useState(false);
  const [descuentos, setDescuentos] = useState([]);
  
  const [socioDesc, setSocioDesc] = useState({ id: null, porcentaje: '10' });
  const [efectivoDesc, setEfectivoDesc] = useState({ id: null, porcentaje: '10' });

  useEffect(() => {
    if (visible) {
      loadDescuentos();
    }
  }, [visible]);

  const loadDescuentos = async () => {
    setLoading(true);
    try {
      const data = await descuentoService.getAll();
      setDescuentos(data);
      
      const socio = data.find(d => d.nombre.toLowerCase() === 'socio');
      if (socio) setSocioDesc({ id: socio.id, porcentaje: socio.porcentaje.toString() });
      else setSocioDesc({ id: null, porcentaje: '10' });

      const efectivo = data.find(d => d.nombre.toLowerCase() === 'efectivo');
      if (efectivo) setEfectivoDesc({ id: efectivo.id, porcentaje: efectivo.porcentaje.toString() });
      else setEfectivoDesc({ id: null, porcentaje: '10' });

    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los descuentos.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // SOCIO
      if (socioDesc.id) {
        await descuentoService.update(socioDesc.id, {
          Nombre: 'Socio',
          Descripcion: 'Descuento para socios activos',
          Porcentaje: parseFloat(socioDesc.porcentaje) || 0,
          FechaInicio: new Date().toISOString(),
          FechaFin: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString()
        });
      } else {
        await descuentoService.create({
          Nombre: 'Socio',
          Descripcion: 'Descuento para socios activos',
          Porcentaje: parseFloat(socioDesc.porcentaje) || 0,
          FechaInicio: new Date().toISOString(),
          FechaFin: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString()
        });
      }

      // EFECTIVO
      if (efectivoDesc.id) {
        await descuentoService.update(efectivoDesc.id, {
          Nombre: 'Efectivo',
          Descripcion: 'Descuento por pago en efectivo',
          Porcentaje: parseFloat(efectivoDesc.porcentaje) || 0,
          FechaInicio: new Date().toISOString(),
          FechaFin: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString()
        });
      } else {
        await descuentoService.create({
          Nombre: 'Efectivo',
          Descripcion: 'Descuento por pago en efectivo',
          Porcentaje: parseFloat(efectivoDesc.porcentaje) || 0,
          FechaInicio: new Date().toISOString(),
          FechaFin: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString()
        });
      }

      Alert.alert("Éxito", "Los descuentos se han guardado correctamente.");
      onClose();
    } catch (error) {
      Alert.alert("Error", "Ocurrió un error al guardar los descuentos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Configurar Descuentos</Text>
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
                  Ingresá el porcentaje de descuento. Se aplicará a todas las reservas de estos usuarios.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descuento para Socio Activo (%)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={socioDesc.porcentaje}
                  onChangeText={(val) => setSocioDesc({ ...socioDesc, porcentaje: val })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descuento por Pago en Efectivo (%)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={efectivoDesc.porcentaje}
                  onChangeText={(val) => setEfectivoDesc({ ...efectivoDesc, porcentaje: val })}
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
