import { AchievementCard } from "@/components/profile/AchievementCard";
import DailyCheckInStreak from "@/components/rewards/streak";
import useRoadmapStore from "@/core/roadmapState";
import useUserStore from "@/core/userState";
import { useTheme } from "@/hooks/useTheme";
import { UserService } from "@/services/auth.service";
import { WalletService } from "@/services/wallet.service";
import { levels } from "@/utils/constants";
import {
  iconCaretRight,
  iconClock,
  iconCopy,
  iconLevel,
  iconNotebook,
  iconSettings,
  iconWallet,
} from "@/utils/design";
import { createReferralDeepLink } from "@/utils/deepLinks";
import { supabase } from "@/utils/supabase";
import { getUserMetrics } from "@/utils/utils";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Modal from "react-native-modal";

type Props = Record<string, never>;

const Profile = (props: Props) => {
  const { user } = useUserStore();
  const { colors, theme } = useTheme();
  const walletBalance = useUserStore((state) => state.walletBalance);
  const walletBalanceLoading = useUserStore(
    (state) => state.walletBalanceLoading,
  );
  const fetchWalletBalance = useUserStore((state) => state.fetchWalletBalance);

  const getHighQualityImageUrl = (
    url: string | null | undefined,
  ): string | undefined => {
    if (!url || typeof url !== "string") return undefined;
    return url
      .replace(/_normal(\.[a-z]+)$/i, "_400x400$1")
      .replace(/_mini(\.[a-z]+)$/i, "_400x400$1")
      .replace(/_bigger(\.[a-z]+)$/i, "_400x400$1");
  };
  const [userMetrics, setUserMetrics] = React.useState({
    quizCompleted: 0,
    nfts: 0,
    xp: 0,
  });
  const [lastSignIn, setLastSignIn] = React.useState("");
  const [isBuyModalVisible, setBuyModalVisible] = React.useState(false);
  const [buyAmount, setBuyAmount] = React.useState("");
  const [buyError, setBuyError] = React.useState<string | null>(null);
  const [activeTokenUtilIndex, setActiveTokenUtilIndex] = React.useState(0);
  const [burnSuccessModalVisible, setBurnSuccessModalVisible] =
    React.useState(false);
  const [buySuccessModalVisible, setBuySuccessModalVisible] =
    React.useState(false);
  const [transactionLink, setTransactionLink] = React.useState<string>("");
  const [isBurning, setIsBurning] = React.useState(false);
  const [isBuying, setIsBuying] = React.useState(false);
  const [isStaking, setIsStaking] = React.useState(false);
  const [showEDLNPopover, setShowEDLNPopover] = React.useState(false);
  const [hasShownPopover, setHasShownPopover] = React.useState(false);
  const popoverOpacity = useRef(new Animated.Value(0)).current;
  const popoverTranslateY = useRef(new Animated.Value(-20)).current;
  const { width } = useWindowDimensions();

  const walletService = new WalletService();
  const authService = new UserService();
  const {
    roadmaps,
    fetchRoadmaps,
    isLoading: isLoadingRoadmaps,
  } = useRoadmapStore();

  useEffect(() => {
    async function fetchMetrics() {
      const userId = user?.id || "";
      const metrics = await getUserMetrics(userId);
      setUserMetrics(metrics);

      const lastSignIn = await supabase.auth
        .getUser()
        .then((user) => user.data.user?.last_sign_in_at);
      setLastSignIn(lastSignIn || "");

      if (userId) {
        fetchWalletBalance();
      }
    }
    fetchMetrics();
  }, [user?.id, fetchWalletBalance]);

  useEffect(() => {
    if (user?.id) {
      fetchRoadmaps(user.id);
    }
  }, [user?.id, fetchRoadmaps]);

  useEffect(() => {
    if (
      !walletBalanceLoading &&
      walletBalance &&
      typeof walletBalance.tokenAccount === "number" &&
      typeof walletBalance.sol === "number" &&
      walletBalance.tokenAccount < 1000 &&
      !hasShownPopover &&
      user?.id
    ) {
      const timer = setTimeout(() => {
        setShowEDLNPopover(true);
        setHasShownPopover(true);

        Animated.parallel([
          Animated.timing(popoverOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(popoverTranslateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        const hideTimer = setTimeout(() => {
          Animated.parallel([
            Animated.timing(popoverOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(popoverTranslateY, {
              toValue: -20,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setShowEDLNPopover(false);
          });
        }, 5000);

        return () => clearTimeout(hideTimer);
      }, 4000);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    walletBalance?.tokenAccount,
    walletBalance?.sol,
    walletBalanceLoading,
    hasShownPopover,
    user?.id,
    popoverOpacity,
    popoverTranslateY,
  ]);

  const toggleBuyModal = () => {
    setBuyModalVisible(!isBuyModalVisible);
    if (!isBuyModalVisible) {
      setBuyAmount("");
      setBuyError(null);
    }
  };

  const handleBuyEDLN = async () => {
    try {
      setIsBuying(true);
      setBuyError(null);
      const amount = parseFloat(buyAmount);
      if (isNaN(amount) || amount <= 0) {
        setBuyError("Please enter a valid amount");
        setIsBuying(false);
        return;
      }

      if (amount > (walletBalance?.sol || 0)) {
        setBuyError("Insufficient SOL balance");
        setIsBuying(false);
        return;
      }

      const result = await walletService.swapSolToEDLN(user?.id || "", amount);

      setTransactionLink(result.response || result.response || "");

      await fetchWalletBalance();

      setIsBuying(false);
      toggleBuyModal();

      setBuySuccessModalVisible(true);
    } catch (_error: any) {
      setBuyError(_error.message || "Failed to complete purchase");
      setIsBuying(false);
    }
  };

  const handleBurnTokens = async () => {
    try {
      setIsBurning(true);
      await walletService.burnEDLN(user?.id || "", 1000);
      await authService.incrementCredits(user?.id || "", 3);
      await fetchWalletBalance();
      setIsBurning(false);
      setBurnSuccessModalVisible(true);
    } catch (_error: any) {
      setIsBurning(false);
    }
  };

  const profileImageUrl = getHighQualityImageUrl(
    user?.profilePictureURL as string,
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { marginTop: width > 350 ? 30 : 20 }]}>
          <View style={styles.header}>
            <Text style={[styles.headerText, { color: colors.slate }]}>
              Profile
            </Text>
            <TouchableOpacity onPress={() => router.push("/settings")}>
              <Image
                source={iconSettings(theme)}
                style={{ width: 40, height: 40 }}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.profileCard,
              {
                marginTop: 12,
                gap: 10,
                backgroundColor: colors.heroBackground,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.identity, { marginRight: 10 }]}>
                <Image
                  source={
                    profileImageUrl
                      ? { uri: profileImageUrl }
                      : require("@/assets/images/memoji.png")
                  }
                  style={styles.profileAvatar}
                  resizeMode="cover"
                />
                <Text
                  style={[styles.cardText, { flex: 1, color: colors.heroText }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {user?.name}
                </Text>
              </View>

              <View style={styles.levelContainer}>
                <View style={styles.levelIconContainer}>
                  <Image source={iconLevel(theme)} style={styles.levelIcon} />
                  <Text
                    style={[styles.levelNumber, { color: colors.heroText }]}
                  >
                    {levels.indexOf(user?.level?.toLowerCase() || "") + 1}
                  </Text>
                </View>
                <Text style={[styles.levelText, { color: colors.heroText }]}>
                  {user?.level}
                </Text>
              </View>
            </View>
            <View style={styles.xpContainer}>
              <View style={styles.xpDisplay}>
                <Image
                  source={require("@/assets/images/icons/medal-05.png")}
                  style={styles.xpIcon}
                />
                <Text style={[styles.xpText, { color: colors.heroText }]}>
                  {user?.xp} XP
                </Text>
              </View>
            </View>
            {Platform.OS === "android" && (
              <TouchableOpacity
                onPress={() => {
                  router.push("/wallet");
                }}
                style={[
                  styles.walletCard,
                  { padding: 12, gap: 12, backgroundColor: colors.walletGlass },
                ]}
              >
                <View style={styles.walletInfoContainer}>
                  <Image source={iconWallet(theme)} style={styles.walletIcon} />
                  <Text
                    style={[styles.walletText, { color: colors.heroText }]}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {user?.address}
                  </Text>
                  <TouchableOpacity
                    onPress={async (e) => {
                      e.stopPropagation();
                      await Clipboard.setStringAsync(user?.address || "");
                    }}
                    style={styles.copyButton}
                  >
                    <Image
                      source={require("@/assets/images/icons/copy.png")}
                      style={styles.copyIcon}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.balanceContainer}>
                  <Text
                    style={[styles.balanceHeader, { color: colors.heroText }]}
                  >
                    Balance
                  </Text>
                  <View style={styles.balancesWrapper}>
                    <View
                      style={[
                        styles.balanceItem,
                        width < 360 && styles.balanceItemSmall,
                      ]}
                    >
                      <Text
                        style={[
                          styles.balanceValue,
                          width < 360 && { fontSize: 16 },
                          { color: colors.heroText },
                        ]}
                      >
                        {walletBalance?.sol.toFixed(4)}
                      </Text>
                      <Text
                        style={[
                          styles.balanceTicker,
                          { color: colors.heroText },
                        ]}
                      >
                        SOL
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.buyButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push("/wallet");
                      }}
                    >
                      <Text style={styles.buyButtonIcon}>+</Text>
                    </TouchableOpacity>

                    <View
                      style={[
                        styles.balanceItem,
                        width < 360 && styles.balanceItemSmall,
                      ]}
                    >
                      <Text
                        style={[
                          styles.balanceValue,
                          width < 360 && { fontSize: 16 },
                          { color: colors.heroText },
                        ]}
                      >
                        {walletBalance?.tokenAccount.toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          styles.balanceTicker,
                          { color: colors.heroText },
                        ]}
                      >
                        EDLN
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View
            style={[
              styles.achievements,
              {
                marginTop: 12,
                backgroundColor: colors.achievementSurface,
                borderColor: colors.achievementBorder,
              },
            ]}
          >
            <AchievementCard
              title="XP Earned"
              imageKey="xp"
              metric={userMetrics.xp + " XP"}
            />

            <AchievementCard
              title="Badges collected"
              imageKey="nft"
              metric={userMetrics.nfts.toString()}
            />
            <AchievementCard
              title="Quiz Completed"
              imageKey="quiz"
              metric={userMetrics.quizCompleted.toString()}
            />
          </View>
          <DailyCheckInStreak />
          <View
            style={[
              styles.refCard,
              {
                backgroundColor: colors.refCardSurface,
                borderColor: colors.refCardBorder,
              },
            ]}
          >
            <View style={styles.invitePush}>
              <Image
                source={require("@/assets/images/icons/congrats.png")}
                style={{ width: 62, height: 62 }}
              />
              <View style={styles.inviteTextContainer}>
                <Text style={[styles.inviteTitle, { color: colors.slate }]}>
                  Invite friends, earn rewards!
                </Text>
                <Text
                  style={[
                    styles.inviteSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Share your referral link and earn XP when they join.
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.referralCodeContainer,
                {
                  backgroundColor: colors.referralBoxBg,
                  borderColor: colors.referralBoxBorder,
                },
              ]}
            >
              <Text style={[styles.referralCode, { color: colors.slate }]}>
                {user?.referralCode}
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  const referralLink = user?.referralCode
                    ? createReferralDeepLink(user.referralCode)
                    : "";
                  if (!referralLink) return;
                  await Clipboard.setStringAsync(referralLink);
                }}
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text
                  style={[
                    styles.cardSubText,
                    {
                      fontSize: 16,
                      lineHeight: 26,
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Copy Link
                </Text>
                <Image
                  source={iconCopy(theme)}
                  style={{ width: 16, height: 16 }}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.referralLeaderboardButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.referralBoxBorder,
                },
              ]}
              onPress={() => router.push("/referral")}
            >
              <Text
                style={[
                  styles.referralLeaderboardButtonText,
                  { color: colors.slate },
                ]}
              >
                View referral leaderboard
              </Text>
              <Image
                source={iconCaretRight(theme)}
                style={styles.referralLeaderboardButtonIcon}
              />
            </TouchableOpacity>
          </View>
          {roadmaps.length > 0 && (
            <View style={styles.roadmapsSection}>
              <Text style={[styles.sectionTitle, { color: colors.slate }]}>
                Your Learning Paths
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.roadmapsScrollContainer}
              >
                {roadmaps.map((roadmap) => (
                  <TouchableOpacity
                    key={roadmap.id}
                    style={[
                      styles.roadmapCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.borderMuted,
                      },
                    ]}
                    onPress={() =>
                      router.push(`/roadmaps/${roadmap.id}` as any)
                    }
                  >
                    <View style={styles.roadmapCardHeader}>
                      <Image
                        source={require("@/assets/images/icons/roadmap.png")}
                        style={styles.roadmapIcon}
                      />
                      <Text
                        style={[styles.roadmapTitle, { color: colors.slate }]}
                        numberOfLines={2}
                      >
                        {roadmap.title}
                      </Text>
                    </View>

                    <View style={styles.roadmapStats}>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <View style={styles.roadmapStat}>
                          <Image
                            source={iconClock(theme)}
                            style={styles.roadmapStatIcon}
                          />
                          <Text
                            style={[
                              styles.roadmapStatText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            ~45 mins
                          </Text>
                        </View>
                        <View style={styles.roadmapStat}>
                          <Image
                            source={iconNotebook(theme)}
                            style={styles.roadmapStatIcon}
                          />
                          <Text
                            style={[
                              styles.roadmapStatText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            5 Steps
                          </Text>
                        </View>
                      </View>
                      <View style={styles.roadmapStat}>
                        <Image
                          source={require("@/assets/images/icons/medal-05.png")}
                          style={styles.roadmapStatIcon}
                        />
                        <Text
                          style={[
                            styles.roadmapStatText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Earn up to 16 XP
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.viewRoadmapButton,
                        { backgroundColor: colors.brand },
                      ]}
                      onPress={() =>
                        router.push(`/roadmaps/${roadmap.id}` as any)
                      }
                    >
                      <Text
                        style={[
                          styles.viewRoadmapButtonText,
                          { color: colors.onBrand },
                        ]}
                      >
                        View Learning Path
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      <Modal isVisible={isBuyModalVisible} style={styles.buyModal}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.modalBackground },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.slate }]}>
            Buy EDLN Tokens
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.modalInputBg,
                  borderColor: colors.modalInputBorder,
                  color: colors.slate,
                },
              ]}
              placeholder="Amount in SOL"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              value={buyAmount}
              onChangeText={setBuyAmount}
              editable={!isBuying}
            />
            <Text style={[styles.balanceText, { color: colors.textSecondary }]}>
              Available: {walletBalance?.sol.toFixed(4)} SOL
            </Text>
          </View>

          {buyError && <Text style={styles.errorText}>{buyError}</Text>}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: colors.cancelButtonBg,
                  borderColor: colors.cancelButtonBorder,
                },
              ]}
              onPress={toggleBuyModal}
              disabled={isBuying}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  { color: colors.cancelButtonText },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.buyModalButton,
                { backgroundColor: colors.ctaPrimaryBg },
                isBuying && styles.disabledButton,
              ]}
              onPress={handleBuyEDLN}
              disabled={isBuying}
            >
              {isBuying ? (
                <ActivityIndicator size="small" color={colors.ctaPrimaryFg} />
              ) : (
                <Text
                  style={[
                    styles.buyModalButtonText,
                    { color: colors.ctaPrimaryFg },
                  ]}
                >
                  Buy EDLN
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        isVisible={burnSuccessModalVisible}
        style={styles.buyModal}
        onBackdropPress={() => setBurnSuccessModalVisible(false)}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.modalBackground },
          ]}
        >
          <View
            style={[
              styles.burnSuccessIconContainer,
              { backgroundColor: colors.modalIconBg },
            ]}
          >
            <FontAwesome5 name="fire" size={30} color={colors.brand} />
          </View>
          <Text style={[styles.modalTitle, { color: colors.slate }]}>
            Tokens Burned Successfully!
          </Text>
          <Text
            style={[styles.modalDescription, { color: colors.textSecondary }]}
          >
            You&apos;ve received 3 credits and your wallet balance has been
            updated.
          </Text>
          <TouchableOpacity
            style={[styles.okButton, { backgroundColor: colors.brand }]}
            onPress={() => setBurnSuccessModalVisible(false)}
          >
            <Text style={[styles.okButtonText, { color: colors.onBrand }]}>
              OK
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        isVisible={buySuccessModalVisible}
        style={styles.buyModal}
        onBackdropPress={() => setBuySuccessModalVisible(false)}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.modalBackground },
          ]}
        >
          <View
            style={[
              styles.successIconContainer,
              { backgroundColor: colors.modalIconBg },
            ]}
          >
            <FontAwesome5 name="check-circle" size={30} color={colors.brand} />
          </View>
          <Text style={[styles.modalTitle, { color: colors.slate }]}>
            Purchase Successful!
          </Text>
          <Text
            style={[styles.modalDescription, { color: colors.textSecondary }]}
          >
            Your EDLN tokens have been purchased successfully. Your wallet
            balance has been updated.
          </Text>

          {transactionLink && (
            <TouchableOpacity
              style={[
                styles.okButton,
                styles.transactionButton,
                { backgroundColor: colors.brand },
              ]}
              onPress={() => {
                Linking.openURL(transactionLink);
              }}
            >
              <Text
                style={[
                  styles.transactionButtonText,
                  { color: colors.onBrand },
                ]}
              >
                View on Solscan
              </Text>
              <FontAwesome5
                name="external-link-alt"
                size={14}
                color={colors.onBrand}
              />
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FBFC",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
  header: {
    alignContent: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    color: "#2D3C52",
    fontFamily: "Urbanist",
    lineHeight: 24,
    fontSize: 20,
    fontWeight: 500,
  },
  settingsButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#EDF3FC",
  },
  profileCard: {
    padding: 12,
    backgroundColor: "#000",
    borderRadius: 16,
    flexDirection: "column",
  },
  cardHeader: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
  },
  identity: {
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    flex: 1,
    flexWrap: "nowrap",
  },
  profileAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    flexShrink: 0,
  },
  cardText: {
    color: "#00FF80",
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 22,
    flexShrink: 1,
    marginHorizontal: 6,
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#00FF80",
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderRadius: 8,
    flexShrink: 0,
  },
  verifyButtonSmall: {
    padding: 4,
    gap: 2,
  },
  verifyIcon: {
    width: 16,
    height: 16,
  },
  verifyText: {
    color: "#000",
    fontFamily: "Satoshi-Regular",
    fontSize: 12,
    fontWeight: "500",
  },
  verifyTextSmall: {
    fontSize: 11,
  },
  levelContainer: {
    alignItems: "center",
    marginLeft: 4,
    flexShrink: 0,
  },
  levelIconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  levelIcon: {
    width: 24,
    height: 24,
  },
  levelNumber: {
    position: "absolute",
    color: "#00FF80",
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  levelText: {
    color: "#00FF80",
    fontFamily: "Satoshi-Regular",
    fontSize: 12,
    fontWeight: "500",
  },
  xpContainer: {
    alignItems: "center",
    alignSelf: "center",
    marginVertical: 2,
  },
  xpDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  xpIcon: {
    width: 24,
    height: 24,
  },
  xpText: {
    color: "#00FF80",
    fontWeight: 500,
    lineHeight: 22,
    fontSize: 14,
    fontFamily: "Satoshi-Regular",
  },
  walletCard: {
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    borderRadius: 16,
  },
  walletInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "nowrap",
  },
  walletIcon: {
    width: 24,
    height: 24,
    flexShrink: 0,
  },
  copyButton: {
    padding: 4,
    flexShrink: 0,
  },
  copyIcon: {
    width: 16,
    height: 16,
  },
  balanceContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceHeader: {
    color: "#61728C",
    fontFamily: "Urbanist",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 5,
  },
  balancesWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: 10,
  },
  balanceItem: {
    alignItems: "center",
    paddingHorizontal: 15,
  },
  balanceItemSmall: {
    paddingHorizontal: 8,
  },
  balanceValue: {
    color: "#00FF80",
    fontFamily: "Satoshi-Regular",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  balanceTicker: {
    color: "#61728C",
    fontFamily: "Urbanist",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  walletText: {
    color: "#00FF80",
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    flex: 1,
  },
  buyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#00FF80",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  buyButtonIcon: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  achievements: {
    borderWidth: 0.5,
    borderColor: "#EDF3FC",
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 4,
    gap: 4,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  achievementCard: {
    display: "flex",
    padding: 8,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#F9FBFC",
  },
  cardSubText: {
    color: "#2D3C52",
    fontFamily: "Urbanist",
    lineHeight: 25,
    fontSize: 16,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: 400,
    color: "#61728C",
    lineHeight: 16,
    fontFamily: "Urbanist",
  },
  refCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EDF3FC",
    borderRadius: 24,
    gap: 24,
    padding: 16,
    flexDirection: "column",
    marginTop: 20,
  },
  invitePush: {
    gap: 16,
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
  },
  inviteTextContainer: {
    flexDirection: "column",
    gap: 4,
    flex: 1,
    flexShrink: 1,
  },
  inviteTitle: {
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    fontWeight: 500,
    color: "#2D3C52",
    lineHeight: 22,
    flexWrap: "wrap",
  },
  inviteSubtitle: {
    fontFamily: "Urbanist",
    fontSize: 14,
    fontWeight: 400,
    color: "#61728C",
    lineHeight: 18,
    flexWrap: "wrap",
  },
  referralCodeContainer: {
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#EDF3FC",
    backgroundColor: "#F9FBFC",
    gap: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingRight: 12,
    paddingBottom: 8,
    paddingLeft: 24,
  },
  referralCode: {
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    fontWeight: 500,
  },
  referralLeaderboardButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  referralLeaderboardButtonText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    fontWeight: 500,
  },
  referralLeaderboardButtonIcon: {
    width: 16,
    height: 16,
  },
  buyModal: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    width: "90%",
  },
  modalTitle: {
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#F9FBFC",
    borderWidth: 1,
    borderColor: "#EDF3FC",
    borderRadius: 12,
    padding: 12,
    width: "100%",
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    marginBottom: 8,
  },
  balanceText: {
    color: "#61728C",
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    textAlign: "right",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
    width: "100%",
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#000000",
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    flex: 1,
  },
  buyModalButton: {
    backgroundColor: "#000000",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    flex: 1,
  },
  buyModalButtonText: {
    color: "#00FF80",
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButtonText: {
    color: "#000000",
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    color: "#FF3B30",
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  tokenUtilities: {
    marginTop: 20,
  },
  tokenUtilitiesContainer: {
    // paddingHorizontal: 20,
  },
  tokenUtility: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginRight: 10,
    width: Dimensions.get("window").width - 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDF3FC",
  },
  tokenUtilityText: {
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    flex: 1,
    paddingRight: 15,
  },
  tokenUtilityButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    minHeight: 40,
  },
  disabledButton: {
    opacity: 0.7,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#61728C",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#00FF80",
  },
  burnSuccessIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0FFF9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00FF80",
    marginBottom: 16,
  },
  modalDescription: {
    color: "#61728C",
    fontFamily: "Satoshi",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  okButton: {
    backgroundColor: "#000000",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  okButtonText: {
    color: "#00FF80",
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "700",
  },
  tokenUtilityButtonText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "500",
    color: "#00FF80",
  },
  bottomPadding: {
    height: 20,
  },
  successIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0FFF9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00FF80",
    marginBottom: 16,
  },
  transactionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  transactionButtonText: {
    color: "#00FF80",
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
  },
  edlnPopover: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 20,
    right: 20,
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  edlnPopoverDark: {
    backgroundColor: "#00FF80",
    shadowColor: "#00FF80",
    shadowOpacity: 0.3,
  },
  edlnPopoverText: {
    color: "#00FF80",
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    marginRight: 12,
  },
  edlnPopoverTextDark: {
    color: "#000000",
  },
  dismissButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissButtonText: {
    color: "#00FF80",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  roadmapsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontFamily: "Satoshi-Regular",
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3C52",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  roadmapsScrollContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  roadmapCard: {
    width: 300,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    padding: 16,
    gap: 16,
  },
  roadmapCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  roadmapIcon: {
    width: 32,
    height: 32,
  },
  roadmapTitle: {
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3C52",
    lineHeight: 22,
    flex: 1,
  },
  roadmapStats: {
    flexDirection: "column",
    gap: 8,
  },
  roadmapStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roadmapStatIcon: {
    width: 16,
    height: 16,
  },
  roadmapStatText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    fontWeight: "400",
    color: "#61728C",
    lineHeight: 18,
  },
  viewRoadmapButton: {
    backgroundColor: "#000",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  viewRoadmapButtonText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    fontWeight: "600",
    color: "#00FF80",
    lineHeight: 20,
  },
});
