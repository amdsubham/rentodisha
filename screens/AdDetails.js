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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Import for larger icon

const amenitiesMapping = [
    { key: 'isFurnished', label: 'Furnished', icon: 'bed-outline' },
    { key: 'hasAttachedBathroom', label: 'Attached Bathroom', icon: 'water-outline' },
    { key: 'isMaleOnly', label: 'Male Only', icon: 'male-outline' },
    { key: 'isBachelorsAllowed', label: 'Bachelors Allowed', icon: 'people-outline' },
];

const AdDetailsScreen = ({ route }) => {
    const [isLoading, setIsLoading] = useState(true);
    const { userInfo } = useUser();
    const adId = route.params?.adIds;
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
        navigation.navigate('Message', {
            userDetails
        });
    };

    const handleBackButton = () => {
        navigation.goBack();
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
                <LinearGradient colors={['#007DBC', '#005AAA']} >
                    <TouchableOpacity onPress={handleBackButton} style={styles.seeMoreButtonContainer}>
                        <Ionicons name="arrow-back" size={24} color="white" />
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

const styles = StyleSheet.create({
    flexContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        fontFamily: 'open-sans-regular'
    },
    container: {
        flex: 1,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#005AAA', // Adjust the color and opacity to match your gradient
    },
    footer: {
        borderTopWidth: 1,
        borderColor: '#eaecef',
        backgroundColor: '#fff',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        padding: 16,
        flexDirection: 'row',
        ...(Platform.OS === 'web' ? {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
        } : {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
        }),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eaecef',
    },
    icon: {
        width: 24,
        height: 24,
    },
    backButton: {
        fontSize: 18,
        color: '#007bff',
    },
    villaImage: {
        width: '100%',
        height: 300,
        resizeMode: 'cover',
    },
    villaName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 8,
        marginHorizontal: 16,
        color: '#212529',
        fontFamily: 'open-sans-bold'
    },
    location: {
        fontSize: 16,
        color: '#6c757d',
        marginBottom: 8,
        marginLeft: 16,
        fontFamily: 'open-sans-regular'
    },
    offerContainer: {
        flexDirection: 'row',
        backgroundColor: '#007DBC',
        padding: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 4,
    },
    offerText: {
        color: '#fff',
        fontWeight: '500',
        fontFamily: 'open-sans-regular'
    },
    description: {
        marginHorizontal: 16,
        marginVertical: 8,
        fontSize: 16,
        color: '#212529',
        fontFamily: 'open-sans-regular'
    },
    hostImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        margin: 16,
        borderWidth: 2,
        borderColor: '#eaecef',
    },
    hostName: {
        fontSize: 18,
        fontWeight: '500',
        marginLeft: 16,
        color: '#212529',
    },
    price: {
        fontSize: 28,
        fontWeight: 'bold',
        marginHorizontal: 16,
        marginVertical: 8,
        color: '#28a745',
    },
    directMessageButton: {
        backgroundColor: '#28a745',
        padding: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 4,
        alignItems: 'center',
    },
    directMessageButtonText: {
        color: '#fff',
        fontWeight: '500',
        fontSize: 18,
    },
    postedByCurrentUserMessage: {
        color: '#dc3545',
        textAlign: 'center',
        marginBottom: 10,
        fontSize: 16,
    },
    amenitiesContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eaecef',
        backgroundColor: '#fff',
    },
    amenitiesTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 8,
        fontFamily: 'open-sans-bold'
    },
    amenitiesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
    },
    amenityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007DBC', // This sets the background color to a blue shade
        borderRadius: 16,
        padding: 8,
        marginRight: 8,
        marginBottom: 8,
    },
    amenityLabel: {
        marginLeft: 8,
        fontSize: 14,
        color: '#FFFFFF', // This sets the text color to white
        fontFamily: 'open-sans-regular'
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    originalPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        textDecorationLine: 'line-through',
        marginRight: 8,
    },
    discountedPrice: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    bookNowButton: {
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
    },
    bookNowButtonText: {
        color: '#fff',
        fontWeight: '500',
        fontSize: 18,
    },
    flatmateRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    flatmatesSection: {
        flex: 1,
        padding: 20,
        backgroundColor: '#e9ecef', // Changed background color for better visibility
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        fontFamily: 'open-sans-bold'
    },
    flatmatesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between', // To maintain equal spacing between two cards in a row
    },
    flatmateCard: {
        width: '48%', // Slightly less than half to account for any potential margins or paddings
        marginBottom: 15,
        padding: 10, // Added some padding
        backgroundColor: '#fff', // White background for the card
        borderRadius: 8, // Rounded corners
        alignItems: 'center', // Center items horizontally
    },
    flatmateImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginBottom: 10, // Margin below the image
    },
    flatmateName: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'open-sans-regular',
        textAlign: 'center', // Center the text
    },
    flatmateOccupation: {
        fontSize: 14,
        color: 'gray',
        fontFamily: 'open-sans-light',
        textAlign: 'center', // Center the text
    },
    trustIcon: {
        marginRight: 5,  // Some space between the icon and text
        bottom: 2,
    },
    scrollViewContent: {
        paddingBottom: 20, // Add some bottom padding to accommodate for any absolutely positioned elements
    },
    seeMoreButtonContainer: {
        flexDirection: 'row', // Align items in a row
        alignItems: 'center', // Center items vertically
        padding: 10,
        borderRadius: 5,
        // Add any additional styling as needed
    },
    shareIcon: {
        position: 'absolute',
        right: 10,
        top: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 8,
        borderRadius: 25,
        width: 40,
        zIndex: 1, // Add this line
    },
    soldContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    soldMessage: {
        fontSize: 24,
        color: 'white',
        marginTop: 20,
        textAlign: 'center',
        fontFamily: 'open-sans-bold'
    },

});



export default AdDetailsScreen;
