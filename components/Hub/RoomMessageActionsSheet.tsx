import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import type { RoomMessageWithUI } from "@/interface/Community";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo } from "react";
import { Text, View } from "react-native";
import { MessageBodyWithMentions } from "./MessageBodyWithMentions";
import { styles } from "./room.styles";

type Theme = "dark" | "light";

type Props = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  snapPoints: (string | number)[];
  theme: Theme;
  selectedMessage: RoomMessageWithUI | null;
  isMod: boolean;
  onClose: () => void;
  onReaction: (emoji: string) => void;
  onDeleteMessage: () => Promise<void>;
};

export function RoomMessageActionsSheet({
  sheetRef,
  snapPoints,
  theme,
  selectedMessage,
  isMod,
  onClose,
  onReaction,
  onDeleteMessage,
}: Props) {
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  const reactingUserLabel = useMemo(() => {
    if (!selectedMessage) return "@user";
    return (
      selectedMessage.userName || `@${selectedMessage.user.username}` || "@user"
    );
  }, [selectedMessage]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={[
        styles.bottomSheetBackground,
        theme === "dark" && styles.darkBottomSheetBackground,
      ]}
      handleIndicatorStyle={[
        styles.bottomSheetIndicator,
        theme === "dark" && styles.darkBottomSheetIndicator,
      ]}
      enablePanDownToClose={true}
    >
      <BottomSheetView style={styles.bottomSheetContent}>
        <AnimatedPressable
          style={styles.closeButton}
          onPress={onClose}
          scale={0.85}
          hapticFeedback={true}
        >
          <FontAwesome5
            name="times"
            size={20}
            color={theme === "dark" ? "#b3b3b3" : "#61728C"}
          />
        </AnimatedPressable>

        <View style={styles.reactingToSection}>
          <View style={styles.reactingToHeader}>
            <Entypo
              name="emoji-happy"
              size={16}
              color={theme === "dark" ? "#b3b3b3" : "#61728C"}
            />
            <Text
              style={[
                styles.reactingToText,
                theme === "dark" && styles.darkReactingToText,
              ]}
            >
              Reacting to
            </Text>
          </View>
          <View
            style={[
              styles.reactingToMessageBox,
              theme === "dark" && styles.darkReactingToMessageBox,
            ]}
          >
            <Text
              style={[
                styles.reactingToMessage,
                theme === "dark" && styles.darkReactingToMessage,
              ]}
            >
              <Text
                style={[
                  styles.mentionText,
                  theme === "dark" && styles.darkMentionText,
                ]}
              >
                {reactingUserLabel}
              </Text>{" "}
              <MessageBodyWithMentions
                content={
                  selectedMessage?.message || selectedMessage?.content || ""
                }
                baseStyle={[
                  styles.reactingToMessage,
                  theme === "dark" && styles.darkReactingToMessage,
                ]}
                mentionStyle={[
                  styles.mentionText,
                  theme === "dark" && styles.darkMentionText,
                ]}
              />
            </Text>
          </View>
        </View>
        <View style={styles.emojiReactionsRow}>
          {(["💚", "💪", "👍", "👎", "💔", "😊"] as const).map((emoji) => (
            <AnimatedPressable
              key={emoji}
              style={styles.emojiReactionButton}
              scale={0.85}
              hapticFeedback={true}
              onPress={() => onReaction(emoji)}
            >
              <Text style={styles.emojiReaction}>{emoji}</Text>
            </AnimatedPressable>
          ))}
        </View>
        <View style={styles.actionButtonsContainer}>
          <AnimatedPressable
            style={styles.actionButton}
            scale={0.97}
            hapticFeedback={true}
          >
            <FontAwesome5
              name="copy"
              size={18}
              color={theme === "dark" ? "#b3b3b3" : "#4A5568"}
            />
            <Text
              style={[
                styles.actionButtonText,
                theme === "dark" && styles.darkActionButtonText,
              ]}
            >
              Copy Text
            </Text>
          </AnimatedPressable>

          <AnimatedPressable
            style={styles.actionButton}
            scale={0.97}
            hapticFeedback={true}
          >
            <FontAwesome5
              name="user"
              size={18}
              color={theme === "dark" ? "#b3b3b3" : "#4A5568"}
            />
            <Text
              style={[
                styles.actionButtonText,
                theme === "dark" && styles.darkActionButtonText,
              ]}
            >
              View Profile
            </Text>
          </AnimatedPressable>

          {isMod && (
            <AnimatedPressable
              style={[styles.actionButton, styles.actionButtonDanger]}
              scale={0.97}
              hapticFeedback={true}
              hapticStyle="medium"
            >
              <FontAwesome5 name="user-times" size={18} color="#FF3B30" />
              <Text
                style={[styles.actionButtonText, styles.actionButtonTextDanger]}
              >
                Remove User
              </Text>
            </AnimatedPressable>
          )}

          {(isMod || selectedMessage?.isCurrentUser) && selectedMessage ? (
            <AnimatedPressable
              style={[styles.actionButton, styles.actionButtonDanger]}
              scale={0.97}
              hapticFeedback={true}
              hapticStyle="medium"
              onPress={async () => {
                await onDeleteMessage();
              }}
            >
              <FontAwesome5 name="trash" size={18} color="#FF3B30" />
              <Text
                style={[styles.actionButtonText, styles.actionButtonTextDanger]}
              >
                Delete Message
              </Text>
            </AnimatedPressable>
          ) : null}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
