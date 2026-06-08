import { API_BASE_URL, http } from './apiConfig';

const URL = `${API_BASE_URL}/Reserva`;

export const reservaService = {
  /**
   * GET /api/Reserva
   */
  getAll: async () => {
    try {
      return await http.get(URL);
    } catch (error) {
      console.error('Error fetching reservas:', error);
      throw error;
    }
  },

  /**
   * GET /api/Reserva/{id}
   */
  getById: async (id) => {
    try {
      return await http.get(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error fetching reserva con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * POST /api/Reserva
   */
  create: async (reservaData) => {
    try {
      return await http.post(URL, reservaData);
    } catch (error) {
      console.error('Error creating reserva:', error);
      throw error;
    }
  },

  /**
   * PUT /api/Reserva/{id}
   */
  update: async (id, reservaData) => {
    try {
      return await http.put(`${URL}/${id}`, reservaData);
    } catch (error) {
      console.error(`Error updating reserva con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * PATCH /api/Reserva/{id}/cancelar
   * Cancela una reserva existente.
   */
  cancelar: async (id) => {
    try {
      return await http.patch(`${URL}/${id}/cancelar`);
    } catch (error) {
      console.error(`Error cancelando reserva con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * GET /api/Reserva/{id}/cancelacion-info
   * Obtiene información de penalización antes de cancelar.
   */
  getCancelacionInfo: async (id) => {
    try {
      return await http.get(`${URL}/${id}/cancelacion-info`);
    } catch (error) {
      console.error(`Error obteniendo info de cancelación para reserva ${id}:`, error);
      throw error;
    }
  },
};
