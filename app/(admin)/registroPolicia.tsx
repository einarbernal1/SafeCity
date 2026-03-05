import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Modal, SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';

// --- CAMBIA ESTO POR TU IP ---
const HEROKU_BASE_URL = 'https://safecity-1.onrender.com'; // Sin la barra al final
const API_URL = `${HEROKU_BASE_URL}/registro-policia`;

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

const RegistroPolicia = () => {
  const router = useRouter();
  
  // Estados del Formulario
  const [nombres, setNombres] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [moduloEpi, setModuloEpi] = useState('');
  const [idAdmin, setIdAdmin] = useState<number | null>(null);

  // Estados de UI
  const [showModulos, setShowModulos] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados de Modales
  const [modalErrorVisible, setModalErrorVisible] = useState(false);
  const [modalSuccessVisible, setModalSuccessVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Obtener el ID del administrador al cargar
  useEffect(() => {
    const getAdminId = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.id_admin) {
            setIdAdmin(user.id_admin);
          }
        }
      } catch (error) {
        console.error('Error al obtener ID de admin:', error);
      }
    };
    getAdminId();
  }, []);

  const handleRegistro = async () => {
    // 1. Validaciones
    if (!nombres || !apellidoPaterno || !apellidoMaterno || !correo || !contrasena || !confirmarContrasena || !moduloEpi) {
      setErrorMessage('Todos los campos son obligatorios');
      setModalErrorVisible(true);
      return;
    }

    if (contrasena !== confirmarContrasena) {
      setErrorMessage('Las contraseñas no coinciden');
      setModalErrorVisible(true);
      return;
    }

    if (!idAdmin) {
      setErrorMessage('Error de sesión: No se identificó al administrador');
      setModalErrorVisible(true);
      return;
    }

    // 2. Enviar Datos
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombres,
          apellido_paterno: apellidoPaterno,
          apellido_materno: apellidoMaterno,
          correo,
          contraseña: contrasena,
          modulo_epi: moduloEpi,
          id_admin: idAdmin
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('El oficial ha sido registrado exitosamente.');
        setModalSuccessVisible(true);
        // Limpiar formulario
        setNombres('');
        setApellidoPaterno('');
        setApellidoMaterno('');
        setCorreo('');
        setContrasena('');
        setConfirmarContrasena('');
        setModuloEpi('');
      } else {
        setErrorMessage(data.message || 'Error al registrar');
        setModalErrorVisible(true);
      }
    } catch (error) {
      setErrorMessage('Error de conexión con el servidor');
      setModalErrorVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setModalSuccessVisible(false);
    router.replace('/(admin)'); // Volver al listado
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true }} />
      <StatusBar barStyle="dark-content" backgroundColor="#f4f6f4" />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formCard}>
          <Text style={styles.title}>Nuevo Policía</Text>
          <Text style={styles.subtitle}>Complete la información del personal</Text>

          {/* Campos de Texto */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombres *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Juan Carlos"
              value={nombres}
              onChangeText={setNombres}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Apellido Paterno *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Pérez"
                value={apellidoPaterno}
                onChangeText={setApellidoPaterno}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Apellido Materno *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Gómez"
                value={apellidoMaterno}
                onChangeText={setApellidoMaterno}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: oficial12@policia.bo"
              keyboardType="email-address"
              autoCapitalize="none"
              value={correo}
              onChangeText={setCorreo}
            />
          </View>

          {/* Selector EPI */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Módulo EPI *</Text>
            <TouchableOpacity 
              style={styles.dropdownButton} 
              onPress={() => setShowModulos(!showModulos)}
            >
              <Text style={moduloEpi ? styles.dropdownButtonTextSelected : styles.dropdownButtonText}>
                {moduloEpi ? modulosEPI.find(m => m.value === moduloEpi)?.label : "Seleccione una unidad"}
              </Text>
              <FontAwesome name={showModulos ? "chevron-up" : "chevron-down"} size={14} color="#666" />
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
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry
              value={contrasena}
              onChangeText={setContrasena}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar Contraseña *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry
              value={confirmarContrasena}
              onChangeText={setConfirmarContrasena}
            />
          </View>

          <TouchableOpacity 
            style={styles.registerButton}
            onPress={handleRegistro}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Registrar Policía</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- MODAL DE ÉXITO (Estilo Nuevo) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalSuccessVisible}
        onRequestClose={closeSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.iconCircle, { backgroundColor: '#2e5929' }]}>
              <FontAwesome name="check" size={40} color="white" />
            </View>
            <Text style={[styles.modalTitle, { color: '#2e5929' }]}>¡Registro Exitoso!</Text>
            <Text style={styles.modalText}>{successMessage}</Text>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: '#2e5929' }]} 
              onPress={closeSuccessModal}
            >
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- MODAL DE ERROR (Estilo Nuevo) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalErrorVisible}
        onRequestClose={() => setModalErrorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.iconCircle, { backgroundColor: '#d9534f' }]}>
              <FontAwesome name="exclamation" size={40} color="white" />
            </View>
            <Text style={[styles.modalTitle, { color: '#d9534f' }]}>Ocurrió un Error</Text>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: '#d9534f' }]} 
              onPress={() => setModalErrorVisible(false)}
            >
              <Text style={styles.modalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6f4',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e5929',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
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
    marginTop: 5,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  optionButton: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 15,
    color: '#333',
  },
  registerButton: {
    backgroundColor: '#2e5929',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // --- ESTILOS DE LOS NUEVOS MODALES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Fondo oscuro semitransparente
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
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButton: {
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
  },
});

export default RegistroPolicia;