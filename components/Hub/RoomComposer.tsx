import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import type { CommunityMember } from "@/interface/Community";
import { Image } from "expo-image";
import React from "react";
import {
  Animated,
  LayoutChangeEvent,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { styles } from "./room.styles";

type Theme = "dark" | "light";

type Props = {
  theme: Theme;
  message: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  textInputRef: React.RefObject<TextInput | null>;
  onSelectionChange: (selection: { start: number; end: number }) => void;
  typingUsers: string[];
  typingOpacity: Animated.Value;
  activeMentionSuggestions: CommunityMember[];
  onFooterLayout: (height: number) => void;
  composerHeight: SharedValue<number>;
  onApplyMention: (member: CommunityMember) => void;
};

export function RoomComposer({
  theme,
  message,
  onChangeText,
  onSend,
  textInputRef,
  onSelectionChange,
  typingUsers,
  typingOpacity,
  activeMentionSuggestions,
  onFooterLayout,
  composerHeight,
  onApplyMention,
}: Props) {
  const showMentions = activeMentionSuggestions.length > 0;

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => {
        onFooterLayout(e.nativeEvent.layout.height);
      }}
    >
      {typingUsers.length > 0 && (
        <Animated.View
          style={[
            styles.typingIndicatorContainer,
            theme === "dark" && styles.darkTypingIndicatorContainer,
            { opacity: typingOpacity },
          ]}
        >
          <Text
            style={[
              styles.typingIndicatorText,
              theme === "dark" && styles.darkTypingIndicatorText,
            ]}
          >
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing...`
              : `${typingUsers.slice(0, 2).join(", ")}${typingUsers.length > 2 ? ` and ${typingUsers.length - 2} others` : ""} are typing...`}
          </Text>
        </Animated.View>
      )}

      {showMentions && (
        <View
          style={[
            styles.mentionSuggestionWrap,
            theme === "dark" && styles.darkMentionSuggestionWrap,
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={styles.mentionSuggestionScroll}
            showsVerticalScrollIndicator={false}
          >
            {activeMentionSuggestions.map((member) => (
              <TouchableOpacity
                key={member.user.id}
                style={[
                  styles.mentionSuggestionRow,
                  theme === "dark" && styles.darkMentionSuggestionRow,
                ]}
                onPress={() => onApplyMention(member)}
                activeOpacity={0.7}
              >
                <Image
                  source={
                    member.user.profilePictureURL
                      ? { uri: member.user.profilePictureURL }
                      : require("@/assets/images/memoji.png")
                  }
                  style={styles.mentionSuggestionAvatar}
                />
                <View style={styles.mentionSuggestionTextCol}>
                  <Text
                    style={[
                      styles.mentionSuggestionName,
                      theme === "dark" && styles.darkMentionSuggestionName,
                    ]}
                    numberOfLines={1}
                  >
                    {member.user.name}
                  </Text>
                  <Text
                    style={[
                      styles.mentionSuggestionUser,
                      theme === "dark" && styles.darkMentionSuggestionUser,
                    ]}
                    numberOfLines={1}
                  >
                    @{member.user.username}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View
        onLayout={(e: LayoutChangeEvent) => {
          composerHeight.value = e.nativeEvent.layout.height;
        }}
        style={[
          styles.inputContainer,
          theme === "dark" && styles.darkInputContainer,
        ]}
      >
        <TextInput
          ref={textInputRef}
          style={[styles.input, theme === "dark" && styles.darkInput]}
          placeholder="Type a message..."
          placeholderTextColor={theme === "dark" ? "#b3b3b3" : "#A0AEC0"}
          value={message}
          onChangeText={onChangeText}
          onSelectionChange={(e) => onSelectionChange(e.nativeEvent.selection)}
          multiline
        />
        <AnimatedPressable
          style={styles.sendButton}
          scale={0.85}
          hapticFeedback={true}
          hapticStyle="medium"
          onPress={onSend}
          disabled={!message.trim()}
        >
          <Image
            source={
              theme === "dark"
                ? require("@/assets/images/icons/dark/send-2.png")
                : require("@/assets/images/icons/send-2.png")
            }
            style={styles.messageActionIcon}
          />
        </AnimatedPressable>
      </View>
    </View>
  );
}
