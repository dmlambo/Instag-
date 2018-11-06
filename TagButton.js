import PropTypes from 'prop-types';

import React from 'react';
import { View } from 'react-native';

"use strict";

export default class MeasuredView extends React.Component {
	static propTypes = {
		setDimensions: PropTypes.func.isRequired,
	}

	onLayout = (nativeEvent) => {
		if (this.element != undefined) {
			setTimeout(() => {
				this.element.measureInWindow(this.onMeasure);
			}, 300); // Animations. Ugh.
		} else {
			console.log("No reference to tag");
		}
	};

	onMeasure = (x, y, width, height) => {
		this.props.setDimensions(this.props.tag, x, y, width, height);
	};

	render() {
		return (
			<View {...this.props} onLayout={this.onLayout} ref={x => this.element = x}>
				{this.props.children}
			</View>
		);
	}
};
