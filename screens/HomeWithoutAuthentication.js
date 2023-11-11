import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, RefreshControl, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, getFirestore, query } from 'firebase/firestore'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useUser } from '../context/UserContext';
import API_BASE_URL from '../services/config';
import { LinearGradient } from 'expo-linear-gradient';
import { analytics, db } from '../firebase/firebase';
import BannerCarousel from '../components/BannerCarousel';
import { logEvent } from 'firebase/analytics';
import SkeletonLoader from "expo-skeleton-loader";
const { height, width } = Dimensions.get('window');

const HomeWithoutAuthentication = () => {
    const { userToken, userInfo } = useUser();
    const [ads, setAds] = useState([]);
    const [banners, setBanners] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();
    const [bannersLoading, setBannersLoading] = useState(true);
    const [genderFilter, setGenderFilter] = useState('all'); // 'all', 'male', 'female'
    const [filteredAds, setFilteredAds] = useState([]);
    useEffect(() => {
        fetchAds();
        fetchBanners()

    }, []);

    const fetchAds = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/rentpost/getAllPosts`);
            if (response.ok) {
                const data = await response.json();
                setAds(data);
            } else {
                console.error('Failed to fetch ad posts');
            }
        } catch (error) {
            console.error('Error fetching ad posts:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleGenderFilterChange = (newFilter) => {
        setGenderFilter(newFilter);
    };

    const skeletonBanner = () => (
        <SkeletonLoader
            boneColor="#B0B3B8"
            highlightColor="#E0E0E0"
        >
            <SkeletonLoader.Item
                style={{ width, height: height / 4, marginVertical: 10 }}
            />
        </SkeletonLoader>
    );
    const filterAds = () => {
        let filtered;
        switch (genderFilter) {
            case 'male':
                filtered = ads.filter(ad => ad.isMaleOnly === true);
                break;
            case 'female':
                filtered = ads.filter(ad => ad.isMaleOnly === false);
                break;
            default:
                filtered = ads;
        }
        setFilteredAds(filtered);
    };
    const fetchBanners = async () => {
        try {
            setBannersLoading(true);
            const bannersQuery = query(collection(db, 'banners'));
            const bannersSnapshot = await getDocs(bannersQuery);
            const fetchedBanners = bannersSnapshot.docs.map(doc => doc.data().link);
            setBanners(fetchedBanners);
        } catch (error) {
            console.error('Error fetching banners:', error);
        } finally {
            setBannersLoading(false);
        }
    };

    const renderAdCard = ({ item }) => (
        <AnimatedCard item={item} onPress={handleAdPress} />
    );

    const handleAdPress = (ad) => {
        logEvent(analytics, "Post OnClick", (ad));
        navigation.navigate('AdDetailsWithoutAuthentication', { adId: ad._id });
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAds();
    }, []);
    useEffect(() => {
        filterAds();
    }, [ads, genderFilter]);
    return (
        <>
            <View style={styles.container}>
                {bannersLoading && skeletonBanner()}
                {!bannersLoading && banners.length > 0 && <BannerCarousel data={banners} />}
                <View style={styles.filterButtonsContainer}>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            genderFilter === 'all' ? styles.filterButtonActive : {},
                        ]}
                        onPress={() => handleGenderFilterChange('all')}
                    >
                        <Text style={genderFilter === 'all' ? styles.filterTextActive : styles.filterText}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            genderFilter === 'male' ? styles.filterButtonActive : {},
                        ]}
                        onPress={() => handleGenderFilterChange('male')}
                    >
                        <Text style={genderFilter === 'male' ? styles.filterTextActive : styles.filterText}>Male Only</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            genderFilter === 'female' ? styles.filterButtonActive : {},
                        ]}
                        onPress={() => handleGenderFilterChange('female')}
                    >
                        <Text style={genderFilter === 'female' ? styles.filterTextActive : styles.filterText}>Female Only</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={filteredAds.length ? filteredAds : ads}
                    keyExtractor={(item) => item._id}
                    renderItem={renderAdCard}
                    contentContainerStyle={styles.adList}
                    numColumns={2}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#007DBC"
                        />
                    }
                />
            </View>
        </>
    );
};

const AnimatedCard = ({ item, onPress }) => {
    const scale = useSharedValue(1);
    const lastPress = useRef(Date.now());

    const animatedStyles = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const animatedImageStyles = useAnimatedStyle(() => {
        return {
            transform: [
                { perspective: 1000 },
                { rotateY: `${scale.value * 0}deg` },
            ],
        };
    });

    const handlePress = () => {
        const now = Date.now();
        if (now - lastPress.current > 300) { // Prevent multiple rapid presses
            lastPress.current = now;
            onPress(item);
        }
    };

    const handlePressIn = () => {
        scale.value = withSpring(1.05);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <Animated.View style={[styles.card, animatedStyles]}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                delayPressIn={100} // Add delay here
                style={styles.touchable}
            >
                <LinearGradient colors={['#005AAA', '#007DBC']} style={styles.gradient}>
                    <Animated.Image source={{ uri: item.images[0] }} style={[styles.adImage, animatedImageStyles]} />
                    <View style={styles.adDetails}>
                        <Text
                            style={styles.adTitle}
                            numberOfLines={2}
                            ellipsizeMode='tail'
                        >
                            {item.adTitle}
                        </Text>
                        <View style={styles.adInfo}>
                            <Text style={styles.adPrice}>Price: ₹{item.price}</Text>
                            <Text style={styles.adBedrooms}>{item.bedrooms} {item.location}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    bannerImage: {
        width: '100%',
        height: 200,
    },
    adList: {
        padding: 8,
    },
    touchable: {
        flex: 1,
    },
    card: {
        flex: 0.5,
        margin: 8,
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: '#fff',
        elevation: 6,
        shadowColor: 'rgba(0,0,0,0.15)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 6,
        borderColor: '#f0f0f0', // Light grey border
        borderWidth: 1, // Border width
        fontFamily: 'open-sans-regular',
    },
    adImage: {
        width: '100%',
        height: 140,
        backfaceVisibility: 'hidden',
        borderTopLeftRadius: 15, // Match border radius of card
        borderTopRightRadius: 15, // Match border radius of card
    },
    adDetails: {
        flex: 1,
        padding: 12, // Slightly more padding
    },
    adTitle: {
        fontSize: 14, // Reduced font size for title
        //fontWeight: 'bold',
        marginBottom: 5,
        color: 'white', // Darker text color for better readability
        fontFamily: 'open-sans-bold',
    },
    adLocation: {
        fontSize: 14, // Reduced font size for location
        color: 'white', // Lighter text color for location
        marginBottom: 8, // Added margin-bottom for spacing
    },
    adInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    adPrice: {
        fontSize: 16,
        color: '#deac47',
        fontFamily: 'open-sans-bold',
    },
    adBedrooms: {
        fontSize: 12,
        color: '#999',
    },

    filterButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 10,
        //marginBottom: 20,
    },
    filterButton: {
        borderWidth: 1,
        borderColor: '#007DBC',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginHorizontal: 5,
        backgroundColor: 'white',
    },
    filterButtonActive: {
        backgroundColor: '#007DBC',
    },
    filterText: {
        color: '#007DBC',
        textAlign: 'center',
    },
    filterTextActive: {
        color: 'white',
        textAlign: 'center',
    },
});

export default HomeWithoutAuthentication;
