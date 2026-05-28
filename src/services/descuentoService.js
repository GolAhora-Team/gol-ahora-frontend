import { API_BASE_URL, http } from './apiConfig';

const URL = `${API_BASE_URL}/Descuento`;

export const descuentoService = {
  /**
   * GET /api/Descuento
   */
  getAll: async () => {
    try {
      return await http.get(URL);
    } catch (error) {
      console.error('Error fetching descuentos:', error);
      throw error;
    }
  },

  /**
   * GET /api/Descuento/{id}
   */
  getById: async (id) => {
    try {
      return await http.get(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error fetching descuento con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * POST /api/Descuento
   */
  create: async (descuentoData) => {
    try {
      return await http.post(URL, descuentoData);
    } catch (error) {
      console.error('Error creating descuento:', error);
      throw error;
    }
  },

  /**
   * PUT /api/Descuento/{id}
   */
  update: async (id, descuentoData) => {
    try {
      return await http.put(`${URL}/${id}`, descuentoData);
    } catch (error) {
      console.error(`Error updating descuento con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * DELETE /api/Descuento/{id}
   */
  delete: async (id) => {
    try {
      return await http.delete(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error deleting descuento con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * GET /api/Descuento/test
   * Endpoint de prueba.
   */
  test: async () => {
    try {
      return await http.get(`${URL}/test`);
    } catch (error) {
      console.error('Error en test de descuento:', error);
      throw error;
    }
  },
};
