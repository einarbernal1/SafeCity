import { FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text, // Usamos Text normal en lugar de ThemedText
  TouchableOpacity,
  View // Usamos View normal en lugar de ThemedView
} from 'react-native';

interface Denuncia {
  id_denuncia: number;
  descripcion: string;
  hora: string;
  fecha: string;
  tipo: string;
  calle_avenida: string;
  estado: string;
  evidencia: string;
  modulo_epi: string;
  nombre_denunciante?: string;
}

export default function ReportesScreen() {
  // CONFIGURACIÓN DE URL (HEROKU) - TU LÓGICA ORIGINAL
  const API_BASE = 'https://safecity-1.onrender.com';

  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [denunciasAtendidas, setDenunciasAtendidas] = useState<Denuncia[]>([]);
  const [casosPendientes, setCasosPendientes] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIdPolicia, setCurrentIdPolicia] = useState<string | null>(null);

  // TU LÓGICA DE OBTENER ID (INTACTA)
  const getPoliciaId = async () => {
    if (params.idPolicia) return params.idPolicia.toString();
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id_policia?.toString();
      }
    } catch (error) {
      console.error('Error leyendo AsyncStorage:', error);
    }
    return null;
  };

  // TU LÓGICA DE FETCH (INTACTA)
  const fetchReportes = async () => {
    try {
      const id = await getPoliciaId();
      if (!id) {
        setLoading(false);
        return;
      }
      
      setCurrentIdPolicia(id);

      // 1. Obtener Pendientes
      const resPendientes = await fetch(`${API_BASE}/casosPendientes?idPolicia=${id}`);
      // Manejo seguro por si no hay pendientes
      const dataPendientes = resPendientes.ok ? await resPendientes.json() : [];
      if(Array.isArray(dataPendientes)) setCasosPendientes(dataPendientes);

      // 2. Obtener Atendidas
      const resAtendidas = await fetch(`${API_BASE}/denunciasAtendidas?idPolicia=${id}`);
      const dataAtendidas = resAtendidas.ok ? await resAtendidas.json() : [];
      if(Array.isArray(dataAtendidas)) setDenunciasAtendidas(dataAtendidas);
      
    } catch (error) {
      console.error("Error conectando a Heroku:", error);
      // No mostramos alerta intrusiva cada vez, solo log
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReportes();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReportes();
  };

  // Helpers de formato (INTACTOS)
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) { return dateString; }
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch (e) { return timeString; }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2e5929" />
      </View>
    );
  }

  // --- AQUÍ EMPIEZA EL CAMBIO DE DISEÑO VISUAL ---
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2e5929']} />
        }
      >
        {/* SECCIÓN ATENDIDOS */}
        {denunciasAtendidas.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Atendidos ({denunciasAtendidas.length})
            </Text>

            {denunciasAtendidas.map((denuncia) => (
              <View key={denuncia.id_denuncia} style={styles.card}>
                {/* Header de la tarjeta */}
                <View style={styles.cardHeader}>
                  <Ionicons name="checkmark-circle" size={22} color="#2e5929" />
                  <Text style={styles.cardType}>
                    {denuncia.tipo.toUpperCase()} - {denuncia.calle_avenida}
                  </Text>
                </View>
                
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {denuncia.descripcion}
                </Text>
                
                <Text style={styles.cardDate}>
                  {formatDate(denuncia.fecha)} a las {formatTime(denuncia.hora)}
                </Text>
                
                {denuncia.nombre_denunciante && (
                  <Text style={styles.cardDenunciante}>
                    Denunciante: <Text style={{fontWeight: 'normal'}}>{denuncia.nombre_denunciante}</Text>
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.btnAction}
                  onPress={() => router.push({
                    pathname: '/(policia)/(modals)/DescripcionRAtendidos',
                    params: {
                      ...denuncia,
                      id_denuncia: denuncia.id_denuncia.toString(),
                      idPolicia: String(currentIdPolicia)
                    },
                  })}
                >
                  <Ionicons name="document-text" size={16} color="#fff" style={{marginRight: 8}} />
                  <Text style={styles.btnText}>Descripción</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* SECCIÓN PENDIENTES */}
        <Text style={styles.sectionTitle}>
          Pendientes ({casosPendientes.length})
        </Text>

        {casosPendientes.length === 0 ? (
          <Text style={styles.emptyText}>No hay casos pendientes.</Text>
        ) : (
          casosPendientes.map((caso) => (
            <View key={caso.id_denuncia} style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="alert-circle" size={22} color="#D32F2F" />
                <Text style={styles.cardType}>
                  {caso.tipo.toUpperCase()} - {caso.calle_avenida}
                </Text>
              </View>
              
              <Text style={styles.cardDescription} numberOfLines={2}>
                {caso.descripcion}
              </Text>
              
              <Text style={styles.cardDate}>
                {formatDate(caso.fecha)} a las {formatTime(caso.hora)}
              </Text>

              {caso.nombre_denunciante && (
                <Text style={styles.cardDenunciante}>
                  Denunciante: <Text style={{fontWeight: 'normal'}}>{caso.nombre_denunciante}</Text>
                </Text>
              )}

              <TouchableOpacity
                style={[styles.btnAction, { backgroundColor: '#2e5929' }]} // Botón verde según tu imagen
                onPress={() => router.push({
                  pathname: '/(policia)/(modals)/DescripcionReportes',
                  params: {
                    ...caso,
                    id_denuncia: caso.id_denuncia.toString(),
                    idPolicia: String(currentIdPolicia),
                  },
                })}
              >
                <Ionicons name="hand-left" size={16} color="#fff" style={{marginRight: 8}} />
                <Text style={styles.btnText}>Atender Caso</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        
        <View style={{height: 40}} /> 
      </ScrollView>
    </View>
  );
}

// ESTILOS LIMPIOS (SIN MODO OSCURO FORZADO)
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f4f4f4' // Fondo gris muy claro
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  scrollContainer: { 
    padding: 16, 
    paddingBottom: 40 
  },
  sectionTitle: { 
    fontSize: 18, 
    marginTop: 10, 
    marginBottom: 12, 
    color: '#333', // Texto oscuro (no blanco)
    fontWeight: 'bold' 
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  
  // TARJETAS BLANCAS
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    // Sombras suaves
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // Sin bordes extraños
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  cardTitle: { // Título de la tarjeta
    marginLeft: 8, 
    fontSize: 16, 
    color: '#333', 
    fontWeight: 'bold',
    flex: 1 
  },
  cardType: { // Subtítulo (Tipo - Calle)
    marginLeft: 8, 
    fontSize: 15, 
    color: '#333', 
    fontWeight: '700',
    flex: 1
  },
  cardText: { 
    marginLeft: 24, 
    marginBottom: 4, 
    fontSize: 14, 
    color: '#555' 
  },
  cardDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
    marginLeft: 4 // Pequeño ajuste visual
  },
  cardDate: { 
    fontSize: 13, 
    color: '#888', 
    fontStyle: 'italic', 
    marginBottom: 4 
  },
  cardDenunciante: {
    fontSize: 13,
    color: '#444',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  
  // BOTONES VERDES
  btnAction: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', // Centrar contenido
    marginTop: 5, 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    backgroundColor: '#2e5929', 
    borderRadius: 8, 
    alignSelf: 'flex-start', // No ocupar todo el ancho
    minWidth: 140
  },
  btnText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
});