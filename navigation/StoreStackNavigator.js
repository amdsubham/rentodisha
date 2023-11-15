import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Cart from '../screens/store/Cart';
import CheckoutProcess from '../screens/store/CheckoutProcess';
import OrderManagement from '../screens/store/OrderManagement';
import SingleProductViewScreen from '../screens/store/SingleProductViewScreen';
import ProductCatalogScreen from '../screens/store/ProductCatalogScreen';

const Stack = createStackNavigator();

const StoreStackNavigator = () => {
    return (
        <Stack.Navigator initialRouteName="ProductCatalog">
            <Stack.Screen name="ProductCatalog" options={{ headerShown: false, }} component={ProductCatalogScreen} />
            <Stack.Screen name="Cart"
                options={{ title: '', headerShown: false, }}
                component={Cart} />
            <Stack.Screen
                name="CheckoutProcess"
                component={CheckoutProcess}
                options={{ title: 'Checkout Process' }}
            />
            <Stack.Screen
                name="OrderManagement"
                component={OrderManagement}
                options={{ title: 'Order History' }}
            />
            <Stack.Screen
                options={{ title: '', }}
                name="SingleProductView"
                component={SingleProductViewScreen}
            />
        </Stack.Navigator>
    );
};

export default StoreStackNavigator;
