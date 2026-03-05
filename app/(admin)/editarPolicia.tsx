import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';

// --- IMPORTANTE: CAMBIA ESTO POR TU IP ---
const HEROKU_BASE_URL = 'https://safecity-1.onrender.com'; // Sin la barra al final


interface ModuloEPI {
  label: string;
  value: string;
}

const modulosEPI: ModuloEPI[] = [
  { label: 'EPI N°5 Alalay', value: 'EPI_N5_Alalay' },
  { label: 'EPI N°1 Coña Coña', value: 'EPI_N1_Coña Coña' },
  { label: 'EPI N°3 Jaihuayco', value: 'EPI_N3_Jaihuayco' },
  { label: 'EPI N°7 Sur', value: 'EPI_N7_Sur' },
  { label: 'EPI N°6 Central', value: 'EPI_N6_Central' },
];

export default function EditarPolicia() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [idPolicia, setIdPolicia] = useState<number | null>(null);
  const [nombres, setNombres] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [correo, setCorreo] = useState('');
  const [moduloEpi, setModuloEpi] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [showModulos, setShowModulos] = useState(false);
  const [modalSuccessVisible, setModalSuccessVisible] = useState(false);

  useEffect(() => {
    if (params.data) {
      try {
        const policiaData = JSON.parse(params.data as string);
        setIdPolicia(policiaData.id_policia);
        setNombres(policiaData.nombres || '');
        setApellidoPaterno(policiaData.apellido_paterno || '');
        setApellidoMaterno(policiaData.apellido_materno || '');
        setCorreo(policiaData.correo || '');
        setModuloEpi(policiaData.modulo_epi || '');
      } catch (e) {
        Alert.alert("Error", "No se pudieron cargar los datos");
        router.back();
      }
    }
  }, [params.data]);

  const handleUpdate = async () => {
    if (!nombres || !apellidoPaterno || !apellidoMaterno || !correo || !moduloEpi) {
      Alert.alert("Error", "Todos los campos (menos contraseña) son obligatorios");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${HEROKU_BASE_URL}/policia/${idPolicia}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres,
          apellido_paterno: apellidoPaterno,
          apellido_materno: apellidoMaterno,
          correo,
          modulo_epi: moduloEpi,
          nueva_contrasena: nuevaContrasena 
        }),
      });

      const result = await response.json();

      if (result.success) {
        setModalSuccessVisible(true);
      } else {
        Alert.alert("Error", result.message || "No se pudo actualizar");
      }
    } catch (error) {
      Alert.alert("Error de Conexión", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setModalSuccessVisible(false);
    router.replace('/(admin)'); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a3b1a" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Información</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <View style={styles.formContainer}>
          <Text style={styles.label}>Nombres</Text>
          <TextInput
            style={styles.input}
            value={nombres}
            onChangeText={setNombres}
            placeholder="Ej: Juan Carlos"
          />

          <Text style={styles.label}>Apellido Paterno</Text>
          <TextInput
            style={styles.input}
            value={apellidoPaterno}
            onChangeText={setApellidoPaterno}
            placeholder="Ej: Pérez"
          />

          <Text style={styles.label}>Apellido Materno</Text>
          <TextInput
            style={styles.input}
            value={apellidoMaterno}
            onChangeText={setApellidoMaterno}
            placeholder="Ej: Mamani"
          />

          <Text style={styles.label}>Correo Electrónico</Text>
          <TextInput
            style={styles.input}
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Módulo EPI Asignado</Text>
          <TouchableOpacity 
            style={styles.dropdownButton} 
            onPress={() => setShowModulos(!showModulos)}
          >
            <Text style={moduloEpi ? styles.dropdownButtonTextSelected : styles.dropdownButtonText}>
              {moduloEpi ? (modulosEPI.find(m => m.value === moduloEpi)?.label || moduloEpi) : "Seleccionar EPI"}
            </Text>
            <FontAwesome name={showModulos ? "chevron-up" : "chevron-down"} size={16} color="#666" />
          </TouchableOpacity>

          {showModulos && (
            <View style={styles.dropdownOptions}>
              {modulosEPI.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.optionButton}
                  onPress={() => {
                    setModuloEpi(item.value);
                    setShowModulos(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Nueva Contraseña (Opcional)</Text>
          <TextInput
            style={styles.input}
            value={nuevaContrasena}
            onChangeText={setNuevaContrasena}
            placeholder="Dejar vacío para no cambiar"
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalSuccessVisible}
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconCircle}>
              <FontAwesome name="check" size={40} color="white" />
            </View>
            <Text style={styles.modalTitle}>¡Actualización Exitosa!</Text>
            <Text style={styles.modalText}>
              Datos modificados correctamente.
            </Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={handleSuccessClose}
            >
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6f4',
  },
  header: {
    backgroundColor: '#1a3b1a',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: Platform.OS === 'android' ? 25 : 0,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 50,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e5929',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#999',
  },
  dropdownButtonTextSelected: {
    fontSize: 16,
    color: '#333',
  },
  dropdownOptions: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  optionButton: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonText: {
    color: '#1a3b1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '80%',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconCircle: {
    backgroundColor: '#2e5929',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2e5929',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#2e5929',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});