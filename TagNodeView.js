import React from 'react';
import { 
  StyleSheet, 
  LayoutAnimation, 
  View, 
  TouchableWithoutFeedback } from 'react-native';

import PropTypes from 'prop-types';

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
  static propTypes = {
    selectedColor: PropTypes.string,
  };
  static defaultProps = {
    selectedColor: DefaultTheme.colors.accent,
  };

  constructor(props) {
    super(props);

    this.path = props.pathForNode(props);

    this.state = {
      expanded: false,
    }
  }

  showEditModal = (items) => {
    //this.setState({editModalVisible: true});
    this.props.nagivation.push("Edit", {})
  }

  getContentView = () => {
    if (this.props.nodeData.children && this.state.expanded) {
      return (
        <View style={{flexDirection: 'column', flex: 1.0, margin: this.props.style.margin}}>
          {
            this.props.nodeData.children.map((nodeData, idx) =>
            <TagNodeView 
              {...this.props}
              key={idx} 
              nodeData={nodeData}
              parentPath={this.path}/>)
          }
        </View>
      );
    }
  }

  onEditNode = () => {
    this.props.onEditNode(this.path);
  }

  onExpandPress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    this.setState({expanded: !this.state.expanded});
  }

  onLongPress = () => {
    this.props.onNodeLongPress(this.path);
  }

  onNodePress = () => {
    this.props.onNodePress(this.path);
  }

  onAddNode = () => {
    this.props.onAddNode(this.path);
    this.setState({expanded: true});
  }

  onDeleteNode = () => {
    this.hideDeleteNodeDialog();
    this.props.onDeleteNode(this.path);
  }

  hideDeleteNodeDialog = () => {
    this.setState({deleteNodeDialogVisible: false});
  }

  onHighPriority = () => {
    this.props.onHighPriority(this.path);
  }

  getUtilityButtons = () => {
    switch (this.props.mode) {
      case 'selection': {
        let opacity = 0.25;
        let color = null
        if (this.props.nodeData.highPriority) {
          opacity = 1.0;
          color = 'red';
        }
        return ([
          <IconButton style={[styles.utilityButton, {opacity}]} key="1" color={color} onPress={this.onHighPriority} icon="priority-high"/>,
          <IconButton style={styles.utilityButton} key="2" onPress={() => {}} icon="vertical-align-top"/>,
          <IconButton style={styles.utilityButton} key="3" onPress={() => {}} icon="vertical-align-bottom"/>,
        ]);
      }
      case 'edit':
        return ([
          <IconButton style={styles.utilityButton} key="4" onPress={() => this.setState({deleteNodeDialogVisible: true})} icon="delete-sweep"/>,
          <IconButton style={styles.utilityButton} key="5" onPress={this.onAddNode} icon="playlist-add"/>,
        ]);
      default:
      return ([
        <IconButton style={styles.utilityButton} key="6" onPress={this.onEditNode} icon="edit"/>,
      ]);
    };
  }

  render() {
    var hasData = this.props.nodeData.data && this.props.nodeData.data.length > 0;
    var tagsText = hasData && this.props.nodeData.data.map((x)=>"#" + x).join(" ");
    var selected = this.props.selectedPredicate(this.path);
    var backgroundColor = selected ? this.props.selectedColor : this.props.style.backgroundColor;
    var expandable = this.props.nodeData.children && this.props.nodeData.children.length > 0;
    var defaultAction = () => {};
    
    if (this.props.mode == 'selection') {
      defaultAction = this.onNodePress;
    } else if (expandable) {
      defaultAction =this.onExpandPress
    }

    // |ˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉˉ|    |ˉˉˉˉˉˉˉˉˉˉˉˉˉ|
    // | >               Title               ... | -> | Add Section |
    // |                                         |    | Delete  ... |
    // |  #foo #bar #baz                       > |
    // | --------------------------------------- :
    // ( Everything under is another TagNodeView )
    return (
      <Surface style={[styles.container, this.props.style, backgroundColor && {backgroundColor}]}>
        <TouchableRipple 
          borderless 
          onPress={defaultAction} 
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
              {
                expandable && 
                <IconButton 
                  style={styles.utilityButton}
                  onPress={this.onExpandPress}
                  icon={this.state.expanded ? "keyboard-arrow-down" : "chevron-right"}/>
              }
              <Title style={[styles.titleBarText, {opacity: this.props.nodeData.title ? 1.0 : 0.5}]}>
                {this.props.nodeData.title || "Untitled"}
                {
                  expandable && 
                  <Title style={{color: '#f005', fontSize: 12}}> +{this.props.nodeData.children.length}</Title>
                }
              </Title>
              { this.getUtilityButtons() }
            </View>
            { hasData && <Paragraph style={styles.tagsText}>{tagsText}</Paragraph> }
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
    elevation: 4, 
    borderRadius: 4,
    backgroundColor: DefaultTheme.colors.surface, 
  },
  titleBar: {
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