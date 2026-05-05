import useAgentStore from "@/core/agentStore";
import useUserStore from "@/core/userState";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Confetti } from "react-native-fast-confetti";
import { Presets } from "react-native-pulsar";

const AgentSuccess = () => {
  const { colors, spacing, typography, isDark } = useTheme();
  const { agentName, agentImage } = useLocalSearchParams<{
    agentName?: string;
    agentImage?: string;
  }>();
  const storeAgent = useAgentStore((s) => s.agent);
  const user = useUserStore((s) => s.user);

  const displayName = useMemo(() => {
    if (typeof agentName === "string" && agentName.trim().length > 0) {
      return agentName.trim();
    }
    return storeAgent?.name || "Your agent";
  }, [agentName, storeAgent?.name]);

  const imageUri = useMemo(() => {
    if (typeof agentImage === "string" && agentImage.trim().length > 0) {
      return agentImage.trim();
    }
    return storeAgent?.profile_picture_url || "";
  }, [agentImage, storeAgent?.profile_picture_url]);

  useEffect(() => {
    Presets.triumph();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Confetti
        count={220}
        isInfinite={false}
        fallDuration={3800}
        blastDuration={260}
        colors={["#00FF80", "#8FEEFF", "#FFE066", "#B794F6", "#FF8FAB"]}
        fadeOutOnEnd
      />

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            paddingHorizontal: spacing.lg,
          },
        ]}
      >
        <View
          style={[
            styles.avatarWrap,
            {
              borderColor: colors.border,
              backgroundColor: isDark ? "#111" : "#F4F7FB",
            },
          ]}
        >
          {imageUri ? (
            <ExpoImage source={{ uri: imageUri }} style={styles.avatar} contentFit="cover" />
          ) : (
            <Text style={[styles.initial, { color: colors.brand }]}>
              {(displayName[0] || "A").toUpperCase()}
            </Text>
          )}
        </View>

        <Text
          style={[
            typography.styles.sectionTitle,
            styles.title,
            { color: colors.textPrimary },
          ]}
        >
          Agent created
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {displayName} is ready to learn with you.
        </Text>

        <View style={styles.pill}>
          <Ionicons name="sparkles" size={14} color={colors.brand} />
          <Text style={[styles.pillText, { color: colors.textSecondary }]}>
            You can start chatting now
          </Text>
        </View>

        <Pressable
          onPress={() => router.replace("/(tabs)")}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: colors.ctaPrimaryBg, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={[styles.ctaText, { color: colors.ctaPrimaryFg }]}>
            Go to Home
          </Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.secondaryBtn}>
          <Text style={[styles.secondaryText, { color: colors.textTertiary }]}>
            Back
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default AgentSuccess;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    alignItems: "center",
    paddingVertical: 24,
  },
  avatarWrap: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 16,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  initial: {
    fontSize: 42,
    fontFamily: "Satoshi-Bold",
  },
  title: {
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  pillText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 13,
  },
  cta: {
    width: "100%",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontFamily: "Satoshi-Medium",
    fontSize: 16,
  },
  secondaryBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  secondaryText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 13,
  },
});