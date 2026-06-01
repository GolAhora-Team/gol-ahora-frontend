import { API_BASE_URL, http } from './apiConfig';

const URL = `${API_BASE_URL}/Clase`;

export const claseService = {
  /**
   * GET /api/Clase
   */
  getAll: async () => {
    try {
      return await http.get(URL);
    } catch (error) {
      console.error('Error fetching clases:', error);
      throw error;
    }
  },

  /**
   * GET /api/Clase/{id}
   */
  getById: async (id) => {
    try {
      return await http.get(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error fetching clase con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * POST /api/Clase
   */
  create: async (claseData) => {
    try {
      return await http.post(URL, claseData);
    } catch (error) {
      console.error('Error creating clase:', error);
      throw error;
    }
  },

  /**
   * PUT /api/Clase/{id}
   */
  update: async (id, claseData) => {
    try {
      return await http.put(`${URL}/${id}`, claseData);
    } catch (error) {
      console.error(`Error updating clase con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * DELETE /api/Clase/{id}
   */
  delete: async (id) => {
    try {
      return await http.delete(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error deleting clase con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * PATCH /api/Clase/{claseId}/profesor/{profesorId}
   * Asigna un profesor a una clase.
   */
  addProfesor: async (claseId, profesorId) => {
    try {
      return await http.patch(`${URL}/${claseId}/profesor/${profesorId}`);
    } catch (error) {
      console.error(`Error asignando profesor ${profesorId} a clase ${claseId}:`, error);
      throw error;
    }
  },

  /**
   * PATCH /api/Clase/{claseId}/cliente/{clienteId}
   * Inscribe un cliente a una clase.
   */
  addCliente: async (claseId, clienteId) => {
    try {
      return await http.patch(`${URL}/${claseId}/cliente/${clienteId}`);
    } catch (error) {
      console.error(`Error inscribiendo cliente ${clienteId} a clase ${claseId}:`, error);
      throw error;
    }
  },

  /**
   * DELETE /api/Clase/{claseId}/cliente/{clienteId}
   * Desinscribe un cliente de una clase.
   */
  removeCliente: async (claseId, clienteId) => {
    try {
      return await http.delete(`${URL}/${claseId}/cliente/${clienteId}`);
    } catch (error) {
      console.error(`Error desinscribiendo cliente ${clienteId} de clase ${claseId}:`, error);
      throw error;
    }
  },
};
