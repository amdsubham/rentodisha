import React from 'react';
import { Image, Dimensions, StyleSheet } from 'react-native';
import Carousel from 'react-native-banner-carousel';

const BannerWidth = Dimensions.get('window').width;
const BannerHeight = 200; // Adjust the height as needed

const BannerCarousel = ({ data }) => {
    const renderPage = (image, index) => (
        <Image key={index} source={{ uri: image }} style={styles.bannerImage} />
    );

    return (
        <Carousel
            autoplay
            autoplayTimeout={5000}
            loop
            index={0}
            pageSize={BannerWidth}
        >
            {data.map((image, index) => renderPage(image, index))}
        </Carousel>
    );
};

const styles = StyleSheet.create({
    bannerImage: {
        width: BannerWidth,
        height: BannerHeight,
    },
});

export default BannerCarousel;
