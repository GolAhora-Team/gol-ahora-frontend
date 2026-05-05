import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function UserCard({ item, onEdit, onDelete, canModify }) {
<<<<<<< HEAD
  // Siguiendo la misma lógica de estilos de CanchaCard
=======

>>>>>>> develop
  return (
    <View style={styles.card}>
      <View style={styles.infoSide}>
        <Text style={styles.userName}>{item.nombre} {item.apellido}</Text>
        
        <View style={styles.specRow}>
          <Text style={styles.specText}>DNI: {item.dni} • Tel: {item.telefono}</Text>
        </View>
        
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>

      {canModify && (
        <View style={styles.actionSide}>
          <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
            <MaterialCommunityIcons name="pencil" size={24} color="#009b3a" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => onDelete(item)} style={styles.actionBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 15, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    elevation: 3 
  },
  infoSide: { flex: 1 },
  userName: { 
    fontSize: 18, 
    fontWeight: '800', 
<<<<<<< HEAD
    color: '#009b3a' // Lo ponemos en verde como tu captura de pantalla
=======
    color: '#009b3a' 
>>>>>>> develop
  },
  specRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  specText: { 
    color: '#1e293b', 
    fontSize: 13, 
    fontWeight: '700' 
  },
  userEmail: { 
    color: '#94a3b8', 
    fontSize: 12, 
    marginTop: 2,
    fontWeight: '600'
  },
  actionSide: { 
    flexDirection: 'row', 
    gap: 8, 
    alignItems: 'center' 
  },
  actionBtn: { 
    padding: 10, 
    borderRadius: 8 
  }
});