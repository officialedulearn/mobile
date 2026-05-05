import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface AvatarProps {
  source?: { uri: string };
  initials?: string;
  size?: 'small' | 'medium' | 'large';
  backgroundColor?: string;
  style?: ViewStyle;
}

const Avatar: React.FC<AvatarProps> = ({
  source,
  initials,
  size = 'medium',
  backgroundColor = '#00FF80',
  style,
}) => {
  const sizeMap = {
    small: { width: 32, height: 32, fontSize: 12 },
    medium: { width: 48, height: 48, fontSize: 16 },
    large: { width: 64, height: 64, fontSize: 20 },
  };

  const dimensions = sizeMap[size];

  return (
    <View
      style={[
        styles.avatar,
        {
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: dimensions.width / 2,
          backgroundColor: source ? 'transparent' : backgroundColor,
        },
        style,
      ]}
    >
      {source ? (
        <Image
          source={source}
          style={{
            width: dimensions.width,
            height: dimensions.height,
            borderRadius: dimensions.width / 2,
          }}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: dimensions.fontSize,
            },
          ]}
        >
          {initials?.charAt(0).toUpperCase() || ''}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
    color: '#000',
  },
});

export default Avatar;
