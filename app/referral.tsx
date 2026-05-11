import BackButton from "@/components/common/backButton";
import useReferralStore from "@/core/referralState";
import useUserStore from "@/core/userState";
import { useTheme } from "@/hooks/useTheme";
import type { ReferralLeaderboardEntry } from "@/interface/referral";
import { createReferralDeepLink } from "@/utils/deepLinks";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  DimensionValue,
  Easing,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const getHighQualityImageUrl = (
  url: string | null | undefined,
): string | undefined => {
  if (!url || typeof url !== "string") return undefined;
  return url
    .replace(/_normal(\.[a-z]+)$/i, "_400x400$1")
    .replace(/_mini(\.[a-z]+)$/i, "_400x400$1")
    .replace(/_bigger(\.[a-z]+)$/i, "_400x400$1");
};

const getLevelColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case "expert":
      return "#FF6B6B";
    case "advanced":
      return "#00FF66";
    case "intermediate":
      return "#61728C";
    case "beginner":
      return "#A78BFA";
    default:
      return "#61728C";
  }
};

const formatReferralEarnings = (value: number): string => {
  if (!Number.isFinite(value)) return "0";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

function SkeletonBar({
  width,
  height,
  radius = 8,
  style,
}: {
  width: DimensionValue;
  height: number;
  radius?: number;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => {
      loop.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeletonBar,
        { width, height, borderRadius: radius, opacity },
        style,
      ]}
    />
  );
}

function ReferralLoadingSkeleton({ dark }: { dark: boolean }) {
  return (
    <View style={styles.skeletonWrap}>
      <View style={[styles.skeletonHero, dark && styles.skeletonHeroDark]}>
        <SkeletonBar width="70%" height={20} />
        <SkeletonBar width="92%" height={14} />
        <SkeletonBar
          width="55%"
          height={42}
          radius={12}
          style={styles.skeletonGap}
        />
      </View>

      <View style={styles.skeletonStatsRow}>
        <SkeletonBar width="31.5%" height={82} radius={16} />
        <SkeletonBar width="31.5%" height={82} radius={16} />
        <SkeletonBar width="31.5%" height={82} radius={16} />
      </View>

      <View style={styles.skeletonLeaderboard}>
        <SkeletonBar width="45%" height={18} />
        <SkeletonBar
          width="100%"
          height={74}
          radius={14}
          style={styles.skeletonGap}
        />
        <SkeletonBar
          width="100%"
          height={74}
          radius={14}
          style={styles.skeletonGapSm}
        />
        <SkeletonBar
          width="100%"
          height={74}
          radius={14}
          style={styles.skeletonGapSm}
        />
      </View>
    </View>
  );
}

