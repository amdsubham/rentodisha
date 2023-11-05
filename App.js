import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './navigation/AuthStack';
import AppStack from './navigation/AppStack';
import { UserProvider, useUser } from './context/UserContext';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './hooks/useAuth';
import UpdateAppModal from './components/UpdateAppModal'; // Import the modal component
import API_BASE_URL from './services/config';
import { Linking } from 'react-native';

import * as Font from 'expo-font';

const App = () => {
  const { userToken } = useUser();
  const [showUpdateModal, setShowUpdateModal] = useState(false); // State for modal visibility
  const [action, setAction] = useState('');
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      'open-sans-regular': require('./assets/fonts/OpenSans-Regular.ttf'),
      'open-sans-light': require('./assets/fonts/OpenSans-Light.ttf'),
      'open-sans-bold': require('./assets/fonts/OpenSans-Bold.ttf'),
      'argon': require('./assets/fonts/argon.ttf'),
    });
    setFontsLoaded(true)
  }, []);
  useEffect(() => {
    const fetchAppUpdateStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/user/getAppUpdateStatus`); // Replace with your API endpoint
        const { blockApp, action } = response.data;
        if (blockApp) {
          setShowUpdateModal(true);
          setAction(action)
        }
      } catch (error) {
        console.error('Error fetching app update status:', error);
      }
    };
    fetchAppUpdateStatus();
  }, []);

  const handleAppUpdate = () => {
    Linking.canOpenURL(action)
      .then((supported) => {
        if (supported) {
          Linking.openURL(action);
        } else {
          console.error('Cannot open Play Store link');
        }
      })
      .catch((error) => {
        console.error('Error opening Play Store link:', error);
      });
  };

  return (
    <>
      <Toast />
      <AuthProvider>
        <NavigationContainer>
          {userToken ? <AppStack /> : <AuthStack />}
        </NavigationContainer>
      </AuthProvider>
      <UpdateAppModal
        isVisible={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onAppUpdate={handleAppUpdate}
      />
    </>
  );
};

export default () => {
  return (
    <UserProvider>
      <App />
    </UserProvider>
  );
};
