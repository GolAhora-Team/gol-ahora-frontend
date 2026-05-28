import { API_BASE_URL, http } from './apiConfig';

const URL = `${API_BASE_URL}/Pago`;

export const pagoService = {
  /**
   * GET /api/Pago
   */
  getAll: async () => {
    try {
      return await http.get(URL);
    } catch (error) {
      console.error('Error fetching pagos:', error);
      throw error;
    }
  },

  /**
   * GET /api/Pago/{id}
   */
  getById: async (id) => {
    try {
      return await http.get(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error fetching pago con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * POST /api/Pago
   */
  create: async (pagoData) => {
    try {
      return await http.post(URL, pagoData);
    } catch (error) {
      console.error('Error creating pago:', error);
      throw error;
    }
  },

  /**
   * PUT /api/Pago/{id}
   */
  update: async (id, pagoData) => {
    try {
      return await http.put(`${URL}/${id}`, pagoData);
    } catch (error) {
      console.error(`Error updating pago con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * DELETE /api/Pago/{id}
   */
  delete: async (id) => {
    try {
      return await http.delete(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error deleting pago con id ${id}:`, error);
      throw error;
    }
  },
};
