import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import BackButton from "@/components/backButton";
import { Image } from "expo-image";
import useUserStore from "@/core/userState";

type Props = {};

const theme = (props: Props) => {
  const currentTheme = useUserStore((state) => state.theme);
  const { setTheme } = useUserStore();
  const changeTheme = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
  };

  return (
    <View
      style={[
        styles.container,
        currentTheme === "dark" && { backgroundColor: "#0D0D0D" },
      ]}
    >
      <View style={styles.topNav}>
        <BackButton />
        <Text
          style={[
            styles.title,
            currentTheme === "dark" && { color: "#E0E0E0" },
          ]}
        >
          Theme
        </Text>
      </View>

      <View style={styles.themes}>
        <TouchableOpacity
          style={[
            styles.themeOption,
            currentTheme === "light" ? styles.selectedOption : {},
            currentTheme === "dark" && {
              backgroundColor: "#131313",
              borderColor: "#2E3033",
            },
          ]}
          onPress={() => changeTheme("light")}
        >
          <Image
            source={currentTheme === "light" ? require("@/assets/images/icons/sun.png") : require("@/assets/images/icons/dark/sun.png")}
            style={styles.themeIcon}
          />
          <Text
            style={[
              styles.themeText,
              currentTheme === "light" ? styles.selectedThemeText : {},
              currentTheme === "dark" && { color: "#E0E0E0" },
            ]}
          >
            Light Mode
          </Text>
          <View
            style={[
              styles.radioButton,
              currentTheme === "light" ? styles.radioButtonSelected : {},
              currentTheme === "dark" && { borderColor: "#B3B3B3" },
            ]}
          >
            {currentTheme === "light" && (
              <View style={styles.radioButtonInner} />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.themeOption,
            currentTheme === "dark" ? styles.selectedOption : {},
            currentTheme === "dark" && {
              backgroundColor: "#131313",
              borderColor: "#2E3033",
            },
          ]}
          onPress={() => changeTheme("dark")}
        >
          <Image
            source={currentTheme === "dark" ? require("@/assets/images/icons/dark/moon.png") : require("@/assets/images/icons/moon.png")}
            style={styles.themeIcon}
          />
          <Text
            style={[
              styles.themeText,
              currentTheme === "dark" ? styles.selectedThemeText : {},
              currentTheme === "dark" && { color: "#E0E0E0" },
            ]}
          >
            Dark Mode
          </Text>
          <View
            style={[
              styles.radioButton,
              currentTheme === "dark" ? styles.radioButtonSelected : {},
              currentTheme === "dark" && { borderColor: "#B3B3B3" },
            ]}
          >
            {currentTheme === "dark" && (
              <View style={styles.radioButtonInner} />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default theme;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F9FBFC",
    flex: 1,
    paddingHorizontal: 24,
  },
  topNav: {
    marginTop: 50,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  title: {
    fontFamily: "Satoshi",
    color: "#2D3C52",
    fontWeight: "500",
    fontSize: 20,
    lineHeight: 24,
  },
  themes: {
    gap: 16,
    flexDirection: "column",
    marginTop: 32,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EDF3FC",
  },
  selectedOption: {},
  radioButton: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#61728C",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: "#00FF80",
  },
  radioButtonInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: "#00FF80",
  },
  themeIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  themeText: {
    color: "#2D3C52",
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "400",
    flex: 1,
  },
  selectedThemeText: {
    fontWeight: "500",
  },
});
