import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';
import AsistenciaModal from '../components/AsistenciaModal';
import VerAlumnosModal from '../components/VerAlumnosModal';
import CreateActivityModal from '../components/CreateActivityModal';
import { claseService } from '../services/claseService';
import { entrenamientoService } from '../services/entrenamientoService';
import { profesorService } from '../services/profesorService';
import { userService } from '../services/userService';

export default function StaffScreen({ route, navigation }) {
  const { role: currentUserRole, userName = "NombreProfe ApellidoProfe" } = route.params || { role: "PROFE" };

  const [todasLasClases, setTodasLasClases] = useState([]);
  const [todosLosEntrenamientos, setTodosLosEntrenamientos] = useState([]);
  const [activeTab, setActiveTab] = useState('CLASES');
  const [loading, setLoading] = useState(true);

  const [asistenciaModalVisible, setAsistenciaModalVisible] = useState(false);
  const [claseSeleccionada, setClaseSeleccionada] = useState(null);
  
  const [alumnosModalVisible, setAlumnosModalVisible] = useState(false);
  const [claseParaAlumnos, setClaseParaAlumnos] = useState(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createType, setCreateType] = useState('CLASE');
  const [editData, setEditData] = useState(null);
  const [downloadingReporteId, setDownloadingReporteId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clasesData, entrenamientosData, profesoresData] = await Promise.all([
        claseService.getAll().catch(() => []),
        entrenamientoService.getAll().catch(() => []),
        profesorService.getAll().catch(() => [])
      ]);
      
      const profesoresMap = {};
      (profesoresData || []).forEach(p => {
        if (p.id) {
          profesoresMap[p.id.toString()] = `${p.nombre} ${p.apellido}`;
        }
      });
      
      const mappedClases = (clasesData || []).map(c => {
        const profeNombre = c.profesor ? `${c.profesor.nombre} ${c.profesor.apellido}` : (c.profesorNombre || c.profe || 'Sin asignar');
        const profId = c.profesor?.id?.toString() || c.profesor?.Id?.toString() || c.profesorId?.toString();
        const cantidadInscriptos = typeof c.cantidadAlumnos === 'number' 
          ? c.cantidadAlumnos 
          : (Array.isArray(c.alumnos) ? c.alumnos.length : (c.clientes?.length || c.asistencias?.length || 0));

        return {
          ...c,
          id: (c.id || c.Id)?.toString(),
          profe: profeNombre,
          profesorId: profId,
          alumnos: cantidadInscriptos,
          precio: c.precioInscripcion,
          capacidad: c.capacidadMax || c.capacidad || 20,
          horario: c.descripcion || `${c.horaInicio} - ${c.horaFin}`
        };
      });
      setTodasLasClases(mappedClases);

      const mappedEntrenamientos = (entrenamientosData || []).map(e => {
        const profId = e.profesorId?.toString();
        const profeNombre = profesoresMap[profId] || e.profesorNombre || e.profe || 'Sin asignar';
        const cantidadInscriptos = typeof e.cantidadAlumnos === 'number' 
          ? e.cantidadAlumnos 
          : (Array.isArray(e.alumnos) ? e.alumnos.length : (e.clientes?.length || 0));

        const formattedHorario = e.diasSemana && e.horaInicio && e.horaFin 
          ? `${e.diasSemana} ${e.horaInicio.substring(0,5)}-${e.horaFin.substring(0,5)}`
          : (e.fecha ? e.fecha.split('T')[0] : 'Sin fecha');

        return {
          ...e,
          id: (e.id || e.Id)?.toString(),
          profe: profeNombre,
          profesorId: profId,
          alumnos: cantidadInscriptos,
          precio: e.precioInscripcion || 0,
          capacidad: e.cupoMaximo || 20,
          horario: formattedHorario
        };
      });
      setTodosLosEntrenamientos(mappedEntrenamientos);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const itemsVisibles = () => {
    const lista = activeTab === 'CLASES' ? todasLasClases : todosLosEntrenamientos;
    if (currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL') {
      return lista;
    }
    return lista.filter(item => item.profe === userName);
  };

  const abrirAsistencia = (clase) => {
    setClaseSeleccionada(clase);
    setAsistenciaModalVisible(true);
  };

  const handleOpenCreate = (type) => {
    setEditData(null);
    setCreateType(type);
    setCreateModalVisible(true);
  };

  const handleOpenEdit = (item, type) => {
    setEditData(item);
    setCreateType(type);
    setCreateModalVisible(true);
  };

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const confirmAction = (title, message) => {
    if (Platform.OS === 'web') {
      return window.confirm(`${title}\n\n${message}`);
    }
    // Para nativo, devolver una promesa que se resuelve con el Alert
    return new Promise((resolve) => {
      Alert.alert(title, message, [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Confirmar', style: 'destructive', onPress: () => resolve(true) }
      ]);
    });
  };

  const handleCreateSave = async (payload, type) => {
    if (editData) {
      if (type === 'CLASE') {
        await claseService.update(editData.id, payload);
      } else {
        await entrenamientoService.update(editData.id, payload);
      }
      showAlert(
        '✅ ¡Actualizado con éxito!',
        `${type === 'CLASE' ? 'La clase' : 'El entrenamiento'} "${payload.nombre}" se actualizó correctamente.`
      );
    } else {
      if (type === 'CLASE') {
        await claseService.create(payload);
      } else {
        await entrenamientoService.create(payload);
      }
      showAlert(
        '✅ ¡Creado con éxito!',
        `${type === 'CLASE' ? 'La clase' : 'El entrenamiento'} "${payload.nombre}" se guardó en la base de datos.`
      );
    }
    loadData();
  };

  const abrirVerAlumnos = (clase) => {
    setClaseParaAlumnos(clase);
    setAlumnosModalVisible(true);
  };

  const handleDeleteActivity = async (id, type, nombre) => {
    const confirmed = await confirmAction(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar ${type === 'CLASE' ? 'la clase' : 'el entrenamiento'} "${nombre}"?`
    );
    if (!confirmed) return;

    try {
      if (type === 'CLASE') {
        await claseService.delete(id);
      } else {
        await entrenamientoService.delete(id);
      }
      showAlert('Éxito', 'Eliminado correctamente.');
      loadData();
    } catch (error) {
      showAlert('Error', error.message || 'No se pudo eliminar.');
    }
  };

  const handleDescargarReporteProfesor = async (profesorId, profesorNombre) => {
    setDownloadingReporteId(profesorId);
    try {
      const blob = await profesorService.descargarReporte(profesorId);
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Profesor_${profesorNombre || profesorId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        Alert.alert('Reporte', 'Descarga disponible solo en la versión web.');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo generar el reporte.');
    } finally {
      setDownloadingReporteId(null);
    }
  };

  if (loading) {
    return (
      <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#009b3a" />
          <Text style={{ color: '#fff', marginTop: 10, fontWeight: '600' }}>Cargando...</Text>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {currentUserRole === 'PROFE' ? 'Mis Clases' : 'Gestión de Cuerpo Técnico'}
          </Text>
          <Text style={styles.subTitle}>
            {currentUserRole === 'PROFE' ? `Profesor: ${userName}` : 'Panel Administrativo'}
          </Text>
        </View>
      </View>

      {(currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL') && (
        <View style={styles.adminActions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6366f1' }]} onPress={() => handleOpenCreate('CLASE')}>
            <MaterialCommunityIcons name="plus-box" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Crear Clase</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f97316' }]} onPress={() => handleOpenCreate('ENTRENAMIENTO')}>
            <MaterialCommunityIcons name="plus-box" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Crear Entrenamiento</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'CLASES' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('CLASES')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'CLASES' && styles.tabBtnTextActive]}>Ver Clases</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'ENTRENAMIENTOS' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('ENTRENAMIENTOS')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'ENTRENAMIENTOS' && styles.tabBtnTextActive]}>Ver Entrenamientos</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 20 }}>
        {itemsVisibles().map(item => (
          <View key={item.id} style={styles.claseCard}>
            <View style={styles.cardHeaderTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.claseTitle}>{item.nombre}</Text>
                <View style={styles.alumnosBadge}>
                  <MaterialCommunityIcons name="account-group" size={14} color="#009b3a" />
                  <Text style={styles.badgeText}>{item.alumnos} / {item.capacidad} Inscriptos</Text>
                </View>
              </View>

              {(currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL') && (
                <View style={styles.adminCardActions}>
                  <TouchableOpacity 
                    style={styles.iconBtnEdit} 
                    onPress={() => handleOpenEdit(item, activeTab === 'CLASES' ? 'CLASE' : 'ENTRENAMIENTO')}
                  >
                    <MaterialCommunityIcons name="pencil" size={18} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.iconBtnDelete} 
                    onPress={() => handleDeleteActivity(item.id, activeTab === 'CLASES' ? 'CLASE' : 'ENTRENAMIENTO', item.nombre)}
                  >
                    <MaterialCommunityIcons name="delete" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.cardInfoGrid}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Inicio</Text>
                <Text style={styles.infoValue}>{item.horario}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Cancha</Text>
                <Text style={[styles.infoValue, (!item.canchaId || item.canchaNombre === 'Sin Cancha') && { color: '#ef4444' }]}>
                  {item.canchaNombre || 'Sin Cancha'}
                </Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Precio</Text>
                <Text style={styles.infoValue}>${item.precio}</Text>
              </View>
              {(currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL') && (
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Profesor</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{item.profe}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.cardActionsContainer}>
              <View style={styles.btnRow}>
                <TouchableOpacity 
                  style={styles.verAlumnosBtn} 
                  onPress={() => abrirVerAlumnos(item)}
                >
                  <MaterialCommunityIcons name="account-multiple" size={16} color="#64748b" />
                  <Text style={styles.btnTextInfo}>VER ALUMNOS</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.asistenciaBtn} 
                  onPress={() => abrirAsistencia(item)}
                >
                  <MaterialCommunityIcons name="barcode-scan" size={16} color="#fff" />
                  <Text style={styles.btnText}>ASISTENCIA</Text>
                </TouchableOpacity>
              </View>

              {(currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL') && item.profesorId && (
                <TouchableOpacity
                  style={[styles.reporteBtn, downloadingReporteId === item.profesorId && { opacity: 0.5 }]}
                  onPress={() => handleDescargarReporteProfesor(item.profesorId, item.profe)}
                  disabled={downloadingReporteId === item.profesorId}
                >
                  {downloadingReporteId === item.profesorId
                    ? <ActivityIndicator size="small" color="#f59e0b" />
                    : <MaterialCommunityIcons name="file-chart-outline" size={16} color="#f59e0b" />
                  }
                  <Text style={styles.reporteBtnText}>REPORTE PROFE</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {itemsVisibles().length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay {activeTab === 'CLASES' ? 'clases' : 'entrenamientos'} para mostrar.</Text>
          </View>
        )}
      </ScrollView>

      <AsistenciaModal 
        visible={asistenciaModalVisible} 
        onClose={() => setAsistenciaModalVisible(false)} 
        claseId={claseSeleccionada?.id}
        claseNombre={claseSeleccionada?.nombre || ""}
        esEntrenamiento={activeTab === 'ENTRENAMIENTOS'}
      />


      <VerAlumnosModal
        visible={alumnosModalVisible}
        onClose={() => setAlumnosModalVisible(false)}
        claseId={claseParaAlumnos?.id}
        claseNombre={claseParaAlumnos?.nombre}
        esEntrenamiento={activeTab === 'ENTRENAMIENTOS'}
      />

      <CreateActivityModal 
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSave={handleCreateSave}
        title={editData ? (createType === 'CLASE' ? 'Editar Clase' : 'Editar Entrenamiento') : (createType === 'CLASE' ? 'Nueva Clase' : 'Nuevo Entrenamiento')}
        type={createType}
        initialData={editData}
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },
  subTitle: { fontSize: 13, color: '#ffb300', fontWeight: '700', marginTop: 2 },
  adminActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: { backgroundColor: '#009b3a', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, flex: 1, justifyContent: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '900', marginLeft: 8, fontSize: 13 },
  claseCard: { 
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 16, 
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8,
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  cardHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12, marginBottom: 12 },
  claseTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b', marginBottom: 6 },
  adminCardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBtnEdit: {
    backgroundColor: '#eff6ff', padding: 8, borderRadius: 10,
    borderWidth: 1, borderColor: '#bfdbfe',
    justifyContent: 'center', alignItems: 'center',
    width: 36, height: 36
  },
  iconBtnDelete: {
    backgroundColor: '#fef2f2', padding: 8, borderRadius: 10,
    borderWidth: 1, borderColor: '#fecaca',
    justifyContent: 'center', alignItems: 'center',
    width: 36, height: 36
  },
  alumnosBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#009b3a' },
  
  cardInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  infoCol: { flex: 1, minWidth: '30%' },
  infoLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#334155' },

  cardActionsContainer: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 14 },
  btnRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  asistenciaBtn: { flex: 1, backgroundColor: '#009b3a', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, elevation: 2, shadowColor: '#009b3a', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  verAlumnosBtn: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  btnTextInfo: { color: '#64748b', fontSize: 12, fontWeight: '900' },
  reporteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fffbeb', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#fde68a', marginTop: 8 },
  reporteBtnText: { color: '#f59e0b', fontSize: 12, fontWeight: '900' },
  
  emptyContainer: { marginTop: 50, alignItems: 'center' },
  emptyText: { color: '#fff', fontSize: 14, fontStyle: 'italic', opacity: 0.8 },
  tabsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#009b3a' },
  tabBtnText: { color: '#a1a1aa', fontWeight: '800', fontSize: 13 },
  tabBtnTextActive: { color: '#ffffff' }
});
