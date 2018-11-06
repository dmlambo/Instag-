import React from 'react';
import { 
  Text, 
  View, 
  StyleSheet,  
  TextInput,  
  KeyboardAvoidingView, } from 'react-native';

// Paper
import { 
  FAB, 
  Modal, 
  Portal, } from 'react-native-paper';

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
      <Portal>
        <Modal
          animationType="fade"
          transparent={true}
          visible={this.props.visible}
          onDismiss={this.props.onRequestClose}
          onShow={() => { 
            this.setState({ text: "", status: this.props.onFilterText("") }); // Child views are destroyed, so onChangeText is never called, so reset the state.
            this.textField.focus();
          }}>
          <View style={styles.container}>
            <KeyboardAvoidingView style={styles.textAvoidingView} behavior='padding'>
              <View style={styles.textInputView}>
                <TextInput 
                  ref={(ref) => { ref = this.textField }} // autoFocus does nothing. see onShow

                  style={[styles.textInput, styles.text]} 
                  clearButtonMode="always"
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="done"
                  underlineColorAndroid='#0000'
                  returnKeyType="done"
                  numberOfLines={6}
                  blurOnSubmit
                  placeholder="#"
                  placeholderTextColor='#888'
                  multiline
                  autoFocus
                  onChangeText={(text) => {
                    this.setState({text, status: this.props.onFilterText(text) });
                  }}
                />
              </View>
              <View style={styles.buttonContainer}>
                <Text style={styles.statusText}>{this.state.status}</Text>
                <FAB
                  style={styles.fab}
                  icon="check"
                  onPress={() => this.props.onTextAccepted(this.state.text)}
                />          
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </Portal>
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
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },  
  textInput: {
    maxWidth: '80%',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },  
  statusText: {
    color: '#777',
    flex: 1,
    fontSize: 20,
    margin: 5,
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