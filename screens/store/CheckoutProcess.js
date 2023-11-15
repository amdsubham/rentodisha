import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, ActivityIndicator, ScrollView, } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import api from '../../api';
import { useUser } from '../../context/UserContext';

const CheckoutProcess = ({ route }) => {
    const { userId, userInfo } = useUser();
    console.log("userInfouserInfo", userInfo)
    const { cartItems, totalPrice } = route.params;
    const [name, setName] = useState(userInfo?.name || '');
    const [email, setEmail] = useState(userInfo?.email || '');
    const [address, setAddress] = useState('');
    const [pincode, setPincode] = useState('');
    const [phone, setPhone] = useState(userInfo?.phone || '');
    const [loading, setLoading] = useState(false); // State to show loader while processing the order

    const navigation = useNavigation();

    const handleCancelOrder = () => {
        // Implement any necessary actions for canceling the order (e.g., clearing the cart)
        navigation.goBack();
    };

    const handleCompleteOrder = async () => {
        try {
            setLoading(true); // Show the loader while processing the order

            // Create an object with the necessary order details
            const orderData = {
                cartItems,
                totalPrice,
                name,
                email,
                address,
                pincode,
                phone,
                userId,
            };
            // Send a POST request to the backend to create the order
            await api.post(`/checkout/order`, orderData).then(response => {
                if (!response) {
                    throw new Error;
                } else {
                    setLoading(false); // Hide the loader after order processing is complete
                    alert('Order completed successfully!', 'Payment mode: Cash on Delivery', [
                        { text: 'OK', onPress: () => navigation.goBack() },
                    ]);
                    navigation.goBack();
                }
            }).catch(err => {
                console.error('Error during order processing:', err);
                setLoading(false); // Hide the loader in case of an error
                alert('Failed to complete the order. Please try again.');
            });
        } catch (error) {
            setLoading(false);
            console.error('Error during order processing:', error);
            setLoading(false); // Hide the loader in case of an error
            alert('Failed to complete the order. Please try again.');
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior="padding">
            <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <ScrollView style={styles.formContainer}>
                    <TextInput
                        style={[styles.input]} // Added extra height to address input field
                        placeholder="Name"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={[styles.input]} // Added extra height to address input field
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={[styles.input, styles.addressInput]} // Added extra height to address input field
                        placeholder="Address"
                        value={address}
                        onChangeText={setAddress}
                        multiline // Enable multiline input for address
                        numberOfLines={4} // Show four lines for address input
                    />
                    <TextInput
                        style={[styles.input]} // Added extra height to address input field
                        placeholder="Pincode"
                        value={pincode}
                        onChangeText={setPincode}
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={[styles.input]} // Added extra height to address input field
                        placeholder="Phone"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                </ScrollView>
            </KeyboardAwareScrollView>
            <View style={styles.fixedContentContainer}>
                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryText}>Total Price: ₹{totalPrice}</Text>
                    <Text style={styles.paymentText}>Payment Mode: Cash on Delivery</Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
                        <Text style={styles.buttonText}>Cancel Order</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.completeButton} onPress={handleCompleteOrder}>
                        <Text style={[styles.buttonText, styles.completeButtonText]}>Complete Order</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading && <ActivityIndicator size="large" color="#007DBC" />}

        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    formContainer: {
        marginBottom: 12,
    },
    input: {
        backgroundColor: '#fff',
        padding: 12,
        marginBottom: 16,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    addressInput: {
        height: 100, // Increased height for address input
    },
    summaryContainer: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 16,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    summaryText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    paymentText: {
        fontSize: 16,
        color: '#777',
        marginTop: 8,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    cancelButton: {
        backgroundColor: '#ff0000',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 6,
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    completeButton: {
        backgroundColor: '#00cc00', // Changed to green color
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 6,
        alignItems: 'center',
        flex: 1,
        marginLeft: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    completeButtonText: {
        color: '#fff', // Added white color to the complete order button text
    }, fixedContentContainer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ccc',
    },
    bottomInfoContainer: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});

export default CheckoutProcess;

