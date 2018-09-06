import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';

// Local Imports
import * as CommonStyles from './styles/common'

export default class TagButton extends React.Component {
    onPress = () => {};

    constructor(props) {
        super(props);
        this.onPress = props.onPress;
    }

    render() {
        return (
        <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={this.onPress}>
                <Icon style={styles.cancelButton} name="circle-with-cross"/>
            </TouchableOpacity>
            <Text style={styles.buttonText}>{this.props.title}</Text>
        </View>
        );
    }
}

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: '#aaa',
        borderRadius: 8,
        height: CommonStyles.BUTTON_HEIGHT,
        margin: 3,
    },
    buttonText: {
        fontSize: CommonStyles.BUTTON_TEXT_SIZE,
        paddingLeft: 2,
        paddingRight: 2,
    },
    cancelButton: {
        fontSize: CommonStyles.BUTTON_CANCEL_SIZE,
    }
});