import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
// Importaciones para Notificaciones
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

const LoginScreen = () => {
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Configuración del servidor
 const HEROKU_BASE_URL = 'https://safecity-1.onrender.com'; // Sin la barra al final
const API_URL = `${HEROKU_BASE_URL}/login`;

  // Función para registrar notificaciones Push
  async function registerForPushNotificationsAsync() {
    let token;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Permiso de notificaciones denegado');
        return;
      }
      
      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log("Token Obtenido:", token);
      } catch (e) {
        console.log("Error obteniendo token:", e);
      }
    } else {
      console.log('Debes usar un dispositivo físico para Push Notifications');
    }

    return token;
  }

  const handleLogin = async () => {
    if (!correo || !contraseña) {
      setError('Correo y contraseña son requeridos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Intentamos obtener el token antes de loguear
      const pushToken = await registerForPushNotificationsAsync();

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 2. Enviamos el token junto con las credenciales
        body: JSON.stringify({ correo, contraseña, pushToken }),
      });

      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem('userData', JSON.stringify(data.usuario));
        
        if (data.usuario.id_ciudadano) {
          router.replace({
            pathname: '/(tabs)',
            params: {
              idCiudadano: data.usuario.id_ciudadano,
              nombres: data.usuario.nombres,
              apellidos: `${data.usuario.apellido_paterno} ${data.usuario.apellido_materno}`
            }
          });
        } else if (data.usuario.id_policia) {
          router.replace({
            pathname: '/(policia)/(tab)/reportes',
            params: {
              idPolicia: data.usuario.id_policia,
              nombres: data.usuario.nombres,
              apellidos: `${data.usuario.apellido_paterno} ${data.usuario.apellido_materno}`,
              moduloEpi: data.usuario.modulo_epi
            }
          });
        } else if (data.usuario.id_admin) {
          router.replace({
            pathname: '/(admin)',
            params: {
              idAdmin: data.usuario.id_admin,
              nombres: data.usuario.nombres || 'Administrador',
              correo: data.usuario.correo
            }
          });
        }
      } else {
        setError(data.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Image 
        source={require('@/assets/images/logo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Iniciar Sesión</Text>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.inputContainer}>
        <FontAwesome name="user" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Correo"
          placeholderTextColor="#999"
          value={correo}
          onChangeText={setCorreo}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name="lock" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          value={contraseña}
          onChangeText={setContraseña}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity 
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <FontAwesome 
            name={showPassword ? "eye" : "eye-slash"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.loginButton}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginButtonText}>Ingresar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => router.push('/auth/R')}
      >
        <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1D5C1D',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    color: '#fff',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;