const ReferralScreen = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const user = useUserStore((state) => state.user);
  const overview = useReferralStore((state) => state.overview);
  const isLoading = useReferralStore((state) => state.isLoading);
  const error = useReferralStore((state) => state.error);
  const fetchReferralOverview = useReferralStore(
    (state) => state.fetchReferralOverview,
  );
  const refreshReferralOverview = useReferralStore(
    (state) => state.refreshReferralOverview,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchReferralOverview();
  }, [fetchReferralOverview]);

  const leaderboard = useMemo(
    () => overview?.leaderboard ?? [],
    [overview?.leaderboard],
  );

  const topThree = useMemo(
    () => ({
      first: leaderboard[0] ?? null,
      second: leaderboard[1] ?? null,
      third: leaderboard[2] ?? null,
    }),
    [leaderboard],
  );

  const referralCode = overview?.me.referral_code ?? user?.referralCode ?? "";
  const referralLink = referralCode ? createReferralDeepLink(referralCode) : "";

  const remainingRows = useMemo(() => {
    const rows = [...leaderboard.slice(3)];
    const me = overview?.me;
    const hasCurrentUser = rows.some((entry) => entry.is_current_user);
    const listedInTopThree = leaderboard
      .slice(0, 3)
      .some((entry) => entry.is_current_user);

    if (me && !hasCurrentUser && !listedInTopThree && me.rank > 0) {
      rows.push({
        rank: me.rank,
        user_id: me.user_id,
        display_name: me.display_name,
        username: me.username,
        profile_picture_url: me.profile_picture_url,
        total_referrals: me.total_referrals,
        total_earnings: me.total_earnings,
        level: me.level,
        streak: me.streak,
        xp: me.xp,
        quiz_completed: me.quiz_completed,
        highlight: "You",
        is_current_user: true,
      });
    }

    return rows.sort((left, right) => left.rank - right.rank);
  }, [leaderboard, overview?.me]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshReferralOverview();
    setIsRefreshing(false);
  }, [refreshReferralOverview]);

  const handleCopyLink = useCallback(async () => {
    if (!referralLink) return;
    await Clipboard.setStringAsync(referralLink);
  }, [referralLink]);

  const handleShare = useCallback(async () => {
    if (!overview) return;

    const message = [overview.cta.share_message, referralLink]
      .filter(Boolean)
      .join("\n");

    await Share.share({
      message,
      title: "Invite friends to EduLearn",
    });
  }, [overview, referralLink]);

  const renderPodiumCard = (
    entry: ReferralLeaderboardEntry,
    variant: "first" | "second" | "third",
  ) => {
    const medal =
      variant === "first"
        ? require("@/assets/images/gold.png")
        : variant === "second"
          ? require("@/assets/images/silver.png")
          : require("@/assets/images/bronze.png");

    const cardStyle =
      variant === "first"
        ? styles.first
        : variant === "second"
          ? styles.second
          : styles.third;

    return (
      <View
        style={[
          cardStyle,
          entry.is_current_user
            ? styles.currentUserTopCard
            : isDark
              ? styles.darkTopCard
              : styles.lightTopCard,
        ]}
      >
        <Image source={medal} style={styles.medal} />
        <View style={styles.avatarWrapper}>
          <Image
            source={
              getHighQualityImageUrl(entry.profile_picture_url)
                ? { uri: getHighQualityImageUrl(entry.profile_picture_url) }
                : require("@/assets/images/memoji.png")
            }
            style={styles.avatar}
          />
        </View>
        <Text
          style={[
            styles.topName,
            entry.is_current_user
              ? styles.currentUserText
              : { color: colors.slate },
          ]}
          numberOfLines={2}
        >
          {entry.display_name}
        </Text>
        <Text
          style={[
            styles.topLevel,
            entry.is_current_user
              ? styles.currentUserText
              : { color: getLevelColor(entry.level) },
          ]}
        >
          {entry.level}
        </Text>
        <Text
          style={[
            styles.topReferrals,
            entry.is_current_user
              ? styles.currentUserText
              : { color: colors.textSecondary },
          ]}
        >
          {entry.total_referrals} referrals
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={styles.topNav}>
        <BackButton />
        <Text style={[styles.heading, { color: colors.textPrimary }]}>
          Referral Leaderboard
        </Text>
      </View>

      <Text style={[styles.subText, { color: colors.textSecondary }]}>
        Track your referral impact, climb the rankings, and share your invite
        link.
      </Text>

      {isLoading && !overview ? (
        <ReferralLoadingSkeleton dark={isDark} />
      ) : null}

      {!isLoading && error && !overview ? (
        <View style={styles.errorWrap}>
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchReferralOverview({ force: true })}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {overview ? (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.refreshTint}
            />
          }
        >
          <LinearGradient
            colors={isDark ? ["#00FF80", "#00D66A"] : ["#0A0A0A", "#1B1B1B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={[styles.heroTitle, isDark && styles.heroTitleDark]}>
              {overview.cta.title}
            </Text>
            <Text
              style={[styles.heroSubtitle, isDark && styles.heroSubtitleDark]}
            >
              {overview.cta.subtitle}
            </Text>
            <View style={styles.heroButtons}>
              <TouchableOpacity
                style={styles.heroPrimaryButton}
                onPress={handleShare}
              >
                <Text style={styles.heroPrimaryButtonText}>Share Invite</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroSecondaryButton}
                onPress={handleCopyLink}
              >
                <Text style={styles.heroSecondaryButtonText}>Copy Link</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={styles.statsRow}>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderMuted,
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Your Rank
              </Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                #{overview.me.rank}
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderMuted,
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total Referrals
              </Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {overview.me.total_referrals}
              </Text>
            </View>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderMuted,
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total Earnings
              </Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {formatReferralEarnings(overview.me.total_earnings)}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.milestoneCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderMuted,
              },
            ]}
          >
            <View style={styles.milestoneTopRow}>
              <Text
                style={[styles.milestoneLabel, { color: colors.textPrimary }]}
              >
                Next Milestone
              </Text>
              <Text
                style={[styles.milestoneLabel, { color: colors.textSecondary }]}
              >
                {overview.me.next_milestone.progress_percent}%
              </Text>
            </View>
            <Text style={[styles.milestoneTitle, { color: colors.slate }]}>
              {overview.me.next_milestone.label}
            </Text>
            <Text
              style={[styles.milestoneHint, { color: colors.textSecondary }]}
            >
              {overview.me.next_milestone.target
                ? `${overview.me.next_milestone.remaining} more referrals to hit ${overview.me.next_milestone.target}`
                : "All milestones completed"}
            </Text>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: colors.borderMuted },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${overview.me.next_milestone.progress_percent}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.leaderboardSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Top Referrers
            </Text>

            <View style={styles.topThreeWrap}>
              {topThree.second ? (
                renderPodiumCard(topThree.second, "second")
              ) : (
                <View style={styles.podiumSpacer} />
              )}
              {topThree.first ? (
                renderPodiumCard(topThree.first, "first")
              ) : (
                <View style={styles.podiumSpacer} />
              )}
              {topThree.third ? (
                renderPodiumCard(topThree.third, "third")
              ) : (
                <View style={styles.podiumSpacer} />
              )}
            </View>

            {remainingRows.length > 0 ? (
              <View
                style={[
                  styles.listCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderMuted,
                  },
                ]}
              >
                {remainingRows.map((entry) => (
                  <View
                    key={`${entry.user_id}-${entry.rank}`}
                    style={[
                      styles.row,
                      {
                        borderBottomColor: colors.borderMuted,
                        backgroundColor: entry.is_current_user
                          ? "#00FF80"
                          : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rowRank,
                        {
                          color: entry.is_current_user ? "#000" : colors.slate,
                        },
                      ]}
                    >
                      #{entry.rank}
                    </Text>

                    <View style={styles.rowMain}>
                      <Text
                        style={[
                          styles.rowName,
                          {
                            color: entry.is_current_user
                              ? "#000"
                              : colors.slate,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {entry.display_name}
                      </Text>
                      <Text
                        style={[
                          styles.rowHighlight,
                          {
                            color: entry.is_current_user
                              ? "#000"
                              : colors.textSecondary,
                          },
                        ]}
                      >
                        {entry.highlight}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.rowReferrals,
                        {
                          color: entry.is_current_user
                            ? "#000"
                            : colors.textPrimary,
                        },
                      ]}
                    >
                      {entry.total_referrals}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <Text style={[styles.updatedAt, { color: colors.textSecondary }]}>
            Updated {new Date(overview.updated_at).toLocaleString()}
          </Text>
        </ScrollView>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 54,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Satoshi-Regular",
    flexShrink: 1,
  },
  subText: {
    fontFamily: "Urbanist",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 14,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 28,
  },
  heroCard: {
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  heroTitle: {
    fontFamily: "Satoshi-Bold",
    fontSize: 18,
    lineHeight: 24,
    color: "#00FF80",
  },
  heroTitleDark: {
    color: "#000",
  },
  heroSubtitle: {
    fontFamily: "Urbanist",
    fontSize: 13,
    lineHeight: 18,
    color: "#C2FFD9",
  },
  heroSubtitleDark: {
    color: "#003A1C",
  },
  heroButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  heroPrimaryButton: {
    backgroundColor: "#00FF80",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  heroPrimaryButtonText: {
    color: "#000",
    fontFamily: "Satoshi-Medium",
    fontSize: 14,
  },
  heroSecondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  heroSecondaryButtonText: {
    color: "#fff",
    fontFamily: "Satoshi-Medium",
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  statLabel: {
    fontFamily: "Urbanist",
    fontSize: 12,
    lineHeight: 16,
  },
  statValue: {
    fontFamily: "Satoshi-Bold",
    fontSize: 24,
    lineHeight: 30,
  },
  milestoneCard: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  milestoneTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  milestoneLabel: {
    fontFamily: "Urbanist",
    fontSize: 12,
    lineHeight: 16,
  },
  milestoneTitle: {
    fontFamily: "Satoshi-Medium",
    fontSize: 15,
    lineHeight: 20,
  },
  milestoneHint: {
    fontFamily: "Urbanist",
    fontSize: 12,
    lineHeight: 17,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#00FF80",
    borderRadius: 999,
  },
  leaderboardSection: {
    marginTop: 18,
  },
  sectionTitle: {
    fontFamily: "Satoshi-Medium",
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 14,
  },
  topThreeWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 8,
  },
  first: {
    width: 118,
    minHeight: 168,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingTop: 18,
    paddingBottom: 12,
    alignItems: "center",
    gap: 5,
  },
  second: {
    width: 102,
    minHeight: 152,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 11,
    alignItems: "center",
    gap: 4,
  },
  third: {
    width: 102,
    minHeight: 148,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 11,
    alignItems: "center",
    gap: 4,
  },
  lightTopCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EDF3FC",
  },
  darkTopCard: {
    backgroundColor: "#131313",
    borderWidth: 1,
    borderColor: "#2E3033",
  },
  currentUserTopCard: {
    backgroundColor: "#00FF80",
  },
  currentUserText: {
    color: "#000",
  },
  medal: {
    width: 34,
    height: 34,
    position: "absolute",
    top: -15,
  },
  avatarWrapper: {
    padding: 3,
    borderRadius: 999,
    backgroundColor: "#fff",
    marginTop: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  topName: {
    fontFamily: "Satoshi-Medium",
    fontSize: 12,
    lineHeight: 15,
    textAlign: "center",
  },
  topLevel: {
    fontFamily: "Urbanist",
    fontSize: 10,
    lineHeight: 14,
    textTransform: "capitalize",
  },
  topReferrals: {
    fontFamily: "Urbanist",
    fontSize: 11,
    lineHeight: 14,
  },
  podiumSpacer: {
    width: 102,
  },
  listCard: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  rowRank: {
    width: 42,
    fontFamily: "Satoshi-Medium",
    fontSize: 13,
  },
  rowMain: {
    flex: 1,
    paddingRight: 10,
  },
  rowName: {
    fontFamily: "Satoshi-Medium",
    fontSize: 13,
    lineHeight: 16,
  },
  rowHighlight: {
    fontFamily: "Urbanist",
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  rowReferrals: {
    fontFamily: "Satoshi-Bold",
    fontSize: 14,
    minWidth: 34,
    textAlign: "right",
  },
  updatedAt: {
    marginTop: 14,
    textAlign: "center",
    fontFamily: "Urbanist",
    fontSize: 11,
    lineHeight: 14,
  },
  errorWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    gap: 14,
  },
  errorText: {
    fontFamily: "Urbanist",
    fontSize: 15,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#000",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: "#00FF80",
    fontFamily: "Satoshi-Medium",
    fontSize: 14,
  },
  skeletonWrap: {
    gap: 12,
    marginTop: 6,
  },
  skeletonHero: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    backgroundColor: "#fff",
    padding: 16,
  },
  skeletonHeroDark: {
    borderColor: "#2E3033",
    backgroundColor: "#131313",
  },
  skeletonStatsRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  skeletonLeaderboard: {
    marginTop: 2,
    borderRadius: 16,
  },
  skeletonBar: {
    backgroundColor: "#D8DFEA",
  },
  skeletonGap: {
    marginTop: 10,
  },
  skeletonGapSm: {
    marginTop: 8,
  },
});

export default ReferralScreen;
