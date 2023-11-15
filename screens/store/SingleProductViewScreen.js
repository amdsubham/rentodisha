import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../api';
import { useUser } from '../../context/UserContext';

const SingleProductViewScreen = ({ route }) => {
    const { product } = route.params;
    const { userId } = useUser();
    const [isItemAddedToCart, setIsItemAddedToCart] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const handleAddToCart = async () => {
        try {
            if (!userId) {
                alert('Please log in to add items to your cart.');
                return;
            }
            setIsLoading(true);
            const requestBody = {
                userId: userId,
                productId: product._id,
                quantity: quantity, // Use the selected quantity
            };

            await api.post('/cart/add', requestBody);
            setIsItemAddedToCart(true);
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add product to cart.');
        } finally {
            setIsLoading(false); // Hide loader after adding the item to cart
        }
    };

    const handleIncrement = () => {
        setQuantity((prevQuantity) => prevQuantity + 1);
    };

    const handleDecrement = () => {
        setQuantity((prevQuantity) => Math.max(prevQuantity - 1, 1));
    };

    return (
        <View style={styles.container}>
            <View style={styles.productContainer}>
                <ScrollView contentContainerStyle={styles.productContent}>
                    <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                    <View style={styles.productInfo}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productDescription}>{product.description}</Text>
                        <Text style={styles.productPrice}>Price: ₹{product.price}</Text>
                    </View>
                </ScrollView>
                <View style={styles.quantityContainer}>
                    <TouchableOpacity style={styles.quantityButton} onPress={handleDecrement}>
                        <MaterialCommunityIcons name="minus" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity style={styles.quantityButton} onPress={handleIncrement}>
                        <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity
                style={[styles.addToCartButton, isItemAddedToCart ? styles.addedToCartButton : null]}
                onPress={handleAddToCart}
                disabled={isItemAddedToCart || isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.addToCartButtonText}>
                        {isItemAddedToCart ? 'Item Added to Cart' : 'Add to Cart'}
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    productContainer: {
        flex: 1,
    },
    productContent: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 80, // Adjust this value as needed for spacing
    },
    productImage: {
        width: 500,
        height: 500,
        resizeMode: 'cover',
        borderRadius: 10,
        marginBottom: 20,
    },
    productInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    productDescription: {
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
        marginBottom: 20,
    },
    productPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007DBC',
        marginBottom: 20,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    quantityButton: {
        backgroundColor: '#007DBC',
        padding: 8,
        borderRadius: 4,
    },
    quantityText: {
        paddingHorizontal: 12,
        fontSize: 18,
    },
    addToCartButton: {
        backgroundColor: '#007DBC',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginBottom: 20,
        marginHorizontal: 20,
    },
    addToCartButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        textAlign: 'center',
    },
    addedToCartButton: {
        backgroundColor: 'green',
    },
});

export default SingleProductViewScreen;
