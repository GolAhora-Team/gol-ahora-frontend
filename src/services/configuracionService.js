import { API_BASE_URL, http } from './apiConfig';

const URL = `${API_BASE_URL}/Configuracion/cancelaciones`;

export const configuracionService = {
  /**
   * GET /api/Configuracion/cancelaciones
   */
  get: async () => {
    try {
      return await http.get(URL);
    } catch (error) {
      console.error('Error fetching configuracion cancelaciones:', error);
      throw error;
    }
  },

  /**
   * PUT /api/Configuracion/cancelaciones
   */
  update: async (data) => {
    try {
      return await http.put(URL, data);
    } catch (error) {
      console.error('Error updating configuracion cancelaciones:', error);
      throw error;
    }
  }
};
