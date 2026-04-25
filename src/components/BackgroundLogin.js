import React from 'react';
import { StyleSheet, View } from 'react-native';

const BackgroundLogin = () => {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={styles.midLineHorizontal} />
      <View style={styles.centerCircle} />
      <View style={styles.topArea} />
      <View style={styles.bottomArea} />
    </View>
  );
};

const styles = StyleSheet.create({
  midLineHorizontal: { 
    position: 'absolute', left: 0, right: 0, top: '50%', 
    height: 1.5, backgroundColor: 'rgba(255,255,255,0.3)' 
  },
  centerCircle: { 
    position: 'absolute', top: '50%', left: '50%', 
    width: 140, height: 140, borderRadius: 70, borderWidth: 1.5, 
    borderColor: 'rgba(255,255,255,0.3)', transform: [{ translateX: -70 }, { translateY: -70 }] 
  },
  topArea: { 
    position: 'absolute', top: 0, left: '20%', right: '20%', 
    height: '12%', borderBottomWidth: 1.5, borderLeftWidth: 1.5, 
    borderRightWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' 
  },
  bottomArea: { 
    position: 'absolute', bottom: 0, left: '20%', right: '20%', 
    height: '12%', borderTopWidth: 1.5, borderLeftWidth: 1.5, 
    borderRightWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' 
  },
});

export default BackgroundLogin;