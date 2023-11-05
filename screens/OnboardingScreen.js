import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'
import React from 'react'
import Onboarding from 'react-native-onboarding-swiper';
import Lottie from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { setItem } from '../utils/asyncStorage';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
    const navigation = useNavigation();

    const handleDone = () => {
        navigation.navigate('Home');
        setItem('onboarded', '1');
    }

    const doneButton = ({ ...props }) => {
        return (
            <TouchableOpacity style={styles.doneButton} {...props}>
                <Text>Done</Text>
            </TouchableOpacity>
        )

    }
    return (
        <View style={styles.container}>
            <Onboarding
                onDone={handleDone}
                onSkip={handleDone}
                // bottomBarHighlight={false}
                DoneButtonComponent={doneButton}
                containerStyles={{ paddingHorizontal: 15 }}
                pages={[
                    {
                        backgroundColor: '#003366',

                        image: (
                            <View style={styles.lottie}>
                                <Lottie source={require('../assets/animations/nearbyRooms.json')} autoPlay loop />
                            </View>
                        ),
                        title: 'Nearby Rooms',
                        subtitle: 'Discover rooms close to your current location easily.',
                    },
                    {
                        backgroundColor: '#006699',
                        image: (
                            <View style={styles.lottie}>
                                <Lottie source={require('../assets/animations/directMessageFlatmates.json')} autoPlay loop />
                            </View>
                        ),
                        title: 'Direct Message Flatmate',
                        subtitle: 'Contact flatmates directly, no broker in between.',
                    },
                    {
                        backgroundColor: '#0099CC',
                        image: (
                            <View style={styles.lottie}>
                                <Lottie source={require('../assets/animations/verifiedListings.json')} autoPlay loop />
                            </View>
                        ),
                        title: 'Verified Listings',
                        subtitle: '100% verified rooms with 1000+ users trusted.',
                    },
                ]}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    lottie: {
        width: width * 0.9,
        height: width
    },
    doneButton: {
        padding: 20,
        // backgroundColor: 'white',
        // borderTopLeftRadius: '100%',
        // borderBottomLeftRadius: '100%'
    }
})