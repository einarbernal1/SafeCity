import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// URL del servidor (igual que en los otros archivos)
const HEROKU_BASE_URL = 'https://safecity-1.onrender.com'; 
const API_URL = `${HEROKU_BASE_URL}`;

interface Denuncia {
  id_denuncia: number;
  descripcion: string;
  hora: string;
  fecha: string;
  tipo: string;
  calle_avenida: string;
  estado: string;
  nombre_denunciante?: string;
}

export default function ReportesScreen() {
  const router = useRouter();
  const [denunciasAtendidas, setDenunciasAtendidas] = useState<Denuncia[]>([]);
  const [casosPendientes, setCasosPendientes] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReportes = async () => {
    try {
      // 1. Obtener Pendientes
      const resPendientes = await fetch(`${API_URL}/casosPendientes`);
      // Nota: Si el endpoint falla o devuelve 404/500, manejamos el error suavemente
      const dataPendientes = resPendientes.ok ? await resPendientes.json() : [];
      if (Array.isArray(dataPendientes)) setCasosPendientes(dataPendientes);

      // 2. Obtener Atendidas
      const resAtendidas = await fetch(`${API_URL}/denunciasAtendidas`);
      const dataAtendidas = resAtendidas.ok ? await resAtendidas.json() : [];
      if (Array.isArray(dataAtendidas)) setDenunciasAtendidas(dataAtendidas);

    } catch (error) {
      console.error("Error al cargar reportes:", error);
      // No mostramos alerta intrusiva en cada recarga, solo log
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAtenderCaso = async (idDenuncia: number) => {
    try {
      const response = await fetch(`${API_URL}/atenderDenuncia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idDenuncia }),
      });

      if (!response.ok) throw new Error('Error al actualizar');

      Alert.alert('Éxito', 'Caso marcado como atendido');
      onRefresh(); // Recargar la lista
    } catch (error) {
      Alert.alert('Error', 'No se pudo atender el caso');
    }
  };

  const handleVerDescripcion = (idDenuncia: number) => {
    // Navegar a la pantalla de detalles que arreglamos antes
    // Asegúrate que la ruta coincida con la ubicación de tu archivo DescripcionRAtendidos.tsx
    router.push({
      pathname: '/DescripcionRAtendidos', // Ajusta si está en otra carpeta, ej: '/(modals)/DescripcionRAtendidos'
      params: { idDenuncia }
    });
  };

  useEffect(() => {
    fetchReportes();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReportes();
  };

  // Formatear Fecha y Hora
  const formatDateTime = (fecha: string, hora: string) => {
    try {
      const dateObj = new Date(fecha);
      const fechaStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const [h, m] = hora.split(':');
      return `${fechaStr} a las ${h}:${m}`;
    } catch (e) {
      return `${fecha} ${hora}`;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2e5929" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Reportes</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2e5929']} />
        }
      >
        {/* SECCIÓN ATENDIDOS */}
        {denunciasAtendidas.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Atendidos ({denunciasAtendidas.length})</Text>
            {denunciasAtendidas.map((item) => (
              <View key={item.id_denuncia} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="checkmark-circle" size={24} color="#2e5929" />
                  <Text style={styles.cardType}>{item.tipo.toUpperCase()} - {item.calle_avenida}</Text>
                </View>
                
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {item.descripcion}
                </Text>
                
                <Text style={styles.cardDate}>
                  {formatDateTime(item.fecha, item.hora)}
                </Text>
                
                <Text style={styles.cardDenunciante}>
                  Denunciante: <Text style={{fontWeight: 'normal'}}>{item.nombre_denunciante || 'Anónimo'}</Text>
                </Text>

                <TouchableOpacity 
                  style={styles.btnAction}
                  onPress={() => handleVerDescripcion(item.id_denuncia)}
                >
                  <Ionicons name="document-text" size={18} color="#fff" style={{marginRight: 8}} />
                  <Text style={styles.btnText}>Descripción</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* SECCIÓN PENDIENTES */}
        <Text style={styles.sectionTitle}>Pendientes ({casosPendientes.length})</Text>
        
        {casosPendientes.length === 0 ? (
          <Text style={styles.emptyText}>No hay casos pendientes.</Text>
        ) : (
          casosPendientes.map((item) => (
            <View key={item.id_denuncia} style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="alert-circle" size={24} color="#D32F2F" />
                <Text style={styles.cardType}>{item.tipo.toUpperCase()} - {item.calle_avenida}</Text>
              </View>
              
              <Text style={styles.cardDescription} numberOfLines={2}>
                {item.descripcion}
              </Text>
              
              <Text style={styles.cardDate}>
                {formatDateTime(item.fecha, item.hora)}
              </Text>
              
              <Text style={styles.cardDenunciante}>
                Denunciante: <Text style={{fontWeight: 'normal'}}>{item.nombre_denunciante || 'Anónimo'}</Text>
              </Text>

              <TouchableOpacity 
                style={[styles.btnAction, styles.btnPending]}
                onPress={() => handleAtenderCaso(item.id_denuncia)}
              >
                <Ionicons name="hand-left" size={18} color="#fff" style={{marginRight: 8}} />
                <Text style={styles.btnText}>Atender Caso</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{height: 40}} /> 
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f4', // Fondo gris claro para que resalten las tarjetas
  },
  headerContainer: {
    backgroundColor: '#2e5929',
    padding: 16,
    paddingTop: 40, // Espacio para status bar
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 10,
    marginTop: 10,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  
  // ESTILOS DE LA TARJETA (Clean Design)
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    // Sombra suave estilo iOS/Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#2e5929', // Borde lateral verde elegante
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
  cardDate: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  cardDenunciante: {
    fontSize: 13,
    color: '#444',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  
  // BOTONES
  btnAction: {
    backgroundColor: '#2e5929', // Verde oficial
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start', // El botón no ocupa todo el ancho
    minWidth: 140,
  },
  btnPending: {
    backgroundColor: '#2e5929', // Mismo verde para uniformidad, o usa #D32F2F para rojo si prefieres
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});