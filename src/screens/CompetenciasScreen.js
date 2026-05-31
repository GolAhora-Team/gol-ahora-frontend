import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import CompetenciaCard from '../components/CompetenciaCard';
import CompetenciaFormModal from '../components/CompetenciaFormModal';
import EquipoCard from '../components/EquipoCard';
import EquipoFormModal from '../components/EquipoFormModal';
import SuccessModal from '../components/SuccessModal';
import { competicionService } from '../services/competicionService';
import { equipoService } from '../services/equipoService';

export default function CompetenciasScreen({ route, navigation }) {
  const { role: currentUserRole } = route.params || { role: "ADMIN", nombreUsuario: "Julián" };

  const [activeTab, setActiveTab] = useState('COMPETENCIAS');
  const [competencias, setCompetencias] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [misInscripciones, setMisInscripciones] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const initialForm = { nombre: '', tipo: 'LIGA', premio: '', maxEquipos: '10', fechaInicio: '' };
  const [formData, setFormData] = useState(initialForm);

  const [equipoModalVisible, setEquipoModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const isStaff = currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL';
  const canCreateEquipo = currentUserRole !== 'PROFE';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await competicionService.getAll();
      const mapped = (data || []).map(c => ({ ...c, id: c.id?.toString() }));
      setCompetencias(mapped);

      const eqData = await equipoService.getAll();
      const mappedEq = (eqData || []).map(e => ({ ...e, id: e.id?.toString() }));
      setEquipos(mappedEq);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.nombre || !formData.fechaInicio) {
      return Alert.alert("Atención", "El nombre y la fecha de inicio son obligatorios");
    }
    try {
      const result = await competicionService.create(formData);
      const nueva = { ...formData, id: result?.id?.toString() || Date.now().toString(), estado: 'inscripcion', inscriptos: 0 };
      setCompetencias(prev => [...prev, nueva]);
      setFormData(initialForm);
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo crear la competencia.');
    }
  };

  const handleCreateEquipo = async (equipoFormData) => {
    try {
      const result = await equipoService.create(equipoFormData);
      const nuevo = { ...equipoFormData, id: result?.id?.toString() || Date.now().toString() };
      setEquipos(prev => [...prev, nuevo]);
      setEquipoModalVisible(false);
      setSuccessModalVisible(true);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo crear el equipo.');
    }
  };

  const handleInscripcion = (item) => {
    if (item.inscriptos >= parseInt(item.maxEquipos)) {
      return Alert.alert("Cupo Lleno", "Ya no quedan lugares disponibles.");
    }
    Alert.alert(
      "Inscripción",
      `¿Deseas anotarte en ${item.nombre}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "CONFIRMAR", 
          onPress: () => {
            setCompetencias(prev => prev.map(c => c.id === item.id ? { ...c, inscriptos: Number(c.inscriptos) + 1 } : c));
            setMisInscripciones(prev => [...prev, item.id]);
            Alert.alert("¡Éxito!", "Inscripción registrada.");
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#009b3a" />
          <Text style={{ color: '#fff', marginTop: 10, fontWeight: '600' }}>Cargando datos...</Text>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
      <View style={styles.monitorSection}>
        <Text style={styles.sectionTitle}>TABLERO DE COMPETENCIAS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {competencias.map(c => (
            <View key={c.id} style={styles.monitorCard}>
              <MaterialCommunityIcons name={c.tipo === 'LIGA' ? "format-list-numbered" : "tournament"} size={22} color="#ffb300" />
              <Text style={styles.monitorTitle}>{c.nombre}</Text>
              <Text style={styles.monitorSub}>{c.inscriptos} / {c.maxEquipos} EQUIPOS</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'COMPETENCIAS' && styles.tabBtnActive]} onPress={() => setActiveTab('COMPETENCIAS')}>
          <Text style={[styles.tabText, activeTab === 'COMPETENCIAS' && styles.tabTextActive]}>Competencias</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'EQUIPOS' && styles.tabBtnActive]} onPress={() => setActiveTab('EQUIPOS')}>
          <Text style={[styles.tabText, activeTab === 'EQUIPOS' && styles.tabTextActive]}>Equipos</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'COMPETENCIAS' ? (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.mainTitle}>Ligas y Torneos</Text>
            {isStaff && (
              <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
                <Text style={styles.addButtonText}>NUEVA</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {competencias.map(item => (
              <CompetenciaCard 
                key={item.id} 
                item={item} 
                canModify={isStaff}
                yaInscripto={misInscripciones.includes(item.id)}
                onInscribir={() => handleInscripcion(item)}
                onDelete={async () => {
                  try {
                    await competicionService.delete(item.id);
                    setCompetencias(prev => prev.filter(c => c.id !== item.id));
                  } catch (error) {
                    Alert.alert('Error', error.message || 'No se pudo eliminar la competencia.');
                  }
                }}
              />
            ))}
          </ScrollView>
        </>
      ) : (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.mainTitle}>Equipos Registrados</Text>
            {canCreateEquipo && (
              <TouchableOpacity style={styles.addButton} onPress={() => setEquipoModalVisible(true)}>
                <MaterialCommunityIcons name="account-group" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Agregar Equipo</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {equipos.map(item => (
              <EquipoCard 
                key={item.id} 
                item={item} 
                canModify={isStaff}
                onDelete={async () => {
                  try {
                    await equipoService.delete(item.id);
                    setEquipos(prev => prev.filter(e => e.id !== item.id));
                  } catch (error) {
                    Alert.alert('Error', error.message || 'No se pudo eliminar el equipo.');
                  }
                }}
              />
            ))}
            {equipos.length === 0 && (
              <Text style={{color: '#94a3b8', textAlign: 'center', marginTop: 20}}>No hay equipos registrados.</Text>
            )}
          </ScrollView>
        </>
      )}

      <CompetenciaFormModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        formData={formData} 
        setFormData={setFormData} 
        onSave={handleCreate} 
      />

      <EquipoFormModal 
        visible={equipoModalVisible}
        onClose={() => setEquipoModalVisible(false)}
        onSave={handleCreateEquipo}
        competencias={competencias}
      />

      <SuccessModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        title="¡Equipo Registrado!"
        message="El equipo fue creado y registrado exitosamente en la competencia."
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  monitorSection: { marginBottom: 30 },
  sectionTitle: { color: '#94a3b8', fontWeight: '900', fontSize: 11, letterSpacing: 1.5, marginBottom: 15 },
  monitorCard: { backgroundColor: '#004d1a', padding: 15, borderRadius: 20, marginRight: 12, minWidth: 160, borderWidth: 1, borderColor: '#009b3a' },
  monitorTitle: { color: '#fff', fontWeight: '900', fontSize: 13, marginTop: 5 },
  monitorSub: { color: '#ffb300', fontWeight: '800', fontSize: 10, marginTop: 2 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  tabText: { fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#009b3a', fontWeight: '900' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mainTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  addButton: { backgroundColor: '#009b3a', flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  addButtonText: { fontWeight: '900', marginLeft: 6, color: '#fff' },
});