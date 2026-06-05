import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { clienteService } from '../services/clienteService';
import { claseService } from '../services/claseService';
import { entrenamientoService } from '../services/entrenamientoService';
import { descuentoService } from '../services/descuentoService';
import { mercadoPagoService } from '../services/mercadoPagoService';
import { facturaService } from '../services/facturaService';
import { pagoService } from '../services/pagoService';
import { reportHistoryService } from '../services/reportHistoryService';
import QRCode from 'react-native-qrcode-svg';

export default function InscripcionPagoModal({ visible, onClose, actividad, currentUserRole, idPersona, nombreUsuario, onSuccess }) {
  const [step, setStep] = useState(1);
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [metodoPago, setMetodoPago] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pctSocio, setPctSocio] = useState(10);
  const [pctEfectivo, setPctEfectivo] = useState(10);

  // States for Admin QR Modal
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [pendingAdminPayload, setPendingAdminPayload] = useState(null);
  const [externalReference, setExternalReference] = useState('');

  const isAdminOrPersonal = currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL';
  const precio = actividad?.precio || 5000;

  useEffect(() => {
    if (visible) {
      setStep(1);
      setSelectedCliente(null);
      setMetodoPago(null);
      setSearchTerm('');
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load discounts
      try {
        const descs = await descuentoService.getAll();
        const socio = descs.find(d => d.nombre.toLowerCase() === 'socio');
        const efectivo = descs.find(d => d.nombre.toLowerCase() === 'efectivo');
        if (socio) setPctSocio(socio.porcentaje);
        if (efectivo) setPctEfectivo(efectivo.porcentaje);
      } catch (e) { /* use defaults */ }

      if (isAdminOrPersonal) {
        const data = await clienteService.getAll();
        setClientes(data || []);
      } else {
        // Cliente se auto-inscribe
        const data = await clienteService.getAll();
        const found = data?.find(c => c.id === idPersona || `${c.nombre} ${c.apellido || ''}`.trim() === nombreUsuario);
        if (found) setSelectedCliente(found);
        setClientes(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredClientes = searchTerm.length >= 2
    ? clientes.filter(c => {
        const fullname = `${c.nombre} ${c.apellido || ''}`.toLowerCase();
        const dni = c.dni ? c.dni.toString() : '';
        return fullname.includes(searchTerm.toLowerCase()) || dni.includes(searchTerm);
      })
    : [];

  const esSocio = selectedCliente?.esSocioActivo || false;
  const descEfectivo = metodoPago === 'EFECTIVO' ? precio * (pctEfectivo / 100) : 0;
  const descSocio = esSocio ? precio * (pctSocio / 100) : 0;
  const montoFinal = precio - descEfectivo - descSocio;

  const handleNext = () => {
    if (step === 1 && isAdminOrPersonal) {
      if (!selectedCliente) {
        Alert.alert('Atención', 'Seleccioná un alumno.');
        return;
      }
      setStep(2);
    } else if (step === 1 && !isAdminOrPersonal) {
      // Cliente directo → paso pago
      setMetodoPago('MERCADOPAGO');
      setStep(3);
    } else if (step === 2) {
      if (!metodoPago) {
        Alert.alert('Atención', 'Seleccioná un método de pago.');
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 3 && !isAdminOrPersonal) setStep(1);
    else if (step > 1) setStep(step - 1);
  };

  const generateComprobanteHtml = (persona, actividadObj, montoFinal, metodo, esSocioActivo, pctEfectivo, pctSocio) => {
    const descEfectivo = metodo === 'EFECTIVO' ? actividadObj.precio * (pctEfectivo / 100) : 0;
    const descSocio = esSocioActivo ? actividadObj.precio * (pctSocio / 100) : 0;
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
            <p class="sub">COMPROBANTE DE INSCRIPCIÓN</p>
          </div>
          <div class="container">
            <div class="row"><span class="label">Alumno</span> <span class="value">${persona.nombre} ${persona.apellido}</span></div>
            <div class="row"><span class="label">DNI</span> <span class="value">${persona.dni}</span></div>
            <div class="row"><span class="label">Actividad</span> <span class="value">${actividadObj.nombre} (${actividadObj.tipo})</span></div>
            <div class="row"><span class="label">Horario</span> <span class="value">${actividadObj.horario || 'Sin definir'}</span></div>
            <div class="row"><span class="label">Método de pago</span> <span class="value">${metodo === 'EFECTIVO' ? 'Efectivo' : 'Mercado Pago'}</span></div>
            <div class="row"><span class="label">Monto original</span> <span class="value">$${actividadObj.precio.toLocaleString('es-AR')}</span></div>
            ${descEfectivo > 0 ? `<div class="row"><span class="label discount">Desc. ${pctEfectivo}% efectivo</span> <span class="discount">-$${descEfectivo.toLocaleString('es-AR')}</span></div>` : ''}
            ${descSocio > 0 ? `<div class="row"><span class="label discount">Desc. ${pctSocio}% socio activo</span> <span class="discount">-$${descSocio.toLocaleString('es-AR')}</span></div>` : ''}
            <p class="total">TOTAL: $${montoFinal.toLocaleString('es-AR')}</p>
          </div>
          <div class="footer">
            Emitido el ${now.toLocaleDateString('es-AR')} a las ${now.toLocaleTimeString('es-AR')}
          </div>
        </body>
      </html>
    `;
  };

  const createPayment = async (clienteId, montoFinal, estadoPago) => {
    let createdPagoId = null;
    let createdFacturaId = null;
    try {
      const facturaPayload = {
        fechaEmision: new Date().toISOString(),
        total: montoFinal,
        clienteId: clienteId
      };
      const factura = await facturaService.create(facturaPayload);
      
      const facturaId = factura?.id || factura?.Id;
      createdFacturaId = facturaId;
      if (facturaId) {
        const metodoNum = metodoPago === 'EFECTIVO' ? 1 : 2; // MERCADOPAGO → Tarjeta (2)
        const pagoPayload = {
          fechaPago: new Date().toISOString(),
          monto: montoFinal,
          metodo: metodoNum,
          estado: estadoPago, // 1=Pendiente, 2=Pagado
          facturaId: facturaId
        };
        const pagoResp = await pagoService.create(pagoPayload);
        createdPagoId = pagoResp?.id || pagoResp?.Id;
      }
    } catch (e) {
      console.warn("No se pudo registrar la factura/pago:", e);
    }
    return { createdFacturaId, createdPagoId };
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const clienteId = selectedCliente?.id;
      if (!clienteId) {
        Alert.alert('Error', 'No se pudo determinar el cliente.');
        return;
      }

      // Generar Comprobante HTML
      const html = generateComprobanteHtml(selectedCliente, actividad, montoFinal, metodoPago, selectedCliente?.esSocioActivo, pctEfectivo, pctSocio);
      const fileName = `Comprobante-Inscripcion-${selectedCliente.nombre}_${selectedCliente.apellido}-${actividad.nombre}`.replace(/\s+/g, '_');
      
      try {
        await reportHistoryService.saveReporte(html, fileName);
      } catch (e) {
        console.warn("No se pudo guardar el historial del reporte:", e);
      }

      // MercadoPago flow for clients
      if (metodoPago === 'MERCADOPAGO' && !isAdminOrPersonal) {
        const { createdFacturaId, createdPagoId } = await createPayment(clienteId, montoFinal, 1); // 1 = Pendiente
        
        try {
          const mpTitle = `Inscripción ${actividad.nombre}`;
          const baseUrl = window.location.href.split('?')[0];
          const currentUrl = baseUrl + '?mp_return=true';
          const webhookUrl = `http://golahora.runasp.net/api/MercadoPago/webhook`;
          
          const mpResponse = await mercadoPagoService.createPreference(
            mpTitle, 
            montoFinal, 
            currentUrl,
            webhookUrl,
            createdFacturaId ? createdFacturaId.toString() : null
          );
          
          if (Platform.OS === 'web') {
            window.location.href = mpResponse.initPoint;
            return;
          } else {
            const { Linking } = require('react-native');
            Linking.openURL(mpResponse.initPoint);
            setIsSubmitting(false);
            return;
          }
        } catch (mpError) {
          console.error('Error MP:', mpError);
        }
      }

      // MercadoPago flow for Admin (QR Code)
      if (metodoPago === 'MERCADOPAGO' && isAdminOrPersonal) {
        const { createdFacturaId, createdPagoId } = await createPayment(clienteId, montoFinal, 1); // 1 = Pendiente
        
        const mpTitle = `Inscripción ${actividad.nombre}`;
        const webhookUrl = `http://golahora.runasp.net/api/MercadoPago/webhook`;
        
        const mpResponse = await mercadoPagoService.createPreference(
          mpTitle, 
          montoFinal, 
          null, 
          webhookUrl, 
          createdFacturaId ? createdFacturaId.toString() : null
        );
        
        setQrUrl(mpResponse.initPoint);
        const refForPolling = mpResponse.externalReference || (createdFacturaId ? createdFacturaId.toString() : null);
        if (refForPolling) {
          setExternalReference(refForPolling);
        }
        
        // Inscribir al cliente primero
        if (actividad.tipo === 'CLASE') {
          await claseService.addCliente(actividad.id, clienteId);
        } else if (actividad.tipo === 'ENTRENAMIENTO') {
          await entrenamientoService.addCliente(actividad.id, clienteId);
        }

        setPendingAdminPayload({ facturaId: createdFacturaId, pagoId: createdPagoId });
        setQrModalVisible(true);
        setIsSubmitting(false);
        return;
      }

      // Efectivo Flow
      await createPayment(clienteId, montoFinal, 2); // 2 = Pagado
      
      // Inscribir
      if (actividad.tipo === 'CLASE') {
        await claseService.addCliente(actividad.id, clienteId);
      } else if (actividad.tipo === 'ENTRENAMIENTO') {
        await entrenamientoService.addCliente(actividad.id, clienteId);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo completar la inscripción. Puede que el alumno ya esté inscripto o el cupo esté lleno.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={s.overlay}>
        <View style={s.container}>
          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.headerTitle}>INSCRIPCIÓN</Text>
              <Text style={s.headerSub}>{actividad?.nombre} ({actividad?.tipo})</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={28} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#009b3a" style={{ marginVertical: 40 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1 }}>
              
              {/* STEP 1: Seleccionar cliente (ADMIN) o resumen (CLIENTE) */}
              {step === 1 && (
                <View>
                  {/* Info de la actividad */}
                  <View style={s.activityCard}>
                    <View style={s.activityRow}>
                      <MaterialCommunityIcons name="soccer" size={20} color="#009b3a" />
                      <Text style={s.activityLabel}>{actividad?.nombre}</Text>
                    </View>
                    <View style={s.activityRow}>
                      <MaterialCommunityIcons name="clock-outline" size={16} color="#64748b" />
                      <Text style={s.activityDetail}>{actividad?.horario || 'Sin horario'}</Text>
                    </View>
                    <View style={s.activityRow}>
                      <MaterialCommunityIcons name="account-group" size={16} color="#64748b" />
                      <Text style={s.activityDetail}>Cupos: {actividad?.cupo || 0} / {actividad?.max || 20}</Text>
                    </View>
                    <View style={s.activityRow}>
                      <MaterialCommunityIcons name="cash" size={16} color="#16a34a" />
                      <Text style={[s.activityDetail, { color: '#16a34a', fontWeight: '900' }]}>${precio.toLocaleString('es-AR')}</Text>
                    </View>
                  </View>

                  {isAdminOrPersonal && (
                    <View>
                      <Text style={s.stepTitle}>Seleccionar Alumno</Text>
                      <View style={s.searchBox}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
                        <TextInput
                          style={s.searchInput}
                          placeholder="Buscar por DNI o nombre..."
                          placeholderTextColor="#94a3b8"
                          value={searchTerm}
                          onChangeText={setSearchTerm}
                        />
                      </View>

                      {filteredClientes.length > 0 && (
                        <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                          {filteredClientes.slice(0, 5).map(c => {
                            const isSelected = selectedCliente?.id === c.id;
                            const tieneApto = c.aptoFisico || c.tieneAptoMedicoArchivo;
                            return (
                              <TouchableOpacity
                                key={c.id}
                                style={[
                                  s.clienteItem, 
                                  isSelected && s.clienteItemSelected,
                                  !tieneApto && { opacity: 0.6, backgroundColor: '#fef2f2', borderColor: '#fca5a5' }
                                ]}
                                onPress={() => {
                                  if (!tieneApto) {
                                    Alert.alert('Apto Médico Faltante', 'Este cliente no tiene un apto médico cargado o está vencido. No se puede inscribir por normas del establecimiento.');
                                    return;
                                  }
                                  setSelectedCliente(c);
                                }}
                              >
                                <View>
                                  <Text style={[s.clienteName, isSelected && { color: '#fff' }]}>{c.nombre} {c.apellido}</Text>
                                  <Text style={[s.clienteDni, isSelected && { color: '#d1fae5' }]}>DNI: {c.dni}</Text>
                                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                                    {tieneApto ? (
                                      <View style={[s.socioBadge, { backgroundColor: '#059669' }]}>
                                        <Text style={s.socioBadgeText}>Apto Físico Válido</Text>
                                      </View>
                                    ) : (
                                      <View style={[s.socioBadge, { backgroundColor: '#ef4444' }]}>
                                        <Text style={s.socioBadgeText}>Sin Apto Físico</Text>
                                      </View>
                                    )}
                                    {c.esSocioActivo && (
                                      <View style={[s.socioBadge, { backgroundColor: '#d97706' }]}>
                                        <Text style={s.socioBadgeText}>SOCIO</Text>
                                      </View>
                                    )}
                                  </View>
                                </View>
                                {isSelected && <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />}
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      )}

                      {selectedCliente && (
                        <View style={s.selectedCard}>
                          <MaterialCommunityIcons name="account-check" size={20} color="#009b3a" />
                          <Text style={s.selectedName}>{selectedCliente.nombre} {selectedCliente.apellido}</Text>
                          {selectedCliente.esSocioActivo && (
                            <View style={s.socioBadge}>
                              <Text style={s.socioBadgeText}>SOCIO</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  )}

                  {!isAdminOrPersonal && selectedCliente && (
                    <View style={s.selectedCard}>
                      <MaterialCommunityIcons name="account" size={20} color="#009b3a" />
                      <Text style={s.selectedName}>{selectedCliente.nombre} {selectedCliente.apellido}</Text>
                      {selectedCliente.esSocioActivo && (
                        <View style={s.socioBadge}>
                          <Text style={s.socioBadgeText}>SOCIO</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* STEP 2: Método de pago (ADMIN) */}
              {step === 2 && (
                <View>
                  <Text style={s.stepTitle}>Método de Pago</Text>
                  <View style={s.pagoRow}>
                    <TouchableOpacity
                      style={[s.pagoBtn, metodoPago === 'EFECTIVO' && s.pagoBtnActive]}
                      onPress={() => setMetodoPago('EFECTIVO')}
                    >
                      <MaterialCommunityIcons name="cash-multiple" size={28} color={metodoPago === 'EFECTIVO' ? '#fff' : '#009b3a'} />
                      <Text style={[s.pagoBtnText, metodoPago === 'EFECTIVO' && { color: '#fff' }]}>Efectivo</Text>
                      <Text style={[s.pagoBtnSub, metodoPago === 'EFECTIVO' && { color: '#d1fae5' }]}>{pctEfectivo}% desc.</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.pagoBtn, metodoPago === 'MERCADOPAGO' && s.pagoBtnActiveMP]}
                      onPress={() => setMetodoPago('MERCADOPAGO')}
                    >
                      <MaterialCommunityIcons name="cellphone" size={28} color={metodoPago === 'MERCADOPAGO' ? '#009ee3' : '#64748b'} />
                      <Text style={[s.pagoBtnText, metodoPago === 'MERCADOPAGO' && { color: '#009ee3' }]}>MercadoPago</Text>
                      <Text style={s.pagoBtnSub}>Sin desc.</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Resumen de precio */}
                  <View style={s.resumenBox}>
                    <View style={s.resumenRow}>
                      <Text style={s.resumenLabel}>Precio inscripción</Text>
                      <Text style={s.resumenValue}>${precio.toLocaleString('es-AR')}</Text>
                    </View>
                    {descEfectivo > 0 && (
                      <View style={s.resumenRow}>
                        <Text style={s.descLabel}>Desc. {pctEfectivo}% efectivo</Text>
                        <Text style={s.descValue}>-${descEfectivo.toLocaleString('es-AR')}</Text>
                      </View>
                    )}
                    {descSocio > 0 && (
                      <View style={s.resumenRow}>
                        <Text style={s.descLabel}>Desc. {pctSocio}% socio</Text>
                        <Text style={s.descValue}>-${descSocio.toLocaleString('es-AR')}</Text>
                      </View>
                    )}
                    <View style={s.divider} />
                    <View style={s.resumenRow}>
                      <Text style={s.totalLabel}>TOTAL</Text>
                      <Text style={s.totalValue}>${montoFinal.toLocaleString('es-AR')}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* STEP 3: Confirmación */}
              {step === 3 && (
                <View>
                  <View style={{ alignItems: 'center', marginBottom: 15 }}>
                    <MaterialCommunityIcons name="help-circle-outline" size={50} color="#ffb300" />
                    <Text style={s.confirmTitle}>¿Confirmar inscripción?</Text>
                  </View>

                  <View style={s.confirmCard}>
                    <View style={s.confirmRow}>
                      <Text style={s.confirmLabel}>Actividad</Text>
                      <Text style={s.confirmValue}>{actividad?.nombre}</Text>
                    </View>
                    <View style={s.confirmRow}>
                      <Text style={s.confirmLabel}>Alumno</Text>
                      <Text style={s.confirmValue}>{selectedCliente?.nombre} {selectedCliente?.apellido}</Text>
                    </View>
                    <View style={s.confirmRow}>
                      <Text style={s.confirmLabel}>Método</Text>
                      <Text style={s.confirmValue}>{metodoPago === 'EFECTIVO' ? 'Efectivo' : 'MercadoPago'}</Text>
                    </View>
                    {descEfectivo > 0 && (
                      <View style={s.confirmRow}>
                        <Text style={s.descLabel}>Desc. {pctEfectivo}% efectivo</Text>
                        <Text style={s.descValue}>-${descEfectivo.toLocaleString('es-AR')}</Text>
                      </View>
                    )}
                    {descSocio > 0 && (
                      <View style={s.confirmRow}>
                        <Text style={s.descLabel}>Desc. {pctSocio}% socio</Text>
                        <Text style={s.descValue}>-${descSocio.toLocaleString('es-AR')}</Text>
                      </View>
                    )}
                    <View style={[s.confirmRow, { borderBottomWidth: 0 }]}>
                      <Text style={s.confirmLabel}>Monto</Text>
                      <Text style={[s.confirmValue, { color: '#009b3a', fontSize: 18 }]}>${montoFinal.toLocaleString('es-AR')}</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {/* Footer */}
          {!loading && step <= 2 && (
            <View style={s.footerBtns}>
              {step > 1 ? (
                <TouchableOpacity style={s.backBtn} onPress={handleBack}>
                  <MaterialCommunityIcons name="arrow-left" size={20} color="#64748b" />
                  <Text style={s.backBtnText}>Atrás</Text>
                </TouchableOpacity>
              ) : <View />}
              <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
                <Text style={s.nextBtnText}>Siguiente</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {!loading && step === 3 && (
            <View style={s.footerBtns}>
              <TouchableOpacity style={s.backBtn} onPress={handleBack}>
                <MaterialCommunityIcons name="arrow-left" size={20} color="#64748b" />
                <Text style={s.backBtnText}>Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm} disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-bold" size={20} color="#fff" />
                    <Text style={s.confirmBtnText}>Confirmar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <Modal visible={qrModalVisible} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.qrModalContainer}>
            <Text style={s.qrModalTitle}>Cobro con Código QR</Text>
            <Text style={s.qrModalText}>Pedile al alumno que escanee este código desde su app de Mercado Pago o cámara.</Text>
            
            <View style={s.qrBox}>
              {qrUrl ? (
                <QRCode value={qrUrl} size={220} />
              ) : (
                <ActivityIndicator size="large" color="#009ee3" />
              )}
            </View>

            <TouchableOpacity 
              style={s.qrConfirmBtn} 
              onPress={async () => {
                 setQrModalVisible(false);
                 if (pendingAdminPayload?.pagoId) {
                   try {
                     const pagos = await pagoService.getAll();
                     const pago = pagos.find(p => p.id === pendingAdminPayload.pagoId || p.Id === pendingAdminPayload.pagoId);
                     if (pago) {
                       await pagoService.update(pendingAdminPayload.pagoId, { ...pago, estado: 2 });
                     }
                   } catch (e) {
                     console.error("Error confirmando pago manual:", e);
                   }
                   onClose();
                   if (onSuccess) onSuccess();
                 }
              }}
            >
              <Text style={s.qrConfirmBtnText}>Marcar como Pagado</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={s.qrCancelBtn} onPress={() => setQrModalVisible(false)}>
              <Text style={s.qrCancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 15 },
  container: { width: '100%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 28, padding: 22, maxHeight: '92%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  headerSub: { fontSize: 12, fontWeight: '700', color: '#009b3a', marginTop: 2 },
  
  activityCard: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  activityLabel: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  activityDetail: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  
  stepTitle: { fontSize: 16, fontWeight: '900', color: '#1e293b', marginBottom: 10, marginTop: 5 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 15, borderRadius: 12, marginBottom: 10 },
  searchInput: { flex: 1, height: 45, marginLeft: 10, color: '#1e293b', fontSize: 14 },
  
  clienteItem: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clienteItemSelected: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  clienteName: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  clienteDni: { fontSize: 12, color: '#64748b', marginTop: 2 },
  
  selectedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 12, borderRadius: 12, marginTop: 10, gap: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  selectedName: { fontSize: 14, fontWeight: '800', color: '#15803d', flex: 1 },
  socioBadge: { backgroundColor: '#ffb300', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  socioBadgeText: { fontSize: 10, fontWeight: '900', color: '#fff' },
  
  pagoRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  pagoBtn: { flex: 1, padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#e2e8f0', alignItems: 'center' },
  pagoBtnActive: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  pagoBtnActiveMP: { borderColor: '#009ee3', backgroundColor: '#f0f9ff' },
  pagoBtnText: { fontSize: 14, fontWeight: '800', color: '#1e293b', marginTop: 6 },
  pagoBtnSub: { fontSize: 11, color: '#94a3b8', fontWeight: '700', marginTop: 2 },
  
  resumenBox: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resumenLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  resumenValue: { fontSize: 13, color: '#1e293b', fontWeight: '800' },
  descLabel: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
  descValue: { fontSize: 12, color: '#ef4444', fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  totalLabel: { fontSize: 15, fontWeight: '900', color: '#1e293b' },
  totalValue: { fontSize: 18, fontWeight: '900', color: '#009b3a' },
  
  confirmTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b', marginTop: 10 },
  confirmCard: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  confirmLabel: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  confirmValue: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  
  footerBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  backBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 5 },
  backBtnText: { color: '#64748b', fontWeight: '800' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#009b3a', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, gap: 5 },
  nextBtnText: { color: '#fff', fontWeight: '900' },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#009b3a', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, gap: 5 },
  confirmBtnText: { color: '#fff', fontWeight: '900' },
  
  qrModalContainer: { width: '90%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' },
  qrModalTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 10 },
  qrModalText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  qrBox: { width: 240, height: 240, backgroundColor: '#f8fafc', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  qrConfirmBtn: { backgroundColor: '#009b3a', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, width: '100%', alignItems: 'center', marginBottom: 10 },
  qrConfirmBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  qrCancelBtn: { paddingVertical: 14, paddingHorizontal: 24, width: '100%', alignItems: 'center' },
  qrCancelBtnText: { color: '#ef4444', fontWeight: '800', fontSize: 15 },
});
