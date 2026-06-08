import { API_BASE_URL, http } from './apiConfig';

const URL = `${API_BASE_URL}/Administrador`;

export const administradorService = {
  /**
   * GET /api/Administrador
   * Obtiene todos los administradores y personal.
   */
  getAll: async () => {
    try {
      return await http.get(URL);
    } catch (error) {
      console.error('Error fetching administradores:', error);
      throw error;
    }
  },

  /**
   * GET /api/Administrador/{id}
   * Obtiene un administrador o personal por su id.
   */
  getById: async (id) => {
    try {
      return await http.get(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error fetching administrador con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * PUT /api/Administrador/{id}/simple
   * Actualización simple de datos del administrador.
   */
  updateSimple: async (id, data) => {
    try {
      return await http.put(`${URL}/${id}/simple`, data);
    } catch (error) {
      console.error(`Error updating administrador con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * DELETE /api/Administrador/{id}
   */
  delete: async (id) => {
    try {
      return await http.delete(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error deleting administrador con id ${id}:`, error);
      throw error;
    }
  },
};
