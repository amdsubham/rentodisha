// UserContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthOpen } from '../hooks/useAuth';
import API_BASE_URL from '../services/config';
import { OneSignal } from 'react-native-onesignal';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    useEffect(() => {
        const loadUserToken = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('userToken');
                if (storedToken) {
                    setUserToken(storedToken);
                }
            } catch (error) {
                console.error('Error loading user token:', error);
            }
        };
        loadUserToken();
    }, []);

    const fetchUserDetails = async () => {
        const response = await fetch(`${API_BASE_URL}/user/getUserByPhoneNumber/${userToken.toString()}`);
        if (response.ok) {
            const userData = await response.json();
            const { email, gender, image, name, phoneNumber, _id, tenantType, rentPosts, coins, subscriptionStartDate, location } = userData
            setUserDetails(userData);
            setUserInfoToStore({ email, gender, image, name, phone: phoneNumber, id: _id, tenantType, rentPosts, coins, subscriptionStartDate, location })
        } else {
            console.error('Error fetching user details:', response.statusText);
        }
    }
    const login = async (token) => {
        setUserToken(token);
        OneSignal.User.addSms(token.toString())
        try {
            // Store the user token in async storage
            await AsyncStorage.setItem('userToken', token);

        } catch (error) {
            console.error('Error storing user token:', error);
        }
    };

    const logout = async () => {
        setUserToken(null);
        removeUserInfoFromStore()
        try {
            // Remove the user token from async storage
            await AsyncStorage.removeItem('userToken');
            OneSignal.logout()
        } catch (error) {
            console.error('Error removing user token:', error);
        }
    };


    const removeUserInfoFromStore = async () => {
        try {
            // Remove the user info from async storage
            await AsyncStorage.removeItem('userInfo');
            // You can also reset the user info state if needed
            setUserInfo({});
        } catch (error) {
            console.error('Error removing user info:', error);
        }
    };

    const setUserInfoToStore = async ({
        name,
        id,
        firebaseId,
        phone,
        gender,
        rentPost,
        email,
        image,
        tenantType,
        coins,
        subscriptionStartDate = 'NA',
        location = {},
        locationMarked,
        messagingToken,
    }) => {
        try {
            // Get the existing user info from async storage
            const existingUserInfo = await AsyncStorage.getItem('userInfo');
            let userInfo = existingUserInfo ? JSON.parse(existingUserInfo) : {};

            // Check if firebaseId exists in userInfo
            if (!userInfo.firebaseId || !userInfo.firebaseId.length) {
                userInfo = {
                    ...userInfo,
                    firebaseId,
                };
            }

            // Update the other user info fields
            userInfo = {
                ...userInfo,
                name,
                id,
                phone,
                gender,
                rentPost,
                email,
                image,
                tenantType,
                coins,
                subscriptionStartDate,
                location,
                locationMarked,
                messagingToken
            };

            await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
            setUserInfo(userInfo);
        } catch (error) {
            console.error('Error storing/updating user info:', error);
        }
    };

    return (
        <UserContext.Provider value={{
            userToken,
            userId: userInfo?.id,
            login,
            logout,
            userDetails,
            fetchUserDetails,
            setUserInfoToStore,
            userInfo,
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    return useContext(UserContext);
};
