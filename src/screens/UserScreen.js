import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import UserCard from '../components/UserCard';
import UserFormModal from '../components/UserFormModal';

export default function UserScreen({ route, navigation }) {
  const { role: currentUserRole } = route.params || { role: "ADMIN" };

  const [users, setUsers] = useState([
    { id: '1', nombre: 'Julián', apellido: 'Antunes', role: 'ADMIN', email: 'julian@golahora.com', dni: '12345678', activo: true, telefono: '1122334455', dia: '01', mes: '04', anio: '1995', esSocioActivo: true, aptoFisico: true },
    { id: '2', nombre: 'Robert', apellido: 'García', role: 'PERSONAL', email: 'robert@golahora.com', dni: '87654321', activo: true, telefono: '1155667788' },
  ]);

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const initialFormState = {
    dni: '', nombre: '', apellido: '', genero: 'Masculino', dia: '', mes: '', anio: '',
    telefono: '', direccion: '', localidad: '', codigoPostal: '', provincia: 'Buenos Aires',
    pais: 'Argentina', email: '', role: 'CLIENTE', contactoEmergencia: '', activo: true,
    esSocioActivo: false, obraSocial: '', aptoFisico: false, especializacion: '',
    fechaRegistro: new Date().toLocaleDateString()
  };

  const [formData, setFormData] = useState(initialFormState);
  const rolesIcons = { ADMIN: 'shield-crown', PERSONAL: 'account-cog', PROFE: 'whistle', CLIENTE: 'account-group' };

  // PERMISOS
  const canModifyTarget = (targetUser) => {
    if (currentUserRole === 'ADMIN') return true;
    if (currentUserRole === 'PERSONAL') return targetUser.role === 'PROFE' || targetUser.role === 'CLIENTE';
    return false;
  };

  const canCreate = currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL';

  // FUNCIONES
  const handleOpenModal = (user = null) => {
    if (user) {
      if (!canModifyTarget(user)) {
        Alert.alert("Acceso denegado", "No tienes permisos.");
        return;
      }
      setFormData({ ...initialFormState, ...user });
      setIsEditing(true);
    } else {
      setFormData(initialFormState);
      setIsEditing(false);
    }
    setModalVisible(true);
  };

  const handleDelete = (userToDelete) => {
    if (!canModifyTarget(userToDelete)) {
      Alert.alert("Acceso denegado", "No tienes permisos.");
      return;
    }
    Alert.alert("Eliminar Usuario", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "ELIMINAR", onPress: () => setUsers(users.filter(u => u.id !== userToDelete.id)), style: "destructive" }
    ]);
  };

  const handleSave = () => {
    if (!formData.dni || !formData.nombre || !formData.apellido) {
      Alert.alert("Atención", "DNI, Nombre y Apellido son obligatorios.");
      return;
    }
    if (isEditing) {
      setUsers(users.map(u => u.id === formData.id ? { ...formData } : u));
    } else {
      setUsers([...users, { ...formData, id: Date.now().toString() }]);
    }
    setModalVisible(false);
  };

  const filteredUsers = users.filter(u => 
    u.nombre.toLowerCase().includes(search.toLowerCase()) || 
    u.apellido.toLowerCase().includes(search.toLowerCase()) || 
    u.dni.includes(search)
  );

  const sections = ['ADMIN', 'PERSONAL', 'PROFE', 'CLIENTE'].map(role => ({
    role,
    data: filteredUsers.filter(u => u.role === role)
  })).filter(section => section.data.length > 0);

  return (
    <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
      <View style={[styles.searchWrapper, isSearchFocused && styles.searchWrapperFocused]}>
        <View style={styles.searchInner}>
            <MaterialCommunityIcons name="account-search-outline" size={22} color={isSearchFocused ? "#009b3a" : "#94a3b8"} />
            <TextInput placeholder="Buscar por nombre, apellido o DNI..." placeholderTextColor="#94a3b8" value={search} onChangeText={setSearch} onFocus={() => setIsSearchFocused(true)} onBlur={() => setIsSearchFocused(false)} style={styles.searchInputNav} />
        </View>
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.mainTitle}>Gestión de Usuarios</Text>
        {canCreate && (
          <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
            <MaterialCommunityIcons name="account-plus" size={24} color="#fff" /><Text style={styles.addButtonText}>NUEVO</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {sections.map(section => (
          <View key={section.role} style={styles.roleSection}>
            <View style={styles.roleHeaderHighlighter}>
                <MaterialCommunityIcons name={rolesIcons[section.role]} size={18} color="#000" />
                <Text style={styles.roleHeaderTextBlack}>{section.role} ({section.data.length})</Text>
            </View>
            {section.data.map(item => (
              <UserCard key={item.id} item={item} onEdit={handleOpenModal} onDelete={handleDelete} canModify={canModifyTarget(item)} />
            ))}
          </View>
        ))}
      </ScrollView>

      <UserFormModal 
        visible={modalVisible} onClose={() => setModalVisible(false)} 
        isEditing={isEditing} formData={formData} setFormData={setFormData} 
        onSave={handleSave} currentUserRole={currentUserRole} rolesIcons={rolesIcons} 
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  searchWrapper: { width: '100%', backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, elevation: 4, borderWidth: 1, borderColor: '#f1f5f9' },
  searchWrapperFocused: { borderColor: '#009b3a', borderWidth: 1.5 },
  searchInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 55 },
  searchInputNav: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mainTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  addButton: { backgroundColor: '#009b3a', flexDirection: 'row', padding: 10, borderRadius: 12, alignItems: 'center' },
  addButtonText: { fontWeight: '900', marginLeft: 5, color: '#fff' },
  roleSection: { marginBottom: 25 },
  roleHeaderHighlighter: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#ffb300', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 6, alignSelf: 'flex-start' },
  roleHeaderTextBlack: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 1, marginLeft: 8 },
});