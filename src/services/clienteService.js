import { API_BASE_URL, http } from './apiConfig';

const URL = `${API_BASE_URL}/Clientes`;

export const clienteService = {
  getAll: async () => {
    try {
      return await http.get(URL);
    } catch (error) {
      console.error('Error fetching clientes:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      return await http.get(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error fetching cliente con id ${id}:`, error);
      throw error;
    }
  },

  create: async (clienteData) => {
    try {
      return await http.post(URL, clienteData);
    } catch (error) {
      console.error('Error creating cliente:', error);
      throw error;
    }
  },

  update: async (id, clienteData) => {
    try {
      return await http.put(`${URL}/${id}`, clienteData);
    } catch (error) {
      console.error(`Error updating cliente con id ${id}:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      return await http.delete(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error deleting cliente con id ${id}:`, error);
      throw error;
    }
  },
};
