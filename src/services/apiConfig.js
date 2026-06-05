import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWebProd = Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname !== 'localhost';

// En Vercel usamos ruta relativa '/api' para aprovechar el proxy de vercel.json y evitar errores de Mixed Content (HTTP vs HTTPS).
// Localmente, pegamos directo al dominio completo.
export const API_BASE_URL = isWebProd ? '/api' : 'http://golahora.runasp.net/api';

// ─── Gestión del Token JWT ───────────────────────────────────────────
let _authToken = null;

/**
 * Inicializa el token JWT desde el almacenamiento persistente.
 * Se llama una sola vez al cargar la app.
 */
export const initAuthToken = async () => {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const session = localStorage.getItem('GOL_AHORA_SESSION');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.token) {
          _authToken = parsed.token;
        }
      }
    } else {
      const token = await AsyncStorage.getItem('GOL_AHORA_TOKEN');
      if (token) {
        _authToken = token;
      }
    }
  } catch (e) {
    console.warn('Error al recuperar token JWT:', e);
  }
};

/**
 * Guarda el token JWT en memoria y en almacenamiento persistente.
 */
export const setAuthToken = async (token) => {
  _authToken = token;
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      // El token también se guarda dentro del objeto de sesión en LoginScreen
    }
    await AsyncStorage.setItem('GOL_AHORA_TOKEN', token);
  } catch (e) {
    console.warn('Error al guardar token JWT:', e);
  }
};

/**
 * Limpia el token JWT de memoria y almacenamiento persistente.
 */
export const clearAuthToken = async () => {
  _authToken = null;
  try {
    await AsyncStorage.removeItem('GOL_AHORA_TOKEN');
  } catch (e) {
    console.warn('Error al limpiar token JWT:', e);
  }
};

/**
 * Retorna el token JWT actual (o null si no hay sesión).
 */
export const getAuthToken = () => _authToken;

/**
 * Construye los headers para una petición, incluyendo el token JWT si existe.
 */
const buildHeaders = (extraHeaders = {}) => {
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  }
  return headers;
};

/**
 * Construye headers sin Content-Type (para FormData), pero con Authorization si existe.
 */
const buildAuthOnlyHeaders = () => {
  const headers = {};
  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  }
  return headers;
};

// Inicializar el token al importar este módulo
initAuthToken();

/**
 * Helper genérico para manejar las respuestas del backend.
 * Extrae el JSON si corresponde y lanza un Error con el mensaje del backend en caso de fallo.
 */
export const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('json');
  
  let data = null;
  let textData = null;
  
  try {
    const text = await response.text();
    textData = text;
    if (isJson && text && text.trim()) {
      data = JSON.parse(text);
    }
  } catch (e) {
    console.warn('Error leyendo o parseando la respuesta:', e);
  }

  if (!response.ok) {
    let errorMessage = 'Error en la petición';
    
    if (data) {
      if (data.mensaje || data.message || data.Message) {
        errorMessage = data.mensaje || data.message || data.Message;
      } else if (data.errors && typeof data.errors === 'object') {
        const errorMessages = Object.values(data.errors).flat();
        errorMessage = errorMessages.join('\n');
      } else if (data.title) {
        errorMessage = data.title;
      }
    } else if (textData) {
      // Si el texto es muy largo o contiene código HTML de error IIS, lo recortamos o simplificamos
      if (textData.includes('<!DOCTYPE html>') || textData.includes('<html>')) {
        errorMessage = `Error del servidor (${response.status}): ${response.statusText || 'Internal Server Error'}`;
      } else {
        errorMessage = textData;
      }
    } else if (response.statusText) {
      errorMessage = response.statusText;
    } else {
      errorMessage = `Error HTTP ${response.status}`;
    }

    throw new Error(errorMessage);
  }

  return data;
};

/**
 * Helpers reutilizables para las operaciones HTTP más comunes.
 * Incluyen automáticamente el header Authorization: Bearer <JWT> cuando hay sesión activa.
 */
export const http = {
  get: async (url) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(),
    });
    return handleResponse(response);
  },

  post: async (url, body) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  put: async (url, body) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  patch: async (url, body = null) => {
    const options = {
      method: 'PATCH',
      headers: buildHeaders(),
    };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    return handleResponse(response);
  },

  delete: async (url) => {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: buildHeaders(),
    });
    return handleResponse(response);
  },

  postForm: async (url, formData) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: buildAuthOnlyHeaders(),
      body: formData,
      // No setear Content-Type, fetch lo setea automáticamente a multipart/form-data con el boundary correcto
    });
    return handleResponse(response);
  },

  putForm: async (url, formData) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: buildAuthOnlyHeaders(),
      body: formData,
    });
    return handleResponse(response);
  },
};
