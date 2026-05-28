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
   * Actualización simple de datos del profesor.
   */
  updateSimple: async (id, data) => {
    try {
      return await http.put(`${URL}/${id}/simple`, data);
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
};
