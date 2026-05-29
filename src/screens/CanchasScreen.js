import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, TextInput, Platform, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';

import CanchaCard from '../components/CanchaCard';
import CanchaFormModal from '../components/CanchaFormModal';
import DeleteModal from '../components/DeleteModal';
import SuccessModal from '../components/SuccessModal';
import { canchaService } from '../services/canchaService';

export default function CanchaScreen({ route, navigation }) {
  const { role: currentUserRole } = route.params || { role: "ADMIN" };

  // --- ESTADO INICIAL ---
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [canchaToDelete, setCanchaToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [formError, setFormError] = useState('');
  
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

  // --- EFECTOS ---
  useEffect(() => {
    loadCanchas();
  }, []);

  const loadCanchas = async () => {
    setLoading(true);
    try {
      const data = await canchaService.getAll();
      const mapped = data.map(c => ({
        id: c.id.toString(),
        nombre: c.nombre,
        tipo: c.tipo === "Futbol5" ? "F5" : (c.tipo === "Futbol7" ? "F7" : "F11"),
        superficie: c.superficie === "1" ? "Sintético" : c.superficie === "2" ? "Césped Natural" : c.superficie === "3" ? "Parquet" : "Cemento",
        capacidad: c.capacidad.toString(),
        enMantenimiento: c.estado === 'Mantenimiento',
        original: c
      }));
      setCanchas(mapped);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las canchas.");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIONES ---
  const handleOpenModal = (cancha = null) => {
    setFormError('');
    if (cancha) {
      let dim = "20x40m";
      let precio = 30000;
      if (cancha.tipo === 'F7') { dim = "30x50m"; precio = 65000; }
      else if (cancha.tipo === 'F11') { dim = "45x90m"; precio = 120000; }
      
      setFormData({ ...cancha, dimensiones: dim, precioBase: cancha.original?.precioPorHora || precio });
      setIsEditing(true);
    } else {
      setFormData({ nombre: '', tipo: 'F5', superficie: 'Sintético', capacidad: '10', dimensiones: '20x40m', precioBase: 30000, enMantenimiento: false });
      setIsEditing(false);
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!formData.nombre || !formData.capacidad) {
      setFormError("El nombre y la capacidad son obligatorios.");
      return;
    }
    
    const basePayload = {
      Nombre: formData.nombre,
      Tipo: formData.tipo === "F5" ? 5 : (formData.tipo === "F7" ? 7 : 11),
      Superficie: formData.superficie === "Sintético" ? 1 : formData.superficie === "Césped Natural" ? 2 : formData.superficie === "Parquet" ? 3 : 4,
      Capacidad: parseInt(formData.capacidad) || 10,
      Estado: formData.enMantenimiento ? 2 : 1
    };

    try {
      if (isEditing) {
        const payload = {
          ...basePayload,
          Disponibilidad: formData.original?.disponibilidad ?? true,
          HoraInicio: formData.original?.horaInicio ?? "08:00:00",
          HoraFin: formData.original?.horaFin ?? "23:00:00",
          DuracionMax: formData.original?.duracionMax ?? 60,
          PrecioPorHora: formData.precioBase ?? (formData.original?.precioPorHora ?? 30000)
        };
        await canchaService.update(formData.id, payload);
        setSuccessMessage("Los cambios han sido guardados exitosamente.");
      } else {
        const payload = {
          ...basePayload,
          Disponibilidad: true,
          HoraInicio: "08:00:00",
          HoraFin: "23:00:00",
          DuracionMax: 60,
          PrecioPorHora: formData.precioBase ?? 30000
        };
        await canchaService.create(payload);
        setSuccessMessage("La nueva cancha ha sido registrada exitosamente.");
      }
      setModalVisible(false);
      loadCanchas();
      setSuccessModalVisible(true);
    } catch (error) {
      setFormError(error.message || "Error al guardar la cancha");
    }
  };

  const handleToggleMaintenance = async (canchaId) => {
    const cancha = canchas.find(c => c.id === canchaId);
    if (!cancha) return;
    
    const newMantenimiento = !cancha.enMantenimiento;
    const payload = {
      Nombre: cancha.nombre,
      Tipo: cancha.tipo === "F5" ? 5 : (cancha.tipo === "F7" ? 7 : 11),
      Superficie: cancha.superficie === "Sintético" ? 1 : cancha.superficie === "Césped Natural" ? 2 : cancha.superficie === "Parquet" ? 3 : 4,
      Capacidad: parseInt(cancha.capacidad) || 10,
      Estado: newMantenimiento ? 2 : 1,
      Disponibilidad: cancha.original?.disponibilidad ?? true,
      HoraInicio: cancha.original?.horaInicio ?? "08:00:00",
      HoraFin: cancha.original?.horaFin ?? "23:00:00",
      DuracionMax: cancha.original?.duracionMax ?? 60,
      PrecioPorHora: cancha.original?.precioPorHora ?? 5000
    };

    try {
      await canchaService.update(canchaId, payload);
      setCanchas(prev => prev.map(c => c.id === canchaId ? { ...c, enMantenimiento: newMantenimiento, original: { ...c.original, estado: newMantenimiento ? "Mantenimiento" : "Disponible" } } : c));
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el estado.");
    }
  };

  const handleGenerateReport = () => {
    Alert.alert("Reporte de Canchas", "Generando inventario técnico... Se enviará a gerencia.");
  };

  const confirmDelete = (cancha) => {
    setCanchaToDelete(cancha);
    setDeleteModalVisible(true);
  };

  const executeDelete = async () => {
    if (canchaToDelete) {
      try {
        await canchaService.delete(canchaToDelete.id);
        setCanchas(prev => prev.filter(x => x.id !== canchaToDelete.id));
        setDeleteModalVisible(false);
        setSuccessMessage("La cancha ha sido eliminada exitosamente.");
        setSuccessModalVisible(true);
      } catch (error) {
        Alert.alert("Error", "No se pudo eliminar la cancha.");
      }
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
        {loading ? (
          <ActivityIndicator size="large" color="#009b3a" style={{ marginTop: 50 }} />
        ) : filteredCanchas.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 50, color: '#94a3b8' }}>No hay canchas disponibles.</Text>
        ) : (
          filteredCanchas.map(item => (
            <CanchaCard 
              key={item.id} 
              item={item} 
              onEdit={handleOpenModal} 
              onDelete={(c) => confirmDelete(c)} 
              onToggleMaintenance={() => handleToggleMaintenance(item.id)}
              canModify={canModify} 
              canToggleMaintenance={canToggleMaintenance}
            />
          ))
        )}
      </ScrollView>

      <CanchaFormModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        isEditing={isEditing} 
        formData={formData} 
        setFormData={setFormData} 
        onSave={handleSave} 
        errorMessage={formError}
      />

      <DeleteModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={executeDelete}
        title="Eliminar Cancha"
        itemName={canchaToDelete ? canchaToDelete.nombre : ''}
      />

      <SuccessModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        message={successMessage}
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