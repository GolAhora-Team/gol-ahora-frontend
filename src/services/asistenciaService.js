import { API_BASE_URL, http } from './apiConfig';

export const asistenciaService = {
  /**
   * GET /api/Asistencia/clase/{claseId}?fecha=...
   * Obtiene las asistencias de una clase para una fecha dada.
   */
  getAsistenciasPorActividadYFecha: async (actividadId, fecha, esClase) => {
    try {
      let dateString;
      if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        dateString = fecha;
      } else {
        const d = new Date(fecha);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateString = `${year}-${month}-${day}`;
      }
      return await http.get(`${API_BASE_URL}/Asistencia/actividad/${actividadId}?fecha=${dateString}&esClase=${esClase}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * POST /api/Asistencia/manual?actividadId=&clienteId=&esClase=
   * Registra la asistencia de un alumno de forma manual (desde admin/profe).
   */
  registrarManual: async (actividadId, clienteId, esClase) => {
    try {
      return await http.post(
        `${API_BASE_URL}/Asistencia/manual?actividadId=${actividadId}&clienteId=${clienteId}&esClase=${esClase}`
      );
    } catch (error) {
      throw error;
    }
  },

  /**
   * POST /api/Asistencia/barcode?codigoBarras=&actividadId=&esClase=
   * Registra la asistencia mediante escaneo de código de barras.
   */
  registrarCodigoBarras: async (codigoBarras, actividadId, esClase) => {
    try {
      return await http.post(
        `${API_BASE_URL}/Asistencia/barcode?codigoBarras=${encodeURIComponent(codigoBarras)}&actividadId=${actividadId}&esClase=${esClase}`
      );
    } catch (error) {
      throw error;
    }
  },

  /**
   * DELETE /api/Asistencia/actividad/{actividadId}/cliente/{clienteId}?esClase=
   * Elimina la asistencia registrada hoy para un alumno.
   */
  eliminarAsistencia: async (actividadId, clienteId, esClase) => {
    try {
      return await http.delete(`${API_BASE_URL}/Asistencia/actividad/${actividadId}/cliente/${clienteId}?esClase=${esClase}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * GET /api/Asistencia/historial/{actividadId}/cliente/{clienteId}?esClase=
   * Obtiene el historial de asistencias pasadas de un alumno.
   */
  getHistorialAsistencias: async (actividadId, clienteId, esClase) => {
    try {
      return await http.get(`${API_BASE_URL}/Asistencia/historial/${actividadId}/cliente/${clienteId}?esClase=${esClase}`);
    } catch (error) {
      throw error;
    }
  },
};

