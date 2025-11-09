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
import { ProgressBar, DataTable } from "react-native-paper";
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
  
  const [page, setPage] = useState<number>(0);
  const [numberOfItemsPerPageList] = useState([10, 15, 20]);
  const [itemsPerPage, onItemsPerPageChange] = useState(numberOfItemsPerPageList[0]);
  
  const rewardService = new RewardsService();
  const walletService = new WalletService();
  const screenWidth = Dimensions.get("window").width;
  const itemWidth = (screenWidth - 48) / 2;
  const { activities, fetchActivities } = useActivityStore();
  const theme = useUserStore(s => s.theme);

  const milestones = {
    novice: 0,
    beginner: 500,
    intermediate: 1500,
    advanced: 3000,
    expert: 5000,
  };

  const currentXP = user?.xp || 0;

  const getMilestoneProgress = () => {
    if (currentXP >= milestones.expert) {
      return {
        progress: 1,
        xpNeeded: 0,
        currentLevel: milestones.expert,
        nextLevel: milestones.expert,
      };
    } else if (currentXP >= milestones.advanced) {
      return {
        progress:
          (currentXP - milestones.advanced) /
          (milestones.expert - milestones.advanced),
        xpNeeded: milestones.expert - currentXP,
        currentLevel: milestones.advanced,
        nextLevel: milestones.expert,
      };
    } else if (currentXP >= milestones.intermediate) {
      return {
        progress:
          (currentXP - milestones.intermediate) /
          (milestones.advanced - milestones.intermediate),
        xpNeeded: milestones.advanced - currentXP,
        currentLevel: milestones.intermediate,
        nextLevel: milestones.advanced,
      };
    } else if (currentXP >= milestones.beginner) {
      return {
        progress:
          (currentXP - milestones.beginner) /
          (milestones.intermediate - milestones.beginner),
        xpNeeded: milestones.intermediate - currentXP,
        currentLevel: milestones.beginner,
        nextLevel: milestones.intermediate,
      };
    } else {
      return {
        progress: currentXP / milestones.beginner,
        xpNeeded: milestones.beginner - currentXP,
        currentLevel: milestones.novice,
        nextLevel: milestones.beginner,
      };
    }
  };

  const { progress, xpNeeded } = getMilestoneProgress();

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, activities.length);

  useEffect(() => {
    setPage(0);
  }, [itemsPerPage]);

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
      style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {theme === "dark" ? <StatusBar style="light" /> : <StatusBar style="dark" />}
      <Text style={[styles.headerText, theme === "dark" && { color: "#E0E0E0" }]}>Your Rewards</Text>
      <Text style={[styles.subText, theme === "dark" && { color: "#B3B3B3" }]}>
        Track your XP, unlock badges, and collect badges as you learn!
      </Text>

      <View style={[styles.userCard, theme === "dark" && { backgroundColor: "#00FF80" }]}>
        <View style={styles.levelContainer}>
          <View style={styles.levelIconContainer}>
            <Image
              source={theme === "dark" ? require("@/assets/images/icons/dark/level.png") : require("@/assets/images/icons/level.png")}
              style={[styles.levelIcon, { width: 58, height: 63 }]}
            />
            <Text style={[styles.levelNumber, theme === "dark" && { color: "#000" }]}>
              {levels.indexOf(user?.level?.toLowerCase() || "") + 1}
            </Text>
          </View>
          <Text style={[styles.levelText, theme === "dark" && { color: "#000" }]}>{user?.level}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Image
            source={theme === "dark" ? require("@/assets/images/icons/dark/medal-05.png") : require("@/assets/images/icons/medal.png")}
            style={{ width: 24, height: 24 }}
          />
          <Text style={[styles.xpText, theme === "dark" && { color: "#000" }]}>{user?.xp} XP</Text>
        </View>

        <ProgressBar
          progress={progress}
          color={theme === "dark" ? "#000" : "#00FF80"}
          style={{
            height: 10,
            borderRadius: 5,
            backgroundColor: theme === "dark" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.10)",
          }}
        />

        <Text style={[styles.upskillText, theme === "dark" && { color: "#000" }]}>
          {xpNeeded > 0
            ? `Great work! You're just ${xpNeeded} XP away from the next badge 🔥`
            : "Congratulations! You've reached the highest level! 🏆"}
        </Text>
      </View>
      
      <View style={styles.yourNfts}>
        <View style={styles.yourNftsHeader}>
          <Text style={[styles.nftHeaderText, theme === "dark" && { color: "#E0E0E0" }]}>Your Badges</Text>
          <TouchableOpacity
            style={[styles.seeMoreButton, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}
            onPress={() => router.push("/nfts")}
          >
            <Text style={[styles.subText, theme === "dark" && { color: "#E0E0E0" }]}>See All</Text>
            <Image
              source={theme === "dark" ? require("@/assets/images/icons/dark/CaretRight.png") : require("@/assets/images/icons/CaretRight.png")}
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
          <View style={[styles.emptyStateContainer, theme === "dark" && { backgroundColor: "#131313" }]}>
            <Text style={[styles.emptyStateText, theme === "dark" && { color: "#E0E0E0" }]}>
              You haven't earned any badges yet.
            </Text>
            <Text style={[styles.emptyStateSubtext, theme === "dark" && { color: "#B3B3B3" }]}>
              Complete quizzes and lessons to collect them!
            </Text>
          </View>
        )}
      </View>
     

      {/* Web Version Notice for NFTs
      <View style={[styles.webNoticeContainer, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}>
        <Image
          source={require("@/assets/images/icons/medal-07.png")}
          style={{ width: 48, height: 48 }}
        />
        <Text style={[styles.webNoticeTitle, theme === "dark" && { color: "#E0E0E0" }]}>
          NFT Collection
        </Text>
        <Text style={[styles.webNoticeText, theme === "dark" && { color: "#B3B3B3" }]}>
          Open the web version to view and claim your NFTs
        </Text>
      </View> */}

      {/* Active Earnings Section - Commented out for mobile */}
      {/* 
      <View style={styles.activeEarningsSection}>
        <Text style={[styles.sectionHeader, theme === "dark" && { color: "#E0E0E0" }]}>Active Earnings</Text>
        <Text style={[styles.subText, theme === "dark" && { color: "#B3B3B3" }]}>
          Track your active token earnings and rewards
        </Text>

        {loadingEarnings ? (
          <View style={[styles.earningsContainer, { justifyContent: 'center', paddingVertical: 20 }]}>
            <ActivityIndicator size="large" color="#00FF80" />
          </View>
        ) : userEarnings.hasEarnings ? (
          <View style={styles.earningsSimpleContainer}>
            <View style={[styles.earningCard, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033", borderWidth: 1 }]}>
              <View style={styles.earningSimpleContent}>
                <View style={styles.earningSimpleRow}>
                  <View style={styles.earningInfo}>
                    <Image
                      source={require("@/assets/images/mainlogo.png")}
                      style={styles.earningIcon}
                    />
                    <View>
                      <Text style={[styles.earningLabel, theme === "dark" && { color: '#E0E0E0' }]}>EDLN Balance</Text>
                      <Text style={[styles.earningAmount, theme === "dark" && { color: '#E0E0E0' }]}>{String(userEarnings.edln)} EDLN</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.claimButton, theme === "dark" && { backgroundColor: "#00FF80" }]}
                    onPress={handleClaimEDLN}
                    disabled={claimingEDLN || userEarnings.edln <= 0}
                  >
                    {claimingEDLN ? (
                      <ActivityIndicator color={theme === "dark" ? "#000" : "#fff"} size="small" />
                    ) : (
                      <Text style={[styles.claimButtonText, theme === "dark" && { color: "#000" }]}>Claim</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={[styles.earningCard, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033", borderWidth: 1 }]}>
              <View style={styles.earningSimpleContent}>
                <View style={styles.earningSimpleRow}>
                  <View style={styles.earningInfo}>
                    <Image
                      source={require("@/assets/images/solana.png")}
                      style={styles.earningIcon}
                    />
                    <View>
                      <Text style={[styles.earningLabel, theme === "dark" && { color: '#E0E0E0' }]}>USDC Balance</Text>
                      <Text style={[styles.earningAmount, theme === "dark" && { color: '#E0E0E0' }]}>{String(userEarnings.sol)} USDC</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.claimButton, theme === "dark" && { backgroundColor: "#00FF80" }]}
                    onPress={handleClaimSOL}
                    disabled={claimingSOL || userEarnings.sol <= 0}
                  >
                    {claimingSOL ? (
                      <ActivityIndicator color={theme === "dark" ? "#000" : "#fff"} size="small" />
                    ) : (
                      <Text style={[styles.claimButtonText, theme === "dark" && { color: "#000" }]}>Claim</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.emptyStateContainer, theme === "dark" && { backgroundColor: "#131313" }]}>
            <Text style={[styles.emptyStateText, theme === "dark" && { color: "#E0E0E0" }]}>
              No active earnings available.
            </Text>
            <Text style={[styles.emptyStateSubtext, theme === "dark" && { color: "#B3B3B3" }]}>
              Complete tasks and maintain streaks to earn rewards!
            </Text>
          </View>
        )}
      </View>
      */}

      {/* Web Version Notice for Token Claims */}
      {/* <View style={[styles.webNoticeContainer, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}>
        <Image
          source={require("@/assets/images/mainlogo.png")}
          style={{ width: 48, height: 48 }}
        />
        <Text style={[styles.webNoticeTitle, theme === "dark" && { color: "#E0E0E0" }]}>
          Token Earnings
        </Text>
        <Text style={[styles.webNoticeText, theme === "dark" && { color: "#B3B3B3" }]}>
          Open the web version to claim your EDLN tokens and USDC rewards
        </Text>
      </View> */}

      <View style={styles.xpHistory}>
        <Text style={[styles.sectionHeader, theme === "dark" && { color: "#E0E0E0" }]}>XP Earning History</Text>

        <View style={[styles.historyList, { marginTop: 10 }]}>
          {activities.length > 0 ? (
            <>
              {activities.slice(from, to).map((activity, index) => (
                <View key={index} style={[styles.activityCard, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}>
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
                        <Text style={[styles.chatText, theme === "dark" && { color: "#E0E0E0" }]} numberOfLines={1}>
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
                        <Text style={[styles.xpHistoryText, theme === "dark" && { color: "#B3B3B3" }]}>
                          +{activity.xpEarned} XP
                        </Text>
                      </View>
                    </View>

                    <View style={styles.activityRightColumn}>
                      <View style={styles.metadataItem}>
                        <Image
                          source={theme === "dark" ? require("@/assets/images/icons/dark/calendar.png") : require("@/assets/images/icons/calendar.png")}
                          style={styles.metadataIcon}
                        />
                        <Text style={[styles.dateText, theme === "dark" && { color: "#E0E0E0" }]}>
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </Text>
                      </View>

                      <View style={styles.metadataItem}>
                        <Text style={[styles.activityTypeText, theme === "dark" && { color: "#00FF80" }]}>
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
              ))}

              {activities.length > itemsPerPage && (
                <View style={[styles.tableContainer, theme === "dark" && { backgroundColor: "#131313" }]}>
                  <DataTable style={[styles.table, theme === "dark" && { backgroundColor: "#131313" }]}>
                    <View style={styles.paginationContainer}>
                      <DataTable.Pagination
                        page={page}
                        numberOfPages={Math.ceil(activities.length / itemsPerPage)}
                        onPageChange={(page) => setPage(page)}
                        onItemsPerPageChange={onItemsPerPageChange}
                        showFastPaginationControls
                        style={styles.pagination}
                      />
                    </View>
                  </DataTable>
                </View>
              )}
            </>
          ) : (
            <View style={[styles.emptyStateContainer, theme === "dark" && { backgroundColor: "#131313" }]}>
              <Text style={[styles.emptyStateText, theme === "dark" && { color: "#E0E0E0" }]}>
                No activity history available.
              </Text>
              <Text style={[styles.emptyStateSubtext, theme === "dark" && { color: "#B3B3B3" }]}>
                Complete quizzes and chat with the AI to earn XP!
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ height: 30 }} />

      <View style={[styles.quizzes, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}>
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Image
            source={require("@/assets/images/icons/medal-07.png")}
            style={{ width: 62, height: 62 }}
          />
        </View>
        <Text
          style={[
            {
              fontFamily: "Satoshi",
              fontWeight: 500,
              fontSize: 16,
              lineHeight: 30,
              color: "#2D3C52",
              textAlign: "center",
            },
            theme === "dark" && { color: "#E0E0E0" }
          ]}
        >
          Boost Your XP, Unlock New Rewards
        </Text>
        <Text style={[styles.subText, { textAlign: "center" }, theme === "dark" && { color: "#B3B3B3" }]}>
          Complete quick actions daily to level up faster, earn badges, and stay
          on top of the leaderboard.
        </Text>
        <TouchableOpacity style={[styles.quizButton, theme === "dark" && { backgroundColor: "#00FF80" }]} onPress={() => router.push("/quizzes")}>  
          <Text
            style={[
              {
                fontFamily: "Satoshi",
                fontWeight: 500,
                fontSize: 14,
                lineHeight: 24,
                color: "#00FF80",
                textAlign: "center",
              },
              theme === "dark" && { color: "#000" }
            ]}
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
          <View style={[styles.modalContent, theme === "dark" && { backgroundColor: "#131313" }]}>
            <Image 
              source={theme === "dark" ? require("@/assets/images/icons/dark/SealCheck.png") : require("@/assets/images/icons/SealCheck.png")} 
              style={styles.successIcon}
            />
            <Text style={[styles.modalTitle, theme === "dark" && { color: "#E0E0E0" }]}>Asset Claimed Successfully!</Text>
            
            <Text style={[styles.modalDescription, theme === "dark" && { color: "#B3B3B3" }]}>
              Your tokens have been successfully transferred to your wallet.
            </Text>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={[styles.closeButton, theme === "dark" && { backgroundColor: "#00FF80" }]} 
                onPress={() => setSuccessModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, theme === "dark" && { color: "#000" }]}>Close</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.shareButton, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]} 
                onPress={() => handleShare()}
              >
                <Text style={[styles.shareButtonText, theme === "dark" && { color: "#E0E0E0" }]}>Share</Text>
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
    color: "#000",
  },
  earningAmount: {
    fontFamily: "Satoshi",
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
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
  webNoticeContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    marginBottom: 20,
    gap: 12,
  },
  webNoticeTitle: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3C52",
    textAlign: "center",
  },
  webNoticeText: {
    fontFamily: "Satoshi",
    fontSize: 14,
    color: "#61728C",
    textAlign: "center",
    lineHeight: 20,
  },
  tableContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginTop: 20,
  },
  table: {
    backgroundColor: '#fff',
  },
  paginationContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  pagination: {
    paddingHorizontal: 0,
  },
});
