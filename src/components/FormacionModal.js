import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { jugadorService } from '../services/jugadorService';
import { clienteService } from '../services/clienteService';
import { equipoService } from '../services/equipoService';

// ── Configuración de canchas y formaciones ──────────────────────────────────
const TIPOS_CANCHA = [
  {
    key: 'F5', label: 'Fútbol 5', icon: 'soccer-field',
    titulares: 5, suplentes: 2, color: '#10b981',
    formaciones: [
      { id: '2-1-1', label: '2-1-1', def: 2, med: 1, del: 1 },
      { id: '1-2-1', label: '1-2-1', def: 1, med: 2, del: 1 },
      { id: '1-1-2', label: '1-1-2', def: 1, med: 1, del: 2 },
    ]
  },
  {
    key: 'F7', label: 'Fútbol 7', icon: 'soccer-field',
    titulares: 7, suplentes: 3, color: '#3b82f6',
    formaciones: [
      { id: '2-2-2', label: '2-2-2', def: 2, med: 2, del: 2 },
      { id: '4-1-1', label: '4-1-1', def: 4, med: 1, del: 1 },
      { id: '3-1-2', label: '3-1-2', def: 3, med: 1, del: 2 },
      { id: '3-2-1', label: '3-2-1', def: 3, med: 2, del: 1 },
    ]
  },
  {
    key: 'F11', label: 'Fútbol 11', icon: 'soccer-field',
    titulares: 11, suplentes: 5, color: '#f59e0b',
    formaciones: [
      { id: '4-4-2', label: '4-4-2', def: 4, med: 4, del: 2 },
      { id: '4-3-3', label: '4-3-3', def: 4, med: 3, del: 3 },
      { id: '3-5-2', label: '3-5-2', def: 3, med: 5, del: 2 },
      { id: '5-3-2', label: '5-3-2', def: 5, med: 3, del: 2 },
    ]
  },
];

const POSICION_COLORS = { ARQ: '#f59e0b', DEF: '#3b82f6', MED: '#10b981', DEL: '#ef4444', SUP: '#8b5cf6' };
const POSICION_LABELS = { 1: 'ARQ', 2: 'DEF', 3: 'MED', 4: 'DEL' };

// ── Genera los slots de titulares según la formación ────────────────────────
function generarSlots(formacion) {
  if (!formacion) return [];
  const slots = [];
  slots.push({ id: 'arq-0', linea: 'ARQ', rol: 'ARQ', posNum: 1 });
  for (let i = 0; i < formacion.def; i++)
    slots.push({ id: `def-${i}`, linea: 'DEF', rol: 'DEF', posNum: 2 });
  for (let i = 0; i < formacion.med; i++)
    slots.push({ id: `med-${i}`, linea: 'MED', rol: 'MED', posNum: 3 });
  for (let i = 0; i < formacion.del; i++)
    slots.push({ id: `del-${i}`, linea: 'DEL', rol: 'DEL', posNum: 4 });
  return slots;
}

// ── Mini preview de la formación (visual compacto) ──────────────────────────
function MiniFormacionPreview({ formacion, color }) {
  if (!formacion) return null;
  const lineas = ['ARQ', ...Array(formacion.def).fill('DEF'), ...Array(formacion.med).fill('MED'), ...Array(formacion.del).fill('DEL')];
  const grupos = [
    { label: 'DEL', count: formacion.del },
    { label: 'MED', count: formacion.med },
    { label: 'DEF', count: formacion.def },
    { label: 'ARQ', count: 1 },
  ];
  return (
    <View style={miniStyles.container}>
      {grupos.map((g, gi) => (
        <View key={gi} style={miniStyles.linea}>
          {Array(g.count).fill(0).map((_, i) => (
            <View key={i} style={[miniStyles.punto, { backgroundColor: POSICION_COLORS[g.label] }]} />
          ))}
        </View>
      ))}
    </View>
  );
}

const miniStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: 3, paddingVertical: 6 },
  linea: { flexDirection: 'row', gap: 4, justifyContent: 'center' },
  punto: { width: 8, height: 8, borderRadius: 4 },
});

