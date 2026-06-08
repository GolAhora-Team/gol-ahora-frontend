import { API_BASE_URL, http } from './apiConfig';

const URL = `${API_BASE_URL}/Equipo`;

export const equipoService = {
  /**
   * GET /api/Equipo
   */
  getAll: async () => {
    try {
      return await http.get(URL);
    } catch (error) {
      console.error('Error fetching equipos:', error);
      throw error;
    }
  },

  /**
   * GET /api/Equipo/{id}
   */
  getById: async (id) => {
    try {
      return await http.get(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error fetching equipo con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * POST /api/Equipo
   */
  create: async (equipoData) => {
    try {
      return await http.post(URL, equipoData);
    } catch (error) {
      console.error('Error creating equipo:', error);
      throw error;
    }
  },

  /**
   * PUT /api/Equipo/{id}
   */
  update: async (id, equipoData) => {
    try {
      return await http.put(`${URL}/${id}`, equipoData);
    } catch (error) {
      console.error(`Error updating equipo con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * DELETE /api/Equipo/{id}
   */
  delete: async (id) => {
    try {
      return await http.delete(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error deleting equipo con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * PUT /api/Equipo/{id}/formacion
   */
  guardarFormacion: async (id, payload) => {
    try {
      return await http.put(`${URL}/${id}/formacion`, payload);
    } catch (error) {
      console.error(`Error guardando formacion del equipo con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * GET /api/Equipo/por-cliente/{clienteId}
   */
  getByClienteId: async (clienteId) => {
    try {
      return await http.get(`${URL}/por-cliente/${clienteId}`);
    } catch (error) {
      console.error(`Error fetching equipos por cliente ${clienteId}:`, error);
      throw error;
    }
  },

  /**
   * POST /api/Equipo/{equipoId}/invitar
   */
  invitarJugador: async (equipoId, data) => {
    try {
      return await http.post(`${URL}/${equipoId}/invitar`, data);
    } catch (error) {
      console.error(`Error invitando jugador al equipo ${equipoId}:`, error);
      throw error;
    }
  },
};
