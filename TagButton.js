import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';

// Local Imports
import * as CommonStyles from './styles/common'

"use strict";

export default class TagButton extends React.Component {
    onLayout = (nativeEvent) => {
        if (this.element != undefined) {
            console.log("Measuring tag");
            this.element.measure(this.onMeasure);
        } else {
            console.log("No reference to tag");
        }
    }

    onMeasure = (x, y, width, height, screenX, screenY) => {
        this.props.setDimensions(this.props.title, screenX, screenY, width, height);
    };

    render() {
        return (
        <View 
            style={[
                styles.buttonContainer, 
                this.props.style, 
            ]} 
            onLayout={this.props.setDimensions && this.onLayout} 
            ref={element => this.element = element}>
            <TouchableOpacity onPress={() => {this.props.onClose && this.props.onClose()}}>
                <Icon style={styles.cancelButton} name="circle-with-cross"/>
            </TouchableOpacity>
            <View>
                <Text style={styles.buttonText}>{this.props.title}</Text>
            </View>
        </View>
        );
    }
}

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        borderRadius: CommonStyles.BUTTON_CANCEL_SIZE,
        height: CommonStyles.BUTTON_HEIGHT,
        margin: CommonStyles.BUTTON_MARGIN,
    },
    buttonText: {
        fontSize: CommonStyles.BUTTON_TEXT_SIZE,
        paddingLeft: CommonStyles.BUTTON_PADDING,
        paddingRight: CommonStyles.BUTTON_PADDING,
    },
    cancelButton: {
        fontSize: CommonStyles.BUTTON_CANCEL_SIZE,
    }
});