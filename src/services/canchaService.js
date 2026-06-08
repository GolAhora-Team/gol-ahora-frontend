import { API_BASE_URL, http } from './apiConfig';

const ENDPOINT = `${API_BASE_URL}/Canchas`;

export const canchaService = {
  // Obtener todas las canchas
  getAll: async () => {
    return await http.get(ENDPOINT);
  },

  // Obtener canchas activas
  getActivas: async () => {
    return await http.get(`${ENDPOINT}/activas`);
  },

  // Obtener canchas disponibles
  getDisponibles: async (fecha, hora) => {
    return await http.get(`${ENDPOINT}/disponibles?fecha=${fecha}&hora=${hora}`);
  },

  // Obtener cancha por ID
  getById: async (id) => {
    return await http.get(`${ENDPOINT}/${id}`);
  },

  // Crear una cancha
  create: async (canchaData) => {
    return await http.post(ENDPOINT, canchaData);
  },

  // Actualizar una cancha
  update: async (id, canchaData) => {
    return await http.put(`${ENDPOINT}/${id}`, canchaData);
  },

  // Eliminar una cancha
  delete: async (id) => {
    return await http.delete(`${ENDPOINT}/${id}`);
  },

  // Actualizar precios globales
  updatePrecios: async (preciosData) => {
    return await http.put(`${ENDPOINT}/precios`, preciosData);
  },
};
