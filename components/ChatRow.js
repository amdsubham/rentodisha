
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";

import { useNavigation } from '@react-navigation/native';
import tw from "tailwind-rn";
import { collection, onSnapshot, orderBy, query } from "@firebase/firestore";
import { db } from "../firebase/firebase";
import getMatchedUserInfo from "../utils/getMatchedUserInfo";
import { useUser } from "../context/UserContext";
import generateId from "../utils/generateIds";

const ChatRow = ({ matchDetails }) => {
  const navigation = useNavigation();
  const { userInfo } = useUser();
  const [lastMessage, setLastmessage] = useState("");
  const [matchedUserInfo, setMatchedUserInfo] = useState(null);
  useEffect(() => {
    setMatchedUserInfo(getMatchedUserInfo(matchDetails.users, userInfo.firebaseId));
  }, [matchDetails, userInfo]);

  useEffect(
    () => {
      if (matchedUserInfo) {
        onSnapshot(
          query(
            collection(db, "matches",
              generateId(userInfo.firebaseId, matchedUserInfo.id)
              , "messages"),
            orderBy("timestamp", "desc")
          ),
          (snapshot) => setLastmessage(snapshot.docs[0]?.data()?.message)
        )
      }
    },
    [matchedUserInfo, db]
  );
  let userDetails;
  if (matchedUserInfo) {
    userDetails = matchDetails.users[matchedUserInfo.id];
  }


  const handleDirectMessage = () => {
    navigation.navigate('MessagWithData', {
      userDetails
    })
  };
  return (
    <TouchableOpacity
      style={[
        tw("flex-row items-center py-3 px-5 bg-white mx-3 my-1 rounded-lg"),
        styles.cardShadow,
      ]}
      onPress={handleDirectMessage}
    >
      {matchedUserInfo ? (
        <>
          <Image
            style={tw("rounded-full h-16 w-16 mr-4")}
            source={{
              uri:
                matchedUserInfo?.photoUrl ||
                'https://i.pinimg.com/736x/ff/a0/9a/ffa09aec412db3f54deadf1b3781de2a.jpg',
            }}
          />
          <View>
            <Text style={tw("text-lg font-bold")}>
              {matchedUserInfo?.name}
            </Text>
            <Text style={tw("font-light")}>
              {lastMessage?.length > 34
                ? lastMessage?.substring(0, 34) + '...'
                : lastMessage || 'Say Hi!'}
            </Text>
          </View>
        </>
      ) : (
        <View style={tw('justify-center items-center')}>
          <Text style={tw('text-lg text-gray-500')}>
            Yet to have a conversation
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
});


export default ChatRow;
