// src/navigation/AuthStack.js

import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native'; // Import Platform from 'react-native'
import Authentication from '../screens/Authentication';
import OnboardingScreen from '../screens/OnboardingScreen';
import { getItem } from '../utils/asyncStorage';

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
                <Stack.Screen name="Home" options={{ headerShown: false }} component={Authentication} />
            </Stack.Navigator>
        );
    }

    if (showOnboarding == null) return null;

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen name="Authentication" component={Authentication} />
        </Stack.Navigator>
    );
};

export default AuthStack;
