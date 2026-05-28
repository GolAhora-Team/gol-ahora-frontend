import { API_BASE_URL, http } from './apiConfig';

const URL = `${API_BASE_URL}/Jugador`;

export const jugadorService = {
  /**
   * GET /api/Jugador
   */
  getAll: async () => {
    try {
      return await http.get(URL);
    } catch (error) {
      console.error('Error fetching jugadores:', error);
      throw error;
    }
  },

  /**
   * GET /api/Jugador/{id}
   */
  getById: async (id) => {
    try {
      return await http.get(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error fetching jugador con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * POST /api/Jugador
   */
  create: async (jugadorData) => {
    try {
      return await http.post(URL, jugadorData);
    } catch (error) {
      console.error('Error creating jugador:', error);
      throw error;
    }
  },

  /**
   * PUT /api/Jugador/{id}
   */
  update: async (id, jugadorData) => {
    try {
      return await http.put(`${URL}/${id}`, jugadorData);
    } catch (error) {
      console.error(`Error updating jugador con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * DELETE /api/Jugador/{id}
   */
  delete: async (id) => {
    try {
      return await http.delete(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error deleting jugador con id ${id}:`, error);
      throw error;
    }
  },
};
