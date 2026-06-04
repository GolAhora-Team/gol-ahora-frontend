import React, { useState, useEffect, useRef } from 'react';
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
import ConfirmModal from '../components/ConfirmModal';
import { reportHistoryService } from '../services/reportHistoryService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../services/apiConfig';

// Helper: convierte un blob URI a un File real para web FormData
const uriToFile = async (uri, name, mimeType) => {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new File([blob], name, { type: mimeType });
  }
  // En React Native, el objeto {uri, name, type} funciona directamente
  return { uri, name, type: mimeType };
};

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
  const [confirmReportModalVisible, setConfirmReportModalVisible] = useState(false);
  const [userToReport, setUserToReport] = useState(null);
  const [currentPdfHtml, setCurrentPdfHtml] = useState(null);
  
  const initialFormState = {
    dni: '', nombre: '', apellido: '', genero: 'Masculino',
    telefono: '', direccion: '', localidad: '', codigoPostal: '', provincia: 'Buenos Aires',
    pais: 'Argentina', email: '', role: 'CLIENTE', contactoEmergencia: '', activo: true,
    esSocioActivo: false, obraSocial: '', tieneObraSocial: false, aptoFisico: false, especializacion: '',
    fechaRegistro: new Date().toLocaleDateString(), fechaNacimiento: '',
    certificadoFile: null, certificadoBase64: null, certFechaInicio: '', certFechaFin: '', sinCaducidad: false, certificacion: '',
    aptoMedicoFileName: null, aptoMedicoBase64: null, aptoFechaInicio: '', aptoFechaFin: ''
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
      const hasObraSocial = user.obraSocial && user.obraSocial !== 'Ninguna' && user.obraSocial !== '';
      
      let certInicio = '';
      let certFin = '';
      let aptoInicio = '';
      let aptoFin = '';
      if (user.role === 'PROFE') {
        if (user.certificadoFechaInicio) certInicio = user.certificadoFechaInicio.split('T')[0];
        if (user.certificadoFechaVencimiento) certFin = user.certificadoFechaVencimiento.split('T')[0];
      } else if (user.role === 'CLIENTE') {
        if (user.aptoMedicoFechaInicio) aptoInicio = user.aptoMedicoFechaInicio.split('T')[0];
        if (user.aptoMedicoFechaFin) aptoFin = user.aptoMedicoFechaFin.split('T')[0];
      }

      setFormData({ 
        ...initialFormState, 
        ...user, 
        fechaNacimiento: fecha, 
        tieneObraSocial: hasObraSocial,
        especializacion: user.especialidad || user.especializacion || '',
        certFechaInicio: certInicio,
        certFechaFin: certFin,
        sinCaducidad: user.role === 'PROFE' && !user.certificadoFechaVencimiento && user.tieneCertificado,
        certificacion: user.certificacion || '',
        certificadoFile: user.tieneCertificado ? (user.certificadoNombreArchivo || 'Certificado Guardado') : null,
        aptoFechaInicio: aptoInicio,
        aptoFechaFin: aptoFin,
        aptoMedicoFileName: user.tieneAptoMedicoArchivo ? 'Apto Médico Guardado' : null
      });
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
      } else if (userToDelete.role === 'ADMIN' || userToDelete.role === 'PERSONAL') {
        await administradorService.delete(userToDelete.id);
      }
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setSuccessMessage("El usuario se eliminó correctamente.");
      setSuccessVisible(true);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo eliminar el usuario.');
    }
    setDeleteModalVisible(false);
    setUserToDelete(null);
  };

  const handleSave = async () => {
    const requiredFields = ['dni', 'nombre', 'apellido', 'telefono', 'direccion', 'localidad', 'provincia', 'pais', 'contactoEmergencia', 'email'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        setFormError(`El campo ${field.toUpperCase()} es obligatorio.`);
        return;
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormError("Debe ser un email válido.");
      return;
    }
    setFormError('');
    setFormError('');
    try {
      const dateStr = formData.fechaNacimiento ? (formData.fechaNacimiento.includes('T') ? formData.fechaNacimiento : `${formData.fechaNacimiento}T00:00:00.000Z`) : "2000-01-01T00:00:00.000Z";
      const payloadToSave = { ...formData, fechaNacimiento: dateStr };

      if (isEditing) {
        // Update
        if (formData.role === 'CLIENTE') {
          await clienteService.update(formData.id, payloadToSave);
          if (formData.aptoMedicoBase64 && formData.aptoFechaInicio && formData.aptoFechaFin) {
            await userService.uploadAptoMedico({
              clienteId: parseInt(formData.id),
              archivoBase64: formData.aptoMedicoBase64,
              fechaInicio: `${formData.aptoFechaInicio}T00:00:00.000Z`,
              fechaFin: `${formData.aptoFechaFin}T00:00:00.000Z`
            });
          }
        } else if (formData.role === 'PROFE') {
          const formPayload = new FormData();
          formPayload.append('Dni', formData.dni);
          formPayload.append('Nombre', formData.nombre);
          formPayload.append('Apellido', formData.apellido);
          formPayload.append('Genero', formData.genero);
          formPayload.append('FechaNacimiento', dateStr);
          formPayload.append('Telefono', formData.telefono);
          formPayload.append('Direccion', formData.direccion);
          formPayload.append('Localidad', formData.localidad);
          formPayload.append('CodigoPostal', formData.codigoPostal);
          formPayload.append('Provincia', formData.provincia);
          formPayload.append('Pais', formData.pais);
          formPayload.append('ContactoEmergencia', formData.contactoEmergencia);
          formPayload.append('Email', formData.email);
          formPayload.append('Especialidad', formData.especializacion || 'General');
          formPayload.append('ObraSocial', formData.obraSocial || 'Ninguna');
          formPayload.append('Certificacion', formData.certificacion || 'Ninguna');
          
          const certFechaInicio = formData.certFechaInicio ? `${formData.certFechaInicio}T00:00:00.000Z` : null;
          const certFechaFin = formData.sinCaducidad ? null : (formData.certFechaFin ? `${formData.certFechaFin}T00:00:00.000Z` : null);

          if (certFechaInicio) formPayload.append('CertificadoFechaInicio', certFechaInicio);
          if (certFechaFin) formPayload.append('CertificadoFechaVencimiento', certFechaFin);

          if (formData.fileUri) {
            const fileObj = await uriToFile(formData.fileUri, formData.certificadoFile, formData.fileMimeType || 'application/pdf');
            formPayload.append('CertificadoArchivo', fileObj);
          }

          await profesorService.updateSimple(formData.id, formPayload);
        } else if (formData.role === 'ADMIN' || formData.role === 'PERSONAL') {
          await administradorService.updateSimple(formData.id, payloadToSave);
        }
        
        setUsers(users.map(u => u.id === formData.id ? { ...payloadToSave } : u));
        
        setSuccessMessage("Los cambios se guardaron con éxito.");
        setSuccessVisible(true);
        loadUsers();
        setModalVisible(false);
      } else {
        // Create
        const mappedData = { 
          ...payloadToSave, 
          dni: Number(formData.dni),
          especialidad: formData.especializacion || 'General',
          certificacion: formData.certificacion || 'Ninguna',
          certificadoBase64: formData.certificadoBase64,
          certificadoFechaInicio: formData.certFechaInicio ? `${formData.certFechaInicio}T00:00:00.000Z` : null,
          certificadoFechaFin: formData.sinCaducidad ? null : (formData.certFechaFin ? `${formData.certFechaFin}T00:00:00.000Z` : null),
          obraSocial: formData.obraSocial || 'Ninguna'
        };
        
        const payload = {
          email: formData.dni.toString(),
          password: "1234",
          username: formData.dni.toString()
        };

        if (formData.role === 'CLIENTE') {
          payload.cliente = mappedData;
          await userService.createUsuarioCliente(payload);
        } else if (formData.role === 'PROFE') {
          const formPayload = new FormData();
          formPayload.append('Email', formData.dni.toString());
          formPayload.append('Password', "1234");
          formPayload.append('Username', formData.dni.toString());
          formPayload.append('Dni', mappedData.dni);
          formPayload.append('Nombre', mappedData.nombre);
          formPayload.append('Apellido', mappedData.apellido);
          formPayload.append('Genero', mappedData.genero);
          formPayload.append('FechaNacimiento', mappedData.fechaNacimiento);
          formPayload.append('Telefono', mappedData.telefono);
          formPayload.append('Direccion', mappedData.direccion);
          formPayload.append('Localidad', mappedData.localidad);
          formPayload.append('CodigoPostal', mappedData.codigoPostal);
          formPayload.append('Provincia', mappedData.provincia);
          formPayload.append('Pais', mappedData.pais);
          formPayload.append('ContactoEmergencia', mappedData.contactoEmergencia);
          formPayload.append('Certificacion', mappedData.certificacion);
          formPayload.append('Especialidad', mappedData.especialidad);
          
          if (mappedData.certificadoFechaInicio) formPayload.append('CertificadoFechaInicio', mappedData.certificadoFechaInicio);
          if (mappedData.certificadoFechaFin) formPayload.append('CertificadoFechaVencimiento', mappedData.certificadoFechaFin);

          if (formData.fileUri) {
            const fileObj = await uriToFile(formData.fileUri, formData.certificadoFile, formData.fileMimeType || 'application/pdf');
            formPayload.append('CertificadoArchivo', fileObj);
          }

          await userService.createUsuarioProfesor(formPayload);
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

  const handleGenerateReport = (user) => {
    setUserToReport(user);
    setConfirmReportModalVisible(true);
  };

  const handleDownloadCert = async (user) => {
    try {
      const blob = await profesorService.descargarCertificado(user.id);
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificado_${user.nombre}_${user.apellido}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        Alert.alert('Certificado', 'Descarga disponible solo en la versión web.');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo descargar el certificado.');
    }
  };

  const handleDownloadProfesorReporte = async (user) => {
    try {
      const blob = await profesorService.descargarReporte(user.id);
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Profesor_${user.nombre}_${user.apellido}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        Alert.alert('Reporte', 'Descarga disponible solo en la versión web.');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo generar el reporte.');
    }
  };

  const generateUserHtml = (user) => {
    const d = (val) => val ? val : "-";
    const fechaFormat = (val) => val ? new Date(val).toLocaleDateString() : "-";
    const isProfe = user.role === 'PROFE';
    const reportTitle = isProfe ? 'REPORTE DE PROFESOR' : 'REPORTE DE CLIENTE';
    
    const commonFields = `
      <div class="item"><b>Nombre:</b> ${d(user.nombre)}</div>
      <div class="item"><b>Apellido:</b> ${d(user.apellido)}</div>
      <div class="item"><b>DNI:</b> ${d(user.dni)}</div>
      <div class="item"><b>Fecha de Creación:</b> ${fechaFormat(user.fechaAlta)}</div>
      <div class="item"><b>Email:</b> ${d(user.email)}</div>
      <div class="item"><b>Teléfono:</b> ${d(user.telefono)}</div>
      <div class="item"><b>Género:</b> ${d(user.genero)}</div>
      <div class="item"><b>Fecha Nacimiento:</b> ${fechaFormat(user.fechaNacimiento)}</div>
      <div class="item"><b>Dirección:</b> ${d(user.direccion)}</div>
      <div class="item"><b>Localidad:</b> ${d(user.localidad)}</div>
      <div class="item"><b>Código Postal:</b> ${d(user.codigoPostal)}</div>
      <div class="item"><b>Provincia:</b> ${d(user.provincia)}</div>
      <div class="item"><b>País:</b> ${d(user.pais)}</div>
      <div class="item"><b>Contacto Emergencia:</b> ${d(user.contactoEmergencia)}</div>
    `;

    const profeFields = isProfe ? `
      <div class="item"><b>Especialidad:</b> ${d(user.especialidad || user.especializacion)}</div>
      <div class="item"><b>Certificación:</b> ${d(user.certificacion)}</div>
      <div class="item"><b>Certificado:</b> ${user.tieneCertificado ? 'Sí' : 'No'}</div>
      <div class="item"><b>Cert. Inicio:</b> ${fechaFormat(user.certificadoFechaInicio)}</div>
      <div class="item"><b>Cert. Fin:</b> ${user.certificadoFechaVencimiento ? fechaFormat(user.certificadoFechaVencimiento) : 'Sin caducidad'}</div>
      ${user.tieneCertificado ? `<div class="item" style="width: 100%; margin-top: 15px;"><b>Link Certificado:</b> <a href="${API_BASE_URL}/Profesor/${user.id}/certificado/descargar" target="_blank" style="color: #009b3a; text-decoration: underline;">Descargar PDF Original</a></div>` : ''}
    ` : `
      <div class="item"><b>Obra Social:</b> ${d(user.obraSocial)}</div>
      <div class="item"><b>Apto Físico:</b> ${user.aptoFisico ? "Sí" : "No"}</div>
      <div class="item"><b>Socio Activo:</b> ${user.esSocioActivo ? "Sí" : "No"}</div>
      <div class="item"><b>Fecha Baja:</b> ${fechaFormat(user.fechaBaja)}</div>
    `;

    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #000; }
            .header { text-align: center; margin-bottom: 30px; }
            .brand { color: #009b3a; font-size: 50px; font-weight: 900; margin: 0; }
            .subtitle { font-size: 14px; font-weight: bold; margin-top: 5px; }
            .line { border-bottom: 2px solid #000; margin: 20px 0; }
            .content { margin-top: 20px; font-size: 16px; line-height: 1.6; }
            .report-name { font-size: 22px; text-decoration: underline; margin-bottom: 20px; text-align: center; }
            .grid { display: flex; flex-wrap: wrap; }
            .item { width: 50%; margin-bottom: 15px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #444; border-top: 1px solid #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="brand">GOL AHORA</h1>
            <div class="subtitle">SISTEMA DE GESTIÓN DEPORTIVA</div>
          </div>
          <div class="line"></div>
          <div class="content">
            <div class="report-name">${reportTitle}</div>
            <div class="grid">
              ${commonFields}
              ${profeFields}
            </div>
          </div>
          <div class="footer">
            Generado por ${currentUserRole} - ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;
    return { html, fileName: `Reporte-${isProfe ? 'Profesor' : 'Usuario'}-${user.nombre}_${user.apellido}`.replace(/\s+/g, '_') };
  };

  const executeGenerateReport = async () => {
    if (!userToReport) return;
    try {
      const pdfData = generateUserHtml(userToReport);
      await reportHistoryService.saveReporte(pdfData.html, pdfData.fileName);
      setCurrentPdfHtml(pdfData);
      setSuccessMessage("¡PDF generado y guardado exitosamente!");
      setConfirmReportModalVisible(false);
      setSuccessVisible(true);
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el reporte.');
    }
  };

  const downloadPdf = async (pdfData) => {
    if (Platform.OS === 'web') {
      const html2pdf = require('html2pdf.js');
      const element = document.createElement('div');
      element.innerHTML = pdfData.html;
      html2pdf().from(element).set({
        margin: 10,
        filename: pdfData.fileName + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save();
    } else {
      const { uri } = await Print.printToFileAsync({ html: pdfData.html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
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

  const sortedUsers = [...filteredUsers].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  const roleOrder = ['ADMIN', 'PERSONAL', 'PROFE', 'CLIENTE'];

  const sections = roleOrder.map(role => ({
    role: role,
    data: sortedUsers.filter(u => u.role === role)
  })).filter(section => section.data.length > 0);

  const scrollViewRef = useRef(null);
  const sectionPositions = useRef({});

  const scrollToRole = (role) => {
    const yPos = sectionPositions.current[role];
    if (yPos !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: yPos, animated: true });
    }
  };

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

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <ScrollView 
          showsVerticalScrollIndicator={true} 
          style={{ flex: 1 }}
          ref={scrollViewRef}
        >
          {sections.map(section => (
            <View 
              key={section.role} 
              style={styles.roleSection}
              onLayout={(event) => {
                const layout = event.nativeEvent.layout;
                sectionPositions.current[section.role] = layout.y;
              }}
            >
              <View style={styles.roleHeader}>
                <MaterialCommunityIcons name={rolesIcons[section.role]} size={20} color="#000" />
                <Text style={styles.roleHeaderText}>{section.role}</Text>
              </View>
              {section.data.map(item => (
                <UserCard key={item.id} item={item} onEdit={handleOpenModal} onDelete={handleDelete} onReport={handleGenerateReport} onDownloadCert={handleDownloadCert} canModify={canModifyTarget(item)} />
              ))}
            </View>
          ))}
        </ScrollView>


      </View>

      <UserFormModal 
        visible={modalVisible} onClose={() => setModalVisible(false)} 
        isEditing={isEditing} formData={formData} setFormData={setFormData} 
        onSave={handleSave} onRefresh={loadUsers} currentUserRole={currentUserRole} rolesIcons={rolesIcons} 
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
        onClose={() => { setSuccessVisible(false); setCurrentPdfHtml(null); }}
        title="¡Éxito!"
        message={successMessage}
        actionButtonText={currentPdfHtml ? "DESCARGAR PDF" : null}
        onAction={currentPdfHtml ? () => downloadPdf(currentPdfHtml) : null}
      />

      <ConfirmModal
        visible={confirmReportModalVisible}
        onClose={() => setConfirmReportModalVisible(false)}
        onConfirm={executeGenerateReport}
        title="Generar Reporte"
        message="¿Desea generar un reporte con los datos de este usuario?"
        confirmText="SÍ"
        cancelText="CANCELAR"
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
  roleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#ffb300', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 12, alignSelf: 'flex-start' },
  roleHeaderText: { color: '#000', fontWeight: '900', fontSize: 16, marginLeft: 8 },
  sideNav: { width: 55, backgroundColor: '#fff', borderRadius: 16, marginLeft: 15, paddingVertical: 10, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, alignItems: 'center', justifyContent: 'space-evenly', borderWidth: 1, borderColor: '#f1f5f9' },
  navItem: { alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: 10 },
  navText: { fontSize: 10, fontWeight: '900', color: '#1e293b', marginTop: 4 }
});
