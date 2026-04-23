import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CustomInput from '../components/CustomInput';

const RegisterScreen = ({ navigation }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Nueva Persona</Text>
      
      <CustomInput label="DNI" iconName="card-account-details" keyboardType="numeric" />
      <CustomInput label="Nombre" iconName="account" />
      <CustomInput label="Apellido" iconName="account" />
      <CustomInput label="Género" iconName="gender-male-female" />
      <CustomInput label="Fecha de Nacimiento" iconName="calendar" placeholder="DD/MM/AAAA" />
      <CustomInput label="Teléfono" iconName="phone" keyboardType="phone-pad" />
      <CustomInput label="Dirección" iconName="map-marker" />
      <CustomInput label="Localidad" iconName="city" />
      <CustomInput label="Provincia" iconName="map" />
      <CustomInput label="Email" iconName="email" keyboardType="email-address" />
      <CustomInput label="Contacto Emergencia" iconName="alert-circle" />

      <TouchableOpacity style={styles.saveButton}>
        <Text style={styles.saveButtonText}>REGISTRAR</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  saveButton: { backgroundColor: '#009b3a', padding: 15, borderRadius: 10, alignItems: 'center', marginVertical: 20 },
  saveButtonText: { color: '#fff', fontWeight: 'bold' }
});

export default RegisterScreen;