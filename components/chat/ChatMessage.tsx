import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Design } from '@/utils/design';
import { Message } from '@/interface/Chat';

interface ChatMessageProps {
  message: Message;
  isLastMessage?: boolean;
}

export function ChatMessage({ message, isLastMessage }: ChatMessageProps) {
  const { isDark } = useTheme();
  const isUserMessage = message.role === 'user';

  return (
    <View style={[
      styles.container,
      isUserMessage ? styles.userMessageContainer : styles.aiMessageContainer,
    ]}>
      {!isUserMessage && (
        <Image
          source={require('@/assets/images/eddie/head.png')}
          style={styles.avatar}
        />
      )}

      <View style={[
        styles.messageBubble,
        isUserMessage
          ? { backgroundColor: isDark ? Design.colors.dark.surfaceInput : Design.colors.background.white }
          : { backgroundColor: isDark ? Design.colors.dark.surface : Design.colors.background.messageTint },
      ]}>
        <Text style={[
          styles.messageText,
          { color: isDark ? Design.colors.text.darkPrimary : Design.colors.text.primary }
        ]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: Design.spacing.md,
    marginVertical: Design.spacing.sm,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Design.spacing.sm,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 12,
    paddingHorizontal: Design.spacing.md,
    paddingVertical: Design.spacing.sm,
  },
  messageText: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.base,
    fontWeight: Design.typography.fontWeight.regular,
    lineHeight: Design.typography.lineHeight.base,
  },
});
