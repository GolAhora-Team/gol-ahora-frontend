import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getEstadisticas } from './DataReportes';

const { width: windowWidth } = Dimensions.get('window');
const isWeb = windowWidth > 768;

export default function StatCards() {
  const stats = getEstadisticas();

  // Definimos qué métricas queremos resaltar en el inicio
  const dashboardStats = [
    { label: 'INGRESOS', key: 'Ingresos' },
    { label: 'ASISTENCIA', key: 'Asistencia' },
    { label: 'RESERVAS', key: 'Reservas' },
  ];

  return (
    <View style={styles.container}>
      {dashboardStats.map((item) => {
        const data = stats[item.key];
        return (
          <View key={item.key} style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.iconBox, { backgroundColor: data.color + '20' }]}>
              <MaterialCommunityIcons name={data.icon} size={24} color={data.color} />
            </View>
            <View style={styles.textBox}>
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={styles.statValue}>{data.total}</Text>
              <Text style={styles.statSub}>{data.detalle}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    width: '100%' 
  },
  statCard: { 
    backgroundColor: '#fff', 
    width: '100%', 
    padding: 16, 
    borderRadius: 24, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    elevation: 4
  },
  statCardWeb: { width: '31.5%', marginBottom: 0 },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  textBox: { flex: 1 },
  statLabel: { fontSize: 10, fontWeight: '900', color: '#64748b', letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  statSub: { fontSize: 10, color: '#009b3a', fontWeight: '700' }
});