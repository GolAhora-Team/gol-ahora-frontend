import { API_BASE_URL, http } from './apiConfig';

const ENDPOINT = `${API_BASE_URL}/Reporte`;

export const reportHistoryService = {
  getReportes: async () => {
    try {
      return await http.get(ENDPOINT);
    } catch (error) {
      console.error("Error leyendo reportes", error);
      return [];
    }
  },

  saveReporte: async (reporteHtml, fileName) => {
    try {
      const request = {
        fileName: fileName || `Reporte-${Date.now()}`,
        html: reporteHtml
      };
      return await http.post(ENDPOINT, request);
    } catch (error) {
      console.error("Error guardando reporte", error);
    }
  }
};
