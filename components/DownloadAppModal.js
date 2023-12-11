import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DownloadAppModal = ({ visible, onClose }) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.modalText}>Enhance Your Experience</Text>
                    <View style={styles.benefitItem}>
                        <Ionicons name="chatbubbles-outline" size={24} style={styles.icon} />
                        <Text style={styles.benefitText}>Instant Messaging Notifications</Text>
                    </View>
                    <View style={styles.benefitItem}>
                        <Ionicons name="pin-outline" size={24} style={styles.icon} />
                        <Text style={styles.benefitText}>Location-Based Alerts for New Listings</Text>
                    </View>
                    <View style={styles.benefitItem}>
                        <Ionicons name="megaphone-outline" size={24} style={styles.icon} />
                        <Text style={styles.benefitText}>Easily Post Ads and Connect with Flatmates</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={() => Linking.openURL('http://yourappdownloadlink.com')}>
                        <Text style={styles.buttonText}>Download Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    },
    closeButton: {
        alignSelf: 'flex-end',
        marginBottom: -30,
        marginRight: -30,
        zIndex: 1, // Ensure the button is above other elements
    },
    description: {
        marginBottom: 20,
        textAlign: 'center',
        color: 'gray', // Subtle color for description
    },
    downloadButton: {
        backgroundColor: '#007DBC', // Use a color that matches your app theme
        borderRadius: 20,
        padding: 10,
        elevation: 2,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%', // Added to control the modal width
    },
    modalText: {
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 20,
        color: '#007DBC', // Adjust to match app theme
    },
    icon: {
        marginBottom: 5,
        color: '#007DBC', // Adjust to match app theme
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    benefitText: {
        marginLeft: 10,
        fontSize: 16,
        color: 'gray', // Subtle color for description
    },
});


export default DownloadAppModal;
