import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const CartCountCard = ({ cartItemsCount = 0, loading }) => {
    const navigation = useNavigation();

    const handlePress = () => {
        navigation.navigate('Cart'); // Navigate to the 'Cart' screen when the card is clicked
    };

    return (
        <TouchableOpacity onPress={handlePress}>
            <View style={styles.container}>
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <>
                        <MaterialCommunityIcons name="cart" size={24} color="#fff" />
                        <View style={styles.cartCountContainer}>
                            <Text style={styles.cartCountText}>{cartItemsCount}</Text>
                        </View>
                    </>
                )}
                <Text style={styles.cartLabelText}>Cart</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#007DBC',
        paddingHorizontal: 10,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    cartCountContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginLeft: 5,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    cartCountText: {
        color: '#007DBC',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cartLabelText: {
        color: '#fff',
        fontSize: 12,
        marginLeft: 5,
    },
});

export default CartCountCard;
