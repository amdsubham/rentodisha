import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'

TimeAgo.addLocale(en)
const timeAgo = new TimeAgo('en-US')

const ReceiverMessage = ({ message }) => {

  const date2 = new Date(message.timestamp.toDate());
  const numericTimestamp = date2.getTime();
  const x = timeAgo.format(numericTimestamp, 'mini')

  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={{ uri: message.photoURL }}
      />
      <View style={styles.messageBubble}>
        <Text style={styles.messageText}>{message.message}</Text>
        <Text style={styles.timestamp}>{x} ago</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    margin: 5,
    alignItems: 'flex-end',
  },
  image: {
    height: 40,
    width: 40,
    borderRadius: 20,
    marginRight: 5,
    borderColor: 'white',
    borderWidth: 1,
  },
  messageBubble: {
    backgroundColor: '#f0f0f0', // A soft color
    borderRadius: 20,
    padding: 10,
    maxWidth: '80%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  messageText: {
    color: '#333', // Darker text color for contrast
    fontSize: 16,
  },
  timestamp: {
    color: '#888', // Soft color for the timestamp
    fontSize: 12,
    marginTop: 5,
    alignSelf: 'flex-end',
  }
});

export default ReceiverMessage;
