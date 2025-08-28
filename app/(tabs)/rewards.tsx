import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Share,
} from "react-native";
import * as Sharing from 'expo-sharing';
import { levels } from "@/utils/constants";
import useUserStore from "@/core/userState";
import { ProgressBar } from "react-native-paper";
import { RewardsService } from "@/services/rewards.service";
import { StatusBar } from "expo-status-bar";
import useActivityStore from "@/core/activityState";
import { router } from "expo-router";
import { WalletService } from "@/services/wallet.service";
import { LinearGradient } from "expo-linear-gradient";

type Props = {};

const rewards = (props: Props) => {
  const user = useUserStore((s) => s.user);
  const fetchWalletBalance = useUserStore((s) => s.fetchWalletBalance);
  const [rewards, setRewards] = useState<any[]>([]);
  const [userEarnings, setUserEarnings] = useState<{ sol: number; edln: number; hasEarnings: boolean }>({
    sol: 0,
    edln: 0,
    hasEarnings: false,
  });
  const [claimingEDLN, setClaimingEDLN] = useState(false);
  const [claimingSOL, setClaimingSOL] = useState(false);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [claimedAsset, setClaimedAsset] = useState<{type: 'edln' | 'USDC', amount: string} | null>(null);
  const rewardService = new RewardsService();
  const walletService = new WalletService();
  const screenWidth = Dimensions.get("window").width;
  const itemWidth = (screenWidth - 48) / 2;
  const { activities, fetchActivities } = useActivityStore();

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const userRewards = await rewardService.getUserRewards(
          user?.id as unknown as string
        );
        setRewards(userRewards);
      } catch (error) {
        console.error("Error fetching rewards:", error);
      }
    };

    const fetchEarnings = async () => {
      if (!user?.id) return;

      try {
        setLoadingEarnings(true);
        const earnings = await walletService.getUserEarnings(user.id);
        setUserEarnings(earnings);
      } catch (error) {
        console.error("Error fetching user earnings:", error);
      } finally {
        setLoadingEarnings(false);
      }
    };

    if (user?.id) {
      fetchRewards();
      fetchActivities(user.id);
      fetchEarnings();
    }
  }, [user?.id]);

  const handleClaimEDLN = async () => {
    if (!user?.id) return;

    try {
      setClaimingEDLN(true);
      const result = await walletService.claimEarnings(user.id, "edln");

      if (result.success) {
        setClaimedAsset({
          type: 'edln',
          amount: String(userEarnings.edln) 
        });
        setSuccessModalVisible(true);
        
        fetchWalletBalance();
        const earnings = await walletService.getUserEarnings(user.id);
        setUserEarnings(earnings);
      } else {
        Alert.alert("Failed to claim", result.message);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to claim EDLN tokens");
    } finally {
      setClaimingEDLN(false);
    }
  };

  const handleClaimSOL = async () => {
    if (!user?.id) return;

    try {
      setClaimingSOL(true);
      const result = await walletService.claimEarnings(user.id, "sol");

      if (result.success) {
        setClaimedAsset({
          type: 'USDC',
          amount: String(userEarnings.sol)
        });
        setSuccessModalVisible(true);
        
        fetchWalletBalance();
        const earnings = await walletService.getUserEarnings(user.id);
        setUserEarnings(earnings);
      } else {
        Alert.alert("Failed to claim", result.message);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to claim SOL");
    } finally {
      setClaimingSOL(false);
    }
  };

  const handleShare = async () => {
    if (!claimedAsset || !user?.referralCode) return;
    
    try {
      const message = `I just claimed ${claimedAsset.amount} $${claimedAsset.type.toUpperCase()} tokens on EduLearn! Get in now with my referral code: ${user.referralCode} to claim yours also on edulearn.fun`;
      
      await Share.share({
        message,
        title: 'Share your EduLearn success!'
      });
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Failed to share");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <StatusBar style="dark" />
      <Text style={styles.headerText}>Your Rewards</Text>
      <Text style={styles.subText}>
        Track your XP, unlock badges, and collect NFTs as you learn!
      </Text>

      <View style={styles.userCard}>
        <View style={styles.levelContainer}>
          <View style={styles.levelIconContainer}>
            <Image
              source={require("@/assets/images/icons/level.png")}
              style={[styles.levelIcon, { width: 58, height: 63 }]}
            />
            <Text style={styles.levelNumber}>
              {levels.indexOf(user?.level?.toLowerCase() || "") + 1}
            </Text>
          </View>
          <Text style={styles.levelText}>{user?.level}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 3 }}>
          <Image
            source={require("@/assets/images/icons/medal.png")}
            width={24}
            height={24}
          />
          <Text style={styles.xpText}>{user?.xp}</Text>
        </View>

        <ProgressBar
          progress={250 / 1000}
          color="#00FF80"
          style={{ height: 10, borderRadius: 5 }}
        />

        <Text style={styles.upskillText}>
          Great work! You're just 50 XP away from the next badge 🔥
        </Text>
      </View>

      <View style={styles.yourNfts}>
        <View style={styles.yourNftsHeader}>
          <Text style={styles.nftHeaderText}>Your NFT's</Text>
          <TouchableOpacity
            style={styles.seeMoreButton}
            onPress={() => router.push("/nfts")}
          >
            <Text style={styles.subText}>See All</Text>
            <Image
              source={require("@/assets/images/icons/CaretRight.png")}
              style={{ width: 24, height: 24 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.rewardsGrid}>
        {rewards.length > 0 ? (
          <View style={styles.gridContainer}>
            {rewards.slice(0, 4).map((reward, index) => (
              <View
                key={reward.id || index}
                style={[styles.gridItem, { width: itemWidth }]}
              >
                <View
                  style={{
                    flex: 1,
                    alignSelf: "stretch",
                    borderRadius: 8,
                    backgroundColor: "lightgray",
                  }}
                >
                  <ImageBackground
                    source={{ uri: reward.imageUrl }}
                    style={{
                      flex: 1,
                      borderRadius: 8,
                      width: "100%",
                      height: "100%",
                    }}
                    resizeMode="cover"
                  />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              You haven't earned any NFTs yet.
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Complete quizzes and lessons to collect them!
            </Text>
          </View>
        )}
      </View>

      <View style={styles.activeEarningsSection}>
        <Text style={styles.sectionHeader}>Active Earnings</Text>
        <Text style={styles.subText}>
          Track your active token earnings and rewards
        </Text>

        {loadingEarnings ? (
          <View style={[styles.earningsContainer, { justifyContent: 'center', paddingVertical: 20 }]}>
            <ActivityIndicator size="large" color="#00FF80" />
          </View>
        ) : userEarnings.hasEarnings ? (
          <View style={styles.earningsSimpleContainer}>
            <View style={styles.earningCard}>
              <View style={styles.earningSimpleContent}>
                <View style={styles.earningSimpleRow}>
                  <View style={styles.earningInfo}>
                    <Image
                      source={require("@/assets/images/Edulearnlogomark4.jpg")}
                      style={styles.earningIcon}
                    />
                    <View>
                      <Text style={[styles.earningLabel, { color: '#2D3C52' }]}>EDLN Balance</Text>
                      <Text style={[styles.earningAmount, { color: '#2D3C52' }]}>{String(userEarnings.edln)} EDLN</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.claimButton}
                    onPress={handleClaimEDLN}
                    disabled={claimingEDLN || userEarnings.edln <= 0}
                  >
                    {claimingEDLN ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.claimButtonText}>Claim</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.earningCard}>
              <View style={styles.earningSimpleContent}>
                <View style={styles.earningSimpleRow}>
                  <View style={styles.earningInfo}>
                    <Image
                      source={require("@/assets/images/solana.png")}
                      style={styles.earningIcon}
                    />
                    <View>
                      <Text style={[styles.earningLabel, { color: '#2D3C52' }]}>USDC Balance</Text>
                      <Text style={[styles.earningAmount, { color: '#2D3C52' }]}>{String(userEarnings.sol)} SOL</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.claimButton}
                    onPress={handleClaimSOL}
                    disabled={claimingSOL || userEarnings.sol <= 0}
                  >
                    {claimingSOL ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.claimButtonText}>Claim</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              No active earnings available.
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Complete tasks and maintain streaks to earn rewards!
            </Text>
          </View>
        )}
      </View>

      <View style={styles.xpHistory}>
        <Text style={styles.sectionHeader}>XP Earning History</Text>

        <View style={[styles.historyList, { marginTop: 10 }]}>
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <View key={index} style={styles.activityCard}>
                <View style={styles.activityContainer}>
                  <View style={styles.activityLeftColumn}>
                    <View style={styles.chatItemHeader}>
                      {activity.type === "quiz" ? (
                        <Image
                          source={require("@/assets/images/icons/brain3.png")}
                          style={styles.chatIcon}
                        />
                      ) : activity.type === "chat" ? (
                        <Image
                          source={require("@/assets/images/icons/aichat.png")}
                          style={styles.chatIcon}
                        />
                      ) : (
                        <Image
                          source={require("@/assets/images/icons/streak.png")}
                          style={styles.chatIcon}
                        />
                      )}
                      <Text style={styles.chatText} numberOfLines={1}>
                        {activity.title ||
                          activity.type.charAt(0).toUpperCase() +
                            activity.type.slice(1)}
                      </Text>
                    </View>

                    <View style={styles.metadataItem}>
                      <Image
                        source={require("@/assets/images/icons/medal-05.png")}
                        style={styles.metadataIcon}
                      />
                      <Text style={styles.xpHistoryText}>
                        +{activity.xpEarned} XP
                      </Text>
                    </View>
                  </View>

                  <View style={styles.activityRightColumn}>
                    <View style={styles.metadataItem}>
                      <Image
                        source={require("@/assets/images/icons/calendar.png")}
                        style={styles.metadataIcon}
                      />
                      <Text style={styles.dateText}>
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <View style={styles.metadataItem}>
                      <Text style={styles.activityTypeText}>
                        {activity.type.charAt(0).toUpperCase() +
                          activity.type.slice(1)}{" "}
                        Activity
                      </Text>
                    </View>

                    {activity.type === "streak" && (
                      <View style={styles.streakBadge}>
                        <Text style={styles.streakText}>Streak</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No activity history available.
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Complete quizzes and chat with the AI to earn XP!
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ height: 30 }} />

      <View style={styles.quizzes}>
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Image
            source={require("@/assets/images/icons/medal-07.png")}
            style={{ width: 62, height: 62 }}
          />
        </View>
        <Text
          style={{
            fontFamily: "Satoshi",
            fontWeight: 500,
            fontSize: 16,
            lineHeight: 30,
            color: "#2D3C52",
            textAlign: "center",
          }}
        >
          Boost Your XP, Unlock New Rewards
        </Text>
        <Text style={[styles.subText, { textAlign: "center" }]}>
          Complete quick actions daily to level up faster, earn NFTs, and stay
          on top of the leaderboard.
        </Text>
        <TouchableOpacity style={styles.quizButton}>
          <Text
            style={{
              fontFamily: "Satoshi",
              fontWeight: 500,
              fontSize: 14,
              lineHeight: 24,
              color: "#00FF80",
              textAlign: "center",
            }}
          >
            Start Quizzes
          </Text>
        </TouchableOpacity>
      </View>
      
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Image 
              source={require("@/assets/images/icons/SealCheck.png")} 
              style={styles.successIcon}
            />
            <Text style={styles.modalTitle}>Asset Claimed Successfully!</Text>
            
            <Text style={styles.modalDescription}>
              Your tokens have been successfully transferred to your wallet.
            </Text>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setSuccessModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.shareButton} 
                onPress={() => handleShare()}
              >
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default rewards;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#F9FBFC",
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  headerText: {
    fontFamily: "Satoshi",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: 500,
    color: "#2D3C52",
    marginTop: 20,
  },
  subText: {
    color: "#61728C",
    fontFamily: "Satoshi",
    fontWeight: 400,
    lineHeight: 24,
    fontSize: 14,
  },
  levelContainer: {
    alignItems: "center",
  },
  levelIconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  levelIcon: {
    width: 28,
    height: 28,
  },
  levelNumber: {
    position: "absolute",
    color: "#00FF80",
    fontFamily: "Satoshi",
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 28,
  },
  levelText: {
    color: "#00FF80",
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 24,
  },
  userCard: {
    borderRadius: 16,
    backgroundColor: "#000",
    flexDirection: "column",
    gap: 16,
    paddingHorizontal: 26,
    paddingTop: 16,
    paddingBottom: 16,
    marginVertical: 16,
  },
  xpText: {
    lineHeight: 30,
    fontWeight: 700,
    fontSize: 28,
    fontFamily: "Satoshi",
    color: "#00FF80",
  },
  upskillText: {
    fontWeight: 400,
    fontSize: 14,
    fontFamily: "Satoshi",
    color: "#00FF80",
    lineHeight: 24,
  },
  nftHeaderText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: 500,
    color: "#2D3C52",
  },
  yourNfts: {
    marginTop: 20,
    marginBottom: 16,
  },
  yourNftsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeMoreButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: "center",
  },
  rewardsGrid: {
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  gridItem: {
    marginBottom: 16,
    height: 180,
  },
  nftImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    minHeight: 150,
  },
  emptyStateText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3C52",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontFamily: "Satoshi",
    fontSize: 14,
    color: "#61728C",
    textAlign: "center",
  },
  activeEarningsSection: {
    marginBottom: 20,
  },
  earningsContainer: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 16,
  },
  earningsSimpleContainer: {
    flexDirection: "column",
    gap: 16,
    marginTop: 10
  },
  earningCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  earningSimpleContent: {
    padding: 16,
  },
  earningSimpleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  earningInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  earningIcon: {
    width: 40,
    height: 40,
  },
  earningLabel: {
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  earningAmount: {
    fontFamily: "Satoshi",
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  claimButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  claimButtonText: {
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "500",
    color: "#00FF80",
    textAlign: "center",
  },
  xpHistory: {
    marginTop: 20,
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionHeader: {
    fontFamily: "Satoshi",
    fontSize: 18,
    fontWeight: 500,
    color: "#2D3C52",
  },
  searchButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  searchIcon: {
    width: 16,
    height: 16,
    tintColor: "#2D3C52",
  },
  historyList: {
    flexDirection: "column",
    gap: 10,
  },
  activityCard: {
    borderWidth: 1,
    borderColor: "#E0E7FF",
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activityContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  activityLeftColumn: {
    flex: 1,
    flexDirection: "column",
    gap: 4,
  },
  chatItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatIcon: {
    width: 24,
    height: 24,
  },
  chatText: {
    fontFamily: "Satoshi",
    fontSize: 14,
    color: "#2D3C52",
    flex: 1,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metadataIcon: {
    width: 16,
    height: 16,
  },
  xpHistoryText: {
    fontFamily: "Satoshi",
    fontSize: 12,
    color: "#61728C",
  },
  activityRightColumn: {
    alignItems: "flex-end",
    flexDirection: "column",
    gap: 4,
  },
  dateText: {
    fontFamily: "Satoshi",
    fontSize: 12,
    color: "#2D3C52",
  },
  activityTypeText: {
    fontFamily: "Satoshi",
    fontSize: 12,
    color: "#00FF80",
    textTransform: "capitalize",
  },
  streakBadge: {
    backgroundColor: "#00FF80",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  streakText: {
    fontFamily: "Satoshi",
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  quizButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "100%",
  },
  quizzes: {
    backgroundColor: "#fff",
    gap: 24,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    borderRadius: 24,
    padding: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  successIcon: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: "Satoshi",
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3C52",
    marginBottom: 8,
  },
  claimedAssetInfo: {
    marginVertical: 16,
    alignItems: "center",
  },
  assetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
  },
  smallAssetIcon: {
    width: 24,
    height: 24,
  },
  assetAmount: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  modalDescription: {
    fontFamily: "Satoshi",
    fontSize: 14,
    color: "#61728C",
    textAlign: "center",
    marginBottom: 16,
  },
  modalButtonsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  closeButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "45%",
  },
  closeButtonText: {
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "500",
    color: "#00FF80",
    textAlign: "center",
  },
  shareButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "45%",
    borderWidth: 1,
    borderColor: "#000",
  },
  shareButtonText: {
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    textAlign: "center",
  },
});
