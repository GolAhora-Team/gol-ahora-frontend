import { API_BASE_URL, http } from './apiConfig';

const URL = `${API_BASE_URL}/Profesor`;

export const profesorService = {
  /**
   * GET /api/Profesor
   */
  getAll: async () => {
    try {
      return await http.get(URL);
    } catch (error) {
      console.error('Error fetching profesores:', error);
      throw error;
    }
  },

  /**
   * GET /api/Profesor/{id}
   */
  getById: async (id) => {
    try {
      return await http.get(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error fetching profesor con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * PUT /api/Profesor/{id}/simple
   * Actualización simple de datos del profesor usando FormData.
   */
  updateSimple: async (id, formData) => {
    try {
      return await http.putForm(`${URL}/${id}/simple`, formData);
    } catch (error) {
      console.error(`Error updating profesor con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * DELETE /api/Profesor/{id}
   */
  delete: async (id) => {
    try {
      return await http.delete(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error deleting profesor con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * GET /api/Profesor/{id}/reporte
   * Descarga el PDF con el reporte/ficha del profesor.
   */
  descargarReporte: async (id) => {
    const response = await fetch(
      `${URL}/${id}/reporte`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Error al generar el reporte');
    }
    return await response.blob();
  },

  /**
   * GET /api/Profesor/{id}/certificado/descargar
   * Descarga el certificado del profesor.
   */
  descargarCertificado: async (id) => {
    const response = await fetch(
      `${URL}/${id}/certificado/descargar`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Error al descargar el certificado');
    }
    return await response.blob();
  },
};
