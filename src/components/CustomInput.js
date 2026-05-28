import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CustomInput = ({ label, iconName, ...props }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name={iconName} size={20} color="#666" style={styles.icon} />
        <TextInput style={styles.input} {...props} />
      </View>
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
  icon: { marginRight: 10 },
  input: { flex: 1, height: 45, outlineStyle: 'none' },
});

export default CustomInput;