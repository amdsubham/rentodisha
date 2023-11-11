import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, Share, Platform, Clipboard, Alert, ActivityIndicator, } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import API_BASE_URL, { DOMAIN_URL } from '../services/config';
import * as FileSystem from 'expo-file-system';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Import for larger icon

const amenitiesMapping = [
    { key: 'isFurnished', label: 'Furnished', icon: 'bed-outline' },
    { key: 'hasAttachedBathroom', label: 'Attached Bathroom', icon: 'water-outline' },
    { key: 'isMaleOnly', label: 'Male Only', icon: 'male-outline' },
    { key: 'isBachelorsAllowed', label: 'Bachelors Allowed', icon: 'people-outline' },
    // Add other attributes and their corresponding labels and icons here...
];

const AdDetailsWithoutAuthentication = ({ route }) => {
    const [isLoading, setIsLoading] = useState(true);
    const { userInfo } = useUser();
    const { adId } = route.params;
    const navigation = useNavigation();
    const [ad, setAd] = useState();
    const [firebaseId, setFirebaseId] = useState(ad?.firebaseId);
    const [flatmatesData, setFlatmatesData] = useState(ad?.flatmates);
    const [userDetails, setUserDetails] = useState(null);
    const [showDirectMessageButton, setShowDirectMessageButton] = useState(false);
    const isPostedByCurrentUser = firebaseId === userInfo?.firebaseId;
    const [isAdAvailable, setIsAdAvailable] = useState(true);
    useEffect(() => {
        const fetchPostDetails = async () => {
            setIsLoading(true);

            try {
                const response = await fetch(`${API_BASE_URL}/rentpost/getPostsById/${adId}`);
                if (response.ok) {
                    const data = await response.json();
                    setAd(data)
                    setFirebaseId(data?.firebaseId)
                    setFlatmatesData(data?.flatmates || [])
                    setIsAdAvailable(true);
                } else {
                    setIsAdAvailable(false);
                    console.error('Failed to fetch user ads');
                }
            } catch (error) {
                console.error('Error fetching user ads:', error);
            } finally {
                setIsLoading(false); // Stop loading
            }
        };

        if (adId) {
            fetchPostDetails();
        }
    }, [adId]);


    const onShare = async () => {
        const shareMessage = `${ad?.adTitle} At Price ₹${ad?.price}\n\n Check this out!! ✨🏠🌟\n\n` + `${DOMAIN_URL}/ads/${ad?._id}`;

        if (Platform.OS === 'web') {
            // Attempt to use the Web Share API if available
            if (navigator.share) {
                navigator.share({
                    title: ad?.adTitle,
                    text: shareMessage,
                    // url: ad?.images[0],
                }).catch(error => console.log('Error sharing', error));
            } else {
                Clipboard.setString(shareMessage);
                Alert.alert('Link copied to clipboard');
            }
        } else {
            // Mobile sharing
            try {
                await Share.share({
                    message: shareMessage,
                    //url: ad?.images[0], // Include this only if it's a local file
                });
            } catch (error) {
                console.error(error.message);
            }
        }
    };

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'user_profiles', firebaseId));

                if (userDoc.exists()) {
                    setUserDetails(userDoc.data());
                    setShowDirectMessageButton(true);
                }
            } catch (error) {
                console.error('Error fetching user details:', error);
            }
        };

        if (firebaseId) {
            fetchUserDetails();
        }
    }, [firebaseId]);


    const handleDirectMessage = () => {
        navigation.navigate('Authentication');
    };

    const handleBackButton = () => {
        navigation.navigate('HomeWithoutAuthentication');
    };

    if (isLoading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
        )
    }
    if (!isAdAvailable) {
        return (
            <LinearGradient colors={['#007DBC', '#005AAA']} style={styles.soldContainer}>
                <MaterialIcons name="error-outline" size={60} color="white" />
                <Text style={styles.soldMessage}>This ad has been sold</Text>
                <TouchableOpacity onPress={handleBackButton} style={styles.seeMoreButtonContainer}>

                    <Text style={styles.seeMoreButtonText}> See More</Text>
                    <Ionicons name="arrow-forward" size={24} color="white" />
                </TouchableOpacity>
            </LinearGradient>
        );
    }
    return (
        <SafeAreaView style={styles.flexContainer}>
            <View style={{ height: "90%", backgroundColor: '#f8f9fa', }}>
                <LinearGradient colors={['#007DBC', '#005AAA']} style={styles.header}>
                    <TouchableOpacity onPress={handleBackButton} style={styles.seeMoreButtonContainer}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                        <Text style={styles.seeMoreButtonText}> See More</Text>
                    </TouchableOpacity>
                </LinearGradient>
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <Image source={{ uri: ad?.images[0] }} style={styles.villaImage} />
                    <TouchableOpacity style={styles.shareIcon} onPress={onShare}>
                        <Ionicons name="share-social" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.villaName}>{ad?.adTitle}</Text>
                    <Text style={styles.location}>{ad?.location}</Text>
                    <View style={styles.offerContainer}>
                        <FontAwesome name="check" size={24} color="white" style={styles.trustIcon} />

                        <Text style={styles.offerText}>Verified User</Text>
                    </View>
                    <Text style={styles.description}>{ad?.adDescription}</Text>
                    {ad &&
                        (<View style={styles.amenitiesContainer}>
                            <View style={styles.amenitiesList}>
                                {amenitiesMapping.map(amenity => {
                                    if (ad[amenity.key]) {
                                        return (
                                            <View style={styles.amenityItem} key={amenity.key}>
                                                <Ionicons name={amenity.icon} size={24} color="white" />
                                                <Text style={styles.amenityLabel}>{amenity.label}</Text>
                                            </View>
                                        );
                                    }
                                    return null;
                                })}
                            </View>
                        </View>)}
                    {
                        (ad && flatmatesData.length > 0) &&
                        (<View style={styles.flatmatesSection}>
                            <Text style={styles.title}>Flatmates</Text>
                            <View style={styles.flatmatesGrid}>
                                {flatmatesData.map((flatmate, index) => (
                                    <View key={index} style={styles.flatmateCard}>
                                        <Image source={{ uri: flatmate.image }} style={styles.flatmateImage} />
                                        <Text style={styles.flatmateName}>{flatmate.name}</Text>
                                        <Text style={styles.flatmateOccupation}>{flatmate.occupation}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>)
                    }
                </ScrollView>
            </View>
            {isPostedByCurrentUser ? (
                // Display a message indicating that the advertisement is posted by the current user
                <Text style={styles.postedByCurrentUserMessage}>
                    This advertisement is posted by you.
                </Text>
            ) : showDirectMessageButton && (
                <View style={styles.footer}>
                    <View style={styles.priceContainer}>
                        <Text style={styles.discountedPrice}>₹{ad?.price}/month</Text>
                    </View>
                    <TouchableOpacity onPress={handleDirectMessage} style={styles.bookNowButton}>
                        <Text style={styles.bookNowButtonText}>
                            Direct Message
                        </Text>
                    </TouchableOpacity>
                </View>

            )}

        </SafeAreaView>
    );
};




export default AdDetailsWithoutAuthentication;
