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

  /**
   * PUT /api/User/change-password
   * Cambia la contraseña del usuario logueado.
   */
  changePassword: async (data) => {
    try {
      return await http.put(`${URL}/change-password`, data);
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  /**
   * GET /api/User/check-availability
   * Verifica unicidad de DNI, Email y Username.
   */
  checkAvailability: async (dni, email, username) => {
    try {
      const params = new URLSearchParams();
      if (dni) params.append('dni', dni);
      if (email) params.append('email', email);
      if (username) params.append('username', username);
      
      const response = await http.get(`${URL}/check-availability?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  },

  /**
   * POST /api/User/forgot-password
   * Solicita restablecimiento de contraseña.
   */
  forgotPassword: async (email) => {
    try {
      return await http.post(`${URL}/forgot-password`, { email });
    } catch (error) {
      console.error('Error en forgotPassword:', error);
      throw error;
    }
  },
};
