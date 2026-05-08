import { useTheme } from "@/hooks/useTheme";
import { Design } from "@/utils/design";
import { Image } from "expo-image";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Confetti } from "react-native-fast-confetti";
import { Presets } from "react-native-pulsar";

import LoadingSpinner from "@/components/common/LoadingSpinner";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";

interface StreakModalProps {
  streak: number;
  isSharing: boolean;
  visible?: boolean;
  onShare: () => void;
  onClose: () => void;
}

const MILESTONES = new Set([3, 7, 14, 30, 50, 100]);

function isMilestone(streak: number) {
  return MILESTONES.has(streak);
}

export function StreakModal({
  streak,
  isSharing,
  visible = true,
  onShare,
  onClose,
}: StreakModalProps) {
  const { isDark, colors, palette, spacing } = useTheme();

  const [reduceMotionEnabled, setReduceMotionEnabled] = React.useState(false);
  const [displayStreak, setDisplayStreak] = React.useState(0);
  const [confettiKey, setConfettiKey] = React.useState(0);
  const [showConfetti, setShowConfetti] = React.useState(false);

  const shouldCelebrate =
    visible && isMilestone(streak) && !reduceMotionEnabled;

  // SFX: reuse the existing notification sound as a short "spark/click" for now.
  const sparkPlayer = useAudioPlayer(require("@/assets/notification.mp3"), {
    keepAudioSessionActive: false,
    updateInterval: 1000,
  });

  const cardScale = useSharedValue(0.92);
  const cardTranslateY = useSharedValue(10);
  const cardOpacity = useSharedValue(0);

  const heroTranslateY = useSharedValue(8);
  const heroOpacity = useSharedValue(0);

  const numberScale = useSharedValue(1);
  const glowPulse = useSharedValue(0);

  const mascotScale = useSharedValue(1);
  const mascotRotate = useSharedValue(0);

  const sharePulse = useSharedValue(0);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const enabled = await AccessibilityInfo.isReduceMotionEnabled();
        if (mounted) setReduceMotionEnabled(enabled);
      } catch {
        // ignore
      }
    })();

    const sub = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      (enabled) => {
        setReduceMotionEnabled(!!enabled);
      },
    );

    return () => {
      mounted = false;
      // RN types differ across versions.
      if (
        sub &&
        typeof (sub as unknown as { remove?: () => void }).remove === "function"
      ) {
        (sub as unknown as { remove: () => void }).remove();
      }
    };
  }, []);

  const playSpark = React.useCallback(async () => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: "mixWithOthers",
        allowsRecording: false,
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });

      sparkPlayer.volume = 0.22;
      sparkPlayer.playbackRate = 1.05;
      await sparkPlayer.seekTo(0);
      sparkPlayer.play();
    } catch {
      // ignore SFX errors
    }
  }, [sparkPlayer]);

  const animateCountUp = React.useCallback(() => {
    setDisplayStreak(0);
    if (reduceMotionEnabled) {
      setDisplayStreak(streak);
      return;
    }

    const durationMs = 780;
    const start = Date.now();
    const target = Math.max(0, Math.floor(streak));
    const tickMs = 16;

    const timer = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(eased * target);
      setDisplayStreak(v);

      if (t >= 1) {
        clearInterval(timer);
        numberScale.value = withSequence(
          withSpring(1.04, { damping: 18, stiffness: 260 }),
          withSpring(1, { damping: 18, stiffness: 260 }),
        );
        cancelAnimation(glowPulse);
        glowPulse.value = withTiming(0, { duration: 160 });
      }
    }, tickMs);

    return () => clearInterval(timer);
  }, [glowPulse, numberScale, reduceMotionEnabled, streak]);

  React.useEffect(() => {
    if (!visible) return;

    cardOpacity.value = withTiming(1, { duration: 160 });
    cardScale.value = withSpring(1, { damping: 16, stiffness: 240, mass: 0.8 });
    cardTranslateY.value = withSpring(0, {
      damping: 16,
      stiffness: 240,
      mass: 0.8,
    });

    heroOpacity.value = withDelay(
      80,
      withTiming(1, { duration: 180, easing: Easing.out(Easing.ease) }),
    );
    heroTranslateY.value = withDelay(
      80,
      withSpring(0, { damping: 16, stiffness: 220, mass: 0.8 }),
    );

    const cleanup = animateCountUp();
    if (!reduceMotionEnabled) {
      glowPulse.value = withRepeat(
        withTiming(1, { duration: 520, easing: Easing.out(Easing.ease) }),
        -1,
        true,
      );
    }

    if (isMilestone(streak) && !reduceMotionEnabled) {
      Presets.applause();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConfettiKey((k) => k + 1);
      setShowConfetti(true);
      playSpark();
    } else {
      playSpark();
    }

    return () => {
      cleanup?.();
      cancelAnimation(glowPulse);
      glowPulse.value = 0;
    };
  }, [
    animateCountUp,
    cardOpacity,
    cardScale,
    cardTranslateY,
    glowPulse,
    heroOpacity,
    heroTranslateY,
    playSpark,
    reduceMotionEnabled,
    streak,
    visible,
  ]);

  React.useEffect(() => {
    if (!showConfetti) return;
    const ms = shouldCelebrate ? 1700 : 950;
    const t = setTimeout(() => setShowConfetti(false), ms);
    return () => clearTimeout(t);
  }, [shouldCelebrate, showConfetti]);

  React.useEffect(() => {
    if (visible) return;
    // Reset to the "closed" pose so the next open always feels intentional.
    cardOpacity.value = 0;
    cardScale.value = 0.92;
    cardTranslateY.value = 10;
    heroOpacity.value = 0;
    heroTranslateY.value = 8;
    cancelAnimation(glowPulse);
    glowPulse.value = 0;
    setDisplayStreak(0);
    setShowConfetti(false);
  }, [
    cardOpacity,
    cardScale,
    cardTranslateY,
    glowPulse,
    heroOpacity,
    heroTranslateY,
    visible,
  ]);

  React.useEffect(() => {
    if (!visible) return;
    if (!isSharing) {
      cancelAnimation(sharePulse);
      sharePulse.value = 0;
      return;
    }
    if (reduceMotionEnabled) return;

    sharePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 520, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 520, easing: Easing.out(Easing.ease) }),
      ),
      -1,
      true,
    );

    return () => cancelAnimation(sharePulse);
  }, [isSharing, reduceMotionEnabled, sharePulse, visible]);

  const onMascotPress = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (reduceMotionEnabled) return;

    mascotScale.value = withSequence(
      withSpring(1.06, { damping: 14, stiffness: 280 }),
      withSpring(1, { damping: 14, stiffness: 280 }),
    );
    mascotRotate.value = withSequence(
      withTiming(-6, { duration: 80 }),
      withTiming(6, { duration: 120 }),
      withTiming(-4, { duration: 120 }),
      withTiming(0, { duration: 80 }),
    );

    setConfettiKey((k) => k + 1);
    setShowConfetti(true);
    playSpark();
  }, [mascotRotate, mascotScale, playSpark, reduceMotionEnabled]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { translateY: cardTranslateY.value },
      { scale: cardScale.value },
    ],
  }));

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslateY.value }],
  }));

  const numberAnimatedStyle = useAnimatedStyle(() => {
    const glow = interpolate(glowPulse.value, [0, 1], [0, 1]);
    return {
      transform: [{ scale: numberScale.value }],
      shadowOpacity: 0.25 + glow * 0.35,
    };
  });

  const mascotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: mascotScale.value },
      { rotate: `${mascotRotate.value}deg` },
    ],
  }));

  const shareAnimatedStyle = useAnimatedStyle(() => {
    const s = reduceMotionEnabled ? 1 : 1 + sharePulse.value * 0.02;
    const o = reduceMotionEnabled ? 1 : 1 - sharePulse.value * 0.06;
    return { transform: [{ scale: s }], opacity: o };
  });

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.md }]}>
      <Animated.View
        style={[
          styles.modal,
          {
            backgroundColor: colors.surface,
            borderColor: isDark ? colors.border : "#2E3033",
          },
          cardAnimatedStyle,
        ]}
      >
        {visible && showConfetti && !reduceMotionEnabled && (
          <View pointerEvents="none" style={styles.confettiWrap}>
            <Confetti
              key={confettiKey}
              count={shouldCelebrate ? 160 : 45}
              isInfinite={false}
              fallDuration={shouldCelebrate ? 1600 : 900}
              blastDuration={shouldCelebrate ? 240 : 140}
              colors={["#00FF80", "#8FEEFF", "#FFE066", "#B794F6", "#FF8FAB"]}
              fadeOutOnEnd
            />
          </View>
        )}

        <Animated.View style={[styles.topImageSection, heroAnimatedStyle]}>
          <Image
            source={require("@/assets/images/eddie/ellipse.png")}
            style={styles.ellipseOverlay}
            resizeMode="cover"
          />

          <View style={styles.imageContainer}>
            <Pressable onPress={onMascotPress} hitSlop={10}>
              <Animated.View style={mascotAnimatedStyle}>
                <Image
                  source={require("@/assets/images/eddie/streak.png")}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              </Animated.View>
            </Pressable>
          </View>
        </Animated.View>

        <View style={styles.streakTextContainer}>
          <Animated.Text style={[styles.streakText, numberAnimatedStyle]}>
            {displayStreak}
          </Animated.Text>
          <Text style={[styles.streakSubtitle, { color: colors.textPrimary }]}>
            Days streak
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.textSecondary }]}>
          You are on 🔥 Keep showing up.
        </Text>

        <View style={[styles.buttonContainer, { gap: spacing.sm }]}>
          <AnimatedPressable
            style={[
              styles.button,
              {
                backgroundColor: isDark
                  ? colors.canvas
                  : palette.mint.bubbleTint,
                borderColor: isDark ? colors.border : "transparent",
              },
            ]}
            onPress={() => {
              playSpark();
              onClose();
            }}
            hapticFeedback
            hapticStyle="light"
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: isDark
                    ? colors.textPrimary
                    : palette.semantic.successDark,
                },
              ]}
            >
              Close
            </Text>
          </AnimatedPressable>

          <Animated.View style={shareAnimatedStyle}>
            <AnimatedPressable
              style={[
                styles.button,
                {
                  backgroundColor: colors.hubFabBg,
                  opacity: isSharing ? 0.8 : 1,
                },
              ]}
              onPress={() => {
                playSpark();
                onShare();
              }}
              hapticFeedback
              hapticStyle="medium"
              disabled={isSharing}
            >
              <View style={styles.shareInner}>
                {isSharing ? (
                  <LoadingSpinner
                    size="small"
                    color={colors.hubFabFg}
                    style={styles.shareSpinner}
                  />
                ) : null}
                <Text style={[styles.buttonText, { color: colors.hubFabFg }]}>
                  {isSharing ? "Preparing..." : "Share"}
                </Text>
              </View>
            </AnimatedPressable>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    borderRadius: 24,
    paddingHorizontal: Design.spacing.mdLg,
    paddingBottom: Design.spacing.lg,
    paddingTop: Design.spacing.sm,
    alignItems: "center",
    position: "relative",
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2E3033",
  },
  confettiWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  topImageSection: {
    position: "relative",
    width: "100%",
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Design.spacing.sm,
    marginBottom: Design.spacing.sm,
  },
  ellipseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  imageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  modalImage: {
    width: 130,
    height: 130,
  },
  streakTextContainer: {
    width: "100%",
  },
  streakText: {
    color: Design.colors.mint.DEFAULT,
    textAlign: "center",
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontWeight: Design.typography.fontWeight.bold,
    lineHeight: 76.8,
    letterSpacing: 1.28,
    fontSize: 64,
    textShadowColor: "#049A4F",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
    shadowColor: "#049A4F",
  },
  streakSubtitle: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontWeight: Design.typography.fontWeight.bold,
    lineHeight: Design.typography.fontSize.lg * 1.8,
    fontSize: Design.typography.fontSize.lg,
    textAlign: "center",
  },
  title: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    fontWeight: Design.typography.fontWeight.medium,
    lineHeight: Design.typography.lineHeight.md,
    textAlign: "center",
    marginBottom: Design.spacing.lg,
    paddingHorizontal: Design.spacing.sm,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    marginTop: Design.spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: Design.spacing.md,
    paddingHorizontal: Design.spacing.mdLg,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  buttonText: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    fontWeight: Design.typography.fontWeight.semibold,
    lineHeight: Design.typography.lineHeight.md,
  },
  shareInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  shareSpinner: {
    transform: [{ scale: 0.7 }],
  },
});
