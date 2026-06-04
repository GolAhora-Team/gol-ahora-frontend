import { API_BASE_URL, http } from './apiConfig';

const URL = `${API_BASE_URL}/Factura`;

export const facturaService = {
  /**
   * GET /api/Factura
   */
  getAll: async () => {
    try {
      return await http.get(URL);
    } catch (error) {
      console.error('Error fetching facturas:', error);
      throw error;
    }
  },

  /**
   * GET /api/Factura/{id}
   */
  getById: async (id) => {
    try {
      return await http.get(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error fetching factura con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * POST /api/Factura
   */
  create: async (facturaData) => {
    try {
      return await http.post(URL, facturaData);
    } catch (error) {
      console.error('Error creating factura:', error);
      throw error;
    }
  },

  /**
   * PUT /api/Factura/{id}
   */
  update: async (id, facturaData) => {
    try {
      return await http.put(`${URL}/${id}`, facturaData);
    } catch (error) {
      console.error(`Error updating factura con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * DELETE /api/Factura/{id}
   */
  delete: async (id) => {
    try {
      return await http.delete(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error deleting factura con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * GET /api/Factura/por-cliente/{clienteId}
   */
  getByClienteId: async (clienteId) => {
    try {
      return await http.get(`${URL}/por-cliente/${clienteId}`);
    } catch (error) {
      console.error(`Error fetching facturas por cliente ${clienteId}:`, error);
      throw error;
    }
  },
};
