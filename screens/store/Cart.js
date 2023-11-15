import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../context/UserContext';

const Cart = () => {
    const navigation = useNavigation();
    const { userId } = useUser();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchCartItems();
    }, []);

    const calculateTotalPrice = () => {
        return cartItems.reduce((total, item) => total + item.productId.price * item.quantity, 0);
    };

    const fetchCartItems = async () => {
        try {
            if (!userId) {
                // Redirect to login screen if user is not logged in
                navigation.navigate('Auth');
                return;
            }
            const response = await api.get(`/cart?userId=${userId}`);
            const result = response.data.filter(item => item.productId !== null)
            setCartItems(result);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching cart items:', error);
            setLoading(false);
        }
    };

    const handleRemoveFromCart = async (itemId) => {
        try {
            // Set loading state for the specific item to true
            setCartItems((prevCartItems) =>
                prevCartItems.map((item) =>
                    item._id === itemId ? { ...item, loading: true } : item
                )
            );

            await api.delete(`/cart/remove/${itemId}`);
            // Remove the item from cartItems state locally after successful removal
            setCartItems((prevCartItems) =>
                prevCartItems.filter((item) => item._id !== itemId)
            );
            alert('Product removed from cart successfully!');
        } catch (error) {
            console.error('Error removing from cart:', error);
            alert('Failed to remove product from cart.');
        } finally {
            // Set loading state for the specific item back to false
            setCartItems((prevCartItems) =>
                prevCartItems.map((item) =>
                    item._id === itemId ? { ...item, loading: false } : item
                )
            );
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchCartItems();
        setRefreshing(false);
    };

    const renderItem = ({ item }) => (
        <View style={styles.cartItemContainer}>
            <Image source={{ uri: item.productId.imageUrl }} style={styles.cartItemImage} />
            <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName}>{item.productId.name}</Text>
                <Text style={styles.cartItemPrice}>Price: ₹{item.productId.price}</Text>
                <Text style={styles.cartItemPrice}>Quantity: {item.quantity}</Text>
                <TouchableOpacity
                    style={styles.removeFromCartButton}
                    onPress={() => handleRemoveFromCart(item._id)}
                    disabled={item.loading} // Use the specific loading state for the item
                >
                    {item.loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.removeFromCartButtonText}>Remove</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    const handleContinueToCheckout = () => {
        navigation.navigate('CheckoutProcess', { cartItems, totalPrice: calculateTotalPrice() });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007DBC" />
            </View>
        );
    }

    const navigateToOrderManagement = () => {
        navigation.navigate('OrderManagement');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.navigate('ProductCatalog')}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#007DBC" />
                </TouchableOpacity>
                <Text style={styles.title}>Shopping Cart</Text>
                <TouchableOpacity onPress={navigateToOrderManagement}>
                    <MaterialCommunityIcons name="history" size={24} color="#007DBC" />
                </TouchableOpacity>
            </View>
            {cartItems.length === 0 ? (
                <Text style={styles.emptyCartText}>Your cart is empty.</Text>
            ) : (
                <>
                    <FlatList
                        data={cartItems}
                        renderItem={renderItem}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.cartItemList}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh} />
                        }
                    />
                </>
            )}
            <View style={styles.fixedCartSummaryContainer}>
                <View style={styles.cartSummaryContainer}>
                    <Text style={styles.cartSummaryText}>Total Price: ₹{calculateTotalPrice()}</Text>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinueToCheckout}
                    >
                        <Text style={styles.continueButtonText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    cartItemList: {
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    cartItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    cartItemImage: {
        width: 80,
        height: 80,
        resizeMode: 'cover',
        borderRadius: 8,
        marginRight: 16,
    },
    cartItemInfo: {
        flex: 1,
    },
    cartItemName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    cartItemPrice: {
        fontSize: 16,
        color: '#777',
        marginBottom: 8,
    },
    removeFromCartButton: {
        backgroundColor: '#ff0000',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    removeFromCartButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyCartText: {
        alignSelf: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#777',
        marginTop: 50,
    },
    cartSummaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    cartSummaryText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    continueButton: {
        backgroundColor: '#007DBC',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    continueButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },
    fixedCartSummaryContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
});

export default Cart;
