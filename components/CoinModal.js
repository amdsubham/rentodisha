import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import WebAnimatedNumbers from 'react-animated-numbers';
import { Ionicons } from '@expo/vector-icons';

const CoinModal = ({ isVisible, onTakePremium, coins, onClose }) => {
    const [AnimatedNumberComponent, setAnimatedNumberComponent] = useState(null);

    useEffect(() => {
        if (Platform.OS === 'web') {
            setAnimatedNumberComponent(WebAnimatedNumbers);
        } else {
            // Dynamic import for non-web platforms
            import('@birdwingo/react-native-spinning-numbers').then((module) => {
                setAnimatedNumberComponent(module.default);
            });
        }
    }, []);

    // Render nothing until the component is loaded
    if (!AnimatedNumberComponent) {
        return null;
    }

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <LinearGradient
                    colors={['#005AAA', '#dddddd']}
                    style={styles.gradient}
                >
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close-circle" size={30} color="white" />
                    </TouchableOpacity>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>You have only one coin left!</Text>
                        <AnimatedNumberComponent
                            style={styles.animatedNumbers}
                        >
                            {coins}
                        </AnimatedNumberComponent>
                        <TouchableOpacity style={styles.premiumButton} onPress={onTakePremium}>
                            <Text style={styles.premiumButtonText}>Buy Premium</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>
        </Modal>
    );
};
const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    gradient: {
        width: '80%',
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
    },
    modalView: {
        width: '100%',
        alignItems: "center",
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center",
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    animatedNumbers: {
        fontSize: 50,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    premiumButton: {
        marginTop: 15,
        backgroundColor: '#005AAA',
        borderRadius: 5,
        padding: 10,
        elevation: 2
    },
    premiumButtonText: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
});

export default CoinModal;
