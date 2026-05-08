import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import type { RoomMessageWithUI } from "@/interface/Community";
import { formatDateHeader } from "@/utils/hub/roomFormatting";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";
import { MessageBodyWithMentions } from "./MessageBodyWithMentions";
import { styles } from "./room.styles";

type Theme = "dark" | "light";

type Props = {
  msg: RoomMessageWithUI;
  prevMsg: RoomMessageWithUI | undefined;
  theme: Theme;
  onLongPress: (msg: RoomMessageWithUI) => void;
};

function RoomReactionRow({
  reactions,
  theme,
  variant,
}: {
  reactions: RoomMessageWithUI["reactions"];
  theme: Theme;
  variant: "current" | "other";
}) {
  const entries = Object.entries(reactions);
  if (entries.length === 0) return null;

  return (
    <View
      style={
        variant === "current"
          ? styles.currentUserReactionsContainer
          : styles.otherUserReactionsContainer
      }
    >
      <View
        style={
          variant === "current" ? styles.currentUserReactions : styles.reactions
        }
      >
        {entries.map(([emoji, count]) => (
          <View
            key={emoji}
            style={[
              styles.reactionBadge,
              theme === "dark" && styles.darkReactionBadge,
            ]}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            <Text
              style={[
                styles.reactionCount,
                theme === "dark" && styles.darkReactionCount,
              ]}
            >
              {String(count)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function hasUsableAvatarUrl(url: string | null | undefined): boolean {
  return typeof url === "string" && url.trim().length > 0;
}

export function RoomMessageItem({ msg, prevMsg, theme, onLongPress }: Props) {
  const showDateDivider = !prevMsg || msg.date !== prevMsg.date;
  const otherAvatarUri = msg.userAvatar || msg.user.profilePictureURL;
  const showOtherAvatarImage = hasUsableAvatarUrl(otherAvatarUri);

  return (
    <View>
      {showDateDivider && (
        <View style={styles.dateDivider}>
          <View
            style={[
              styles.dateDividerLine,
              theme === "dark" && styles.darkDateDividerLine,
            ]}
          />
          <Text
            style={[
              styles.dateDividerText,
              theme === "dark" && styles.darkDateDividerText,
            ]}
          >
            {formatDateHeader(msg.date)}
          </Text>
          <View
            style={[
              styles.dateDividerLine,
              theme === "dark" && styles.darkDateDividerLine,
            ]}
          />
        </View>
      )}

      <View style={styles.messageWrapper}>
        {msg.isCurrentUser ? (
          <>
            <View style={styles.currentUserMessageContainer}>
              <AnimatedPressable
                style={[
                  styles.currentUserMessage,
                  theme === "dark" && styles.darkCurrentUserMessage,
                  msg.id.startsWith("temp-") && styles.tempMessage,
                ]}
                onLongPress={() => onLongPress(msg)}
                scale={0.98}
                hapticFeedback={true}
                hapticStyle="medium"
              >
                <MessageBodyWithMentions
                  content={msg.message || msg.content}
                  baseStyle={
                    theme === "dark"
                      ? styles.waCurrentUserTextDark
                      : styles.waCurrentUserTextLight
                  }
                  mentionStyle={
                    theme === "dark"
                      ? styles.waCurrentUserMentionDark
                      : styles.waCurrentUserMentionLight
                  }
                />
              </AnimatedPressable>
            </View>
            <RoomReactionRow
              reactions={msg.reactions}
              theme={theme}
              variant="current"
            />
          </>
        ) : (
          <>
            <View style={styles.otherUserMessageContainer}>
              {showOtherAvatarImage ? (
                <Image
                  source={{ uri: otherAvatarUri?.trim() }}
                  style={styles.userAvatar}
                />
              ) : (
                <View
                  style={[
                    styles.userAvatarPlaceholder,
                    theme === "dark" && styles.userAvatarPlaceholderDark,
                  ]}
                  accessibilityLabel="No profile picture"
                  accessibilityRole="image"
                >
                  <Ionicons name="person-outline" size={18} color="#8696A0" />
                </View>
              )}
              <AnimatedPressable
                style={[
                  styles.otherUserMessage,
                  theme === "dark" && styles.darkOtherUserMessage,
                ]}
                onLongPress={() => onLongPress(msg)}
                scale={0.98}
                hapticFeedback={true}
                hapticStyle="medium"
              >
                <View style={styles.messageHeader}>
                  <View style={styles.userNameRow}>
                    <Text
                      style={[
                        styles.userName,
                        theme === "dark" && styles.darkUserName,
                      ]}
                    >
                      {msg.userName || `@${msg.user.username}`}
                    </Text>
                    {msg.isMod && (
                      <View
                        style={[
                          styles.modBadge,
                          theme === "dark" && styles.darkModBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.modBadgeText,
                            theme === "dark" && styles.darkModBadgeText,
                          ]}
                        >
                          MOD
                        </Text>
                      </View>
                    )}
                    <Text style={styles.timestamp}> • {msg.time}</Text>
                  </View>
                </View>
                <MessageBodyWithMentions
                  content={msg.message || msg.content}
                  baseStyle={[
                    styles.messageText,
                    theme === "dark" && styles.darkMessageText,
                  ]}
                  mentionStyle={[
                    styles.messageMentionText,
                    theme === "dark" && styles.darkMessageMentionText,
                  ]}
                />
              </AnimatedPressable>
            </View>
            <RoomReactionRow
              reactions={msg.reactions}
              theme={theme}
              variant="other"
            />
          </>
        )}
      </View>
    </View>
  );
}
