import { API_BASE_URL, http } from './apiConfig';

const URL = `${API_BASE_URL}/User`;

export const userService = {
  /**
   * POST /api/User/Cliente
   * Crea un usuario con rol Cliente.
   */
  createUsuarioCliente: async (data) => {
    try {
      return await http.post(`${URL}/Cliente`, data);
    } catch (error) {
      console.error('Error creating usuario cliente:', error);
      throw error;
    }
  },

  /**
   * POST /api/User/Admin
   * Crea un usuario con rol Administrador.
   */
  createUsuarioAdmin: async (data) => {
    try {
      return await http.post(`${URL}/Admin`, data);
    } catch (error) {
      console.error('Error creating usuario admin:', error);
      throw error;
    }
  },

  /**
   * POST /api/User/Profesor
   * Crea un usuario con rol Profesor.
   */
  createUsuarioProfesor: async (data) => {
    try {
      return await http.post(`${URL}/Profesor`, data);
    } catch (error) {
      console.error('Error creating usuario profesor:', error);
      throw error;
    }
  },

  /**
   * POST /api/User/login
   * Inicia sesión con las credenciales del usuario.
   */
  login: async (credentials) => {
    try {
      return await http.post(`${URL}/login`, credentials);
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },
};
