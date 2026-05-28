import { API_BASE_URL, http } from './apiConfig';

const URL = `${API_BASE_URL}/Sancion`;

export const sancionService = {
  /**
   * GET /api/Sancion/jugador/{jugadorId}
   * Obtiene todas las sanciones de un jugador.
   */
  getByJugador: async (jugadorId) => {
    try {
      return await http.get(`${URL}/jugador/${jugadorId}`);
    } catch (error) {
      console.error(`Error fetching sanciones del jugador ${jugadorId}:`, error);
      throw error;
    }
  },

  /**
   * POST /api/Sancion
   */
  create: async (sancionData) => {
    try {
      return await http.post(URL, sancionData);
    } catch (error) {
      console.error('Error creating sanción:', error);
      throw error;
    }
  },

  /**
   * DELETE /api/Sancion/{sancionId}
   */
  delete: async (sancionId) => {
    try {
      return await http.delete(`${URL}/${sancionId}`);
    } catch (error) {
      console.error(`Error deleting sanción con id ${sancionId}:`, error);
      throw error;
    }
  },
};
