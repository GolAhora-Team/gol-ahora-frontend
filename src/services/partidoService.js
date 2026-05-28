import { API_BASE_URL, http } from './apiConfig';

const URL = `${API_BASE_URL}/Partido`;

export const partidoService = {
  /**
   * GET /api/Partido/{id}
   */
  getById: async (id) => {
    try {
      return await http.get(`${URL}/${id}`);
    } catch (error) {
      console.error(`Error fetching partido con id ${id}:`, error);
      throw error;
    }
  },

  /**
   * GET /api/Partido/competicion/{competicionId}
   * Obtiene todos los partidos de una competición.
   */
  getByCompeticion: async (competicionId) => {
    try {
      return await http.get(`${URL}/competicion/${competicionId}`);
    } catch (error) {
      console.error(`Error fetching partidos de competición ${competicionId}:`, error);
      throw error;
    }
  },

  /**
   * GET /api/Partido/competicion/{competicionId}/fase/{fase}
   * Obtiene los partidos de una competición filtrados por fase del torneo.
   */
  getByFase: async (competicionId, fase) => {
    try {
      return await http.get(`${URL}/competicion/${competicionId}/fase/${fase}`);
    } catch (error) {
      console.error(`Error fetching partidos por fase ${fase}:`, error);
      throw error;
    }
  },

  /**
   * PUT /api/Partido/{id}/resultado
   * Carga el resultado de un partido.
   */
  cargarResultado: async (id, resultadoData) => {
    try {
      return await http.put(`${URL}/${id}/resultado`, resultadoData);
    } catch (error) {
      console.error(`Error cargando resultado del partido ${id}:`, error);
      throw error;
    }
  },

  /**
   * POST /api/Partido/fixture/competicion/{competicionId}
   * Genera el fixture completo para una competición.
   */
  generarFixture: async (competicionId) => {
    try {
      return await http.post(`${URL}/fixture/competicion/${competicionId}`);
    } catch (error) {
      console.error(`Error generando fixture para competición ${competicionId}:`, error);
      throw error;
    }
  },
};
