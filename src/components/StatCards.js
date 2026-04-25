import React from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: windowWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' && windowWidth > 768;

const StatCard = ({ title, value, label, icon, color, trend }) => (
  <View style={[styles.card, isWeb && styles.cardWeb]}>
    <View style={styles.cardHeader}>
      <Text style={styles.title} selectable={false}>{title}</Text>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.value} selectable={false}>{value}</Text>
    <Text style={styles.trend} selectable={false}>
      <Text style={{ color: '#22c55e' }}>↑ </Text>
      {trend}
    </Text>
  </View>
);

const StatCards = () => {
  const stats = [
    { title: "Reservas Hoy", value: "12", label: "Hoy", icon: "calendar-check", color: "#a855f7", trend: "3 más que ayer" },
    { title: "Ingresos Mes", value: "$45,680", label: "Mes", icon: "currency-usd", color: "#22c55e", trend: "12% vs mes anterior" },
    { title: "Usuarios Activos", value: "156", label: "Activos", icon: "account-group", color: "#3b82f6", trend: "8 nuevos esta semana" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal={!isWeb} 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {stats.map((item, index) => (
          <StatCard key={index} {...item} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 10, marginBottom: 20 },
  scrollContent: {
    flexDirection: 'row',
    paddingHorizontal: isWeb ? 0 : 5,
    justifyContent: isWeb ? 'space-between' : 'flex-start',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: isWeb ? '31%' : windowWidth * 0.7,
    marginRight: isWeb ? 0 : 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    ...Platform.select({ web: { userSelect: 'none' } })
  },
  value: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    marginVertical: 4,
    ...Platform.select({ web: { userSelect: 'none' } })
  },
  trend: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    ...Platform.select({ web: { userSelect: 'none' } })
  }
});

export default StatCards;