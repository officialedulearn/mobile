import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost";

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AppButton: React.FC<AppButtonProps> = ({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  style,
  textStyle,
}) => {
  const baseStyle = [styles.button, styles[variant]];
  const buttonStyle = disabled ? [baseStyle, styles.disabled] : baseStyle;

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: "#00FF80",
  },
  secondary: {
    backgroundColor: "#E8E8E8",
  },
  tertiary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#00FF80",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 14,
    fontFamily: "Satoshi-Bold",
    fontWeight: "700",
  },
  primaryText: {
    color: "#000",
  },
  secondaryText: {
    color: "#000",
  },
  tertiaryText: {
    color: "#00FF80",
  },
  ghostText: {
    color: "#666",
  },
});

export default AppButton;
