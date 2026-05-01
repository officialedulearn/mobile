import { useTheme } from '@/hooks/useTheme';
import { Design } from '@/utils/design';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Presets } from 'react-native-pulsar';

interface StreakModalProps {
  streak: number;
  isSharing: boolean;
  onShare: () => void;
  onClose: () => void;
}

export function StreakModal({ streak, isSharing, onShare, onClose }: StreakModalProps) {
  const { isDark, colors, palette, spacing } = useTheme();
  Presets.applause()


  return (
    <View style={[styles.container, { paddingHorizontal: spacing.md }]}>
      <View style={[
        styles.modal,
        { backgroundColor: colors.surface }
      ]}>
        <View style={styles.topImageSection}>
          <Image
            source={require('@/assets/images/eddie/ellipse.png')}
            style={styles.ellipseOverlay}
            resizeMode="cover"
          />

          <View style={styles.imageContainer}>
            <Image
              source={require('@/assets/images/eddie/streak.png')}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.streakTextContainer}>
          <Text style={styles.streakText}>{streak}</Text>
          <Text style={[
            styles.streakSubtitle,
            { color: colors.textPrimary }
          ]}>
            Days streak
          </Text>
        </View>

        <Text style={[
          styles.title,
          { color: colors.textSecondary }
        ]}>
          You are on 🔥, Keep showing up daily
        </Text>

        <View style={[styles.buttonContainer, { gap: spacing.sm }]}>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: isDark ? colors.canvas : palette.mint.bubbleTint,
                borderColor: isDark ? colors.border : 'transparent',
              }
            ]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.buttonText,
              { color: isDark ? colors.textPrimary : palette.semantic.successDark }
            ]}>
              Close
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.hubFabBg,
                opacity: isSharing ? 0.6 : 1,
              }
            ]}
            onPress={onShare}
            activeOpacity={0.7}
            disabled={isSharing}
          >
            <Text style={[
              styles.buttonText,
              { color: colors.hubFabFg }
            ]}>
              {isSharing ? 'Preparing...' : 'Share'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    borderRadius: 24,
    paddingHorizontal: Design.spacing.mdLg,
    paddingBottom: Design.spacing.lg,
    paddingTop: Design.spacing.sm,
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2E3033',
  },
  topImageSection: {
    position: 'relative',
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Design.spacing.sm,
    marginBottom: Design.spacing.sm,
  },
  ellipseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  modalImage: {
    width: 130,
    height: 130,
  },
  streakTextContainer: {
    width: '100%',
  },
  streakText: {
    color: Design.colors.mint.DEFAULT,
    textAlign: 'center',
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontWeight: Design.typography.fontWeight.bold,
    lineHeight: 76.8,
    letterSpacing: 1.28,
    fontSize: 64,
    textShadowColor: '#049A4F',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  streakSubtitle: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontWeight: Design.typography.fontWeight.bold,
    lineHeight: Design.typography.fontSize.lg * 1.8,
    fontSize: Design.typography.fontSize.lg,
    textAlign: 'center',
  },
  title: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    fontWeight: Design.typography.fontWeight.medium,
    lineHeight: Design.typography.lineHeight.md,
    textAlign: 'center',
    marginBottom: Design.spacing.lg,
    paddingHorizontal: Design.spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    marginTop: Design.spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: Design.spacing.md,
    paddingHorizontal: Design.spacing.mdLg,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    fontWeight: Design.typography.fontWeight.semibold,
    lineHeight: Design.typography.lineHeight.md,
  },
});
