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

  /**
   * POST /api/User/reset-password
   * Restablece la contraseña usando un token.
   */
  resetPassword: async (token, newPassword) => {
    try {
      return await http.post(`${URL}/reset-password`, { token, newPassword });
    } catch (error) {
      console.error('Error en resetPassword:', error);
      throw error;
    }
  },

  /**
   * GET /api/User/validate-reset-token
   * Valida que el token de recuperación no esté vencido o usado.
   */
  validateResetToken: async (token) => {
    try {
      const response = await http.get(`${URL}/validate-reset-token?token=${token}`);
      return response;
    } catch (error) {
      console.error('Error en validateResetToken:', error);
      throw error;
    }
  },

  /**
   * POST /api/User/apto-medico
   * Sube el apto médico del cliente
   */
  uploadAptoMedico: async (payload) => {
    try {
      return await http.post(`${URL}/apto-medico`, payload);
    } catch (error) {
      console.error('Error en uploadAptoMedico:', error);
      throw error;
    }
  },

  /**
   * GET /api/User/buscar-username/{username}
   */
  buscarPorUsername: async (username) => {
    try {
      return await http.get(`${URL}/buscar-username/${encodeURIComponent(username)}`);
    } catch (error) {
      console.error('Error en buscarPorUsername:', error);
      throw error;
    }
  },

  /**
   * GET /api/User/all-usernames
   */
  getAllUsernames: async () => {
    try {
      return await http.get(`${URL}/all-usernames`);
    } catch (error) {
      console.error('Error en getAllUsernames:', error);
      throw error;
    }
  },

  /**
   * GET /api/User/check-username-available
   * Checks if a username is available, optionally excluding a user ID.
   */
  checkUsernameAvailable: async (username, excludeUserId = null) => {
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      if (excludeUserId) params.append('excludeUserId', excludeUserId);
      return await http.get(`${URL}/check-username-available?${params.toString()}`);
    } catch (error) {
      console.error('Error en checkUsernameAvailable:', error);
      throw error;
    }
  },

  /**
   * PUT /api/User/update-username
   * Updates the username for a given user.
   */
  updateUsername: async (userId, newUsername) => {
    try {
      return await http.put(`${URL}/update-username`, { userId, newUsername });
    } catch (error) {
      console.error('Error en updateUsername:', error);
      throw error;
    }
  },
};
