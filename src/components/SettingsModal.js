import React, { useState } from 'react';
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, 
  TextInput, ScrollView, Platform, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SettingsModal({ visible, onClose, userRole }) {
  const [activeTab, setActiveTab] = useState('PERFIL');

  const [perfil, setPerfil] = useState({
    nombre: 'NOMBREUSUARIO',
    apellido: 'APELLIDOUSUARIO',
    mail: 'usuario@mail.com'
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'PERFIL':
        return (
          <View style={styles.form}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={perfil.nombre} onChangeText={(t)=>setPerfil({...perfil, nombre:t})} />
            <Text style={styles.label}>Apellido</Text>
            <TextInput style={styles.input} value={perfil.apellido} onChangeText={(t)=>setPerfil({...perfil, apellido:t})} />
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={perfil.mail} keyboardType="email-address" />
            <Text style={styles.label}>Nueva Contraseña</Text>
            <TextInput style={styles.input} secureTextEntry placeholder="Mínimo 8 caracteres" />
            <TouchableOpacity style={styles.saveBtn} onPress={() => Alert.alert("Éxito", "Perfil actualizado")}>
              <Text style={styles.saveText}>ACTUALIZAR DATOS</Text>
            </TouchableOpacity>
          </View>
        );
      case 'PAGOS':
        return (
          <View style={styles.form}>
            <Text style={styles.infoTxt}>Registrá tu tarjeta para abonar reservas de canchas e inscripciones (RNF-IN-01).</Text>
            <Text style={styles.label}>Número de Tarjeta</Text>
            <TextInput style={styles.input} placeholder="XXXX XXXX XXXX XXXX" keyboardType="numeric" />
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <View style={{width: '45%'}}>
                <Text style={styles.label}>Vencimiento</Text>
                <TextInput style={styles.input} placeholder="MM/YY" />
              </View>
              <View style={{width: '45%'}}>
                <Text style={styles.label}>CVV</Text>
                <TextInput style={styles.input} placeholder="123" secureTextEntry />
              </View>
            </View>
            <TouchableOpacity style={[styles.saveBtn, {backgroundColor: '#06b6d4'}]}>
              <Text style={styles.saveText}>GUARDAR TARJETA</Text>
            </TouchableOpacity>
          </View>
        );
      case 'INFO':
        return (
          <ScrollView style={styles.aboutContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.aboutTitle}>GOL AHORA</Text>
            <Text style={styles.aboutText}>
              Plataforma integral para la gestión de complejo de canchas de futbol, desarrollada para Ingeniería de Software I.
            </Text>
            <Text style={styles.memberLabel}>GRUPO 4 - INTEGRANTES:</Text>
            <Text style={styles.memberName}>• Antunes, Julián</Text>
            <Text style={styles.memberName}>• Araujo, Julio</Text>
            <Text style={styles.memberName}>• Espindola, Nadia</Text>
            <Text style={styles.memberName}>• Fabbio, Benjamin </Text>
            <Text style={styles.memberName}>• Florentin, Javier</Text>
            <Text style={styles.memberName}>• Roldan, Nicolas</Text>
            <Text style={styles.memberName}>• Salas, Alejandro</Text>
            <Text style={styles.memberName}>• Zalazar, Ezequiel</Text>

            <Text style={styles.aboutFooter}>© 2026 - Gol Ahora - UNAJ</Text>
          </ScrollView>
        );
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.tabs}>
            <TouchableOpacity onPress={() => setActiveTab('PERFIL')} style={[styles.tab, activeTab === 'PERFIL' && styles.activeTab]}>
              <MaterialCommunityIcons name="account-cog" size={22} color={activeTab === 'PERFIL' ? '#009b3a' : '#94a3b8'} />
            </TouchableOpacity>

            {userRole === 'CLIENTE' && (
              <TouchableOpacity onPress={() => setActiveTab('PAGOS')} style={[styles.tab, activeTab === 'PAGOS' && styles.activeTab]}>
                <MaterialCommunityIcons name="credit-card-plus" size={22} color={activeTab === 'PAGOS' ? '#009b3a' : '#94a3b8'} />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setActiveTab('INFO')} style={[styles.tab, activeTab === 'INFO' && styles.activeTab]}>
              <MaterialCommunityIcons name="information-outline" size={22} color={activeTab === 'INFO' ? '#009b3a' : '#94a3b8'} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={onClose} style={styles.tab}>
              <MaterialCommunityIcons name="close-circle" size={26} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <Text style={styles.currentSectionTitle}>{activeTab === 'INFO' ? 'ACERCA DE' : activeTab}</Text>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', width: '90%', maxWidth: 450, borderRadius: 30, padding: 25, elevation: 20 },
  tabs: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 },
  tab: { padding: 8, borderRadius: 12 },
  activeTab: { backgroundColor: '#f0fdf4' },
  currentSectionTitle: { fontSize: 11, fontWeight: '900', color: '#009b3a', marginBottom: 15, letterSpacing: 1.2 },
  form: { gap: 2 },
  label: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 14 },
  saveBtn: { backgroundColor: '#009b3a', padding: 16, borderRadius: 14, marginTop: 20, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  infoTxt: { fontSize: 12, color: '#64748b', fontStyle: 'italic', marginBottom: 8 },
  aboutContainer: { maxHeight: 280 },
  aboutTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  aboutText: { fontSize: 13, color: '#64748b', marginVertical: 12, lineHeight: 19 },
  memberLabel: { fontSize: 11, fontWeight: '900', color: '#009b3a', marginTop: 10 },
  memberName: { fontSize: 14, color: '#1e293b', marginTop: 6, fontWeight: '600' },
  aboutFooter: { fontSize: 10, color: '#94a3b8', marginTop: 25, textAlign: 'center' }
});