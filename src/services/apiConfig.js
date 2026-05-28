import { Platform } from 'react-native';

const isWebProd = Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname !== 'localhost';

// En Vercel usamos ruta relativa '/api' para aprovechar el proxy de vercel.json y evitar errores de Mixed Content (HTTP vs HTTPS).
// Localmente, pegamos directo al dominio completo.
export const API_BASE_URL = isWebProd ? '/api' : 'http://golahora.runasp.net/api';

/**
 * Helper genérico para manejar las respuestas del backend.
 * Extrae el JSON si corresponde y lanza un Error con el mensaje del backend en caso de fallo.
 */
export const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    let errorMessage = 'Error en la petición';
    
    if (data) {
      if (data.mensaje || data.message || data.Message) {
        errorMessage = data.mensaje || data.message || data.Message;
      } else if (data.errors && typeof data.errors === 'object') {
        // Formatear errores de validación de ASP.NET Core
        const errorMessages = Object.values(data.errors).flat();
        errorMessage = errorMessages.join('\n');
      } else if (data.title) {
        errorMessage = data.title;
      }
    } else if (response.statusText) {
      errorMessage = response.statusText;
    }

    throw new Error(errorMessage);
  }

  return data;
};

/**
 * Helpers reutilizables para las operaciones HTTP más comunes.
 */
export const http = {
  get: async (url) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  post: async (url, body) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  put: async (url, body) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  patch: async (url, body = null) => {
    const options = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    return handleResponse(response);
  },

  delete: async (url) => {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },
};
