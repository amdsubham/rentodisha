import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, RefreshControl } from 'react-native';
import Modal from 'react-native-modal';
import AdCard from '../components/AdCard'; // Import the AdCard component
import API_BASE_URL from '../services/config'; // Your API base URL
import { FontAwesome } from '@expo/vector-icons'; // Import FontAwesome icons
import { useNavigation } from '@react-navigation/native'; // Import the useNavigation hook
import { useUser } from '../context/UserContext';

const UserAds = () => {
    const { userDetails } = useUser();
    const [userAds, setUserAds] = useState([]);
    const [selectedAd, setSelectedAd] = useState(null); // To store the selected ad for the modal
    const [isModalVisible, setModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // To track delete operation loading state
    const [isDeleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false); // To show delete confirmation modal
    const navigation = useNavigation(); // Get the navigation object
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        // Fetch user's posted ads from the backend
        const fetchUserAds = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/rentpost/user/${userDetails._id}`);
                if (response.ok) {
                    const data = await response.json();
                    setUserAds(data);
                } else {
                    console.error('Failed to fetch user ads');
                }
            } catch (error) {
                console.error('Error fetching user ads:', error);
            }
        };

        fetchUserAds();
    }, []);

    const handleEdit = (ad) => {
        navigation.navigate('PostAd', { ad });
    };

    const renderEmptyListComponent = () => (
        <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>You have no ads posted yet.</Text>
        </View>
    );


    const handleDelete = async (adId) => {
        setIsLoading(true);

        try {
            // Send a request to delete the ad by its ID
            const response = await fetch(`${API_BASE_URL}/rentpost/delete/${adId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Remove the deleted ad from the userAds state
                setUserAds((prevAds) => prevAds.filter((ad) => ad._id !== adId));
            } else {
                console.error('Failed to delete ad');
            }
        } catch (error) {
            console.error('Error deleting ad:', error);
        } finally {
            // Reset loading state
            setIsLoading(false);
            // Close the modal
            setDeleteConfirmationVisible(false);
        }
    };

    const handleClaim = (ad) => {
        // Implement your claim logic here
    };

    const toggleModal = (ad) => {

        setModalVisible(!isModalVisible);
    };


    const handleDeleteAd = (ad) => {
        setSelectedAd(ad);
        setDeleteConfirmationVisible(true)
    }

    const onRefresh = useCallback(async () => {
        setRefreshing(true);

        try {
            // Fetch user's posted ads from the backend
            const response = await fetch(`${API_BASE_URL}/rentpost/user/${userDetails._id}`);
            if (response.ok) {
                const data = await response.json();
                setUserAds(data);
            } else {
                console.error('Failed to fetch user ads');
            }
        } catch (error) {
            console.error('Error fetching user ads:', error);
        } finally {
            setRefreshing(false);
        }
    }, []);


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {/* Back button */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesome name="arrow-left" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Your Ads</Text>
            </View>
            <FlatList
                data={userAds}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => toggleModal(item)}>
                        <AdCard ad={item} onEdit={handleEdit} onDelete={() => handleDeleteAd(item)} onClaim={handleClaim} />
                    </TouchableOpacity>
                )}
                ListEmptyComponent={renderEmptyListComponent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
            <Modal isVisible={isModalVisible}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                    {/* Display ad details here */}
                    {selectedAd && (
                        <View>
                            <Text>{selectedAd.adTitle}</Text>
                            <Text>{selectedAd.location}</Text>
                            <Image source={{ uri: selectedAd.images[0] }} style={styles.image} />
                            {/* Add other ad details */}
                        </View>
                    )}
                </View>
            </Modal>
            {/* Delete confirmation modal */}
            <Modal isVisible={isDeleteConfirmationVisible}>
                <View style={styles.deleteConfirmationContainer}>
                    <Text style={styles.deleteConfirmationText}>Are you sure you want to delete this ad?</Text>
                    <View style={styles.deleteConfirmationButtons}>
                        <TouchableOpacity onPress={() => setDeleteConfirmationVisible(false)} style={styles.cancelButton}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="blue" />
                        ) : (
                            <TouchableOpacity onPress={() => handleDelete(selectedAd._id)} style={styles.confirmButton}>
                                <Text style={styles.confirmButtonText}>Delete</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16, // Add padding for the ads
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16, // Add margin at the bottom of the header
    },
    backButton: {
        marginRight: 8,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 10,
    },
    deleteConfirmationContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
    },
    deleteConfirmationText: {
        fontSize: 18,
        marginBottom: 20,
    },
    deleteConfirmationButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    confirmButton: {
        backgroundColor: 'red',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 5,
    },
    emptyListContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    emptyListText: {
        fontSize: 16,
        color: '#999',
    },
    confirmButtonText: {
        color: 'white',
    },
    cancelButton: {
        backgroundColor: '#3182CE',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 5,
        marginRight: 10,
    },
    cancelButtonText: {
        color: 'white',
    },
    closeButton: {
        backgroundColor: '#3182CE',
        padding: 8,
        borderRadius: 5,
    },
    closeButtonText: {
        color: 'white',
    },
});

export default UserAds;
