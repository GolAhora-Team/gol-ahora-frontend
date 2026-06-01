import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Platform, Alert, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { reportHistoryService } from '../services/reportHistoryService';
import { clienteService } from '../services/clienteService';
import { reservaService } from '../services/reservaService';
import { userService } from '../services/userService';
import { mercadoPagoService } from '../services/mercadoPagoService';
import ErrorModal from './ErrorModal';

// ─── PASO 1: SELECCIÓN DE CANCHA ───────────────────────────────────────────────
function StepCancha({ canchas, selectedCancha, onSelect }) {
  return (
    <View>
      <Text style={s.stepTitle}>Seleccioná una cancha</Text>
      <Text style={s.stepSubtitle}>Las canchas en mantenimiento no están disponibles para reservar.</Text>
      {canchas.map(c => {
        const enMantenimiento = c.enMantenimiento;
        const isSelected = selectedCancha?.id === c.id;
        return (
          <TouchableOpacity
            key={c.id}
            style={[
              s.canchaBtn,
              enMantenimiento && s.canchaBtnDisabled,
              isSelected && !enMantenimiento && s.canchaBtnSelected
            ]}
            disabled={enMantenimiento}
            onPress={() => onSelect(c)}
          >
            <View style={s.canchaBtnInner}>
              <MaterialCommunityIcons
                name={enMantenimiento ? 'tools' : 'soccer-field'}
                size={28}
                color={enMantenimiento ? '#94a3b8' : isSelected ? '#fff' : '#009b3a'}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[s.canchaBtnName, enMantenimiento && { color: '#94a3b8' }, isSelected && !enMantenimiento && { color: '#fff' }]}>
                  {c.nombre}
                </Text>
                <Text style={[s.canchaBtnType, enMantenimiento && { color: '#cbd5e1' }, isSelected && !enMantenimiento && { color: '#d1fae5' }]}>
                  {c.tipo} • {c.superficie} • Cap: {c.capacidad}
                </Text>
              </View>
              <Text style={[s.canchaBtnPrice, enMantenimiento && { color: '#cbd5e1' }, isSelected && !enMantenimiento && { color: '#fff' }]}>
                ${c.precioPorHora?.toLocaleString('es-AR') || '---'}/h
              </Text>
            </View>
            {enMantenimiento && (
              <Text style={s.mantenimientoText}>⚠ EN MANTENIMIENTO</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── PASO 2: CLIENTE O INVITADO ────────────────────────────────────────────────
function StepCliente({ mode, setMode, clientes, selectedCliente, setSelectedCliente, invitado, setInvitado, errors }) {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredClientes = searchTerm.length >= 2
    ? clientes.filter(c => 
        c.dni?.toString().includes(searchTerm) || 
        c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.apellido?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <View>
      <Text style={s.stepTitle}>¿A nombre de quién es la reserva?</Text>

      <View style={s.modeRow}>
        <TouchableOpacity
          style={[s.modeBtn, mode === 'CLIENTE' && s.modeBtnActive]}
          onPress={() => setMode('CLIENTE')}
        >
          <MaterialCommunityIcons name="account-search" size={22} color={mode === 'CLIENTE' ? '#fff' : '#009b3a'} />
          <Text style={[s.modeBtnText, mode === 'CLIENTE' && { color: '#fff' }]}>Cliente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.modeBtn, mode === 'INVITADO' && s.modeBtnActive]}
          onPress={() => setMode('INVITADO')}
        >
          <MaterialCommunityIcons name="account-plus" size={22} color={mode === 'INVITADO' ? '#fff' : '#009b3a'} />
          <Text style={[s.modeBtnText, mode === 'INVITADO' && { color: '#fff' }]}>Invitado</Text>
        </TouchableOpacity>
      </View>

      {mode === 'CLIENTE' && (
        <View>
          <Text style={s.fieldLabel}>Buscar cliente por DNI o Nombre</Text>
          <View style={s.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
            <TextInput
              style={s.searchInput}
              placeholder="Ingrese el DNI o nombre..."
              placeholderTextColor="#94a3b8"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          {errors?.cliente && <Text style={s.errorText}>{errors.cliente}</Text>}

          {filteredClientes.length > 0 && (
            <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
              {filteredClientes.map(c => {
                const isSelected = selectedCliente?.id === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[s.clienteResult, isSelected && s.clienteResultSelected]}
                    onPress={() => setSelectedCliente(c)}
                  >
                    <View>
                      <Text style={[s.clienteResultName, isSelected && { color: '#fff' }]}>
                        {c.nombre} {c.apellido}
                      </Text>
                      <Text style={[s.clienteResultDni, isSelected && { color: '#d1fae5' }]}>
                        DNI: {c.dni}
                      </Text>
                      {(c.aptoFisico || c.esSocioActivo) && (
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                          {c.aptoFisico && (
                            <View style={[s.badge, s.badgeApto]}>
                              <MaterialCommunityIcons name="heart-pulse" size={12} color="#059669" />
                              <Text style={s.badgeTextApto}>Apto Físico</Text>
                            </View>
                          )}
                          {c.esSocioActivo && (
                            <View style={[s.badge, s.badgeSocio]}>
                              <MaterialCommunityIcons name="star-circle-outline" size={12} color="#d97706" />
                              <Text style={s.badgeTextSocio}>Socio Activo</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                    {isSelected && <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {searchTerm.length >= 2 && filteredClientes.length === 0 && (
            <Text style={s.noResultsText}>No se encontraron clientes con ese DNI o nombre.</Text>
          )}

          {selectedCliente && (
            <View style={s.selectedClienteCard}>
              <MaterialCommunityIcons name="account-check" size={24} color="#009b3a" />
              <View style={{ marginLeft: 10 }}>
                <Text style={s.selectedClienteName}>{selectedCliente.nombre} {selectedCliente.apellido}</Text>
                <Text style={s.selectedClienteInfo}>DNI: {selectedCliente.dni} • Tel: {selectedCliente.telefono || 'N/A'}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                  {selectedCliente.aptoFisico && (
                    <View style={[s.badge, s.badgeApto]}>
                      <MaterialCommunityIcons name="heart-pulse" size={12} color="#059669" />
                      <Text style={s.badgeTextApto}>Apto Físico</Text>
                    </View>
                  )}
                  {selectedCliente.esSocioActivo && (
                    <View style={[s.badge, s.badgeSocio]}>
                      <MaterialCommunityIcons name="star-circle-outline" size={12} color="#d97706" />
                      <Text style={s.badgeTextSocio}>Socio Activo - 10% DESC.</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {mode === 'INVITADO' && (
        <View>
          <Text style={s.fieldLabel}>Nombre *</Text>
          <TextInput
            style={[s.fieldInput, errors?.nombre && s.fieldInputError]}
            placeholder="Nombre del invitado"
            placeholderTextColor="#94a3b8"
            value={invitado.nombre}
            onChangeText={v => setInvitado({ ...invitado, nombre: v })}
          />
          {errors?.nombre && <Text style={s.errorText}>{errors.nombre}</Text>}

          <Text style={s.fieldLabel}>Apellido *</Text>
          <TextInput
            style={[s.fieldInput, errors?.apellido && s.fieldInputError]}
            placeholder="Apellido del invitado"
            placeholderTextColor="#94a3b8"
            value={invitado.apellido}
            onChangeText={v => setInvitado({ ...invitado, apellido: v })}
          />
          {errors?.apellido && <Text style={s.errorText}>{errors.apellido}</Text>}

          <Text style={s.fieldLabel}>DNI *</Text>
          <TextInput
            style={[s.fieldInput, errors?.dni && s.fieldInputError]}
            placeholder="DNI del invitado"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            value={invitado.dni}
            onChangeText={v => setInvitado({ ...invitado, dni: v.replace(/[^0-9]/g, '') })}
          />
          {errors?.dni && <Text style={s.errorText}>{errors.dni}</Text>}
        </View>
      )}
    </View>
  );
}

// ─── PASO 3: DÍA Y HORARIO ────────────────────────────────────────────────────
function StepDiaHorario({ selectedDate, setSelectedDate, selectedHora, setSelectedHora, reservasOcupadas, canchaId, errors }) {
  const scrollRef = useRef(null);

  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const days = getNext7Days();

  const horarios = (() => {
    const todos = [];
    for (let h = 10; h <= 23; h++) {
      todos.push(`${h.toString().padStart(2, '0')}:00`);
    }
    if (!selectedDate) return todos;
    
    const now = new Date();
    if (selectedDate.toDateString() === now.toDateString()) {
      return todos.filter(hStr => {
        const hInt = parseInt(hStr.split(':')[0], 10);
        return hInt > now.getHours();
      });
    }
    return todos;
  })();

  const scrollDays = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: direction === 'right' ? 300 : 0, animated: true });
    }
  };

  const isHoraOcupada = (hora) => {
    if (!selectedDate || !canchaId) return false;
    const fechaStr = selectedDate.toISOString().split('T')[0];
    return reservasOcupadas.some(r => {
      const rFecha = r.fecha?.split('T')[0];
      const rCanchaId = r.canchaId?.toString() || r.cancha?.id?.toString();
      if (rFecha !== fechaStr || rCanchaId !== canchaId.toString()) return false;
      const rInicio = r.horaInicio?.substring(0, 5);
      return rInicio === hora;
    });
  };

  return (
    <View>
      <Text style={s.stepTitle}>Día y Horario</Text>

      <Text style={s.fieldLabel}>Seleccionar día</Text>
      {errors?.fecha && <Text style={s.errorText}>{errors.fecha}</Text>}
      <View style={s.dayScrollRow}>
        <TouchableOpacity style={s.dayArrowBtn} onPress={() => scrollDays('left')}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#009b3a" />
        </TouchableOpacity>
        <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          {days.map((d, i) => {
            const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity
                key={i}
                style={[s.dayBtn, isSelected && s.dayBtnSelected]}
                onPress={() => { setSelectedDate(d); setSelectedHora(null); }}
              >
                <Text style={[s.dayBtnDow, isSelected && { color: '#fff' }]}>{diasSemana[d.getDay()]}</Text>
                <Text style={[s.dayBtnNum, isSelected && { color: '#fff' }]}>{d.getDate()}</Text>
                <Text style={[s.dayBtnMonth, isSelected && { color: '#d1fae5' }]}>
                  {d.toLocaleDateString('es-AR', { month: 'short' })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity style={s.dayArrowBtn} onPress={() => scrollDays('right')}>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#009b3a" />
        </TouchableOpacity>
      </View>

      {selectedDate && (
        <>
          <Text style={s.fieldLabel}>Seleccionar horario</Text>
          {errors?.hora && <Text style={s.errorText}>{errors.hora}</Text>}
          <View style={s.horariosGrid}>
            {horarios.length === 0 ? (
              <Text style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: 10 }}>Ya no hay horarios disponibles para el día de hoy.</Text>
            ) : (
              horarios.map(h => {
                const ocupada = isHoraOcupada(h);
                const isSelected = selectedHora === h;
                return (
                  <TouchableOpacity
                    key={h}
                    style={[s.horaBtn, ocupada && s.horaBtnOcupada, isSelected && !ocupada && s.horaBtnSelected]}
                    disabled={ocupada}
                    onPress={() => setSelectedHora(h)}
                  >
                    <Text style={[s.horaBtnText, ocupada && { color: '#cbd5e1' }, isSelected && !ocupada && { color: '#fff' }]}>
                      {h}
                    </Text>
                    {ocupada && <Text style={s.horaBtnOcupadaLabel}>Ocupado</Text>}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </>
      )}
    </View>
  );
}

// ─── PASO 4: PAGO ──────────────────────────────────────────────────────────────
function StepPago({ metodoPago, setMetodoPago, codigoVale, setCodigoVale, precioBase, esSocio, errors }) {
  const descEfectivo = metodoPago === 'EFECTIVO' ? precioBase * 0.10 : 0;
  const descSocio = esSocio ? precioBase * 0.10 : 0;
  const totalDescuentos = descEfectivo + descSocio;
  const montoFinal = precioBase - totalDescuentos;

  return (
    <View>
      <Text style={s.stepTitle}>Pago</Text>

      <Text style={s.fieldLabel}>Método de pago</Text>
      {errors?.metodoPago && <Text style={s.errorText}>{errors.metodoPago}</Text>}
      <View style={s.modeRow}>
        <TouchableOpacity
          style={[s.pagoBtn, metodoPago === 'EFECTIVO' && s.pagoBtnActive]}
          onPress={() => setMetodoPago('EFECTIVO')}
        >
          <MaterialCommunityIcons name="cash-multiple" size={28} color={metodoPago === 'EFECTIVO' ? '#fff' : '#009b3a'} />
          <Text style={[s.pagoBtnText, metodoPago === 'EFECTIVO' && { color: '#fff' }]}>Efectivo</Text>
          <Text style={[s.pagoBtnSub, metodoPago === 'EFECTIVO' && { color: '#d1fae5' }]}>10% desc.</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.pagoBtn, metodoPago === 'MERCADOPAGO' && s.pagoBtnActiveMP]}
          onPress={() => setMetodoPago('MERCADOPAGO')}
        >
          <Image 
            source={require('../../assets/mercadopagoLogo.png')} 
            style={{ width: 180, height: 60, resizeMode: 'contain', marginBottom: 4 }} 
          />
          <Text style={[s.pagoBtnSub, metodoPago === 'MERCADOPAGO' && { color: '#009ee3' }]}>Sin desc.</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.fieldLabel}>Código de Vale (opcional)</Text>
      <TextInput
        style={s.fieldInput}
        placeholder="Ingrese código de vale si tiene uno"
        placeholderTextColor="#94a3b8"
        value={codigoVale}
        onChangeText={setCodigoVale}
      />

      <View style={s.resumenPago}>
        <View style={s.resumenRow}>
          <Text style={s.resumenLabel}>Monto original (1 hora)</Text>
          <Text style={s.resumenValue}>${precioBase?.toLocaleString('es-AR')}</Text>
        </View>

        {descEfectivo > 0 && (
          <View style={s.resumenRow}>
            <Text style={s.descuentoLabel}>Descuento 10% pago en efectivo</Text>
            <Text style={s.descuentoValue}>-${descEfectivo.toLocaleString('es-AR')}</Text>
          </View>
        )}

        {descSocio > 0 && (
          <View style={s.resumenRow}>
            <Text style={s.descuentoLabel}>Descuento 10% socio activo</Text>
            <Text style={s.descuentoValue}>-${descSocio.toLocaleString('es-AR')}</Text>
          </View>
        )}

        <View style={s.resumenDivider} />
        <View style={s.resumenRow}>
          <Text style={s.totalLabel}>MONTO FINAL A PAGAR</Text>
          <Text style={s.totalValue}>${montoFinal.toLocaleString('es-AR')}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── PASO 5: CONFIRMACIÓN ──────────────────────────────────────────────────────
function StepConfirmacion({ cancha, persona, fecha, hora, metodoPago, precioBase, esSocio, currentUserRole }) {
  const descEfectivo = metodoPago === 'EFECTIVO' ? precioBase * 0.10 : 0;
  const descSocio = esSocio ? precioBase * 0.10 : 0;
  const montoFinal = precioBase - descEfectivo - descSocio;
  const fechaStr = fecha ? fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
  
  const isAdminOrPersonal = currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL';

  return (
    <View>
      <View style={s.confirmIcon}>
        <MaterialCommunityIcons name="help-circle-outline" size={50} color="#ffb300" />
      </View>
      <Text style={s.confirmTitle}>¿Estás seguro que deseas confirmar la reserva?</Text>

      <View style={s.confirmCard}>
        <View style={s.confirmRow}>
          <Text style={s.confirmLabel}>Cliente</Text>
          <Text style={s.confirmValue}>{persona.nombre} {persona.apellido}</Text>
        </View>
        <View style={s.confirmRow}>
          <Text style={s.confirmLabel}>DNI</Text>
          <Text style={s.confirmValue}>{persona.dni}</Text>
        </View>
        <View style={s.confirmRow}>
          <Text style={s.confirmLabel}>Cancha</Text>
          <Text style={s.confirmValue}>{cancha.nombre}</Text>
        </View>
        <View style={s.confirmRow}>
          <Text style={s.confirmLabel}>Día</Text>
          <Text style={s.confirmValue}>{fechaStr}</Text>
        </View>
        <View style={s.confirmRow}>
          <Text style={s.confirmLabel}>Hora</Text>
          <Text style={s.confirmValue}>{hora}</Text>
        </View>
        <View style={[s.confirmRow, { borderBottomWidth: 0 }]}>
          <Text style={s.confirmLabel}>Monto final</Text>
          <Text style={s.confirmTotalValue}>${montoFinal.toLocaleString('es-AR')}</Text>
        </View>
      </View>

      {metodoPago === 'MERCADOPAGO' && isAdminOrPersonal && (
        <View style={{ marginTop: 15, padding: 15, backgroundColor: '#f0fdf4', borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' }}>
          <Text style={{ fontSize: 13, color: '#15803d', fontWeight: 'bold' }}>
            El cliente debe transferir el monto exacto al Alias: GOL.AHORA.MP
          </Text>
          <Text style={{ fontSize: 12, color: '#166534', marginTop: 5 }}>
            Una vez que recibas y valides la transferencia en la cuenta, hacé click en Confirmar Reserva.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function ReservaFormModal({ visible, onClose, canchas = [], clientes = [], reservasActuales = [], currentUserRole, nombreUsuario, onReservaCreated, reservaToEdit }) {
  const [step, setStep] = useState(1);
  const [selectedCancha, setSelectedCancha] = useState(null);
  const [clienteMode, setClienteMode] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [invitado, setInvitado] = useState({ nombre: '', apellido: '', dni: '' });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHora, setSelectedHora] = useState(null);
  const [metodoPago, setMetodoPago] = useState(null);
  const [codigoVale, setCodigoVale] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState(null);

  useEffect(() => {
    if (visible) {
      if (reservaToEdit) {
        setStep(1);
        const c = canchas.find(x => x.id === reservaToEdit.canchaId);
        setSelectedCancha(c || null);
        
        let foundCliente = null;
        if (reservaToEdit.cliente) {
           foundCliente = clientes.find(x => x.id === reservaToEdit.cliente.id);
        } else if (reservaToEdit.clienteDni) {
           foundCliente = clientes.find(x => x.dni?.toString() === reservaToEdit.clienteDni?.toString());
        }

        if (foundCliente) {
          setClienteMode('CLIENTE');
          setSelectedCliente(foundCliente);
          setInvitado({ nombre: '', apellido: '', dni: '' });
        } else {
          setClienteMode('INVITADO');
          setSelectedCliente(null);
          const [n, ...a] = (reservaToEdit.clienteNombre || '').split(' ');
          setInvitado({ nombre: n || '', apellido: a.join(' ') || '', dni: reservaToEdit.clienteDni?.toString() || '' });
        }

        if (reservaToEdit.fecha) {
           const d = new Date(reservaToEdit.fecha + (reservaToEdit.fecha.includes('T') ? '' : 'T00:00:00'));
           setSelectedDate(d);
        } else setSelectedDate(null);

        setSelectedHora(reservaToEdit.horaInicio?.substring(0, 5) || null);
        setMetodoPago(null);
        setCodigoVale('');
      } else {
        setStep(1);
        setSelectedCancha(null);
        if (currentUserRole === 'CLIENTE') {
          setClienteMode('CLIENTE');
          const found = clientes.find(c => `${c.nombre} ${c.apellido || ''}`.trim() === nombreUsuario);
          setSelectedCliente(found || null);
        } else {
          setClienteMode(null);
          setSelectedCliente(null);
        }
        setInvitado({ nombre: '', apellido: '', dni: '' });
        setSelectedDate(null);
        setSelectedHora(null);
        setMetodoPago(null);
        setCodigoVale('');
      }
      setErrors({});
    }
  }, [visible, reservaToEdit, canchas, clientes]);

  const validateStep2 = () => {
    const errs = {};
    if (!clienteMode) {
      errs.cliente = 'Seleccioná Cliente o Invitado.';
      setErrors(errs);
      return false;
    }
    if (clienteMode === 'CLIENTE' && !selectedCliente) {
      errs.cliente = 'Buscá y seleccioná un cliente.';
      setErrors(errs);
      return false;
    }
    if (clienteMode === 'INVITADO') {
      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
      if (!invitado.nombre.trim()) errs.nombre = 'El nombre es obligatorio.';
      else if (!nameRegex.test(invitado.nombre)) errs.nombre = 'El nombre solo puede contener letras.';

      if (!invitado.apellido.trim()) errs.apellido = 'El apellido es obligatorio.';
      else if (!nameRegex.test(invitado.apellido)) errs.apellido = 'El apellido solo puede contener letras.';

      if (!invitado.dni.trim()) errs.dni = 'El DNI es obligatorio.';
      else if (!/^\d+$/.test(invitado.dni)) errs.dni = 'El DNI solo puede contener números.';
      else if (invitado.dni.length < 7 || invitado.dni.length > 8) errs.dni = 'El DNI debe tener 7 u 8 dígitos.';

      if (Object.keys(errs).length > 0) { setErrors(errs); return false; }
    }
    setErrors({});
    return true;
  };

  const validateStep3 = () => {
    const errs = {};
    if (!selectedDate) errs.fecha = 'Seleccioná un día para la reserva.';
    if (!selectedHora) errs.hora = 'Seleccioná un horario para la reserva.';

    if (selectedDate && selectedHora) {
      const now = new Date();
      const [horas, minutos] = selectedHora.split(':').map(Number);
      const reservaDateTime = new Date(selectedDate);
      reservaDateTime.setHours(horas, minutos, 0, 0);

      if (reservaDateTime < now) {
        errs.hora = 'No podés reservar en un horario que ya pasó.';
      }
    }

    if (Object.keys(errs).length > 0) { setErrors(errs); return false; }
    setErrors({});
    return true;
  };

  const validateStep4 = () => {
    const errs = {};
    if (!metodoPago) errs.metodoPago = 'Seleccioná un método de pago.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return false; }
    setErrors({});
    return true;
  };

  const getPersona = () => {
    if (clienteMode === 'CLIENTE' && selectedCliente) {
      return { nombre: selectedCliente.nombre, apellido: selectedCliente.apellido, dni: selectedCliente.dni, esSocio: selectedCliente.esSocioActivo, clienteId: selectedCliente.id };
    }
    return { nombre: invitado.nombre, apellido: invitado.apellido, dni: invitado.dni, esSocio: false, clienteId: null };
  };

  const getPrecioBase = () => selectedCancha?.precioPorHora || 0;
  const esSocio = () => clienteMode === 'CLIENTE' && selectedCliente?.esSocioActivo;

  const handleNext = () => {
    setErrors({});
    if (step === 1 && selectedCancha) {
      if (currentUserRole === 'CLIENTE') setStep(3);
      else setStep(2);
    }
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
    else if (step === 4 && validateStep4()) setStep(5);
  };

  const handleBack = () => {
    setErrors({});
    if (step === 3 && currentUserRole === 'CLIENTE') setStep(1);
    else if (step > 1) setStep(step - 1);
  };

  const generateComprobanteHtml = (persona, cancha, fecha, hora, precioBase, metodo, esSocioActivo, emitidoPor) => {
    const descEfectivo = metodo === 'EFECTIVO' ? precioBase * 0.10 : 0;
    const descSocio = esSocioActivo ? precioBase * 0.10 : 0;
    const montoFinal = precioBase - descEfectivo - descSocio;
    const fechaStr = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const now = new Date();

    return `
      <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 4px solid #009b3a; padding-bottom: 15px; margin-bottom: 25px; }
            .logo { font-size: 36px; font-weight: 900; color: #009b3a; margin: 0; }
            .sub { font-size: 12px; font-weight: bold; color: #64748b; }
            .container { border: 1px solid #e2e8f0; padding: 25px; border-radius: 12px; background: #f8fafc; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
            .label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }
            .value { font-weight: 900; color: #1e293b; font-size: 14px; }
            .discount { color: #ef4444; font-size: 13px; }
            .total { font-size: 24px; font-weight: 900; color: #009b3a; text-align: right; margin-top: 15px; border-top: 3px solid #009b3a; padding-top: 10px; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="logo">GOL AHORA</h1>
            <p class="sub">COMPROBANTE DE RESERVA</p>
          </div>
          <div class="container">
            <div class="row"><span class="label">Cliente</span> <span class="value">${persona.nombre} ${persona.apellido}</span></div>
            <div class="row"><span class="label">DNI</span> <span class="value">${persona.dni}</span></div>
            <div class="row"><span class="label">Cancha</span> <span class="value">${cancha.nombre} (${cancha.tipo})</span></div>
            <div class="row"><span class="label">Día</span> <span class="value">${fechaStr}</span></div>
            <div class="row"><span class="label">Horario</span> <span class="value">${hora}hs</span></div>
            <div class="row"><span class="label">Método de pago</span> <span class="value">${metodo === 'EFECTIVO' ? 'Efectivo' : 'Mercado Pago'}</span></div>
            <div class="row"><span class="label">Monto original</span> <span class="value">$${precioBase.toLocaleString('es-AR')}</span></div>
            ${descEfectivo > 0 ? `<div class="row"><span class="label discount">Desc. 10% efectivo</span> <span class="discount">-$${descEfectivo.toLocaleString('es-AR')}</span></div>` : ''}
            ${descSocio > 0 ? `<div class="row"><span class="label discount">Desc. 10% socio activo</span> <span class="discount">-$${descSocio.toLocaleString('es-AR')}</span></div>` : ''}
            <p class="total">TOTAL: $${montoFinal.toLocaleString('es-AR')}</p>
          </div>
          <div class="footer">
            Emitido el ${now.toLocaleDateString('es-AR')} a las ${now.toLocaleTimeString('es-AR')}, por ${emitidoPor || 'Administración'}
          </div>
        </body>
      </html>
    `;
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const persona = getPersona();
      const precioBase = getPrecioBase();
      const socio = esSocio();
      const descEfectivo = metodoPago === 'EFECTIVO' ? precioBase * 0.10 : 0;
      const descSocio = socio ? precioBase * 0.10 : 0;
      const montoFinal = precioBase - descEfectivo - descSocio;

      // Si es invitado, crear cliente temporal
      let clienteIdFinal = persona.clienteId;
      if (clienteMode === 'INVITADO') {
        try {
          const payload = {
            email: invitado.dni.toString(),
            password: "1234",
            cliente: {
              nombre: invitado.nombre,
              apellido: invitado.apellido,
              dni: Number(invitado.dni),
              genero: 'Otro',
              telefono: '',
              direccion: '',
              localidad: '',
              codigoPostal: '',
              provincia: 'Buenos Aires',
              pais: 'Argentina',
              email: '',
              contactoEmergencia: '',
              activo: true,
              esSocioActivo: false,
              obraSocial: 'Ninguna',
              aptoFisico: false,
              fechaNacimiento: '2000-01-01T00:00:00.000Z'
            }
          };
          const result = await userService.createUsuarioCliente(payload);
          clienteIdFinal = result?.cliente?.id || result?.id;
          
          // Si no pudimos obtener el id del resultado, buscamos por DNI
          if (!clienteIdFinal) {
            const allClientes = await clienteService.getAll();
            const found = allClientes.find(c => c.dni?.toString() === invitado.dni);
            if (found) clienteIdFinal = found.id;
          }
        } catch (e) {
          // Si falla porque ya existe, buscamos el cliente existente
          try {
            const allClientes = await clienteService.getAll();
            const found = allClientes.find(c => c.dni?.toString() === invitado.dni);
            if (found) clienteIdFinal = found.id;
          } catch (e2) { /* ignore */ }
        }
      }

      if (!clienteIdFinal) {
        Alert.alert('Error', 'No se pudo registrar al cliente. Intente nuevamente.');
        setIsLoading(false);
        return;
      }

      // Crear o actualizar la reserva en el backend
      const [horaH] = selectedHora.split(':').map(Number);
      const reservaPayload = {
        Fecha: selectedDate.toISOString().split('T')[0],
        HoraInicio: `${selectedHora}:00`,
        HoraFin: `${(horaH + 1).toString().padStart(2, '0')}:00:00`,
        ClienteId: clienteIdFinal,
        CanchaId: parseInt(selectedCancha.id)
      };

      if (reservaToEdit) {
        await reservaService.update(reservaToEdit.id, reservaPayload);
      } else {
        await reservaService.create(reservaPayload);
      }

      // Generar y guardar comprobante
      const html = generateComprobanteHtml(persona, selectedCancha, selectedDate, selectedHora, precioBase, metodoPago, socio, nombreUsuario);
      const fileName = `Comprobante-Reserva-${reservaToEdit ? 'Editada-' : ''}${persona.nombre}_${persona.apellido}-${selectedCancha.nombre}`.replace(/\s+/g, '_');
      await reportHistoryService.saveReporte(html, fileName);

      // Si es MercadoPago y es un cliente quien lo hace, iniciamos el flujo de la API y salimos
      const isAdminOrPersonal = currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL';
      
      if (metodoPago === 'MERCADOPAGO' && !isAdminOrPersonal) {
        const title = `Reserva Cancha ${selectedCancha.nombre}`;
        const mpResponse = await mercadoPagoService.createPreference(title, montoFinal);
        
        onClose();
        if (onReservaCreated) {
          onReservaCreated({
            html, fileName, persona, cancha: selectedCancha, fecha: selectedDate, 
            hora: selectedHora, montoFinal, metodoPago, isEdit: !!reservaToEdit,
            isMercadoPago: true
          });
        }
        
        // Redirigir a la URL de cobro
        if (Platform.OS === 'web') {
          window.location.href = mpResponse.initPoint;
        } else {
          const { Linking } = require('react-native');
          Linking.openURL(mpResponse.initPoint);
        }
        setIsLoading(false);
        return;
      }

      // Si es pago local (Efectivo o MercadoPago manejado por Admin), cerramos y notificamos
      onClose();
      if (onReservaCreated) {
        onReservaCreated({
          html,
          fileName,
          persona,
          cancha: selectedCancha,
          fecha: selectedDate,
          hora: selectedHora,
          montoFinal,
          metodoPago,
          isEdit: !!reservaToEdit
        });
      }
    } catch (error) {
      const msg = error.message || 'No se pudo registrar la reserva.';
      setErrorModalMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepLabel = () => {
    if (currentUserRole === 'CLIENTE') {
      switch (step) {
        case 1: return 'Paso 1 de 3';
        case 3: return 'Paso 2 de 3';
        case 4: return 'Paso 3 de 3';
        case 5: return 'Confirmación';
        default: return '';
      }
    }
    switch (step) {
      case 1: return 'Paso 1 de 4';
      case 2: return 'Paso 2 de 4';
      case 3: return 'Paso 3 de 4';
      case 4: return 'Paso 4 de 4';
      case 5: return 'Confirmación';
      default: return '';
    }
  };

  const canGoNext = () => {
    if (step === 1) return !!selectedCancha;
    return true;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={s.overlay}>
        <View style={s.container}>
          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.headerTitle}>NUEVA RESERVA</Text>
              <Text style={s.headerStep}>{getStepLabel()}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={28} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          {step <= 4 && (
            <View style={s.progressContainer}>
              {currentUserRole === 'CLIENTE' 
                ? [1, 3, 4].map((sVal, idx) => (
                    <View key={sVal} style={[s.progressDot, step >= sVal && s.progressDotActive]} />
                  ))
                : [1, 2, 3, 4].map(i => (
                    <View key={i} style={[s.progressDot, i <= step && s.progressDotActive]} />
                  ))
              }
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {step === 1 && (
              <StepCancha canchas={canchas} selectedCancha={selectedCancha} onSelect={setSelectedCancha} />
            )}
            {step === 2 && currentUserRole !== 'CLIENTE' && (
              <StepCliente
                mode={clienteMode} setMode={setClienteMode}
                clientes={clientes} selectedCliente={selectedCliente} setSelectedCliente={setSelectedCliente}
                invitado={invitado} setInvitado={setInvitado} errors={errors}
              />
            )}
            {step === 3 && (
              <StepDiaHorario
                selectedDate={selectedDate} setSelectedDate={setSelectedDate}
                selectedHora={selectedHora} setSelectedHora={setSelectedHora}
                reservasOcupadas={reservasActuales} canchaId={selectedCancha?.id} errors={errors}
              />
            )}
            {step === 4 && (
              <StepPago
                metodoPago={metodoPago} setMetodoPago={setMetodoPago}
                codigoVale={codigoVale} setCodigoVale={setCodigoVale}
                precioBase={getPrecioBase()} esSocio={esSocio()} errors={errors}
              />
            )}
            {step === 5 && (
              <StepConfirmacion
                cancha={selectedCancha} persona={getPersona()}
                fecha={selectedDate} hora={selectedHora}
                metodoPago={metodoPago} precioBase={getPrecioBase()} esSocio={esSocio()}
                currentUserRole={currentUserRole}
              />
            )}
          </ScrollView>

          {/* Footer buttons */}
          {step >= 1 && step <= 4 && (
            <View style={s.footerBtns}>
              {step > 1 ? (
                <TouchableOpacity style={s.backBtn} onPress={handleBack}>
                  <MaterialCommunityIcons name="arrow-left" size={20} color="#64748b" />
                  <Text style={s.backBtnText}>Atrás</Text>
                </TouchableOpacity>
              ) : <View />}
              <TouchableOpacity
                style={[s.nextBtn, !canGoNext() && s.nextBtnDisabled]}
                onPress={handleNext}
                disabled={!canGoNext()}
              >
                <Text style={s.nextBtnText}>Siguiente</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {step === 5 && (
            <View style={s.footerBtns}>
              <TouchableOpacity style={s.backBtn} onPress={handleBack}>
                <MaterialCommunityIcons name="arrow-left" size={20} color="#64748b" />
                <Text style={s.backBtnText}>Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-bold" size={20} color="#fff" />
                    <Text style={s.confirmBtnText}>Confirmar Reserva</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <ErrorModal 
        visible={!!errorModalMessage} 
        message={errorModalMessage} 
        onClose={() => setErrorModalMessage(null)} 
      />
    </Modal>
  );
}

// ─── ESTILOS ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 15 },
  container: { width: '100%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 28, padding: 22, maxHeight: '92%' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  headerStep: { fontSize: 11, fontWeight: '700', color: '#009b3a', marginTop: 2 },

  progressContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 18, gap: 8 },
  progressDot: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#e2e8f0' },
  progressDotActive: { backgroundColor: '#009b3a' },

  stepTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b', marginBottom: 6 },
  stepSubtitle: { fontSize: 12, color: '#94a3b8', marginBottom: 15, fontWeight: '600' },

  canchaBtn: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 15, marginBottom: 10, borderWidth: 2, borderColor: '#e2e8f0' },
  canchaBtnDisabled: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', opacity: 0.7 },
  canchaBtnSelected: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  canchaBtnInner: { flexDirection: 'row', alignItems: 'center' },
  canchaBtnName: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  canchaBtnType: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },
  canchaBtnPrice: { fontSize: 14, fontWeight: '900', color: '#009b3a' },
  mantenimientoText: { color: '#ef4444', fontWeight: '900', fontSize: 11, marginTop: 6, textAlign: 'center' },

  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, borderWidth: 2, borderColor: '#009b3a', gap: 8 },
  modeBtnActive: { backgroundColor: '#009b3a' },
  modeBtnText: { fontSize: 15, fontWeight: '800', color: '#009b3a' },

  fieldLabel: { fontSize: 12, fontWeight: '800', color: '#64748b', marginBottom: 6, marginTop: 10 },
  fieldInput: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 15, color: '#1e293b', fontWeight: '600', marginBottom: 4 },
  fieldInputError: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  errorText: { color: '#ef4444', fontSize: 12, fontWeight: '700', marginBottom: 6 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, marginBottom: 10 },
  searchInput: { flex: 1, padding: 12, fontSize: 15, color: '#1e293b', fontWeight: '600', outlineStyle: 'none' },

  clienteResult: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  clienteResultSelected: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  clienteResultName: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  clienteResultDni: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  noResultsText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: '600', marginVertical: 10 },

  selectedClienteCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 14, borderRadius: 14, marginTop: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  selectedClienteName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  selectedClienteInfo: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  socioBadge: { fontSize: 11, fontWeight: '900', color: '#009b3a', marginTop: 3 },

  dayScrollRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  dayArrowBtn: { padding: 4, backgroundColor: '#f0fdf4', borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' },
  dayBtn: { width: 70, paddingVertical: 12, borderRadius: 14, backgroundColor: '#f8fafc', alignItems: 'center', marginRight: 8, borderWidth: 2, borderColor: '#e2e8f0' },
  dayBtnSelected: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  dayBtnDow: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  dayBtnNum: { fontSize: 22, fontWeight: '900', color: '#1e293b', marginVertical: 2 },
  dayBtnMonth: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },

  horariosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  horaBtn: { width: '22%', paddingVertical: 12, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  horaBtnOcupada: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', opacity: 0.5 },
  horaBtnSelected: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  horaBtnText: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  horaBtnOcupadaLabel: { fontSize: 8, fontWeight: '700', color: '#cbd5e1', marginTop: 2 },

  pagoBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#009b3a', gap: 4 },
  pagoBtnActive: { backgroundColor: '#009b3a' },
  pagoBtnActiveMP: { backgroundColor: '#f0f9ff', borderColor: '#009ee3' },
  pagoBtnText: { fontSize: 13, fontWeight: '800', color: '#1e293b' },
  pagoBtnSub: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },

  resumenPago: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 18, marginTop: 18, borderWidth: 1, borderColor: '#e2e8f0' },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resumenLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  resumenValue: { fontSize: 14, color: '#1e293b', fontWeight: '800' },
  descuentoLabel: { fontSize: 12, color: '#ef4444', fontWeight: '700' },
  descuentoValue: { fontSize: 13, color: '#ef4444', fontWeight: '800' },
  resumenDivider: { height: 2, backgroundColor: '#e2e8f0', marginVertical: 10 },
  totalLabel: { fontSize: 14, fontWeight: '900', color: '#1e293b' },
  totalValue: { fontSize: 20, fontWeight: '900', color: '#009b3a' },

  confirmIcon: { alignItems: 'center', marginBottom: 10 },
  confirmTitle: { fontSize: 17, fontWeight: '900', color: '#1e293b', textAlign: 'center', marginBottom: 18 },
  confirmCard: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#e2e8f0' },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  confirmLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  confirmValue: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  confirmTotalValue: { fontSize: 18, fontWeight: '900', color: '#009b3a' },

  footerBtns: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  backBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 5 },
  backBtnText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#009b3a', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, gap: 8 },
  nextBtnDisabled: { backgroundColor: '#cbd5e1' },
  nextBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#009b3a', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, gap: 8 },
  confirmBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, gap: 4, alignSelf: 'flex-start' },
  badgeApto: { backgroundColor: '#d1fae5' },
  badgeTextApto: { color: '#059669', fontSize: 10, fontWeight: '800' },
  badgeSocio: { backgroundColor: '#fef3c7' },
  badgeTextSocio: { color: '#d97706', fontSize: 10, fontWeight: '800' }
});