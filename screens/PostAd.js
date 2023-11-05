import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    Switch,
    StyleSheet,
    Button,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RNPickerSelect from 'react-native-picker-select';
import * as ImagePicker from 'expo-image-picker'; // For image upload
import { RNS3 } from 'react-native-aws3'; // For S3 upload
import { useUser } from '../context/UserContext';
import axios from 'axios';
import Toast from 'react-native-toast-message'; // Import the toast library
import API_BASE_URL from '../services/config';
import { useNavigation, } from '@react-navigation/native';
import { AuthOpen } from '../hooks/useAuth';

export default function PostAdScreen({ route }) {
    const navigation = useNavigation();
    const { userToken, userDetails, userInfo } = useUser();
    const [images, setImages] = useState([]); // Store image URIs
    const [location, setLocation] = useState(route.params?.ad?.location || null);
    const [adTitle, setAdTitle] = useState(route.params?.ad?.adTitle || '');
    const [adDescription, setAdDescription] = useState(route.params?.ad?.adDescription || '');
    const [phone, setPhone] = useState(route.params?.ad?.phone || '');
    const [email, setEmail] = useState(route.params?.ad?.email || '');
    const [price, setPrice] = useState(route.params?.ad?.price || 0);
    const [maxResidents, setMaxResidents] = useState(route.params?.ad?.maxResidents || 1);
    const [preference, setPreference] = useState(route.params?.ad?.preference || null);
    const [isMaleOnly, setIsMaleOnly] = useState(route.params?.ad?.isMaleOnly || false);
    const [isFurnished, setIsFurnished] = useState(route.params?.ad?.isFurnished || false);
    const [hasAttachedBathroom, setHasAttachedBathroom] = useState(
        route.params?.ad?.hasAttachedBathroom || false
    );
    const [isBachelorsAllowed, setIsBachelorsAllowed] = useState(
        route.params?.ad?.isBachelorsAllowed || false
    );
    const [loading, setLoading] = useState(false); // Loading state
    const handleImageUpload = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            alert('Permission to access camera roll is required!');
            return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
            multiple: true, // Allow selecting multiple images
        });
        if (!pickerResult.cancelled) {
            // Create a new array with the selected image URIs
            const newImages = [...images, pickerResult.assets[0].uri];
            setImages(newImages);
        }
    };

    const uploadImagesToS3 = async () => {

        Toast.show({
            type: 'error',
            text1: 'Error Uploading Image',
            text2: 'Please try again later.',
        });
        let s3Images = [];

        for (const imageUri of images) {
            const options = {
                keyPrefix: 'uploads/',
                bucket: 'primecaves',
                region: 'ap-south-1',
                accessKey: 'AKIARM6FSFR7MWP7YQUY',
                secretKey: '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',
                successActionStatus: 201,
            };
            const file = {
                uri: imageUri,
                name: `${userToken.toString()}-${Date.now()}.jpeg`,
                type: 'image/jpeg',
            };

            try {
                const response = await RNS3.put(file, options);
                if (response.status !== 201) {
                    throw new Error('Failed to upload image to S3');
                }

                const s3ImageUrl = response.body.postResponse.location;
                s3Images.push(s3ImageUrl);
            } catch (error) {
                console.error('Error uploading image:', error);
                // Show a toast message for the error
                Toast.show({
                    type: 'error',
                    text1: 'Error Uploading Image',
                    text2: 'Please try again later.',
                });

            }
        }

        return s3Images;
    };


    const handleSubmit = async () => {
        try {
            let s3Images = [];
            // Upload images to S3 and wait for the operation to complete
            if (images) {
                s3Images = await uploadImagesToS3();
            }
            const postData = {
                images: s3Images,
                location,
                adTitle,
                adDescription,
                phone,
                email,
                maxResidents,
                preference,
                isMaleOnly,
                isFurnished,
                hasAttachedBathroom,
                isBachelorsAllowed,
                price,
                userId: userDetails._id,
                user: {
                    firebaseId: userInfo.firebaseId,
                    gender: userDetails.gender,
                    image: userDetails.image,
                    name: userDetails.name,
                    phone: userDetails.phoneNumber
                }
            };
            setLoading(true);
            if (route.params?.ad) {
                // If route.params.ad exists, it means we're updating an existing ad
                const response = await axios.put(
                    `${API_BASE_URL}/rentpost/update/${route.params.ad._id}`,
                    postData
                );

                // Check the response status and show a success or error toast
                if (response.status === 200) {
                    // Ad updated successfully
                    console.log('Rental post updated successfully.');
                    Toast.show({
                        type: 'success',
                        text1: 'Rental Post Updated',
                        text2: 'Your rental post has been successfully updated.',
                    });
                    navigation.navigate('HomeTabNavigator');
                } else {
                    console.error('Failed to update rental post.');
                    Toast.show({
                        type: 'error',
                        text1: 'Error Updating Rental Post',
                        text2: 'Please try again later.',
                    });
                }
            } else {
                // If route.params.ad does not exist, it means we're creating a new ad
                const response = await axios.post(`${API_BASE_URL}/rentpost/create`, postData);

                // Check the response status and show a success or error toast
                if (response.status === 201) {
                    // Ad created successfully
                    console.log('Rental post created successfully.');
                    Toast.show({
                        type: 'success',
                        text1: 'Rental Post Created',
                        text2: 'Your rental post has been successfully created.',
                    });
                    // navigation.navigate('HomeTabNavigator')
                    navigation.goBack()
                } else {
                    console.error('Failed to create rental post.');
                    Toast.show({
                        type: 'error',
                        text1: 'Error Creating Rental Post',
                        text2: 'Please try again later.',
                    });
                }
            }
        } catch (error) {
            console.error('Error:', error);
            // Handle error appropriately (e.g., show an error message to the user)
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please try again later.',
            });
        } finally {
            // Set loading state back to false when done
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.imageContainer}>
                {/* Custom back button with Ionicons */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#007DBC" />
                </TouchableOpacity>
                {/* ... Your existing JSX ... */}
            </View>
            <View style={styles.imageContainer}>
                <Text style={styles.heading}>Upload Photos</Text>
                <TouchableOpacity style={styles.imageUploadButton} onPress={handleImageUpload}>
                    <Text style={styles.uploadButtonText}>Select Images</Text>
                </TouchableOpacity>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {images.map((imageUri, index) => (
                        <Image key={index} source={{ uri: imageUri }} style={styles.image} />
                    ))}
                </ScrollView>
            </View>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Location</Text>
                <RNPickerSelect
                    placeholder={{ label: 'Select Location', value: null }}
                    onValueChange={(value) => setLocation(value)}
                    items={[
                        { label: 'Patia', value: 'Patia' },
                        { label: 'Nayapali', value: 'Nayapali' },
                        { label: 'CSpur', value: 'CSpur' },
                        { label: 'Master Canteen', value: 'Master Canteen' },
                    ]}
                    style={pickerSelectStyles}
                    value={location}
                />
            </View>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Ad Title</Text>
                <TextInput
                    style={styles.input}
                    value={adTitle}
                    onChangeText={setAdTitle}
                    placeholder="Enter Ad Title"
                />
            </View>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Ad Description</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={adDescription}
                    onChangeText={setAdDescription}
                    multiline
                    placeholder="Enter Ad Description"
                />
            </View>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="numeric"
                    placeholder="Enter Phone Number"
                />
            </View>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    placeholder="Enter Email"
                />
            </View>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Price</Text>
                <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    placeholder="Enter Price"
                />
            </View>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Maximum Residents</Text>
                <View style={styles.stepperContainer}>
                    <TouchableOpacity
                        style={styles.stepperButton}
                        onPress={() => maxResidents > 1 && setMaxResidents(maxResidents - 1)}
                    >
                        <Text style={styles.stepperButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{maxResidents}</Text>

                    <TouchableOpacity
                        style={styles.stepperButton}
                        onPress={() => setMaxResidents(maxResidents + 1)}
                    >
                        <Text style={styles.stepperButtonText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Preference</Text>
                <RNPickerSelect
                    value={preference}
                    placeholder={{ label: 'Select Preference', value: null }}
                    onValueChange={(value) => setPreference(value)}
                    items={[
                        { label: 'Family', value: 'Family' },
                        { label: 'Student', value: 'Student' },
                        { label: 'Working Professional', value: 'Working Professional' },
                    ]}
                    style={pickerSelectStyles}

                />
            </View>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Room for Male Only</Text>
                <Switch
                    value={isMaleOnly}
                    onValueChange={setIsMaleOnly}
                    trackColor={{ false: '#ccc', true: '#007DBC' }}
                />
            </View>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Furnishing</Text>
                <Switch
                    value={isFurnished}
                    onValueChange={setIsFurnished}
                    trackColor={{ false: '#ccc', true: '#007DBC' }}
                />
            </View>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Attached Bathroom</Text>
                <Switch
                    value={hasAttachedBathroom}
                    onValueChange={setHasAttachedBathroom}
                    trackColor={{ false: '#ccc', true: '#007DBC' }}
                />
            </View>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Bachelors Allowed</Text>
                <Switch
                    value={isBachelorsAllowed}
                    onValueChange={setIsBachelorsAllowed}
                    trackColor={{ false: '#ccc', true: '#007DBC' }}
                />
            </View>
            <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading} // Disable the button while loading
            >
                <Text style={styles.submitButtonText}>{loading ? 'Loading...' : 'Submit'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#007DBC',
    },
    imageContainer: {
        marginBottom: 20,
    },
    imageUploadButton: {
        backgroundColor: '#007DBC',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        bottom: 8,
    },
    uploadButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    image: {
        width: 100,
        height: 100,
        marginRight: 10,
        borderRadius: 5,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#007DBC',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
    },
    multilineInput: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepperButton: {
        backgroundColor: '#007DBC',
        padding: 8,
        borderRadius: 20,
        marginHorizontal: 5,
    },
    stepperButtonText: {
        color: 'white',
        fontSize: 18,
    },
    stepperValue: {
        fontSize: 16,
    },
    submitButton: {
        backgroundColor: '#007DBC',
        padding: 16,
        borderRadius: 5,
        alignItems: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
});


const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingVertical: 12,
        paddingHorizontal: 10,
        paddingRight: 30, // to ensure the text is never behind the icon
        marginBottom: 20,
    },
    inputAndroid: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingVertical: 10,
        paddingHorizontal: 10,
        paddingRight: 30, // to ensure the text is never behind the icon
        marginBottom: 20,
    },
});
