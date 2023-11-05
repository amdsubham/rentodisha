import { Image, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // Make sure to install this library

const ChatHeader = ({ userDetails, navigation }) => {
    const handleBackPress = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView>
            <View style={styles.chatHeaderContainer} >
                <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                {userDetails?.image && (<Image source={{ uri: userDetails.image }} style={styles.chatHeaderImage} />)}
                <Text style={styles.chatHeaderText}>{userDetails.name}</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    chatHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#006699', // A nice shade of blue
        borderBottomWidth: 1,
        borderColor: '#006699', // A slightly darker blue for the border
    },
    chatHeaderImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    chatHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF', // White text for better contrast and readability
    },
    backButton: {
        marginRight: 10,
    },
});

export default ChatHeader;