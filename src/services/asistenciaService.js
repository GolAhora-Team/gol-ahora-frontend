import { API_BASE_URL, http } from './apiConfig';

export const asistenciaService = {
  /**
   * GET /api/Asistencia/clase/{claseId}?fecha=...
   * Obtiene las asistencias de una clase para una fecha dada.
   */
  getAsistenciasPorClaseYFecha: async (claseId, fecha) => {
    try {
      const dateString = new Date(fecha).toISOString().split('T')[0];
      return await http.get(`${API_BASE_URL}/Asistencia/clase/${claseId}?fecha=${dateString}`);
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
};

