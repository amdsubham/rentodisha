// src/navigation/AuthStack.js

import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native'; // Import Platform from 'react-native'
import Authentication from '../screens/Authentication';
import OnboardingScreen from '../screens/OnboardingScreen';
import { getItem } from '../utils/asyncStorage';
import AdDetailsWithoutAuthentication from '../screens/AdDetailsWithoutAuthentication';
import HomeWithoutAuthentication from '../screens/HomeWithoutAuthentication';

const Stack = createStackNavigator();

const AuthStack = () => {
    const [showOnboarding, setShowOnboarding] = useState(null);

    useEffect(() => {
        checkIfAlreadyOnboarded();
    }, []);

    const checkIfAlreadyOnboarded = async () => {
        let onboarded = await getItem('onboarded');
        if (onboarded == 1) {
            setShowOnboarding(false);
        } else {
            setShowOnboarding(true);
        }
    };

    if (showOnboarding && Platform.OS !== 'web') { // Check the platform here
        return (
            <Stack.Navigator initialRouteName='Onboarding'>
                <Stack.Screen name="Onboarding" options={{ headerShown: false }} component={OnboardingScreen} />
                <Stack.Screen name="Authentication" options={{ headerShown: false }} component={Authentication} />
                <Stack.Screen name="AdDetailsWithoutAuthentication" component={AdDetailsWithoutAuthentication} />
                <Stack.Screen name="HomeWithoutAuthentication" component={HomeWithoutAuthentication} />
            </Stack.Navigator>
        );
    }

    if (showOnboarding == null) return null;

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}
            initialRouteName='Authentication'
        >
            <Stack.Screen name="Authentication" component={Authentication} />
            <Stack.Screen name="HomeWithoutAuthentication" component={HomeWithoutAuthentication} />
            <Stack.Screen name="AdDetailsWithoutAuthentication" component={AdDetailsWithoutAuthentication} />
        </Stack.Navigator>
    );
};

export default AuthStack;
