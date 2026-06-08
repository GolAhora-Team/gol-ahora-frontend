import React, { useState } from 'react';
import { NavigationContainer, useNavigationContainerRef, DefaultTheme, getPathFromState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// IMPORTACIÓN DE PANTALLAS
import LoginScreen from './src/screens/LoginScreen';
import Dashboard from './src/screens/Dashboard';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import NuevaClaveScreen from './src/screens/NuevaClaveScreen';
import DesarrolladoPorScreen from './src/screens/DesarrolladoPorScreen';

// MÓDULOS DEL DASHBOARD
import UserScreen from './src/screens/UserScreen';
import CanchasScreen from './src/screens/CanchasScreen';
import ReservasScreen from './src/screens/ReservasScreen';
import CompetenciasScreen from './src/screens/CompetenciasScreen';
import StaffScreen from './src/screens/StaffScreen'; 
import InscripcionesScreen from './src/screens/InscripcionesScreen';
import FacturacionScreen from './src/screens/FacturacionScreen';
import ReportesScreen from './src/screens/ReportesScreen';
import ClientesScreen from './src/screens/ClientesScreen';
import ClasesProfeScreen from './src/screens/ClasesProfeScreen';
import MisRecibosScreen from './src/screens/MisRecibosScreen';
import MisClasesClienteScreen from './src/screens/MisClasesClienteScreen';

import { ErrorBoundary } from './src/components/ErrorBoundary';

import { Platform, Text, TextInput } from 'react-native';
import { 
  useFonts, 
  Montserrat_300Light,
  Montserrat_400Regular, 
  Montserrat_500Medium, 
  Montserrat_600SemiBold, 
  Montserrat_700Bold, 
  Montserrat_800ExtraBold, 
  Montserrat_900Black 
} from '@expo-google-fonts/montserrat';

const Stack = createNativeStackNavigator();

import AutoLogoutWrapper from './src/components/AutoLogoutWrapper';

// Ocultar el botón nativo de revelar contraseña del navegador (ej. Edge) en versión web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(`
    input::-ms-reveal,
    input::-ms-clear {
      display: none !important;
    }
  `));
  document.head.appendChild(style);
}

// Configurar fuente por defecto para componentes de texto de React Native
const customTextProps = { style: { fontFamily: 'Montserrat_400Regular' } };

if (Text.defaultProps) {
  Text.defaultProps.style = { ...Text.defaultProps.style, fontFamily: 'Montserrat_400Regular' };
} else {
  Text.defaultProps = customTextProps;
}

if (TextInput.defaultProps) {
  TextInput.defaultProps.style = { ...TextInput.defaultProps.style, fontFamily: 'Montserrat_400Regular' };
} else {
  TextInput.defaultProps = customTextProps;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black,
  });

  const navigationRef = useNavigationContainerRef();
  const [currentRouteName, setCurrentRouteName] = useState('Login');

  if (!fontsLoaded) {
    return null; // Espera a que las fuentes carguen
  }

  const appTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#06230e', // Color verde oscuro para el fondo base
    },
  };

  const linking = {
    prefixes: ['http://localhost:8081', 'gol-ahora://'],
    config: {
      screens: {
        Login: '',
        NuevaClave: 'NuevaClave',
        Dashboard: 'dashboard',
      },
    },
    getPathFromState(state, options) {
      const path = getPathFromState(state, options);
      // Elimina cualquier parámetro query (?role=...) de la URL generada
      return path.split('?')[0];
    }
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={appTheme}
      linking={linking}
      onReady={() => {
        setCurrentRouteName(navigationRef.getCurrentRoute()?.name);
      }}
      onStateChange={() => {
        const previousRouteName = currentRouteName;
        const currentRoute = navigationRef.getCurrentRoute()?.name;
        if (previousRouteName !== currentRoute) {
          setCurrentRouteName(currentRoute);
        }
      }}
    >
      <AutoLogoutWrapper navigationRef={navigationRef} currentRouteName={currentRouteName}>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom' 
          }}
        >
          {/* PANTALLAS PRINCIPALES */}
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Gol Ahora - Iniciar Sesión" }} />
          <Stack.Screen name="Dashboard" component={Dashboard} options={{ title: "Gol Ahora - Panel Central" }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Gol Ahora - Registro" }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "Gol Ahora - Recuperar Contraseña" }} />
          <Stack.Screen name="NuevaClave" component={NuevaClaveScreen} options={{ title: "Gol Ahora - Nueva Contraseña" }} />
          <Stack.Screen name="DesarrolladoPor" component={DesarrolladoPorScreen} options={{ title: "Gol Ahora - Desarrollado Por" }} />

          {/* PANTALLAS DE MÓDULOS (VINCULADAS AL DASHBOARD) */}
          <Stack.Screen name="UserScreen" component={UserScreen} options={{ title: "Gol Ahora - Usuarios" }} />
          <Stack.Screen name="CanchasScreen" component={CanchasScreen} options={{ title: "Gol Ahora - Canchas" }} />
          <Stack.Screen name="ReservasScreen" component={ReservasScreen} options={{ title: "Gol Ahora - Reservas" }} />
          <Stack.Screen name="CompetenciasScreen" options={{ title: "Gol Ahora - Competencias" }}>
            {(props) => (
              <ErrorBoundary>
                <CompetenciasScreen {...props} />
              </ErrorBoundary>
            )}
          </Stack.Screen>
          <Stack.Screen name="StaffScreen" options={{ title: "Gol Ahora - Staff" }}>
            {(props) => (
              <ErrorBoundary>
                <StaffScreen {...props} />
              </ErrorBoundary>
            )}
          </Stack.Screen>
          <Stack.Screen name="InscripcionesScreen" component={InscripcionesScreen} options={{ title: "Gol Ahora - Inscripciones" }} />
          <Stack.Screen name="FacturacionScreen" component={FacturacionScreen} options={{ title: "Gol Ahora - Facturación" }} />
          <Stack.Screen name="ReportesScreen" component={ReportesScreen} options={{ title: "Gol Ahora - Reportes" }} />
          <Stack.Screen name="ClientesScreen" component={ClientesScreen} options={{ title: "Gol Ahora - Clientes" }} />
          <Stack.Screen name="ClasesProfeScreen" component={ClasesProfeScreen} options={{ title: "Gol Ahora - Mis Clases" }} />
          <Stack.Screen name="MisRecibosScreen" component={MisRecibosScreen} options={{ title: "Gol Ahora - Mis Recibos" }} />
          <Stack.Screen name="MisClasesClienteScreen" component={MisClasesClienteScreen} options={{ title: "Gol Ahora - Mis Clases y Entrenamientos" }} />

        </Stack.Navigator>
      </AutoLogoutWrapper>
    </NavigationContainer>
  );
}