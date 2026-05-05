import { ScreenLoader } from "@/components";
import BackButton from "@/components/common/backButton";
import useAgentStore from "@/core/agentStore";
import useUserStore from "@/core/userState";
import { useScreenStyles } from "@/hooks/useScreenStyles";
import { useTheme } from "@/hooks/useTheme";
import { Design, getScreenTopPadding } from "@/utils/design";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EDDY = require("@/assets/images/eddie/Mischievous.png");

const PURPOSE_SNIPPETS = ["Short, clear answers. ", "Walk me through step by step. "] as const;

const AVATAR_PRESETS: { id: string; url: string }[] = [
  { id: "1", url: "https://api.dicebear.com/7.x/avataaars/png?seed=elara&size=256" },
  { id: "2", url: "https://api.dicebear.com/7.x/avataaars/png?seed=nova&size=256" },
  { id: "3", url: "https://api.dicebear.com/7.x/bottts/png?seed=sage&size=256" },
  { id: "4", url: "https://api.dicebear.com/7.x/notionists/png?seed=mentor&size=256" },
];

function isHttpUrl(s: string) {
  return /^https?:\/\/.+/i.test(s.trim());
}

function hapticLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

function hapticCta() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

const CreateAgent = () => {
  const insets = useSafeAreaInsets();
  const topPad = getScreenTopPadding(insets);
  const screen = useScreenStyles();
  const { colors, isDark, spacing, typography } = useTheme();

  const createAgentFn = useAgentStore((s) => s.createAgent);
  const uploadAgentProfilePictureFn = useAgentStore(
    (s) => s.uploadAgentProfilePicture,
  );
  const fetchUserAgentFn = useAgentStore((s) => s.fetchUserAgent);
  const userHasAgent = useAgentStore((s) => s.userHasAgent);
  const existingAgent = useAgentStore((s) => s.agent);
  const isAgentLoading = useAgentStore((s) => s.isLoading);
  const authUser = useUserStore((s) => s.user);

  const [phase, setPhase] = useState<"intro" | "form">("intro");
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);

  const trimmedUrl = profilePictureUrl.trim();
  const avatarPreviewUri =
    localImageUri ??
    (trimmedUrl.length > 0 && isHttpUrl(trimmedUrl) && !avatarLoadFailed ? trimmedUrl : null);
  const showAvatarPreview = avatarPreviewUri != null;
  const initial = useMemo(() => (name.trim()[0] || "A").toUpperCase(), [name]);
  const displayName = name.trim() || "Your agent";

  const onUrlChange = useCallback((t: string) => {
    setProfilePictureUrl(t);
    setAvatarLoadFailed(false);
    setLocalImageUri(null);
  }, []);

  const clearPhotoUrl = useCallback(() => {
    hapticLight();
    setProfilePictureUrl("");
    setAvatarLoadFailed(false);
    setLocalImageUri(null);
  }, []);

  const appendSnippet = useCallback((snippet: string) => {
    hapticLight();
    setPurpose((p) => (p ? `${p}${snippet}` : snippet));
  }, []);

  const pickPreset = useCallback((url: string) => {
    hapticLight();
    setProfilePictureUrl(url);
    setAvatarLoadFailed(false);
    setLocalImageUri(null);
  }, []);

  const pickFromLibrary = useCallback(async () => {
    hapticLight();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    setLocalImageUri(result.assets[0].uri);
    setProfilePictureUrl("");
    setAvatarLoadFailed(false);
  }, []);

  const goToForm = useCallback(() => {
    hapticLight();
    setPhase("form");
  }, []);

  const goToIntro = useCallback(() => {
    hapticLight();
    setPhase("intro");
  }, []);

  const handleCreateAgent = useCallback(async () => {
    if (!authUser?.id) return;
    if (!name.trim() || !purpose.trim()) return;
    setCreateBusy(true);
    try {
      const fallback = AVATAR_PRESETS[0].url;
      const urlPart =
        trimmedUrl.length > 0 && isHttpUrl(trimmedUrl) ? trimmedUrl : fallback;

      const created = await createAgentFn({
        userId: authUser.id,
        name: name.trim(),
        purpose: purpose.trim(),
        profile_picture_url: urlPart,
      });

      if (!created) {
        return;
      }

      let successImageUrl = created.profile_picture_url || "";
      if (localImageUri) {
        const uploaded = await uploadAgentProfilePictureFn(
          created.id,
          localImageUri,
        );
        successImageUrl = uploaded.profile_picture_url;
      }

      hapticCta();
      router.replace({
        pathname: "/agents/success",
        params: {
          agentName: created.name,
          agentImage: successImageUrl,
        },
      });
    } catch {
    } finally {
      setCreateBusy(false);
    }
  }, [
    authUser?.id,
    createAgentFn,
    localImageUri,
    name,
    purpose,
    trimmedUrl,
    uploadAgentProfilePictureFn,
  ]);

  useEffect(() => {
    if (!authUser?.id) return;
    void fetchUserAgentFn(authUser.id);
  }, [authUser?.id, fetchUserAgentFn]);

  if (isAgentLoading && !userHasAgent) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.canvas }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ScreenLoader visible message="Loading agent..." />
      </View>
    );
  }

  if (userHasAgent && existingAgent) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.canvas, paddingTop: topPad }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.introHeader}>
          <BackButton />
        </View>
        <View style={styles.agentDetailsContent}>
          <View style={[styles.agentDetailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {existingAgent.profile_picture_url ? (
              <ExpoImage
                source={{ uri: existingAgent.profile_picture_url }}
                style={[styles.detailsAvatar, { borderColor: colors.borderMuted }]}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.detailsAvatar,
                  styles.smallAvatarPlaceholder,
                  { backgroundColor: colors.modalIconBg, borderColor: colors.border },
                ]}
              >
                <Text style={{ fontFamily: "Satoshi-Bold", fontSize: 28, color: colors.brand }}>
                  {(existingAgent.name?.[0] || "A").toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={[typography.styles.sectionTitle, { color: colors.textPrimary, marginTop: 14 }]}>
              {existingAgent.name}
            </Text>
            <Text style={[styles.detailsPurpose, { color: colors.textSecondary }]}>
              {existingAgent.purpose}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (phase === "intro") {
    return (
      <View style={[styles.fill, { backgroundColor: colors.canvas, paddingTop: topPad }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.introHeader}>
          <BackButton />
        </View>
        <View style={styles.introContent}>
          <View style={[styles.mintHalo, { backgroundColor: isDark ? "rgba(0, 255, 128, 0.12)" : "rgba(0, 255, 128, 0.18)" }]}>
            <Image source={EDDY} style={styles.eddy} resizeMode="contain" />
          </View>
          <Text style={[typography.styles.sectionTitle, styles.introTitle, { color: colors.textPrimary }]}>
            A partner that fits how you learn
          </Text>
          <Text style={[styles.introBody, { color: colors.textSecondary }]}>
            Next, you’ll add a name, a short purpose, and a face. Nothing fancy — just who they are for you.
          </Text>
          <View style={styles.pillRow}>
            <View style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="sparkles" size={14} color={colors.brand} />
              <Text style={{ fontFamily: "Satoshi-Medium", fontSize: 12, color: colors.textSecondary, marginLeft: 6 }}>One quick step</Text>
            </View>
          </View>
        </View>
        <View style={[styles.introFooter, { paddingBottom: Math.max(insets.bottom, 20) + 8 }]}>
          <Pressable
            onPress={goToForm}
            style={({ pressed }) => [
              styles.introCta,
              { backgroundColor: colors.ctaPrimaryBg, opacity: pressed ? 0.92 : 1 },
            ]}
          >
            <Text style={{ fontFamily: "Satoshi-Medium", fontSize: 16, color: colors.ctaPrimaryFg }}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.ctaPrimaryFg} style={{ marginLeft: 8 }} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[screen.container, { backgroundColor: colors.canvas }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.formTop}>
          <Pressable
            onPress={goToIntro}
            style={({ pressed }) => [styles.ghostBack, { opacity: pressed ? 0.7 : 1 }]}
            hitSlop={12}
            accessibilityLabel="Back to intro"
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Text style={[typography.styles.screenTitle, { color: colors.textPrimary, paddingHorizontal: Design.spacing.md, marginBottom: 4 }]}>
          Your agent
        </Text>
        <Text
          style={{
            fontFamily: "Satoshi-Regular",
            fontSize: 14,
            color: colors.textSecondary,
            paddingHorizontal: Design.spacing.md,
            marginBottom: spacing.md,
          }}
        >
          Name, purpose, and photo
        </Text>

        <ScrollView
          style={styles.fill}
          contentContainerStyle={[
            screen.scrollContent,
            { paddingTop: 0, paddingBottom: insets.bottom + 100, gap: spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.softCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {showAvatarPreview && avatarPreviewUri ? (
              <ExpoImage
                source={{ uri: avatarPreviewUri }}
                style={[styles.smallAvatar, { borderColor: colors.borderMuted }]}
                contentFit="cover"
                transition={150}
                onError={() => {
                  if (!localImageUri) {
                    setAvatarLoadFailed(true);
                  }
                }}
              />
            ) : (
              <View
                style={[
                  styles.smallAvatar,
                  styles.smallAvatarPlaceholder,
                  { backgroundColor: colors.modalIconBg, borderColor: colors.border },
                ]}
              >
                <Text style={{ fontFamily: "Satoshi-Bold", fontSize: 22, color: colors.brand }}>{initial}</Text>
              </View>
            )}
            <View style={styles.softCardText}>
              <Text style={{ fontFamily: "Satoshi-Medium", fontSize: 16, color: colors.textPrimary }} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={{ fontFamily: "Satoshi-Regular", fontSize: 13, color: colors.textTertiary, marginTop: 4 }} numberOfLines={2}>
                {purpose.trim() || "Purpose shows here as you type"}
              </Text>
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={{ fontFamily: "Satoshi-Medium", fontSize: 13, color: colors.textTertiary, marginBottom: 6 }}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Nova, Exam buddy"
              placeholderTextColor={colors.placeholder}
              style={[styles.inputSoft, { color: colors.textPrimary, backgroundColor: colors.modalInputBg, borderColor: colors.modalInputBorder }]}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={{ fontFamily: "Satoshi-Medium", fontSize: 13, color: colors.textTertiary, marginBottom: 6 }}>Purpose</Text>
            <TextInput
              value={purpose}
              onChangeText={setPurpose}
              placeholder="What should they help you with?"
              placeholderTextColor={colors.placeholder}
              multiline
              textAlignVertical="top"
              style={[
                styles.inputSoft,
                styles.purposeBox,
                { color: colors.textPrimary, backgroundColor: colors.modalInputBg, borderColor: colors.modalInputBorder },
              ]}
            />
            <View style={styles.chipRow}>
              {PURPOSE_SNIPPETS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => appendSnippet(s)}
                  style={({ pressed }) => [
                    styles.miniChip,
                    { borderColor: colors.border, backgroundColor: colors.canvas, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={{ fontFamily: "Satoshi-Regular", fontSize: 12, color: colors.textSecondary }}>+ {s.trim()}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={{ fontFamily: "Satoshi-Medium", fontSize: 13, color: colors.textTertiary, marginBottom: 6 }}>Photo</Text>
            <View style={styles.presetRow}>
              {AVATAR_PRESETS.map((p) => {
                const active = localImageUri == null && profilePictureUrl.trim() === p.url;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => pickPreset(p.url)}
                    style={({ pressed }) => [
                      styles.preset,
                      { borderColor: active ? colors.brand : colors.border, opacity: pressed ? 0.9 : 1 },
                    ]}
                  >
                    <ExpoImage source={{ uri: p.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={pickFromLibrary}
              style={({ pressed }) => [
                styles.uploadPhotoRow,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.canvas,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Ionicons name="images-outline" size={18} color={colors.brand} />
              <Text style={{ fontFamily: "Satoshi-Medium", fontSize: 14, color: colors.textPrimary, marginLeft: 8 }}>
                Choose from library
              </Text>
            </Pressable>
            <View
              style={[
                styles.urlRow,
                { backgroundColor: colors.modalInputBg, borderColor: colors.modalInputBorder },
              ]}
            >
              <Ionicons name="link-outline" size={16} color={colors.textTertiary} style={{ marginLeft: 12 }} />
              <TextInput
                value={profilePictureUrl}
                onChangeText={onUrlChange}
                placeholder="Or paste an image URL"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={[styles.urlField, { color: colors.textPrimary }]}
              />
              {profilePictureUrl.length > 0 || localImageUri ? (
                <Pressable onPress={clearPhotoUrl} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.canvas, borderTopColor: colors.border },
          ]}
        >
          <Pressable
            onPress={handleCreateAgent}
            disabled={createBusy || !authUser?.id}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: colors.ctaPrimaryBg,
                opacity:
                  pressed || createBusy || !authUser?.id ? 0.72 : 1,
              },
            ]}
          >
            {createBusy ? (
              <ActivityIndicator color={colors.ctaPrimaryFg} />
            ) : (
              <Text style={{ fontFamily: "Satoshi-Medium", fontSize: 16, color: colors.ctaPrimaryFg }}>Create agent</Text>
            )}
          </Pressable>
        </View>
        <ScreenLoader visible={createBusy} message="Creating agent..." />
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreateAgent;

const styles = StyleSheet.create({
  fill: { flex: 1 },
  introHeader: {
    paddingHorizontal: Design.spacing.md,
    marginBottom: 8,
  },
  introContent: {
    flex: 1,
    paddingHorizontal: Design.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  mintHalo: {
    width: 220,
    height: 220,
    borderRadius: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Design.spacing.xl,
  },
  eddy: {
    width: "90%",
    height: "90%",
  },
  introTitle: {
    textAlign: "center",
    marginBottom: 10,
  },
  introBody: {
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 320,
  },
  pillRow: { marginTop: 20 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  introFooter: {
    paddingHorizontal: Design.spacing.lg,
    paddingTop: 8,
  },
  introCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 16,
  },
  formTop: {
    paddingHorizontal: Design.spacing.md,
    marginBottom: 4,
  },
  ghostBack: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  softCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  smallAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
  },
  smallAvatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  softCardText: { flex: 1, minWidth: 0 },
  fieldBlock: { gap: 0 },
  inputSoft: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
  },
  purposeBox: { minHeight: 96, paddingTop: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  miniChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  uploadPhotoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  preset: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    overflow: "hidden",
  },
  urlRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 16, paddingRight: 10 },
  urlField: { flex: 1, fontSize: 15, paddingVertical: 12, fontFamily: "Satoshi-Regular" },
  footer: { borderTopWidth: 1, paddingHorizontal: Design.spacing.md, paddingTop: 10 },
  cta: { borderRadius: 999, paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  agentDetailsContent: {
    flex: 1,
    paddingHorizontal: Design.spacing.md,
    justifyContent: "center",
  },
  agentDetailsCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  detailsAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
  },
  detailsPurpose: {
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
  },
});
