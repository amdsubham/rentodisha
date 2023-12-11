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
import { Alert, Linking, Platform } from 'react-native';
import * as Font from 'expo-font';
import Constants from "expo-constants";
import { OneSignal, LogLevel } from 'react-native-onesignal';
import { CommonActions } from '@react-navigation/native';
import * as Analytics from 'expo-firebase-analytics';
import { identifyDevice } from 'vexo-analytics';
import * as Network from 'expo-network';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

OneSignal.Debug.setLogLevel(LogLevel.Verbose)
OneSignal.initialize(Constants.expoConfig.extra.oneSignalAppId);


const App = () => {
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
              // timestamp: {
              //   seconds: parseInt(data.timestampSeconds),
              //   nanoseconds: parseInt(data.timestampNanoseconds)
              // },
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

  useEffect(() => {

    async function checkNetwork() {
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        Alert.alert(
          'No Internet Connection',
          'Please check your internet settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Refresh', onPress: () => {
                navigationRef.current.dispatch(
                  CommonActions.reset({
                    routes: [{ name: 'HomeTabNavigator' }, { name: 'Onboarding' }],
                    index: 1,
                  })
                )
              }
            },
          ],
          { cancelable: false }
        );
      }
      else {
        registerForPushNotificationsAsync()
      }
    }

    checkNetwork();
  }, []);



  useEffect(() => {
    if (userToken) {
      identifyDevice(userToken.toString())
      Analytics.setUserId(userToken.toString());
    }
  }, [userToken]);

  useEffect(() => {
    return () => {
      OneSignal.Notifications.removeEventListener('click', _opened);
    }
  }, []);

  const onReady = () => {
    OneSignal.Notifications.addEventListener('click', _opened);
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

  const refreshOneSignalStatus = async () => {
    // Code to notify OneSignal about the permission update
    // This might depend on the OneSignal SDK's available methods
    // For example, you might need to reinitialize OneSignal here
    OneSignal.initialize(Constants.expoConfig.extra.oneSignalAppId);
  };

  const linking = {
    prefixes: [DOMAIN_URL, 'RentNearBy://'],
    config: {
      screens: {
        HomeTabNavigator: 'ads/:adIdm',
      },
    },
  };

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
      if (finalStatus === 'granted') {
        token = (await Notifications.getExpoPushTokenAsync()).data;
        // Manually update OneSignal permission status
        OneSignal.User.pushSubscription.optIn(true);
        refreshOneSignalStatus(); // New function to refresh status
      } else if (finalStatus === 'denied' && userToken.length > 0) {
        OneSignal.Notifications.requestPermission(true);
      }
    } else {
      alert('Must use physical device for Notifications');
    }
    return token;
  }

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
        <App />
      </AuthProvider>
    </UserProvider>
  );
};

