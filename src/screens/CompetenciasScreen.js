import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import CompetenciaCard from '../components/CompetenciaCard';
import CompetenciaFormModal from '../components/CompetenciaFormModal';
import EquipoCard from '../components/EquipoCard';
import EquipoFormModal from '../components/EquipoFormModal';
import SuccessModal from '../components/SuccessModal';
import ConfirmModal from '../components/ConfirmModal';
import AddJugadoresModal from '../components/AddJugadoresModal';
import RemoveJugadoresModal from '../components/RemoveJugadoresModal';
import VerJugadoresModal from '../components/VerJugadoresModal';
import FormacionModal from '../components/FormacionModal';
import TorneoFixtureModal from '../components/TorneoFixtureModal';
import EnrollTeamModal from '../components/EnrollTeamModal';
import { competicionService } from '../services/competicionService';
import { equipoService } from '../services/equipoService';
import { jugadorService } from '../services/jugadorService';

export default function CompetenciasScreen({ route, navigation }) {
  const { role: currentUserRole } = route.params || { role: "ADMIN", nombreUsuario: "Julián" };

  const [activeTab, setActiveTab] = useState('COMPETENCIAS');
  const [competencias, setCompetencias] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [misInscripciones, setMisInscripciones] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const initialForm = { nombre: '', tipo: 'LIGA', premio: '', maxEquipos: '8', fechaInicio: '15/06/2026', descripcion: '' };
  const [formData, setFormData] = useState(initialForm);

  // Fixture / Enroll modals
  const [selectedCompeticion, setSelectedCompeticion] = useState(null);
  const [fixtureModalVisible, setFixtureModalVisible] = useState(false);
  const [enrollModalVisible, setEnrollModalVisible] = useState(false);
  const [competicionToEnroll, setCompeticionToEnroll] = useState(null);

  // Equipo modals
  const [equipoModalVisible, setEquipoModalVisible] = useState(false);
  const [editingEquipo, setEditingEquipo] = useState(null);

  // Success modal
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Delete confirm modal
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [equipoToDelete, setEquipoToDelete] = useState(null);

  // Jugadores modals
  const [addJugadoresVisible, setAddJugadoresVisible] = useState(false);
  const [removeJugadoresVisible, setRemoveJugadoresVisible] = useState(false);
  const [verJugadoresVisible, setVerJugadoresVisible] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState(null);

  // Formación modal
  const [formacionVisible, setFormacionVisible] = useState(false);
  const [equipoFormacion, setEquipoFormacion] = useState(null);

  const isStaff = currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL';
  const canCreateEquipo = currentUserRole !== 'PROFE';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await competicionService.getAll();
      const mapped = (data || []).map(c => ({
        id: c.id?.toString(),
        nombre: c.nombre,
        tipo: c.tipo === 1 ? 'LIGA' : 'TORNEO',
        descripcion: c.descripcion || '',
        maxEquipos: c.cantidadEquipos?.toString() || (c.tipo === 1 ? '20' : '16'),
        inscriptos: c.cantInscriptos || 0,
        estado: c.estado === 1 ? 'inscripcion' : (c.estado === 2 ? 'en_juego' : 'finalizada'),
        fechaInicio: '15/06/2026',
        premio: 'Trofeo + Medallas'
      }));
      setCompetencias(mapped);

      const eqData = await equipoService.getAll();
      const mappedEq = (eqData || []).map(e => ({ ...e, id: e.id?.toString() }));
      setEquipos(mappedEq);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  // ── Competencia handlers ──
  const handleCreate = async () => {
    if (!formData.nombre) {
      return Alert.alert("Atención", "El nombre es obligatorio");
    }

    const backendData = {
      Nombre: formData.nombre,
      Tipo: formData.tipo === 'LIGA' ? 1 : 2,
      Descripcion: formData.descripcion || '',
      CantidadEquipos: parseInt(formData.maxEquipos, 10)
    };

    try {
      const result = await competicionService.create(backendData);
      const nueva = { 
        id: result?.id?.toString() || Date.now().toString(),
        nombre: result?.nombre || formData.nombre,
        tipo: result?.tipo === 1 ? 'LIGA' : 'TORNEO',
        descripcion: result?.descripcion || formData.descripcion,
        maxEquipos: result?.cantidadEquipos?.toString() || formData.maxEquipos,
        inscriptos: result?.cantInscriptos || 0,
        estado: result?.estado === 1 ? 'inscripcion' : (result?.estado === 2 ? 'en_juego' : 'finalizada'),
        fechaInicio: formData.fechaInicio || '15/06/2026',
        premio: formData.premio || 'Trofeo'
      };
      setCompetencias(prev => [...prev, nueva]);
      setFormData(initialForm);
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo crear la competencia.');
    }
  };

  const handleInscripcion = (item) => {
    if (item.inscriptos >= parseInt(item.maxEquipos)) {
      return Alert.alert("Cupo Lleno", "Ya no quedan lugares disponibles.");
    }
    const availableEquipos = equipos.filter(e => !e.competicionId);
    if (availableEquipos.length === 0) {
      return Alert.alert("Atención", "No tienes equipos disponibles para inscribir. Crea un equipo primero que no esté en otra competición.");
    }
    setCompeticionToEnroll(item);
    setEnrollModalVisible(true);
  };

  const handleSelectEquipoParaInscribir = async (equipo) => {
    if (!competicionToEnroll) return;
    try {
      setLoading(true);
      await equipoService.update(equipo.id, { ...equipo, competicionId: competicionToEnroll.id });
      setCompetencias(prev => prev.map(c => c.id === competicionToEnroll.id ? { ...c, inscriptos: Number(c.inscriptos) + 1 } : c));
      setMisInscripciones(prev => [...prev, competicionToEnroll.id]);
      setEquipos(prev => prev.map(e => e.id === equipo.id ? { ...e, competicionId: competicionToEnroll.id } : e));
      setEnrollModalVisible(false);
      setCompeticionToEnroll(null);
      showSuccess('¡Inscripción Exitosa!', `El equipo ${equipo.nombre} ha sido inscrito en ${competicionToEnroll.nombre}.`);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo inscribir el equipo.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerFixture = (item) => {
    setSelectedCompeticion(item);
    setFixtureModalVisible(true);
  };

  // ── Equipo handlers ──
  const handleCreateEquipo = async (equipoFormData) => {
    try {
      const result = await equipoService.create(equipoFormData);
      const nuevo = { ...result, id: result?.id?.toString() || Date.now().toString() };
      setEquipos(prev => [...prev, nuevo]);
      setEquipoModalVisible(false);
      showSuccess('¡Equipo Registrado!', 'El equipo fue creado exitosamente.');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo crear el equipo.');
    }
  };

  const handleEditEquipo = (equipo) => {
    setEditingEquipo(equipo);
    setEquipoModalVisible(true);
  };

  const handleUpdateEquipo = async (equipoFormData) => {
    try {
      await equipoService.update(editingEquipo.id, equipoFormData);
      setEquipos(prev => prev.map(e => e.id === editingEquipo.id ? { ...e, ...equipoFormData } : e));
      setEquipoModalVisible(false);
      setEditingEquipo(null);
      showSuccess('¡Cambios Guardados!', 'El equipo se actualizó correctamente.');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el equipo.');
    }
  };

  const askDeleteEquipo = (equipo) => {
    setEquipoToDelete(equipo);
    setDeleteConfirmVisible(true);
  };

  const handleDeleteEquipo = async () => {
    if (!equipoToDelete) return;
    try {
      await equipoService.delete(equipoToDelete.id);
      setEquipos(prev => prev.filter(e => e.id !== equipoToDelete.id));
      showSuccess('Equipo Eliminado', `El equipo ${equipoToDelete.nombre} ha sido eliminado.`);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo eliminar el equipo.');
    }
  };

  // ── Jugadores handlers ──
  const openAddJugadores = (equipo) => {
    setSelectedEquipo(equipo);
    setAddJugadoresVisible(true);
  };

  const openRemoveJugadores = (equipo) => {
    setSelectedEquipo(equipo);
    setRemoveJugadoresVisible(true);
  };

  const openVerJugadores = (equipo) => {
    setSelectedEquipo(equipo);
    setVerJugadoresVisible(true);
  };

  const openFormacion = (equipo) => {
    setEquipoFormacion(equipo);
    setFormacionVisible(true);
  };

  const handleFormacionSaved = (payload) => {
    // Actualizar el equipo en el estado local con tipoCancha, formacion y capitan
    setEquipos(prev => prev.map(e =>
      e.id === equipoFormacion?.id
        ? { ...e, tipoCancha: payload.tipoCancha, formacion: payload.formacion, capitan: payload.capitan }
        : e
    ));
  };

  const handleAddJugadores = async (jugadoresSeleccionados) => {
    try {
      for (const jugador of jugadoresSeleccionados) {
        await jugadorService.create({
          numero: jugador.numero,
          posicion: jugador.posicion,
          clienteId: jugador.clienteId,
          equipoId: parseInt(selectedEquipo.id)
        });
      }
      setAddJugadoresVisible(false);
      showSuccess('¡Jugadores Agregados!', `Se agregaron ${jugadoresSeleccionados.length} jugador(es) correctamente al equipo.`);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudieron agregar los jugadores.');
    }
  };

  // ── Helpers ──
  const showSuccess = (title, message) => {
    setSuccessTitle(title);
    setSuccessMessage(message);
    setSuccessModalVisible(true);
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
          <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 100 }}>
            {competencias.map(item => (
              <CompetenciaCard 
                key={item.id} 
                item={item} 
                canModify={isStaff}
                yaInscripto={misInscripciones.includes(item.id)}
                onInscribir={() => handleInscripcion(item)}
                onVerFixture={() => handleVerFixture(item)}
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
              <TouchableOpacity style={styles.addButton} onPress={() => { setEditingEquipo(null); setEquipoModalVisible(true); }}>
                <MaterialCommunityIcons name="account-group" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Agregar Equipo</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 100 }}>
            {equipos.map(item => (
              <EquipoCard 
                key={item.id} 
                item={item} 
                canModify={isStaff}
                onEdit={() => handleEditEquipo(item)}
                onDelete={() => askDeleteEquipo(item)}
                onAddJugadores={() => openAddJugadores(item)}
                onRemoveJugadores={() => openRemoveJugadores(item)}
                onVerJugadores={() => openVerJugadores(item)}
                onFormacion={() => openFormacion(item)}
              />
            ))}
            {equipos.length === 0 && (
              <Text style={{color: '#94a3b8', textAlign: 'center', marginTop: 20}}>No hay equipos registrados.</Text>
            )}
          </ScrollView>
        </>
      )}

      {/* ── Modals ── */}
      <CompetenciaFormModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        formData={formData} 
        setFormData={setFormData} 
        onSave={handleCreate} 
      />

      <EquipoFormModal 
        visible={equipoModalVisible}
        onClose={() => { setEquipoModalVisible(false); setEditingEquipo(null); }}
        onSave={editingEquipo ? handleUpdateEquipo : handleCreateEquipo}
        editData={editingEquipo}
      />

      <ConfirmModal
        visible={deleteConfirmVisible}
        onClose={() => setDeleteConfirmVisible(false)}
        onConfirm={handleDeleteEquipo}
        title="Eliminar Equipo"
        message={`¿Está seguro que desea eliminar el equipo "${equipoToDelete?.nombre}"?`}
        confirmText="ELIMINAR"
        cancelText="Cancelar"
        icon="alert-circle-outline"
        color="#ef4444"
      />

      <AddJugadoresModal
        visible={addJugadoresVisible}
        onClose={() => setAddJugadoresVisible(false)}
        onConfirm={handleAddJugadores}
        equipoId={selectedEquipo?.id}
      />

      <RemoveJugadoresModal
        visible={removeJugadoresVisible}
        onClose={() => setRemoveJugadoresVisible(false)}
        equipoId={selectedEquipo?.id}
        equipoNombre={selectedEquipo?.nombre}
      />

      <VerJugadoresModal
        visible={verJugadoresVisible}
        onClose={() => setVerJugadoresVisible(false)}
        equipoId={selectedEquipo?.id}
        equipoNombre={selectedEquipo?.nombre}
      />

      <FormacionModal
        visible={formacionVisible}
        onClose={() => { setFormacionVisible(false); setEquipoFormacion(null); }}
        equipo={equipoFormacion}
        onSaved={handleFormacionSaved}
      />

      <SuccessModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        title={successTitle}
        message={successMessage}
      />

      <TorneoFixtureModal 
        visible={fixtureModalVisible}
        onClose={() => setFixtureModalVisible(false)}
        competicion={selectedCompeticion}
        isStaff={isStaffCheck}
      />

      <EnrollTeamModal
        visible={enrollModalVisible}
        onClose={() => { setEnrollModalVisible(false); setCompeticionToEnroll(null); }}
        availableEquipos={equipos.filter(e => !e.competicionId)}
        onSelectEquipo={handleSelectEquipoParaInscribir}
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
