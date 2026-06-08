import React, { useState, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { userService } from '../services/userService';
import { equipoService } from '../services/equipoService';

export default function ClienteInvitarJugadorModal({ visible, onClose, equipo, idUsuario, onSuccess }) {
  const [username, setUsername] = useState('');
  const [searching, setSearching] = useState(false);
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [enviandoId, setEnviandoId] = useState(null);
  const [enviado, setEnviado] = useState(false);
  const debounceRef = useRef(null);

  const handleChangeUsername = (text) => {
    setUsername(text);
    setUsuarioEncontrado(null);
    setHasSearched(false);
    setEnviado(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length > 0) {
      debounceRef.current = setTimeout(() => buscarUsername(text.trim()), 500);
    }
  };

  const buscarUsername = async (uname) => {
    setSearching(true);
    try {
      const data = await userService.buscarPorUsername(uname);
      const exactMatch = (data.resultados || []).find(u => u.username.toLowerCase() === uname.toLowerCase());
      setUsuarioEncontrado(exactMatch || null);
    } catch (err) {
      setUsuarioEncontrado(null);
    } finally {
      setSearching(false);
      setHasSearched(true);
    }
  };

  const handleEnviarInvitacion = async (res) => {
    if (!res?.username || !equipo?.id) return;
    setEnviandoId(res.usuarioId);
    try {
      await equipoService.invitarJugador(equipo.id, {
        username: res.username,
        invitadoPorUsuarioId: idUsuario
      });
      setEnviado(true);
      Alert.alert('¡Éxito!', `Se envió la invitación a ${res.nombre} para unirse al equipo "${equipo.nombre}".`);
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err?.mensaje || err?.message || 'No se pudo enviar la invitación';
      Alert.alert('Error', msg);
    } finally {
      setEnviandoId(null);
    }
  };

  const handleClose = () => {
    setUsername('');
    setUsuarioEncontrado(null);
    setHasSearched(false);
    setEnviandoId(null);
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
              placeholder="Escribe el nombre de usuario exacto..."
              placeholderTextColor="#94a3b8"
              value={username}
              onChangeText={handleChangeUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searching && <ActivityIndicator size="small" color="#009b3a" />}
            {!searching && hasSearched && username.trim().length > 0 && usuarioEncontrado && (
              <MaterialCommunityIcons name="check-circle" size={24} color="#16a34a" />
            )}
            {!searching && hasSearched && username.trim().length > 0 && !usuarioEncontrado && (
              <MaterialCommunityIcons name="close-circle" size={24} color="#ef4444" />
            )}
          </View>

          {/* Resultado de búsqueda exacta */}
          {!searching && hasSearched && username.trim().length > 0 && usuarioEncontrado && (
            <View style={[s.resultCard, s.resultOk, { padding: 10, marginBottom: 15 }]}>
              <MaterialCommunityIcons name="account-circle" size={32} color="#15803d" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.resultName}>{usuarioEncontrado.nombre}</Text>
                <Text style={s.resultUsername}>@{usuarioEncontrado.username}</Text>
              </View>
              <TouchableOpacity 
                style={[s.sendBtn, { marginBottom: 0, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, gap: 5 }]}
                onPress={() => handleEnviarInvitacion(usuarioEncontrado)}
                disabled={enviandoId === usuarioEncontrado.usuarioId || enviado}
              >
                {enviandoId === usuarioEncontrado.usuarioId ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="send" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>INVITAR</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {!searching && hasSearched && username.trim().length > 0 && !usuarioEncontrado && (
              <View style={[s.resultCard, s.resultError]}>
                <MaterialCommunityIcons name="account-alert" size={24} color="#ef4444" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.resultErrorText}>El nombre de usuario ingresado no existe.</Text>
                </View>
              </View>
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
