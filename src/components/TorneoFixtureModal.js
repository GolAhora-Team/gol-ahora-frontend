import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Animated } from 'react-native';
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

export default function TorneoFixtureModal({ visible, onClose, competicion, isStaff, initialTab = 'FIXTURE' }) {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [activeTab, setActiveTab] = useState('FIXTURE');

  // Edit match result state
  const [editingMatch, setEditingMatch] = useState(null);
  const [golesLocal, setGolesLocal] = useState(0);
  const [golesVisitante, setGolesVisitante] = useState(0);
  const [penalesLocal, setPenalesLocal] = useState(0);
  const [penalesVisitante, setPenalesVisitante] = useState(0);

  const trophyScale = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(trophyScale, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(trophyScale, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (visible && competicion) {
      setActiveTab(initialTab);
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
      const gl = golesLocal;
      const gv = golesVisitante;
      let ganadorId = null;
      
      if (gl > gv) ganadorId = editingMatch.equipoLocalId;
      else if (gv > gl) ganadorId = editingMatch.equipoVisitanteId;
      else if (competicion?.tipo === 'TORNEO') {
        if (penalesLocal > penalesVisitante) ganadorId = editingMatch.equipoLocalId;
        else if (penalesVisitante > penalesLocal) ganadorId = editingMatch.equipoVisitanteId;
      }

      await partidoService.cargarResultado(editingMatch.id, {
        golesLocal: gl,
        golesVisitante: gv,
        penalesLocal: (gl === gv && competicion?.tipo === 'TORNEO') ? penalesLocal : null,
        penalesVisitante: (gl === gv && competicion?.tipo === 'TORNEO') ? penalesVisitante : null,
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

  const getTeamColor = (name) => {
    if (!name || name.startsWith('Local') || name.startsWith('Visit') || name === 'Por definir') return '#1e293b';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  const TeamShield = ({ primario, secundario, fallbackName }) => {
    let c1 = primario;
    let c2 = secundario;
    
    if (!c1 || !c2) {
      const fb = getTeamColor(fallbackName);
      c1 = c1 || fb;
      c2 = c2 || '#cbd5e1';
    }

    return (
      <View style={{ width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
        <MaterialCommunityIcons name="shield" size={20} color={c2} style={{ position: 'absolute' }} />
        <MaterialCommunityIcons name="shield-half-full" size={20} color={c1} style={{ position: 'absolute' }} />
      </View>
    );
  };

  const renderCounter = (value, setValue) => (
    <View style={styles.counterContainer}>
      <TouchableOpacity onPress={() => value > 0 && setValue(value - 1)} style={styles.counterBtn}>
        <MaterialCommunityIcons name="minus" size={20} color="#64748b" />
      </TouchableOpacity>
      <Text style={styles.counterText}>{value}</Text>
      <TouchableOpacity onPress={() => setValue(value + 1)} style={styles.counterBtn}>
        <MaterialCommunityIcons name="plus" size={20} color="#64748b" />
      </TouchableOpacity>
    </View>
  );

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
          {isStaff && (
            <TouchableOpacity onPress={() => {
              setEditingMatch(match);
              setGolesLocal(Number(match.golesLocal) || 0);
              setGolesVisitante(Number(match.golesVisitante) || 0);
              setPenalesLocal(match.penalesLocal != null ? Number(match.penalesLocal) : 0);
              setPenalesVisitante(match.penalesVisitante != null ? Number(match.penalesVisitante) : 0);
            }}>
              <MaterialCommunityIcons name="pencil" size={16} color="#009b3a" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.teamRow}>
          <TeamShield primario={match.equipoLocalColorPrimario} secundario={match.equipoLocalColorSecundario} fallbackName={match.equipoLocalNombre} />
          <Text style={[styles.teamName, localWinner && styles.winnerName]}>
            {match.equipoLocalId ? (match.equipoLocalNombre || `Local ${match.equipoLocalId}`) : "Por definir"}
          </Text>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.scoreText, localWinner && styles.winnerScore]}>{isFinished ? match.golesLocal : '-'}</Text>
            {isFinished && match.golesLocal === match.golesVisitante && match.penalesLocal != null && (
              <Text style={{ fontSize: 10, color: '#009b3a', fontWeight: 'bold' }}>({match.penalesLocal})</Text>
            )}
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.teamRow}>
          <TeamShield primario={match.equipoVisitanteColorPrimario} secundario={match.equipoVisitanteColorSecundario} fallbackName={match.equipoVisitanteNombre} />
          <Text style={[styles.teamName, visitWinner && styles.winnerName]}>
            {match.equipoVisitanteId ? (match.equipoVisitanteNombre || `Visitante ${match.equipoVisitanteId}`) : "Por definir"}
          </Text>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.scoreText, visitWinner && styles.winnerScore]}>{isFinished ? match.golesVisitante : '-'}</Text>
            {isFinished && match.golesLocal === match.golesVisitante && match.penalesVisitante != null && (
              <Text style={{ fontSize: 10, color: '#009b3a', fontWeight: 'bold' }}>({match.penalesVisitante})</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderTorneoBracket = () => {
    const columns = getTournamentColumns();
    const dataToUse = demoMode ? generateMockPartidosTorneo(columns) : partidos;

    return (
      <ScrollView showsVerticalScrollIndicator={true} style={{flex: 1}}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.bracketContainer}>
          {columns.map(faseId => {
            const matches = dataToUse.filter(p => p.fase === faseId);
            const expected = FASE_MATCH_COUNT[faseId] || 1;
            const displayMatches = [];
            
            for (let i = 0; i < expected; i++) {
              displayMatches.push(matches[i] || null);
            }

            const isLast = faseId === columns[columns.length - 1];
            const isFirst = faseId === columns[0];
            const flexVal = Math.pow(2, columns.indexOf(faseId));

            return (
              <View key={`col-${faseId}`} style={[styles.bracketColumn, { marginRight: isLast ? 0 : 40 }]}>
                <View style={styles.colHeader}>
                  <Text style={styles.colTitle}>{FASE_NAMES[faseId]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  {displayMatches.map((m, idx) => (
                    <View key={`cell-${faseId}-${idx}`} style={{ flex: flexVal, justifyContent: 'center', position: 'relative' }}>
                      <View style={styles.matchWrapper}>
                        {renderMatchCard(m, idx, faseId)}
                        
                        {isLast && m && m.estado === 3 && m.ganadorId && (
                           <Animated.View style={{ position: 'absolute', right: -90, top: '50%', transform: [{ translateY: -35 }, { scale: trophyScale }], alignItems: 'center', zIndex: 10 }}>
                              <MaterialCommunityIcons name="trophy" size={50} color="#fbbf24" style={{ textShadowColor: 'rgba(251, 191, 36, 0.5)', textShadowOffset: {width: 0, height: 0}, textShadowRadius: 10 }} />
                              <Text style={{ fontSize: 11, fontWeight: '900', color: '#fbbf24', marginTop: 4 }}>¡CAMPEÓN!</Text>
                           </Animated.View>
                        )}
                      </View>
                      
                      {!isFirst && (
                        <View style={{ position: 'absolute', left: -20, top: '50%', width: 20, height: 2, backgroundColor: '#cbd5e1', zIndex: 0 }} />
                      )}
                      
                      {!isLast && (
                        <View style={{ position: 'absolute', right: -20, top: '50%', width: 20, height: 2, backgroundColor: '#cbd5e1', zIndex: 0 }} />
                      )}
                      
                      {!isLast && idx % 2 === 0 && (
                        <View style={{ position: 'absolute', right: -20, top: '50%', bottom: 0, width: 2, backgroundColor: '#cbd5e1', zIndex: 0 }} />
                      )}
                      
                      {!isLast && idx % 2 === 1 && (
                        <View style={{ position: 'absolute', right: -20, top: 0, bottom: '50%', width: 2, backgroundColor: '#cbd5e1', zIndex: 0 }} />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            );
        })}
        </ScrollView>
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

  const renderTablaPosiciones = () => {
    const dataToUse = demoMode ? generateMockPartidosLiga() : partidos;
    const stats = {};

    dataToUse.forEach(p => {
       const locId = p.equipoLocalId || p.equipoLocalNombre;
       const visId = p.equipoVisitanteId || p.equipoVisitanteNombre;

       if (!stats[locId]) stats[locId] = { id: locId, nombre: p.equipoLocalNombre, colorPrimario: p.equipoLocalColorPrimario, colorSecundario: p.equipoLocalColorSecundario, Pts: 0, PJ: 0, PG: 0, PE: 0, PP: 0, GF: 0, GC: 0 };
       if (!stats[visId]) stats[visId] = { id: visId, nombre: p.equipoVisitanteNombre, colorPrimario: p.equipoVisitanteColorPrimario, colorSecundario: p.equipoVisitanteColorSecundario, Pts: 0, PJ: 0, PG: 0, PE: 0, PP: 0, GF: 0, GC: 0 };

       if (p.estado === 3) {
           const local = stats[locId];
           const visit = stats[visId];
           
           local.PJ++;
           visit.PJ++;
           local.GF += p.golesLocal || 0;
           local.GC += p.golesVisitante || 0;
           visit.GF += p.golesVisitante || 0;
           visit.GC += p.golesLocal || 0;

           if (p.golesLocal > p.golesVisitante) {
              local.PG++;
              local.Pts += 3;
              visit.PP++;
           } else if (p.golesLocal < p.golesVisitante) {
              visit.PG++;
              visit.Pts += 3;
              local.PP++;
           } else {
              local.PE++;
              visit.PE++;
              local.Pts += 1;
              visit.Pts += 1;
           }
       }
    });

    const tabla = Object.values(stats).map(t => ({ ...t, DG: t.GF - t.GC })).sort((a,b) => {
       if (b.Pts !== a.Pts) return b.Pts - a.Pts;
       if (b.DG !== a.DG) return b.DG - a.DG;
       return b.GF - a.GF;
    });

    return (
      <ScrollView contentContainerStyle={{ padding: 20 }}>
         <View style={{ flexDirection: 'row', borderBottomWidth: 2, borderColor: '#e2e8f0', paddingBottom: 10, marginBottom: 10 }}>
            <Text style={{ width: 25 }}></Text>
            <Text style={{ flex: 1, fontWeight: '900', color: '#64748b', fontSize: 11 }}>EQUIPO</Text>
            <Text style={{ width: 32, textAlign: 'center', fontWeight: '900', color: '#64748b', fontSize: 11 }}>PTS</Text>
            <Text style={{ width: 25, textAlign: 'center', fontWeight: '900', color: '#64748b', fontSize: 11 }}>PJ</Text>
            <Text style={{ width: 25, textAlign: 'center', fontWeight: '900', color: '#64748b', fontSize: 11 }}>PG</Text>
            <Text style={{ width: 25, textAlign: 'center', fontWeight: '900', color: '#64748b', fontSize: 11 }}>PE</Text>
            <Text style={{ width: 25, textAlign: 'center', fontWeight: '900', color: '#64748b', fontSize: 11 }}>PP</Text>
            <Text style={{ width: 25, textAlign: 'center', fontWeight: '900', color: '#64748b', fontSize: 11 }}>DG</Text>
         </View>
         {tabla.map((t, i) => (
            <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f1f5f9' }}>
               <Text style={{ width: 25, fontWeight: '800', color: i < 3 ? '#009b3a' : '#64748b', fontSize: 12 }}>{i+1}</Text>
               <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <TeamShield primario={t.colorPrimario} secundario={t.colorSecundario} fallbackName={t.nombre} />
                  <Text style={{ marginLeft: 8, fontWeight: '700', color: '#1e293b', fontSize: 13 }} numberOfLines={1}>{t.nombre}</Text>
               </View>
               <Text style={{ width: 32, textAlign: 'center', fontWeight: '900', color: '#1e293b', fontSize: 13 }}>{t.Pts}</Text>
               <Text style={{ width: 25, textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: 12 }}>{t.PJ}</Text>
               <Text style={{ width: 25, textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: 12 }}>{t.PG}</Text>
               <Text style={{ width: 25, textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: 12 }}>{t.PE}</Text>
               <Text style={{ width: 25, textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: 12 }}>{t.PP}</Text>
               <Text style={{ width: 25, textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: 12 }}>{t.DG > 0 ? `+${t.DG}` : t.DG}</Text>
            </View>
         ))}
         {tabla.length === 0 && <Text style={{ textAlign: 'center', marginTop: 20, color: '#94a3b8' }}>Aún no hay equipos para mostrar en la tabla.</Text>}
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
    const equipos = ["Boca", "River", "Racing", "Independiente", "San Lorenzo", "Huracán"];
    let mId = 1;
    const numEquipos = equipos.length;
    
    for (let j = 0; j < numEquipos - 1; j++) {
      for (let i = 0; i < numEquipos / 2; i++) {
        let localIndex = (j + i) % (numEquipos - 1);
        let visitanteIndex = (numEquipos - 1 - i + j) % (numEquipos - 1);

        if (i === 0) {
          visitanteIndex = numEquipos - 1;
        }

        mock.push({
          id: `mock-liga-${mId++}`,
          isMock: true,
          equipoLocalNombre: equipos[localIndex],
          equipoVisitanteNombre: equipos[visitanteIndex],
          golesLocal: Math.floor(Math.random() * 4),
          golesVisitante: Math.floor(Math.random() * 4),
          estado: Math.random() > 0.5 ? 3 : 1,
          jornada: j + 1,
          fecha: new Date(Date.now() + j * 7 * 24 * 60 * 60 * 1000).toISOString(),
          hora: "15:00:00"
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
              <Text style={styles.emptyText}>
                {activeTab === 'TABLA' ? 'La tabla aún no ha sido generada.' : 'El fixture aún no ha sido generado.'}
              </Text>
              
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
                isTorneo ? renderTorneoBracket() : (activeTab === 'TABLA' ? renderTablaPosiciones() : renderLigaRounds())
              )}
            </View>
          )}

          {/* Aceptar button */}
          {(hasMatches || demoMode) && !loading && (
            <TouchableOpacity style={styles.acceptBtn} onPress={onClose}>
              <Text style={styles.acceptBtnText}>ACEPTAR</Text>
            </TouchableOpacity>
          )}
          {/* Edit Match Overlay */}
          {editingMatch && (
            <View style={styles.editOverlay}>
              <View style={styles.editCard}>
                <Text style={styles.editTitle}>Cargar Resultado</Text>
                
                <View style={styles.editRow}>
                  <Text style={styles.editTeam}>{editingMatch.equipoLocalNombre || 'Local'}</Text>
                  {renderCounter(golesLocal, setGolesLocal)}
                </View>

                <View style={styles.editRow}>
                  <Text style={styles.editTeam}>{editingMatch.equipoVisitanteNombre || 'Visitante'}</Text>
                  {renderCounter(golesVisitante, setGolesVisitante)}
                </View>

                {golesLocal === golesVisitante && competicion?.tipo === 'TORNEO' && (
                  <View style={styles.penalesContainer}>
                    <Text style={styles.penalesTitle}>Penales</Text>
                    <View style={styles.editRow}>
                      <Text style={styles.editTeam}>{editingMatch.equipoLocalNombre || 'Local'}</Text>
                      {renderCounter(penalesLocal, setPenalesLocal)}
                    </View>
                    <View style={styles.editRow}>
                      <Text style={styles.editTeam}>{editingMatch.equipoVisitanteNombre || 'Visitante'}</Text>
                      {renderCounter(penalesVisitante, setPenalesVisitante)}
                    </View>
                  </View>
                )}

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
    paddingRight: 100,
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
  matchPairContainer: {
    justifyContent: 'space-around',
    flex: 1,
    position: 'relative'
  },
  matchWrapper: {
    position: 'relative',
    marginVertical: 10,
    zIndex: 2,
  },
  connectorBracket: {
    position: 'absolute',
    right: -15,
    top: '25%',
    bottom: '25%',
    width: 15,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#cbd5e1',
    borderLeftWidth: 0,
    zIndex: 1,
  },
  connectorToNext: {
    position: 'absolute',
    right: -30,
    top: '50%',
    width: 15,
    height: 2,
    backgroundColor: '#cbd5e1',
    zIndex: 1,
  },
  connectorStraight: {
    position: 'absolute',
    right: -30,
    top: '50%',
    width: 30,
    height: 2,
    backgroundColor: '#cbd5e1',
    zIndex: 1,
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
  counterContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  counterBtn: { padding: 8 },
  counterText: { width: 30, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#1e293b' },
  penalesContainer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  penalesTitle: { fontSize: 14, fontWeight: '800', color: '#009b3a', marginBottom: 10, textAlign: 'center', textTransform: 'uppercase' },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  editBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  acceptBtn: { backgroundColor: '#009b3a', margin: 20, padding: 15, borderRadius: 12, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 }
});
