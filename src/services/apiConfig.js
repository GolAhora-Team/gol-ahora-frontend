import { Platform } from 'react-native';

// URL de la API en producción
export const API_BASE_URL = 'http://golahora.runasp.net/api';

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
