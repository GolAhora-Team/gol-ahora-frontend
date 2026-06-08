import React, { useState, useEffect } from 'react';
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, 
  TextInput, ScrollView, Platform, Alert, ActivityIndicator 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { clienteService } from '../services/clienteService';
import { profesorService } from '../services/profesorService';
import { administradorService } from '../services/administradorService';
import { userService } from '../services/userService';
import SuccessModal from './SuccessModal';

export default function SettingsModal({ visible, onClose, userRole, idPersona, idUsuario }) {
  const [activeTab, setActiveTab] = useState('PERFIL');
  const [perfilMode, setPerfilMode] = useState('INFO'); // 'INFO' o 'PASSWORD'

  const [isLoading, setIsLoading] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [showObraSocialSuggestions, setShowObraSocialSuggestions] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Username states
  const [currentUsername, setCurrentUsername] = useState('');
  const [editedUsername, setEditedUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null); // null = not checked, true = available, false = taken
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameCheckTimer, setUsernameCheckTimer] = useState(null);

  const topObrasSociales = [
    "OSDE", "Swiss Medical", "Galeno", "Sancor Salud", "Medifé", 
    "OSECAC", "IOMA", "PAMI", "Accord Salud", "Omint", 
    "Unión Personal", "ObSBA", "OSPRERA", "OSPE", "Prevención Salud", 
    "Jerárquicos Salud", "Luis Pasteur", "OSDEPYM", "OSUTHGRA", "Hospital Italiano"
  ];

  const [perfil, setPerfil] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    direccion: '',
    obraSocial: '',
    codigoPostal: '',
    localidad: '',
    provincia: '',
    pais: '',
    contactoEmergencia: ''
  });

  const filteredObrasSociales = perfil.obraSocial 
    ? topObrasSociales.filter(os => os.toLowerCase().includes(perfil.obraSocial.toLowerCase()))
    : topObrasSociales;
  
  // Para la actualizacion se requiere enviar el DTO completo dependiendo del rol
  const [fullData, setFullData] = useState(null);

  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirmPass: ''
  });

  useEffect(() => {
    if (visible && idPersona) {
      loadUserInfo();
    }
  }, [visible, idPersona]);

  const loadUserInfo = async () => {
    setIsLoading(true);
    try {
      let data = null;
      if (userRole === 'CLIENTE') {
        data = await clienteService.getById(idPersona);
      } else if (userRole === 'PROFE') {
        data = await profesorService.getById(idPersona);
      } else if (userRole === 'ADMIN' || userRole === 'PERSONAL') {
        data = await administradorService.getById(idPersona);
      }

      if (data) {
        setFullData(data);
        setPerfil({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          dni: data.dni?.toString() || '',
          email: data.email || '',
          telefono: data.telefono || '',
          direccion: data.direccion || '',
          obraSocial: data.obraSocial || '',
          codigoPostal: data.codigoPostal || '',
          localidad: data.localidad || '',
          provincia: data.provincia || '',
          pais: data.pais || '',
          contactoEmergencia: data.contactoEmergencia || ''
        });
      }

      // Load username from all-usernames endpoint (map by personaId)
      try {
        const usernamesData = await userService.getAllUsernames();
        if (usernamesData && Array.isArray(usernamesData)) {
          const match = usernamesData.find(u => u.personaId === idPersona);
          if (match) {
            setCurrentUsername(match.username || '');
            setEditedUsername(match.username || '');
          }
        }
      } catch (e) {
        console.error('Error loading username:', e);
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInfo = async () => {
    if (!perfil.nombre || !perfil.apellido) {
      Alert.alert("Atención", "El nombre y apellido son obligatorios.");
      return;
    }

    if (isEditingInfo && editedUsername !== currentUsername && editedUsername.length >= 3) {
      if (usernameChecking || usernameAvailable === null) {
        Alert.alert("Atención", "Validando disponibilidad del nombre de usuario, por favor esperá un momento.");
        return;
      }
      if (usernameAvailable === false) {
        Alert.alert("Atención", "El nombre de usuario no está disponible.");
        return;
      }
    }
    
    setIsLoading(true);
    try {
      const updatedData = {
        ...fullData,
        nombre: perfil.nombre,
        apellido: perfil.apellido,
        email: perfil.email,
        telefono: perfil.telefono,
        direccion: perfil.direccion,
        obraSocial: perfil.obraSocial,
        codigoPostal: perfil.codigoPostal,
        localidad: perfil.localidad,
        provincia: perfil.provincia,
        pais: perfil.pais,
        contactoEmergencia: perfil.contactoEmergencia
      };

      if (userRole === 'CLIENTE') {
        await clienteService.update(idPersona, updatedData);
      } else if (userRole === 'PROFE') {
        await profesorService.updateSimple(idPersona, updatedData);
      } else if (userRole === 'ADMIN' || userRole === 'PERSONAL') {
        await administradorService.updateSimple(idPersona, updatedData);
      }

      // If username was changed, update it too
      if (editedUsername && editedUsername !== currentUsername && usernameAvailable === true) {
        try {
          await userService.updateUsername(idUsuario, editedUsername);
          setCurrentUsername(editedUsername);
        } catch (e) {
          Alert.alert('Error', e.message || 'No se pudo actualizar el nombre de usuario.');
        }
      }
      
      setSuccessMsg("¡Cambios guardados correctamente!");
      setSuccessVisible(true);
      setIsEditingInfo(false);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudieron actualizar los datos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.newPass || !passwords.confirmPass) {
      Alert.alert("Atención", "Todos los campos son obligatorios.");
      return;
    }
    if (passwords.newPass !== passwords.confirmPass) {
      Alert.alert("Atención", "Las nuevas contraseñas no coinciden.");
      return;
    }

    // Regla de contraseña: mínimo 8 caracteres, una mayúscula y un carácter especial
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>_+\-\[\]\\\/]).{8,}$/;
    if (!passwordRegex.test(passwords.newPass)) {
      Alert.alert(
        "Contraseña débil",
        "La nueva contraseña debe tener como mínimo 8 caracteres, al menos una letra mayúscula y al menos un carácter especial (ej: @, $, !, #)."
      );
      return;
    }

    setIsLoading(true);
    try {
      await userService.changePassword({
        IdUsuario: idUsuario,
        CurrentPassword: passwords.current,
        NewPassword: passwords.newPass
      });
      
      setSuccessMsg("¡Contraseña actualizada!");
      setSuccessVisible(true);
      setPasswords({ current: '', newPass: '', confirmPass: '' });
    } catch (error) {
      Alert.alert("Error", error.message || "La contraseña actual es incorrecta.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'PERFIL':
        return (
          <View style={{ flex: 1 }}>
            <View style={styles.subTabsContainer}>
              <TouchableOpacity 
                style={[styles.subTabBtn, perfilMode === 'INFO' && styles.subTabActive]} 
                onPress={() => setPerfilMode('INFO')}
              >
                <Text style={[styles.subTabText, perfilMode === 'INFO' && styles.subTabTextActive]}>Información Personal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.subTabBtn, perfilMode === 'PASSWORD' && styles.subTabActive]} 
                onPress={() => setPerfilMode('PASSWORD')}
              >
                <Text style={[styles.subTabText, perfilMode === 'PASSWORD' && styles.subTabTextActive]}>Cambiar Contraseña</Text>
              </TouchableOpacity>
            </View>

            {perfilMode === 'INFO' ? (
              <ScrollView style={styles.form} showsVerticalScrollIndicator={true}>
                {isLoading && !fullData ? (
                  <ActivityIndicator size="small" color="#009b3a" style={{marginVertical: 20}} />
                ) : (
                  <>
                    <Text style={styles.label}>Nombre (No editable)</Text>
                    <TextInput 
                      style={[styles.input, styles.inputDisabled]} 
                      value={perfil.nombre} 
                      onChangeText={(t)=>setPerfil({...perfil, nombre:t})} 
                      editable={false}
                    />
                    <Text style={styles.label}>Apellido (No editable)</Text>
                    <TextInput 
                      style={[styles.input, styles.inputDisabled]} 
                      value={perfil.apellido} 
                      onChangeText={(t)=>setPerfil({...perfil, apellido:t})} 
                      editable={false}
                    />
                    <Text style={styles.label}>DNI (No editable)</Text>
                    <TextInput 
                      style={[styles.input, styles.inputDisabled]} 
                      value={perfil.dni} 
                      editable={false} 
                    />
                    <Text style={styles.label}>Nombre de Usuario</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput 
                        style={[styles.input, !isEditingInfo && styles.inputDisabled, { flex: 1 }]} 
                        value={editedUsername}
                        onChangeText={(t) => {
                          const clean = t.replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase();
                          setEditedUsername(clean);
                          setUsernameAvailable(null);
                          if (usernameCheckTimer) clearTimeout(usernameCheckTimer);
                          if (clean === currentUsername) {
                            setUsernameAvailable(null);
                            return;
                          }
                          if (clean.length < 3) {
                            setUsernameAvailable(null);
                            return;
                          }
                          setUsernameChecking(true);
                          const timer = setTimeout(async () => {
                            try {
                              const result = await userService.checkUsernameAvailable(clean, idUsuario);
                              setUsernameAvailable(result.available);
                            } catch (e) {
                              setUsernameAvailable(null);
                            } finally {
                              setUsernameChecking(false);
                            }
                          }, 500);
                          setUsernameCheckTimer(timer);
                        }}
                        editable={isEditingInfo}
                        autoCapitalize="none"
                        placeholder="Ej: juanperez"
                        placeholderTextColor="#999"
                      />
                      {isEditingInfo && editedUsername !== currentUsername && editedUsername.length >= 3 && (
                        <View style={{ marginLeft: 8, width: 28, alignItems: 'center' }}>
                          {usernameChecking ? (
                            <ActivityIndicator size="small" color="#94a3b8" />
                          ) : usernameAvailable === true ? (
                            <MaterialCommunityIcons name="check-circle" size={24} color="#22c55e" />
                          ) : usernameAvailable === false ? (
                            <MaterialCommunityIcons name="close-circle" size={24} color="#ef4444" />
                          ) : null}
                        </View>
                      )}
                    </View>
                    {isEditingInfo && usernameAvailable === false && (
                      <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700', marginTop: 4 }}>Ese nombre de usuario no está disponible</Text>
                    )}
                    <Text style={styles.label}>Correo Electrónico</Text>
                    <TextInput 
                      style={[styles.input, !isEditingInfo && styles.inputDisabled]} 
                      value={perfil.email} 
                      onChangeText={(t)=>setPerfil({...perfil, email:t})} 
                      editable={isEditingInfo}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <Text style={styles.label}>Obra Social</Text>
                    <View style={{ zIndex: 10 }}>
                      <TextInput 
                        style={[styles.input, !isEditingInfo && styles.inputDisabled]} 
                        value={perfil.obraSocial} 
                        onChangeText={(t) => {
                          setPerfil({...perfil, obraSocial:t});
                          setShowObraSocialSuggestions(true);
                        }} 
                        onFocus={() => isEditingInfo && setShowObraSocialSuggestions(true)}
                        editable={isEditingInfo}
                        placeholder={isEditingInfo ? "Ej: OSDE, Swiss Medical..." : ""}
                        placeholderTextColor="#999"
                      />
                      {isEditingInfo && showObraSocialSuggestions && filteredObrasSociales.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                          <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                            {filteredObrasSociales.map((os, index) => (
                              <TouchableOpacity 
                                key={index} 
                                style={styles.suggestionItem}
                                onPress={() => {
                                  setPerfil({...perfil, obraSocial:os});
                                  setShowObraSocialSuggestions(false);
                                }}
                              >
                                <Text style={styles.suggestionText}>{os}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput 
                      style={[styles.input, !isEditingInfo && styles.inputDisabled]} 
                      value={perfil.telefono} 
                      onChangeText={(t)=>setPerfil({...perfil, telefono:t})} 
                      editable={isEditingInfo}
                    />
                    <Text style={styles.label}>Dirección</Text>
                    <TextInput 
                      style={[styles.input, !isEditingInfo && styles.inputDisabled]} 
                      value={perfil.direccion} 
                      onChangeText={(t)=>setPerfil({...perfil, direccion:t})} 
                      editable={isEditingInfo}
                    />
                    <Text style={styles.label}>C.P.</Text>
                    <TextInput 
                      style={[styles.input, !isEditingInfo && styles.inputDisabled]} 
                      value={perfil.codigoPostal} 
                      onChangeText={(t)=>setPerfil({...perfil, codigoPostal:t})} 
                      editable={isEditingInfo}
                    />
                    <Text style={styles.label}>Localidad</Text>
                    <TextInput 
                      style={[styles.input, !isEditingInfo && styles.inputDisabled]} 
                      value={perfil.localidad} 
                      onChangeText={(t)=>setPerfil({...perfil, localidad:t})} 
                      editable={isEditingInfo}
                    />
                    <Text style={styles.label}>Provincia</Text>
                    <TextInput 
                      style={[styles.input, !isEditingInfo && styles.inputDisabled]} 
                      value={perfil.provincia} 
                      onChangeText={(t)=>setPerfil({...perfil, provincia:t})} 
                      editable={isEditingInfo}
                    />
                    <Text style={styles.label}>País</Text>
                    <TextInput 
                      style={[styles.input, !isEditingInfo && styles.inputDisabled]} 
                      value={perfil.pais} 
                      onChangeText={(t)=>setPerfil({...perfil, pais:t})} 
                      editable={isEditingInfo}
                    />
                    <Text style={styles.label}>Contacto de Emergencia</Text>
                    <TextInput 
                      style={[styles.input, !isEditingInfo && styles.inputDisabled]} 
                      value={perfil.contactoEmergencia} 
                      onChangeText={(t)=>setPerfil({...perfil, contactoEmergencia:t})} 
                      editable={isEditingInfo}
                    />

                    {isEditingInfo ? (
                      <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.saveBtn, {flex: 1, backgroundColor: '#94a3b8', marginRight: 10}]} onPress={() => setIsEditingInfo(false)}>
                          <Text style={styles.saveText}>CANCELAR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.saveBtn, {flex: 1}]} onPress={handleUpdateInfo} disabled={isLoading}>
                          <Text style={styles.saveText}>{isLoading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditingInfo(true)}>
                        <Text style={styles.editText}>EDITAR INFORMACIÓN</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </ScrollView>
            ) : (
              <ScrollView style={styles.form} showsVerticalScrollIndicator={true}>
                <Text style={styles.label}>Contraseña Actual</Text>
                <TextInput 
                  style={styles.input} 
                  secureTextEntry 
                  value={passwords.current}
                  onChangeText={(t) => setPasswords({...passwords, current: t})}
                />
                <Text style={styles.label}>Nueva Contraseña</Text>
                <TextInput 
                  style={styles.input} 
                  secureTextEntry 
                  value={passwords.newPass}
                  onChangeText={(t) => setPasswords({...passwords, newPass: t})}
                />
                <Text style={styles.label}>Repetir Nueva Contraseña</Text>
                <TextInput 
                  style={styles.input} 
                  secureTextEntry 
                  value={passwords.confirmPass}
                  onChangeText={(t) => setPasswords({...passwords, confirmPass: t})}
                />
                <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={isLoading}>
                  <Text style={styles.saveText}>{isLoading ? 'GUARDANDO...' : 'GUARDAR CONTRASEÑA'}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        );
      case 'INFO':
        return (
          <ScrollView style={styles.aboutContainer} showsVerticalScrollIndicator={true}>
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
            <Text style={styles.memberName}>• Salas, Alejandro</Text>
            <Text style={styles.memberName}>• Zalazar, Ezequiel</Text>

            <Text style={styles.aboutFooter}>© 2026 - Gol Ahora - UNAJ</Text>
          </ScrollView>
        );
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="fade" transparent={true}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.tabs}>
              <TouchableOpacity onPress={() => setActiveTab('PERFIL')} style={[styles.tab, activeTab === 'PERFIL' && styles.activeTab]}>
                <MaterialCommunityIcons name="account-cog" size={22} color={activeTab === 'PERFIL' ? '#009b3a' : '#94a3b8'} />
              </TouchableOpacity>

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

      <SuccessModal 
        visible={successVisible} 
        onClose={() => setSuccessVisible(false)} 
        message={successMsg} 
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', width: '90%', maxWidth: 450, maxHeight: '85%', borderRadius: 30, padding: 25, elevation: 20 },
  tabs: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 },
  tab: { padding: 8, borderRadius: 12 },
  activeTab: { backgroundColor: '#f0fdf4' },
  currentSectionTitle: { fontSize: 11, fontWeight: '900', color: '#009b3a', marginBottom: 15, letterSpacing: 1.2 },
  form: { gap: 2 },
  label: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 14, color: '#1e293b' },
  inputDisabled: { backgroundColor: '#f1f5f9', color: '#94a3b8' },
  saveBtn: { backgroundColor: '#009b3a', padding: 16, borderRadius: 14, marginTop: 20, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  editBtn: { backgroundColor: '#fff', padding: 16, borderRadius: 14, marginTop: 20, alignItems: 'center', borderWidth: 1, borderColor: '#009b3a' },
  editText: { color: '#009b3a', fontWeight: '900', fontSize: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoTxt: { fontSize: 12, color: '#64748b', fontStyle: 'italic', marginBottom: 8 },
  aboutContainer: { maxHeight: 280 },
  aboutTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  aboutText: { fontSize: 13, color: '#64748b', marginVertical: 12, lineHeight: 19 },
  memberLabel: { fontSize: 11, fontWeight: '900', color: '#009b3a', marginTop: 10 },
  memberName: { fontSize: 14, color: '#1e293b', marginTop: 6, fontWeight: '600' },
  aboutFooter: { fontSize: 10, color: '#94a3b8', marginTop: 25, textAlign: 'center' },
  subTabsContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 15 },
  subTabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  subTabActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  subTabText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  subTabTextActive: { color: '#009b3a' },
  suggestionsContainer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginTop: 5, marginBottom: 15, paddingVertical: 5, elevation: 3, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 3 },
  suggestionItem: { paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  suggestionText: { color: '#333', fontSize: 13, fontWeight: '600' }
});
