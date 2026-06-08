import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DatePickerModal from './DatePickerModal';
import { competicionService } from '../services/competicionService';
import { canchaService } from '../services/canchaService';
import { profesorService } from '../services/profesorService';

const formatDateDisplay = (isoOrLocal) => {
  if (!isoOrLocal) return '';
  // Already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoOrLocal)) return isoOrLocal;
  // ISO format YYYY-MM-DD or full ISO
  const d = new Date(isoOrLocal);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseDateToISO = (ddmmyyyy) => {
  if (!ddmmyyyy) return null;
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return null;
  return `${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`;
};

export default function EditCompetenciaModal({ visible, onClose, competencia, onSaved }) {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'TORNEO',
    fechaInicio: '',
    fechaFin: '',
    horario: '',
    maxEquipos: '8',
    tipoCancha: 5,
    profesorId: null,
    canchaId: null,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Date picker state
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [activeDateField, setActiveDateField] = useState('');

  // Data for dropdowns
  const [canchas, setCanchas] = useState([]);
  const [profesores, setProfesores] = useState([]);

  useEffect(() => {
    if (visible && competencia) {
      setForm({
        nombre: competencia.nombre || '',
        descripcion: competencia.descripcion || '',
        tipo: competencia.tipo || 'TORNEO',
        fechaInicio: competencia.fechaInicio ? formatDateDisplay(competencia.fechaInicio) : '',
        fechaFin: competencia.fechaFin ? formatDateDisplay(competencia.fechaFin) : '',
        horario: competencia.horario || '',
        maxEquipos: competencia.maxEquipos?.toString() || '8',
        tipoCancha: competencia.tipoCancha || 5,
        profesorId: competencia.profesorId || null,
        canchaId: competencia.canchaId || null,
      });
      loadDropdownData();
    }
  }, [visible, competencia]);

  const loadDropdownData = async () => {
    setLoading(true);
    try {
      const [canchasData, profesoresData] = await Promise.all([
        canchaService.getAll().catch(() => []),
        profesorService.getAll().catch(() => []),
      ]);
      setCanchas(canchasData || []);
      setProfesores(profesoresData || []);
    } catch (e) {
      console.warn('Error cargando datos de selección', e);
    } finally {
      setLoading(false);
    }
  };

  const openDatePicker = (field) => {
    setActiveDateField(field);
    setDatePickerVisible(true);
  };

  const handleDateSelect = (dateStr) => {
    // dateStr = YYYY-MM-DD → convert to DD/MM/YYYY
    const [y, m, d] = dateStr.split('-');
    setForm(prev => ({ ...prev, [activeDateField]: `${d}/${m}/${y}` }));
  };

  const getInitialDate = (field) => {
    const val = form[field];
    if (val && val.length === 10) {
      const [d, m, y] = val.split('/');
      return `${y}-${m}-${d}`;
    }
    return '';
  };

  const getMinDate = () => {
    if (activeDateField === 'fechaFin' && form.fechaInicio) {
      const [d, m, y] = form.fechaInicio.split('/');
      if (d && m && y) return `${y}-${m}-${d}`;
    }
    return '';
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      Alert.alert('Atención', 'El nombre es obligatorio.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        Nombre: form.nombre.trim(),
        Descripcion: form.descripcion || '',
        Tipo: form.tipo === 'LIGA' ? 1 : 2,
        CantidadEquipos: parseInt(form.maxEquipos, 10) || 8,
        TipoCancha: form.tipoCancha,
        FechaInicio: parseDateToISO(form.fechaInicio),
        FechaFin: parseDateToISO(form.fechaFin),
        Horario: form.horario || null,
        ProfesorId: form.profesorId || null,
        CanchaId: form.canchaId || null,
      };

      await competicionService.update(competencia.id, payload);
      Alert.alert('¡Éxito!', 'La competición fue actualizada correctamente.');
      onSaved && onSaved();
      onClose();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e?.message || 'No se pudo actualizar la competición.');
    } finally {
      setSaving(false);
    }
  };

  const cupoOptions = form.tipo === 'LIGA' ? ['8', '10', '16', '20'] : ['4', '8', '16'];

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Editar Competición</Text>
              <Text style={styles.headerSub}>{competencia?.nombre}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close-circle" size={32} color="#009b3a" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#009b3a" style={{ marginVertical: 40 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={true} style={{ maxHeight: 500 }}>

              {/* Nombre */}
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={form.nombre}
                onChangeText={t => setForm(p => ({ ...p, nombre: t }))}
                placeholder="Nombre de la competición"
                placeholderTextColor="#94a3b8"
              />

              {/* Descripción */}
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                value={form.descripcion}
                onChangeText={t => setForm(p => ({ ...p, descripcion: t }))}
                placeholder="Descripción opcional"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
              />

              {/* Fecha Inicio */}
              <Text style={styles.label}>Fecha de Inicio</Text>
              <TouchableOpacity
                style={styles.dateRow}
                onPress={() => openDatePicker('fechaInicio')}
                activeOpacity={0.7}
              >
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  value={form.fechaInicio}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#94a3b8"
                  editable={false}
                  pointerEvents="none"
                />
                <View style={styles.calIcon}>
                  <MaterialCommunityIcons name="calendar-range" size={22} color="#009b3a" />
                </View>
              </TouchableOpacity>

              {/* Fecha Fin */}
              <Text style={styles.label}>Fecha de Finalización</Text>
              <TouchableOpacity
                style={[styles.dateRow, !form.fechaInicio && { opacity: 0.5 }]}
                onPress={() => {
                  if (!form.fechaInicio) {
                    Alert.alert('Atención', 'Seleccioná primero la fecha de inicio.');
                    return;
                  }
                  openDatePicker('fechaFin');
                }}
                activeOpacity={0.7}
              >
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  value={form.fechaFin}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#94a3b8"
                  editable={false}
                  pointerEvents="none"
                />
                <View style={styles.calIcon}>
                  <MaterialCommunityIcons name="calendar-range" size={22} color="#009b3a" />
                </View>
              </TouchableOpacity>

              {/* Horario */}
              <Text style={styles.label}>Horario</Text>
              <TextInput
                style={styles.input}
                value={form.horario}
                onChangeText={t => setForm(p => ({ ...p, horario: t }))}
                placeholder="Ej: Lunes y Miércoles 20:00-22:00"
                placeholderTextColor="#94a3b8"
              />

              {/* Tipo de Cancha */}
              <Text style={styles.label}>Tipo de Cancha</Text>
              <View style={styles.chipRow}>
                {[5, 7, 11].map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.chip, form.tipoCancha === n && styles.chipActive]}
                    onPress={() => setForm(p => ({ ...p, tipoCancha: n }))}
                  >
                    <Text style={[styles.chipText, form.tipoCancha === n && styles.chipTextActive]}>
                      F{n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Cupo máximo */}
              <Text style={styles.label}>Cupo máximo (equipos)</Text>
              <View style={styles.chipRow}>
                {cupoOptions.map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.chip, form.maxEquipos === n && styles.chipActive]}
                    onPress={() => setForm(p => ({ ...p, maxEquipos: n }))}
                  >
                    <Text style={[styles.chipText, form.maxEquipos === n && styles.chipTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Profesor */}
              {profesores.length > 0 && (
                <>
                  <Text style={styles.label}>Profesor / Organizador</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 8 }}
                  >
                    <TouchableOpacity
                      style={[styles.chip, form.profesorId === null && styles.chipActive]}
                      onPress={() => setForm(p => ({ ...p, profesorId: null }))}
                    >
                      <Text style={[styles.chipText, form.profesorId === null && styles.chipTextActive]}>
                        Sin asignar
                      </Text>
                    </TouchableOpacity>
                    {profesores.map(pr => (
                      <TouchableOpacity
                        key={pr.id}
                        style={[styles.chip, { marginLeft: 8 }, form.profesorId === pr.id && styles.chipActive]}
                        onPress={() => setForm(p => ({ ...p, profesorId: pr.id }))}
                      >
                        <Text style={[styles.chipText, form.profesorId === pr.id && styles.chipTextActive]}>
                          {pr.nombre} {pr.apellido || ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Cancha */}
              {canchas.length > 0 && (
                <>
                  <Text style={styles.label}>Cancha</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 8 }}
                  >
                    <TouchableOpacity
                      style={[styles.chip, form.canchaId === null && styles.chipActive]}
                      onPress={() => setForm(p => ({ ...p, canchaId: null }))}
                    >
                      <Text style={[styles.chipText, form.canchaId === null && styles.chipTextActive]}>
                        Sin asignar
                      </Text>
                    </TouchableOpacity>
                    {canchas.map(c => (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.chip, { marginLeft: 8 }, form.canchaId === c.id && styles.chipActive]}
                        onPress={() => setForm(p => ({ ...p, canchaId: c.id }))}
                      >
                        <Text style={[styles.chipText, form.canchaId === c.id && styles.chipTextActive]}>
                          {c.nombre || `Cancha ${c.id}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>
          )}

          {/* Footer buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelText}>CANCELAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save" size={18} color="#fff" />
                  <Text style={styles.saveText}>GUARDAR</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={handleDateSelect}
        initialDate={getInitialDate(activeDateField)}
        minDate={getMinDate()}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  headerSub: { fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 2 },
  label: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#f1f5f9',
    color: '#1e293b',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 14,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  calIcon: {
    padding: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#009b3a',
    borderColor: '#009b3a',
  },
  chipText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  chipTextActive: { color: '#fff' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelText: { color: '#64748b', fontWeight: '800', fontSize: 13 },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#009b3a',
  },
  saveText: { color: '#fff', fontWeight: '900', fontSize: 13 },
});
