
export const getEstadisticas = () => {
  return {
    Ingresos: {
      total: "$154.200",
      detalle: "Recaudación Mayo 2026",
      color: "#009b3a",
      icon: "cash-multiple",
      datosSemanales: [40, 70, 50, 90, 60, 85, 30], // Representa montos
      descripcion: "Incluye reservas online, clases y torneos."
    },
    Asistencia: {
      total: "85%",
      detalle: "Presentismo en Clases",
      color: "#ffb300",
      icon: "account-check",
      datosSemanales: [80, 95, 85, 70, 90, 100, 60], // Representa porcentajes
      descripcion: "Control de asistencia de alumnos por profesor."
    },
    Reservas: {
      total: "142",
      detalle: "Turnos de Canchas",
      color: "#4ade80",
      icon: "calendar-check",
      datosSemanales: [20, 35, 25, 45, 50, 80, 75], // Representa cantidad de turnos
      descripcion: "Ocupación de F5, F7 y F11 en el complejo."
    },
    Canchas: {
      total: "Historial",
      detalle: "Reportes generados",
      color: "#3b82f6",
      icon: "file-document-multiple",
      datosSemanales: [],
      descripcion: "Historial de reportes del estado técnico de las canchas generados por el personal."
    },
    Usuarios: {
      total: "Historial",
      detalle: "Reportes generados",
      color: "#8b5cf6",
      icon: "account-multiple",
      datosSemanales: [],
      descripcion: "Historial de reportes de usuarios tipo cliente."
    }
  };
};