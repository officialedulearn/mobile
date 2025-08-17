import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  ImageSourcePropType,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import BackButton from "@/components/backButton";
import { RewardsService } from "@/services/rewards.service";
import useUserStore from "@/core/userState";
import { format } from "date-fns";
import Modal from "react-native-modal";
import { router } from "expo-router";

type Props = {};
interface UserRewardWithDetails {
  id: string;
  type: "certificate" | "points";
  title: string;
  description: string;
  imageUrl?: string;
  earnedAt: string;
}

const NFT = (props: Props) => {
  const [activeTab, setActiveTab] = useState<
    "claimed" | "unclaimed" | "locked"
  >("claimed");
  const [allRewards, setAllRewards] = useState<any[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<UserRewardWithDetails[]>(
    []
  );
  const [unclaimedRewards, setUnclaimedRewards] = useState<
    UserRewardWithDetails[]
  >([]);
  const [lockedRewards, setLockedRewards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState<UserRewardWithDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rewardService = new RewardsService();

  const { user } = useUserStore();

  const toggleModal = (reward?: UserRewardWithDetails) => {
    if (reward) {
      setSelectedReward(reward);
      setModalVisible(true);
    } else {
      setModalVisible(!isModalVisible);
      if (isModalVisible) {
        setSelectedReward(null);
      }
    }
  };

  useEffect(() => {
    const loadAllRewards = async () => {
      try {
        setIsLoading(true);
        const rewards = await rewardService.getAllRewards();
        const userRewards = await rewardService.getUserRewards(
          user?.id as unknown as string
        );

        setAllRewards(rewards);

        const claimed = userRewards.filter((reward) => reward.signature);
        const unclaimed = userRewards.filter((reward) => !reward.signature);

        setClaimedRewards(claimed);
        setUnclaimedRewards(unclaimed);

        const userRewardIds = new Set(userRewards.map((reward) => reward.id));
        const locked = rewards.filter(
          (reward) => !userRewardIds.has(reward.id)
        );
        setLockedRewards(locked);
      } catch (error) {
        console.error("Failed to load rewards:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAllRewards();
  }, [user?.id]);

  const handleClaimReward = async (rewardId: string) => {
    if (!user?.id) return;

    try {
      setClaimingId(rewardId);
      setIsLoading(true);
      setError(null);

      await rewardService.claimReward(user.id as unknown as string, rewardId);

      const userRewards = await rewardService.getUserRewards(
        user.id as unknown as string
      );
      const claimed = userRewards.filter((reward) => reward.signature);
      const unclaimed = userRewards.filter((reward) => !reward.signature);

      setClaimedRewards(claimed);
      setUnclaimedRewards(unclaimed);

      if (unclaimed.length === 0) {
        setActiveTab("claimed");
      }

      if (selectedReward) {
        router.push({
          pathname: "/nftClaimed",
          params: { rewardId: selectedReward.id },
        });
      }
    } catch (error: any) {
      console.error("Failed to claim reward:", error);
      
      let errorMessage = "Failed to claim NFT";
      
      if (error?.message) {
        if (error.message.includes("insufficient funds for rent")) {
          errorMessage = "Your wallet doesn't have enough SOL to pay for transaction fees";
        } else if (error.message.includes("Transaction simulation failed")) {
          errorMessage = "Transaction failed. Please try again later";
          
          const logs = error.logs || error.getLogs?.();
          if (logs && Array.isArray(logs)) {
            console.log("Transaction error logs:", logs);
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      toggleModal();
      
      setTimeout(() => {
        setSelectedReward(null);
        setModalVisible(true);
      }, 300);
    } finally {
      setIsLoading(false);
      setClaimingId(null);
    }
  };

  const getImageSource = (imageUrl: string): any => {
    if (imageUrl) {
      return { uri: imageUrl };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy");
    } catch (error) {
      return "Date unavailable";
    }
  };

  const handleTabChange = (tab: "claimed" | "unclaimed" | "locked") => {
    setActiveTab(tab);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerNav}>
        <BackButton />
        <Text style={styles.headerTitle}>NFT's</Text>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => handleTabChange("claimed")}>
            <Text
              style={[
                styles.tabText,
                activeTab === "claimed" && styles.activeTab,
              ]}
            >
              Claimed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleTabChange("unclaimed")}>
            <Text
              style={[
                styles.tabText,
                activeTab === "unclaimed" && styles.activeTab,
              ]}
            >
              Unclaimed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleTabChange("locked")}>
            <Text
              style={[
                styles.tabText,
                activeTab === "locked" && styles.activeTab,
              ]}
            >
              Locked
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && !claimingId ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FF80" />
        </View>
      ) : activeTab === "claimed" ? (
        claimedRewards.length > 0 ? (
          <FlatList
            data={claimedRewards}
            numColumns={2}
            renderItem={({ item }: { item: UserRewardWithDetails }) => (
              <TouchableOpacity
                style={styles.rewardCard}
                onPress={() => router.push({
                  pathname: "/nft/[id]",
                  params: { id: item.id }
                })}
              >
                <Image
                  style={styles.rewardImage}
                  source={getImageSource(item.imageUrl as unknown as string)}
                />
                <Text style={styles.rewardTitle}>{item.title}</Text>
                <View style={styles.dateContainer}>
                  <Image
                    source={require("@/assets/images/icons/streak.png")}
                    style={styles.calendarIcon}
                  />
                  <Text style={styles.rewardText}>
                    {formatDate(item.earnedAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item: UserRewardWithDetails) => item.id}
            contentContainerStyle={styles.rewardsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              You haven't claimed any rewards yet.
            </Text>
          </View>
        )
      ) : activeTab === "unclaimed" ? (
        unclaimedRewards.length > 0 ? (
          <FlatList
            data={unclaimedRewards}
            numColumns={2}
            renderItem={({ item }: { item: UserRewardWithDetails }) => (
              <View style={styles.rewardCard}>
                <Image
                  style={styles.rewardImage}
                  source={getImageSource(item.imageUrl as unknown as string)}
                />
                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={() => toggleModal(item)}
                  disabled={isLoading && claimingId === item.id}
                >
                  {isLoading && claimingId === item.id ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.claimButtonText}>Claim NFT</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item: UserRewardWithDetails) => item.id}
            contentContainerStyle={styles.rewardsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No unclaimed rewards found.
            </Text>
          </View>
        )
      ) : lockedRewards.length > 0 ? (
        <FlatList
          data={lockedRewards}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.rewardCard}>
              <View style={styles.lockedOverlay}>
                <Image
                  style={styles.lockedImage}
                  source={getImageSource(item.imageUrl)}
                />
              </View>
              <Text style={styles.rewardTitle}>{item.title}</Text>
              <Text style={styles.rewardDescription}>{item.description}</Text>
            </View>
          )}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.rewardsList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No locked rewards found.</Text>
        </View>
      )}

      <Modal isVisible={isModalVisible} style={styles.rewardModal}>
        <View style={styles.modalContent}>
          {error ? (
            <>
              <Text style={styles.errorTitle}>Error Claiming NFT</Text>
              <Image 
                source={require("@/assets/images/icons/error.png")} 
                style={styles.errorIcon}
                defaultSource={require("@/assets/images/icons/SealCheck.png")}
              />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.claimModalButton}
                onPress={() => {
                  setError(null);
                  toggleModal();
                }}
              >
                <Text style={styles.claimModalButtonText}>Try Again</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.rewardTitle}>Ready to Claim?🎉</Text>
              {selectedReward && (
                <Image
                  style={styles.modalImage}
                  source={getImageSource(selectedReward.imageUrl as unknown as string)}
                />
              )}
              <Text style={styles.modalText}>
                This NFT will be minted on Solana blockchain and added to your collection.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => toggleModal()}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.claimModalButton}
                  onPress={() => {
                    if (selectedReward) {
                      handleClaimReward(selectedReward.id);
                      toggleModal();
                    }
                  }}
                >
                  <Text style={styles.claimModalButtonText}>Claim Now</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default NFT;

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    padding: 20,
    flex: 1,
  },
  headerNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  headerTitle: {
    color: "#2D3C52",
    fontSize: 20,
    lineHeight: 24,
    fontFamily: "Satoshi",
  },
  tabsContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  tabs: {
    flexDirection: "row",
    gap: 20,
    justifyContent: "center",
    width: "100%",
  },
  activeTab: {
    color: "#000",
    fontWeight: "700",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    fontFamily: "Satoshi",
  },
  tabText: {
    textAlign: "center",
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    color: "#61728C",
    paddingBottom: 8,
  },
  rewardImage: {
    width: "100%",
    aspectRatio: 1, // Instagram-like square aspect ratio
    borderRadius: 8,
    marginBottom: 8,
  },
  rewardsList: {
    gap: 16,
    paddingBottom: 20,
  },
  rewardCard: {
    flex: 1,
    margin: 8,
    maxWidth: "45%",
  },
  rewardTitle: {
    color: "#2D3C52",
    fontWeight: "600",
    lineHeight: 20,
    fontSize: 16,
    fontFamily: "Satoshi",
    marginBottom: 4,
  },
  rewardText: {
    color: "#2D3C52",
    fontWeight: "400",
    lineHeight: 16,
    fontSize: 12,
    fontFamily: "Satoshi",
  },
  dateContainer: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  calendarIcon: {
    width: 14,
    height: 14,
  },
  lockedOverlay: {
    position: "relative",
    width: "100%",
    aspectRatio: 1, // Instagram-like square aspect ratio
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  lockedImage: {
    width: "100%",
    height: "100%", // Fill the container
    borderRadius: 8,
    opacity: 0.5,
  },
  rewardDescription: {
    color: "#61728C",
    fontWeight: "400",
    lineHeight: 16,
    fontSize: 12,
    fontFamily: "Satoshi",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    color: "#61728C",
    fontFamily: "Satoshi",
    fontSize: 16,
    textAlign: "center",
  },
  claimButton: {
    backgroundColor: "#000",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  claimButtonText: {
    color: "#00FF80",
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rewardModal: {
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
  modalImage: {
    width: 160,
    height: 160,
    borderRadius: 8,
    marginVertical: 12,
  },
  modalText: {
    color: "#61728C",
    fontFamily: "Satoshi",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 16,
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
    flex: 1,
  },
  claimModalButton: {
    backgroundColor: "#000000",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  claimModalButtonText: {
    color: "#00FF80",
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButtonText: {
    color: "#000000",
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "700",
  },
  claimTitle: {
    color: "#2D3C52",
    fontFamily: "Satoshi",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 36
  },
  errorTitle: {
    color: "#FF3B30",
    fontFamily: "Satoshi",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  errorText: {
    color: "#2D3C52",
    fontFamily: "Satoshi",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  errorIcon: {
    width: 40,
    height: 40,
    marginBottom: 16,
  }
});
