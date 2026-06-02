import { http, API_BASE_URL } from './apiConfig';

export const asistenciaService = {
  getAsistenciasPorClaseYFecha: async (claseId, fecha) => {
    try {
      // Formateamos la fecha a YYYY-MM-DD para la query string
      const dateString = new Date(fecha).toISOString().split('T')[0];
      const data = await http.get(`${API_BASE_URL}/Asistencia/clase/${claseId}?fecha=${dateString}`);
      return data;
    } catch (error) {
      throw error;
    }
  },

  marcarAsistencia: async (payload) => {
    try {
      const data = await http.post(`${API_BASE_URL}/Asistencia/marcar`, payload);
      return data;
    } catch (error) {
      throw error;
    }
  }
};
