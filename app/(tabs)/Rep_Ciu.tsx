import { Entypo, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import HamburgerMenu from '../auth/MenuHamburguesa';

const screenWidth = Dimensions.get('window').width;

// ─────────────────────────────────────────────────────────────
// 🎨 COLOR DE ACENTO — cambia este valor para probar otros colores
// Ejemplos: ACCENT (naranja), '#2e5929' (verde), '#3A86FF' (azul)
//            '#9B5DE5' (morado), '#DC2626' (rojo)
// Define a default color for ACCENT
const ACCENT = '#EC5B13'; // Replace with your desired color value
// ─────────────────────────────────────────────────────────────

// Colores para el gráfico de pastel (naranja / colores llamativos para ciudadano)
const COLORS = [ACCENT, '#F48C06', '#3A86FF', '#2DC653', '#9B5DE5', '#F72585'];

// Mapeo EPI → nombre legible y zona/barrio popular
const EPI_INFO: {
  [key: string]: { name: string; barrio: string; numero: string };
} = {
  'EPI_N1_Coña Coña': { name: 'EPI N°1 Coña Coña', barrio: 'Coña Coña', numero: '1' },
  'EPI_N3_Jaihuayco':  { name: 'EPI N°3 Jaihuayco',  barrio: 'Jaihuayco',  numero: '3' },
  'EPI_N5_Alalay':     { name: 'EPI N°5 Alalay',      barrio: 'Alalay',      numero: '5' },
  'EPI_N6_Central':    { name: 'EPI N°6 Central',     barrio: 'Cala Cala',   numero: '6' },
  'EPI_N7_Sur':        { name: 'EPI N°7 Sur',         barrio: 'Valle Hermoso', numero: '7' },
};

const getEPIName  = (raw: string) => EPI_INFO[raw]?.name   || raw;
const getBarrio   = (raw: string) => EPI_INFO[raw]?.barrio  || raw;

// Formatea tipos con guion bajo → texto normal capitalizado
const formatTipo = (tipo: string) =>
  tipo
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

// Consejos de prevención (estáticos, siempre relevantes)
const CONSEJOS = [
  {
    icon: 'moon-o' as const,
    iconLib: 'FontAwesome' as const,
    titulo: 'Evita zonas oscuras',
    desc: 'Circula por calles bien iluminadas, especialmente después de las 20:00 hrs.',
  },
  {
    icon: 'volume-up' as const,
    iconLib: 'FontAwesome' as const,
    titulo: 'Reporta actividad sospechosa',
    desc: 'Usa la función "Reportar" para alertar rápido a las autoridades.',
  },
  {
    icon: 'group' as const,
    iconLib: 'FontAwesome' as const,
    titulo: 'Seguridad Vecinal',
    desc: 'Mantente en contacto con tus vecinos a través de los canales oficiales.',
  },
  {
    icon: 'phone' as const,
    iconLib: 'FontAwesome' as const,
    titulo: 'Ten el 110 a mano',
    desc: 'Guarda el número de emergencias policial en tu lista de contactos favoritos.',
  },
  {
    icon: 'lock' as const,
    iconLib: 'FontAwesome' as const,
    titulo: 'Asegura tu domicilio',
    desc: 'Verifica cerraduras y no abras la puerta a desconocidos sin identificación.',
  },
  {
    icon: 'eye' as const,
    iconLib: 'FontAwesome' as const,
    titulo: 'Sé observador',
    desc: 'Si algo te parece fuera de lugar, confía en tu instinto y busca ayuda.',
  },
];

const EstadisticasCiudadanoScreen = () => {
  const [stats, setStats]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'https://safecity-1.onrender.com/estadisticas';

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(API_URL);
        const json = await res.json();
        if (json.success) setStats(json.data);
      } catch (e) {
        console.error('Error fetching stats:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  if (!stats) return null;

  // Datos para el gráfico de pastel
  const chartData = stats.porEPI.map((item: any, i: number) => ({
    name: getEPIName(item.modulo_epi),
    population: item.cantidad,
    color: COLORS[i % COLORS.length],
    legendFontColor: '#555',
    legendFontSize: 13,
  }));

  const epiMasCasos = stats.porEPI.length > 0 ? stats.porEPI[0] : null;
  const tipoFrecuente = stats.tipoFrecuente;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerTitle: 'Reportes Estadísticos',
          headerStyle: { backgroundColor: '#2e5929' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
          headerLeft: () => <HamburgerMenu />,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── GRÁFICO DE PASTEL ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reportes por Zona</Text>

          {/* Layout horizontal: gráfico izquierda | leyenda derecha — igual al mockup */}
          <View style={styles.chartRow}>
            {/* Gráfico a la izquierda */}
            <PieChart
              data={chartData}
              width={180}
              height={180}
              chartConfig={{ color: (opacity = 1) => `rgba(0,0,0,${opacity})` }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              hasLegend={false}
              absolute
            />

            {/* Leyenda a la derecha: punto | nombre | porcentaje en negrita */}
            <View style={styles.legendContainer}>
              {stats.porEPI.map((item: any, i: number) => {
                const pct = Math.round((item.cantidad / stats.total) * 100);
                return (
                  <View key={i} style={styles.legendRow}>
                    <View style={styles.legendLeft}>
                      <View style={[styles.legendDot, { backgroundColor: COLORS[i % COLORS.length] }]} />
                      <Text style={styles.legendName} numberOfLines={1}>{getEPIName(item.modulo_epi)}</Text>
                    </View>
                    <Text style={styles.legendPct}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── ZONA CRÍTICA (dos tarjetas) ── */}
        <View style={styles.gridContainer}>

          {/* Tarjeta 1: EPI con más reportes */}
          <View style={styles.criticalCard}>
            <View style={styles.criticalIconBg}>
              <MaterialIcons name="location-on" size={26} color={ACCENT} />
            </View>
            <Text style={styles.criticalLabel}>ZONA CRÍTICA</Text>
            <Text style={styles.criticalValue} numberOfLines={2}>
              {epiMasCasos ? getBarrio(epiMasCasos.modulo_epi) : 'N/A'}
            </Text>
            <Text style={styles.criticalSub}>Mayor incidencia</Text>
          </View>

          {/* Tarjeta 2: Tipo de incidente más frecuente */}
          <View style={styles.criticalCard}>
            <View style={styles.criticalIconBg}>
              <MaterialIcons name="warning" size={26} color={ACCENT} />
            </View>
            <Text style={styles.criticalLabel}>TIPO COMÚN</Text>
            <Text style={styles.criticalValue} numberOfLines={2}>
              {tipoFrecuente ? formatTipo(tipoFrecuente.tipo) : 'N/A'}
            </Text>
            <Text style={styles.criticalSub}>Modus operandi</Text>
          </View>

        </View>

        {/* ── CONSEJOS DE PREVENCIÓN ── */}
        <View style={styles.consejosHeader}>
          <View style={styles.consejosIconBg}>
            <FontAwesome name="shield" size={22} color={ACCENT} />
          </View>
          <Text style={styles.consejosTitle}>Consejos de Prevención</Text>
        </View>

        {CONSEJOS.map((consejo, i) => (
          <View key={i} style={styles.consejoCard}>
            <View style={styles.consejoIconBg}>
              <FontAwesome name={consejo.icon} size={26} color={ACCENT} />
            </View>
            <View style={styles.consejoTexto}>
              <Text style={styles.consejoTitulo}>{consejo.titulo}</Text>
              <Text style={styles.consejoDesc}>{consejo.desc}</Text>
            </View>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EDEDED' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EDEDED' },
  loadingText: { marginTop: 10, color: ACCENT, fontWeight: 'bold' },

  scrollContent: { padding: 16, paddingBottom: 90 },

  // ── TARJETA BASE ──
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
  },

  // ── GRID DOS TARJETAS CRÍTICAS ──
  gridContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  criticalCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 5,        // ← solo borde izquierdo, como en el mockup
    borderLeftColor: ACCENT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  criticalIconBg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FEE5D4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  criticalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: ACCENT,
    letterSpacing: 1,
    marginBottom: 4,
  },
  criticalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  criticalSub: {
    fontSize: 12,
    color: '#888',
  },

  // ── CABECERA CONSEJOS ──
  consejosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  consejosIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEE5D4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  consejosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },

  // ── TARJETA CONSEJO ──
  consejoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  consejoIconBg: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#FEE5D4',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  consejoTexto: { flex: 1 },
  consejoTitulo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  consejoDesc: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  // ── LEYENDA CUSTOM DEL GRÁFICO (columna derecha) ──
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendContainer: {
    flex: 1,
    paddingLeft: 8,
    gap: 10,
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  legendLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  legendDot: { width: 11, height: 11, borderRadius: 6, flexShrink: 0 },
  legendName: { fontSize: 12, color: '#333', flexShrink: 1 },
  legendPct: { fontSize: 13, fontWeight: 'bold', color: '#111', marginLeft: 4 },
});

export default EstadisticasCiudadanoScreen;