import useUserStore from "@/core/userState";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  ViewStyle,
} from "react-native";
import AnimatedPressable from "./AnimatedPressable";

type Props = {
  style?: ViewStyle;
  iconSource?: ImageSourcePropType;
  onPress?: () => void;
};

const BackButton = ({ style, onPress = () => router.back() }: Props) => {
  const theme = useUserStore((state) => state.theme);

  const iconSource =
    theme === "dark"
      ? require("@/assets/images/icons/dark/CaretLeft.png")
      : require("@/assets/images/icons/CaretLeft.png");
  return (
    <AnimatedPressable
      style={[
        styles.button,
        style,
        theme === "dark" && {
          backgroundColor: "#131313",
          borderColor: "#2E3033",
        },
      ]}
      onPress={onPress}
      scale={0.9}
      hapticFeedback={true}
      hapticStyle="light"
    >
      <Image source={iconSource} style={styles.icon} />
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 10,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#EDF3FC"
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
});

export default BackButton;
