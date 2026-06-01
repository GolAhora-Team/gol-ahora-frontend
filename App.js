import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// IMPORTACIÓN DE PANTALLAS
import LoginScreen from './src/screens/LoginScreen';
import Dashboard from './src/screens/Dashboard';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

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

const Stack = createNativeStackNavigator();

import AutoLogoutWrapper from './src/components/AutoLogoutWrapper';

export default function App() {
  return (
    <NavigationContainer>
      <AutoLogoutWrapper>
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

        {/* PANTALLAS DE MÓDULOS (VINCULADAS AL DASHBOARD) */}
        <Stack.Screen name="UserScreen" component={UserScreen} options={{ title: "Gol Ahora - Usuarios" }} />
        <Stack.Screen name="CanchasScreen" component={CanchasScreen} options={{ title: "Gol Ahora - Canchas" }} />
        <Stack.Screen name="ReservasScreen" component={ReservasScreen} options={{ title: "Gol Ahora - Reservas" }} />
        <Stack.Screen name="CompetenciasScreen" component={CompetenciasScreen} options={{ title: "Gol Ahora - Competencias" }} />
        <Stack.Screen name="StaffScreen" component={StaffScreen} options={{ title: "Gol Ahora - Staff" }} />
        <Stack.Screen name="InscripcionesScreen" component={InscripcionesScreen} options={{ title: "Gol Ahora - Inscripciones" }} />
        <Stack.Screen name="FacturacionScreen" component={FacturacionScreen} options={{ title: "Gol Ahora - Facturación" }} />
        <Stack.Screen name="ReportesScreen" component={ReportesScreen} options={{ title: "Gol Ahora - Reportes" }} />
        <Stack.Screen name="ClientesScreen" component={ClientesScreen} options={{ title: "Gol Ahora - Clientes" }} />
        <Stack.Screen name="ClasesProfeScreen" component={ClasesProfeScreen} options={{ title: "Gol Ahora - Mis Clases" }} />

      </Stack.Navigator>
      </AutoLogoutWrapper>
    </NavigationContainer>
  );
}