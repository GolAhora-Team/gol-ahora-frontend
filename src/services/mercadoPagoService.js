import { http, API_BASE_URL } from './apiConfig';

export const mercadoPagoService = {
  createPreference: async (title, price) => {
    try {
      const response = await http.post(`${API_BASE_URL}/MercadoPago/create-preference`, { title, price });
      return response; // { initPoint: "https://..." }
    } catch (error) {
      console.error("Error creating MP preference:", error);
      throw error;
    }
  }
};
