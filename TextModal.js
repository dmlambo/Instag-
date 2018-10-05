import React from 'react';
import { View, StyleSheet, Modal, TextInput, KeyboardAvoidingView, TouchableHighlight } from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';

export default class TextModal extends React.Component
{
    constructor(props) {
        super(props);

        this.state = {
            text: "",
        };
    }

    render() {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={this.props.visible}
                onShow={() => { this.primaryTextInput.focus() }} // autoFocus does nothing.
                onRequestClose={() => {
                    this.props.onRequestClose();
                }}>
                <View style={styles.container}>
                    <KeyboardAvoidingView style={styles.avoidingView} behavior="height">
                        <TextInput 
                            style={[styles.textInput, styles.text]} 
                            placeholder="hashtag"
                            clearButtonMode="always"
                            autoCorrect={false}
                            autoCapitalize="none"
                            returnKeyType="done"
                            underlineColorAndroid='#0000'
                            onChangeText={(text) => this.setState({...this.state, text})} 
                            ref={(ref) => { this.primaryTextInput = ref }} // autoFocus does nothing.
                        />

                        <TouchableHighlight
                            style={styles.button}
                            onPress={() => {
                                this.props.onTextAccepted(this.state.text);
                            }}>
                            <Icon style={[styles.icon, styles.text]} name="check"/>
                        </TouchableHighlight>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject, 
        backgroundColor: '#000a',
    },
    text: {
        color: '#ddd',
        fontSize: 28,
    },
    avoidingView: {
        ...StyleSheet.absoluteFillObject, 
        alignItems: 'center',
        justifyContent: 'center',
    },
    textInput: {
        right: 0, 
        left: 0,
        height: 50,
    },
    button: {
        position: 'absolute',
        bottom: 15,
        right: 5,
    },
    icon: {
    },
});