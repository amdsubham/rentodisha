import { Image, StyleSheet, Text, View, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // Make sure to install this library
import AnimatedNumbers from 'react-native-animated-numbers';
import WebAnimatedNumbers from 'react-animated-numbers';
const ChatHeader = ({ userDetails, navigation, coins }) => {
    const handleBackPress = () => {
        navigation.goBack();
    };
    const AnimatedNumberComponent = Platform.select({
        web: WebAnimatedNumbers,
        default: AnimatedNumbers,
    });
    return (
        <SafeAreaView>
            <View style={styles.chatHeaderContainer} >

                <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                {userDetails?.image && (<Image source={{ uri: userDetails.image }} style={styles.chatHeaderImage} />)}
                <Text style={styles.chatHeaderText}>{userDetails.name}</Text>
                <View style={styles.coinsContainer}>
                    <Text style={styles.coinsTitle}>Message Left</Text>
                    <AnimatedNumberComponent
                        animateToNumber={coins}
                        fontStyle={styles.coinsValue}
                        includeComma
                        frameStyle={{ flexDirection: 'row', alignItems: 'flex-end' }}
                    />
                </View>
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
    coinsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF', // Assuming the title is also white
        marginRight: 8, // Add some space between the title and the number
    },
    coinsValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700', // A gold-like color for the coins value
    },
    coinsContainer: {
        marginLeft: 'auto', // This pushes the coins container to the extreme right
        flexDirection: 'row',
        alignItems: 'center',
        right: 15
    },
});

export default ChatHeader;