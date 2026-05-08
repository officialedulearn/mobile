import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
  style?: ViewStyle;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  color = "#00FF80",
  style,
}) => {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60,
  };

  const containerSize = sizeMap[size];

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            borderWidth: size === "small" ? 2 : 3,
            borderColor: `${color}40`,
            borderTopColor: color,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default LoadingSpinner;
