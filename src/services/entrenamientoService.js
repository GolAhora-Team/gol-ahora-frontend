import { API_BASE_URL, http } from './apiConfig';

const URL = `${API_BASE_URL}/Entrenamientos`;

export const entrenamientoService = {
  /**
   * GET /api/Entrenamientos
   */
  getAll: async () => {
    try {
      return await http.get(URL);
    } catch (error) {
      console.error('Error fetching entrenamientos:', error);
      throw error;
    }
  },

  /**
   * GET /api/Entrenamientos/{id}
   */
  getById: async (id) => {
    try {
      return await http.get(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error fetching entrenamiento con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * POST /api/Entrenamientos
   */
  create: async (entrenamientoData) => {
    try {
      return await http.post(URL, entrenamientoData);
    } catch (error) {
      console.error('Error creating entrenamiento:', error);
      throw error;
    }
  },

  /**
   * PUT /api/Entrenamientos/{id}
   */
  update: async (id, entrenamientoData) => {
    try {
      return await http.put(`${URL}/${id}`, entrenamientoData);
    } catch (error) {
      console.error(`Error updating entrenamiento con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * DELETE /api/Entrenamientos/{id}
   */
  delete: async (id) => {
    try {
      return await http.delete(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error deleting entrenamiento con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * POST /api/Entrenamientos/{entrenamientoId}/clientes/{clienteId}
   * Agrega un cliente a un entrenamiento.
   */
  addCliente: async (entrenamientoId, clienteId) => {
    try {
      return await http.post(`${URL}/${entrenamientoId}/clientes/${clienteId}`);
    } catch (error) {
      console.error(`Error agregando cliente ${clienteId} al entrenamiento ${entrenamientoId}:`, error);
      throw error;
    }
  },

  /**
   * DELETE /api/Entrenamientos/{entrenamientoId}/clientes/{clienteId}
   * Remueve un cliente de un entrenamiento.
   */
  removeCliente: async (entrenamientoId, clienteId) => {
    try {
      return await http.delete(`${URL}/${entrenamientoId}/clientes/${clienteId}`);
    } catch (error) {
      console.error(`Error removiendo cliente ${clienteId} del entrenamiento ${entrenamientoId}:`, error);
      throw error;
    }
  },

  /**
   * GET /api/Entrenamientos/{entrenamientoId}/cliente/{clienteId}/pulsera
   * Descarga el PDF de la pulsera con código de barras del alumno.
   */
  descargarPulsera: async (entrenamientoId, clienteId) => {
    const response = await fetch(
      `${URL}/${entrenamientoId}/cliente/${clienteId}/pulsera`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Error al generar la pulsera');
    }
    return await response.blob();
  },
};
