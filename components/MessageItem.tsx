import { Message } from "@/interface/Chat";
import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import Markdown from "react-native-markdown-display";

type MessageItemProps = {
  message: Message;
  isLoading?: boolean;
};

const MessageItem = ({ message, isLoading = false }: MessageItemProps) => {
  const isUser = message.role === "user";

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
      color: isUser ? "#2D3C52" : "#2D3C52",
      fontFamily: "Satoshi",
      fontSize: 16,
    },
    heading1: {
      fontSize: 24,
      fontWeight: "normal",
      marginTop: 10,
      marginBottom: 5,
      fontFamily: "Satoshi",
    },
    heading2: {
      fontSize: 20,
      fontWeight: "bold",
      marginTop: 8,
      marginBottom: 4,
      fontFamily: "Satoshi",
    },
    strong: {
      fontWeight: "700",
      fontFamily: "Satoshi",
    },
    em: {
      fontStyle: "italic",
    },
    link: {
      color: "#0075FF",
      textDecorationLine: "underline",
    },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: "#00FF80",
      paddingLeft: 10,
      marginLeft: 10,
      fontStyle: "italic",

    },
    bullet_list: {
      marginLeft: 10,
    },
    ordered_list: {
      marginLeft: 10,
    },
    code_inline: {
      backgroundColor: "#F0F4FF",
      padding: 4,
      borderRadius: 4,
      fontFamily: "Urbanist",
    },
    code_block: {
      backgroundColor: "#F0F4FF",
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
            source={require("@/assets/images/chatbotlogo.png")}
            style={styles.avatar}
          />
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.botBubble,
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2D3C52" />
            <Text style={styles.loadingText}>Thinking...</Text>
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

const ThinkingMessage = () => {
  return (
    <View style={styles.messageContainer}>
      <View style={styles.avatarContainer}>
        <Image
          source={require("@/assets/images/chatbotlogo.png")}
          style={styles.avatar}
        />
      </View>

      <View style={[styles.messageBubble, styles.botBubble]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2D3C52" />
          <Text style={styles.loadingText}>Thinking...</Text>
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
    borderWidth: 1,
    borderColor: "#EDF3FC",
    borderTopRightRadius: 4,
  },
  botBubble: {
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
  },
  loadingText: {
    marginLeft: 8,
    color: "#2D3C52",
    fontFamily: "Satoshi",
  },
});

export { MessageItem, ThinkingMessage };
