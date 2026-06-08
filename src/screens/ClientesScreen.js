import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { clienteService } from '../services/clienteService';

const ClientesScreen = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await clienteService.getAll();
      setClientes(data);
      
    } catch (err) {
      setError('No se pudieron cargar los clientes. Intente nuevamente.');
      Alert.alert('Error', err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.nombre} {item.apellido}</Text>
        
        {(item.aptoFisico || item.esSocioActivo) && (
          <View style={styles.badgesRow}>
            {item.aptoFisico && (
              <View style={[styles.badge, styles.badgeApto]}>
                <Text style={styles.badgeTextApto}>Apto Físico</Text>
              </View>
            )}
            {item.esSocioActivo && (
              <View style={[styles.badge, styles.badgeSocio]}>
                <Text style={styles.badgeTextSocio}>Socio Activo</Text>
              </View>
            )}
          </View>
        )}
      </View>
      <View style={styles.divider} />
      <Text style={styles.detail}><Text style={styles.label}>DNI: </Text>{item.dni}</Text>
      <Text style={styles.detail}><Text style={styles.label}>Email: </Text>{item.email}</Text>
      <Text style={styles.detail}><Text style={styles.label}>Tel: </Text>{item.telefono}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Cargando clientes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadClientes}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lista de Clientes</Text>
      </View>
      
      <FlatList
        data={clientes}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay clientes registrados.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F8',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'column',
    gap: 4,
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeApto: {
    backgroundColor: '#DEF7EC',
  },
  badgeTextApto: {
    color: '#03543F',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeSocio: {
    backgroundColor: '#fef3c7',
  },
  badgeTextSocio: {
    color: '#d97706',
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  detail: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 6,
  },
  label: {
    fontWeight: '600',
    color: '#334155',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 50,
    fontStyle: 'italic',
  },
});

export default ClientesScreen;
