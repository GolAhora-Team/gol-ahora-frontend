 import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';

export default function InscripcionesScreen({ route, navigation }) {
  const { role: currentUserRole } = route.params || { role: "ADMIN" };

  const [actividades, setActividades] = useState([
    { id: '1', nombre: 'Clase F5 - Juveniles', tipo: 'CLASE', cupo: 18, max: 20, profe: 'Carlos Pérez' },
    { id: '2', nombre: 'Liga Apertura 2026', tipo: 'LIGA', cupo: 20, max: 20, profe: 'N/A' },
  ]);

  const handleInscribir = (item) => {
    // CP002: Validación de cupos
    if (item.cupo >= item.max) {
      return Alert.alert("Atención", "No hay cupos disponibles para esta actividad.");
    }
    Alert.alert("Confirmación", `¿Desea inscribir al usuario en ${item.nombre}?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", onPress: () => Alert.alert("Éxito", "Inscripción registrada correctamente.") }
    ]);
  };

  return (
    <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Inscripciones</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {actividades.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.info}>
              <View style={[styles.badge, { backgroundColor: item.cupo >= item.max ? '#ef4444' : '#009b3a' }]}>
                <Text style={styles.badgeText}>{item.tipo}</Text>
              </View>
              <Text style={styles.actividadName}>{item.nombre}</Text>
              <Text style={styles.actividadDetail}>Profesor: {item.profe}</Text>
              <Text style={styles.actividadDetail}>Cupos: {item.cupo} / {item.max}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.btn, item.cupo >= item.max && styles.btnDisabled]}
              onPress={() => handleInscribir(item)}
              disabled={item.cupo >= item.max}
            >
              <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  info: { flex: 1 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 5 },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  actividadName: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  actividadDetail: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '600' },
  btn: { backgroundColor: '#009b3a', padding: 12, borderRadius: 12 },
  btnDisabled: { backgroundColor: '#94a3b8' }
});