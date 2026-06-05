import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Platform, Modal, useWindowDimensions, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import ScreenTemplate from './ScreenTemplate';
import { getEstadisticas } from '../components/DataReportes';
import { reportHistoryService } from '../services/reportHistoryService';
import { claseService } from '../services/claseService';
import { pagoService } from '../services/pagoService';
import { entrenamientoService } from '../services/entrenamientoService';
import { reservaService } from '../services/reservaService';
import { facturaService } from '../services/facturaService';
import { clienteService } from '../services/clienteService';
import { asistenciaService } from '../services/asistenciaService';
import { BarChart, LineChart, StackedBarChart } from 'react-native-chart-kit';

export default function ReportesScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  const { role: currentUserRole } = route.params || { role: "ADMIN" };
  const [reporteActivo, setReporteActivo] = useState("Ingresos");
  const [historialCanchas, setHistorialCanchas] = useState([]);
  const [historialUsuarios, setHistorialUsuarios] = useState([]);
  const [ordenFecha, setOrdenFecha] = useState('desc');
  const [modalVerVisible, setModalVerVisible] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [asistenciaData, setAsistenciaData] = useState([]);
  const [asistenciaLoading, setAsistenciaLoading] = useState(false);
  const [expandedClase, setExpandedClase] = useState(null);

  const [realIngresos, setRealIngresos] = useState(null);
  const [realReservas, setRealReservas] = useState(null);
  const [timeFilter, setTimeFilter] = useState("Semana"); // 'Semana', 'Mes', 'Año'
  const [tooltip, setTooltip] = useState(null);

  const chartWidth = isMobile ? Math.floor(width * 0.95) - 106 : Math.min(width - 240, 1050);

  const estadisticas = getEstadisticas();

  if (realIngresos) {
    estadisticas.Ingresos = {
      ...estadisticas.Ingresos,
      total: `$${realIngresos.total.toLocaleString('es-AR')}`,
      labels: realIngresos.labels,
      datosSemanales: realIngresos.datosSemanales,
      detalle: `Recaudación (${timeFilter})`
    };
  }
  if (realReservas) {
    estadisticas.Reservas = {
      ...estadisticas.Reservas,
      total: `${realReservas.total}`,
      labels: realReservas.labels,
      data: realReservas.data,
      legend: realReservas.legend,
      detalle: `Total de reservas (${timeFilter})`
    };
  }

  const dataActual = estadisticas[reporteActivo];

  React.useEffect(() => {
    if (reporteActivo === 'Canchas' || reporteActivo === 'Usuarios') {
      reportHistoryService.getReportes().then(reports => {
        const canchasFiltered = (reports || []).filter(r => r.fileName && r.fileName.includes("Canchas"));
        const usuariosFiltered = (reports || []).filter(r => r.fileName && r.fileName.includes("Usuario"));
        setHistorialCanchas(canchasFiltered);
        setHistorialUsuarios(usuariosFiltered);
      });
    }
    if (reporteActivo === 'Asistencia') {
      loadAsistenciaData();
    }
    if (reporteActivo === 'Ingresos') {
      loadRealIngresos();
    }
    if (reporteActivo === 'Reservas') {
      loadRealReservas();
    }
    setTooltip(null);
  }, [reporteActivo, timeFilter]);

  const loadRealIngresos = async () => {
    try {
      const pagos = await pagoService.getAll();
      const list = (pagos || []).filter(p => p.estado === 2 || p.estado === 'Pagado' || p.estado === 'Aprobado' || p.estado === 'Completado');
      const total = list.reduce((sum, p) => sum + (p.monto || 0), 0);

      let labels = [];
      let datos = [];

      if (timeFilter === 'Semana') {
        labels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
        datos = [0, 0, 0, 0, 0, 0, 0];
        list.forEach(p => {
          if (p.fechaPago) {
            const date = new Date(p.fechaPago);
            let day = date.getDay();
            let index = day === 0 ? 6 : day - 1;
            datos[index] += p.monto || 0;
          }
        });
      } else if (timeFilter === 'Mes') {
        labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        datos = [0, 0, 0, 0];
        list.forEach(p => {
          if (p.fechaPago) {
            const date = new Date(p.fechaPago);
            let week = Math.min(Math.floor(date.getDate() / 7), 3);
            datos[week] += p.monto || 0;
          }
        });
      } else {
        labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        datos = new Array(12).fill(0);
        list.forEach(p => {
          if (p.fechaPago) {
            const date = new Date(p.fechaPago);
            datos[date.getMonth()] += p.monto || 0;
          }
        });
      }
      setRealIngresos({ total, datosSemanales: datos, labels });
    } catch (e) { console.error(e); }
  };

  const loadRealReservas = async () => {
    try {
      const reservas = await reservaService.getAll();
      const list = reservas || [];
      const now = new Date();

      // ─── Función auxiliar: obtener tipo de cancha (F5=0, F7=1, F11=2) ───────
      const getTipoIdx = (r) => {
        // Intentar por campo tipo primero, luego por nombre como fallback
        const tipo = (r.cancha?.tipo ?? '').toString().toLowerCase();
        if (tipo === '2' || tipo.includes('11')) return 2;
        if (tipo === '1' || tipo.includes('7')) return 1;
        // Fallback por nombre
        const nombre = r.cancha?.nombre ?? '';
        if (nombre.includes('11')) return 2;
        if (nombre.includes('7')) return 1;
        return 0; // Fútbol 5
      };

      let labels = [];
      const legend = ['F5', 'F7', 'F11'];
      let data = [];
      let filteredList = [];

      if (timeFilter === 'Semana') {
        // Filtrar solo la semana actual (lunes a hoy)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Lunes
        startOfWeek.setHours(0, 0, 0, 0);

        filteredList = list.filter(r => {
          const dateStr = r.fecha || r.fechaTurno || r.fechaReserva;
          if (!dateStr) return false;
          return new Date(dateStr) >= startOfWeek;
        });

        labels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
        data = Array.from({ length: 7 }, () => [0, 0, 0]);
        filteredList.forEach(r => {
          const dateStr = r.fecha || r.fechaTurno || r.fechaReserva;
          if (dateStr) {
            const date = new Date(dateStr);
            const index = (date.getDay() + 6) % 7; // 0=Lun ... 6=Dom
            data[index][getTipoIdx(r)] += 1;
          }
        });

      } else if (timeFilter === 'Mes') {
        // Filtrar solo el mes actual
        filteredList = list.filter(r => {
          const dateStr = r.fecha || r.fechaTurno || r.fechaReserva;
          if (!dateStr) return false;
          const d = new Date(dateStr);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });

        labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        data = Array.from({ length: 4 }, () => [0, 0, 0]);
        filteredList.forEach(r => {
          const dateStr = r.fecha || r.fechaTurno || r.fechaReserva;
          if (dateStr) {
            const date = new Date(dateStr);
            const week = Math.min(Math.floor((date.getDate() - 1) / 7), 3);
            data[week][getTipoIdx(r)] += 1;
          }
        });

      } else {
        // Filtrar solo el año actual
        filteredList = list.filter(r => {
          const dateStr = r.fecha || r.fechaTurno || r.fechaReserva;
          if (!dateStr) return false;
          return new Date(dateStr).getFullYear() === now.getFullYear();
        });

        labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        data = Array.from({ length: 12 }, () => [0, 0, 0]);
        filteredList.forEach(r => {
          const dateStr = r.fecha || r.fechaTurno || r.fechaReserva;
          if (dateStr) {
            const date = new Date(dateStr);
            data[date.getMonth()][getTipoIdx(r)] += 1;
          }
        });
      }

      // Total KPI = reservas del período seleccionado (no total histórico)
      setRealReservas({ total: filteredList.length, data, labels, legend });
    } catch (e) { console.error(e); }
  };

  const loadAsistenciaData = async () => {
    setAsistenciaLoading(true);
    try {
      let clases = [];
      let entrenamientos = [];
      try { clases = await claseService.getAll() || []; } catch(e){}
      try { entrenamientos = await entrenamientoService.getAll() || []; } catch(e){}

      const combined = [
        ...clases.map(c => ({ ...c, tipo: 'CLASE' })),
        ...entrenamientos.map(e => ({ ...e, tipo: 'ENTRENAMIENTO' }))
      ];

      // Generar últimos 30 días para consultar asistencias
      const fechas = [];
      const hoy = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(hoy);
        d.setDate(hoy.getDate() - i);
        fechas.push(d.toISOString().split('T')[0]);
      }

      const result = [];
      for (const actividad of combined) {
        const actId = actividad.id;
        const alumnos = actividad.clientes || [];

        // Consultar asistencias de la API para cada fecha
        const todasAsistencias = [];
        const fechasConRegistro = new Set();
        for (const fecha of fechas) {
          try {
            const registros = await asistenciaService.getAsistenciasPorClaseYFecha(actId, fecha);
            if (registros && registros.length > 0) {
              fechasConRegistro.add(fecha);
              todasAsistencias.push(...registros);
            }
          } catch(e) { /* fecha sin registros */ }
        }

        const alumnosStats = alumnos.map(alumno => {
          const registrosAlumno = todasAsistencias.filter(r => r.clienteId === alumno.id);
          const presentes = registrosAlumno.filter(r => r.presente === true).length;
          const inasistencias = registrosAlumno.filter(r => r.presente === false).length;
          const totalClases = presentes + inasistencias;
          const porcentaje = totalClases > 0 ? Math.round((presentes / totalClases) * 100) : 0;
          return {
            id: alumno.id,
            nombre: `${alumno.nombre} ${alumno.apellido || ''}`.trim(),
            presentes,
            inasistencias,
            totalClases,
            porcentaje
          };
        });

        result.push({
          id: `${actividad.tipo}-${actId?.toString()}`,
          originalId: actId?.toString(),
          nombre: `${actividad.nombre} (${actividad.tipo === 'ENTRENAMIENTO' ? 'Entrenamiento' : 'Clase'})`,
          horario: actividad.horario || 'Sin horario',
          totalAlumnos: alumnos.length,
          totalClasesRegistradas: fechasConRegistro.size,
          alumnosStats
        });
      }
      setAsistenciaData(result);
    } catch (error) {
      console.error('Error loading asistencia:', error);
    } finally {
      setAsistenciaLoading(false);
    }
  };

  const downloadPdf = async (pdfData) => {
    if (Platform.OS === 'web') {
      try {
        const module = await import('html2pdf.js');
        const html2pdf = module.default || module;
        const element = document.createElement('div');
        element.innerHTML = pdfData.html;
        html2pdf().from(element).set({
          margin: 10,
          filename: (pdfData.fileName || 'Reporte') + '.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).save();
      } catch (err) {
        console.error("Error cargando html2pdf.js", err);
      }
    } else {
      const { uri } = await Print.printToFileAsync({ html: pdfData.html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    }
  };

  const printHtml = async (htmlContent) => {
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } else {
      await Print.printAsync({ html: htmlContent });
    }
  };

  const viewHtml = async (htmlContent) => {
    if (Platform.OS === 'web') {
      const viewWindow = window.open('', '_blank');
      viewWindow.document.write(htmlContent);
      viewWindow.document.close();
      viewWindow.focus();
    } else {
      await Print.printAsync({ html: htmlContent });
    }
  };

  const handleExportExcel = async () => {
    const dias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    let csvContent = `Reporte: ${reporteActivo}\nTotal: ${dataActual.total}\nDetalle: ${dataActual.detalle}\n\nDia,Valor\n`;
    dataActual.datosSemanales.forEach((v, i) => { csvContent += `${dias[i]},${v}\n` });

    if (Platform.OS === 'web') {
      const element = document.createElement("a");
      const file = new Blob([csvContent], { type: 'text/csv' });
      element.href = URL.createObjectURL(file);
      element.download = `Gol_Ahora_${reporteActivo}.csv`;
      element.click();
    } else {
      const path = `${FileSystem.documentDirectory}reporte_${reporteActivo}.csv`;
      await FileSystem.writeAsStringAsync(path, csvContent);
      await Sharing.shareAsync(path);
    }
  };

  const handlePrint = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #000; }
            .header { text-align: center; margin-bottom: 30px; }
            .brand { color: #009b3a; font-size: 50px; font-weight: 900; margin: 0; }
            .subtitle { font-size: 14px; font-weight: bold; margin-top: 5px; }
            .line { border-bottom: 2px solid #000; margin: 20px 0; }
            .content { margin-top: 20px; font-size: 18px; line-height: 1.6; }
            .report-name { font-size: 22px; text-decoration: underline; margin-bottom: 10px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #444; border-top: 1px solid #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="brand">GOL AHORA</h1>
            <div class="subtitle">SISTEMA DE GESTIÓN DEPORTIVA</div>
          </div>
          <div class="line"></div>
          <div class="content">
            <div class="report-name">REPORTE DE ${reporteActivo.toUpperCase()}</div>
            <p><b>VALOR TOTAL:</b> ${dataActual.total}</p>
            <p><b>PERIODO:</b> ${dataActual.detalle}</p>
            <p><b>DESCRIPCIÓN:</b> ${dataActual.descripcion}</p>
          </div>
          <div class="footer">
            Generado por ${currentUserRole} - ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;

    try {
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert("Error", "No se pudo iniciar la impresión.");
    }
  };

  const sortedHistorialCanchas = [...historialCanchas].sort((a, b) => {
    const dateA = new Date(a.fecha.endsWith('Z') ? a.fecha : a.fecha + 'Z').getTime();
    const dateB = new Date(b.fecha.endsWith('Z') ? b.fecha : b.fecha + 'Z').getTime();
    return ordenFecha === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const sortedHistorialUsuarios = [...historialUsuarios].sort((a, b) => {
    const dateA = new Date(a.fecha.endsWith('Z') ? a.fecha : a.fecha + 'Z').getTime();
    const dateB = new Date(b.fecha.endsWith('Z') ? b.fecha : b.fecha + 'Z').getTime();
    return ordenFecha === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    fillShadowGradientFrom: "#10b981",
    fillShadowGradientTo: "#ffffff",
    fillShadowGradientFromOpacity: 0.4,
    fillShadowGradientToOpacity: 0.05,
    useShadowColorFromDataset: true,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
    strokeWidth: 4,
    barPercentage: 0.85,
    propsForDots: {
      r: "7",
      strokeWidth: "3",
      stroke: "#ffffff"
    },
    propsForLabels: {
      fontSize: 14,
      fontWeight: "800",
      fill: "#334155"
    },
    propsForBackgroundLines: {
      strokeDasharray: "4",
      stroke: "#e2e8f0",
      strokeWidth: 1
    }
  };

  const renderChart = () => {
    if (reporteActivo === 'Ingresos' && realIngresos) {
      return (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Flujo de Ingresos ({timeFilter})</Text>
          <LineChart
            data={{
              labels: realIngresos.labels,
              datasets: [{
                data: realIngresos.datosSemanales,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                strokeWidth: 4
              }]
            }}
            width={chartWidth}
            height={360}
            yAxisLabel="$"
            chartConfig={chartConfig}
            style={styles.chartStyle}
            bezier
            fromZero
            onDataPointClick={({ value, x, y }) => setTooltip({ x, y, value: `$${value.toLocaleString('es-AR')}` })}
          />
          {tooltip && (
            <View style={[styles.tooltip, { left: tooltip.x - 40, top: tooltip.y - 45 }]}>
              <Text style={styles.tooltipText}>{tooltip.value}</Text>
            </View>
          )}
        </View>
      );
    }
    if (reporteActivo === 'Reservas' && realReservas) {
      return (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Distribución de Reservas ({timeFilter})</Text>
          <LineChart
            data={{
              labels: realReservas.labels,
              datasets: [
                {
                  data: realReservas.data.map(item => item[0]), // F5
                  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                  strokeWidth: 4
                },
                {
                  data: realReservas.data.map(item => item[1]), // F7
                  color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                  strokeWidth: 4
                },
                {
                  data: realReservas.data.map(item => item[2]), // F11
                  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                  strokeWidth: 4
                }
              ]
            }}
            width={chartWidth}
            height={360}
            chartConfig={chartConfig}
            bezier
            fromZero
            style={styles.chartStyle}
            onDataPointClick={({ value, dataset, x, y }) => {
              const colorStr = dataset.color(1);
              let label = "Reservas";
              if (colorStr.includes("16, 185, 129")) label = "Fútbol 5";
              if (colorStr.includes("245, 158, 11")) label = "Fútbol 7";
              if (colorStr.includes("99, 102, 241")) label = "Fútbol 11";
              setTooltip({ x, y, value: `${value} ${label}` });
            }}
          />
          {tooltip && (
            <View style={[styles.tooltip, { left: tooltip.x - 50, top: tooltip.y - 50 }]}>
              <Text style={styles.tooltipText}>{tooltip.value}</Text>
            </View>
          )}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendLabel}>Fútbol 5</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendLabel}>Fútbol 7</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#6366f1' }]} />
              <Text style={styles.legendLabel}>Fútbol 11</Text>
            </View>
          </View>
        </View>
      );
    }
    if (reporteActivo === 'Asistencia') {
      const asistData = asistenciaData.map(c => c.totalAlumnos > 0 ? (c.alumnosStats.filter(a => a.porcentaje > 50).length / c.totalAlumnos) * 100 : 0);
      return (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Tendencia de Asistencia (%)</Text>
          <LineChart
            data={{ labels: asistenciaData.map(c => c.nombre.substring(0, 5)), datasets: [{ data: asistData.length ? asistData : [0] }] }}
            width={chartWidth}
            height={250}
            chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(255, 179, 0, ${opacity})` }}
            bezier
            fromZero
            style={styles.chartStyle}
            onDataPointClick={({ value, x, y }) => setTooltip({ x, y, value: `${Math.round(value)}%` })}
          />
          {tooltip && (
            <View style={[styles.tooltip, { left: tooltip.x - 20, top: tooltip.y - 45 }]}>
              <Text style={styles.tooltipText}>{tooltip.value}</Text>
            </View>
          )}
        </View>
      );
    }
    return null;
  };

  return (
    <ScreenTemplate userRole={currentUserRole} navigation={navigation}>
      <Text style={styles.title}>Panel de Reportes</Text>

      <View style={[styles.selectorGrid, isMobile && styles.selectorGridMobile]}>
        {Object.keys(estadisticas).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.selBtn, isMobile && styles.selBtnMobile, reporteActivo === key && { backgroundColor: estadisticas[key].color }]}
            onPress={() => setReporteActivo(key)}
          >
            <MaterialCommunityIcons
              name={estadisticas[key].icon}
              size={24}
              color={reporteActivo === key ? "#fff" : estadisticas[key].color}
            />
            <Text style={[styles.selText, reporteActivo === key && { color: "#fff" }]}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.mainVisualArea}>
        {reporteActivo === 'Canchas' || reporteActivo === 'Usuarios' ? (
          <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1 }}>
            <View style={styles.kpiCard}>
              <MaterialCommunityIcons name={dataActual.icon} size={32} color={dataActual.color} />
              <View style={{ marginLeft: 15 }}>
                <Text style={styles.kpiLabel}>{reporteActivo.toUpperCase()}</Text>
                <Text style={styles.kpiValue}>{reporteActivo === 'Canchas' ? historialCanchas.length : historialUsuarios.length} Reportes</Text>
                <Text style={styles.kpiSub}>{dataActual.detalle}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15 }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, elevation: 2 }}
                onPress={() => setOrdenFecha(prev => prev === 'desc' ? 'asc' : 'desc')}
              >
                <Text style={{ color: '#1e293b', fontSize: 12, fontWeight: '800', marginRight: 5 }}>Ordenar por fecha</Text>
                <MaterialCommunityIcons name={ordenFecha === 'asc' ? "arrow-up" : "arrow-down"} size={16} color="#1e293b" />
              </TouchableOpacity>
            </View>

            {reporteActivo === 'Canchas' ? (
              sortedHistorialCanchas.map(rep => (
                <View key={rep.id} style={[styles.historyCard, isMobile && styles.historyCardMobile]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginBottom: isMobile ? 12 : 0 }}>
                    <MaterialCommunityIcons name="file-pdf-box" size={isMobile ? 24 : 30} color="#ef4444" />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={{ fontWeight: '800', color: '#1e293b', fontSize: isMobile ? 13 : 15 }}>{rep.fileName || 'Reporte de Estado'}</Text>
                      <Text style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(rep.fecha.endsWith('Z') ? rep.fecha : rep.fecha + 'Z').toLocaleString()}</Text>
                    </View>
                  </View>
                  <View style={[styles.historyActionRow, isMobile && { width: '100%', justifyContent: 'flex-end' }]}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#3b82f6' }, isMobile && { flex: 1 }]}
                      onPress={() => { setReporteSeleccionado(rep); setModalVerVisible(true); }}
                    >
                      <MaterialCommunityIcons name="eye" size={18} color="#fff" />
                      {!isMobile && <Text style={styles.actionButtonText}>Ver</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#009b3a' }, isMobile && { flex: 1 }]}
                      onPress={() => downloadPdf(rep)}
                    >
                      <MaterialCommunityIcons name="download" size={18} color="#fff" />
                      {!isMobile && <Text style={styles.actionButtonText}>Descargar</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#ffb300' }, isMobile && { flex: 1 }]}
                      onPress={() => printHtml(rep.html)}
                    >
                      <MaterialCommunityIcons name="printer" size={18} color="#000" />
                      {!isMobile && <Text style={[styles.actionButtonText, { color: '#000' }]}>Imprimir</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              sortedHistorialUsuarios.map(rep => (
                <View key={rep.id} style={[styles.historyCard, isMobile && styles.historyCardMobile]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginBottom: isMobile ? 12 : 0 }}>
                    <MaterialCommunityIcons name="file-pdf-box" size={isMobile ? 24 : 30} color="#ef4444" />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={{ fontWeight: '800', color: '#1e293b', fontSize: isMobile ? 13 : 15 }}>{rep.fileName || 'Reporte de Usuario'}</Text>
                      <Text style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(rep.fecha.endsWith('Z') ? rep.fecha : rep.fecha + 'Z').toLocaleString()}</Text>
                    </View>
                  </View>
                  <View style={[styles.historyActionRow, isMobile && { width: '100%', justifyContent: 'flex-end' }]}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#3b82f6' }, isMobile && { flex: 1 }]}
                      onPress={() => { setReporteSeleccionado(rep); setModalVerVisible(true); }}
                    >
                      <MaterialCommunityIcons name="eye" size={18} color="#fff" />
                      {!isMobile && <Text style={styles.actionButtonText}>Ver</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#009b3a' }, isMobile && { flex: 1 }]}
                      onPress={() => downloadPdf(rep)}
                    >
                      <MaterialCommunityIcons name="download" size={18} color="#fff" />
                      {!isMobile && <Text style={styles.actionButtonText}>Descargar</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#ffb300' }, isMobile && { flex: 1 }]}
                      onPress={() => printHtml(rep.html)}
                    >
                      <MaterialCommunityIcons name="printer" size={18} color="#000" />
                      {!isMobile && <Text style={[styles.actionButtonText, { color: '#000' }]}>Imprimir</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        ) : reporteActivo === 'Asistencia' ? (
          <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1 }}>
            <View style={styles.kpiCard}>
              <MaterialCommunityIcons name="account-check" size={32} color="#ffb300" />
              <View style={{ marginLeft: 15 }}>
                <Text style={styles.kpiLabel}>ASISTENCIA POR CLASE</Text>
                <Text style={styles.kpiValue}>{asistenciaData.length} Clases</Text>
                <Text style={styles.kpiSub}>Detalle de presentismo por alumno</Text>
              </View>
            </View>

            {asistenciaLoading ? (
              <ActivityIndicator size="large" color="#ffb300" style={{ marginTop: 30 }} />
            ) : asistenciaData.length === 0 ? (
              <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 30, fontStyle: 'italic' }}>No hay clases con registros de asistencia.</Text>
            ) : (
              asistenciaData.map(clase => (
                <View key={clase.id} style={{ marginBottom: 12 }}>
                  <TouchableOpacity
                    style={[styles.claseHeader, expandedClase === clase.id && styles.claseHeaderExpanded]}
                    onPress={() => setExpandedClase(expandedClase === clase.id ? null : clase.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.claseHeaderTitle}>{clase.nombre}</Text>
                      <Text style={styles.claseHeaderSub}>{clase.horario} • {clase.totalAlumnos} alumnos • {clase.totalClasesRegistradas} clases registradas</Text>
                    </View>
                    <MaterialCommunityIcons name={expandedClase === clase.id ? 'chevron-up' : 'chevron-down'} size={24} color="#64748b" />
                  </TouchableOpacity>

                  {expandedClase === clase.id && (
                    <View style={styles.alumnosTable}>
                      {/* Header de tabla */}
                      <View style={[styles.tableHeaderRow, isMobile && { paddingHorizontal: 10 }]}>
                        <Text style={[styles.tableHeaderCell, { flex: 2 }, isMobile && { fontSize: 10 }]}>Alumno</Text>
                        <Text style={[styles.tableHeaderCell, isMobile && { fontSize: 10 }]}>Presentes</Text>
                        <Text style={[styles.tableHeaderCell, isMobile && { fontSize: 10 }]}>Ausentes</Text>
                        <Text style={[styles.tableHeaderCell, isMobile && { fontSize: 10 }]}>Total</Text>
                        <Text style={[styles.tableHeaderCell, isMobile && { fontSize: 10 }]}>%</Text>
                      </View>
                      {clase.alumnosStats.length === 0 ? (
                        <Text style={{ color: '#94a3b8', padding: 15, textAlign: 'center', fontStyle: 'italic' }}>Sin alumnos inscriptos</Text>
                      ) : (
                        clase.alumnosStats.map(alumno => (
                          <View key={alumno.id} style={[styles.tableRow, isMobile && { paddingHorizontal: 10 }]}>
                            <Text style={[styles.tableCell, { flex: 2, fontWeight: '700' }, isMobile && { fontSize: 11 }]}>{alumno.nombre}</Text>
                            <Text style={[styles.tableCell, isMobile && { fontSize: 11 }]}>{alumno.presentes}</Text>
                            <Text style={[styles.tableCell, isMobile && { fontSize: 11 }]}>{alumno.inasistencias}</Text>
                            <Text style={[styles.tableCell, isMobile && { fontSize: 11 }]}>{alumno.totalClases}</Text>
                            <View style={[styles.pctBadge, { backgroundColor: alumno.porcentaje >= 75 ? '#f0fdf4' : alumno.porcentaje >= 50 ? '#fffbeb' : '#fef2f2' }, isMobile && { paddingHorizontal: 4 }]}>
                              <Text style={[styles.pctText, { color: alumno.porcentaje >= 75 ? '#16a34a' : alumno.porcentaje >= 50 ? '#d97706' : '#ef4444' }, isMobile && { fontSize: 11 }]}>
                                {alumno.porcentaje}%
                              </Text>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
            <View style={{ height: 100 }} />
          </ScrollView>

        ) : (
          <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1 }}>

            <View style={styles.filterRow}>
              {['Semana', 'Mes', 'Año'].map(f => (
                <TouchableOpacity key={f} style={[styles.filterBtn, timeFilter === f && styles.filterBtnActive]} onPress={() => setTimeFilter(f)}>
                  <Text style={[styles.filterText, timeFilter === f && styles.filterTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.kpiCard}>
              <MaterialCommunityIcons name={dataActual.icon} size={32} color={dataActual.color} />
              <View style={{ marginLeft: 15 }}>
                <Text style={styles.kpiLabel}>{reporteActivo.toUpperCase()}</Text>
                <Text style={styles.kpiValue}>{dataActual.total}</Text>
                <Text style={styles.kpiSub}>{dataActual.detalle}</Text>
              </View>
            </View>

            {renderChart()}

            <Text style={styles.description}>{dataActual.descripcion}</Text>
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {reporteActivo !== 'Canchas' && reporteActivo !== 'Usuarios' && (
          <View style={styles.recuadroRojoAcciones}>
            <TouchableOpacity
              style={[styles.btnFlotante, { backgroundColor: '#ffb300' }]}
              onPress={handlePrint}
            >
              <MaterialCommunityIcons name="printer" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnFlotante, { backgroundColor: '#ffb300' }]}
              onPress={handleExportExcel}
            >
              <MaterialCommunityIcons name="microsoft-excel" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={modalVerVisible} animationType="fade" transparent={true}>
        <View style={styles.viewOverlay}>
          <View style={styles.viewContainer}>
            <View style={styles.viewHeader}>
              <Text style={styles.viewTitle}>Vista de Reporte</Text>
              <TouchableOpacity onPress={() => setModalVerVisible(false)}>
                <MaterialCommunityIcons name="close-circle" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, marginTop: 10, backgroundColor: '#f8fafc', borderRadius: 8, overflow: 'hidden' }}>
              {Platform.OS === 'web' && reporteSeleccionado?.html ? (
                <iframe
                  srcDoc={reporteSeleccionado.html}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="Reporte PDF"
                />
              ) : (
                <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ padding: 15 }}>
                  <Text style={{ textAlign: 'center', color: '#64748b', fontSize: 16, marginTop: 20 }}>
                    La previsualización está optimizada para Web. Utilice "Imprimir" para visualizar el documento en el visor nativo del dispositivo.
                  </Text>
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 20 },
  selectorGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 8 },
  selectorGridMobile: { flexWrap: 'wrap', justifyContent: 'center' },
  selBtn: { backgroundColor: '#fff', flex: 1, padding: 12, borderRadius: 15, alignItems: 'center', elevation: 3 },
  selBtnMobile: { flexBasis: '47%', marginBottom: 8, flex: 0 },
  selText: { fontSize: 10, fontWeight: '800', color: '#1e293b', marginTop: 5 },
  mainVisualArea: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 25, padding: 20, position: 'relative', overflow: 'hidden' },
  kpiCard: { backgroundColor: '#fff', flexDirection: 'row', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5 },
  kpiLabel: { fontSize: 10, fontWeight: '900', color: '#64748b' },
  kpiValue: { fontSize: 24, fontWeight: '900', color: '#1e293b' },
  kpiSub: { fontSize: 11, color: '#009b3a', fontWeight: '700' },
  filterRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15, gap: 8 },
  filterBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  filterBtnActive: { backgroundColor: '#009b3a', borderColor: '#009b3a' },
  filterText: { color: '#64748b', fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: '#fff' },
  chartCard: { backgroundColor: '#fff', padding: 15, borderRadius: 20, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5, position: 'relative' },
  chartTitle: { color: '#1e293b', fontWeight: '900', marginBottom: 15, fontSize: 15 },
  chartStyle: { borderRadius: 16, marginTop: 10 },
  tooltip: { position: 'absolute', backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, elevation: 5 },
  tooltipText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  description: { color: '#cbd5e1', fontSize: 12, marginTop: 10, fontStyle: 'italic', textAlign: 'center' },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 12
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7
  },
  legendLabel: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13
  },

  recuadroRojoAcciones: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    flexDirection: 'row',
    zIndex: 999,
  },
  btnFlotante: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 2,
    borderColor: '#000',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // View Modal
  viewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  viewContainer: { width: '100%', maxWidth: 800, height: '80%', backgroundColor: '#fff', borderRadius: 24, padding: 25 },
  viewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  viewTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  historyCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyCardMobile: { flexDirection: 'column', alignItems: 'flex-start' },
  historyActionRow: { flexDirection: 'row', gap: 10 },
  actionButton: { padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionButton: { padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: '#fff', fontWeight: '800', marginLeft: 5, fontSize: 12 },
  // Asistencia styles
  claseHeader: { backgroundColor: '#fff', padding: 15, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  claseHeaderExpanded: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  claseHeaderTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  claseHeaderSub: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 },
  alumnosTable: { backgroundColor: '#fff', borderBottomLeftRadius: 14, borderBottomRightRadius: 14, paddingBottom: 5 },
  tableHeaderRow: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#f8fafc' },
  tableHeaderCell: { flex: 1, fontSize: 11, fontWeight: '900', color: '#64748b', textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8fafc', alignItems: 'center' },
  tableCell: { flex: 1, fontSize: 13, color: '#1e293b', textAlign: 'center' },
  pctBadge: { flex: 1, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, alignItems: 'center' },
  pctText: { fontSize: 13, fontWeight: '900' }
});
