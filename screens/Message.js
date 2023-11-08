import React, { useEffect, useRef, useState } from "react";
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
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert
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
import MessageSuggestion from "../components/MessageSuggestion";
import { logEvent } from "firebase/analytics";

const MessageScreen = ({ route, navigation }) => {
  const flatListRef = useRef();
  const [userInfo, setUserInfo] = useState({});
  const { userInfo: userInfoFromAsync, setUserInfoToStore, fetchUserDetails } = useUser();
  const { params: { userDetails } } = route;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConversationStarter, setConversationStarter] = useState(undefined);
  const [combinedUid, setCombinedUid] = useState([]);
  const [scrollToEnd, setScrollToEnd] = useState(false); // To scroll to the end of the chat
  const [showModal, setShowModal] = useState(false); // State for the modal
  const [webviewUrl, setWebviewUrl] = useState(
    "https://subham-routray.mojo.page/odicult-subscription"
  );
  const [isLoading, setIsLoading] = useState(true);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    fetchUserInitialDetails();
  }, [db, combinedUid]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      const firstMessage = messages[messages.length - 1]; // Since it's an inverted list, the first message will be the last element in the array.
      setConversationStarter(firstMessage.userId === userInfo.firebaseId);
    }
  }, [messages]);


  const fetchUserInitialDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/getUserByFirebaseId/${userInfoFromAsync.firebaseId}`);
      if (response.ok) {
        const userInfo = await response.json();
        const combinedUid = generateId(userInfo.firebaseId, userDetails.id);
        setCombinedUid(combinedUid)
        setUserInfo(userInfo)
        setMatchUsers(combinedUid)
      } else {
        console.error('Failed to fetch user details');
        setIsLoading(false); // Set loading to false even if there is an error
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setIsLoading(false); // Set loading to false even if there is an error
    }
  };

  const setMatchUsers = (combinedUid) => {
    const matchDocRef = doc(db, "matches", combinedUid);
    getDoc(matchDocRef)
      .then((docSnapshot) => {
        if (!docSnapshot.exists()) {
          const sanitizedUserInto = {
            image: userInfo.image || null,
            email: userInfo.email,
            phone: userInfo.phoneNumber,
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
    fetchMessages()
  }

  const fetchMessages = () => {
    onSnapshot(
      query(
        collection(db, "matches", combinedUid, "messages"),
        orderBy("timestamp", "desc")
      ),
      (snapshot) => {
        const fetchedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(fetchedMessages);
        setIsLoading(false);
        // if (scrollToEnd) {
        //   scrollFlatListToEnd();
        // }
      }
    );
  }

  const scrollFlatListToEnd = () => {
    // setScrollToEnd(true);
    // setTimeout(() => setScrollToEnd(false), 200); // Delay to ensure scrolling to end works
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleSendMessage = async () => {
    if (input === "") {
      return; // Do nothing if the input is empty
    }

    // If user is the conversation starter and doesn't have coins or subscription, show the modal
    if (isConversationStarter && userInfo.coins === 0 && userInfo.subscriptionStartDate === "NA") {
      setShowModal(true);
      return;
    }

    // Process to send message
    try {
      await addDoc(collection(db, "matches", combinedUid, "messages"), {
        timestamp: serverTimestamp(),
        userId: userInfo.firebaseId,
        name: userInfo.name,
        photoURL: userInfo.pic || null,
        message: input,
      });
      setInput('')
      // If the user is the conversation starter, deduct a coin after sending a message
      if (isConversationStarter) {
        // Check if the user has enough coins to send the message
        if (userInfo.coins > 0) {
          const updatedCoins = Math.max(userInfo.coins - 1, 0);  // Deduct one coin
          await axios.put(`${API_BASE_URL}/user/updateUserCoins/${userInfo.phoneNumber}`, {
            coins: updatedCoins,
          });

          // Update the local state with the new coins value
          setUserInfo((prevUserInfo) => ({
            ...prevUserInfo,
            coins: updatedCoins,
          }));

          // Assuming setUserInfoToStore is to update the AsyncStorage or similar storage,
          // it's important to ensure that it is successful and handle the case where it's not.
          // For brevity, I'm not including error handling here.
          setUserInfoToStore({
            ...userInfo,
            coins: updatedCoins,
          });
        } else {
          // Handle the case when the user does not have enough coins.
          Alert.alert("You do not have enough coins to send a message.");
          return;
        }
      }

      fetchMessages();
      setInput("");
      scrollFlatListToEnd(); // Scroll to the end after sending a message

    } catch (error) {
      console.error("Error sending message or updating coins:", error);
      Alert.alert("Message sending failed");
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

  if (isLoading) {
    return (
      <LinearGradient colors={['#dddddd', '#005AAA']} style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="white" />
      </LinearGradient>
    );
  }

  return (
    <>
      <ChatHeader userDetails={userDetails} navigation={navigation} />
      <LinearGradient colors={['#dddddd', '#005AAA']} style={styles.container}>
        <Pressable onPress={Keyboard.dismiss}>
          <FlatList
            ref={flatListRef}
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
            onContentSizeChange={scrollFlatListToEnd}
          />
        </Pressable>
      </LinearGradient>
      <LinearGradient colors={['#005AAA', '#dddddd',]} style={styles.inputSection}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={10}
        >
          {
            messages.length === 0 && (
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
      </LinearGradient>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputSection: {
    position: 'absolute', // Input section will be positioned absolutely
    bottom: 0, // Sticks to the bottom
    width: '100%', // Full width of the screen
    padding: 10, // Optional padding
  },

  flatList: {
    // Removed paddingLeft and added flex: 1
    flex: 1, // Takes all available space except for the input section
  },
});

export default MessageScreen;