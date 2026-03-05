import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// URL BASE ÚNICA PARA EVITAR ERRORES DE RUTA
const API_BASE = 'https://safecity-1.onrender.com';

interface Policia {
  id_policia: number;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo: string;
  modulo_epi: string;
}

export default function ListadoPolicias() {
  const [policias, setPolicias] = useState<Policia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // OBTENER LISTA DE POLICÍAS
  const fetchPolicias = async () => {
    try {
      // Llamada limpia: https://.../policias
      const response = await fetch(`${API_BASE}/policias`);
      
      // Validamos que el servidor responda OK (200) antes de intentar leer JSON
      if (!response.ok) {
        throw new Error(`Error en el servidor: ${response.status}`);
      }

      const data = await response.json();
      setPolicias(data);
    } catch (error) {
      console.error("Error al obtener policias:", error);
      Alert.alert('Error', 'No se pudo conectar con el servidor para obtener la lista.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPolicias();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPolicias();
  };

  // ELIMINAR POLICÍA
  const handleEliminar = (id: number, nombre: string) => {
    Alert.alert(
      "Eliminar Registro",
      `¿Estás seguro que deseas eliminar al oficial ${nombre}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              // Llamada limpia: https://.../policia/ID
              const response = await fetch(`${API_BASE}/policia/${id}`, {
                method: 'DELETE',
              });
              
              if (!response.ok) {
                throw new Error("Error al eliminar");
              }

              const result = await response.json();
              if (result.success) {
                Alert.alert("Éxito", "Policía eliminado correctamente");
                fetchPolicias(); 
              } else {
                Alert.alert("Error", result.message || "No se pudo eliminar");
              }
            } catch (error) {
              console.error("Error eliminando:", error);
              Alert.alert("Error", "Fallo de red al intentar eliminar");
            }
          }
        }
      ]
    );
  };

  const handleEditar = (policia: Policia) => {
    router.push({
      pathname: '/(admin)/editarPolicia',
      params: { 
        id: policia.id_policia.toString(),
        data: JSON.stringify(policia) 
      }
    });
  };

  const renderItem = ({ item }: { item: Policia }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
            <FontAwesome5 name="user-shield" size={27} color="#2e5929" />
        </View>
        <View style={styles.infoContainer}>
            <Text style={styles.nombre}>
                {item.nombres} {item.apellido_paterno} {item.apellido_materno}
            </Text>
            <Text style={styles.correo}>{item.correo}</Text>
            <View style={styles.epiBadge}>
                <Text style={styles.epiText}>{item.modulo_epi || 'Sin Asignar'}</Text>
            </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.editBtn]} 
          onPress={() => handleEditar(item)}
        >
          <MaterialIcons name="edit" size={25} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.deleteBtn]} 
          onPress={() => handleEliminar(item.id_policia, item.nombres)}
        >
          <MaterialIcons name="delete" size={25} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e5929" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={policias}
        keyExtractor={(item) => item.id_policia.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2e5929']} />
        }
        ListEmptyComponent={
            <Text style={styles.emptyText}>No hay policías registrados aún.</Text>
        }
      />
    </View>
  );
}

// ESTILOS (Sin cambios)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#666', fontSize: 16 },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContainer: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  correo: { fontSize: 14, color: '#666', marginBottom: 5 },
  epiBadge: {
    backgroundColor: '#2e5929',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  epiText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  actionsContainer: { flexDirection: 'row', gap: 10, marginLeft: 10 },
  actionBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  editBtn: { backgroundColor: '#FFD700' },
  deleteBtn: { backgroundColor: '#dc3545' }
});