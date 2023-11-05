import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { LinearGradient } from 'expo-linear-gradient';

const UpdateAppModal = ({ isVisible, onAppUpdate }) => {
    return (
        <Modal isVisible={isVisible} backdropColor="rgba(0, 0, 0, 0.5)" backdropOpacity={1}>
            <LinearGradient
                colors={['#007DBC', '#005AAA']}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            >
                <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
                    <Text style={{ color: '#007DBC', fontSize: 18, marginBottom: 20 }}>Please update the app now.</Text>
                    <TouchableOpacity
                        style={{ backgroundColor: '#007DBC', padding: 10, borderRadius: 5 }}
                        onPress={onAppUpdate}
                    >
                        <Text style={{ color: 'white', textAlign: 'center', fontSize: 16 }}>Click Here to Update</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </Modal>
    );
};

export default UpdateAppModal;
