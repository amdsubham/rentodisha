import * as React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default class TextAnimator extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            textArr: props.content.trim().split(' '),
            animatedValues: [],
        };
        this.state.textArr.forEach((_, i) => {
            this.state.animatedValues[i] = new Animated.Value(0);
        });
    }

    componentDidMount() {
        this.animate();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.content !== this.props.content) {
            this.setState({
                textArr: this.props.content.trim().split(' '),
                animatedValues: this.props.content.trim().split(' ').map(() => new Animated.Value(0)),
            }, () => {
                this.animate();
            });
        }
    }

    animate = (toValue = 1) => {
        const animations = this.state.textArr.map((_, i) => {
            return Animated.timing(this.state.animatedValues[i], {
                toValue,
                duration: this.props.duration,
                useNativeDriver: true
            });
        });

        Animated.stagger(
            this.props.duration / 5,
            toValue === 0 ? animations.reverse() : animations
        ).start(() => {
            setTimeout(() => this.animate(toValue === 0 ? 1 : 0), 1000);
            if (this.props.onFinish) {
                this.props.onFinish();
            }
        });
    };

    render() {
        return (
            <View style={[this.props.style, styles.textWrapper]}>
                {this.state.textArr.map((word, index) => {
                    return (
                        <Animated.Text
                            key={`${word}-${index}`}
                            style={[
                                this.props.textStyle,
                                {
                                    opacity: this.state.animatedValues[index],
                                    transform: [
                                        {
                                            translateY: Animated.multiply(
                                                this.state.animatedValues[index],
                                                new Animated.Value(-5)
                                            )
                                        }
                                    ],
                                },
                            ]}
                        >
                            {word}
                            {`${index < this.state.textArr.length - 1 ? ' ' : ''}`}
                        </Animated.Text>
                    );
                })}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    textWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center'
    }
});
