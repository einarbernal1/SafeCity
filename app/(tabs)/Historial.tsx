import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HamburgerMenu from '../auth/MenuHamburguesa';

interface Denuncia {
  id_denuncia: number;
  descripcion: string;
  modulo_epi: string;
  hora: string;
  fecha: string;
  tipo: string;
  calle_avenida: string;
  evidencia: string | null;
  estado: string;
  id_ciudadano: number;
  fue_modificada: number;
  mostrarModificar?: boolean;
  minutosRestantes?: number;
  fechaRegistroStr?: string;
}

const HistorialScreen = () => {
  const [atendidos, setAtendidos] = useState<Denuncia[]>([]);
  const [pendientes, setPendientes] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [idCiudadano, setIdCiudadano] = useState<number | null>(null);
  const router = useRouter();

  const HEROKU_BASE_URL = 'https://safecity-1.onrender.com';
  const API_URL_ATENDIDAS = `${HEROKU_BASE_URL}/denunciasUsuario/atendidas`;
  const API_URL_PENDIENTES = `${HEROKU_BASE_URL}/denunciasUsuario/pendientes`;

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setIdCiudadano(userData.id_ciudadano);
          fetchDenuncias(userData.id_ciudadano);
        }
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  // Intervalo para actualizar el contador de tiempo cada minuto
  useEffect(() => {
    if (!idCiudadano) return;

    const interval = setInterval(() => {
      fetchDenuncias(idCiudadano);
    }, 60000);

    return () => clearInterval(interval);
  }, [idCiudadano]);

  const fetchDenuncias = async (userId: number) => {
    if (!refreshing) setLoading(true);

    try {
      const [respAtendidas, respPendientes] = await Promise.all([
        fetch(`${API_URL_ATENDIDAS}/${userId}`),
        fetch(`${API_URL_PENDIENTES}/${userId}`)
      ]);

      const atendidosData = respAtendidas.ok ? await respAtendidas.json() : [];
      const pendientesData = respPendientes.ok ? await respPendientes.json() : [];

      const now = new Date();

      const pendientesProcesadas = pendientesData.map((denuncia: Denuncia) => {
        try {
          // 1. Limpiar la fecha: Tomar solo YYYY-MM-DD
          const fechaSolo = denuncia.fecha.split('T')[0];
          
          // 2. Crear objeto Date Local (sin la 'Z' al final para evitar desfase UTC)
          const fechaRegistro = new Date(`${fechaSolo}T${denuncia.hora}`);

          if (isNaN(fechaRegistro.getTime())) {
            return { ...denuncia, mostrarModificar: false, minutosRestantes: 0 };
          }

          // 3. Calcular diferencia exacta
          const diffMs = now.getTime() - fechaRegistro.getTime();
          const diffMinutes = Math.floor(diffMs / 60000);
          
          const limite = 10;
          const minutesLeft = limite - diffMinutes;

          // 4. Condición crítica: 
          // - Que no hayan pasado 10 minutos (diffMinutes entre 0 y 9)
          // - Que no haya sido modificada (fue_modificada sea exactamente 0)
          const puedeModificar = diffMinutes >= 0 && diffMinutes < limite && Number(denuncia.fue_modificada) === 0;

          return {
            ...denuncia,
            mostrarModificar: puedeModificar,
            minutosRestantes: puedeModificar ? minutesLeft : 0,
            fechaRegistroStr: fechaRegistro.toLocaleTimeString()
          };
        } catch (e) {
          return { ...denuncia, mostrarModificar: false };
        }
      });

      setAtendidos(Array.isArray(atendidosData) ? atendidosData : []);
      setPendientes(pendientesProcesadas);
    } catch (error) {
      console.error('Error al obtener denuncias:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (idCiudadano) {
      setRefreshing(true);
      fetchDenuncias(idCiudadano);
    }
  };

  const handleModificar = (denunciaId: number) => {
    router.push({
      pathname: '/auth/EditarDenuncia',
      params: { idDenuncia: denunciaId }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Componentes de Item (Atendida y Pendiente)
  const DenunciaAtendidaItem = ({ denuncia }: { denuncia: Denuncia }) => (
    <View style={styles.denunciaContainer}>
      <View style={styles.iconContainer}><FontAwesome name="check" size={32} color="black" /></View>
      <View style={styles.detailsContainer}>
        <Text style={styles.ubicacion}>{denuncia.calle_avenida}</Text>
        <Text style={styles.tipo}>{denuncia.tipo.charAt(0).toUpperCase() + denuncia.tipo.slice(1).toLowerCase()}</Text>
        <Text style={styles.fecha}>{formatDate(denuncia.fecha)}</Text>
      </View>
    </View>
  );

  const DenciaPendienteItem = ({ denuncia }: { denuncia: Denuncia }) => (
    <View style={styles.denunciaContainer}>
      <View style={styles.iconContainer}><FontAwesome name="hourglass" size={28} color="black" /></View>
      <View style={styles.detailsContainer}>
        <Text style={styles.ubicacion}>{denuncia.calle_avenida}</Text>
        <Text style={styles.tipo}>{denuncia.tipo.charAt(0).toUpperCase() + denuncia.tipo.slice(1).toLowerCase()}</Text>
        <Text style={styles.fecha}>{formatDate(denuncia.fecha)}</Text>
        
        {Number(denuncia.fue_modificada) === 1 ? (
          <View style={styles.modificarContainer}>
            <Text style={styles.denunciaModificada}>✓ Denuncia modificada</Text>
          </View>
        ) : denuncia.mostrarModificar ? (
          <View style={styles.modificarContainer}>
            <Text style={styles.timeRemaining}>Tiempo para modificar: {denuncia.minutosRestantes} min</Text>
          </View>
        ) : null}
      </View>
      
      {denuncia.mostrarModificar && (
        <TouchableOpacity style={styles.modificarButton} onPress={() => handleModificar(denuncia.id_denuncia)}>
          <Text style={styles.modificarButtonText}>Modificar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
        headerTitle: "Mis Reportes", 
        headerStyle: { backgroundColor: '#2e5929' }, 
        headerTintColor: '#fff',
        headerLeft: () => <HamburgerMenu /> 
      }} />
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2e5929" /></View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2e5929']} />}
        >
          <Text style={styles.sectionTitle}>Atendidos</Text>
          {atendidos.length > 0 ? atendidos.map(d => <DenunciaAtendidaItem key={d.id_denuncia} denuncia={d} />) : <Text style={styles.emptyMessage}>No hay denuncias atendidas</Text>}

          <Text style={styles.sectionTitle}>Pendientes</Text>
          {pendientes.length > 0 ? pendientes.map(d => <DenciaPendienteItem key={d.id_denuncia} denuncia={d} />) : <Text style={styles.emptyMessage}>No hay denuncias pendientes</Text>}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, padding: 16 },
  sectionTitle: { fontSize: 32, fontWeight: 'bold', marginTop: 20, marginBottom: 20, color: '#000' },
  denunciaContainer: { flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', marginBottom: 16, alignItems: 'center', paddingVertical: 10 },
  iconContainer: { width: 70, height: 70, backgroundColor: '#f9f5e8', justifyContent: 'center', alignItems: 'center', borderWidth: 0.4, borderRadius: 3, marginLeft: 15 },
  detailsContainer: { flex: 1, padding: 16 },
  ubicacion: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  tipo: { fontSize: 17, color: '#b98f45', marginBottom: 4 },
  fecha: { fontSize: 17, color: '#b98f45' },
  modificarContainer: { marginTop: 8 },
  timeRemaining: { fontSize: 14, color: '#E53935', fontStyle: 'italic', fontWeight: 'bold' },
  modificarButton: { backgroundColor: '#2e5929', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, marginRight: 16 },
  modificarButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  emptyMessage: { textAlign: 'center', fontSize: 16, color: '#666', marginBottom: 20 },
  denunciaModificada: { fontSize: 14, color: '#4CAF50', fontStyle: 'italic', fontWeight: 'bold' },
});

export default HistorialScreen;