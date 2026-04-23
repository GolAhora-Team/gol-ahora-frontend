import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import CustomInput from '../components/CustomInput';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const handleReset = () => {
    Alert.alert("Éxito", "Se ha enviado un link a tu correo", [
      { text: "OK", onPress: () => navigation.navigate('Login') }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.info}>Ingresá tu email para recibir el link de recuperación</Text>
      <CustomInput 
        label="Email" 
        iconName="email" 
        value={email}
        onChangeText={setEmail}
      />
      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>ENVIAR LINK</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center' },
  info: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: '#009b3a', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});

export default ForgotPasswordScreen;