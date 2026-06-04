import React, { useState, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { userService } from '../services/userService';
import { equipoService } from '../services/equipoService';

export default function ClienteInvitarJugadorModal({ visible, onClose, equipo, idUsuario, onSuccess }) {
  const [username, setUsername] = useState('');
  const [searching, setSearching] = useState(false);
  const [resultado, setResultado] = useState(null); // { existe, nombre, usuarioId, ... }
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const debounceRef = useRef(null);

  const handleChangeUsername = (text) => {
    setUsername(text);
    setResultado(null);
    setEnviado(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length >= 3) {
      debounceRef.current = setTimeout(() => buscarUsername(text.trim()), 500);
    }
  };

  const buscarUsername = async (uname) => {
    setSearching(true);
    try {
      const data = await userService.buscarPorUsername(uname);
      setResultado(data);
    } catch (err) {
      setResultado({ existe: false });
    } finally {
      setSearching(false);
    }
  };

  const handleEnviarInvitacion = async () => {
    if (!resultado?.existe || !equipo?.id) return;
    setEnviando(true);
    try {
      await equipoService.invitarJugador(equipo.id, {
        username: username.trim(),
        invitadoPorUsuarioId: idUsuario
      });
      setEnviado(true);
      Alert.alert('¡Éxito!', `Se envió la invitación a ${resultado.nombre} para unirse al equipo "${equipo.nombre}".`);
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err?.mensaje || err?.message || 'No se pudo enviar la invitación';
      Alert.alert('Error', msg);
    } finally {
      setEnviando(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setResultado(null);
    setEnviado(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={s.overlay}>
        <View style={s.container}>
          <View style={s.header}>
            <View>
              <Text style={s.headerTitle}>INVITAR JUGADOR</Text>
              <Text style={s.headerSub}>Equipo: {equipo?.nombre}</Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <MaterialCommunityIcons name="close" size={28} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <Text style={s.label}>Nombre de usuario</Text>
          <View style={s.inputRow}>
            <MaterialCommunityIcons name="account-search" size={20} color="#94a3b8" />
            <TextInput
              style={s.input}
              placeholder="Escribí el nombre de usuario..."
              placeholderTextColor="#94a3b8"
              value={username}
              onChangeText={handleChangeUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searching && <ActivityIndicator size="small" color="#009b3a" />}
          </View>

          {/* Resultado de búsqueda */}
          {resultado && !searching && (
            <View style={[s.resultCard, resultado.existe ? s.resultOk : s.resultError]}>
              <MaterialCommunityIcons 
                name={resultado.existe ? "account-check" : "account-alert"} 
                size={24} 
                color={resultado.existe ? "#16a34a" : "#ef4444"} 
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                {resultado.existe ? (
                  <>
                    <Text style={s.resultName}>{resultado.nombre}</Text>
                    <Text style={s.resultUsername}>@{resultado.username}</Text>
                  </>
                ) : (
                  <Text style={s.resultErrorText}>
                    {resultado.mensaje || 'No se encontró un cliente con ese nombre de usuario'}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Botón de enviar */}
          {resultado?.existe && !enviado && (
            <TouchableOpacity 
              style={s.sendBtn} 
              onPress={handleEnviarInvitacion}
              disabled={enviando}
            >
              {enviando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={20} color="#fff" />
                  <Text style={s.sendBtnText}>ENVIAR INVITACIÓN</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {enviado && (
            <View style={s.sentCard}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#16a34a" />
              <Text style={s.sentText}>Invitación enviada correctamente</Text>
            </View>
          )}

          <View style={{ height: 10 }} />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 15 },
  container: { width: '100%', maxWidth: 450, backgroundColor: '#fff', borderRadius: 28, padding: 25 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  headerSub: { fontSize: 12, fontWeight: '700', color: '#009b3a', marginTop: 2 },
  label: { fontSize: 12, fontWeight: '800', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 15, paddingVertical: 4, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15 },
  input: { flex: 1, height: 44, marginLeft: 10, color: '#1e293b', fontSize: 14, fontWeight: '600' },
  resultCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 14, marginBottom: 15, borderWidth: 1 },
  resultOk: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  resultError: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  resultName: { fontSize: 15, fontWeight: '800', color: '#15803d' },
  resultUsername: { fontSize: 12, fontWeight: '600', color: '#64748b', marginTop: 2 },
  resultErrorText: { fontSize: 13, fontWeight: '700', color: '#dc2626' },
  sendBtn: { backgroundColor: '#009b3a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 14, gap: 8, marginBottom: 10 },
  sendBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  sentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 15, borderRadius: 14, gap: 10, borderWidth: 1, borderColor: '#bbf7d0' },
  sentText: { fontSize: 14, fontWeight: '800', color: '#15803d' }
});
