import { router } from 'expo-router';
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

type Props = {
  style?: ViewStyle;
  iconSource?: ImageSourcePropType;
  onPress?: () => void;
}

const BackButton = ({ 
  style, 
  iconSource = require('@/assets/images/icons/CaretLeft.png'),
  onPress = () => router.back() 
}: Props) => {
  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={onPress} 
    >
      <Image 
        source={iconSource}
        style={styles.icon}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
    button: {
        padding: 10,
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 50,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        
    },
    icon: {
        width: 20,
        height: 20,
        resizeMode: 'contain'
    }
})

export default BackButton