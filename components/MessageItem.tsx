import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Clipboard from 'expo-clipboard';
import Markdown from "react-native-markdown-display";
import { Message } from "@/interface/Chat";
import useUserStore from "@/core/userState";
import AnimatedPressable from "./AnimatedPressable";

type Props = {
  message: Message;
  isStreaming?: boolean;
};

const MessageItem = ({ message, isStreaming = false }: Props) => {

  const theme = useUserStore((s) => s.theme);
  
  if (!message) {
    console.error('MessageItem received undefined message');
    return null;
  }
  
  const isUser = message.role === "user";
  const isLoading = false;

  const handleCopyMessage = async () => {
    try {
      const messageText = getMessageContent();
      await Clipboard.setStringAsync(messageText);
      Alert.alert("Success", "Message copied to clipboard!");
    } catch (error) {
      Alert.alert("Error", "Failed to copy message");
    }
  };

  const handleShareMessage = async () => {
    try {
      const messageText = getMessageContent();
      await Share.share({
        message: messageText,
        title: "AI Response",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share message");
    }
  };

  const handleReportMessage = async () => {
    try {
      const messageText = getMessageContent();
      const subject = encodeURIComponent("Report AI Response");
      const body = encodeURIComponent(
        `I would like to report the following AI response:\n\n"${messageText}"\n\nReason for report:\n\n`
      );
      const mailtoUrl = `mailto:support@edulearn.com?subject=${subject}&body=${body}`;
      
      const canOpenURL = await Linking.canOpenURL(mailtoUrl);
      if (canOpenURL) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert("Error", "No email app available to send the report");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open email client");
    }
  };

  const getMessageContent = () => {
    if (!message || !message.content) {
      return "";
    }
    
    if (typeof message.content === "string") {
      return message.content;
    } else if (Array.isArray(message.content)) {
      return message.content
        .map((item: any) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && item.text) return item.text;
          if (item && typeof item === 'object' && item.type === 'text' && item.text) return item.text;
          return '';
        })
        .join('');
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
      fontFamily: "Satoshi-Regular",
      fontSize: 18,
      fontWeight: "700" as const,
      marginBottom: 8,
    },
    heading2: {
      color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
      fontFamily: "Satoshi-Regular",
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
            source={
              theme === "dark"
                ? require("@/assets/images/icons/dark/LOGO.png")
                : require("@/assets/images/chatbotlogo.png")
            }
            style={[
              styles.avatar,
              theme === "dark" && { width: 20, height: 20 },
            ]}
          />
        </View>
      )}


    <View
        style={[
          styles.messageBubble,
          isUser
            ? [
                styles.userBubble,
                theme === "dark" && {
                  backgroundColor: "#0D0D0D",
                  borderColor: "#2E3033",
                },
              ]
            : [
                styles.botBubble,
                theme === "dark" && {
                  backgroundColor: "#131313",
                },
              ],
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="small"
              color={theme === "dark" ? "#E0E0E0" : "#2D3C52"}
            />
            <Text
              style={[
                styles.loadingText,
                theme === "dark" && { color: "#E0E0E0" },
              ]}
            >
              Thinking...
            </Text>
          </View>
        ) : (
          <View>
            {(() => {
              try {
                const content = getMessageContent();
                
                if (!content || content.trim().length === 0) {
                  if (isStreaming && !isUser) {
                    return (
                      <Text style={[
                        markdownStyles.body,
                        theme === "dark" && { color: "#E0E0E0" }
                      ]}>
                        ▊
                      </Text>
                    );
                  }
                  return (
                    <Text style={[
                      markdownStyles.body,
                      { opacity: 0.5 },
                      theme === "dark" && { color: "#E0E0E0" }
                    ]}>
                      ...
                    </Text>
                  );
                }
                
                const withCursor = content + (isStreaming && !isUser ? ' ▊' : '');
                
                return (
                  <Markdown style={markdownStyles}>
                    {withCursor}
                  </Markdown>
                );
              } catch (error) {
                console.error('Error rendering markdown:', error);
                const content = getMessageContent() || '';
                return (
                  <Text style={[
                    markdownStyles.body,
                    theme === "dark" && { color: "#E0E0E0" }
                  ]}>
                    {content}{isStreaming && !isUser ? ' ▊' : ''}
                  </Text>
                );
              }
            })()}
            {!isUser && (
              <View style={styles.messageActionContainer}>
                <AnimatedPressable onPress={handleCopyMessage} style={styles.actionButton} scale={0.85} hapticFeedback={true}>
                  <Image
                    source={require("@/assets/images/icons/dark/copy.png")}
                    style={styles.editIcon}
                  />
                </AnimatedPressable>
                <AnimatedPressable onPress={handleShareMessage} style={styles.actionButton} scale={0.85} hapticFeedback={true}>
                  <Image
                    source={require("@/assets/images/icons/dark/share.png")}
                    style={styles.editIcon}
                  />
                </AnimatedPressable>
                <AnimatedPressable onPress={handleReportMessage} style={styles.actionButton} scale={0.85} hapticFeedback={true}>
                  <Image
                    source={require("@/assets/images/icons/dark/report.png")}
                    style={styles.editIcon}
                  />
                </AnimatedPressable>
              </View>
            )}
          </View>
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
          source={
            theme === "dark"
              ? require("@/assets/images/icons/dark/LOGO.png")
              : require("@/assets/images/chatbotlogo.png")
          }
          style={[styles.avatar, theme === "dark" && { width: 20, height: 20 }]}
        />
      </View>

      <View
        style={[
          styles.messageBubble,
          styles.botBubble,
          theme === "dark" && {
            backgroundColor: "#131313",
          },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={theme === "dark" ? "#E0E0E0" : "#2D3C52"}
          />
          <Text
            style={[
              styles.loadingText,
              theme === "dark" && { color: "#E0E0E0" },
            ]}
          >
            Thinking...
          </Text>
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
  userBubble: {
    backgroundColor: "#FFFFFF",
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
    fontFamily: "Satoshi-Regular",
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
    fontFamily: "Satoshi-Regular",
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
  messageActionContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    justifyContent: "flex-end",
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
  },
});

export { MessageItem };