import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, TextInput, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';

// --- IMPORTANTE: VERIFICA ESTAS RUTAS ---
import CanchaCard from '../components/CanchaCard';
import CanchaFormModal from '../components/CanchaFormModal';
import DeleteModal from '../components/DeleteModal'; 

export default function CanchaScreen({ route, navigation }) {
  const { role: currentUserRole } = route.params || { role: "ADMIN" };

  // --- ESTADO INICIAL ---
  const [canchas, setCanchas] = useState([
    { id: '1', nombre: 'Maracaná 1', tipo: 'F5', superficie: 'Sintético', capacidad: '10', enMantenimiento: false },
    { id: '2', nombre: 'Centenario', tipo: 'F11', superficie: 'Césped Natural', capacidad: '22', enMantenimiento: true },
  ]);

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [canchaToDelete, setCanchaToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'F5',
    superficie: 'Sintético',
    capacidad: '',
    enMantenimiento: false
  });

  // --- LÓGICA DE PERMISOS ---
  const canModify = currentUserRole === 'ADMIN';
  const canToggleMaintenance = currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL';
  const canGenerateReport = currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL';

  // --- FUNCIONES ---
  const handleOpenModal = (cancha = null) => {
    if (cancha) {
      setFormData({ ...cancha });
      setIsEditing(true);
    } else {
      setFormData({ nombre: '', tipo: 'F5', superficie: 'Sintético', capacidad: '', enMantenimiento: false });
      setIsEditing(false);
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.nombre || !formData.capacidad) {
      Alert.alert("Atención", "El nombre y la capacidad son obligatorios.");
      return;
    }
    if (isEditing) {
      setCanchas(prev => prev.map(c => c.id === formData.id ? { ...formData } : c));
    } else {
      setCanchas(prev => [...prev, { ...formData, id: Date.now().toString() }]);
    }
    setModalVisible(false);
  };

  const handleToggleMaintenance = (canchaId) => {
    setCanchas(prev => prev.map(c => c.id === canchaId ? { ...c, enMantenimiento: !c.enMantenimiento } : c));
  };

  const handleGenerateReport = () => {
    Alert.alert("Reporte de Canchas", "Generando inventario técnico... Se enviará a gerencia.");
  };

  const confirmDelete = (cancha) => {
    setCanchaToDelete(cancha);
    setDeleteModalVisible(true);
  };

  const executeDelete = () => {
    if (canchaToDelete) {
      setCanchas(prev => prev.filter(x => x.id !== canchaToDelete.id));
    }
  };

  const filteredCanchas = canchas.filter(c => 
    c.nombre.toLowerCase().includes(search.toLowerCase()) || 
    c.tipo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
      
      {/* BUSCADOR PREMIUM */}
      <View style={[styles.searchWrapper, isSearchFocused && styles.searchWrapperFocused]}>
        <View style={styles.searchInner}>
            <MaterialCommunityIcons name="magnify" size={22} color={isSearchFocused ? "#009b3a" : "#94a3b8"} />
            <TextInput 
              placeholder="Buscar por nombre o tipo (F5, F7...)" 
              placeholderTextColor="#94a3b8" 
              value={search} 
              onChangeText={setSearch} 
              onFocus={() => setIsSearchFocused(true)} 
              onBlur={() => setIsSearchFocused(false)} 
              style={styles.searchInputNav} 
            />
        </View>
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.mainTitle}>Gestión de Canchas</Text>
        <View style={styles.headerActions}>
            {canGenerateReport && (
                <TouchableOpacity style={styles.reportButton} onPress={handleGenerateReport}>
                    <MaterialCommunityIcons name="file-document-edit-outline" size={24} color="#000" />
                </TouchableOpacity>
            )}
            {canModify && (
                <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
                    <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                    <Text style={styles.addButtonText}>NUEVA</Text>
                </TouchableOpacity>
            )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {filteredCanchas.map(item => (
          <CanchaCard 
            key={item.id} 
            item={item} 
            onEdit={handleOpenModal} 
            onDelete={(c) => confirmDelete(c)} 
            onToggleMaintenance={() => handleToggleMaintenance(item.id)}
            canModify={canModify} 
            canToggleMaintenance={canToggleMaintenance}
          />
        ))}
      </ScrollView>

      <CanchaFormModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        isEditing={isEditing} 
        formData={formData} 
        setFormData={setFormData} 
        onSave={handleSave} 
      />

      <DeleteModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={executeDelete}
        title="Eliminar Cancha"
        itemName={canchaToDelete ? canchaToDelete.nombre : ''}
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  searchWrapper: { width: '100%', backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, elevation: 4, borderWidth: 1, borderColor: '#f1f5f9' },
  searchWrapperFocused: { borderColor: '#009b3a', borderWidth: 1.5 },
  searchInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 55 },
  searchInputNav: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#1e293b', outlineStyle: 'none' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mainTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  reportButton: { backgroundColor: '#ffb300', padding: 10, borderRadius: 12, marginRight: 10, elevation: 2 },
  addButton: { backgroundColor: '#009b3a', flexDirection: 'row', padding: 10, borderRadius: 12, alignItems: 'center', elevation: 2 },
  addButtonText: { fontWeight: '900', marginLeft: 5, color: '#fff' },
});