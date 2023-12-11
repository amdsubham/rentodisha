import { ActivityIndicator, View } from 'react-native'
import React, { Component } from 'react'

export default class Loading extends Component {
    render() {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#005AAA',
                }}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
        )
    }
}
