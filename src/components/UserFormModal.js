import React, { useState } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, TextInput, Switch, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { facturaService } from '../services/facturaService';
import { clienteService } from '../services/clienteService';
import { API_BASE_URL } from '../services/apiConfig';
import CustomInput from './CustomInput';
import DatePickerModal from './DatePickerModal';
import CobroMembresiaModal from './CobroMembresiaModal';
import SuccessModal from './SuccessModal';

const formatDateDisplay = (dateStr) => {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}-${m}-${y}`;
};

export default function UserFormModal({ visible, onClose, isEditing, formData, setFormData, onSave, onRefresh, currentUserRole, rolesIcons, errorMessage, originalRole }) {
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarAptoInicioVisible, setCalendarAptoInicioVisible] = useState(false);
  const [calendarAptoFinVisible, setCalendarAptoFinVisible] = useState(false);
  const [calendarCertVisible, setCalendarCertVisible] = useState(false);
  const [calendarCertData, setCalendarCertData] = useState({ index: null, field: null });
  const [showObraSocialSuggestions, setShowObraSocialSuggestions] = useState(false);
  const [showLocalidadSuggestions, setShowLocalidadSuggestions] = useState(false);
  const [cobroModalVisible, setCobroModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const handleAddCertificado = () => {
    setFormData(prev => ({
      ...prev,
      certificados: [...(prev.certificados || []), {
        id: null,
        certificadoFile: null,
        certificadoBase64: null,
        fileUri: null,
        certFechaInicio: '',
        certFechaFin: '',
        sinCaducidad: false,
        tieneCertificado: false,
        eliminarCertificado: false
      }]
    }));
  };

  const handleRemoveCertificado = (index) => {
    setFormData(prev => {
      const newCerts = [...prev.certificados];
      if (newCerts[index].id) {
        newCerts[index].eliminarCertificado = true;
      } else {
        newCerts.splice(index, 1);
      }
      return { ...prev, certificados: newCerts };
    });
  };

  const updateCertificado = (index, field, value) => {
    setFormData(prev => {
      const newCerts = [...prev.certificados];
      newCerts[index] = { ...newCerts[index], [field]: value };
      return { ...prev, certificados: newCerts };
    });
  };

  const topObrasSociales = [
    "OSDE", "Swiss Medical", "Galeno", "Sancor Salud", "Medifé",
    "OSECAC", "IOMA", "PAMI", "Accord Salud", "Omint",
    "Unión Personal", "ObSBA", "OSPRERA", "OSPE", "Prevención Salud",
    "Jerárquicos Salud", "Luis Pasteur", "OSDEPYM", "OSUTHGRA", "Hospital Italiano"
  ];

  const topLocalidades = [
    "Florencio Varela", "Hudson", "Ranelagh", "Cruce Varela", "Quilmes",
    "Ezpeleta", "Berazategui", "Bosques", "Sourigues", "Plátanos",
    "Gutiérrez", "Villa España", "Bernal", "Don Bosco", "Wilde",
    "Adrogué", "Temperley", "Lomas de Zamora", "Lanús", "Avellaneda"
  ];

  const filteredObrasSociales = formData.obraSocial
    ? topObrasSociales.filter(os => os.toLowerCase().includes(formData.obraSocial.toLowerCase()))
    : topObrasSociales;

  const filteredLocalidades = formData.localidad
    ? topLocalidades.filter(loc => loc.toLowerCase().includes(formData.localidad.toLowerCase()))
    : topLocalidades;

  const handlePickDocument = async (index) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (file.size > 4 * 1024 * 1024) {
          alert('El archivo excede el límite de 4MB.');
          return;
        }
        const fileName = file.name || (file.uri ? file.uri.split('/').pop() : 'documento.pdf');

        if (Platform.OS === 'web') {
          const reader = new FileReader();
          reader.onload = () => {
            const base64Data = reader.result.split(',')[1];
            updateCertificado(index, 'certificadoFile', fileName);
            updateCertificado(index, 'certificadoBase64', base64Data);
            updateCertificado(index, 'fileUri', file.uri);
            updateCertificado(index, 'fileMimeType', file.mimeType || 'application/pdf');
          };
          reader.readAsDataURL(file.file);
        } else {
          const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
          updateCertificado(index, 'certificadoFile', fileName);
          updateCertificado(index, 'certificadoBase64', base64);
          updateCertificado(index, 'fileUri', file.uri);
          updateCertificado(index, 'fileMimeType', file.mimeType || 'application/pdf');
        }
      }
    } catch (err) {
      console.error("Error picking document: ", err);
    }
  };

  const handlePickAptoMedico = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (file.size > 2 * 1024 * 1024) {
          alert('El archivo del apto físico excede el límite de 2MB.');
          return;
        }
        const fileName = file.name || (file.uri ? file.uri.split('/').pop() : 'apto_fisico.pdf');

        if (Platform.OS === 'web') {
          const reader = new FileReader();
          reader.onload = () => {
            const base64Data = reader.result.split(',')[1];
            setFormData(prev => ({ ...prev, aptoMedicoFileName: fileName, aptoMedicoBase64: base64Data, aptoFisico: true }));
          };
          reader.readAsDataURL(file.file);
        } else {
          const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
          setFormData(prev => ({ ...prev, aptoMedicoFileName: fileName, aptoMedicoBase64: base64, aptoFisico: true }));
        }
      }
    } catch (err) {
      console.error("Error picking apto medico: ", err);
    }
  };

  const isRoleEditable = (r) => {
    if (!isEditing) return true;
    if (currentUserRole === 'ADMIN' && originalRole === 'PERSONAL') {
      return r === 'ADMIN' || r === 'PERSONAL';
    }
    return false;
  };

  const handleCobroBoton = () => {
    if (!formData.id) {
      alert("Debes crear el usuario primero antes de cobrar la membresía.");
      return;
    }
    setCobroModalVisible(true);
  };

  const getPrecioMembresia = () => {
    try {
      const saved = localStorage.getItem('GOL_AHORA_PRECIO_MEMBRESIA');
      if (saved) return parseInt(saved);
    } catch (e) { /* ignore */ }
    return 2000;
  };

  const handleCobrarMembresia = async (metodoPago) => {
    setCobroModalVisible(false);
    try {
      const precio = getPrecioMembresia();
      const now = new Date();
      now.setHours(now.getHours() - 3); // Ajuste horario para Argentina (UTC-3)

      const payload = {
        fechaEmision: now.toISOString(),
        total: precio,
        estado: 1,
        tipo: 1,
        descripcion: `Suscripción Socio Activo - Presencial (${metodoPago})`,
        clienteId: formData.id
      };
      await facturaService.create(payload);

      const dateStr = formData.fechaNacimiento ? (formData.fechaNacimiento.includes('T') ? formData.fechaNacimiento : `${formData.fechaNacimiento}T00:00:00.000Z`) : "2000-01-01T00:00:00.000Z";
      const updatedPayload = { ...formData, fechaNacimiento: dateStr, esSocioActivo: true };
      await clienteService.update(formData.id, updatedPayload);

      setFormData(updatedPayload);
      if (onRefresh) onRefresh();
      setSuccessMessage("Factura generada correctamente. El cliente ahora es Socio Activo.");
    } catch (e) {
      console.error(e);
      alert("Hubo un error al generar la factura.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>{isEditing ? 'EDITAR PERFIL' : 'NUEVO REGISTRO'}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close-circle" size={35} color="#009b3a" />
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <ScrollView showsVerticalScrollIndicator={true}>
            {/* 1. IDENTIDAD */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>1. IDENTIDAD</Text>
              <CustomInput label="DNI" keyboardType="numeric" value={formData.dni} onChangeText={v => setFormData({ ...formData, dni: v.replace(/[^0-9]/g, '') })} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText} />
              <View style={styles.row}>
                <View style={{ flex: 1 }}><CustomInput label="NOMBRE" value={formData.nombre} onChangeText={v => setFormData({ ...formData, nombre: v.replace(/[0-9]/g, '') })} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText} /></View>
                <View style={{ flex: 1, marginLeft: 10 }}><CustomInput label="APELLIDO" value={formData.apellido} onChangeText={v => setFormData({ ...formData, apellido: v.replace(/[0-9]/g, '') })} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText} /></View>
              </View>

              <View style={styles.dateFullRow}>
                <Text style={styles.greenLabelBold}>FECHA DE NACIMIENTO</Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 15, backgroundColor: '#f8fafc', height: 50 }}
                  onPress={() => setCalendarVisible(true)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="calendar" size={20} color="#009b3a" style={{ marginRight: 10 }} />
                  <Text style={{ color: formData.fechaNacimiento ? '#009b3a' : '#94a3b8', fontSize: 16, fontWeight: '900', flex: 1 }}>
                    {formData.fechaNacimiento ? formatDateDisplay(formData.fechaNacimiento) : "DD-MM-YYYY"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.greenLabelBold}>GÉNERO</Text>
              <View style={styles.genderRow}>
                {['Masculino', 'Femenino'].map(g => (
                  <TouchableOpacity key={g} onPress={() => setFormData({ ...formData, genero: g })} style={[styles.genderBtn, formData.genero === g && styles.activeGreenBtn]}>
                    <Text style={[styles.btnText, formData.genero === g ? styles.whiteText : styles.greenText]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. ROL */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>2. ROL DEL SISTEMA {isEditing && !(currentUserRole === 'ADMIN' && originalRole === 'PERSONAL') ? "(No editable)" : ""}</Text>
              <View style={styles.grid}>
                {Object.keys(rolesIcons).map(r => {
                  if (currentUserRole === 'PERSONAL' && (r === 'ADMIN' || r === 'PERSONAL')) return null;

                  const editable = isRoleEditable(r);

                  return (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.roleBtn,
                        formData.role === r && styles.activeGreenBtn,
                        !editable && formData.role !== r && { opacity: 0.4 }
                      ]}
                      onPress={() => {
                        if (editable) setFormData({ ...formData, role: r });
                      }}
                      disabled={!editable}
                    >
                      <MaterialCommunityIcons name={rolesIcons[r]} size={20} color={formData.role === r ? '#fff' : (!editable ? '#94a3b8' : '#009b3a')} />
                      <Text style={[styles.btnText, formData.role === r ? styles.whiteText : (!editable ? { color: '#94a3b8' } : styles.greenText)]}>{r}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. CAMPOS DINÁMICOS */}
            {formData.role === 'CLIENTE' && (
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>DATOS ESPECÍFICOS CLIENTE</Text>

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setFormData({ ...formData, tieneObraSocial: !formData.tieneObraSocial, obraSocial: !formData.tieneObraSocial ? formData.obraSocial : '' })}
                >
                  <MaterialCommunityIcons
                    name={formData.tieneObraSocial ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={24}
                    color="#009b3a"
                  />
                  <Text style={styles.checkboxLabel}>¿Tiene Obra Social / Prepaga?</Text>
                </TouchableOpacity>

                {formData.tieneObraSocial && (

                  <View style={{ zIndex: 10 }}>
                    <Text style={styles.greenLabelBold}>OBRA SOCIAL</Text>
                    <TextInput
                      style={styles.cleanInput}
                      value={formData.obraSocial}
                      onChangeText={v => {
                        setFormData({ ...formData, obraSocial: v });
                        setShowObraSocialSuggestions(true);
                      }}
                      onFocus={() => setShowObraSocialSuggestions(true)}
                      placeholder="Ej: OSDE, Swiss Medical..."
                      placeholderTextColor="#94a3b8"
                    />

                    {showObraSocialSuggestions && filteredObrasSociales.length > 0 && (
                      <View style={styles.suggestionsContainer}>
                        <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                          {filteredObrasSociales.map((os, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.suggestionItem}
                              onPress={() => {
                                setFormData({ ...formData, obraSocial: os });
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
                )}

                <View style={styles.statusContainer}>
                  <TouchableOpacity style={[styles.bigStatusBtn, formData.esSocioActivo ? styles.statusBtnOn : styles.statusBtnOff]} onPress={() => setFormData({ ...formData, esSocioActivo: !formData.esSocioActivo })}>
                    <View style={[styles.iconCircle, { backgroundColor: formData.esSocioActivo ? '#fff' : '#e2e8f0' }]}><MaterialCommunityIcons name={formData.esSocioActivo ? "check-bold" : "close"} size={18} color={formData.esSocioActivo ? "#009b3a" : "#94a3b8"} /></View>
                    <Text style={[styles.statusText, formData.esSocioActivo ? styles.textWhite : styles.textGreen]}>SOCIO ACTIVO</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.bigStatusBtn, formData.aptoFisico ? styles.statusBtnOn : styles.statusBtnOff]} onPress={() => setFormData({ ...formData, aptoFisico: !formData.aptoFisico })}>
                    <View style={[styles.iconCircle, { backgroundColor: formData.aptoFisico ? '#fff' : '#e2e8f0' }]}><MaterialCommunityIcons name={formData.aptoFisico ? "heart-flash" : "heart-outline"} size={18} color={formData.aptoFisico ? "#009b3a" : "#94a3b8"} /></View>
                    <Text style={[styles.statusText, formData.aptoFisico ? styles.textWhite : styles.textGreen]}>APTO FÍSICO</Text>
                  </TouchableOpacity>
                </View>

                {(!formData.esSocioActivo && isEditing) && (
                  <TouchableOpacity style={styles.payBtn} onPress={handleCobroBoton}>
                    <MaterialCommunityIcons name="cash-register" size={20} color="#000" />
                    <Text style={styles.payBtnText}>COBRAR MEMBRESÍA PRESENCIAL (${getPrecioMembresia().toLocaleString('es-AR')})</Text>
                  </TouchableOpacity>
                )}

                {formData.aptoFisico && (
                  <View style={{ marginTop: 20, padding: 15, backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0' }}>
                    <Text style={styles.greenLabelBold}>APTO FÍSICO (PDF/IMG, MÁX 2MB)</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity style={[styles.fileBtn, { flex: 1 }]} onPress={handlePickAptoMedico}>
                        <MaterialCommunityIcons name="file-document-outline" size={24} color="#009b3a" />
                        <Text style={styles.fileBtnText}>
                          {formData.aptoMedicoFileName ? formData.aptoMedicoFileName : (formData.tieneAptoMedicoArchivo ? "Apto Guardado" : "Seleccionar Archivo")}
                        </Text>
                      </TouchableOpacity>
                      {(formData.tieneAptoMedicoArchivo || formData.id) && formData.aptoMedicoFileName === 'Apto Médico Guardado' && (
                        <TouchableOpacity
                          style={[styles.fileBtn, { backgroundColor: '#f1f5f9', flex: 0, paddingHorizontal: 15 }]}
                          onPress={() => window.open(`${API_BASE_URL}/Clientes/${formData.id}/apto-medico/descargar`, '_blank')}
                        >
                          <MaterialCommunityIcons name="eye" size={24} color="#009b3a" />
                          <Text style={[styles.fileBtnText, { color: '#009b3a' }]}>VER</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.datesRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.greenLabelBold}>FECHA EMISIÓN</Text>
                        <TouchableOpacity style={[styles.cleanInput, { height: 48, justifyContent: 'center' }]} onPress={() => setCalendarAptoInicioVisible(true)}>
                          <Text style={{ color: formData.aptoFechaInicio ? '#1e293b' : '#94a3b8', fontWeight: '800' }}>{formData.aptoFechaInicio ? formatDateDisplay(formData.aptoFechaInicio) : "DD-MM-YYYY"}</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ width: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.greenLabelBold}>FECHA VENCIMIENTO</Text>
                        <TouchableOpacity style={[styles.cleanInput, { height: 48, justifyContent: 'center' }]} onPress={() => setCalendarAptoFinVisible(true)}>
                          <Text style={{ color: formData.aptoFechaFin ? '#1e293b' : '#94a3b8', fontWeight: '800' }}>{formData.aptoFechaFin ? formatDateDisplay(formData.aptoFechaFin) : "DD-MM-YYYY"}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {formData.role === 'PROFE' && (
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>DATOS ESPECÍFICOS PROFESOR</Text>
                <CustomInput label="CERTIFICACIÓN / TÍTULO" placeholder="Ej: Profesorado Educación Física" value={formData.certificacion} onChangeText={v => setFormData({ ...formData, certificacion: v })} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText} />
                <CustomInput label="ESPECIALIZACIÓN" placeholder="Ej: Futbol Infantil" value={formData.especializacion} onChangeText={v => setFormData({ ...formData, especializacion: v })} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <Text style={[styles.greenLabelBold, { marginBottom: 0 }]}>CERTIFICADOS PROFESIONALES (PDF, MÁX 4MB)</Text>
                  <TouchableOpacity style={styles.addCertBtn} onPress={handleAddCertificado}>
                    <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                    <Text style={styles.addCertBtnText}>AGREGAR</Text>
                  </TouchableOpacity>
                </View>

                {formData.certificados && formData.certificados.filter(c => !c.eliminarCertificado).map((cert, index) => {
                  const realIndex = formData.certificados.findIndex(c => c === cert);
                  return (
                    <View key={realIndex} style={styles.certCard}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15, alignItems: 'center' }}>
                        <TouchableOpacity style={[styles.fileBtn, { flex: 1, minWidth: 200, marginBottom: 0 }]} onPress={() => handlePickDocument(realIndex)}>
                          <MaterialCommunityIcons name="file-pdf-box" size={24} color="#ef4444" />
                          <Text style={styles.fileBtnText}>
                            {cert.certificadoFile ? cert.certificadoFile : "Seleccionar Archivo"}
                          </Text>
                        </TouchableOpacity>
                        {cert.tieneCertificado && !cert.fileUri && cert.id && (
                          <TouchableOpacity
                            style={[styles.fileBtn, { backgroundColor: '#f1f5f9', flex: 0, paddingHorizontal: 15, marginBottom: 0 }]}
                            onPress={() => {
                              if (Platform.OS === 'web') {
                                window.open(`${API_BASE_URL}/Profesor/${formData.id}/certificado/${cert.id}/descargar`, '_blank');
                              }
                            }}
                          >
                            <MaterialCommunityIcons name="eye" size={24} color="#ef4444" />
                            <Text style={[styles.fileBtnText, { color: '#ef4444' }]}></Text>
                          </TouchableOpacity>
                        )}
                        {cert.fileUri && Platform.OS === 'web' && (
                          <TouchableOpacity
                            style={[styles.fileBtn, { backgroundColor: '#f1f5f9', flex: 0, paddingHorizontal: 15, marginBottom: 0 }]}
                            onPress={() => window.open(cert.fileUri, '_blank')}
                          >
                            <MaterialCommunityIcons name="eye" size={24} color="#ef4444" />
                            <Text style={[styles.fileBtnText, { color: '#ef4444' }]}>VER</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.fileBtn, { backgroundColor: '#fee2e2', flex: 0, paddingHorizontal: 15, borderColor: '#ef4444', marginBottom: 0, alignSelf: 'center' }]}
                          onPress={() => handleRemoveCertificado(realIndex)}
                        >
                          <MaterialCommunityIcons name="delete" size={24} color="#ef4444" />
                        </TouchableOpacity>
                      </View>

                      <View style={[styles.datesRow, { flexWrap: 'wrap', gap: 10 }]}>
                        <View style={{ flex: 1, minWidth: 140 }}>
                          <Text style={styles.greenLabelBold}>FECHA INICIO</Text>
                          <TouchableOpacity style={[styles.cleanInput, { height: 48, justifyContent: 'center' }]} onPress={() => {
                            setCalendarCertData({ index: realIndex, field: 'certFechaInicio' });
                            setCalendarCertVisible(true);
                          }}>
                            <Text style={{ color: cert.certFechaInicio ? '#1e293b' : '#94a3b8', fontWeight: '800' }}>{cert.certFechaInicio ? formatDateDisplay(cert.certFechaInicio) : "DD-MM-YYYY"}</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={{ flex: 1, minWidth: 140 }}>
                          <Text style={[styles.greenLabelBold, cert.sinCaducidad && { color: '#cbd5e1' }]}>FECHA FIN</Text>
                          <TouchableOpacity
                            style={[styles.cleanInput, cert.sinCaducidad && { backgroundColor: '#f1f5f9' }, { height: 48, justifyContent: 'center' }]}
                            onPress={() => {
                              if (!cert.sinCaducidad) {
                                setCalendarCertData({ index: realIndex, field: 'certFechaFin' });
                                setCalendarCertVisible(true);
                              }
                            }}
                            disabled={cert.sinCaducidad}
                          >
                            <Text style={{ color: cert.sinCaducidad ? '#94a3b8' : (cert.certFechaFin ? '#1e293b' : '#94a3b8'), fontWeight: '800' }}>
                              {cert.sinCaducidad ? 'Sin caducidad' : (cert.certFechaFin ? formatDateDisplay(cert.certFechaFin) : "DD-MM-YYYY")}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <TouchableOpacity style={[styles.checkboxContainer, { marginBottom: 0 }]} onPress={() => updateCertificado(realIndex, 'sinCaducidad', !cert.sinCaducidad)}>
                        <MaterialCommunityIcons name={cert.sinCaducidad ? "checkbox-marked" : "checkbox-blank-outline"} size={24} color="#009b3a" />
                        <Text style={styles.checkboxLabel}>Sin fecha de caducidad</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
                {(!formData.certificados || formData.certificados.filter(c => !c.eliminarCertificado).length === 0) && (
                  <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', borderStyle: 'dashed' }}>
                    <Text style={{ color: '#94a3b8', fontWeight: '800' }}>No hay certificados cargados. Haz clic en AGREGAR.</Text>
                  </View>
                )}
              </View>
            )}

            {/* 4. CONTACTO */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>3. CONTACTO Y LOCALIZACIÓN</Text>
              <CustomInput label="EMAIL" value={formData.email} onChangeText={v => setFormData({ ...formData, email: v })} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText} />
              <View style={styles.row}>
                <View style={{ flex: 1.2 }}><CustomInput label="TELÉFONO" value={formData.telefono} onChangeText={v => setFormData({ ...formData, telefono: v.replace(/[^0-9]/g, '') })} keyboardType="phone-pad" containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText} /></View>
                <View style={{ flex: 1, marginLeft: 10 }}><CustomInput label="C.P." value={formData.codigoPostal} onChangeText={v => setFormData({ ...formData, codigoPostal: v })} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText} /></View>
              </View>
              <CustomInput label="DIRECCIÓN" value={formData.direccion} onChangeText={v => setFormData({ ...formData, direccion: v })} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText} />
              <View style={styles.row}>
                <View style={{ flex: 1, zIndex: 20 }}>
                  <Text style={styles.greenLabelBold}>LOCALIDAD</Text>
                  <TextInput
                    style={styles.cleanInput}
                    value={formData.localidad}
                    onChangeText={v => {
                      setFormData({ ...formData, localidad: v });
                      setShowLocalidadSuggestions(true);
                    }}
                    onFocus={() => setShowLocalidadSuggestions(true)}
                    placeholder="Ej: Hudson, Ranelagh..."
                    placeholderTextColor="#94a3b8"
                  />
                  {showLocalidadSuggestions && filteredLocalidades.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                        {filteredLocalidades.map((loc, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.suggestionItem}
                            onPress={() => {
                              setFormData({ ...formData, localidad: loc });
                              setShowLocalidadSuggestions(false);
                            }}
                          >
                            <Text style={styles.suggestionText}>{loc}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}><CustomInput label="PROVINCIA" value={formData.provincia} onChangeText={v => setFormData({ ...formData, provincia: v })} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText} /></View>
              </View>
              <CustomInput label="PAÍS" value={formData.pais} onChangeText={v => setFormData({ ...formData, pais: v })} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText} />
              <CustomInput
                label="CONTACTO EMERG."
                value={formData.contactoEmergencia}
                onChangeText={v => {
                  const newVal = v.replace(/[^0-9]/g, '');
                  if (newVal !== '' && newVal === formData.telefono) {
                    setPhoneError("El contacto de emergencia no puede ser igual al teléfono principal.");
                    setFormData({ ...formData, contactoEmergencia: newVal });
                  } else {
                    setPhoneError("");
                    setFormData({ ...formData, contactoEmergencia: newVal });
                  }
                }}
                keyboardType="phone-pad"
                containerStyle={styles.cleanInput}
                labelStyle={styles.greenLabelBold}
                inputStyle={styles.greenInputText}
              />
              {phoneError ? <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 13, marginTop: -10, marginBottom: 10 }}>{phoneError}</Text> : null}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
              <Text style={styles.saveBtnText}>{isEditing ? 'ACTUALIZAR CAMBIOS' : 'CREAR USUARIO'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <DatePickerModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        onSelect={(date) => setFormData({ ...formData, fechaNacimiento: date })}
        initialDate={formData.fechaNacimiento}
        maxDate={new Date().toISOString().split('T')[0]}
      />

      <DatePickerModal
        visible={calendarAptoInicioVisible}
        onClose={() => setCalendarAptoInicioVisible(false)}
        onSelect={(date) => setFormData({ ...formData, aptoFechaInicio: date })}
        initialDate={formData.aptoFechaInicio}
      />
      <DatePickerModal
        visible={calendarAptoFinVisible}
        onClose={() => setCalendarAptoFinVisible(false)}
        onSelect={(date) => setFormData({ ...formData, aptoFechaFin: date })}
        initialDate={formData.aptoFechaFin}
      />
      <DatePickerModal
        visible={calendarCertVisible}
        onClose={() => setCalendarCertVisible(false)}
        onSelect={(date) => {
          if (calendarCertData.index !== null && calendarCertData.field) {
            updateCertificado(calendarCertData.index, calendarCertData.field, date);
          }
          setCalendarCertVisible(false);
        }}
        initialDate={calendarCertData.index !== null && calendarCertData.field && formData.certificados[calendarCertData.index] ? formData.certificados[calendarCertData.index][calendarCertData.field] : ''}
      />
      <CobroMembresiaModal
        visible={cobroModalVisible}
        onClose={() => setCobroModalVisible(false)}
        onSuccess={handleCobrarMembresia}
        precioBase={getPrecioMembresia()}
      />
      <SuccessModal
        visible={!!successMessage}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 15 },
  modalContainer: { width: '100%', maxWidth: 650, backgroundColor: '#fff', borderRadius: 32, padding: 25, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 15 },
  modalHeaderTitle: { color: '#009b3a', fontSize: 22, fontWeight: '900' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', padding: 12, borderRadius: 12, marginBottom: 20 },
  errorText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 8, fontSize: 14 },
  formSection: { marginBottom: 25 },
  sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '900', marginBottom: 15, letterSpacing: 2 },
  greenLabelBold: { color: '#009b3a', fontSize: 13, fontWeight: '900', marginBottom: 8 },
  cleanInput: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: '#e2e8f0' },
  greenInputText: { color: '#009b3a', fontWeight: '800' },
  row: { flexDirection: 'row', marginBottom: 15 },
  dateFullRow: { marginBottom: 20 },
  datePartInput: { color: '#000', fontWeight: '900', fontSize: 16, width: 35, textAlign: 'center', outlineStyle: 'none' },
  dateSeparator: { color: '#94a3b8', fontWeight: '900', fontSize: 18, marginHorizontal: 5 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 2, borderColor: '#009b3a', alignItems: 'center' },
  activeGreenBtn: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  btnText: { fontWeight: '900', fontSize: 13 },
  greenText: { color: '#009b3a' },
  whiteText: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleBtn: { width: '48.5%', flexDirection: 'row', padding: 12, borderRadius: 14, borderWidth: 2, borderColor: '#009b3a', alignItems: 'center', marginBottom: 5 },
  statusContainer: { flexDirection: 'row', gap: 12, marginTop: 15 },
  bigStatusBtn: { flex: 1, height: 60, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderWidth: 2, elevation: 2 },
  statusBtnOn: { backgroundColor: '#009b3a', borderColor: '#004d1a' },
  statusBtnOff: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1', borderStyle: 'dashed' },
  iconCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  statusText: { marginLeft: 10, fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
  textWhite: { color: '#fff' },
  textGreen: { color: '#94a3b8' },
  payBtn: { backgroundColor: '#ffb300', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 16, marginTop: 15 },
  payBtnText: { color: '#000', fontWeight: '900', fontSize: 13, marginLeft: 8 },
  saveBtn: { backgroundColor: '#009b3a', padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 15 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 17 },
  fileBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 15, height: 56, justifyContent: 'center', borderRadius: 14, marginBottom: 15 },
  fileBtnText: { marginLeft: 10, fontSize: 13, color: '#1e293b', fontWeight: '800', flex: 1 },
  datesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  checkboxLabel: { marginLeft: 8, fontSize: 14, color: '#334155', fontWeight: '800' },
  suggestionsContainer: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, marginTop: 5, paddingVertical: 5, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  suggestionItem: { paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  suggestionText: { color: '#334155', fontSize: 14, fontWeight: '700' },
  addCertBtn: { backgroundColor: '#009b3a', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  addCertBtnText: { color: '#fff', fontWeight: '900', fontSize: 12, marginLeft: 4 },
  certCard: { backgroundColor: '#fff', borderRadius: 14, padding: 15, borderWidth: 1.5, borderColor: '#e2e8f0', marginBottom: 15, elevation: 1 }
});
