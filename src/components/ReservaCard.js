import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ReservaCard({ item, onEdit, onDelete, onView, canModify }) {
  const [runningTime, setRunningTime] = useState('');

  const isFinalizado = item.estado === 'Finalizado';
  const isEnJuego = item.estado === 'En Juego';
  const isCancelada = item.estado?.toLowerCase() === 'cancelada' || item.estado?.toLowerCase() === 'cancelado';
  const isPendiente = item.estado === 'Pendiente';

  // Solo se pueden modificar si no están finalizadas, en juego o canceladas
  const allowModify = canModify && !isFinalizado && !isEnJuego && !isCancelada;

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
           setRunningTime('00:00');
        } else {
           const totalSecs = Math.floor(diffMs / 1000);
           const cappedSecs = Math.min(totalSecs, 3600); // Cap at 60:00
           const mins = Math.floor(cappedSecs / 60);
           const secs = cappedSecs % 60;
           setRunningTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000); // update every second for mm:ss
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
      isFinalizado && styles.cardFinalizado, 
      isEnJuego && styles.cardEnJuego,
      isCancelada && styles.cardCancelada
    ]}>
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, isEnJuego && { color: '#059669' }, isFinalizado && { color: '#94a3b8' }, isCancelada && { color: '#ef4444' }]}>{item.horaInicio}</Text>
        <View style={[styles.timeDivider, isFinalizado && { backgroundColor: '#cbd5e1' }, isCancelada && { backgroundColor: '#fca5a5' }]} />
        <Text style={[styles.timeText, isEnJuego && { color: '#059669' }, isFinalizado && { color: '#94a3b8' }, isCancelada && { color: '#ef4444' }]}>{item.horaFin}</Text>
        {item.fecha && (
          <Text style={styles.dateText}>{formatFecha(item.fecha)}</Text>
        )}
      </View>

      <View style={styles.infoSide}>
        <Text style={[styles.canchaName, isFinalizado && { color: '#64748b' }]}>{item.canchaNombre}</Text>
        <Text style={styles.clienteName}>
          {item.clienteNombre} {item.clienteEdad ? `(${item.clienteEdad} años)` : ''}
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 }}>
          <View style={[
            styles.statusBadge, 
            isEnJuego && { backgroundColor: '#10b981' },
            isPendiente && { backgroundColor: '#fef08a' },
            isFinalizado && { backgroundColor: '#bae6fd' },
            isCancelada && { backgroundColor: '#fca5a5' }
          ]}>
            <Text style={[
              styles.statusText, 
              isEnJuego && { color: '#fff' },
              isPendiente && { color: '#854d0e' },
              isFinalizado && { color: '#0369a1' },
              isCancelada && { color: '#7f1d1d' }
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

        {allowModify && onEdit && (
          <TouchableOpacity onPress={() => onEdit(item)} style={[styles.actionBtn, { backgroundColor: '#fdf4ff' }]}>
            <MaterialCommunityIcons name="pencil-outline" size={22} color="#c026d3" />
          </TouchableOpacity>
        )}

        {allowModify && onDelete && (
          <TouchableOpacity onPress={() => onDelete(item)} style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]}>
            <MaterialCommunityIcons name="trash-can-outline" size={22} color="#ef4444" />
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
  actionBtn: { padding: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }
});