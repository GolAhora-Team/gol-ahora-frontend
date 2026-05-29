import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import UserCard from '../components/UserCard';
import UserFormModal from '../components/UserFormModal';
import { clienteService } from '../services/clienteService';
import { profesorService } from '../services/profesorService';
import { administradorService } from '../services/administradorService';
import { userService } from '../services/userService';
import DeleteModal from '../components/DeleteModal';
import SuccessModal from '../components/SuccessModal';

export default function UserScreen({ route, navigation }) {
  const { role: currentUserRole } = route.params || { role: "ADMIN" };

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [formError, setFormError] = useState('');
  const [originalRole, setOriginalRole] = useState(null);
  
  const initialFormState = {
    dni: '', nombre: '', apellido: '', genero: 'Masculino',
    telefono: '', direccion: '', localidad: '', codigoPostal: '', provincia: 'Buenos Aires',
    pais: 'Argentina', email: '', role: 'CLIENTE', contactoEmergencia: '', activo: true,
    esSocioActivo: false, obraSocial: '', aptoFisico: false, especializacion: '',
    fechaRegistro: new Date().toLocaleDateString(), fechaNacimiento: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  // CARGA INICIAL DESDE EL BACKEND
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const clientes = await clienteService.getAll();
      const clientesMapped = (clientes || []).map(c => ({
        ...c, id: c.id?.toString(), role: 'CLIENTE'
      }));

      let profesores = [];
      try {
        const profData = await profesorService.getAll();
        profesores = (profData || []).map(p => ({
          ...p, id: p.id?.toString(), role: 'PROFE'
        }));
      } catch (e) { /* profesores endpoint puede no existir aún */ }

      let administradores = [];
      try {
        const adminData = await administradorService.getAll();
        administradores = (adminData || []).map(a => ({
          ...a, 
          id: a.id?.toString(), 
          role: a.identificador === 101 ? 'PERSONAL' : 'ADMIN'
        }));
      } catch (e) { /* admin endpoint puede fallar si está vacío */ }

      setUsers([...clientesMapped, ...profesores, ...administradores]);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  // PERMISOS
  const canModifyTarget = (targetUser) => {
    if (currentUserRole === 'ADMIN') return true;
    if (currentUserRole === 'PERSONAL') return targetUser.role === 'PROFE' || targetUser.role === 'CLIENTE';
    return false;
  };

  const canCreate = currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL';

  // FUNCIONES
  const handleOpenModal = (user = null) => {
    setFormError('');
    if (user) {
      if (!canModifyTarget(user)) {
        Alert.alert("Acceso denegado", "No tienes permisos.");
        return;
      }
      let fecha = '';
      if (user.fechaNacimiento) {
        fecha = user.fechaNacimiento.split('T')[0];
      }
      setFormData({ ...initialFormState, ...user, fechaNacimiento: fecha });
      setOriginalRole(user.role);
      setIsEditing(true);
    } else {
      setFormData(initialFormState);
      setOriginalRole(null);
      setIsEditing(false);
    }
    setModalVisible(true);
  };

  const rolesIcons = { ADMIN: 'shield-crown', PERSONAL: 'account-cog', PROFE: 'whistle', CLIENTE: 'account-group' };

  const handleDelete = (targetUser) => {
    if (!canModifyTarget(targetUser)) {
      Alert.alert("Acceso denegado", "No tienes permisos.");
      return;
    }
    setUserToDelete(targetUser);
    setDeleteModalVisible(true);
  };

  const executeDelete = async () => {
    if (!userToDelete) return;
    try {
      if (userToDelete.role === 'CLIENTE') {
        await clienteService.delete(userToDelete.id);
      } else if (userToDelete.role === 'PROFE') {
        await profesorService.delete(userToDelete.id);
      } else if (userToDelete.role === 'ADMIN') {
        await administradorService.delete(userToDelete.id);
      }
      setUsers(users.filter(u => u.id !== userToDelete.id));
      Alert.alert("Éxito", "El usuario se eliminó correctamente.");
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo eliminar el usuario.');
    }
    setDeleteModalVisible(false);
    setUserToDelete(null);
  };

  const handleSave = async () => {
    if (!formData.dni || !formData.nombre || !formData.apellido) {
      setFormError("DNI, Nombre y Apellido son obligatorios.");
      return;
    }
    setFormError('');
    try {
      const dateStr = formData.fechaNacimiento ? (formData.fechaNacimiento.includes('T') ? formData.fechaNacimiento : `${formData.fechaNacimiento}T00:00:00.000Z`) : "2000-01-01T00:00:00.000Z";
      const payloadToSave = { ...formData, fechaNacimiento: dateStr };

      if (isEditing) {
        // Update
        if (formData.role === 'CLIENTE') {
          await clienteService.update(formData.id, payloadToSave);
        } else if (formData.role === 'PROFE') {
          await profesorService.updateSimple(formData.id, payloadToSave);
        } else if (formData.role === 'ADMIN') {
          await administradorService.updateSimple(formData.id, payloadToSave);
        }
        setUsers(users.map(u => u.id === formData.id ? { ...payloadToSave } : u));
      } else {
        // Create
        const mappedData = { 
          ...payloadToSave, 
          dni: Number(formData.dni),
          especialidad: formData.especializacion || 'General',
          certificacion: 'Ninguna', // Valor por defecto ya que no se pide en el form
          obraSocial: formData.obraSocial || 'Ninguna'
        };
        
        const payload = {
          email: formData.dni.toString(),
          password: "1234"
        };

        if (formData.role === 'CLIENTE') {
          payload.cliente = mappedData;
          await userService.createUsuarioCliente(payload);
        } else if (formData.role === 'PROFE') {
          payload.request = mappedData;
          await userService.createUsuarioProfesor(payload);
        } else if (formData.role === 'ADMIN' || formData.role === 'PERSONAL') {
          mappedData.identificador = formData.role === 'ADMIN' ? 100 : 101;
          mappedData.puedeFacturar = true;
          payload.admin = mappedData;
          await userService.createUsuarioAdmin(payload);
        }

        setSuccessMessage(`Credenciales generadas:\nUsuario/DNI: ${formData.dni}\nContraseña: 1234`);
        setSuccessVisible(true);
        loadUsers(); 
        setModalVisible(false);
      }
    } catch (error) {
      setFormError(error.message || 'No se pudo guardar el usuario.');
    }
  };

  const filteredUsers = users.filter(u => {
    const nombre = u.nombre ? String(u.nombre).toLowerCase() : '';
    const apellido = u.apellido ? String(u.apellido).toLowerCase() : '';
    const dni = u.dni ? String(u.dni) : '';
    const searchLower = search.toLowerCase();
    
    return nombre.includes(searchLower) || 
           apellido.includes(searchLower) || 
           dni.includes(searchLower);
  });

  const sections = ['ADMIN', 'PERSONAL', 'PROFE', 'CLIENTE'].map(role => ({
    role,
    data: filteredUsers.filter(u => u.role === role)
  })).filter(section => section.data.length > 0);

  if (loading) {
    return (
      <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#009b3a" />
          <Text style={{ color: '#fff', marginTop: 10, fontWeight: '600' }}>Cargando usuarios...</Text>
        </View>
      </ScreenTemplate>
    );
  }

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
        errorMessage={formError} originalRole={originalRole}
      />

      <DeleteModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={executeDelete}
        title="Eliminar Usuario"
        itemName={userToDelete ? `${userToDelete.nombre} ${userToDelete.apellido}` : ''}
      />

      <SuccessModal
        visible={successVisible}
        onClose={() => setSuccessVisible(false)}
        title="¡Éxito!"
        message={successMessage}
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