import React from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { Message } from "@/interface/Chat";
import useUserStore from "@/core/userState";

type Props = {
  message: Message;
};

const MessageItem = ({ message }: Props) => {
  const theme = useUserStore((s) => s.theme);
  const isUser = message.role === "user";
  const isLoading = false;

  const getMessageContent = () => {
    if (typeof message.content === "string") {
      return message.content;
    } else if (
      message.content &&
      typeof message.content === "object" &&
      "text" in message.content
    ) {
      return message.content.text as string;
    }
    return "";
  };

  const markdownStyles = {
    body: {
      color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
      fontFamily: "Urbanist",
      fontSize: 14,
      lineHeight: 20,
    },
    heading1: {
      color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
      fontFamily: "Satoshi",
      fontSize: 18,
      fontWeight: "700" as const,
      marginBottom: 8,
    },
    heading2: {
      color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
      fontFamily: "Satoshi",
      fontSize: 16,
      fontWeight: "700" as const,
      marginBottom: 8,
    },
    paragraph: {
      color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
      fontFamily: "Urbanist",
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 8,
    },
    strong: {
      color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
      fontWeight: "700" as const,
    },
    em: {
      color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
      fontStyle: "italic" as const,
    },
    list_item: {
      color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
      fontFamily: "Urbanist",
      fontSize: 14,
      lineHeight: 20,
    },
    code_inline: {
      backgroundColor: theme === "dark" ? "#2E3033" : "#F0F4FF",
      color: theme === "dark" ? "#00FF80" : "#2D3C52",
      padding: 4,
      borderRadius: 4,
      fontFamily: "Urbanist",
      fontSize: 14,
    },
    code_block: {
      backgroundColor: theme === "dark" ? "#2E3033" : "#F0F4FF",
      color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
      padding: 10,
      borderRadius: 8,
      fontFamily: "Urbanist",
      fontSize: 14,
    },
  };

  return (
    <View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.botMessageContainer,
      ]}
    >
      {!isUser && (
        <View style={styles.avatarContainer}>
          <Image
            source={theme === "dark" ? require("@/assets/images/icons/dark/LOGO.png") : require("@/assets/images/chatbotlogo.png")}
            style={[styles.avatar, theme === "dark" && { width: 20, height: 20 }]}
          />
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          isUser ? [styles.userBubble, theme === "dark" && { 
            backgroundColor: "#0D0D0D", 
            borderColor: "#2E3033" 
          }] : [styles.botBubble, theme === "dark" && { 
            backgroundColor: "#131313" 
          }],
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme === "dark" ? "#E0E0E0" : "#2D3C52"} />
            <Text style={[styles.loadingText, theme === "dark" && { color: "#E0E0E0" }]}>Thinking...</Text>
          </View>
        ) : (
          <Markdown style={markdownStyles}>
            {getMessageContent()}
          </Markdown>
        )}
      </View>

      {/* {isUser && (
        <TouchableOpacity style={styles.editButton}>
          <Image 
            source={require('@/assets/images/icons/pen.png')} 
            style={styles.editIcon} 
          />
        </TouchableOpacity>
      )} */}
    </View>
  );
};

export const ThinkingMessage = () => {
  const theme = useUserStore((s) => s.theme);
  
  return (
    <View style={styles.messageContainer}>
      <View style={styles.avatarContainer}>
        <Image
          source={theme === "dark" ? require("@/assets/images/icons/dark/LOGO.png") : require("@/assets/images/chatbotlogo.png")}
          style={[styles.avatar, theme === "dark" && { width: 20, height: 20 }]}
        />
      </View>

      <View style={[styles.messageBubble, styles.botBubble, theme === "dark" && { 
        backgroundColor: "#131313" 
      }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme === "dark" ? "#E0E0E0" : "#2D3C52"} />
          <Text style={[styles.loadingText, theme === "dark" && { color: "#E0E0E0" }]}>Thinking...</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    marginVertical: 8,
    paddingHorizontal: 16,
    alignItems: "flex-start",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  botMessageContainer: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
  userBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDF3FC",
    borderTopRightRadius: 4,
  },
  botBubble: {
    backgroundColor: "#F0F4FF",
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: "Satoshi",
  },
  userMessageText: {
    color: "#2D3C52",
  },
  botMessageText: {
    color: "#2D3C52",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#2D3C52",
    fontFamily: "Satoshi",
  },
  editButton: {
    marginLeft: 8,
    padding: 4,
  },
  editIcon: {
    width: 16,
    height: 16,
    tintColor: "#61728C",
  },
});

export { MessageItem };
