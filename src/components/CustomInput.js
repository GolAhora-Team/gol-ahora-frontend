import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CustomInput = ({ label, iconName, error, success, isPassword, ...props }) => {
  const [isSecure, setIsSecure] = useState(isPassword);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, error && styles.inputError, success && !error && styles.inputSuccess]}>
        <MaterialCommunityIcons name={iconName} size={20} color={error ? "#ef4444" : success ? "#009b3a" : "#666"} style={styles.icon} />
        <TextInput 
          style={styles.input} 
          secureTextEntry={isSecure}
          {...props} 
        />
        {isPassword ? (
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)} style={styles.eyeIcon}>
            <MaterialCommunityIcons name={isSecure ? "eye-off" : "eye"} size={20} color="#666" />
          </TouchableOpacity>
        ) : (
          success && !error && (
            <MaterialCommunityIcons name="check-circle" size={20} color="#009b3a" style={{ padding: 5 }} />
          )
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 15, width: '100%' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  inputSuccess: {
    borderColor: '#009b3a',
    backgroundColor: '#f0fdf4',
  },
  icon: { marginRight: 10 },
  input: { flex: 1, height: 45, outlineStyle: 'none' },
  eyeIcon: { padding: 5 },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4, fontWeight: 'bold' }
});

export default CustomInput;
