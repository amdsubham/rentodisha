import React from "react";
import { View, Text, StyleSheet } from "react-native";
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'

TimeAgo.addLocale(en)
const timeAgo = new TimeAgo('en-US')

const SenderMessage = ({ message }) => {

  const date2 = new Date(message?.timestamp?.toDate());
  const numericTimestamp = date2?.getTime();
  const x = numericTimestamp ? timeAgo.format(numericTimestamp, 'mini') : ''

  return (
    <View style={styles.container}>
      <Text style={styles.messageText}>{message.message}</Text>
      <Text style={styles.timestamp}>{x ? x + ' ago' : 'sending...'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#4D7EA8', // A calm blue tone
    borderRadius: 15,
    padding: 10,
    marginVertical: 5,
    marginRight: 10,
    marginLeft: 'auto',
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 2,
  },
  timestamp: {
    color: '#D3E3F2', // A lighter shade for timestamp
    fontSize: 12,
    alignSelf: 'flex-end',
  }
});

export default SenderMessage;
