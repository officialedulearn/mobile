import useUserStore from "@/core/userState";
import { Message } from "@/interface/Chat";
import * as Clipboard from 'expo-clipboard';
import { Image } from "expo-image";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Share,
  StyleSheet,
  Text,
  type TextStyle,
  View,
} from "react-native";
import {
  EnrichedMarkdownText,
  type MarkdownStyle,
} from "react-native-enriched-markdown";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
 
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

type AgentAvatarProps = {
  profilePictureUrl?: string | null;
  theme: "light" | "dark";
};

const AgentAvatar = React.memo(
  ({ profilePictureUrl, theme }: AgentAvatarProps) => (
    <View style={styles.avatarContainer}>
      <Image
        source={
          profilePictureUrl
            ? { uri: profilePictureUrl }
            : theme === "dark"
              ? require("@/assets/images/icons/dark/LOGO.png")
              : require("@/assets/images/chatbotlogo.png")
        }
        style={[
          styles.avatar,
          theme === "dark" &&
            !profilePictureUrl && { width: 20, height: 20, borderRadius: 0 },
        ]}
      />
    </View>
  ),
);
AgentAvatar.displayName = "AgentAvatar";

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

function getMessageAttachments(content: unknown): {
  kind?: "image" | "document";
  name?: string;
  localUri?: string;
  mimeType?: string;
}[] {
  if (!content || typeof content !== "object") return [];
  const attachments = (content as any).attachments;
  if (!Array.isArray(attachments)) return [];
  return attachments.filter((a: any) => a && typeof a === "object");
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
  const agentProfilePictureUrl = useAgentStore(
    (s) => s.agent?.profile_picture_url,
  );
  if (!message) {
    return null;
  }
  
  const isUser = message.role === "user";
  const isLoading = false;
  const attachments = getMessageAttachments(message.content);

  const handleCopyMessage = async () => {
    try {
      const messageText = getMessageContent();
      await Clipboard.setStringAsync(messageText);
      show("success", "Message copied to clipboard!");
    } catch {
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
    } catch {
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
    } catch {
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
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && item.text) return item.text;
          if (item && typeof item === "object" && item.type === "text" && item.text) return item.text;
          return "";
        })
        .join("");
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

  const markdownStyles: MarkdownStyle = {
    paragraph: {
      color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
      fontFamily: "Urbanist",
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 10,
    },
    h1: {
      color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
      fontFamily: "Satoshi-Regular",
      fontSize: 18,
      fontWeight: "700",
      marginTop: 12,
      marginBottom: 8,
    },
    h2: {
      color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
      fontFamily: "Satoshi-Regular",
      fontSize: 16,
      fontWeight: "700",
      marginTop: 10,
      marginBottom: 8,
    },
    h3: {
      color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
      fontFamily: "Satoshi-Regular",
      fontSize: 15,
      fontWeight: "700",
      marginTop: 8,
      marginBottom: 6,
    },
    strong: {
      color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
      fontWeight: "bold",
    },
    em: {
      color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
      fontStyle: "italic",
    },
    list: {
      color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
      fontFamily: "Urbanist",
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 4,
      markerColor: theme === "dark" ? "#E0E0E0" : "#2D3C52",
    },
    code: {
      backgroundColor: theme === "dark" ? "#2E3033" : "#F0F4FF",
      color: theme === "dark" ? "#00FF80" : "#2D3C52",
      fontFamily: "Urbanist",
      fontSize: 13,
    },
    codeBlock: {
      backgroundColor: theme === "dark" ? "#2E3033" : "#F0F4FF",
      color: theme === "dark" ? "#E0E0E0" : "#2D3C52",
      padding: 12,
      borderRadius: 8,
      fontFamily: "Urbanist",
      fontSize: 13,
      marginTop: 8,
      marginBottom: 8,
    },
    link: {
      color: theme === "dark" ? "#7DD3FC" : "#2563EB",
      underline: true,
    },
  };

  const renderMarkdown = (content: string, key?: string) => (
    <EnrichedMarkdownText
      key={key}
      flavor="commonmark"
      markdown={content}
      markdownStyle={markdownStyles}
      selectable={isUser || !isStreaming}
      onLinkPress={(event) => {
        void Linking.openURL(event.url);
      }}
    />
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

  const renderStreamingContent = (content: string) => {
    const marker = " ▊";
    const parts = content.split(EMBED_SPLIT);
    const lastTextIndex = parts
      .map((part, index) => ({ part, index }))
      .reverse()
      .find(({ part }) => part.trim().length > 0 && parseEmbed(part) === null)
      ?.index;

    if (lastTextIndex == null) {
      return renderContentWithEmbeds(`${content}${marker}`);
    }

    const nextParts = [...parts];
    nextParts[lastTextIndex] = `${nextParts[lastTextIndex]}${marker}`;
    return renderContentWithEmbeds(nextParts.join(""));
  };

  return (
    <View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.botMessageContainer,
      ]}
    >
      {!isUser && (
        <AgentAvatar profilePictureUrl={agentProfilePictureUrl} theme={theme} />
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
            {isUser && attachments.length > 0 ? (
              <View style={styles.attachmentsWrap}>
                {attachments
                  .filter(
                    (a) => a.kind === "image" && typeof a.localUri === "string",
                  )
                  .map((img, idx) => (
                    <Image
                      key={`${img.localUri}-${idx}`}
                      source={{ uri: img.localUri as string }}
                      style={styles.attachmentImage}
                    />
                  ))}
                {attachments
                  .filter((a) => a.kind === "document")
                  .map((doc, idx) => (
                    <View
                      key={`${doc.name ?? "doc"}-${idx}`}
                      style={[
                        styles.attachmentDocChip,
                        theme === "dark" && styles.attachmentDocChipDark,
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.attachmentDocText,
                          theme === "dark" && { color: "#E0E0E0" },
                        ]}
                      >
                        {doc.name ?? "document"}
                      </Text>
                    </View>
                  ))}
              </View>
            ) : null}
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

                if (isStreaming && !isUser) {
                  return renderStreamingContent(content);
                }
                return renderContentWithEmbeds(content);
              } catch {
                const content = getMessageContent() || "";
                return (
                  <Text style={[
                    baseTextStyle,
                    theme === "dark" && { color: "#E0E0E0" }
                  ]}>
                    {content}{isStreaming && !isUser ? " ▊" : ""}
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
  const userHasAgent = useAgentStore((s) => s.userHasAgent);
  const agentProfilePictureUrl = useAgentStore(
    (s) => s.agent?.profile_picture_url,
  );

  return (
    <View style={styles.messageContainer}>
      <AgentAvatar
        profilePictureUrl={userHasAgent ? agentProfilePictureUrl : null}
        theme={theme}
      />

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
    marginVertical: 10,
    paddingHorizontal: 8,
    alignItems: "flex-start",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
    paddingLeft: 52,
  },
  botMessageContainer: {
    justifyContent: "flex-start",
    paddingRight: 20,
  },
  avatarContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 2,
    backgroundColor: "#F0F4FF",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    resizeMode: "contain",
  },
  messageBubble: {
    maxWidth: "88%",
    borderRadius: 20,
    padding: 14,
    marginBottom: 4,
  },
  attachmentsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  attachmentImage: {
    width: 120,
    height: 120,
    borderRadius: 14,
  },
  attachmentDocChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D6DDE8",
    backgroundColor: "#F1F5F9",
    maxWidth: 260,
  },
  attachmentDocChipDark: {
    backgroundColor: "#0D0D0D",
    borderColor: "#2E3033",
  },
  attachmentDocText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Urbanist",
    color: "#2D3C52",
  },
  userBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDF3FC",
    borderTopRightRadius: 8,
  },
  botBubble: {
    flex: 1,
    maxWidth: "100%",
    paddingHorizontal: 0,
    paddingVertical: 2,
    borderTopLeftRadius: 8,
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
    tintColor: "#E0E0E0",
  },
  messageActionContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    justifyContent: "flex-start",
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
