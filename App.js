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
import staffScreen from './src/screens/staffScreen'; 
import InscripcionesScreen from './src/screens/InscripcionesScreen';
import FacturacionScreen from './src/screens/FacturacionScreen';
import ReportesScreen from './src/screens/ReportesScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom' 
        }}
      >
        {/* PANTALLAS PRINCIPALES */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* PANTALLAS DE MÓDULOS (VINCULADAS AL DASHBOARD) */}
        <Stack.Screen name="UserScreen" component={UserScreen} />
        <Stack.Screen name="CanchasScreen" component={CanchasScreen} />
        <Stack.Screen name="ReservasScreen" component={ReservasScreen} />
        <Stack.Screen name="CompetenciasScreen" component={CompetenciasScreen} />
        <Stack.Screen name="staffScreen" component={staffScreen} />
        <Stack.Screen name="InscripcionesScreen" component={InscripcionesScreen} />
        <Stack.Screen name="FacturacionScreen" component={FacturacionScreen} />
        <Stack.Screen name="ReportesScreen" component={ReportesScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}