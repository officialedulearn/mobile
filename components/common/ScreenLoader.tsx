import useUserStore from "@/core/userState";
import { Image } from "expo-image";
import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import LoadingSpinner from "./LoadingSpinner";

const MAIN_LOGO_URI = "https://www.edulearn.fun/mainlogo.png";

type ScreenLoaderProps = {
  visible: boolean;
  message?: string;
};

export default function ScreenLoader({ visible, message }: ScreenLoaderProps) {
  const theme = useUserStore((s) => s.theme);
  const isDark = theme === "dark";

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.markWrap}>
            <LoadingSpinner
              size="large"
              color="#00FF80"
              style={styles.spinner}
            />
            <Image
              source={{ uri: MAIN_LOGO_URI }}
              style={styles.logo}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </View>
          {message ? (
            <Text
              style={[styles.message, isDark && styles.messageDark]}
              numberOfLines={3}
            >
              {message}
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  card: {
    backgroundColor: "#fff",
    paddingVertical: 28,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: "center",
    maxWidth: "85%",
  },
  cardDark: {
    backgroundColor: "#131313",
  },
  markWrap: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    position: "absolute",
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    zIndex: 1,
  },
  message: {
    marginTop: 16,
    fontSize: 15,
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
  },
  messageDark: {
    color: "#E0E0E0",
  },
});
