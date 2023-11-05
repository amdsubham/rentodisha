// src/navigation/AuthStack.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeTabNavigator from '../screens/HomeTabNavigator';
import PostAdScreen from '../screens/PostAd';
import Default from '../screens/Default';
import UserAds from '../screens/UserAds';
import AdDetailsScreen from '../screens/AdDetails';
import Message from '../screens/Message';
import Chat from '../screens/Chat';
import ChatRow from '../components/ChatRow';
import CustomHeader from '../components/CustomHeader';

const Stack = createStackNavigator();

const AppStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}
            initialRouteName='HomeTabNavigator'
        >
            <Stack.Screen name="HomeTabNavigator" component={HomeTabNavigator} />
            <Stack.Screen name="PostAd" component={PostAdScreen} />
            <Stack.Screen name="UserAds" component={UserAds} />
            <Stack.Screen name="SingleScreenAd" component={AdDetailsScreen} />
            <Stack.Screen name="Chat" component={Chat} />
            <Stack.Screen name="Location" component={CustomHeader} />
            <Stack.Screen name="Message" component={Message} />
            <Stack.Screen name="MessagWithData" component={Message} />
        </Stack.Navigator>
    );
};

export default AppStack;
