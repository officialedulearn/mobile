import React from 'react';
import { View, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Design } from '@/utils/design';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onRecordStart?: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChangeText,
  onSubmit,
  onRecordStart,
  isLoading = false,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const { isDark, colors, spacing } = useTheme();

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDark ? colors.dark.surface : colors.background.white,
        borderColor: isDark ? colors.dark.border : colors.border.input,
      }
    ]}>
      <TextInput
        style={[
          styles.input,
          { color: isDark ? colors.text.darkPrimary : colors.text.primary }
        ]}
        placeholder={placeholder}
        placeholderTextColor={isDark ? colors.text.darkSecondary : colors.text.placeholder}
        value={value}
        onChangeText={onChangeText}
        multiline
        editable={!isLoading}
      />

      <TouchableOpacity
        onPress={onRecordStart}
        style={styles.voiceButton}
        disabled={isLoading}
      >
        <Image
          source={require('@/assets/images/icons/microphone.png')}
          style={styles.voiceIcon}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSubmit}
        style={styles.sendButton}
        disabled={!value.trim() || isLoading}
      >
        <Image
          source={require('@/assets/images/icons/send.png')}
          style={styles.sendIcon}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Design.spacing.md,
    paddingVertical: Design.spacing.sm,
    borderTopWidth: 1,
    gap: Design.spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.base,
    paddingHorizontal: Design.spacing.sm,
    paddingVertical: Design.spacing.sm,
    maxHeight: 100,
  },
  voiceButton: {
    padding: Design.spacing.xs,
  },
  voiceIcon: {
    width: 24,
    height: 24,
  },
  sendButton: {
    padding: Design.spacing.xs,
  },
  sendIcon: {
    width: 24,
    height: 24,
  },
});
