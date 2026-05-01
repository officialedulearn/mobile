import useUserStore from "@/core/userState";
import { Message } from "@/interface/Chat";
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Share,
  StyleSheet,
  Text,
  type TextStyle,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
// eslint-disable-next-line import/no-named-as-default
import { useToast } from "@/contexts/ToastContext";
import useAgentStore from "@/core/agentStore";
import AnimatedPressable from "../common/AnimatedPressable";
import ChatFlashcardDeck from "./ChatFlashcardDeck";
import RoadmapCard from "./RoadmapCard";

const EMBED_SPLIT =
  /(\[ROADMAP_CARD:[a-f0-9-]+\]|\[FLASHCARD_CARD:[a-f0-9-]+\])/i;

function StreamBlinkCursor({ color }: { color: string }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 530 }),
        withTiming(1, { duration: 530 }),
      ),
      -1,
      true,
    );
  }, [opacity]);
  const blink = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  return (
    <Animated.Text
      style={[
        {
          color,
          fontSize: 14,
          lineHeight: 22,
          fontFamily: "Urbanist",
          width: 12,
          textAlign: "center",
        },
        styles.streamCursor,
        blink,
      ]}
    >
      ▊
    </Animated.Text>
  );
}

function parseEmbed(
  part: string,
): { kind: "roadmap"; id: string } | { kind: "flashcard"; id: string } | null {
  const t = part.trim();
  let m = t.match(/^\[ROADMAP_CARD:([a-f0-9-]+)\]$/i);
  if (m) return { kind: "roadmap", id: m[1] };
  m = t.match(/^\[FLASHCARD_CARD:([a-f0-9-]+)\]$/i);
  if (m) return { kind: "flashcard", id: m[1] };
  return null;
}

type Props = {
  message: Message;
  isStreaming?: boolean;
  theme: "light" | "dark";
};

function messageContentKey(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item: unknown) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in (item as object)) {
          return String((item as { text?: string }).text ?? "");
        }
        return "";
      })
      .join("");
  }
  if (
    content &&
    typeof content === "object" &&
    "text" in (content as object)
  ) {
    return String((content as { text: string }).text);
  }
  return "";
}

function areMessageItemPropsEqual(prev: Props, next: Props): boolean {
  if (prev.isStreaming !== next.isStreaming) return false;
  if (prev.theme !== next.theme) return false;
  const a = prev.message;
  const b = next.message;
  if (!a || !b) return a === b;
  if (a.id !== b.id || a.role !== b.role) return false;
  return messageContentKey(a.content) === messageContentKey(b.content);
}

