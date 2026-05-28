import { Platform } from 'react-native';

// Puerto configurado en launchSettings.json del backend ASP.NET Core
const API_PORT = 5184;

// Android emulator usa 10.0.2.2 para acceder al localhost del host
// iOS simulator usa localhost directamente
const API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = `http://${API_HOST}:${API_PORT}/api`;

/**
 * Helper genérico para manejar las respuestas del backend.
 * Extrae el JSON si corresponde y lanza un Error con el mensaje del backend en caso de fallo.
 */
export const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const error =
      (data && (data.mensaje || data.message || data.Message)) ||
      response.statusText ||
      'Error en la petición';
    throw new Error(error);
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
