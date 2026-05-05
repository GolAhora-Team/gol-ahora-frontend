import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import GenerarImpresion from '../components/GenerarImpresion';

export default function FacturacionScreen({ route, navigation }) {
  const { role: currentUserRole } = route.params || { role: "ADMIN" };
  const pagos = [
    { id: '101', usuario: 'Julián Antunes', concepto: 'Reserva Cancha 1', monto: 5000, metodo: 'QR', estado: 'PAGADO', fecha: '04/05/2026' },
    { id: '102', usuario: 'Nadia Espindola', concepto: 'Cuota Mensual Profe', monto: 8500, metodo: 'Tarjeta', estado: 'PENDIENTE', fecha: '03/05/2026' },
  ];

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