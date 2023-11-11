import React, { useEffect, useCallback, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Platform,
    ActivityIndicator,
    Image,
    ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RNS3 } from 'react-native-aws3';
import { useUser } from '../context/UserContext';
import API_BASE_URL from '../services/config';
import Toast from 'react-native-toast-message';
import Autocomplete from 'react-native-autocomplete-input';
import { AuthOpen } from '../hooks/useAuth'
import { serverTimestamp, updateDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth, updateProfile as updateAuthProfile } from 'firebase/auth';
import { db } from '../firebase/firebase';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import maleIcon from '../assets/images/male.png';
import femaleIcon from '../assets/images/female.png';
import student from '../assets/images/student.png';
import professionals from '../assets/images/professionals.png';
import family from '../assets/images/family.png';
const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];

const UpdateProfileModal = ({ isVisible, onDismiss, isUserExists }) => {
    const { setUserInfoToStore } = useUser()
    const { userToken, userInfo } = useUser();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState('');
    const [gender, setGender] = useState('');
    const [tenantType, setTenantType] = useState('');
    const [image, setImage] = useState(null);
    const [isLoading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [fieldsDisabled, setFieldsDisabled] = useState(true);
    const [userLocation, setUserLocation] = useState(''); // State variable to store user's location
    const handleGenderSelect = (selectedGender) => {
        setGender(selectedGender);
    };

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                // Handle permission denied or other errors
                console.error('Location permission denied.');
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            setUserLocation(location); // Store user's location in state
        } catch (error) {
            console.error('Error getting user location:', error);
        }
    };

    const updateProfileToFirebase = async ({ name, pic, email, isEdit }) => {
        try {
            const newDocRef = doc(db, 'user_profiles', userInfo.firebaseId);
            const handler = isEdit ? updateDoc : setDoc;
            await handler(newDocRef, {
                id: userInfo.firebaseId,
                name,
                pic,
                email,
                phone: userToken.toString(),
                timestamp: serverTimestamp(),
            });
            const auth = getAuth();
            await updateAuthProfile(auth.currentUser, {
                displayName: name,
                photoURL: pic,
            });
            console.log('Updated to Firestore and Firebase Authentication');
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleTenantTypeSelect = (selectedType) => {
        setTenantType(selectedType);
    };

    const handleChooseImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            alert('Permission to access media library is required!');
            return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!pickerResult.cancelled) {
            const selectedImageUri = pickerResult.assets[0].uri;
            setImage(selectedImageUri);
        }
    };

    const handleEmailChange = (text) => {
        setEmail(text);
        const query = text.split('@')[1];
        const filteredDomains = domains.filter((domain) => domain.includes(query));
        setSuggestions(filteredDomains);
    };

    const handleUpdate = useCallback(async () => {
        setLoading(true);
        let s3ImageUrl = null;
        const isEdit = userId !== ''
        try {
            if (image) {
                const options = {
                    keyPrefix: 'uploads/',
                    bucket: 'primecaves',
                    region: 'ap-south-1',
                    accessKey: 'AKIARM6FSFR7MWP7YQUY',
                    secretKey: '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',
                    successActionStatus: 201,
                };
                let file;
                if (Platform.OS === 'web') {
                    const blob = await fetch(image).then((res) => res.blob());
                    file = {
                        uri: image,
                        name: `${userToken.toString()}.jpeg`,
                        type: 'image/jpeg',
                        blob,
                    };
                } else {
                    file = {
                        uri: image,
                        name: `${userToken.toString()}.jpeg`,
                        type: 'image/jpeg',
                    };
                }
                const response = await RNS3.put(file, options);
                if (response.status !== 201) {
                    throw new Error('Failed to upload image to S3');
                }
                s3ImageUrl = response.body.postResponse.location;
            }
            const apiEndpoint = isEdit
                ? `${API_BASE_URL}/user/update/${userId}`
                : `${API_BASE_URL}/user/register`;
            const method = isEdit ? 'PUT' : 'POST'
            const response = await fetch(apiEndpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tenantType,
                    image,
                    name,
                    email,
                    gender,
                    phoneNumber: userToken.toString(),
                    firebaseId: userInfo.firebaseId,
                    location: userLocation,
                }),
            });

            if (response.ok) {
                const responseData = await response.json();
                onDismiss();
                updateProfileToFirebase({ name, pic: image, email, isEdit })
                setUserInfoToStore({
                    name, image, email,
                    gender,
                    phone: userToken.toString(),
                    firebaseId: userInfo.firebaseId,
                    tenantType,
                    subscriptionStartDate: isEdit ? userInfo.subscriptionStartDate : 'NA',
                    location: userLocation,
                })
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Profile saved successfully',
                });

            } else {
                console.error('Save failed');
            }
        } catch (error) {
            console.error('Error during save:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Profile failed to save',
            });
        } finally {
            setLoading(false);
        }
    }, [userToken, name, email, gender, image, tenantType]);

    useEffect(() => {
        requestLocationPermission();
        if (isVisible && isUserExists) {
            setFieldsDisabled(true);
            const fetchUserDetails = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/user/getUserByPhoneNumber/${userToken.toString()}`);
                    if (response.ok) {
                        const userData = await response.json();
                        setName(userData.name || '');
                        setEmail(userData.email || '');
                        setGender(userData.gender || '');
                        setTenantType(userData.tenantType || '');
                        setUserId(userData._id || '');
                        setFieldsDisabled(false);
                    } else {
                        console.error('Failed to fetch user details');
                    }
                } catch (error) {
                    console.error('Error fetching user details:', error);
                    setFieldsDisabled(false);
                }
            };

            fetchUserDetails();
        }
    }, [isVisible, userToken]);


    const updateButtonStyle = [
        styles.actionButton,
        { backgroundColor: '#007DBC', left: 5 }, // Set background color to #007DBC
    ];

    return (
        <Modal visible={false} transparent={true} animationType="slide">
            <View style={styles.modalContainer}>
                <LinearGradient // Use LinearGradient for the gradient background
                    colors={['#007DBC', '#005CA1']} // Gradient colors
                    style={styles.linearGradient}
                >
                    <View style={styles.modalContent}>
                        {isUserExists && ( // Conditionally render the close icon
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={onDismiss}
                            >
                                <MaterialCommunityIcons
                                    name="close"
                                    size={24}
                                    color="white" // Set the close icon color to white
                                />
                            </TouchableOpacity>
                        )}
                        <Text style={styles.modalTitle}>Update Profile</Text>
                        <View style={styles.chooseImageButton}>
                            <MaterialCommunityIcons
                                name="camera"
                                size={24}
                                color="#007DBC"
                                style={{ marginRight: 8 }}
                            />
                            <Text style={styles.chooseImageText}>Choose Image</Text>
                        </View>
                        {image && (
                            <Image
                                source={{ uri: image }}
                                style={styles.profileImage}
                            />
                        )}
                        <TextInput
                            style={styles.input}
                            placeholder="Name"
                            placeholderTextColor={"#E7E0C3"}
                            value={name}
                            onChangeText={(text) => setName(text)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            textContentType="emailAddress"
                            placeholderTextColor={"#E7E0C3"}
                            value={email}
                            onChangeText={handleEmailChange}
                        />
                        <View style={styles.genderContainer}>
                            <Text style={styles.label}>Gender</Text>
                            <View style={styles.radioButtons}>
                                <TouchableOpacity
                                    onPress={() => handleGenderSelect('male')}
                                    style={[
                                        styles.radioButton,
                                        gender === 'male' ? styles.radioButtonSelected : null,
                                    ]}
                                >
                                    <Image
                                        source={maleIcon}
                                        style={{ width: 24, height: 24 }}
                                    />
                                    <Text style={gender === 'male' ? styles.radioButtonTextSelected : styles.radioButtonText}>Male</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleGenderSelect('female')}
                                    style={[
                                        styles.radioButton,
                                        gender === 'female' ? styles.radioButtonSelected : null,
                                    ]}
                                >
                                    <Image
                                        source={femaleIcon}
                                        style={{ width: 24, height: 24 }}
                                    />
                                    <Text style={gender === 'female' ? styles.radioButtonTextSelected : styles.radioButtonText}>Female</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.tenantTypeContainer}>
                            <Text style={styles.label}>I am</Text>
                            <View style={styles.radioButtonsTenantType}>
                                <TouchableOpacity
                                    onPress={() => handleTenantTypeSelect('student')}
                                    style={[
                                        styles.radioButtonTenantType,
                                        tenantType === 'student' ? styles.radioButtonSelected : null,
                                    ]}
                                >
                                    <Image
                                        source={student}
                                        style={{ width: 24, height: 24 }}
                                    />
                                    <Text style={tenantType === 'student' ? styles.radioButtonTextSelected : styles.radioButtonText}>Student</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleTenantTypeSelect('professional')}
                                    style={[
                                        styles.radioButtonTenantType,
                                        tenantType === 'professional' ? styles.radioButtonSelected : null,
                                    ]}
                                >
                                    <Image
                                        source={professionals}
                                        style={{ width: 24, height: 24 }}
                                    />
                                    <Text style={tenantType === 'professional' ? styles.radioButtonTextSelected : styles.radioButtonText}>Working Professional</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleTenantTypeSelect('family')}
                                    style={[
                                        styles.radioButtonTenantType,
                                        tenantType === 'family' ? styles.radioButtonSelected : null,
                                    ]}
                                >
                                    <Image
                                        source={family}
                                        style={{ width: 24, height: 24, }}
                                    />
                                    <Text style={tenantType === 'family' ? styles.radioButtonTextSelected : styles.radioButtonText}>Family</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#dddddd" style={styles.loader} />
                        ) : (
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={updateButtonStyle}
                                    onPress={handleUpdate}
                                >
                                    <Text style={styles.buttonText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </LinearGradient>
            </View>
        </Modal>
    );
};
const styles = StyleSheet.create({
    tenantTypeContainer: {
        width: '100%',
        marginBottom: 10,
    },
    actionButton: {
        padding: 10,
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
    },
    loader: {
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        fontFamily: 'open-sans-bold'
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginTop: 10,
    },
    scrollViewContent: {
        flexGrow: 1, // Allow the content to grow vertically
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    linearGradient: {
        width: '80%', // Set the width to 100% to cover the entire modal
    },
    modalContent: {
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: 'transparent', // Make the content background transparent
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: 'white', // Set the text color to white
        fontFamily: 'open-sans-regular',
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: 'white', // Set the border color to white
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        fontSize: 16,
        backgroundColor: 'transparent', // Make the input background transparent
        color: 'white', // Set the text color to white
        fontFamily: 'open-sans-light',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1,
    },
    chooseImageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    chooseImageText: {
        color: '#007DBC',
        fontFamily: 'open-sans-bold'
    },
    genderContainer: {
        width: '100%',
        marginBottom: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: 'white'
    },
    radioButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

    },
    radioButton: {
        flexDirection: 'row', // Make it horizontal
        alignItems: 'center',
        borderWidth: 0.4,
        borderRadius: 5,
        padding: 10,
        marginRight: 10,
    },
    radioButtonSelected: {
        borderColor: '#dddddd',
        borderRadius: 5,
        borderWidth: 1,
        backgroundColor: '#007DBC', // Set background color to blue on selection
    },
    radioButtonText: {
        color: 'white',
        fontFamily: 'open-sans-regular',
        marginLeft: 10,
    },
    radioButtonTextSelected: {
        color: 'white', // Set text color to white on selection
        marginLeft: 10, // Add margin to separate text from icon
        fontFamily: 'open-sans-regular'

    },
    radioButtonsTenantType: { // Center items vertically
        justifyContent: 'space-between',
        marginBottom: 20, // Add margin to separate options
    },

    radioButtonTenantType: {
        flexDirection: 'row',
        borderWidth: 0.4,
        borderRadius: 5,
        padding: 10,
        marginBottom: 10, // Add margin to separate options
    },

});

export default UpdateProfileModal;

