import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { asistenciaService } from '../services/asistenciaService';
import { claseService } from '../services/claseService';
import { entrenamientoService } from '../services/entrenamientoService';
import ConfirmModal from './ConfirmModal';

// ────────────────────────────────────────────────────────────
//  Helper: abre/descarga un Blob PDF en web o mobile
// ────────────────────────────────────────────────────────────
const abrirPdfBlob = (blob, filename) => {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    Alert.alert('PDF', 'Descarga de PDF disponible solo en la versión web.');
  }
};

// ────────────────────────────────────────────────────────────
//  Componente principal: modal de asistencia mejorado
// ────────────────────────────────────────────────────────────
export default function AsistenciaModal({ visible, onClose, claseId, claseNombre, esEntrenamiento = false }) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'barcode'
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [alumnoToDesmarcar, setAlumnoToDesmarcar] = useState(null);
  
  // Estado para escaneo manual de código
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanMessage, setScanMessage] = useState(null); // { type: 'success'|'error', text }
  const [scanHistory, setScanHistory] = useState([]);
  
  // Historial estado
  const [historialData, setHistorialData] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [historialAlumno, setHistorialAlumno] = useState(null);
  
  // Estado cámara (solo web con BarcodeDetector API)
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const getLocalFechaHoy = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const fechaHoy = getLocalFechaHoy();

  useEffect(() => {
    if (visible && claseId) {
      loadAlumnos();
      setScanHistory([]);
      setScanMessage(null);
      setActiveTab('manual');
    }
    return () => stopCamera();
  }, [visible, claseId]);

  // ── Carga alumnos ──────────────────────────────────────────
  const loadAlumnos = async () => {
    setLoading(true);
    try {
      const clase = esEntrenamiento 
        ? await entrenamientoService.getById(claseId)
        : await claseService.getById(claseId);
      const clientesRaw = clase?.alumnos || clase?.clientes || [];
      const asistenciasHoy = await asistenciaService.getAsistenciasPorActividadYFecha(claseId, fechaHoy, !esEntrenamiento).catch(() => []);
      const idsPresentes = new Set((asistenciasHoy || []).filter(a => a.presente).map(a => a.clienteId));

      setAlumnos(clientesRaw.map(c => ({
        id: c.id,
        clienteId: c.id,
        nombre: `${c.nombre || ''} ${c.apellido || ''}`.trim(),
        codigoBarras: c.codigoBarras || null,
        presente: idsPresentes.has(c.id),
      })));
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los alumnos.');
    } finally {
      setLoading(false);
    }
  };

  const togglePresente = async (alumno) => {
    if (alumno.presente) {
      setAlumnoToDesmarcar(alumno);
      setConfirmVisible(true);
      return;
    }
    setSaving(true);
    try {
      await asistenciaService.registrarManual(claseId, alumno.clienteId, !esEntrenamiento);
      setAlumnos(prev => prev.map(a => a.id === alumno.id ? { ...a, presente: true } : a));
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo registrar la asistencia.');
    } finally {
      setSaving(false);
    }
  };

  const handleDesmarcarConfirm = async () => {
    if (!alumnoToDesmarcar) return;
    setSaving(true);
    try {
      await asistenciaService.eliminarAsistencia(claseId, alumnoToDesmarcar.clienteId, !esEntrenamiento);
      setAlumnos(prev => prev.map(a => a.id === alumnoToDesmarcar.id ? { ...a, presente: false } : a));
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo desmarcar la asistencia.');
    } finally {
      setSaving(false);
      setAlumnoToDesmarcar(null);
    }
  };

  const cargarHistorial = async (alumno) => {
    if (historialAlumno?.id === alumno.id) {
        setHistorialAlumno(null); // toggle
        return;
    }
    setHistorialAlumno(alumno);
    setHistorialLoading(true);
    try {
      const data = await asistenciaService.getHistorialAsistencias(claseId, alumno.clienteId, !esEntrenamiento);
      setHistorialData(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el historial.');
    } finally {
      setHistorialLoading(false);
    }
  };

  // ── Descargar pulsera PDF ──────────────────────────────────
  const descargarPulsera = async (alumno) => {
    try {
      const blob = esEntrenamiento
        ? await entrenamientoService.descargarPulsera(claseId, alumno.clienteId)
        : await claseService.descargarPulsera(claseId, alumno.clienteId);
      abrirPdfBlob(blob, `Pulsera_${alumno.nombre.replace(' ', '_')}.pdf`);
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo generar la pulsera.');
    }
  };

  // ── ESCANEO: input manual de código ───────────────────────
  const registrarPorCodigo = async (codigo) => {
    const cod = (codigo || barcodeInput).trim();
    if (!cod) return;
    setScanLoading(true);
    setScanMessage(null);
    try {
      await asistenciaService.registrarCodigoBarras(cod, claseId, !esEntrenamiento);
      
      // Guardar ids de alumnos que ya estaban presentes antes
      const oldPresentes = new Set(alumnos.filter(a => a.presente).map(a => a.clienteId));
      
      // Recargar alumnos de la API
      let updatedAlumnos = [];
      try {
        const clase = esEntrenamiento 
          ? await entrenamientoService.getById(claseId)
          : await claseService.getById(claseId);
        const clientesRaw = clase?.alumnos || clase?.clientes || [];
        const asistenciasHoy = await asistenciaService.getAsistenciasPorActividadYFecha(claseId, fechaHoy, !esEntrenamiento).catch(() => []);
        const idsPresentes = new Set((asistenciasHoy || []).filter(a => a.presente).map(a => a.clienteId));
  
        updatedAlumnos = clientesRaw.map(c => ({
          id: c.id,
          clienteId: c.id,
          nombre: `${c.nombre || ''} ${c.apellido || ''}`.trim(),
          codigoBarras: c.codigoBarras || null,
          presente: idsPresentes.has(c.id),
        }));
        setAlumnos(updatedAlumnos);
      } catch (err) {
        console.warn('Error al recargar alumnos:', err);
      }

      // Buscar el alumno que pasó de ausente a presente
      // Si no podemos determinarlo (por ejemplo, ya estaba presente o falló la recarga),
      // intentamos buscar por código de barra local como fallback, de lo contrario mostramos el código
      const nuevoPresente = updatedAlumnos.find(a => a.presente && !oldPresentes.has(a.clienteId));
      let alumnoNombre = nuevoPresente ? nuevoPresente.nombre : null;
      if (!alumnoNombre) {
        alumnoNombre = alumnos.find(a => a.codigoBarras === cod)?.nombre || cod;
      }

      setScanMessage({ type: 'success', text: `✅ Asistencia registrada: ${alumnoNombre}` });
      setScanHistory(prev => [{ codigo: cod, nombre: alumnoNombre, hora: new Date().toLocaleTimeString('es-AR') }, ...prev.slice(0, 9)]);
      setBarcodeInput('');
    } catch (e) {
      setScanMessage({ type: 'error', text: `❌ ${e.message || 'Código no encontrado.'}` });
    } finally {
      setScanLoading(false);
    }
  };

  // ── Cámara (BarcodeDetector API - Chrome/Edge web) ────────
  const startCamera = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Escáner', 'El escaneo por cámara está disponible solo en la versión web (Chrome/Edge).');
      return;
    }
    if (!('BarcodeDetector' in window)) {
      Alert.alert('No soportado', 'Tu navegador no soporta el escáner de cámara. Usá Chrome o Edge.\nPodés ingresar el código manualmente.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          startBarcodeDetection();
        }
      }, 300);
    } catch (err) {
      Alert.alert('Error', 'No se pudo acceder a la cámara: ' + err.message);
    }
  };

  const startBarcodeDetection = () => {
    if (!('BarcodeDetector' in window)) return;
    const detector = new window.BarcodeDetector({ formats: ['code_128', 'code_39', 'qr_code'] });
    let running = true;
    
    const detect = async () => {
      if (!running || !videoRef.current) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const codigo = barcodes[0].rawValue;
          stopCamera();
          await registrarPorCodigo(codigo);
          return;
        }
      } catch (_) {}
      if (running) scannerRef.current = setTimeout(detect, 200);
    };
    
    scannerRef.current = setTimeout(detect, 500);
    return () => { running = false; };
  };

  const stopCamera = () => {
    clearTimeout(scannerRef.current);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // ── Stats ──────────────────────────────────────────────────
  const presentes = alumnos.filter(a => a.presente).length;
  const ausentes = alumnos.length - presentes;

  // ── Render ─────────────────────────────────────────────────
  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Tomar Asistencia</Text>
              <Text style={styles.subTitle}>{claseNombre}</Text>
              <Text style={styles.dateText}>{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={28} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryItem, { backgroundColor: '#f0fdf4' }]}>
              <Text style={[styles.summaryCount, { color: '#16a34a' }]}>{presentes}</Text>
              <Text style={styles.summaryLabel}>Presentes</Text>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: '#fef2f2' }]}>
              <Text style={[styles.summaryCount, { color: '#ef4444' }]}>{ausentes}</Text>
              <Text style={styles.summaryLabel}>Ausentes</Text>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: '#f8fafc' }]}>
              <Text style={[styles.summaryCount, { color: '#64748b' }]}>{alumnos.length}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'manual' && styles.tabActive]}
              onPress={() => { setActiveTab('manual'); stopCamera(); }}
            >
              <MaterialCommunityIcons name="account-check" size={16} color={activeTab === 'manual' ? '#fff' : '#64748b'} />
              <Text style={[styles.tabText, activeTab === 'manual' && styles.tabTextActive]}>Lista</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'barcode' && styles.tabActive]}
              onPress={() => { setActiveTab('barcode'); }}
            >
              <MaterialCommunityIcons name="barcode-scan" size={16} color={activeTab === 'barcode' ? '#fff' : '#64748b'} />
              <Text style={[styles.tabText, activeTab === 'barcode' && styles.tabTextActive]}>Escaneo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'historial' && styles.tabActive]}
              onPress={() => { setActiveTab('historial'); stopCamera(); setHistorialAlumno(null); }}
            >
              <MaterialCommunityIcons name="history" size={16} color={activeTab === 'historial' ? '#fff' : '#64748b'} />
              <Text style={[styles.tabText, activeTab === 'historial' && styles.tabTextActive]}>Historial</Text>
            </TouchableOpacity>
          </View>

          {/* ── TAB: LISTA MANUAL ─────────────────────────── */}
          {activeTab === 'manual' && (
            loading ? (
              <ActivityIndicator size="large" color="#009b3a" style={{ marginVertical: 30 }} />
            ) : alumnos.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="account-group-outline" size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No hay alumnos inscriptos.</Text>
              </View>
            ) : (
              <ScrollView style={styles.list} showsVerticalScrollIndicator>
                {alumnos.map((alumno, idx) => (
                  <View key={alumno.id || idx} style={styles.row}>
                    <TouchableOpacity
                      style={styles.alumnoLeft}
                      onPress={() => togglePresente(alumno)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkCircle, alumno.presente && styles.checkCircleActive]}>
                        {alumno.presente && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                      </View>
                      <View>
                        <Text style={[styles.alumnoName, alumno.presente && { color: '#16a34a' }]}>
                          {alumno.nombre}
                        </Text>
                        {alumno.presente && (
                          <Text style={styles.presenteLabel}>✓ Presente</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pulseraBtn}
                      onPress={() => descargarPulsera(alumno)}
                    >
                      <MaterialCommunityIcons name="download" size={14} color="#6366f1" />
                      <Text style={styles.pulseraBtnText}>Pulsera</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )
          )}

          {/* ── TAB: ESCANEO ─────────────────────────────── */}
          {activeTab === 'barcode' && (
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator>
              {/* Input código manual */}
              <View style={styles.barcodeSection}>
                <Text style={styles.sectionLabel}>Ingresar código manualmente</Text>
                <View style={styles.barcodeInputRow}>
                  <View style={styles.barcodeInputWrap}>
                    {Platform.OS === 'web' ? (
                      <input
                        type="text"
                        placeholder="Ej: 12345678 2025"
                        value={barcodeInput}
                        onChange={e => setBarcodeInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && registrarPorCodigo()}
                        style={{
                          width: '100%', padding: 10, border: '1.5px solid #e2e8f0',
                          borderRadius: 10, fontSize: 14, fontFamily: 'monospace',
                          outline: 'none', boxSizing: 'border-box'
                        }}
                        autoFocus
                      />
                    ) : (
                      <Text style={{ color: '#64748b', padding: 10 }}>Escáner disponible en web</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.scanBtn, scanLoading && { opacity: 0.6 }]}
                    onPress={() => registrarPorCodigo()}
                    disabled={scanLoading}
                  >
                    {scanLoading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <MaterialCommunityIcons name="send" size={18} color="#fff" />
                    }
                  </TouchableOpacity>
                </View>

                {/* Botón cámara */}
                <TouchableOpacity
                  style={[styles.cameraBtn, cameraActive && { backgroundColor: '#ef4444' }]}
                  onPress={cameraActive ? stopCamera : startCamera}
                >
                  <MaterialCommunityIcons
                    name={cameraActive ? 'camera-off' : 'camera'}
                    size={18} color="#fff"
                  />
                  <Text style={styles.cameraBtnText}>
                    {cameraActive ? 'Detener Cámara' : 'Escanear con Cámara'}
                  </Text>
                </TouchableOpacity>

                {/* Video de cámara */}
                {cameraActive && Platform.OS === 'web' && (
                  <View style={styles.cameraContainer}>
                    <video
                      ref={videoRef}
                      style={{ width: '100%', borderRadius: 12, maxHeight: 180 }}
                      playsInline
                      muted
                    />
                    <Text style={styles.cameraHint}>Apuntá el código de barras a la cámara</Text>
                  </View>
                )}

                {/* Mensaje de resultado */}
                {scanMessage && (
                  <View style={[styles.scanMsg, scanMessage.type === 'success' ? styles.scanMsgOk : styles.scanMsgErr]}>
                    <Text style={styles.scanMsgText}>{scanMessage.text}</Text>
                  </View>
                )}

                {/* Historial de escaneos */}
                {scanHistory.length > 0 && (
                  <View style={styles.historyBox}>
                    <Text style={styles.historyTitle}>Últimos registros de hoy</Text>
                    {scanHistory.map((s, i) => (
                      <View key={i} style={styles.historyRow}>
                        <MaterialCommunityIcons name="check-circle" size={16} color="#16a34a" />
                        <Text style={styles.historyName}>{s.nombre}</Text>
                        <Text style={styles.historyHora}>{s.hora}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          )}

          {/* ── TAB: HISTORIAL ─────────────────────────────── */}
          {activeTab === 'historial' && (
            <ScrollView style={styles.list} showsVerticalScrollIndicator>
              <Text style={styles.sectionLabel}>Seleccioná un alumno para ver su historial:</Text>
              {alumnos.map((alumno, idx) => (
                <View key={alumno.id || idx}>
                  <TouchableOpacity
                    style={[styles.row, { paddingVertical: 12 }]}
                    onPress={() => cargarHistorial(alumno)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.alumnoLeft}>
                      <MaterialCommunityIcons name={historialAlumno?.id === alumno.id ? "chevron-down" : "chevron-right"} size={20} color="#64748b" />
                      <Text style={[styles.alumnoName, { marginLeft: 8 }]}>{alumno.nombre}</Text>
                    </View>
                  </TouchableOpacity>
                  {historialAlumno?.id === alumno.id && (
                    <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 8, marginHorizontal: 4 }}>
                      {historialLoading ? (
                        <ActivityIndicator size="small" color="#009b3a" />
                      ) : historialData.length === 0 ? (
                        <Text style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic' }}>No hay registros de asistencia pasados.</Text>
                      ) : (
                        historialData.map((reg, i) => (
                          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <MaterialCommunityIcons name="check-circle" size={16} color="#16a34a" style={{ marginRight: 6 }} />
                            <Text style={{ color: '#334155', fontSize: 13, fontWeight: '500' }}>
                                {new Date(reg.fecha).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </Text>
                            {reg.metodoRegistro === 'CodigoBarras' && (
                                <Text style={{ color: '#94a3b8', fontSize: 11, marginLeft: 8 }}>[Escáner]</Text>
                            )}
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          {/* Footer */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>CERRAR</Text>
          </TouchableOpacity>

        </View>
      </View>

      <ConfirmModal
        visible={confirmVisible}
        onClose={() => {
          setConfirmVisible(false);
          setAlumnoToDesmarcar(null);
        }}
        onConfirm={handleDesmarcarConfirm}
        title="Desmarcar Asistencia"
        message={`¿Querés desmarcar la asistencia de ${alumnoToDesmarcar ? alumnoToDesmarcar.nombre : ''} de hoy?`}
        confirmText="Desmarcar"
        cancelText="Cancelar"
        icon="account-remove"
        color="#ef4444"
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: {
    backgroundColor: '#fff', width: '93%', maxWidth: 480,
    borderRadius: 28, padding: 24, maxHeight: '92%',
    elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 16
  },
  header: { marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  subTitle: { fontSize: 13, color: '#009b3a', fontWeight: '800', marginTop: 3 },
  dateText: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2 },

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  summaryItem: { flex: 1, padding: 10, borderRadius: 12, alignItems: 'center' },
  summaryCount: { fontSize: 20, fontWeight: '900' },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', marginTop: 2 },

  tabs: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 14, gap: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, gap: 5 },
  tabActive: { backgroundColor: '#009b3a' },
  tabText: { fontSize: 13, fontWeight: '800', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  list: { maxHeight: 280, marginBottom: 12 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  alumnoLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: '#cbd5e1',
    justifyContent: 'center', alignItems: 'center', marginRight: 10
  },
  checkCircleActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  alumnoName: { fontSize: 14, fontWeight: '700', color: '#334155' },
  presenteLabel: { fontSize: 10, color: '#16a34a', fontWeight: '700', marginTop: 1 },
  pulseraBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ede9fe', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8
  },
  pulseraBtnText: { fontSize: 11, fontWeight: '800', color: '#6366f1' },

  emptyBox: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { color: '#94a3b8', fontWeight: '600', marginTop: 10 },

  barcodeSection: { paddingBottom: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#64748b', marginBottom: 8 },
  barcodeInputRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  barcodeInputWrap: { flex: 1 },
  scanBtn: {
    backgroundColor: '#009b3a', paddingHorizontal: 14, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center'
  },
  cameraBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#6366f1', borderRadius: 10, padding: 11, gap: 8, marginBottom: 10
  },
  cameraBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  cameraContainer: { marginBottom: 10 },
  cameraHint: { textAlign: 'center', color: '#64748b', fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  scanMsg: { borderRadius: 10, padding: 12, marginBottom: 10 },
  scanMsgOk: { backgroundColor: '#f0fdf4' },
  scanMsgErr: { backgroundColor: '#fef2f2' },
  scanMsgText: { fontWeight: '700', fontSize: 13, color: '#1e293b' },
  historyBox: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12 },
  historyTitle: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 6 },
  historyName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#334155' },
  historyHora: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },

  closeBtn: { backgroundColor: '#f1f5f9', padding: 13, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  closeText: { color: '#475569', fontWeight: '900', letterSpacing: 0.5 },
});
