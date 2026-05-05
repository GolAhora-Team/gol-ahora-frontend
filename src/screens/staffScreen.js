import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import ScreenTemplate from './ScreenTemplate';
import AsistenciaModal from '../components/AsistenciaModal';

export default function StaffScreen({ route, navigation }) {
  const { role: currentUserRole, userName = "NombreProfe ApellidoProfe" } = route.params || { role: "PROFE" };

 
  const [todasLasClases] = useState([
    { id: '1', nombre: 'F5 - Juveniles A', profe: 'NombreProfe ApellidoProfe', horario: '18:00hs', alumnos: 15 },
    { id: '2', nombre: 'F11 - Entrenamiento Senior', profe: 'NombreProfe ApellidoProfe', horario: '20:00hs', alumnos: 22 },
    { id: '3', nombre: 'F7 - Escuelita Mixta', profe: 'Marcos Gimenez', horario: '17:00hs', alumnos: 10 },
    { id: '4', nombre: 'Entrenamiento Arqueros', profe: 'Juan Gomez', horario: '19:00hs', alumnos: 5 },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [claseSeleccionada, setClaseSeleccionada] = useState("");
  const clasesVisibles = (currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL')
    ? todasLasClases 
    : todasLasClases.filter(clase => clase.profe === userName);

  const abrirAsistencia = (nombre) => {
    setClaseSeleccionada(nombre);
    setModalVisible(true);
  };

  return (
    <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {currentUserRole === 'PROFE' ? 'Mis Clases' : 'Gestión de Cuerpo Técnico'}
        </Text>
        <Text style={styles.subTitle}>
          {currentUserRole === 'PROFE' ? `Profesor: ${userName}` : 'Panel Administrativo'}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {clasesVisibles.map(clase => (
          <View key={clase.id} style={styles.claseCard}>
            <View style={styles.cardInfo}>
              <Text style={styles.claseTitle}>{clase.nombre}</Text>
              <Text style={styles.claseDetail}>
                <Text style={{ fontWeight: '900' }}>Horario:</Text> {clase.horario}
              </Text>
              {(currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL') && (
                <Text style={styles.claseDetail}>
                  <Text style={{ fontWeight: '900' }}>Profesor:</Text> {clase.profe}
                </Text>
              )}
            </View>
            
            <View style={styles.badgeContainer}>
              <View style={styles.alumnosBadge}>
                <Text style={styles.badgeText}>{clase.alumnos} Alumnos</Text>
              </View>
              <TouchableOpacity 
                style={styles.asistenciaBtn} 
                onPress={() => abrirAsistencia(clase.nombre)}
              >
                <Text style={styles.btnText}>ASISTENCIA</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {clasesVisibles.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay clases programadas para mostrar.[cite: 1]</Text>
          </View>
        )}
      </ScrollView>

      <AsistenciaModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        claseNombre={claseSeleccionada} 
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },
  subTitle: { fontSize: 13, color: '#ffb300', fontWeight: '700', marginTop: 2 },
  claseCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 18, 
    marginBottom: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  cardInfo: { flex: 1 },
  claseTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b', marginBottom: 5 },
  claseDetail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  badgeContainer: { alignItems: 'flex-end' },
  alumnosBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#009b3a' },
  asistenciaBtn: { backgroundColor: '#009b3a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  btnText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  emptyContainer: { marginTop: 50, alignItems: 'center' },
  emptyText: { color: '#fff', fontSize: 14, fontStyle: 'italic', opacity: 0.8 }
});