import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import GenerarImpresion from '../components/GenerarImpresion';
import { facturaService } from '../services/facturaService';
import { pagoService } from '../services/pagoService';

export default function FacturacionScreen({ route, navigation }) {
  const { role: currentUserRole } = route.params || { role: "ADMIN" };
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPagos();
  }, []);

  const loadPagos = async () => {
    try {
      setLoading(true);
      let items = [];

      try {
        const facturas = await facturaService.getAll();
        items = [...items, ...(facturas || []).map(f => ({
          ...f, id: f.id?.toString(),
        }))];
      } catch (e) { /* facturas endpoint puede fallar */ }

      try {
        const pagosData = await pagoService.getAll();
        items = [...items, ...(pagosData || []).map(p => ({
          ...p, id: p.id?.toString(),
        }))];
      } catch (e) { /* pagos endpoint puede fallar */ }

      setPagos(items);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos de facturación.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#009b3a" />
          <Text style={{ color: '#fff', marginTop: 10, fontWeight: '600' }}>Cargando facturación...</Text>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
      <Text style={styles.title}>Facturación y Cobros</Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {pagos.map(pago => (
          <View key={pago.id} style={styles.pagoCard}>
            <View style={styles.pagoInfo}>
              <Text style={styles.pagoConcepto}>{pago.concepto}</Text>
              <Text style={styles.pagoMeta}>{pago.fecha} • {pago.metodo}</Text>
              <Text style={[styles.pagoEstado, { color: pago.estado === 'PAGADO' ? '#009b3a' : '#ffb300' }]}>
                {pago.estado}
              </Text>
            </View>
            
            <View style={styles.pagoAction}>
              <Text style={styles.pagoMonto}>${pago.monto}</Text>
              
              {/* ✅ Llamamos a la función de impresión pasando el objeto del pago */}
              <TouchableOpacity 
                style={styles.printButton}
                onPress={() => GenerarImpresion(pago)}
              >
                <MaterialCommunityIcons name="printer-pos-outline" size={26} color="#009b3a" />
                <Text style={styles.printLabel}>RECIBO</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 20 },
  pagoCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 18, 
    marginBottom: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    elevation: 3 
  },
  pagoInfo: { flex: 1 },
  pagoConcepto: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  pagoMeta: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '600' },
  pagoEstado: { fontSize: 11, fontWeight: '900', marginTop: 4 },
  pagoAction: { alignItems: 'flex-end', justifyContent: 'space-between' },
  pagoMonto: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  printButton: { 
    alignItems: 'center', 
    marginTop: 10,
    padding: 5
  },
  printLabel: { 
    fontSize: 9, 
    fontWeight: '900', 
    color: '#009b3a', 
    marginTop: 2 
  }
});