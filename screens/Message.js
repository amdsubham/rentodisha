import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Button,
  Keyboard,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  StyleSheet,

} from "react-native";
import { WebView } from 'react-native-webview';
import axios from "axios"; // Import Axios for making API requests
import { doc, getDoc, setDoc } from "firebase/firestore";
import tw from "tailwind-rn";
import ReceiverMessage from "../components/ReceiverMessage";
import SenderMessage from "../components/SenderMessage";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "@firebase/firestore";
import { analytics, db } from "../firebase/firebase";
import { useUser } from "../context/UserContext";
import generateId from "../utils/generateIds";
import API_BASE_URL from "../services/config";
import { LinearGradient } from 'expo-linear-gradient';
import ChatHeader from "../components/ChatHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MessageSuggestion from "../components/MessageSuggestion";
import { logEvent } from "firebase/analytics";

const MessageScreen = ({ route, navigation }) => {
  //const [userInfo, setUserInfo] = useState({});
  const { userInfo, setUserInfoToStore, fetchUserDetails } = useUser();
  const { params: { userDetails } } = route;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [lastMessage, setLastMessage] = useState("");
  const [scrollToEnd, setScrollToEnd] = useState(false); // To scroll to the end of the chat
  const [showModal, setShowModal] = useState(false); // State for the modal
  const [webviewUrl, setWebviewUrl] = useState(
    "https://subham-routray.mojo.page/odicult-subscription"
  );
  console.log("messages", messages)
  const isWeb = Platform.OS === 'web';
  const combinedUid = generateId(userInfo.firebaseId, userDetails.id);

  useEffect(() => {
    const fetchStateThing = async () => {
      const existingUserInfo = await AsyncStorage.getItem('userInfo');
      let userInfo = existingUserInfo ? JSON.parse(existingUserInfo) : {};
    }
    const matchDocRef = doc(db, "matches", combinedUid);
    getDoc(matchDocRef)
      .then((docSnapshot) => {
        if (!docSnapshot.exists()) {
          const sanitizedUserInto = {
            image: userInfo.image,
            email: userInfo.email,
            phone: userInfo.phone,
            id: userInfo.firebaseId,
            name: userInfo.name,
          };
          setDoc(doc(db, "matches", combinedUid), {
            users: {
              [userInfo.firebaseId]: sanitizedUserInto,
              [userDetails.id]: userDetails,
            },
            usersMatched: [userInfo.firebaseId, userDetails.id],
            timestamp: serverTimestamp(),
          });
        }
      })
      .catch((error) => {
        console.error("Error checking document existence:", error);
      });

    onSnapshot(
      query(
        collection(db, "matches", combinedUid, "messages"),
        orderBy("timestamp", "desc")
      ),
      (snapshot) =>
        setMessages(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        )
    );
    fetchStateThing()
  }, [db]);


  const scrollFlatListToEnd = () => {
    setScrollToEnd(true);
    setTimeout(() => setScrollToEnd(false), 100); // Delay to ensure scrolling to end works
  };

  const handleSendMessage = async () => {
    if (userInfo.coins === 0 && userInfo.subscriptionStartDate === "NA") {
      setShowModal(true); // Show the modal

    }
    else {
      if (input !== "") {
        const combinedUid = generateId(userInfo.firebaseId, userDetails.id);
        await addDoc(collection(db, "matches", combinedUid, "messages"), {
          timestamp: serverTimestamp(),
          userId: userInfo.firebaseId,
          name: userInfo.name,
          photoURL: userDetails.pic || null,
          message: input,
        });
        setInput("");
        scrollFlatListToEnd(); // Scroll to the end after sending a message
        // Make an API call to updateUserCoins to update the user's coins
        try {
          const response = await axios.put(
            `${API_BASE_URL}/user/updateUserCoins/${userInfo.phone}`,
            {
              coins: userInfo.coins // Reduce coins by 1
            }
          );
          const { coinsLeft } = response.data;
          setUserInfoToStore({
            coins: coinsLeft
          })
        } catch (error) {
          console.error("Error updating user coins:", error);
        }
      }
    }
  };

  const handleModalClose = () => {
    logEvent(analytics, "purchase banner changed");
    fetchUserDetails()
    setShowModal(false)
  }

  const handleSelectSuggestion = (text) => {
    setInput(text);
  };

  return (
    <>
      <ChatHeader userDetails={userDetails} navigation={navigation} />
      <LinearGradient colors={['#dddddd', '#005AAA']} style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={10}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <FlatList
              data={messages}
              inverted={true}
              style={styles.flatList}
              keyExtractor={(item) => item.id}
              renderItem={({ item: message }) =>
                message.userId === userInfo.firebaseId ? (
                  <SenderMessage key={message.id} message={message} />
                ) : (
                  <ReceiverMessage key={message.id} message={message} />
                )
              }
              onContentSizeChange={() => scrollFlatListToEnd()}
            />
          </TouchableWithoutFeedback>
          {
            true && (
              <View style={styles.suggestionsContainer}>
                <MessageSuggestion onSelectSuggestion={handleSelectSuggestion} />
              </View>
            )
          }
          <View style={[styles.messageInputContainer, isWeb && styles.messageInputContainerWeb]}>

            <TextInput
              multiline={true}
              style={styles.textInput}
              placeholder="Send a message"
              onChangeText={(value) => {
                setInput(value)
                logEvent(analytics, "message changed", value);
              }}
              value={input}
            />
            <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
        <Modal
          animationType="slide"
          transparent={true}
          visible={showModal}
          onRequestClose={handleModalClose}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Subscribe Now</Text>
                <TouchableOpacity onPress={handleModalClose}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
              {Platform.OS !== 'web' ?
                <WebView source={{ uri: webviewUrl }} style={styles.webView} /> :
                <iframe src={webviewUrl} height={'100%'} width={'100%'} />}
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  flatList: {
    paddingLeft: 16,
  },
  messageInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#63B3ED',
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    height: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3182CE',
  },
  webView: {
    flex: 1,
  },
  messageInputContainerWeb: {
    position: 'fixed', // Fix position to bottom on web
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'white', // or any desired color
  },
  suggestionsContainer: {
    position: 'fixed',
    bottom: 80, // You should adjust this value based on the height of messageInputContainer + some offset
    width: '100%',
    zIndex: 2,  // Ensure the suggestions are above the FlatList
  },
});

export default MessageScreen;