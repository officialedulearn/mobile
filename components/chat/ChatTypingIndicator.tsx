import useUserStore from "@/core/userState";
import { STREAMING_WAIT_MESSAGES } from "@/utils/constants";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const ChatTypingIndicator = () => {
  const theme = useUserStore((s) => s.theme);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % STREAMING_WAIT_MESSAGES.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const labelPulseStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withSequence(
        withTiming(0.45, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
      true,
    ),
  }));

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 500 }),
      ),
      -1,
      false,
    ),
  }));

  const label = STREAMING_WAIT_MESSAGES[messageIndex];
  const dark = theme === "dark";

  return (
    <View style={styles.messageContainer}>
      <View style={styles.avatarContainer}>
        <Image
          source={
            dark
              ? require("@/assets/images/icons/dark/LOGO.png")
              : require("@/assets/images/chatbotlogo.png")
          }
          style={[styles.avatar, dark && { width: 20, height: 20 }]}
        />
      </View>

      <View
        style={[
          styles.messageBubble,
          styles.botBubble,
          dark && {
            backgroundColor: "#131313",
          },
          { paddingVertical: 8 },
        ]}
      >
        <View style={styles.streamingWaitRow}>
          <Animated.Text
            key={label}
            style={[
              styles.streamingWaitLabel,
              dark && styles.streamingWaitLabelDark,
              labelPulseStyle,
            ]}
          >
            {label}
          </Animated.Text>
          <Animated.View style={[styles.cursorContainer, cursorStyle]}>
            <Text style={[styles.cursor, dark && { color: "#E0E0E0" }]}>|</Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

export default ChatTypingIndicator;

const styles = StyleSheet.create({
  streamingWaitRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    maxWidth: "100%",
  },
  streamingWaitLabel: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
    color: "#2D3C52",
    fontFamily: "Urbanist",
    fontWeight: "500" as const,
  },
  streamingWaitLabelDark: {
    color: "#E0E0E0",
  },
  cursorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cursor: {
    fontSize: 18,
    color: "#2D3C52",
    fontFamily: "Urbanist",
    fontWeight: "400" as const,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 8,
    paddingHorizontal: 16,
    alignItems: "flex-start",
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 7,
  },
  avatar: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 12,
    marginBottom: 4,
  },
  botBubble: {
    backgroundColor: "#F0F4FF",
    borderTopLeftRadius: 4,
  },
});
