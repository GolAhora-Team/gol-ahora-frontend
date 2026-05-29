import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, TextInput, Switch, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomInput from './CustomInput';

export default function UserFormModal({ visible, onClose, isEditing, formData, setFormData, onSave, currentUserRole, rolesIcons, errorMessage }) {
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

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 1. IDENTIDAD */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>1. IDENTIDAD</Text>
              <CustomInput label="DNI" value={formData.dni} onChangeText={v => setFormData({...formData, dni: v})} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText}/>
              <View style={styles.row}>
                <View style={{flex: 1}}><CustomInput label="NOMBRE" value={formData.nombre} onChangeText={v => setFormData({...formData, nombre: v})} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText}/></View>
                <View style={{flex: 1, marginLeft: 10}}><CustomInput label="APELLIDO" value={formData.apellido} onChangeText={v => setFormData({...formData, apellido: v})} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText}/></View>
              </View>

              <View style={styles.dateFullRow}>
                <Text style={styles.greenLabelBold}>FECHA DE NACIMIENTO</Text>
                <View style={styles.dateInputGroup}>
                  <TextInput style={styles.datePartInput} placeholder="DD" maxLength={2} value={formData.dia} onChangeText={(v) => setFormData({...formData, dia: v})} keyboardType="numeric"/>
                  <Text style={styles.dateSeparator}>/</Text>
                  <TextInput style={styles.datePartInput} placeholder="MM" maxLength={2} value={formData.mes} onChangeText={(v) => setFormData({...formData, mes: v})} keyboardType="numeric"/>
                  <Text style={styles.dateSeparator}>/</Text>
                  <TextInput style={[styles.datePartInput, {width: 50}]} placeholder="AAAA" maxLength={4} value={formData.anio} onChangeText={(v) => setFormData({...formData, anio: v})} keyboardType="numeric"/>
                </View>
              </View>

              <Text style={styles.greenLabelBold}>GÉNERO</Text>
              <View style={styles.genderRow}>
                {['Masculino', 'Femenino'].map(g => (
                  <TouchableOpacity key={g} onPress={() => setFormData({...formData, genero: g})} style={[styles.genderBtn, formData.genero === g && styles.activeGreenBtn]}>
                    <Text style={[styles.btnText, formData.genero === g ? styles.whiteText : styles.greenText]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. ROL */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>2. ROL DEL SISTEMA {isEditing ? "(No editable)" : ""}</Text>
              <View style={styles.grid}>
                {Object.keys(rolesIcons).map(r => {
                  if (currentUserRole === 'PERSONAL' && (r === 'ADMIN' || r === 'PERSONAL')) return null;
                  return (
                    <TouchableOpacity 
                      key={r} 
                      style={[
                        styles.roleBtn, 
                        formData.role === r && styles.activeGreenBtn,
                        isEditing && formData.role !== r && { opacity: 0.4 }
                      ]} 
                      onPress={() => setFormData({...formData, role: r})}
                      disabled={isEditing}
                    >
                      <MaterialCommunityIcons name={rolesIcons[r]} size={20} color={formData.role === r ? '#fff' : (isEditing ? '#94a3b8' : '#009b3a')} />
                      <Text style={[styles.btnText, formData.role === r ? styles.whiteText : (isEditing ? {color: '#94a3b8'} : styles.greenText)]}>{r}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. CAMPOS DINÁMICOS */}
            {formData.role === 'CLIENTE' && (
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>DATOS ESPECÍFICOS CLIENTE</Text>
                <CustomInput label="OBRA SOCIAL" value={formData.obraSocial} onChangeText={v => setFormData({...formData, obraSocial: v})} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText}/>
                <View style={styles.statusContainer}>
                  <TouchableOpacity style={[styles.bigStatusBtn, formData.esSocioActivo ? styles.statusBtnOn : styles.statusBtnOff]} onPress={() => setFormData({...formData, esSocioActivo: !formData.esSocioActivo})}>
                    <View style={[styles.iconCircle, { backgroundColor: formData.esSocioActivo ? '#fff' : '#e2e8f0' }]}><MaterialCommunityIcons name={formData.esSocioActivo ? "check-bold" : "close"} size={18} color={formData.esSocioActivo ? "#009b3a" : "#94a3b8"} /></View>
                    <Text style={[styles.statusText, formData.esSocioActivo ? styles.textWhite : styles.textGreen]}>SOCIO ACTIVO</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.bigStatusBtn, formData.aptoFisico ? styles.statusBtnOn : styles.statusBtnOff]} onPress={() => setFormData({...formData, aptoFisico: !formData.aptoFisico})}>
                    <View style={[styles.iconCircle, { backgroundColor: formData.aptoFisico ? '#fff' : '#e2e8f0' }]}><MaterialCommunityIcons name={formData.aptoFisico ? "heart-flash" : "heart-outline"} size={18} color={formData.aptoFisico ? "#009b3a" : "#94a3b8"} /></View>
                    <Text style={[styles.statusText, formData.aptoFisico ? styles.textWhite : styles.textGreen]}>APTO FÍSICO</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {formData.role === 'PROFE' && (
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>DATOS ESPECÍFICOS PROFESOR</Text>
                <CustomInput label="ESPECIALIZACIÓN" placeholder="Ej: Fútbol, Padel" value={formData.especializacion} onChangeText={v => setFormData({...formData, especializacion: v})} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText}/>
              </View>
            )}

            {/* 4. CONTACTO */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>3. CONTACTO Y LOCALIZACIÓN</Text>
              <CustomInput label="EMAIL" value={formData.email} onChangeText={v => setFormData({...formData, email: v})} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText}/>
              <View style={styles.row}>
                <View style={{flex: 1.2}}><CustomInput label="TELÉFONO" value={formData.telefono} onChangeText={v => setFormData({...formData, telefono: v})} keyboardType="phone-pad" containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText}/></View>
                <View style={{flex: 1, marginLeft: 10}}><CustomInput label="C.P." value={formData.codigoPostal} onChangeText={v => setFormData({...formData, codigoPostal: v})} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText}/></View>
              </View>
              <CustomInput label="DIRECCIÓN" value={formData.direccion} onChangeText={v => setFormData({...formData, direccion: v})} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText}/>
              <View style={styles.row}>
                <View style={{flex: 1}}><CustomInput label="LOCALIDAD" value={formData.localidad} onChangeText={v => setFormData({...formData, localidad: v})} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText}/></View>
                <View style={{flex: 1, marginLeft: 10}}><CustomInput label="PROVINCIA" value={formData.provincia} onChangeText={v => setFormData({...formData, provincia: v})} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText}/></View>
              </View>
              <CustomInput label="PAÍS" value={formData.pais} onChangeText={v => setFormData({...formData, pais: v})} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText}/>
              <CustomInput label="CONTACTO EMERG." value={formData.contactoEmergencia} onChangeText={v => setFormData({...formData, contactoEmergencia: v})} containerStyle={styles.cleanInput} labelStyle={styles.greenLabelBold} inputStyle={styles.greenInputText}/>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
              <Text style={styles.saveBtnText}>{isEditing ? 'ACTUALIZAR CAMBIOS' : 'CREAR USUARIO'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
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
  dateInputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, height: 50, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 15 },
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
  saveBtn: { backgroundColor: '#009b3a', padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 15 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 17 }
});