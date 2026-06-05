import React, { useEffect, useRef } from 'react';
import { View, PanResponder, Platform } from 'react-native';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

export default function AutoLogoutWrapper({ children, navigationRef, currentRouteName }) {
  const idleTimer = useRef(null);

  const resetTimer = () => {
    // Si no hay ruta o estamos en pantallas públicas, no aplicamos el timeout
    if (!currentRouteName || ['Login', 'Register', 'ForgotPassword'].includes(currentRouteName)) {
      clearTimers();
      return;
    }

    let role = null;
    if (navigationRef && navigationRef.isReady()) {
      const currentRoute = navigationRef.getCurrentRoute();
      role = currentRoute?.params?.role || currentRoute?.params?.userRole;
    }

    if (Platform.OS === 'web' && !role) {
      try {
        const saved = localStorage.getItem('GOL_AHORA_SESSION');
        if (saved) {
          const parsed = JSON.parse(saved);
          role = parsed.role;
        }
      } catch (e) {}
    }

    // Exceptuar a Administradores y Personal del deslogueo por inactividad
    if (role === 'ADMIN' || role === 'PERSONAL') {
      clearTimers();
      return;
    }

    clearTimers();
    idleTimer.current = setTimeout(() => {
      handleIdle();
    }, IDLE_TIMEOUT_MS);
  };

  const handleIdle = () => {
    // Cerrar sesión local (web)
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem('GOL_AHORA_SESSION');
      } catch(e) {}
    }
    
    // Redirigir a Login con el parámetro de inactividad
    if (navigationRef && navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Login', params: { sessionClosedByInactivity: true } }],
      });
    }
  };

  const clearTimers = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
  };

  useEffect(() => {
    resetTimer();
    return () => clearTimers();
  }, [currentRouteName]);

  // Capturar toques en React Native Mobile
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => { resetTimer(); return false; },
      onMoveShouldSetPanResponderCapture: () => { resetTimer(); return false; },
      onScrollShouldSetPanResponderCapture: () => { resetTimer(); return false; }
    })
  ).current;

  // Listeners para Web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebActivity = () => resetTimer();
      window.addEventListener('mousemove', handleWebActivity);
      window.addEventListener('keypress', handleWebActivity);
      window.addEventListener('click', handleWebActivity);
      window.addEventListener('scroll', handleWebActivity);
      return () => {
        window.removeEventListener('mousemove', handleWebActivity);
        window.removeEventListener('keypress', handleWebActivity);
        window.removeEventListener('click', handleWebActivity);
        window.removeEventListener('scroll', handleWebActivity);
      };
    }
  }, [currentRouteName]);

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}
