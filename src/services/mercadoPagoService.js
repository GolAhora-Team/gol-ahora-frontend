import { http, API_BASE_URL } from './apiConfig';

export const mercadoPagoService = {
  createPreference: async (title, price, returnUrl) => {
    try {
      const response = await http.post(`${API_BASE_URL}/MercadoPago/create-preference`, { title, price, returnUrl });
      return response; // { initPoint: "https://...", externalReference: "..." }
    } catch (error) {
      console.error("Error creating MP preference:", error);
      throw error;
    }
  },
  
  checkPaymentStatus: async (externalReference) => {
    try {
      const response = await http.get(`${API_BASE_URL}/MercadoPago/check-payment/${externalReference}`);
      return response.approved; // boolean
    } catch (error) {
      console.error("Error checking MP payment status:", error);
      throw error;
    }
  }
};
