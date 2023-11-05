import { collection, onSnapshot, query, where } from "@firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  FlatList,
  StyleSheet,
} from "react-native";
import tw from "tailwind-rn";
import { AuthOpen } from "../hooks/useAuth";
import ChatRow from "./ChatRow";
import { db } from "../firebase/firebase";
import { useUser } from "../context/UserContext";

const ChatList = () => {
  const [matches, setMatches] = useState([]);
  const { userInfo } = useUser();
  const [loading, setLoading] = useState(true);
  useEffect(
    () =>
      onSnapshot(
        query(
          collection(db, "matches"),
          where("usersMatched", "array-contains", userInfo.firebaseId)
        ),
        (snapshot) =>
          setMatches(
            snapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              }),
              setLoading(false)
            )
          )
      ),
    [userInfo]
  );

  return loading ? (
    <View style={[styles.container, styles.horizontal]}>
      <ActivityIndicator size="large" color="#29325C" />
    </View>
  ) : matches.length > 0 ? (
    <FlatList
      style={tw("h-full")}
      data={matches}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ChatRow matchDetails={item} />}
    />
  ) : (
    <View style={tw("p-5")}>
      <Text style={tw("text-center text-lg")}>No Message at the moment 😢</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  horizontal: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
});

export default ChatList;
