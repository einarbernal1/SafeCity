import { MaterialIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

// Paleta de colores basada en tu diseño
const COLORS = ['#1B3012', '#2D4B1D', '#4A6B3A', '#6D8C5B', '#A3B899'];

// Función para limpiar nombres de EPIs
const formatEPIName = (rawName: string) => {
  return rawName.replace(/_/g, ' ').replace('N', 'N°');
};

const EstadisticasScreen = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // URL DE TU BACKEND EN RENDER
  const API_URL = 'https://safecity-1.onrender.com/estadisticas';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(API_URL);
        const json = await response.json();
        if (json.success) {
          setStats(json.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B3012" />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  if (!stats) return null;

  // Preparar datos para el gráfico de pastel
  const chartData = stats.porEPI.map((item: any, index: number) => ({
    name: formatEPIName(item.modulo_epi),
    population: item.cantidad,
    color: COLORS[index % COLORS.length],
    legendFontColor: '#333',
    legendFontSize: 11,
  }));

  // Obtener la EPI con más casos (la primera del array ordenado)
  const epiMasCasos = stats.porEPI.length > 0 ? stats.porEPI[0] : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerSubtitle}>SAFECITY APP</Text>
          <View style={styles.iconContainer}>
            <MaterialIcons name="notifications" size={20} color="#fff" />
          </View>
        </View>
        <Text style={styles.headerTitle}>Estadísticas de Denuncias</Text>
        <Text style={styles.headerDesc}>Reporte actualizado a tiempo real</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SECCIÓN: GRÁFICO DE PASTEL */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>REPORTES POR EPI</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={chartData}
              width={screenWidth - 60}
              height={180}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"0"}
              absolute // Muestra números en lugar de porcentajes
            />
          </View>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeNumber}>{stats.total}</Text>
            <Text style={styles.totalBadgeText}>TOTAL</Text>
          </View>
        </View>

        {/* SECCIÓN: TARJETAS DE RESUMEN */}
        <View style={styles.gridContainer}>
          <View style={styles.smallCard}>
            <Text style={styles.smallCardTitle}>EPI CON MÁS DENUNCIAS</Text>
            <View>
              <Text style={styles.smallCardValue} numberOfLines={1} adjustsFontSizeToFit>
                {epiMasCasos ? formatEPIName(epiMasCasos.modulo_epi) : 'N/A'}
              </Text>
              <Text style={styles.smallCardHighlight}>
                {epiMasCasos ? `${epiMasCasos.cantidad} Casos` : '0 Casos'}
              </Text>
            </View>
          </View>

          <View style={styles.smallCard}>
            <Text style={styles.smallCardTitle}>TIPO DE DENUNCIA FRECUENTE</Text>
            <View>
              <Text style={styles.smallCardValue} numberOfLines={1} adjustsFontSizeToFit>
                {stats.tipoFrecuente ? stats.tipoFrecuente.tipo : 'N/A'}
              </Text>
              <Text style={styles.smallCardHighlightAccent}>
                {stats.tipoFrecuente ? `${stats.tipoFrecuente.cantidad} Casos` : '0 Casos'}
              </Text>
            </View>
          </View>
        </View>

        {/* SECCIÓN: LISTADO CRIMEN POR EPI */}
        <View style={[styles.card, { paddingHorizontal: 0 }]}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>Crimen Frecuente por EPI</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>GENERAL</Text>
            </View>
          </View>
          
          <View style={styles.listContainer}>
            {stats.crimenPorEPI.map((item: any, index: number) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemLeft}>
                  <View style={styles.listNumber}>
                    <Text style={styles.listNumberText}>{index + 1}</Text>
                  </View>
                  <View>
                    <Text style={styles.listEpiName}>{formatEPIName(item.modulo_epi)}</Text>
                    <Text style={styles.listCasosText}>{item.cantidad} casos registrados</Text>
                  </View>
                </View>
                <View style={styles.crimeBadge}>
                  <Text style={styles.crimeBadgeText}>{item.tipo}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F7F2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F7F2',
  },
  loadingText: {
    marginTop: 10,
    color: '#1B3012',
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#1B3012',
    padding: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  totalBadge: {
    position: 'absolute',
    top: 20,
    right: 0,
    backgroundColor: '#1B3012',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  totalBadgeNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  totalBadgeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 8,
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  smallCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'space-between',
    minHeight: 100,
  },
  smallCardTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  smallCardValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1B3012',
  },
  smallCardHighlight: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 4,
  },
  smallCardHighlightAccent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2D4B1D',
    marginTop: 4,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B3012',
  },
  badge: {
    backgroundColor: '#1B3012',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  listContainer: {
    paddingTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9F7F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(27,48,18,0.1)',
  },
  listNumberText: {
    color: '#1B3012',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listEpiName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  listCasosText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  crimeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  crimeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6B7280',
  },
});

export default EstadisticasScreen;