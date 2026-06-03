import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { partidoService } from '../services/partidoService';

const FASE_NAMES = {
  1: 'Octavos de Final',
  2: 'Cuartos de Final',
  3: 'Semifinal',
  4: 'Final'
};

const FASE_MATCH_COUNT = {
  1: 8,
  2: 4,
  3: 2,
  4: 1
};

export default function TorneoFixtureModal({ visible, onClose, competicion, isStaff }) {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [activeTab, setActiveTab] = useState('FIXTURE');

  // Edit match result state
  const [editingMatch, setEditingMatch] = useState(null);
  const [golesLocal, setGolesLocal] = useState('');
  const [golesVisitante, setGolesVisitante] = useState('');

  useEffect(() => {
    if (visible && competicion) {
      loadPartidos();
    } else {
      setPartidos([]);
      setDemoMode(false);
      setEditingMatch(null);
    }
  }, [visible, competicion]);

  const loadPartidos = async () => {
    try {
      setLoading(true);
      const data = await partidoService.getByCompeticion(competicion.id);
      setPartidos(data || []);
    } catch (error) {
      console.error(error);
      // Fallback a array vacío si falla por 404
      setPartidos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarFixture = async () => {
    try {
      setLoading(true);
      await partidoService.generarFixture(competicion.id);
      Alert.alert("Éxito", "El fixture ha sido sorteado y generado.");
      await loadPartidos();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.response?.data?.mensaje || "No se pudo generar el fixture. Asegúrate de tener la cantidad correcta de equipos inscritos.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResult = async () => {
    if (!editingMatch) return;
    try {
      const gl = parseInt(golesLocal) || 0;
      const gv = parseInt(golesVisitante) || 0;
      let ganadorId = null;
      if (gl > gv) ganadorId = editingMatch.equipoLocalId;
      else if (gv > gl) ganadorId = editingMatch.equipoVisitanteId;
      // Si es empate en torneo, habría penales (asumiremos que cargan los goles de penales o definen ganador). 
      // Por ahora, dejamos ganadorId null si empatan en Liga.

      await partidoService.cargarResultado(editingMatch.id, {
        golesLocal: gl,
        golesVisitante: gv,
        ganadorId: ganadorId
      });
      
      Alert.alert("Éxito", "Resultado guardado correctamente.");
      setEditingMatch(null);
      await loadPartidos();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar el resultado.");
    }
  };

  const getTournamentColumns = () => {
    const max = competicion?.maxEquipos || '16';
    if (max === '16') return [1, 2, 3, 4];
    if (max === '8') return [2, 3, 4];
    return [3, 4];
  };

  const renderMatchCard = (match, index, faseId) => {
    const isMock = !match || match.isMock;
    
    // Si no hay match real, generamos un mock
    if (isMock) {
      return (
        <View key={`mock-${faseId}-${index}`} style={[styles.matchCard, styles.matchCardEmpty]}>
          <View style={styles.teamRow}>
            <MaterialCommunityIcons name="shield-outline" size={20} color="#cbd5e1" />
            <Text style={styles.emptyTeamText}>Por definir</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.teamRow}>
            <MaterialCommunityIcons name="shield-outline" size={20} color="#cbd5e1" />
            <Text style={styles.emptyTeamText}>Por definir</Text>
          </View>
        </View>
      );
    }

    const localWinner = match.ganadorId && match.ganadorId === match.equipoLocalId;
    const visitWinner = match.ganadorId && match.ganadorId === match.equipoVisitanteId;
    const isFinished = match.estado === 3; // Finalizado

    return (
      <View key={`match-${match.id}`} style={[styles.matchCard, isFinished && styles.matchCardFinished]}>
        <View style={styles.matchHeader}>
          <Text style={styles.matchDate}>{match.fecha ? new Date(match.fecha).toLocaleDateString() : 'Por definir'} - {match.hora ? match.hora.substring(0,5) : ''}</Text>
          {isStaff && !isFinished && (
            <TouchableOpacity onPress={() => {
              setEditingMatch(match);
              setGolesLocal(match.golesLocal?.toString() || '0');
              setGolesVisitante(match.golesVisitante?.toString() || '0');
            }}>
              <MaterialCommunityIcons name="pencil" size={16} color="#009b3a" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.teamRow}>
          <MaterialCommunityIcons name="shield" size={20} color="#1e293b" />
          <Text style={[styles.teamName, localWinner && styles.winnerName]}>{match.equipoLocalNombre || `Local ${match.equipoLocalId}`}</Text>
          <Text style={[styles.scoreText, localWinner && styles.winnerScore]}>{isFinished ? match.golesLocal : '-'}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.teamRow}>
          <MaterialCommunityIcons name="shield" size={20} color="#1e293b" />
          <Text style={[styles.teamName, visitWinner && styles.winnerName]}>{match.equipoVisitanteNombre || `Visitante ${match.equipoVisitanteId}`}</Text>
          <Text style={[styles.scoreText, visitWinner && styles.winnerScore]}>{isFinished ? match.golesVisitante : '-'}</Text>
        </View>
      </View>
    );
  };

  const renderTorneoBracket = () => {
    const columns = getTournamentColumns();
    const dataToUse = demoMode ? generateMockPartidosTorneo(columns) : partidos;

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.bracketContainer}>
        {columns.map(faseId => {
          const matches = dataToUse.filter(p => p.fase === faseId);
          const expected = FASE_MATCH_COUNT[faseId] || 1;
          const displayMatches = [];
          
          for (let i = 0; i < expected; i++) {
            displayMatches.push(matches[i] || null);
          }

          return (
            <View key={`col-${faseId}`} style={styles.bracketColumn}>
              <View style={styles.colHeader}>
                <Text style={styles.colTitle}>{FASE_NAMES[faseId]}</Text>
              </View>
              <View style={styles.colMatches}>
                {displayMatches.map((m, idx) => (
                  <View key={`wrap-${faseId}-${idx}`} style={styles.matchWrapper}>
                    {renderMatchCard(m, idx, faseId)}
                    {/* Visual Connector Line if not final */}
                    {faseId !== 4 && (
                      <View style={styles.connector} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderLigaRounds = () => {
    const dataToUse = demoMode ? generateMockPartidosLiga() : partidos;
    const jornadas = [...new Set(dataToUse.map(p => p.jornada))].sort((a,b) => a - b);

    return (
      <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={styles.ligaContainer}>
        {jornadas.map(jornada => (
          <View key={`jor-${jornada}`} style={styles.jornadaSection}>
            <Text style={styles.jornadaTitle}>Jornada {jornada}</Text>
            {dataToUse.filter(p => p.jornada === jornada).map((match, idx) => (
              <View key={`ligam-${idx}`} style={{ marginBottom: 10 }}>
                {renderMatchCard(match, idx, 'liga')}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  };

  const generateMockPartidosTorneo = (columns) => {
    const mock = [];
    columns.forEach(faseId => {
      const expected = FASE_MATCH_COUNT[faseId];
      for (let i = 0; i < expected; i++) {
        mock.push({
          id: `mock-${faseId}-${i}`,
          isMock: true, // we can still render this as real looking mock
          equipoLocalNombre: `Equipo ${i * 2 + 1}`,
          equipoVisitanteNombre: `Equipo ${i * 2 + 2}`,
          golesLocal: Math.floor(Math.random() * 4),
          golesVisitante: Math.floor(Math.random() * 4),
          estado: 3, // Finalizado para demo
          fase: faseId,
          fecha: new Date().toISOString(),
          hora: "18:00:00"
        });
        // Asegurar que hay un ganador
        const m = mock[mock.length - 1];
        if (m.golesLocal === m.golesVisitante) m.golesLocal++;
        m.ganadorId = m.golesLocal > m.golesVisitante ? 'local' : 'visitante';
        m.equipoLocalId = 'local';
        m.equipoVisitanteId = 'visitante';
      }
    });
    return mock;
  };

  const generateMockPartidosLiga = () => {
    const mock = [];
    for (let j = 1; j <= 3; j++) {
      for (let i = 0; i < 4; i++) {
        mock.push({
          id: `mock-liga-${j}-${i}`,
          isMock: true,
          equipoLocalNombre: `Equipo Local ${i+1}`,
          equipoVisitanteNombre: `Equipo Visit ${i+1}`,
          golesLocal: Math.floor(Math.random() * 3),
          golesVisitante: Math.floor(Math.random() * 3),
          estado: j === 1 ? 3 : 1, // Jornada 1 finalizada, resto programada
          jornada: j,
          fecha: new Date().toISOString(),
          hora: "20:00:00"
        });
      }
    }
    return mock;
  };

  if (!competicion) return null;

  const isTorneo = competicion.tipo === 'TORNEO';
  const hasMatches = partidos.length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{competicion.nombre}</Text>
              <View style={[styles.badge, { backgroundColor: isTorneo ? '#fbbf24' : '#009b3a' }]}>
                <Text style={styles.badgeText}>{isTorneo ? 'TORNEO' : 'LIGA'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={28} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Empty state & Actions */}
          {!hasMatches && !loading && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="tournament" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>El fixture aún no ha sido generado.</Text>
              
              <TouchableOpacity style={styles.demoBtn} onPress={() => setDemoMode(!demoMode)}>
                <MaterialCommunityIcons name="eye-outline" size={20} color="#009b3a" />
                <Text style={styles.demoBtnText}>{demoMode ? 'Ocultar Demo' : 'Ver Vista Previa (Demo)'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Content */}
          {loading ? (
            <View style={styles.centerLoad}>
              <ActivityIndicator size="large" color="#009b3a" />
              <Text style={{marginTop: 10, color: '#64748b'}}>Cargando fixture...</Text>
            </View>
          ) : (
            <View style={styles.contentArea}>
              {(hasMatches || demoMode) && (
                isTorneo ? renderTorneoBracket() : renderLigaRounds()
              )}
            </View>
          )}

          {/* Edit Match Overlay */}
          {editingMatch && (
            <View style={styles.editOverlay}>
              <View style={styles.editCard}>
                <Text style={styles.editTitle}>Cargar Resultado</Text>
                
                <View style={styles.editRow}>
                  <Text style={styles.editTeam}>{editingMatch.equipoLocalNombre || 'Local'}</Text>
                  <TextInput 
                    style={styles.scoreInput}
                    value={golesLocal}
                    onChangeText={setGolesLocal}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.editRow}>
                  <Text style={styles.editTeam}>{editingMatch.equipoVisitanteNombre || 'Visitante'}</Text>
                  <TextInput 
                    style={styles.scoreInput}
                    value={golesVisitante}
                    onChangeText={setGolesVisitante}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.editActions}>
                  <TouchableOpacity style={[styles.editBtn, { backgroundColor: '#cbd5e1' }]} onPress={() => setEditingMatch(null)}>
                    <Text style={{color: '#1e293b', fontWeight: '800'}}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.editBtn, { backgroundColor: '#009b3a' }]} onPress={handleSaveResult}>
                    <Text style={{color: '#fff', fontWeight: '800'}}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#f8fafc',
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc'
  },
  title: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 10 },
  closeBtn: { padding: 5 },
  emptyState: { padding: 30, alignItems: 'center', backgroundColor: '#fff', margin: 20, borderRadius: 16, elevation: 2 },
  emptyText: { color: '#64748b', fontSize: 16, fontWeight: '600', marginVertical: 15 },
  actionBtn: { backgroundColor: '#009b3a', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginBottom: 10 },
  actionBtnText: { color: '#fff', fontWeight: '900', marginLeft: 8, fontSize: 14 },
  demoBtn: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  demoBtnText: { color: '#009b3a', fontWeight: '800', marginLeft: 5 },
  centerLoad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentArea: { flex: 1 },
  
  // Bracket Styles
  bracketContainer: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  bracketColumn: {
    width: 220,
    marginRight: 30,
    justifyContent: 'space-around',
  },
  colHeader: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    borderRadius: 8,
  },
  colTitle: { color: '#fff', fontWeight: '800', fontSize: 13 },
  colMatches: {
    flex: 1,
    justifyContent: 'space-around',
  },
  matchWrapper: {
    position: 'relative',
    marginVertical: 10,
  },
  connector: {
    position: 'absolute',
    right: -30,
    top: '50%',
    width: 30,
    height: 2,
    backgroundColor: '#cbd5e1',
  },
  
  // Match Card
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width:0, height:1 }, shadowOpacity: 0.1, shadowRadius: 2
  },
  matchCardEmpty: {
    borderStyle: 'dashed',
    backgroundColor: '#f1f5f9',
    elevation: 0,
  },
  matchCardFinished: {
    borderColor: '#009b3a'
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  matchDate: { fontSize: 10, color: '#94a3b8', fontWeight: '700' },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  teamName: { flex: 1, fontSize: 13, fontWeight: '700', color: '#334155', marginLeft: 6 },
  winnerName: { fontWeight: '900', color: '#000' },
  emptyTeamText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#94a3b8', marginLeft: 6, fontStyle: 'italic' },
  scoreText: { fontSize: 14, fontWeight: '700', color: '#64748b', width: 25, textAlign: 'center' },
  winnerScore: { color: '#009b3a', fontWeight: '900' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 4 },

  // Liga Styles
  ligaContainer: { padding: 20 },
  jornadaSection: { marginBottom: 25 },
  jornadaTitle: { fontSize: 16, fontWeight: '900', color: '#1e293b', marginBottom: 12, paddingLeft: 5, borderLeftWidth: 4, borderLeftColor: '#009b3a' },

  // Edit Overlay
  editOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', zIndex: 10
  },
  editCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '85%', maxWidth: 350
  },
  editTitle: { fontSize: 18, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  editTeam: { fontSize: 15, fontWeight: '700', color: '#1e293b', flex: 1 },
  scoreInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, width: 60, textAlign: 'center', fontSize: 18, fontWeight: '800', padding: 5 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  editBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }
});
