import React from 'react'; // Basic React import
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'; // React Native components


const MessageSuggestion = ({ onSelectSuggestion }) => {
    const suggestions = [
        "Hi, How are you ?",
        "Hi, I am looking for this house, is it available?",
    ];

    return (
        <ScrollView

            horizontal={true}
            contentContainerStyle={styles.messageSuggestionContainer}>
            {suggestions.map((text, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.messageSuggestion}
                    onPress={() => onSelectSuggestion(text)}
                >
                    <Text style={styles.messageSuggestionText}>{text}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};


const styles = StyleSheet.create({
    // ... other styles
    messageSuggestionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    messageSuggestion: {
        backgroundColor: '#FFFFFF', // Blue background
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginHorizontal: 5,
    },
    messageSuggestionText: {
        // color: '#FFFFFF', // White text
        fontSize: 16,
    },
});

export default MessageSuggestion;