import { Platform } from 'react-native';

const STORAGE_KEY = 'GOL_AHORA_REPORTES_CANCHAS';

export const reportHistoryService = {
  getReportes: async () => {
    try {
      if (Platform.OS === 'web') {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      }
      return []; // En native se usaría AsyncStorage o FileSystem, pero por ahora web focus
    } catch (error) {
      console.error("Error leyendo reportes", error);
      return [];
    }
  },

  saveReporte: async (reporteHtml, fileName) => {
    try {
      const reportes = await reportHistoryService.getReportes();
      const newReporte = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        html: reporteHtml,
        fileName: fileName || `Reporte-${Date.now()}`
      };
      
      const updated = [newReporte, ...reportes];
      
      if (Platform.OS === 'web') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return newReporte;
    } catch (error) {
      console.error("Error guardando reporte", error);
    }
  }
};
