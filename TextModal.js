import React from 'react';
import { 
    Text, 
    View, 
    StyleSheet, 
    Modal, 
    TextInput, 
    KeyboardAvoidingView, 
    TouchableOpacity,
    TouchableWithoutFeedback } from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';

// Paper
import { FAB } from 'react-native-paper';

export default class TextModal extends React.Component
{
    constructor(props) {
        super(props);

        this.state = {
            text: "",
            status: this.props.onFilterText(""),
        };
    }

    render() {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={this.props.visible}
                onShow={() => { 
                    this.setState({ text: "", status: this.props.onFilterText("") }); // Child views are destroyed, so onChangeText is never called, so reset the state.
                    this.primaryTextInput.focus(); // autoFocus does nothing.
                }}
                onRequestClose={() => {
                    this.props.onRequestClose();
                }}>
                <View style={styles.container}>
                    <KeyboardAvoidingView style={styles.textAvoidingView} behavior='height'>
                        <Text style={styles.hashtag}>#</Text>
                        <TextInput 
                            ref={(ref) => { this.primaryTextInput = ref }} // autoFocus does nothing. see onShow

                            style={[styles.textInput, styles.text]} 
                            clearButtonMode="always"
                            autoCorrect={false}
                            autoCapitalize="none"
                            returnKeyType="done"
                            underlineColorAndroid='#0000'
                            //placeholder="hashtag" // Bug: Placeholder doesn't affect intrinsic size. Layout is incorrect.
                            //placeholderTextColor='#888'
                            
                            onChangeText={(text) => {
                                this.setState({text, status: this.props.onFilterText(text) });
                            }}
                        />
                    </KeyboardAvoidingView>
                    <KeyboardAvoidingView style={styles.buttonAvoidingView} behavior='padding'>
                        <View style={styles.buttonContainer}>
                            <Text style={styles.statusText}>{this.state.status}</Text>
                            <FAB
                                disabled={this.state.status != null}
                                style={styles.fab}
                                icon="check"
                                onPress={() => this.props.onTextAccepted(this.state.text)}
                            />                    
                        </View>
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
        color: '#aaa',
        fontSize: 28,
    },
    hashtag: {
        color: '#777',
        fontSize: 38,
    },
    textAvoidingView: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonAvoidingView: {
        position: 'absolute',
        bottom: 0,
        height: 74, // Oh dear.
        width: '100%',
    },
    textInput: {
        right: 0, 
        left: 0,
        height: 50,
    },
    buttonContainer: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        bottom: 5,
        right: 5,
    },    
    statusText: {
        color: '#777',
        fontSize: 20,
        margin: 5,
        bottom: 0,
        top: 0,
        textAlign: 'center',
    },
    button: {
        width: 64,
        height: 64,
        backgroundColor: '#333',
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
    },
    fab: {
        margin: 16,
    },
});