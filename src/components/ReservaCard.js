import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ReservaCard({ item, onEdit, onDelete, onView, canModify }) {
  const [runningTime, setRunningTime] = useState('');

  const isFinalizado = item.estado === 'Finalizado';
  const isEnJuego = item.estado === 'En Juego';
  const isCancelada = item.estado?.toLowerCase() === 'cancelada' || item.estado?.toLowerCase() === 'cancelado';
  const isPendiente = item.estado === 'Pendiente';

  let isMoreThan12HoursAway = false;
  try {
    if (item.fecha && item.horaInicio) {
      const now = new Date();
      const dateStr = item.fecha.includes('T') ? item.fecha.split('T')[0] : item.fecha;
      const [year, month, day] = dateStr.split('-').map(Number);
      const [h, m] = item.horaInicio.split(':').map(Number);
      const startTime = new Date(year, month - 1, day, h, m, 0);
      const diffMs = startTime.getTime() - now.getTime();
      isMoreThan12HoursAway = (diffMs / (1000 * 60 * 60)) > 12;
    }
  } catch (e) {}

  let isPast = false;
  try {
    if (item.fecha && item.horaFin) {
      const now = new Date();
      const dateStr = item.fecha.includes('T') ? item.fecha.split('T')[0] : item.fecha;
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hFin, mFin] = (item.horaFin || '00:00').split(':').map(Number);
      const endTime = new Date(year, month - 1, day, hFin, mFin, 0);
      if (now >= endTime) {
        isPast = true;
      }
    }
  } catch (e) {}

  // Solo se pueden eliminar/modificar si no están finalizadas, en juego o canceladas, y no son actividades virtuales ni partidos de competición
  const isActividad = item.estado === 'Clase' || item.estado === 'Entrenamiento';
  const isPartido = item.esPartido === true;
  const allowModify = canModify && !isFinalizado && !isEnJuego && !isCancelada && !isActividad && !isPartido;

  useEffect(() => {
    let interval;
    if (isEnJuego) {
      const updateTimer = () => {
        const now = new Date();
        
        const [h, m] = (item.horaInicio || '00:00').split(':').map(Number);
        const dateStr = item.fecha ? item.fecha.split('T')[0] : now.toISOString().split('T')[0];
        const [year, month, day] = dateStr.split('-').map(Number);
        
        const startTime = new Date(year, month - 1, day, h, m, 0);
        const diffMs = now.getTime() - startTime.getTime();
        
        if (diffMs < 0) {
           setRunningTime('0 min');
        } else {
           const diffMins = Math.floor(diffMs / 60000);
           setRunningTime(`${diffMins} min`);
        }
      };
      updateTimer();
      interval = setInterval(updateTimer, 60000); // update every minute
    }
    return () => {
      if (interval) clearInterval(interval);
    }
  }, [isEnJuego, item.horaInicio, item.fecha]);

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    } catch { return ''; }
  };

  return (
    <View style={[
      styles.card, 
      isPast && styles.cardFinalizado, 
      isEnJuego && styles.cardEnJuego,
      isCancelada && !isPast && styles.cardCancelada
    ]}>
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, isEnJuego && { color: '#059669' }, isPast && { color: '#94a3b8' }, (isCancelada && !isPast) && { color: '#ef4444' }]}>{item.horaInicio}</Text>
        <View style={[styles.timeDivider, isPast && { backgroundColor: '#cbd5e1' }, (isCancelada && !isPast) && { backgroundColor: '#fca5a5' }]} />
        <Text style={[styles.timeText, isEnJuego && { color: '#059669' }, isPast && { color: '#94a3b8' }, (isCancelada && !isPast) && { color: '#ef4444' }]}>{item.horaFin}</Text>
        {item.fecha && (
          <Text style={styles.dateText}>{formatFecha(item.fecha)}</Text>
        )}
      </View>

      <View style={styles.infoSide}>
        <Text style={[styles.canchaName, isPast && { color: '#64748b' }]}>{item.canchaNombre}</Text>
        {item.esPartido ? (
          <View style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#6366f1' }}>
              {item.tipoCompeticion === 'Liga' ? '🏆 LIGA' : '🏆 TORNEO'}: {item.competicionNombre}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={[styles.escudoSmall, { backgroundColor: item.equipoLocalColorPrimario || '#ccc' }]} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginLeft: 4 }}>{item.equipoLocalNombre}</Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#94a3b8', marginHorizontal: 6 }}>VS</Text>
              <View style={[styles.escudoSmall, { backgroundColor: item.equipoVisitanteColorPrimario || '#ccc' }]} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginLeft: 4 }}>{item.equipoVisitanteNombre}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.clienteName}>
            {item.cliente?.nombre ? `${item.cliente?.nombre} ${item.cliente?.apellido || ''}` : item.clienteNombre} {item.clienteEdad ? `(${item.clienteEdad} años)` : ''}
          </Text>
        )}
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 }}>
          <View style={[
            styles.statusBadge, 
            isEnJuego && { backgroundColor: '#10b981' },
            isPendiente && !isPast && { backgroundColor: '#fef08a' },
            (!isEnJuego && !isPendiente && !isCancelada && !isPast) && { backgroundColor: '#bae6fd' }, // Confirmada (normal)
            isPast && { backgroundColor: '#f1f5f9' },
            isCancelada && !isPast && { backgroundColor: '#fca5a5' }
          ]}>
            <Text style={[
              styles.statusText, 
              isEnJuego && { color: '#fff' },
              isPendiente && !isPast && { color: '#854d0e' },
              (!isEnJuego && !isPendiente && !isCancelada && !isPast) && { color: '#0369a1' },
              isPast && { color: '#64748b' },
              isCancelada && !isPast && { color: '#7f1d1d' }
            ]}>
              {(item.estado || '').toUpperCase()}
            </Text>
          </View>

          {isEnJuego && (
            <View style={styles.timerBadge}>
              <MaterialCommunityIcons name="timer-outline" size={14} color="#059669" />
              <Text style={styles.timerText}>{runningTime}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionSide}>
        {onView && (
          <TouchableOpacity onPress={() => onView(item)} style={[styles.actionBtn, { backgroundColor: '#f0f9ff' }]}>
            <MaterialCommunityIcons name="eye-outline" size={22} color="#3b82f6" />
          </TouchableOpacity>
        )}

        {canModify && isPendiente && isMoreThan12HoursAway && onEdit && (
          <TouchableOpacity onPress={() => onEdit(item)} style={[styles.actionBtn, { backgroundColor: '#fdf4ff' }]}>
            <MaterialCommunityIcons name="pencil-outline" size={22} color="#c026d3" />
          </TouchableOpacity>
        )}

        {allowModify && onDelete && (
          <TouchableOpacity onPress={() => onDelete(item)} style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]}>
            <MaterialCommunityIcons name="cancel" size={22} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  cardFinalizado: { opacity: 0.6, backgroundColor: '#f8fafc', elevation: 1 },
  cardEnJuego: { borderWidth: 2, borderColor: '#10b981', backgroundColor: '#ecfdf5', shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 8 },
  cardCancelada: { borderWidth: 1, borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  cardCanceladaPast: { borderWidth: 1, borderColor: '#ef4444', backgroundColor: '#f8fafc', opacity: 0.6, elevation: 1 },
  timeContainer: { alignItems: 'center', paddingRight: 15, borderRightWidth: 1, borderRightColor: '#f1f5f9', width: 80 },
  timeText: { fontSize: 16, fontWeight: '900', color: '#009b3a' },
  timeDivider: { height: 2, width: 20, backgroundColor: '#ffb300', marginVertical: 4 },
  dateText: { fontSize: 10, fontWeight: '700', color: '#94a3b8', marginTop: 4 },
  infoSide: { flex: 1, paddingLeft: 15 },
  canchaName: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  clienteName: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  statusBadge: { backgroundColor: '#f1f5f9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '900', color: '#475569' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#d1fae5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  timerText: { fontSize: 11, fontWeight: '800', color: '#059669' },
  actionSide: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn: { padding: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  escudoSmall: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }
});
