import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, TextInput, Platform, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenTemplate from './ScreenTemplate';

import CanchaCard from '../components/CanchaCard';
import CanchaFormModal from '../components/CanchaFormModal';
import DeleteModal from '../components/DeleteModal';
import SuccessModal from '../components/SuccessModal';
import ConfirmModal from '../components/ConfirmModal';
import DescuentosModal from '../components/DescuentosModal';
import { canchaService } from '../services/canchaService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { reportHistoryService } from '../services/reportHistoryService';

export default function CanchaScreen({ route, navigation }) {
  const { role: currentUserRole, nombreUsuario = "Administrador" } = route.params || { role: "ADMIN" };

  // --- ESTADO INICIAL ---
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [canchaToDelete, setCanchaToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [formError, setFormError] = useState('');
  const [currentPdfHtml, setCurrentPdfHtml] = useState(null);
  const [confirmReportModalVisible, setConfirmReportModalVisible] = useState(false);
  const [descuentosModalVisible, setDescuentosModalVisible] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'F5',
    superficie: 'Sintético',
    capacidad: '',
    enMantenimiento: false
  });

  // --- LÓGICA DE PERMISOS ---
  const canModify = currentUserRole === 'ADMIN';
  const canToggleMaintenance = currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL';
  const canGenerateReport = currentUserRole === 'ADMIN' || currentUserRole === 'PERSONAL';

  // --- EFECTOS ---
  useEffect(() => {
    loadCanchas();
  }, []);

  const loadCanchas = async () => {
    setLoading(true);
    try {
      const data = await canchaService.getAll();
      const mapped = data.map(c => ({
        id: c.id.toString(),
        nombre: c.nombre,
        tipo: c.tipo === "Futbol5" ? "F5" : (c.tipo === "Futbol7" ? "F7" : "F11"),
        superficie: c.superficie === "1" ? "Sintético" : c.superficie === "2" ? "Césped Natural" : c.superficie === "3" ? "Parquet" : "Cemento",
        capacidad: c.capacidad.toString(),
        enMantenimiento: c.estado === 'Mantenimiento',
        original: c
      }));
      setCanchas(mapped);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las canchas.");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIONES ---
  const handleOpenModal = (cancha = null) => {
    setFormError('');
    if (cancha) {
      let dim = "20x40m";
      let precio = 30000;
      if (cancha.tipo === 'F7') { dim = "30x50m"; precio = 65000; }
      else if (cancha.tipo === 'F11') { dim = "45x90m"; precio = 120000; }
      
      setFormData({ ...cancha, dimensiones: dim, precioBase: cancha.original?.precioPorHora || precio, duracionMax: cancha.original?.duracionMax || 60 });
      setIsEditing(true);
    } else {
      setFormData({ nombre: '', tipo: 'F5', superficie: 'Sintético', capacidad: '10', dimensiones: '20x40m', precioBase: 30000, enMantenimiento: false, duracionMax: 60 });
      setIsEditing(false);
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!formData.nombre || !formData.capacidad) {
      setFormError("El nombre y la capacidad son obligatorios.");
      return;
    }
    
    const basePayload = {
      Nombre: formData.nombre,
      Tipo: formData.tipo === "F5" ? 5 : (formData.tipo === "F7" ? 7 : 11),
      Superficie: formData.superficie === "Sintético" ? 1 : formData.superficie === "Césped Natural" ? 2 : formData.superficie === "Parquet" ? 3 : 4,
      Capacidad: parseInt(formData.capacidad) || 10,
      Estado: formData.enMantenimiento ? 2 : 1
    };

    try {
      if (isEditing) {
        const payload = {
          ...basePayload,
          Disponibilidad: formData.original?.disponibilidad ?? true,
          HoraInicio: formData.original?.horaInicio ?? "08:00:00",
          HoraFin: formData.original?.horaFin ?? "23:00:00",
          DuracionMax: formData.duracionMax || 60,
          PrecioPorHora: formData.precioBase ?? (formData.original?.precioPorHora ?? 30000)
        };
        await canchaService.update(formData.id, payload);
        setSuccessMessage("Los cambios han sido guardados exitosamente.");
      } else {
        const payload = {
          ...basePayload,
          Disponibilidad: true,
          HoraInicio: "08:00:00",
          HoraFin: "23:00:00",
          DuracionMax: formData.duracionMax || 60,
          PrecioPorHora: formData.precioBase ?? 30000
        };
        await canchaService.create(payload);
        setSuccessMessage("La nueva cancha ha sido registrada exitosamente.");
      }
      setModalVisible(false);
      loadCanchas();
      setSuccessModalVisible(true);
    } catch (error) {
      setFormError(error.message || "Error al guardar la cancha");
    }
  };

  const handleToggleMaintenance = async (canchaId) => {
    const cancha = canchas.find(c => c.id === canchaId);
    if (!cancha) return;
    
    const newMantenimiento = !cancha.enMantenimiento;
    const payload = {
      Nombre: cancha.nombre,
      Tipo: cancha.tipo === "F5" ? 5 : (cancha.tipo === "F7" ? 7 : 11),
      Superficie: cancha.superficie === "Sintético" ? 1 : cancha.superficie === "Césped Natural" ? 2 : cancha.superficie === "Parquet" ? 3 : 4,
      Capacidad: parseInt(cancha.capacidad) || 10,
      Estado: newMantenimiento ? 2 : 1,
      Disponibilidad: cancha.original?.disponibilidad ?? true,
      HoraInicio: cancha.original?.horaInicio ?? "08:00:00",
      HoraFin: cancha.original?.horaFin ?? "23:00:00",
      DuracionMax: cancha.original?.duracionMax ?? 60,
      PrecioPorHora: cancha.original?.precioPorHora ?? 5000
    };

    try {
      await canchaService.update(canchaId, payload);
      setCanchas(prev => prev.map(c => c.id === canchaId ? { ...c, enMantenimiento: newMantenimiento, original: { ...c.original, estado: newMantenimiento ? "Mantenimiento" : "Disponible" } } : c));
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el estado.");
    }
  };

  const handleGenerateReport = () => {
    setConfirmReportModalVisible(true);
  };

  const executeGenerateReport = async () => {
    const d = new Date();
    const formattedDate = `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
    const userNameFormatted = nombreUsuario.replace(/\s+/g, '');
    const fileName = `Reporte-Canchas-${userNameFormatted}-${formattedDate}`;

    let rows = canchas.map(c => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${c.nombre}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${c.tipo}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${c.superficie}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${c.enMantenimiento ? 'Mantenimiento' : 'Activa'}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #000; }
            .header { text-align: left; margin-bottom: 30px; }
            .brand { color: #009b3a; font-size: 50px; font-weight: 900; margin: 0; }
            .report-type { font-size: 24px; font-weight: bold; margin-top: 10px; margin-bottom: 10px; }
            .generated-by { font-size: 16px; color: #555; }
            .line { border-bottom: 2px solid #000; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align: left; }
            th { background-color: #009b3a; color: white; padding: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="brand">Gol Ahora</h1>
            <div class="report-type">Reporte de Estado de Canchas</div>
            <div class="generated-by">Reporte generado por: <b>${nombreUsuario}</b></div>
            <div class="generated-by">Fecha: ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}</div>
          </div>
          <div class="line"></div>
          <table>
            <thead>
              <tr><th>Cancha</th><th>Tipo</th><th>Superficie</th><th>Estado</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;
    
    await reportHistoryService.saveReporte(html, fileName);
    setCurrentPdfHtml({ html, fileName });
    setSuccessMessage("¡PDF generado exitosamente!");
    setSuccessModalVisible(true);
  };

  const downloadPdf = async (pdfData) => {
    if (Platform.OS === 'web') {
      const html2pdf = require('html2pdf.js');
      const element = document.createElement('div');
      element.innerHTML = pdfData.html;
      html2pdf().from(element).set({
        margin: 10,
        filename: pdfData.fileName + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save();
    } else {
      const { uri } = await Print.printToFileAsync({ html: pdfData.html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    }
  };



  const confirmDelete = (cancha) => {
    setCanchaToDelete(cancha);
    setDeleteModalVisible(true);
  };

  const executeDelete = async () => {
    if (canchaToDelete) {
      try {
        await canchaService.delete(canchaToDelete.id);
        setCanchas(prev => prev.filter(x => x.id !== canchaToDelete.id));
        setDeleteModalVisible(false);
        setSuccessMessage("La cancha ha sido eliminada exitosamente.");
        setSuccessModalVisible(true);
      } catch (error) {
        Alert.alert("Error", "No se pudo eliminar la cancha.");
      }
    }
  };

  const filteredCanchas = canchas.filter(c => 
    c.nombre.toLowerCase().includes(search.toLowerCase()) || 
    c.tipo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
      
      {/* BUSCADOR PREMIUM */}
      <View style={[styles.searchWrapper, isSearchFocused && styles.searchWrapperFocused]}>
        <View style={styles.searchInner}>
            <MaterialCommunityIcons name="magnify" size={22} color={isSearchFocused ? "#009b3a" : "#94a3b8"} />
            <TextInput 
              placeholder="Buscar por nombre o tipo (F5, F7...)" 
              placeholderTextColor="#94a3b8" 
              value={search} 
              onChangeText={setSearch} 
              onFocus={() => setIsSearchFocused(true)} 
              onBlur={() => setIsSearchFocused(false)} 
              style={styles.searchInputNav} 
            />
        </View>
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.mainTitle}>Gestión de Canchas</Text>
        <View style={styles.headerActions}>
            {canGenerateReport && (
                <TouchableOpacity style={[styles.reportButton, { flexDirection: 'row', alignItems: 'center' }]} onPress={handleGenerateReport}>
                    <MaterialCommunityIcons name="file-document-edit-outline" size={24} color="#000" />
                    <Text style={{ fontWeight: '900', color: '#000', marginLeft: 5 }}>GENERAR REPORTE</Text>
                </TouchableOpacity>
            )}
            {canModify && (
                <>
                  <TouchableOpacity style={[styles.reportButton, { backgroundColor: '#3b82f6', flexDirection: 'row', alignItems: 'center' }]} onPress={() => setDescuentosModalVisible(true)}>
                      <MaterialCommunityIcons name="percent" size={24} color="#fff" />
                      <Text style={{ fontWeight: '900', color: '#fff', marginLeft: 5 }}>DESCUENTOS</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
                      <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                      <Text style={styles.addButtonText}>NUEVA</Text>
                  </TouchableOpacity>
                </>
            )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#009b3a" style={{ marginTop: 50 }} />
        ) : filteredCanchas.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 50, color: '#94a3b8' }}>No hay canchas disponibles.</Text>
        ) : (
          filteredCanchas.map(item => (
            <CanchaCard 
              key={item.id} 
              item={item} 
              onEdit={handleOpenModal} 
              onDelete={(c) => confirmDelete(c)} 
              onToggleMaintenance={() => handleToggleMaintenance(item.id)}
              canModify={canModify} 
              canToggleMaintenance={canToggleMaintenance}
            />
          ))
        )}
      </ScrollView>

      <CanchaFormModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        isEditing={isEditing} 
        formData={formData} 
        setFormData={setFormData} 
        onSave={handleSave} 
        errorMessage={formError}
      />

      <DeleteModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={executeDelete}
        title="Eliminar Cancha"
        itemName={canchaToDelete ? canchaToDelete.nombre : ''}
      />

      <ConfirmModal
        visible={confirmReportModalVisible}
        onClose={() => setConfirmReportModalVisible(false)}
        onConfirm={executeGenerateReport}
        title="Generar Reporte"
        message="¿Desea generar un reporte con el estado actual de las canchas?"
        confirmText="SÍ"
        cancelText="CANCELAR"
      />

      <SuccessModal
        visible={successModalVisible}
        onClose={() => { setSuccessModalVisible(false); setCurrentPdfHtml(null); }}
        message={successMessage}
        actionButtonText={currentPdfHtml ? "DESCARGAR PDF" : null}
        onAction={currentPdfHtml ? () => downloadPdf(currentPdfHtml) : null}
      />

      <DescuentosModal
        visible={descuentosModalVisible}
        onClose={() => setDescuentosModalVisible(false)}
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  searchWrapper: { width: '100%', backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, elevation: 4, borderWidth: 1, borderColor: '#f1f5f9' },
  searchWrapperFocused: { borderColor: '#009b3a', borderWidth: 1.5 },
  searchInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 55 },
  searchInputNav: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#1e293b', outlineStyle: 'none' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mainTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  reportButton: { backgroundColor: '#ffb300', padding: 10, borderRadius: 12, marginRight: 10, elevation: 2 },
  addButton: { backgroundColor: '#009b3a', flexDirection: 'row', padding: 10, borderRadius: 12, alignItems: 'center', elevation: 2 },
  addButtonText: { fontWeight: '900', marginLeft: 5, color: '#fff' },
});