function MessageItemImpl({ message, isStreaming = false, theme }: Props) {
  const { show } = useToast();
  const { agent } = useAgentStore();
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
      show("success", "Message copied to clipboard!");
    } catch (_error) {
      show("error", "Failed to copy message");
    }
  };

  const handleShareMessage = async () => {
    try {
      const messageText = getMessageContent();
      await Share.share({
        message: messageText,
        title: "AI Response",
      });
    } catch (_error) {
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
    } catch (_error) {
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

  const baseTextStyle: TextStyle = {
    color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
    fontFamily: "Urbanist",
    fontSize: 14,
    lineHeight: 22,
  };

  const mdDisplayStyles = useMemo(
    () => ({
      body: {
        color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
        fontFamily: "Urbanist",
        fontSize: 14,
        lineHeight: 22,
      },
      heading1: {
        color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
        fontFamily: "Satoshi-Regular",
        fontSize: 18,
        fontWeight: "700" as const,
        marginTop: 12,
        marginBottom: 8,
      },
      heading2: {
        color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
        fontFamily: "Satoshi-Regular",
        fontSize: 16,
        fontWeight: "700" as const,
        marginTop: 10,
        marginBottom: 8,
      },
      heading3: {
        color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
        fontFamily: "Satoshi-Regular",
        fontSize: 15,
        fontWeight: "700" as const,
        marginTop: 8,
        marginBottom: 6,
      },
      strong: {
        color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
        fontWeight: "700" as const,
      },
      em: {
        color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
        fontStyle: "italic" as const,
      },
      bullet_list: { marginBottom: 8 },
      ordered_list: { marginBottom: 8 },
      list_item: {
        color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
        fontFamily: "Urbanist",
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 4,
      },
      link: {
        color: theme === "dark" ? "#7DD3FC" : "#2563EB",
        textDecorationLine: "underline" as const,
      },
      blockquote: {
        backgroundColor: theme === "dark" ? "#1A1A1A" : "#F8F9FC",
        borderLeftColor: theme === "dark" ? "#00FF80" : "#2D3C52",
        borderLeftWidth: 4,
        paddingLeft: 10,
        paddingVertical: 8,
        marginVertical: 8,
      },
      code_inline: {
        backgroundColor: theme === "dark" ? "#2E3033" : "#F0F4FF",
        color: theme === "dark" ? "#00FF80" : "#2D3C52",
        fontFamily: "Urbanist",
        fontSize: 13,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
      },
      code_block: {
        backgroundColor: theme === "dark" ? "#2E3033" : "#F0F4FF",
        color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
        fontFamily: "Urbanist",
        fontSize: 13,
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
      },
      fence: {
        backgroundColor: theme === "dark" ? "#2E3033" : "#F0F4FF",
        color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
        fontFamily: "Urbanist",
        fontSize: 13,
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
      },
    }),
    [theme],
  );

  const renderMarkdown = (content: string, key?: string) => (
    <Markdown
      key={key}
      style={mdDisplayStyles}
      onLinkPress={(url) => {
        void Linking.openURL(url);
        return true;
      }}
    >
      {content}
    </Markdown>
  );

  const renderContentWithEmbeds = (content: string) => {
    const parts = content.split(EMBED_SPLIT);
    const hasEmbeds = parts.some((p) => parseEmbed(p) !== null);
    if (!hasEmbeds) {
      return renderMarkdown(content);
    }
    return (
      <View>
        {parts.map((part, i) => {
          if (!part) return null;
          const embed = parseEmbed(part);
          if (embed?.kind === "roadmap") {
            return <RoadmapCard key={`e-${i}`} roadmapId={embed.id} />;
          }
          if (embed?.kind === "flashcard") {
            return <ChatFlashcardDeck key={`e-${i}`} deckId={embed.id} />;
          }
          if (part.trim().length === 0) return null;
          return renderMarkdown(part, `e-${i}`);
        })}
      </View>
    );
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
              agent?.profile_picture_url
                ? { uri: agent.profile_picture_url }
                : theme === "dark"
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
                      <StreamBlinkCursor
                        color={
                          theme === "dark" ? "#E0E0E0" : "#2D3C52"
                        }
                      />
                    );
                  }
                  return (
                    <Text style={[
                      baseTextStyle,
                      { opacity: 0.5 },
                      theme === "dark" && { color: "#E0E0E0" }
                    ]}>
                      ...
                    </Text>
                  );
                }

                const body = renderContentWithEmbeds(content);
                if (isStreaming && !isUser) {
                  return (
                    <View style={styles.streamRow}>
                      <View style={styles.streamMarkdownWrap}>
                        {body}
                      </View>
                      <StreamBlinkCursor
                        color={
                          theme === "dark" ? "#E0E0E0" : "#2D3C52"
                        }
                      />
                    </View>
                  );
                }
                return body;
              } catch (_error) {
                console.error('Error rendering markdown:', _error);
                const content = getMessageContent() || '';
                return (
                  <Text style={[
                    baseTextStyle,
                    theme === "dark" && { color: "#E0E0E0" }
                  ]}>
                    {content}{isStreaming && !isUser ? ' ▊' : ''}
                  </Text>
                );
              }
            })()}
            {!isUser && !isStreaming && (
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
}

const MessageItem = React.memo(MessageItemImpl, areMessageItemPropsEqual);

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
    padding: 16,
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
    tintColor:  "#E0E0E0",
  },
  messageActionContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    justifyContent: "flex-end",
  },
  streamRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "nowrap",
    maxWidth: "100%",
  },
  streamMarkdownWrap: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  streamCursor: {
    marginLeft: 2,
    flexShrink: 0,
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
  },
});

export { MessageItem };
export default MessageItem;