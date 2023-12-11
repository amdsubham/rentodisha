import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import tw from "tailwind-rn";
import { collection, onSnapshot, query, where } from "@firebase/firestore";
import { db } from "../firebase/firebase";
import { useUser } from "../context/UserContext";
import ChatRow from "./ChatRow";

const ChatList = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useUser();

  const fetchMatches = () => {
    setLoading(true);
    onSnapshot(
      query(
        collection(db, "matches"),
        where("usersMatched", "array-contains", userInfo.firebaseId)
      ),
      (snapshot) => {
        setMatches(
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching matches:", error);
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchMatches();
  }, [userInfo]);

  const onRefresh = React.useCallback(() => {
    fetchMatches();
  }, [fetchMatches]);

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
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
        />
      }
    />
  ) : (
    <View style={tw("p-5")}>
      <Text style={tw("text-center text-lg")}>No Message at this moment !!</Text>
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
