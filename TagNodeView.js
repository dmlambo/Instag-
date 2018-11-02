import React from 'react';
import { StyleSheet, LayoutAnimation, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';

// Paper
import { 
  DefaultTheme, 
  Surface, 
  Paragraph, 
  Title, 
  TouchableRipple,
  IconButton,
  Portal,
  Dialog,
  Button,
  withTheme,  
} from 'react-native-paper';

'use strict';

// TagNodeView acts as a tree-view visual node, showing each node's
// data, and a list of children underneath, each of which can be
// expanded, edited, and selected.
// TODO: Serialization
class TagNodeView extends React.Component {
  constructor(props) {
    super(props);

    this.path = props.pathForNode(props);

    this.state = {
      expanded: false,
    }
  }

  getExpandView = () => {
    if (this.state.expanded) {
      return (
        <Icon style={styles.titleBarExpand} name="chevron-thin-down"/>
      );
    } else {
      return (
        <Icon style={styles.titleBarExpand} name="chevron-thin-right"/>
      )
    }
  }

  showEditModal = (items) => {
    //this.setState({editModalVisible: true});
    this.props.nagivation.push("Edit", {})
  }

  getContentView = () => {
    if (this.state.expanded) {
      return (
        <View style={{flexDirection: 'row'}}>
          <View style={{flexDirection: 'column', flex: 1.0}}>
            {
              this.getChildViews()
            }
          </View>
        </View>
      );
    }
  }

  onEditNode = () => {
    this.props.onEditNode(this.path);
  }

  getChildViews = () => {
    if (this.props.nodeData.children) {
      return this.props.nodeData.children.map((nodeData, idx) =>
          <TagNodeView 
            {...this.props}
            key={idx} 
            nodeData={nodeData}
            parentPath={this.path}/>
      );
    } else {
      return <View/>;
    }
  }

  onExpandPress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    this.setState({expanded: !this.state.expanded});
  }

  onLongPress = () => {
    this.props.onNodeSelected(this.path);
  }

  onAddNode = () => {
    this.props.onAddNode(this.path);
  }

  onDeleteNode = () => {
    this.props.onDeleteNode(this.path);
  }

  hideDeleteNodeDialog = () => {
    this.setState({deleteNodeDialogVisible: false});
  }

  getUtilityButtons = () => {
    if (this.props.selectionMode) {
      return ([
        <IconButton style={styles.utilityButton} key="1" onPress={() => {}} icon="vertical-align-bottom"/>,
        <IconButton style={styles.utilityButton} key="2" onPress={() => {}} icon="vertical-align-top"/>,
      ]);
  } else {
      return ([
        <IconButton style={styles.utilityButton} key="3" onPress={() => this.setState({deleteNodeDialogVisible: true})} icon="delete-sweep"/>,
        <IconButton style={styles.utilityButton} key="4" onPress={this.onAddNode} icon="playlist-add"/>,
        <IconButton style={styles.utilityButton} key="5" onPress={this.onEditNode} icon="edit"/>,
      ]);
    }
  }

  render() {
    const noTagsText = "No Tags!";
    var tagsText = this.props.nodeData.data == undefined ? 
      noTagsText :
      this.props.nodeData.data.map((x)=>"#" + x).join(" ");
    var selected = this.props.selectedPredicate(this.path);
    var backgroundColor = selected ? DefaultTheme.colors.accent : DefaultTheme.colors.surface;

    // |ˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉ|    |ˉˉˉˉˉˉˉˉˉˉˉˉˉ|
    // | >               Title               ... | -> | Add Section |
    // |                                         |    | Delete  ... |
    // |  #foo #bar #baz                       > |
    // | --------------------------------------- :
    // ( Everything under is another TagNodeView )
    return (
      <Surface style={[styles.container, this.props.style, {backgroundColor}]}>
        <TouchableRipple 
          borderless 
          onPress={this.props.selectionMode ? this.onLongPress : this.onExpandPress} 
          onLongPress={this.onLongPress}
          style={[...StyleSheet.absoluteFillObject, {borderRadius: 4}]}>
          <View>
          <Portal>
                <Dialog
                  visible={this.state.deleteNodeDialogVisible}
                  onDismiss={this.hideDeleteNodeDialog}>
                  <Dialog.Title>Warning</Dialog.Title>
                  <Dialog.Content>
                    <Paragraph>Are you sure you want to delete {this.props.nodeData.title}?</Paragraph>
                  </Dialog.Content>
                  <Dialog.Actions>
                    <Button onPress={this.hideDeleteNodeDialog}>Cancel</Button>
                    <Button onPress={this.onDeleteNode}>Delete</Button>
                  </Dialog.Actions>
                </Dialog>
              </Portal>

            <View style={styles.titleBar}>
              <TouchableOpacity onPress={() => this.setState({expanded: !this.state.expanded})}>
                { this.getExpandView(this.state.expanded) }
              </TouchableOpacity>
              <Title style={styles.titleBarText}>{this.props.nodeData.title}</Title>
              { this.getUtilityButtons() }
            </View>
            <Paragraph style={styles.tagsText}>{tagsText}</Paragraph>
            <View>
              { 
                this.getContentView(this.state.expanded) 
              }
            </View>
          </View>
        </TouchableRipple>
      </Surface>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    margin: 8, 
    elevation: 4, 
    borderRadius: 4, 
    paddingBottom: 8, 
  },
  titleBar: {
    height: 50,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 8,
    paddingLeft: 8,
  },
  titleBarText: {
    flex: 1.0,
  },
  titleBarExpand: {
    fontSize: 24,
  },
  tagsText: {
    margin: 8,
  },
  utilityButton: {
    width: 32,
    height: 32,
    margin: 0,
  }
});

export default withTheme(TagNodeView);