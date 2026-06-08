import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getEstadisticas } from './DataReportes';
import { pagoService } from '../services/pagoService';
import { reservaService } from '../services/reservaService';
import { claseService } from '../services/claseService';
import { asistenciaService } from '../services/asistenciaService';

const { width: windowWidth } = Dimensions.get('window');
const isWeb = windowWidth > 768;

export default function StatCards() {
  const stats = getEstadisticas();
  const [loading, setLoading] = useState(true);
  const [ingresosTotal, setIngresosTotal] = useState("$0");
  const [reservasTotal, setReservasTotal] = useState("0");
  const [asistenciaValue, setAsistenciaValue] = useState("—");
  const [asistenciaSub, setAsistenciaSub] = useState("Cargando...");

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const [pagos, reservas] = await Promise.all([
          pagoService.getAll(),
          reservaService.getAll()
        ]);
        
        if (pagos) {
          const ingresosValidos = pagos.filter(p => p.estado === 2 || p.estado === 'Pagado' || p.estado === 'Aprobado' || p.estado === 'Completado');
          const totalPagos = ingresosValidos.reduce((sum, p) => sum + (p.monto || 0), 0);
          setIngresosTotal(`$${totalPagos.toLocaleString()}`);
        }
        if (reservas) {
          setReservasTotal(reservas.length.toString());
        }

        // Cargar asistencia real de hoy
        try {
          const clases = await claseService.getAll();
          const hoy = new Date().toISOString().split('T')[0];
          let totalPresentes = 0;
          let totalAlumnos = 0;

          if (clases && clases.length > 0) {
            const promesas = clases.map(clase =>
              asistenciaService.getAsistenciasPorActividadYFecha(clase.id, hoy, true)
                .then(registros => ({ claseId: clase.id, registros: registros || [], alumnos: (clase.alumnos || clase.clientes || []).length }))
                .catch(() => ({ claseId: clase.id, registros: [], alumnos: (clase.alumnos || clase.clientes || []).length }))
            );
            const resultados = await Promise.all(promesas);
            resultados.forEach(r => {
              totalAlumnos += r.alumnos;
              totalPresentes += r.registros.filter(reg => reg.presente === true).length;
            });
          }

          if (totalAlumnos > 0) {
            const pct = Math.round((totalPresentes / totalAlumnos) * 100);
            setAsistenciaValue(`${totalPresentes} de ${totalAlumnos}`);
            setAsistenciaSub(`${pct}% presentes hoy`);
          } else {
            setAsistenciaValue("0");
            setAsistenciaSub("Sin clases hoy");
          }
        } catch (e) {
          console.warn('Error cargando asistencia en dashboard:', e);
          setAsistenciaValue("—");
          setAsistenciaSub("No disponible");
        }

      } catch (error) {
        console.error("Error al cargar estadísticas en Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRealData();
  }, []);

  // Definimos qué métricas queremos resaltar en el inicio
  const dashboardStats = [
    { label: 'INGRESOS', key: 'Ingresos', customValue: ingresosTotal, customSub: 'Recaudación Real Activa' },
    { label: 'ASISTENCIA', key: 'Asistencia', customValue: asistenciaValue, customSub: asistenciaSub },
    { label: 'RESERVAS', key: 'Reservas', customValue: reservasTotal, customSub: 'Total Reservas' },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', padding: 20 }]}>
        <ActivityIndicator size="large" color="#009b3a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {dashboardStats.map((item) => {
        const data = stats[item.key];
        const val = item.customValue !== undefined ? item.customValue : data.total;
        const sub = item.customSub !== undefined ? item.customSub : data.detalle;
        return (
          <View key={item.key} style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.iconBox, { backgroundColor: data.color + '20' }]}>
              <MaterialCommunityIcons name={data.icon} size={24} color={data.color} />
            </View>
            <View style={styles.textBox}>
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={styles.statValue}>{val}</Text>
              <Text style={styles.statSub}>{sub}</Text>
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
