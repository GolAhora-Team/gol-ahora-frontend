import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { mercadoPagoService } from '../services/mercadoPagoService';

export default function CobroMembresiaModal({ visible, onClose, onSuccess, precioBase = 2000 }) {
  const [metodoPago, setMetodoPago] = useState(null);
  
  // States for Mercado Pago QR
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [externalReference, setExternalReference] = useState('');
  const [isLoadingMP, setIsLoadingMP] = useState(false);

  useEffect(() => {
    if (visible) {
      setMetodoPago(null);
      setQrModalVisible(false);
      setQrUrl('');
      setExternalReference('');
      setIsLoadingMP(false);
    }
  }, [visible]);

  // Polling loop for automatic QR detection
  useEffect(() => {
    let interval;
    if (qrModalVisible && externalReference) {
      interval = setInterval(async () => {
        try {
          const isApproved = await mercadoPagoService.checkPaymentStatus(externalReference);
          if (isApproved) {
            clearInterval(interval);
            setQrModalVisible(false);
            onSuccess('MERCADOPAGO');
          }
        } catch (e) {
          console.error("Error comprobando pago:", e);
        }
      }, 5000); // Check every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [qrModalVisible, externalReference, onSuccess]);

  const handleConfirm = async () => {
    if (metodoPago === 'EFECTIVO') {
      onSuccess('EFECTIVO');
    } else if (metodoPago === 'MERCADOPAGO') {
      setIsLoadingMP(true);
      try {
        const title = `Membresía Presencial Socio Activo`;
        const mpResponse = await mercadoPagoService.createPreference(title, precioBase);
        setQrUrl(mpResponse.initPoint);
        if (mpResponse.externalReference) {
          setExternalReference(mpResponse.externalReference);
        }
        setQrModalVisible(true);
      } catch (error) {
        console.error(error);
        alert("Error al generar el cobro por Mercado Pago");
      } finally {
        setIsLoadingMP(false);
      }
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.container}>
          <Text style={s.title}>Cobrar Membresía Presencial</Text>
          <Text style={s.subtitle}>Total a cobrar: ${precioBase.toLocaleString('es-AR')}</Text>

          <Text style={s.label}>Seleccionar método de pago</Text>
          <View style={s.metodosRow}>
            {/* EFECTIVO */}
            <TouchableOpacity 
              style={[s.pagoBtn, metodoPago === 'EFECTIVO' && s.pagoBtnActiveEfectivo]}
              onPress={() => setMetodoPago('EFECTIVO')}
            >
              <MaterialCommunityIcons name="cash-multiple" size={28} color={metodoPago === 'EFECTIVO' ? '#fff' : '#009b3a'} />
              <Text style={[s.pagoBtnText, metodoPago === 'EFECTIVO' && { color: '#fff' }]}>Efectivo</Text>
            </TouchableOpacity>

            {/* MERCADOPAGO */}
            <TouchableOpacity 
              style={[s.pagoBtn, metodoPago === 'MERCADOPAGO' && s.pagoBtnActiveMP]}
              onPress={() => setMetodoPago('MERCADOPAGO')}
            >
              <MaterialCommunityIcons name="qrcode-scan" size={28} color={metodoPago === 'MERCADOPAGO' ? '#009ee3' : '#64748b'} />
              <Text style={[s.pagoBtnText, metodoPago === 'MERCADOPAGO' && { color: '#009ee3' }]}>Mercado Pago</Text>
              <Text style={[s.pagoBtnSub, metodoPago === 'MERCADOPAGO' && { color: '#38bdf8' }]}>QR / App</Text>
            </TouchableOpacity>
          </View>

          <View style={s.btnRow}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelText}>CANCELAR</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[s.confirmBtn, !metodoPago && s.confirmBtnDisabled]} 
              onPress={handleConfirm}
              disabled={!metodoPago || isLoadingMP}
            >
              {isLoadingMP ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.confirmText}>CONFIRMAR COBRO</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* QR Sub-Modal */}
      <Modal visible={qrModalVisible} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.qrModalContainer}>
            <Text style={s.qrModalTitle}>Cobro con Código QR</Text>
            <Text style={s.qrModalText}>Pedile al cliente que escanee este código desde su app de Mercado Pago o cámara.</Text>
            
            <View style={s.qrBox}>
              {qrUrl ? (
                <QRCode value={qrUrl} size={220} />
              ) : (
                <ActivityIndicator size="large" color="#009ee3" />
              )}
            </View>

            <TouchableOpacity 
              style={s.qrConfirmBtn} 
              onPress={() => {
                 setQrModalVisible(false);
                 onSuccess('MERCADOPAGO');
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: '#fff', borderRadius: 24, padding: 25, width: '90%', maxWidth: 450 },
  title: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 5, textAlign: 'center' },
  subtitle: { fontSize: 16, fontWeight: '700', color: '#009b3a', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '800', color: '#64748b', marginBottom: 12, textAlign: 'center' },
  
  metodosRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  pagoBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#e2e8f0', gap: 4 },
  pagoBtnActiveEfectivo: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  pagoBtnActiveMP: { backgroundColor: '#f0f9ff', borderColor: '#009ee3' },
  pagoBtnText: { fontSize: 13, fontWeight: '800', color: '#1e293b' },
  pagoBtnSub: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },

  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: { padding: 15, borderRadius: 12, flex: 0.45, alignItems: 'center', backgroundColor: '#f1f5f9' },
  cancelText: { color: '#64748b', fontWeight: '800' },
  confirmBtn: { backgroundColor: '#009b3a', padding: 15, borderRadius: 12, flex: 0.45, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#cbd5e1' },
  confirmText: { color: '#fff', fontWeight: '900' },

  qrModalContainer: { width: '90%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' },
  qrModalTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 10 },
  qrModalText: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  qrBox: { width: 240, height: 240, backgroundColor: '#f8fafc', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  qrConfirmBtn: { backgroundColor: '#009b3a', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, width: '100%', alignItems: 'center', marginBottom: 12 },
  qrConfirmBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  qrCancelBtn: { paddingVertical: 12, paddingHorizontal: 24, width: '100%', alignItems: 'center' },
  qrCancelBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 15 }
});
