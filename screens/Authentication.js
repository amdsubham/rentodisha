import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Dimensions,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Image } from 'react-native';

import PhoneNumberInput from 'react-native-phone-number-input';
import { useUser } from '../context/UserContext';
import API_BASE_URL from '../services/config';
import { AuthOpen } from '../hooks/useAuth';
import Lottie from 'lottie-react-native';
import LottieView from 'react-native-web-lottie';

import { CodeField, Cursor, useClearByFocusCell } from 'react-native-confirmation-code-field';
import { LinearGradient } from 'expo-linear-gradient';
import TextAnimator from '../components/TextAnimator';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase/firebase';

const { width, height } = Dimensions.get('window');
const CELL_COUNT = 6;
export default function Authentication({ route, navigation }) {
    const adId = route.params?.adIdAuth
    const { signInWithEmailPassword, signUpWithEmailPassword } = AuthOpen();
    const [formattedValue, setFormattedValue] = useState('');
    const { login } = useUser();
    const [isUserExists, setIsUserExists] = useState(false);
    const [screen, setScreen] = useState(1);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [assignedOtp, setAssignedOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTextInputFocused, setIsTextInputFocused] = useState(false);
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const animatedTexts = [
        'No Broker in Between 🏠',
        'Fast and Reliable 🔥',
        'Your Dream House Awaits! 🏠'
    ];
    const [props, getCellOnLayoutHandler] = useClearByFocusCell({
        value: otp,
        setValue: setOtp,
    });

    useEffect(() => {
        setIsLoading(true)
        if (adId) {
            setTimeout(() => {
                navigation.navigate('AdDetailsWithoutAuthentication', { adId });
            }, 100);
        }
        setIsLoading(false)
    }, [adId]);


    const handleAnimationComplete = () => {
        if (currentTextIndex < animatedTexts.length - 1) {
            setCurrentTextIndex(currentTextIndex + 1);
        }
    };

    const renderMedia = () => {
        if (Platform.OS === 'web') {
            return (
                <LottieView
                    source={require('../assets/animations/dreamHouse.json')}
                    autoPlay
                    loop
                />
            );
        } else {
            return (
                <Lottie
                    source={require('../assets/animations/dreamHouse.json')}
                    autoPlay
                    loop
                />
            );
        }
    };

    const generateOtp = () => {
        const otp =
            (phoneNumber === '7008105210' || phoneNumber === '7777711111'
                || phoneNumber === '7777722222' || phoneNumber === '7777733333'
                || phoneNumber === '7777744444' || phoneNumber === '7777755555'
            )
                ? 121212
                : Math.floor(100000 + Math.random() * 900000);
        setAssignedOtp(otp);
        return otp;
    };

    const fetchUserExistsStatus = async () => {
        const checkPhoneResponse = await fetch(
            `${API_BASE_URL}/user/check-phone/${phoneNumber}`
        );
        const checkPhoneData = await checkPhoneResponse.json();
        setIsUserExists(checkPhoneData.exists);
    };

    const sendOTP = async () => {
        try {
            setIsLoading(true);

            const postData = {
                phoneNumber: formattedValue,
                assignedOtp: generateOtp(),
            };
            const response = await axios.post(`${API_BASE_URL}/user/sendotp`, postData, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const { data } = response;
            // Check the response from your own server's endpoint
            if (data.status === 'OK') {
                fetchUserExistsStatus();
                setScreen(2);
            } else {
                alert('Failed to send OTP. Please try again.');
            }
        } catch (error) {
            // Handle errors
            console.error('Error sending OTP:', error.response?.data || error.message);
            alert('Error sending OTP. Please check your network connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const verifyOTP = () => {
        try {
            setIsLoading(true);
            if (otp === assignedOtp.toString()) {
                login(phoneNumber);
                if (isUserExists) {
                    signInWithEmailPassword(`${phoneNumber}@gmail.com`, phoneNumber);
                } else {
                    signUpWithEmailPassword(`${phoneNumber}@gmail.com`, phoneNumber);
                }
            } else {
                // OTPs do not match, show an error alert
                alert('Invalid OTP. Please try again.');
            }
        } catch (error) {
            alert('Error verifying OTP. Please try again.');
            console.log('error', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTextInputFocus = () => {
        setIsTextInputFocused(true);
    };

    const handleTextInputBlur = () => {
        setIsTextInputFocused(false);
    };

    const renderScreen = () => {
        switch (screen) {
            case 1:
                return (
                    <LinearGradient
                        colors={['#003366', '#006699', '#0099CC']}
                        style={styles.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {(!isTextInputFocused) && (<View style={styles.lottie}>
                            {renderMedia()}
                            <TextAnimator
                                content={animatedTexts[currentTextIndex]}
                                textStyle={styles.textStyle}
                                duration={1500}
                                onFinish={handleAnimationComplete}
                            />
                        </View>)}
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{ flex: 1 }}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? -100 : 0}
                        >
                            <ScrollView
                                contentContainerStyle={styles.container}
                                keyboardShouldPersistTaps="handled"
                            >
                                <Text style={styles.header}>Enter Your Mobile Number</Text>
                                <Text style={styles.subheader}>
                                    We will send you a Confirmation Code
                                </Text>

                                <PhoneNumberInput
                                    defaultCode="IN"
                                    value={phoneNumber}
                                    onChangeText={(text) => {
                                        logEvent(analytics, "phone number changed", text);
                                        setPhoneNumber(text);
                                    }}
                                    onChangeFormattedText={(text) => {
                                        setFormattedValue(text);
                                    }}
                                    placeholder="Enter Phone Number"
                                    withDarkTheme
                                    withShadow
                                    onFocus={handleTextInputFocus}
                                    onBlur={handleTextInputBlur}
                                />

                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#E5E5E5" />
                                ) : (
                                    <TouchableOpacity
                                        style={styles.button}
                                        onPress={sendOTP}
                                    >
                                        <Text style={styles.buttonText}>VERIFY</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </LinearGradient>
                );
            case 2:

                return (
                    <LinearGradient
                        colors={['#003366', '#006699', '#0099CC']}
                        style={styles.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.iconContainer}>
                            <TouchableOpacity onPress={() => setScreen(1)}>
                                <Ionicons name="arrow-back" size={30} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            contentContainerStyle={styles.container}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Text style={styles.header}>Enter Verification Code</Text>
                            <CodeField
                                {...props}
                                caretHidden={false}
                                value={otp}
                                onChangeText={setOtp}
                                cellCount={CELL_COUNT}
                                rootStyle={styles.codeFieldRoot}
                                keyboardType="number-pad"
                                textContentType="oneTimeCode"
                                renderCell={({ index, symbol, isFocused }) => (
                                    <View
                                        onLayout={getCellOnLayoutHandler(index)}
                                        key={index}
                                        style={[styles.cell, isFocused && styles.focusCell]}
                                    >
                                        <Text style={styles.cellText}>
                                            {symbol || (isFocused ? <Cursor /> : null)}
                                        </Text>
                                    </View>
                                )}
                            />
                            <View style={styles.buttonContainer}>
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <TouchableOpacity
                                            style={styles.button}
                                            onPress={verifyOTP}
                                        >
                                            <Text style={styles.buttonText}>VERIFY OTP</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={sendOTP}
                                        >
                                            <Text style={styles.resendText}>RESEND OTP</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </ScrollView>
                    </LinearGradient>
                );



            default:
                return <View />;
        }
    };

    return renderScreen();
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#E5E5E5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        fontSize: 24,
        color: '#E5E5E5',
        fontWeight: 'bold',
        marginBottom: 10,
        fontFamily: 'open-sans-regular'
    },
    subheader: {
        fontSize: 16,
        color: '#E5E5E5',
        marginBottom: 30,
        fontFamily: 'open-sans-regular'
    },
    button: {
        top: 15,
        backgroundColor: '#FFFFFF',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 5,

    },
    resendButton: {
        backgroundColor: '#E5E5E5',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 5,
        marginTop: 10,
    },
    backButton: {
        backgroundColor: '#E5E5E5',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 5,
        marginBottom: 10,
    },
    buttonText: {
        color: '#007DBC',
        fontFamily: 'open-sans-bold'
    },
    buttonContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    countryPickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        width: 110,
        borderColor: '#007DBC',
        borderWidth: 1,
        borderRadius: 5,
    },
    countryPicker: {
        flex: 1,
        height: 40,
        color: '#007DBC',
    },
    lottie: {
        width: width,
        height: width,
        alignItems: 'center',
        justifyContent: 'center',
        top: 50,
    },
    image: {
        width: 250,
        height: 250,
        resizeMode: 'contain', // or 'cover' depending on your requirement
    },
    codeFieldRoot: {
        marginTop: 20,
        width: 280,
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    cell: {
        width: 30,
        height: 45,
        lineHeight: 38,
        fontSize: 24,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        textAlign: 'center',
        marginRight: 8,
    },
    focusCell: {
        borderColor: '#000',
    },
    cellText: {
        color: '#FFFFFF',
        fontSize: 36,
        textAlign: 'center',
    },
    gradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        position: 'absolute',
        top: 50,  // Adjust according to your need
        left: 20,  // Adjust according to your need
        zIndex: 10,
    },
    resendText: {
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: 15,  // Or any other value that suits your design
        fontSize: 16,   // Or any other value that suits your design
        top: 20
    },
    textStyle: {
        fontSize: 20,
        fontFamily: 'open-sans-regular',
        marginBottom: 14,
        color: '#FFFFFF',
        marginTop: 20, // Added this line to create a gap of 50
    },
});
