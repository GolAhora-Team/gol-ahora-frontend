import { API_BASE_URL, http } from './apiConfig';

const URL = `${API_BASE_URL}/Competicion`;

export const competicionService = {
  /**
   * GET /api/Competicion
   */
  getAll: async () => {
    try {
      return await http.get(URL);
    } catch (error) {
      console.error('Error fetching competiciones:', error);
      throw error;
    }
  },

  /**
   * GET /api/Competicion/{id}
   */
  getById: async (id) => {
    try {
      return await http.get(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error fetching competición con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * POST /api/Competicion
   */
  create: async (competicionData) => {
    try {
      return await http.post(URL, competicionData);
    } catch (error) {
      console.error('Error creating competición:', error);
      throw error;
    }
  },

  /**
   * PUT /api/Competicion/{id}
   */
  update: async (id, competicionData) => {
    try {
      return await http.put(`${URL}/${id}`, competicionData);
    } catch (error) {
      console.error(`Error updating competición con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * DELETE /api/Competicion/{id}
   */
  delete: async (id) => {
    try {
      return await http.delete(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error deleting competición con id ${id}:`, error);
      throw error;
    }
  },
};
