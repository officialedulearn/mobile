import useAgentStore from "@/core/agentStore";
import Design from "@/utils/design";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  title: string;
  theme: string;
  isEmpty: boolean;
  onOpenDrawer: () => void;
  onNewChat: () => void;
  onQuiz: () => void | Promise<void>;
  onRequestDelete: () => void | Promise<void>;
};

const ChatHeaderBar = ({
  title,
  theme,
  isEmpty,
  onOpenDrawer,
  onNewChat,
  onQuiz,
  onRequestDelete,
}: Props) => {
  const dark = theme === "dark";
  const btnDark = dark && {
    backgroundColor: "#0D0D0D",
    borderColor: "#2E3033",
  };
  const { userHasAgent, agent } = useAgentStore();

  return (
    <View
      style={[
        styles.topNav,
        dark && {
          backgroundColor: "#131313",
          borderBottomColor: "#2E3033",
        },
      ]}
    >
      <View style={styles.leftNavContainer}>
        <TouchableOpacity
          style={[styles.button, btnDark]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onOpenDrawer();
          }}
          activeOpacity={0.8}
        >
          <Image
            source={
              dark
                ? require("@/assets/images/icons/dark/menu.png")
                : require("@/assets/images/icons/menu.png")
            }
            style={{ width: 20, height: 20 }}
          />
        </TouchableOpacity>
        <Text
          style={[styles.headerText, dark && { color: "#E0E0E0" }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {(userHasAgent ? agent?.name : "AI Tutor Chat")}
        </Text>
      </View>
      {isEmpty ? (
        <TouchableOpacity
          style={[styles.button, btnDark]}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNewChat();
          }}
        >
          <Image
            source={
              dark
                ? require("@/assets/images/icons/dark/pen.png")
                : require("@/assets/images/icons/pen.png")
            }
            style={{ width: 20, height: 20 }}
          />
        </TouchableOpacity>
      ) : (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={[styles.button, btnDark]}
            onPress={() => onQuiz()}
          >
            <Image
              source={
                dark
                  ? require("@/assets/images/icons/dark/BrainChat.png")
                  : require("@/assets/images/icons/BrainChat.png")
              }
              style={{ width: 20, height: 20 }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, btnDark]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert(
                "Delete Chat",
                "Are you sure you want to delete this chat? This action cannot be undone.",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () =>
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
                  },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                      void onRequestDelete();
                    },
                  },
                ],
              );
            }}
          >
            <Image
              source={
                dark
                  ? require("@/assets/images/icons/dark/delete.png")
                  : require("@/assets/images/icons/delete.png")
              }
              style={{ width: 20, height: 20 }}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ChatHeaderBar;

const styles = StyleSheet.create({
  button: {
    borderRadius: 50,
    borderWidth: 0.5,
    borderColor: "#EDF3FC",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    backgroundColor: "#FFFFFF",
  },
  headerText: {
    color: "#2D3C52",
    fontSize: 20,
    fontWeight: "500",
    fontFamily: "Satoshi-Regular",
    lineHeight: 24,
    flex: 1,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Design.spacing.sm,
    paddingBottom: Design.spacing.md,
    backgroundColor: "#F9FBFC",
    borderBottomWidth: 1,
    borderBottomColor: "#EDF3FC",
    borderRadius: 10,
    marginHorizontal: 10,
  },
  leftNavContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
});
