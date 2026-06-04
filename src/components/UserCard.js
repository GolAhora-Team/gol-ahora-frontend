import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function UserCard({ item, onEdit, onDelete, onReport, onDownloadCert, canModify }) {
  // Manejo de errores de datos: si no hay item, no renderizamos nada
  if (!item) return null;

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const nacimiento = new Date(fechaNacimiento);
    if (isNaN(nacimiento)) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const edad = calcularEdad(item.fechaNacimiento);

  const getCertificadoStatus = () => {
    if (!item.tieneCertificado) return { text: 'Sin Certificado', color: '#ef4444', bg: '#fee2e2', icon: 'certificate-outline' };
    
    // Check if the certificate doesn't expire or has no end date but is valid
    if (item.sinCaducidad || !item.certificadoFechaFin) return { text: 'Certificado Vigente', color: '#059669', bg: '#d1fae5', icon: 'certificate' };
    
    if (item.certificadoFechaFin) {
      // Backend returns ISO string e.g. "2024-12-31T00:00:00", or date only
      const endDate = new Date(item.certificadoFechaFin);
      
      if (!isNaN(endDate) && endDate < new Date()) {
        return { text: 'Certificado Vencido', color: '#ef4444', bg: '#fee2e2', icon: 'certificate' };
      }
    }
    
    return { text: 'Certificado Vigente', color: '#059669', bg: '#d1fae5', icon: 'certificate' };
  };

  const certStatus = item.role === 'PROFE' ? getCertificadoStatus() : null;

  return (
    <View style={styles.card}>
      <View style={styles.infoSide}>
        {/* Usamos valores por defecto por si el backend falla */}
        <Text style={styles.userName}>
          {(item.nombre || 'Sin nombre')} {(item.apellido || '')}
        </Text>
        
        <View style={styles.specRow}>
          <Text style={styles.specText}>
            DNI: {item.dni || 'N/A'} • Tel: {item.telefono || 'N/A'}{edad !== null ? ` • Edad: ${edad} años` : ''}
          </Text>
        </View>
        
        {item.email ? (
          <Text style={styles.userEmail}>{item.email}</Text>
        ) : null}

        <View style={styles.badgesRow}>
          {item.aptoFisico && (
            <View style={[styles.badge, styles.badgeApto]}>
              <MaterialCommunityIcons name="heart-pulse" size={12} color="#059669" />
              <Text style={styles.badgeTextApto}>Apto Físico</Text>
            </View>
          )}
          {item.esSocioActivo && (
            <View style={[styles.badge, styles.badgeSocio]}>
              <MaterialCommunityIcons name="star-circle-outline" size={12} color="#d97706" />
              <Text style={styles.badgeTextSocio}>Socio Activo</Text>
            </View>
          )}
          {item.role === 'PROFE' && certStatus && (
            <View style={[styles.badge, { backgroundColor: certStatus.bg }]}>
              <MaterialCommunityIcons name={certStatus.icon} size={12} color={certStatus.color} />
              <Text style={[styles.badgeTextApto, { color: certStatus.color }]}>{certStatus.text}</Text>
            </View>
          )}
        </View>

      </View>

      {/* Verificamos el permiso de modificación */}
      {canModify === true && (
        <View style={styles.actionSide}>
          {/* Reporte — CLIENTE y PROFE */}
          {(item.role === 'CLIENTE' || item.role === 'PROFE') && (
            <TouchableOpacity 
              onPress={() => onReport && onReport(item)} 
              style={[styles.actionBtn, { backgroundColor: '#fffbeb' }]}
            >
              <MaterialCommunityIcons name="file-document-edit-outline" size={20} color="#f59e0b" />
            </TouchableOpacity>
          )}

          {/* Descargar certificado — solo PROFE con certificado */}
          {item.role === 'PROFE' && item.tieneCertificado && (
            <TouchableOpacity 
              onPress={() => onDownloadCert && onDownloadCert(item)} 
              style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]}
            >
              <MaterialCommunityIcons name="certificate" size={20} color="#ef4444" />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            onPress={() => onEdit && onEdit(item)} 
            style={[styles.actionBtn, { backgroundColor: '#f0fdf4' }]}
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#009b3a" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => onDelete && onDelete(item)} 
            style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 15, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    elevation: 3,
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoSide: { flex: 1 },
  userName: { 
    fontSize: 16, // Bajamos un poco el tamaño para pantallas chicas
    fontWeight: '800', 
    color: '#009b3a',
  },
  specRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  specText: { 
    color: '#1e293b', 
    fontSize: 12, 
    fontWeight: '700' 
  },
  userEmail: { 
    color: '#94a3b8', 
    fontSize: 11, 
    marginTop: 2,
    fontWeight: '600'
  },
  actionSide: { 
    flexDirection: 'row', 
    gap: 8, 
    alignItems: 'center',
    marginLeft: 10
  },
  actionBtn: { 
    padding: 8, // Ajustamos el padding para que no sea tan gigante
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  badgesRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, gap: 4 },
  badgeApto: { backgroundColor: '#d1fae5' },
  badgeTextApto: { color: '#059669', fontSize: 10, fontWeight: '800' },
  badgeSocio: { backgroundColor: '#fef3c7' },
  badgeTextSocio: { color: '#d97706', fontSize: 10, fontWeight: '800' }
});
