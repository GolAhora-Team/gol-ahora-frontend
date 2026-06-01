import { api } from './api';

export const mercadoPagoService = {
  createPreference: async (title, price) => {
    try {
      const response = await api.post('/MercadoPago/create-preference', { title, price });
      return response.data; // { initPoint: "https://..." }
    } catch (error) {
      console.error("Error creating MP preference:", error);
      throw error;
    }
  }
};
