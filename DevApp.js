import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import AuthStack from './navigation/AuthStack';
import AppStack from './navigation/AppStack';
import { UserProvider, useUser } from './context/UserContext';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './hooks/useAuth';
import UpdateAppModal from './components/UpdateAppModal';
import API_BASE_URL, { DOMAIN_URL } from './services/config';
import { Linking, Platform } from 'react-native';
import * as Font from 'expo-font';
import { CommonActions } from '@react-navigation/native';

const DevApp = () => {
  const { userToken } = useUser();
  const navigationRef = useNavigationContainerRef();
  const openedNotificationRef = useRef(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [action, setAction] = useState('');
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const _opened = openResult => {
    const data = openResult.notification.additionalData;
    if (data.type === "NEW_MESSAGE") {
      const routes = [
        { name: 'HomeTabNavigator' },
        {
          name: 'NotificationMessage', params: {
            userDetails: {
              email: data.email,
              id: data.id,
              name: data.name,
              phone: data.phone,
              pic: data.pic,
              firebaseId: data.firebaseId,
              timestamp: {
                seconds: parseInt(data.timestampSeconds),
                nanoseconds: parseInt(data.timestampNanoseconds)
              },
            }
          }
        },
      ]
      navigationRef.current.dispatch(
        CommonActions.reset({
          routes: routes,
          index: routes.length - 1,
        })
      )
    }
    if (data.type === "NEW_POST") {
      const routes = [
        { name: 'HomeTabNavigator' },
        {
          name: 'SingleScreenAd', params: {
            adIds: data.adId
          }
        },
      ]
      navigationRef.current.dispatch(
        CommonActions.reset({
          routes: routes,
          index: routes.length - 1,
        })
      )
    }
  }

  const onReady = () => {
    setTimeout(() => {
      if (!openedNotificationRef.current) {
        navigationRef.current.dispatch(
          CommonActions.reset({
            routes: [{ name: 'HomeTabNavigator' }, { name: 'Onboarding' }],
            index: 1,
          })
        )
      }
    }, 0)
  };

  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        await Font.loadAsync({
          'open-sans-regular': require('./assets/fonts/OpenSans-Regular.ttf'),
          'open-sans-light': require('./assets/fonts/OpenSans-Light.ttf'),
          'open-sans-bold': require('./assets/fonts/OpenSans-Bold.ttf'),
        });
        setFontsLoaded(true);

      } catch (e) {
        console.warn(e);
      }
    }
    loadResourcesAndDataAsync();
  }, []);

  // fetchAppUpdateStatus
  useEffect(() => {
    async function fetchAppUpdateStatus() {
      try {
        const response = await axios.get(`${API_BASE_URL}/user/getAppUpdateStatus`);
        const { blockApp, action } = response.data;
        if (blockApp) {
          setShowUpdateModal(true);
          setAction(action)
        }
      } catch (error) {
        console.error('Error fetching app update status:', error);
      }
    };
    if (Platform.OS !== 'web') {
      fetchAppUpdateStatus();
    }
  }, []);

  const linking = {
    prefixes: [DOMAIN_URL, 'RentNearBy://'],
    config: {
      screens: {
        HomeTabNavigator: 'ads/:adIdm',
      },
    },
  };

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
      <NavigationContainer
        ref={navigationRef}
        onReady={onReady}
        linking={linking}
        initialRouteName="LoadingScreen"
      >
        <Toast />
        {userToken ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
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
      <AuthProvider>
        <DevApp />
      </AuthProvider>
    </UserProvider>
  );
};

