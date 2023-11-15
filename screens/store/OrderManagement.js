// OrderManagement.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Image, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../../api';
import { useUser } from '../../context/UserContext';

const OrderManagement = () => {
    const { userId } = useUser();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/orders/${userId}`);
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            // Handle error
        } finally {
            setLoading(false);
        }
    };

    const [selectedCartItem, setSelectedCartItem] = useState(null);
    const [isCartItemModalVisible, setIsCartItemModalVisible] = useState(false);

    const handleShowCartItemDetails = (cartItem) => {
        setSelectedCartItem(cartItem);
        setIsCartItemModalVisible(true);
    };

    const closeCartItemModal = () => {
        setIsCartItemModalVisible(false);
    };

    const renderOrderItem = ({ item }) => (
        <View style={styles.orderItemContainer}>
            <Text style={styles.orderItemText}>Order ID: {item._id}</Text>
            <Text style={styles.orderItemText}>Name: {item.name}</Text>
            <Text style={styles.orderItemText}>Phone: {item.phone}</Text>
            <Text style={styles.orderItemText}>Total Price: ₹{item.totalPrice}</Text>
            <Text style={styles.orderItemText}>Status: {item.status}</Text>
            {/* Additional order details can be displayed here */}
            <FlatList
                data={item.cartItems}
                renderItem={renderCartItem}
                keyExtractor={(cartItem) => cartItem._id}
                contentContainerStyle={styles.cartItemList}
            />
        </View>
    );

    const renderCartItem = ({ item }) => (
        <View style={styles.cartItemContainer}>
            <Image source={{ uri: item.productId.imageUrl }} style={styles.cartItemImage} />
            <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName}>{item.productId.name}</Text>
                <Text style={styles.cartItemPrice}>Price: ₹{item.productId.price}</Text>
                <Text style={styles.cartItemPrice}>Quantity: {item.quantity}</Text>
                {/* Additional cart item details can be displayed here */}
                <TouchableOpacity
                    style={styles.showDetailsButton}
                    onPress={() => handleShowCartItemDetails(item)}
                >
                    <Text style={styles.showDetailsButtonText}>Show Details</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color="#007DBC" />
            ) : orders.length === 0 ? (
                <Text style={styles.emptyText}>No orders found.</Text>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.orderList}
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={fetchOrders} />
                    }
                />
            )}

            {/* Modal for displaying cart item details */}
            <Modal visible={isCartItemModalVisible} transparent={true} onRequestClose={closeCartItemModal}>
                <View style={styles.modalBackground}>
                    <View style={styles.cartItemModalContent}>
                        <Text style={styles.modalTitle}>Cart Item Details</Text>
                        {selectedCartItem && (
                            <View>
                                <Image
                                    source={{ uri: selectedCartItem.productId.imageUrl }}
                                    style={styles.cartItemImage}
                                />
                                <Text style={styles.cartItemModalText}>
                                    Product Name: {selectedCartItem.productId.name}
                                </Text>
                                <Text style={styles.cartItemModalText}>
                                    Description: {selectedCartItem.productId.description}
                                </Text>
                                <Text style={styles.cartItemModalText}>
                                    Price: ₹{selectedCartItem.productId.price}
                                </Text>
                                <Text style={styles.cartItemModalText}>
                                    Quantity: {selectedCartItem.quantity}
                                </Text>
                                {/* Add more details as needed */}
                            </View>
                        )}
                        <TouchableOpacity style={styles.closeButton} onPress={closeCartItemModal}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
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
    orderList: {
        flexGrow: 1,
    },
    orderItemContainer: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 16,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    orderItemText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
    },
    emptyText: {
        alignSelf: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#777',
        marginTop: 50,
    },
    cartItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
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
        alignItems: 'center', // Center the "Show Details" button
    },
    showDetailsButton: {
        backgroundColor: '#007DBC',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        marginTop: 8,
    },
    showDetailsButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartItemModalContent: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        width: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    cartItemModalText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
    },
    closeButton: {
        backgroundColor: '#007DBC',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignSelf: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },
});

export default OrderManagement;
