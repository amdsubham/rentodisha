import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, TextInput } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import uuid4 from 'uuid4';
import Home from './Home';
import PostAdScreen from './PostAd';
import UpdateProfileModal from '../components/UpdateProfileModal';
import API_BASE_URL from '../services/config';
import { AuthOpen } from '../hooks/useAuth';
import Chat from './Chat';
import CustomHeader from '../components/CustomHeader';
const Tab = createBottomTabNavigator();

const HomeTabNavigator = ({ route }) => {
    const navigation = useNavigation();
    const adIds = route.params?.adIdm
    const { logout, userToken, fetchUserDetails } = useUser();
    const { logOut } = AuthOpen();
    const [isModalVisible, setModalVisible] = React.useState(false);
    const [isUpdateModalVisible, setUpdateModalVisible] = React.useState(false);
    const [isUserExists, setIsUserExists] = useState(false);
    const [userProfileData, setUserProfileData] = React.useState({
        name: '',
        email: '',
        gender: '',
        phone: '',
    });
    const handleMyAds = () => {
        navigation.navigate('UserAds')
        setModalVisible(false)
    }
    const renderPopover = () => (
        <Modal
            visible={isModalVisible}
            transparent={true}
            onRequestClose={() => {
                setModalVisible(false);
                setUpdateModalVisible(false);
            }}
        >
            <Pressable
                style={styles.popoverBackground}
                onPress={() => {
                    setModalVisible(false);
                    setUpdateModalVisible(false);
                }}
            >
                <View style={styles.popoverContent}>

                    <TouchableOpacity
                        style={styles.popoverOption}
                        onPress={handleUpdateProfile}
                    >
                        <Text style={styles.popoverOptionText}>Update Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.popoverOption}
                        onPress={handleMyAds}
                    >
                        <Text style={styles.popoverOptionText}>My Ads</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.popoverOption} onPress={handleLogout}>
                        <Text style={styles.popoverOptionText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );

    useEffect(() => {
        if (adIds) {
            setTimeout(() => {
                navigation.navigate('SingleScreenAd', { adIds });
            }, 100);
        }
    }, [adIds]);

    useEffect(() => {
        fetchUserExistsStatus()
    }, []);

    const fetchUserExistsStatus = async () => {
        const checkPhoneResponse = await fetch(`${API_BASE_URL}/user/check-phone/${userToken.toString()}`);
        const checkPhoneData = await checkPhoneResponse.json();
        if (checkPhoneData.exists) {
            fetchUserDetails()
        }
        setUpdateModalVisible(!checkPhoneData.exists)
        setIsUserExists(checkPhoneData.exists)
    }

    const toggleModal = () => {
        setModalVisible(!isModalVisible);
        if (isUpdateModalVisible) {
            setUpdateModalVisible(false);
        }
    };


    const handleUpdateProfile = () => {
        setModalVisible(false);
        const fetchedProfileData = {
            name: 'John Doe',
            email: 'johndoe@example.com',
            gender: 'Male',
        };

        setUserProfileData(fetchedProfileData);
        setUpdateModalVisible(true);
    };

    const handleLogout = () => {
        logout();
        logOut()
    };

    const handleDismissUpdateModal = () => {
        setUpdateModalVisible(false)
        fetchUserExistsStatus()
    }

    const renderCustomHeader = () => {
        return (
            <CustomHeader
                onBackPress={() => navigation.goBack()}
                onSettingPress={toggleModal}
            />
        );
    };
    return (
        <>
            <Tab.Navigator
                tabBarOptions={{
                    activeTintColor: '#007DBC',
                    inactiveTintColor: 'gray',
                    showLabel: true,
                    style: styles.tabBar,
                    headerShown: false
                }}
                screenOptions={({ route }) => ({
                    // headerRight: () => (
                    //     <TouchableOpacity onPress={toggleModal}>
                    //         <MaterialCommunityIcons
                    //             name="cog"
                    //             size={24}
                    //             color="#000"
                    //             style={{ marginRight: 16 }}
                    //         />
                    //     </TouchableOpacity>
                    // ),
                    header: renderCustomHeader

                })}
            >
                <Tab.Screen
                    name="HomeTabNavigator"
                    component={Home}
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, focused }) => (
                            <MaterialCommunityIcons
                                name={focused ? 'home' : 'home-outline'}
                                size={24}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tab.Screen
                    name="PostAdScreen"
                    component={PostAdScreen}
                    options={{
                        title: '',
                        tabBarIcon: ({ color, focused }) => (
                            <MaterialCommunityIcons
                                name={focused ? 'plus-circle' : 'plus-circle'}
                                size={55}
                                color={focused ? '#007DBC' : "rgb(128, 128, 128)"}
                            />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Message"
                    component={Chat}
                    options={{
                        tabBarIcon: ({ color, focused }) => (
                            <MaterialCommunityIcons
                                name={focused ? 'message' : 'message'}
                                size={24}
                                color={color}
                            />
                        ),
                    }}
                />
            </Tab.Navigator>
            {renderPopover()}
            {isUpdateModalVisible && (<UpdateProfileModal
                isVisible={isUpdateModalVisible}
                onDismiss={handleDismissUpdateModal}
                userProfileData={userProfileData}
                isUserExists={isUserExists}
                onUpdateProfile={(updatedData) => {
                    // Handle updating the user profile here
                    setUserProfileData(updatedData);
                }}
            />)}

        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
    },
    tabBar: {
        backgroundColor: 'white',
        borderTopWidth: 0,
        elevation: 2,
    },
    addButton: {
        backgroundColor: '#007DBC',
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        bottom: 16,
        elevation: 4,
    },
    addButtonText: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    popoverBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popoverContent: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    popoverOption: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    popoverOptionText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007DBC',
    },
});

export default HomeTabNavigator;
