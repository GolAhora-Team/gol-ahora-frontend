import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { canchaService } from '../services/canchaService';

const { width } = Dimensions.get('window');

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
        {Platform.OS !== 'web' ? (
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }]} />
        )}
        
        <View style={styles.container}>
          <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="cash-multiple" size={24} color="#ffb300" />
              </View>
              <Text style={styles.title}>Actualizar Precios</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close-circle-outline" size={28} color="#94a3b8" />
            </TouchableOpacity>
          </LinearGradient>
          
          <View style={styles.content}>
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>
                Ingresá el nuevo valor base. Se actualizarán todas las canchas automáticamente.
              </Text>
            </View>

            <View style={styles.inputsContainer}>
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Fútbol 5</Text>
                  <View style={styles.badge}><Text style={styles.badgeText}>F5</Text></View>
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.currencyPrefix}>$</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="35000"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={precioF5}
                    onChangeText={setPrecioF5}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Fútbol 7</Text>
                  <View style={[styles.badge, { backgroundColor: '#8b5cf6' }]}><Text style={styles.badgeText}>F7</Text></View>
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.currencyPrefix}>$</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="65000"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={precioF7}
                    onChangeText={setPrecioF7}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Fútbol 11</Text>
                  <View style={[styles.badge, { backgroundColor: '#ec4899' }]}><Text style={styles.badgeText}>F11</Text></View>
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.currencyPrefix}>$</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="120000"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={precioF11}
                    onChangeText={setPrecioF11}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveBtnWrapper, saving && { opacity: 0.7 }]} 
              onPress={handleSave} 
              disabled={saving}
            >
              <LinearGradient colors={['#00b09b', '#96c93d']} style={styles.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-decagram" size={22} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>CONFIRMAR Y GUARDAR</Text>
                  </>
                )}
              </LinearGradient>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  container: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)'
  },
  header: {
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  iconWrapper: {
    backgroundColor: 'rgba(255,179,0,0.15)',
    padding: 8,
    borderRadius: 12,
    marginRight: 12
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  closeBtn: {
    padding: 4
  },
  content: {
    padding: 24,
    backgroundColor: '#f8fafc'
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
  inputsContainer: {
    marginBottom: 10
  },
  inputGroup: {
    marginBottom: 20
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b'
  },
  badge: {
    backgroundColor: '#009b3a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 10
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    overflow: 'hidden',
    height: 55
  },
  currencyPrefix: {
    paddingHorizontal: 15,
    fontSize: 18,
    fontWeight: '800',
    color: '#94a3b8',
    backgroundColor: '#f1f5f9',
    height: '100%',
    textAlignVertical: 'center',
    ...Platform.select({ web: { lineHeight: '55px' } })
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '700',
    ...Platform.select({ web: { outlineStyle: 'none' } })
  },
  saveBtnWrapper: {
    marginTop: 15,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#00b09b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  saveBtn: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1
  }
});
