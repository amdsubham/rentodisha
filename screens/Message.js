import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { WebView } from 'react-native-webview';
import axios from "axios"; // Import Axios for making API requests
import { doc, getDoc, setDoc } from "firebase/firestore";
import tw from "tailwind-rn";
import ReceiverMessage from "../components/ReceiverMessage";
import Icon from 'react-native-vector-icons/Ionicons';
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
//import MessageSuggestion from "../components/MessageSuggestion";
import { logEvent } from "firebase/analytics";
import CoinModal from "../components/CoinModal";
import { customEvent } from "vexo-analytics";
import { isSuspiciousText } from "../utils/generalUtils";

const MessageScreen = ({ route, navigation }) => {
  const flatListRef = useRef();
  const [userInfo, setUserInfo] = useState({ coins: 2 });
  const { userInfo: userInfoFromAsync, setUserInfoToStore, fetchUserDetails, } = useUser();
  const { params: { userDetails } } = route;
  const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConversationStarter, setConversationStarter] = useState(undefined);
  const [combinedUid, setCombinedUid] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isInputFocus, setInputFocus] = useState(false);
  const [showOneCointModal, setOneCointModal] = useState(false);
  const [webviewUrl, setWebviewUrl] = useState(
    "https://subham-routray.mojo.page/odicult-subscription"
  );
  const [isLoading, setIsLoading] = useState(true);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    fetchUserInitialDetails();
  }, [db, combinedUid, userInfoFromAsync]);

  useEffect(() => {
    if (userInfo?.coins === 1) {
      setOneCointModal(true)
    }
    if (userInfo?.coins === 0) {
      setShowModal(true)
    }
  }, [userInfo?.coins]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      const firstMessage = messages[messages.length - 1]; // Since it's an inverted list, the first message will be the last element in the array.
      setConversationStarter(firstMessage.userId === userInfo.firebaseId);
    }
  }, [messages]);

  const handleCloseRequestDetailsModal = () => {
    setShowRequestDetailsModal(false);
  };

  const handleRequestDetails = () => {
    handleCloseRequestDetailsModal();
  };


  const fetchUserInitialDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/getUserByFirebaseId/${userInfoFromAsync.firebaseId}`);
      if (response.ok) {
        const userInfo = await response.json();
        const combinedUid = generateId(userInfo.firebaseId, userDetails.id);
        setCombinedUid(combinedUid)
        setUserInfo(userInfo)
        setMatchUsers(combinedUid, userInfo)
      } else {
        console.error('Failed to fetch user details');
        setIsLoading(false); // Set loading to false even if there is an error
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setIsLoading(false); // Set loading to false even if there is an error
    }
  };

  const setMatchUsers = (combinedUid, userInfo) => {
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
        if (fetchedMessages.length === 0 && !showModal) {
          setShowRequestDetailsModal(true);
          setShowModal(false)
        }
        setMessages(fetchedMessages);
        setIsLoading(false);
      }
    );
  }

  const scrollFlatListToEnd = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleSendMessage = async (text) => {
    const value = text || input
    if (value === "") {
      return; // Do nothing if the input is empty
    }
    if (isConversationStarter && isSuspiciousText(value) && userInfo.subscriptionStartDate === "NA") {
      Alert.alert(
        "Subscription Required",
        "You need to subscribe to send phone numbers.",
        [
          {
            text: "Subscribe",
            onPress: () => {
              setShowModal(true);
            }
          },
          {
            text: "Cancel",
            onPress: () => console.log("Cancel Pressed"),
            style: "cancel"
          }
        ],
        { cancelable: false }
      );
      return;
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
        message: value,
      });
      setInput('')
      setShowRequestDetailsModal(false)
      try {
        const oneSignalResponse = await axios.post(`${API_BASE_URL}/user/sendNotification`, {
          userIds: [userDetails.phone],
          message: `You have a new message from ${userInfo.name || ''}`,
          data: {
            type: "NEW_MESSAGE",
            email: userInfo.email,
            id: userInfo.firebaseId,
            name: userInfo.name,
            phone: userInfo.phoneNumber,
            firebaseId: userInfo.firebaseId,
            pic: userInfo.image || "", // Handle null values
            // timestampSeconds: userInfo.timestamp.seconds.toString(),
            // timestampNanoseconds: userInfo.timestamp.nanoseconds.toString(),
          },
        });
      } catch (error) {
        console.error("OneSignal Error:", error);
      }
      if (isConversationStarter) {
        if (userInfo.coins > 0) {
          const updatedCoins = Math.max(userInfo.coins - 1, 0);  // Deduct one coin
          await axios.put(`${API_BASE_URL}/user/updateUserCoins/${userInfo.phoneNumber}`, {
            coins: userInfo.coins,
          });
          setUserInfo((prevUserInfo) => ({
            ...prevUserInfo,
            coins: updatedCoins,
          }));
          setUserInfoToStore({
            ...userInfo,
            coins: updatedCoins,
          });
        } else {
          Alert.alert("You do not have enough coins to send a message.");
          return;
        }
      }
      fetchMessages();
      setInput("");
      // scrollFlatListToEnd();
    } catch (error) {
      console.error("Error sending message or updating coins:", error);
      Alert.alert("Message sending failed");
    }
  };

  const handleModalClose = () => {
    logEvent(analytics, "purchase banner changed");
    customEvent("purchase banner changed");
    fetchUserDetails()
    setShowModal(false)
  }

  const handleSelectSuggestion = (text) => {
    setInput(text);
  };

  if (isLoading || userInfoFromAsync == null) {
    return (
      <LinearGradient colors={['#dddddd', '#005AAA']} style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="white" />
      </LinearGradient>
    );
  }

  const handleTakePremium = () => {
    setOneCointModal(false)
    setShowModal(true)

  }
  return (
    <>
      {<View style={{ height: '10%', backgroundColor: '#006699' }} >
        <ChatHeader coins={userInfo?.coins} userDetails={userDetails} navigation={navigation} />
      </View>}
      <LinearGradient colors={['#dddddd', '#005AAA']} style={{ height: '80%' }} >
        <FlatList
          ref={flatListRef}
          data={messages}
          contentContainerStyle={{
            flexGrow: 1,
          }}
          inverted={true}
          style={Platform.OS === 'web' && styles.flatList}
          keyExtractor={(item) => item.id}
          renderItem={({ item: message }) =>
            message.userId === userInfo.firebaseId ? (
              <SenderMessage key={message.id} message={message} />
            ) : (
              <ReceiverMessage key={message.id} message={message} />
            )
          }
        />
      </LinearGradient>
      <LinearGradient colors={['#005AAA', '#dddddd',]} style={{ ...styles.inputSection, height: "10%" }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={10}
        >
          {/* {
            messages.length === 0 && (
              <View style={styles.suggestionsContainer}>
                <MessageSuggestion onSelectSuggestion={handleSelectSuggestion} />
              </View>
            )
          } */}
          <View style={[styles.messageInputContainer, isWeb && styles.messageInputContainerWeb]}>
            <TextInput
              multiline={true}
              style={styles.textInput}
              placeholder="Send a message"
              onChangeText={(value) => {
                setInput(value)
                // logEvent(analytics, "message changed", value);
              }}
              onFocus={() => setInputFocus(true)}
              onBlur={() => setInputFocus(false)}
              value={input}
            />
            <TouchableOpacity onPress={() => handleSendMessage()} style={styles.sendButton}>
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
      {showRequestDetailsModal && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showRequestDetailsModal}
          onRequestClose={handleCloseRequestDetailsModal}
        >
          <View style={modalStyles.container}>
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={handleCloseRequestDetailsModal}>
              <Icon
                name="close"
                size={24}
                color="#000"
              />
            </TouchableOpacity>
            <Text style={modalStyles.title}>Start the Conversation</Text>
            <Text style={modalStyles.messagePreview}>Hi there! I'm interested in your ad.</Text>
            <Image style={{ height: 400, width: 200, bottom: 10 }} source={require('../assets/images/convInt.png')} />
            <TouchableOpacity
              style={modalStyles.sendButton}
              onPress={() => handleSendMessage("Hi there! I'm interested in your ad.")}
            >
              <Text style={modalStyles.buttonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {showOneCointModal &&
        <CoinModal
          coins={userInfo?.coins}
          onTakePremium={handleTakePremium}
          isVisible={showOneCointModal}
          onClose={() => setOneCointModal(false)}
        />}
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
    backgroundColor: 'white',
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
    // position: 'fixed',
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
    flex: 1, // Takes all available space except for the input section
  },
  modalCenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent background
  },
  modalView: {
    margin: 20,
    width: '80%', // Set width
    backgroundColor: "white",
    borderRadius: 10,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalCloseButton: {
    position: "absolute",
    right: 10,
    top: 10,
  },
});

const modalStyles = StyleSheet.create({
  container: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 6, // Increased for effect
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  messagePreview: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
  },
  imageStyle: {
    height: 350,
    width: 175,
    marginBottom: 20,
    alignSelf: 'center'
  },
  sendButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000", // Optional shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: {
    color: "white",
    marginLeft: 10,
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    right: 10,
    top: 10,
    padding: 10,
  },
});
export default MessageScreen;