// ── Cancha visual (Responsiva con diseño) ───────────────────────────────────
function CanchaVisual({ tipoCancha, formacion, asignaciones, capitanSlotId, onSlotPress }) {
  const grupos = [
    { label: 'DEL', count: formacion.del },
    { label: 'MED', count: formacion.med },
    { label: 'DEF', count: formacion.def },
    { label: 'ARQ', count: 1 },
  ];

  const allSlots = generarSlots(formacion);

  return (
    <View style={canchaStyles.canchaWrapper}>
      <View style={canchaStyles.campo}>
        {/* Líneas de la cancha (responsivas) */}
        <View style={canchaStyles.lineaMedia} />
        <View style={canchaStyles.circuloCentral} />

        {grupos.map((grupo) => {
          const slotsLinea = allSlots.filter(s => s.linea === grupo.label);
          if (slotsLinea.length === 0) return null;
          
          return (
            <View key={grupo.label} style={canchaStyles.lineaRow}>
              {slotsLinea.map((slot) => {
                const jugador = asignaciones[slot.id];
                const esCapitan = capitanSlotId === slot.id;
                const color = POSICION_COLORS[slot.rol];

                return (
                  <TouchableOpacity
                    key={slot.id}
                    onPress={() => onSlotPress(slot)}
                    style={[
                      canchaStyles.slot,
                      {
                        backgroundColor: jugador ? color : 'rgba(255,255,255,0.18)',
                        borderColor: esCapitan ? '#fbbf24' : (jugador ? color : 'rgba(255,255,255,0.5)'),
                        borderWidth: esCapitan ? 3 : 1.5,
                      }
                    ]}
                  >
                    {jugador ? (
                      <>
                        <Text style={canchaStyles.slotNum}>{jugador.numero}</Text>
                        <Text style={canchaStyles.slotNombre} numberOfLines={1}>
                          {jugador.apellido || jugador.nombre?.split(' ')[0] || '?'}
                        </Text>
                        {esCapitan && (
                          <View style={canchaStyles.capitanBadge}>
                            <Text style={canchaStyles.capitanC}>C</Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <>
                        <Text style={canchaStyles.slotRol}>{slot.rol}</Text>
                        <MaterialCommunityIcons name="plus" size={16} color="rgba(255,255,255,0.7)" />
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const canchaStyles = StyleSheet.create({
  canchaWrapper: { 
    borderRadius: 16, 
    overflow: 'hidden', 
    width: '100%', 
    maxWidth: 400,
    alignSelf: 'center', 
    borderWidth: 2, 
    borderColor: 'rgba(255,255,255,0.25)',
    marginVertical: 10
  },
  campo: { 
    backgroundColor: '#1a7a3c', 
    paddingVertical: 24,
    paddingHorizontal: 10,
    gap: 24, 
    justifyContent: 'space-evenly',
    minHeight: 340,
    position: 'relative'
  },
  lineaMedia: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginTop: -1,
  },
  circuloCentral: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 100,
    height: 100,
    marginLeft: -50,
    marginTop: -50,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  lineaRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
  },
  slot: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 3 
  },
  slotNum: { color: '#fff', fontWeight: '900', fontSize: 13, lineHeight: 15 },
  slotNombre: { color: '#fff', fontWeight: '700', fontSize: 8, maxWidth: 46, textAlign: 'center' },
  slotRol: { color: 'rgba(255,255,255,0.8)', fontWeight: '800', fontSize: 9 },
  capitanBadge: { position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#fbbf24', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  capitanC: { color: '#7c2d12', fontWeight: '900', fontSize: 10, lineHeight: 12 },
});

// ── Modal principal ──────────────────────────────────────────────────────────
export default function FormacionModal({ visible, onClose, equipo, onSaved }) {
  const [step, setStep] = useState(1);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [formacionSeleccionada, setFormacionSeleccionada] = useState(null);

  const [jugadores, setJugadores] = useState([]);
  const [clientes, setClientes] = useState({});
  const [loading, setLoading] = useState(false);

  const [asignaciones, setAsignaciones] = useState({});
  const [suplentes, setSuplentes] = useState([]);
  const [capitanSlotId, setCapitanSlotId] = useState(null);
  const [slotActivo, setSlotActivo] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextSlot, setContextSlot] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && equipo) {
      setStep(1);
      setTipoSeleccionado(null);
      setFormacionSeleccionada(null);
      setAsignaciones({});
      setSuplentes([]);
      setCapitanSlotId(null);
      loadJugadores();
    }
  }, [visible, equipo]);

  const loadJugadores = async () => {
    try {
      setLoading(true);
      const allJ = await jugadorService.getAll();
      const equipoJ = (allJ || []).filter(j => j.equipoId?.toString() === equipo?.id?.toString());
      const allC = await clienteService.getAll();
      const cMap = {};
      (allC || []).forEach(c => { cMap[c.id] = c; });
      setClientes(cMap);
      const enriched = equipoJ.map(j => ({
        ...j,
        nombre: cMap[j.clienteId]?.nombre || `Jugador`,
        apellido: cMap[j.clienteId]?.apellido || `#${j.clienteId}`,
      }));
      setJugadores(enriched);

    } catch (e) {
      console.error('Error cargando jugadores:', e);
    } finally {
      setLoading(false);
    }
  };

  const rebuildAsignaciones = (tipo, formacionDefecto, formacionesDelEquipo) => {
    const formConfig = tipo.formaciones.find(f => f.id === formacionDefecto);
    if (!formConfig) return false;

    setFormacionSeleccionada(formConfig);

    const savedFormacion = formacionesDelEquipo.find(f => f.tipoCancha === tipo.key);
    if (!savedFormacion) return false;

    const slots = generarSlots(formConfig);
    const POSICION_TO_LINEA = { 1: 'ARQ', 2: 'DEF', 3: 'MED', 4: 'DEL' };
    const nuevasAsignaciones = {};
    const nuevosSuplentes = [];
    let nuevoCapitanSlotId = null;

    // Separate based on savedFormacion.jugadores (JugadorFormacionResponse)
    const savedJugadores = savedFormacion.jugadores || [];
    const savedTitulares = savedJugadores.filter(j => j.esTitular);
    const savedSuplentes = savedJugadores.filter(j => !j.esTitular && j.posicion > 0);

    const slotsUsados = new Set();

    savedTitulares.forEach(savedJ => {
      const jugadorFull = jugadores.find(j => j.id === savedJ.jugadorId);
      if (jugadorFull) {
        const linea = POSICION_TO_LINEA[savedJ.posicion];
        const slotDisponible = slots.find(s => s.linea === linea && !slotsUsados.has(s.id));
        if (slotDisponible) {
          nuevasAsignaciones[slotDisponible.id] = { ...jugadorFull, posicion: savedJ.posicion, esTitular: true, esCapitan: savedJ.esCapitan };
          slotsUsados.add(slotDisponible.id);
          if (savedJ.esCapitan) {
            nuevoCapitanSlotId = slotDisponible.id;
          }
        }
      }
    });

    savedSuplentes.forEach(savedJ => {
      const jugadorFull = jugadores.find(j => j.id === savedJ.jugadorId);
      if (jugadorFull) {
        nuevosSuplentes.push({ ...jugadorFull, posicion: savedJ.posicion, esTitular: false, esCapitan: savedJ.esCapitan });
      }
    });

    setAsignaciones(nuevasAsignaciones);
    setSuplentes(nuevosSuplentes);
    if (nuevoCapitanSlotId) setCapitanSlotId(nuevoCapitanSlotId);
    return true;
  };

  const handleNextStep1 = () => {
    if (!tipoSeleccionado) return;
    
    // Reset selections when choosing type
    setFormacionSeleccionada(null);
    setAsignaciones({});
    setSuplentes([]);
    setCapitanSlotId(null);

    const savedFormacion = equipo?.formaciones?.find(f => f.tipoCancha === tipoSeleccionado.key);
    if (savedFormacion && savedFormacion.formacionDefecto) {
      const ok = rebuildAsignaciones(tipoSeleccionado, savedFormacion.formacionDefecto, equipo.formaciones);
      if (ok) {
        setStep(3); // Already exists, go straight to pitch
        return;
      }
    }
    
    setStep(2); // Needs to select formation
  };

  const handleClose = () => {
    setStep(1);
    setTipoSeleccionado(null);
    setFormacionSeleccionada(null);
    setAsignaciones({});
    setSuplentes([]);
    setCapitanSlotId(null);
    onClose();
  };

  const asignadosIds = new Set([
    ...Object.values(asignaciones).map(j => j.id),
    ...suplentes.map(j => j.id),
  ]);
  const jugadoresDisponibles = jugadores.filter(j => !asignadosIds.has(j.id));
  
  // Ahora un jugador puede jugar en cualquier posición, no hay filtro estricto
  const jugadoresFiltrados = slotActivo ? jugadoresDisponibles : [];

  const handleSlotPress = (slot) => {
    const yaAsignado = asignaciones[slot.id];
    if (yaAsignado) {
      // Si el slot está ocupado, abrir opciones de capitán/remover
      setContextSlot(slot);
      setContextMenuVisible(true);
      return;
    }
    setSlotActivo(slot);
    setPickerVisible(true);
  };

  const asignarJugadorASlot = (jugador) => {
    setAsignaciones(prev => ({ ...prev, [slotActivo.id]: jugador }));
    setPickerVisible(false);
    setSlotActivo(null);
  };

  const toggleSuplente = (jugador) => {
    if (suplentes.some(s => s.id === jugador.id)) {
      setSuplentes(prev => prev.filter(s => s.id !== jugador.id));
    } else {
      if (suplentes.length >= tipoSeleccionado.suplentes) {
        Alert.alert('Límite de suplentes', `Solo podés tener ${tipoSeleccionado.suplentes} suplentes para ${tipoSeleccionado.label}.`);
        return;
      }
      setSuplentes(prev => [...prev, jugador]);
    }
  };

  const handleGuardar = async () => {
    if (!tipoSeleccionado || !formacionSeleccionada) return;
    
    // Preparar lista de jugadores
    const jugadoresPayload = [];
    
    // Agregar titulares (asignan posicion segun el slot activo)
    Object.keys(asignaciones).forEach(slotId => {
      const jugador = asignaciones[slotId];
      // El slot.id suele ser tipo "arq-0", "def-1". El slot object no lo tenemos aca directamente,
      // pero podemos deducirlo del slotId o de la configuración
      // En allSlots generados, rol era ARQ, DEF, MED, DEL.
      let posEnum = 0;
      if (slotId.startsWith('arq')) posEnum = 1;
      else if (slotId.startsWith('def')) posEnum = 2;
      else if (slotId.startsWith('med')) posEnum = 3;
      else if (slotId.startsWith('del')) posEnum = 4;
      
      jugadoresPayload.push({
        jugadorId: jugador.id,
        posicion: posEnum,
        esTitular: true
      });
    });

    // Agregar suplentes (mantienen su posicion pero esTitular = false)
    suplentes.forEach(jugador => {
      jugadoresPayload.push({
        jugadorId: jugador.id,
        posicion: jugador.posicion, // mantienen la suya
        esTitular: false
      });
    });

    const payload = {
      tipoCancha: tipoSeleccionado.key,
      formacionDefecto: formacionSeleccionada.id,
      capitanId: capitanSlotId ? asignaciones[capitanSlotId]?.id : null,
      jugadores: jugadoresPayload
    };
    
    try {
      setSaving(true);
      await equipoService.guardarFormacion(equipo.id, payload);
      if (onSaved) {
        const formaciones = equipo.formaciones ? [...equipo.formaciones] : [];
        const existingIndex = formaciones.findIndex(f => f.tipoCancha === tipoSeleccionado.key);
        const newFormacion = {
          id: existingIndex >= 0 ? formaciones[existingIndex].id : 0,
          tipoCancha: tipoSeleccionado.key,
          formacionDefecto: formacionSeleccionada.id,
          jugadores: payload.jugadores.map(j => ({
            jugadorId: j.jugadorId,
            esTitular: j.esTitular,
            posicion: j.posicion,
            esCapitan: j.jugadorId === payload.capitanId
          }))
        };
        if (existingIndex >= 0) formaciones[existingIndex] = newFormacion;
        else formaciones.push(newFormacion);

        onSaved({
          ...equipo,
          formaciones
        });
      }
      Alert.alert('¡Guardado!', 'La formación fue guardada correctamente.', [{ text: 'OK', onPress: handleClose }]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar la formación. Verificá la conexión con el servidor.');
    } finally {
      setSaving(false);
    }
  };

  const totalSlots = formacionSeleccionada ? generarSlots(formacionSeleccionada).length : 0;
  const titularesCubiertos = Object.keys(asignaciones).length;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>⚽ Formación del Equipo</Text>
              <Text style={styles.headerSub}>{equipo?.nombre || ''}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.stepper}>
            {[{ n: 1, label: 'Cancha' }, { n: 2, label: 'Formación' }, { n: 3, label: 'Cancha' }].map(s => (
              <React.Fragment key={s.n}>
                <View style={styles.stepItem}>
                  <View style={[styles.stepCircle, step >= s.n && styles.stepCircleActive]}>
                    <Text style={[styles.stepNum, step >= s.n && styles.stepNumActive]}>{s.n}</Text>
                  </View>
                  <Text style={[styles.stepLabel, step >= s.n && styles.stepLabelActive]}>{s.label}</Text>
                </View>
                {s.n < 3 && <View style={[styles.stepLine, step > s.n && styles.stepLineActive]} />}
              </React.Fragment>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 20 }}>
            {step === 1 && (
              <View>
                <Text style={styles.stepTitle}>Seleccioná el tipo de cancha</Text>
                {TIPOS_CANCHA.map(tipo => (
                  <TouchableOpacity
                    key={tipo.key}
                    style={[styles.tipoCard, tipoSeleccionado?.key === tipo.key && { borderColor: tipo.color, borderWidth: 2.5 }]}
                    onPress={() => setTipoSeleccionado(tipo)}
                  >
                    <View style={[styles.tipoIconBox, { backgroundColor: tipo.color + '22' }]}>
                      <MaterialCommunityIcons name={tipo.icon} size={32} color={tipo.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={styles.tipoLabel}>{tipo.label}</Text>
                      <Text style={styles.tipoSub}>
                        {tipo.titulares} titulares · hasta {tipo.suplentes} suplentes
                      </Text>
                      <View style={styles.formChips}>
                        {tipo.formaciones.map(f => (
                          <View key={f.id} style={[styles.formChip, { backgroundColor: tipo.color + '22' }]}>
                            <Text style={[styles.formChipText, { color: tipo.color }]}>{f.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    {tipoSeleccionado?.key === tipo.key && (
                      <MaterialCommunityIcons name="check-circle" size={24} color={tipo.color} />
                    )}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[styles.nextBtn, !tipoSeleccionado && styles.nextBtnDisabled]}
                  onPress={handleNextStep1}
                  disabled={!tipoSeleccionado}
                >
                  <Text style={styles.nextBtnText}>SIGUIENTE</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && tipoSeleccionado && (
              <View>
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                  <MaterialCommunityIcons name="arrow-left" size={18} color="#64748b" />
                  <Text style={styles.backText}>Cambiar tipo de cancha</Text>
                </TouchableOpacity>

                <View style={[styles.tipoBadge, { backgroundColor: tipoSeleccionado.color + '22' }]}>
                  <Text style={[styles.tipoBadgeText, { color: tipoSeleccionado.color }]}>
                    {tipoSeleccionado.label} — {tipoSeleccionado.titulares} titulares
                  </Text>
                </View>

                <Text style={styles.stepTitle}>Elegí la formación</Text>

                <View style={styles.formacionGrid}>
                  {tipoSeleccionado.formaciones.map(form => (
                    <TouchableOpacity
                      key={form.id}
                      style={[
                        styles.formacionCard,
                        formacionSeleccionada?.id === form.id && {
                          borderColor: tipoSeleccionado.color, borderWidth: 2.5,
                          backgroundColor: tipoSeleccionado.color + '11'
                        }
                      ]}
                      onPress={() => setFormacionSeleccionada(form)}
                    >
                      <MiniFormacionPreview formacion={form} color={tipoSeleccionado.color} />
                      <Text style={styles.formacionLabel}>{form.label}</Text>
                      <Text style={styles.formacionSub}>
                        ARQ · {form.def}DEF · {form.med}MED · {form.del}DEL
                      </Text>
                      {formacionSeleccionada?.id === form.id && (
                        <MaterialCommunityIcons name="check-circle" size={18} color={tipoSeleccionado.color} style={{ marginTop: 4 }} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.nextBtn, !formacionSeleccionada && styles.nextBtnDisabled]}
                  onPress={() => formacionSeleccionada && setStep(3)}
                  disabled={!formacionSeleccionada}
                >
                  <Text style={styles.nextBtnText}>POSICIONAR JUGADORES</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {step === 3 && formacionSeleccionada && tipoSeleccionado && (
              <View>
                <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
                  <MaterialCommunityIcons name="arrow-left" size={18} color="#64748b" />
                  <Text style={styles.backText}>Cambiar formación</Text>
                </TouchableOpacity>

                <View style={styles.infoRow}>
                  <View style={[styles.infoBadge, { backgroundColor: tipoSeleccionado.color + '22' }]}>
                    <Text style={[styles.infoBadgeText, { color: tipoSeleccionado.color }]}>
                      {tipoSeleccionado.label}
                    </Text>
                  </View>
                  <View style={styles.infoBadge}>
                    <Text style={styles.infoBadgeText}>
                      Formación {formacionSeleccionada.label}
                    </Text>
                  </View>
                  <View style={styles.infoBadge}>
                    <Text style={styles.infoBadgeText}>
                      {titularesCubiertos}/{totalSlots} titulares
                    </Text>
                  </View>
                </View>

                <Text style={styles.hintText}>
                  Tocá un slot libre para agregar un jugador · Tocá un titular para hacerlo Capitán
                </Text>

                {loading ? (
                  <ActivityIndicator size="large" color="#009b3a" style={{ marginVertical: 30 }} />
                ) : (
                  <>
                    <CanchaVisual
                      tipoCancha={tipoSeleccionado}
                      formacion={formacionSeleccionada}
                      asignaciones={asignaciones}
                      capitanSlotId={capitanSlotId}
                      onSlotPress={handleSlotPress}
                    />

                    <View style={styles.leyenda}>
                      {Object.entries(POSICION_COLORS).filter(([k]) => k !== 'SUP').map(([k, v]) => (
                        <View key={k} style={styles.leyendaItem}>
                          <View style={[styles.leyendaDot, { backgroundColor: v }]} />
                          <Text style={styles.leyendaText}>{k}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.suplentesSection}>
                      <View style={styles.suplentesHeader}>
                        <MaterialCommunityIcons name="account-clock" size={18} color="#8b5cf6" />
                        <Text style={styles.suplentesTitle}>
                          Suplentes ({suplentes.length}/{tipoSeleccionado.suplentes})
                        </Text>
                      </View>

                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                        {Array(tipoSeleccionado.suplentes).fill(0).map((_, i) => {
                          const suplente = suplentes[i];
                          return (
                            <TouchableOpacity
                              key={i}
                              style={[styles.supSlot, suplente && styles.supSlotOcupado]}
                              onPress={() => suplente && setSuplentes(prev => prev.filter(s => s.id !== suplente.id))}
                            >
                              {suplente ? (
                                <>
                                  <Text style={styles.supNum}>{suplente.numero}</Text>
                                  <Text style={styles.supNombre} numberOfLines={1}>
                                    {suplente.apellido || suplente.nombre?.split(' ')[0]}
                                  </Text>
                                  <MaterialCommunityIcons name="close-circle" size={12} color="#fff" style={{ opacity: 0.7 }} />
                                </>
                              ) : (
                                <>
                                  <Text style={styles.supVacioLabel}>SUP</Text>
                                  <MaterialCommunityIcons name="plus" size={14} color="#8b5cf6" />
                                </>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>

                      {jugadoresDisponibles.length > 0 && (
                        <View>
                          <Text style={styles.dispLabel}>
                            Jugadores disponibles — tocá para agregar como suplente:
                          </Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {jugadoresDisponibles.map(j => (
                              <TouchableOpacity
                                key={j.id}
                                style={styles.dispChip}
                                onPress={() => toggleSuplente(j)}
                              >
                                <View style={[styles.dispChipNum, { backgroundColor: POSICION_COLORS[POSICION_LABELS[j.posicion]] || '#94a3b8' }]}>
                                  <Text style={styles.dispChipNumText}>{j.numero}</Text>
                                </View>
                                <Text style={styles.dispChipName}>
                                  {j.apellido || j.nombre}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}

                      {jugadoresDisponibles.length === 0 && Object.keys(asignaciones).length === totalSlots && (
                        <Text style={styles.dispLabel}>✅ Todos los jugadores fueron asignados</Text>
                      )}
                    </View>

                    {capitanSlotId && asignaciones[capitanSlotId] && (
                      <View style={styles.capitanInfo}>
                        <Text style={styles.capitanInfoText}>
                          🏅 Capitán: {asignaciones[capitanSlotId].nombre} {asignaciones[capitanSlotId].apellido}
                        </Text>
                        <TouchableOpacity onPress={() => setCapitanSlotId(null)}>
                          <MaterialCommunityIcons name="close-circle" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}

                <View style={styles.finalBtns}>
                  <TouchableOpacity style={styles.cancelFinalBtn} onPress={handleClose}>
                    <Text style={styles.cancelFinalText}>CANCELAR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                    onPress={handleGuardar}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="content-save" size={18} color="#fff" />
                        <Text style={styles.saveBtnText}>GUARDAR FORMACIÓN</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        {/* ── Sub-modal: Picker de jugadores ──────────────────────────── */}
        <Modal visible={pickerVisible} animationType="fade" transparent={true}>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerTitle}>
                Asignar a posición {slotActivo?.rol}
              </Text>
              <Text style={styles.pickerSub}>
                Seleccioná un jugador disponible para esta posición
              </Text>

              {jugadoresFiltrados.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <MaterialCommunityIcons name="account-off-outline" size={40} color="#cbd5e1" />
                  <Text style={{ color: '#94a3b8', marginTop: 10, fontWeight: '600', textAlign: 'center' }}>
                    No hay jugadores disponibles para asignar
                  </Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={true}>
                  {jugadoresFiltrados.map(j => {
                    const posColor = '#94a3b8';
                    return (
                      <TouchableOpacity
                        key={j.id}
                        style={styles.pickerRow}
                        onPress={() => asignarJugadorASlot(j)}
                      >
                        <View style={[styles.pickerNum, { backgroundColor: posColor }]}>
                          <Text style={styles.pickerNumText}>{j.numero}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.pickerNombre}>{j.nombre} {j.apellido}</Text>
                          <Text style={[styles.pickerPos, { color: posColor }]}>
                            {POSICION_LABELS[j.posicion] || 'Sin posición'}
                          </Text>
                        </View>
                        <MaterialCommunityIcons name="arrow-right-circle" size={22} color={posColor} />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              <TouchableOpacity style={styles.pickerCancelBtn} onPress={() => setPickerVisible(false)}>
                <Text style={styles.pickerCancelText}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── Sub-modal: Menú capitán ──────────────────────────────────── */}
        <Modal visible={contextMenuVisible} animationType="fade" transparent={true}>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerTitle}>Opciones del Titular</Text>
              {contextSlot && asignaciones[contextSlot?.id] && (
                <Text style={styles.pickerSub}>
                  {asignaciones[contextSlot.id].nombre} {asignaciones[contextSlot.id].apellido}
                </Text>
              )}

              <TouchableOpacity
                style={styles.ctxBtn}
                onPress={() => {
                  setCapitanSlotId(capitanSlotId === contextSlot?.id ? null : contextSlot?.id);
                  setContextMenuVisible(false);
                }}
              >
                <Text style={styles.capitanBadgeIcon}>🏅</Text>
                <Text style={styles.ctxBtnText}>
                  {capitanSlotId === contextSlot?.id ? 'Quitar capitanía' : 'Designar como Capitán'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ctxBtn, { borderTopWidth: 1, borderTopColor: '#f1f5f9' }]}
                onPress={() => {
                  setAsignaciones(prev => {
                    const next = { ...prev };
                    delete next[contextSlot.id];
                    return next;
                  });
                  if (capitanSlotId === contextSlot?.id) setCapitanSlotId(null);
                  setContextMenuVisible(false);
                }}
              >
                <MaterialCommunityIcons name="account-remove" size={20} color="#ef4444" />
                <Text style={[styles.ctxBtnText, { color: '#ef4444' }]}>Quitar del slot</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pickerCancelBtn} onPress={() => setContextMenuVisible(false)}>
                <Text style={styles.pickerCancelText}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </Modal>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '95%', minHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  headerSub: { fontSize: 13, color: '#009b3a', fontWeight: '700', marginTop: 2 },
  closeBtn: { padding: 4 },

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  stepCircleActive: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  stepNum: { fontWeight: '900', fontSize: 13, color: '#94a3b8' },
  stepNumActive: { color: '#fff' },
  stepLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },
  stepLabelActive: { color: '#009b3a' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#e2e8f0', marginBottom: 12, marginHorizontal: 6 },
  stepLineActive: { backgroundColor: '#009b3a' },

  // Step title
  stepTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 14 },

  // Tipo cancha cards
  tipoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#e2e8f0' },
  tipoIconBox: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tipoLabel: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
  tipoSub: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },
  formChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  formChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  formChipText: { fontSize: 10, fontWeight: '900' },

  // Nav buttons
  nextBtn: { backgroundColor: '#009b3a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, marginTop: 16, gap: 8 },
  nextBtnDisabled: { backgroundColor: '#cbd5e1' },
  nextBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  backText: { color: '#64748b', fontWeight: '700', fontSize: 13 },
  tipoBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 12 },
  tipoBadgeText: { fontWeight: '800', fontSize: 12 },

  // Formaciones grid
  formacionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  formacionCard: { width: '47%', backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0' },
  formacionLabel: { fontSize: 18, fontWeight: '900', color: '#1e293b', marginTop: 6 },
  formacionSub: { fontSize: 9, color: '#64748b', fontWeight: '700', textAlign: 'center', marginTop: 2 },

  // Cancha paso 3
  infoRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  infoBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  infoBadgeText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  hintText: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 14, textAlign: 'center', fontStyle: 'italic' },

  // Leyenda
  leyenda: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10, marginBottom: 6 },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leyendaDot: { width: 10, height: 10, borderRadius: 5 },
  leyendaText: { fontSize: 10, fontWeight: '800', color: '#64748b' },

  // Suplentes
  suplentesSection: { marginTop: 16, backgroundColor: '#f8f4ff', borderRadius: 14, padding: 14 },
  suplentesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  suplentesTitle: { fontSize: 13, fontWeight: '800', color: '#7c3aed' },
  supSlot: { width: 58, height: 72, borderRadius: 12, borderWidth: 1.5, borderColor: '#c4b5fd', backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center', marginRight: 8, padding: 4, gap: 2 },
  supSlotOcupado: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  supNum: { color: '#fff', fontWeight: '900', fontSize: 14 },
  supNombre: { color: '#fff', fontWeight: '700', fontSize: 8, maxWidth: 50, textAlign: 'center' },
  supVacioLabel: { color: '#8b5cf6', fontWeight: '900', fontSize: 9 },
  dispLabel: { fontSize: 10, color: '#64748b', fontWeight: '700', marginTop: 8, marginBottom: 6 },
  dispChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  dispChipNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dispChipNumText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  dispChipName: { fontSize: 11, fontWeight: '700', color: '#1e293b' },

  // Capitán info bar
  capitanInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fffbeb', borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1.5, borderColor: '#fbbf24' },
  capitanInfoText: { fontSize: 13, fontWeight: '800', color: '#92400e' },
  capitanBadgeIcon: { fontSize: 18 },

  // Botones finales
  finalBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelFinalBtn: { flex: 0.38, padding: 15, borderRadius: 14, alignItems: 'center', backgroundColor: '#f1f5f9' },
  cancelFinalText: { color: '#64748b', fontWeight: '800' },
  saveBtn: { flex: 0.62, backgroundColor: '#009b3a', padding: 15, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },

  // Picker modal
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pickerContainer: { backgroundColor: '#fff', borderRadius: 22, padding: 22, width: '86%', maxWidth: 380, elevation: 12 },
  pickerTitle: { fontSize: 17, fontWeight: '900', color: '#1e293b', textAlign: 'center', marginBottom: 4 },
  pickerSub: { fontSize: 12, color: '#64748b', fontWeight: '700', textAlign: 'center', marginBottom: 14 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  pickerNum: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pickerNumText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  pickerNombre: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  pickerPos: { fontSize: 11, fontWeight: '800', marginTop: 2 },
  pickerCancelBtn: { backgroundColor: '#f1f5f9', padding: 13, borderRadius: 12, alignItems: 'center', marginTop: 14 },
  pickerCancelText: { color: '#64748b', fontWeight: '800' },

  // Context menu
  ctxBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 4 },
  ctxBtnText: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
});
