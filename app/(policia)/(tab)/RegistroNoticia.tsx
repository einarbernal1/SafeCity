import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const NoticiaScreen = () => {
  const [titulo, setTitulo] = useState('');  
  const [descripcion, setDescripcion] = useState('');
  const [fechaPublicacion, setFechaPublicacion] = useState(new Date());
  const [horaPublicacion, setHoraPublicacion] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idUsuario, setIdUsuario] = useState<number | null>(null);
  const [zona, setZona] = useState('');
  const [showZonas, setShowZonas] = useState(false);

  const opcionesZonas = [
    { label: 'Zona Norte', value: 'Zona Norte' },
    { label: 'Zona Sur', value: 'Zona Sur' },
    { label: 'Zona Central', value: 'Zona Central' },
    { label: 'Zona Este', value: 'Zona Este' },
    { label: 'Zona Oeste', value: 'Zona Oeste' },
  ];

  const router = useRouter();

  // URL DE PRODUCCIÓN (HEROKU)
  const API_BASE = 'https://safecity-1.onrender.com';

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          const id = userData.id_policia || null;
          if (id) setIdUsuario(id);
        }
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
      }
    };
    loadUserData();
  }, []);

  // FUNCIONES DE FORMATEO PARA MYSQL (FORMATO 24H)
  const formatTimeForMySQL = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}:00`; // Ejemplo: 18:42:00
  };

  const formatDateForMySQL = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // Ejemplo: 2025-12-19
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setFechaPublicacion(selectedDate);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) setHoraPublicacion(selectedTime);
  };

  const handleSubmit = async () => {
    if (!idUsuario) {
      Alert.alert('Error', 'No se encontró el usuario policía.');
      return;
    }
    if (!titulo || !descripcion || !zona) {
      Alert.alert('Error', 'Todos los campos marcados con * son obligatorios');
      return;
    }

    setLoading(true);

    const noticiaData = {
      titulo,
      descripcion,
      fecha: formatDateForMySQL(fechaPublicacion),
      hora: formatTimeForMySQL(horaPublicacion),
      imagen: null, // O la URL de Cloudinary si ya la tienes
      idPolicia: idUsuario,
      zona: zona
    };

    try {
      const response = await fetch(`${API_BASE}/noticias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticiaData),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/(policia)/(modals)/NoticiaExito');
      } else {
        Alert.alert('Error', data.message || 'Error al registrar la noticia');
      }
    } catch (error) {
      console.error('Error al enviar noticia:', error);
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nueva Noticia</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenedor}>
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Descripción *</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Ingrese una descripción"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
          />

          <Text style={styles.seccionTitulo}>Título Noticia *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingrese el título"
            value={titulo}
            onChangeText={setTitulo}
          />

          <Text style={styles.seccionTitulo}>Zona de la Ciudad *</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowZonas(!showZonas)}>
            <FontAwesome name="map-marker" size={20} color="#2e5929" />
            <Text style={styles.dateText}>{zona || "Seleccione una zona"}</Text>
          </TouchableOpacity>

          {showZonas && (
            <View style={styles.dropdownOptions}>
              {opcionesZonas.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.optionButton}
                  onPress={() => {
                    setZona(item.value);
                    setShowZonas(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.seccionTitulo}>Fecha de Publicación *</Text>
          <TouchableOpacity style={styles.timePickerButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.textoTiempo}>{formatDateForMySQL(fechaPublicacion)}</Text>
            <FontAwesome name="calendar" size={16} color="#666" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={fechaPublicacion}
              mode="date"
              onChange={handleDateChange}
            />
          )}

          <Text style={styles.seccionTitulo}>Hora del incidente *</Text>
          <TouchableOpacity style={styles.timePickerButton} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.textoTiempo}>{formatTimeForMySQL(horaPublicacion).substring(0,5)}</Text>
            <FontAwesome name="clock-o" size={16} color="#666" />
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={horaPublicacion}
              mode="time"
              is24Hour={true}
              onChange={handleTimeChange}
            />
          )}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitButtonText}>Publicar Noticia</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#2e5929', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  contenedor: { padding: 20 },
  seccion: { marginBottom: 15 },
  seccionTitulo: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  input: { width: '100%', height: 50, backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 15 },
  multilineInput: { height: 100, textAlignVertical: 'top', paddingTop: 10 },
  timePickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 50, backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 15 },
  textoTiempo: { fontSize: 16, color: '#333' },
  submitButton: { width: '100%', height: 55, backgroundColor: '#FFD600', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginTop: 10, elevation: 2 },
  submitButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', gap: 10, marginBottom: 15 },
  dateText: { fontSize: 16, color: '#333' },
  dropdownOptions: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 15, elevation: 3 },
  optionButton: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  optionText: { fontSize: 15, color: '#333' }
});

export default NoticiaScreen;