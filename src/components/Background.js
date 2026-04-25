import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Background = () => {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={['#06230e', '#004d1a', '#007a2e']} 
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
};

export default Background;