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

  const { user, theme } = useUserStore();

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
      
      let errorMessage = "Failed to claim badge";
      
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
    <View style={[styles.container, theme === "dark" && styles.darkContainer]}>
      <View style={styles.headerNav}>
        <BackButton />
        <Text style={[styles.headerTitle, theme === "dark" && styles.darkHeaderTitle]}>Badges</Text>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => handleTabChange("claimed")}>
            <Text
              style={[
                styles.tabText,
                activeTab === "claimed" && styles.activeTab,
                theme === "dark" && styles.darkTabText,
                activeTab === "claimed" && theme === "dark" && styles.darkActiveTab,
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
                theme === "dark" && styles.darkTabText,
                activeTab === "unclaimed" && theme === "dark" && styles.darkActiveTab,
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
                theme === "dark" && styles.darkTabText,
                activeTab === "locked" && theme === "dark" && styles.darkActiveTab,
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
                style={[styles.rewardCard, theme === "dark" && styles.darkRewardCard]}
                onPress={() => router.push({
                  pathname: "/nft/[id]",
                  params: { id: item.id }
                })}
              >
                <Image
                  style={styles.rewardImage}
                  source={getImageSource(item.imageUrl as unknown as string)}
                />
                <View style={styles.dateContainer}>
                  <Image
                    source={require("@/assets/images/icons/dark/calendar.png")}
                    style={styles.calendarIcon}
                  />
                  <Text style={[styles.rewardText, theme === "dark" && styles.darkRewardText]}>
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
            <Text style={[styles.emptyStateText, theme === "dark" && styles.darkEmptyStateText]}>
              You haven't claimed any badge yet.
            </Text>
          </View>
        )
      ) : activeTab === "unclaimed" ? (
        unclaimedRewards.length > 0 ? (
          <FlatList
            data={unclaimedRewards}
            numColumns={2}
            renderItem={({ item }: { item: UserRewardWithDetails }) => (
              <View style={[styles.rewardCard, theme === "dark" && styles.darkRewardCard]}>
                <Image
                  style={styles.rewardImage}
                  source={getImageSource(item.imageUrl as unknown as string)}
                />
               
                <TouchableOpacity
                  style={[styles.claimButton, theme === "dark" && {backgroundColor: "#00FF80"}]}
                  onPress={() => toggleModal(item)}
                  disabled={isLoading && claimingId === item.id}
                >
                  {isLoading && claimingId === item.id ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={[styles.claimButtonText, theme === "dark" && {color: "#000"} ]}>Claim</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item: UserRewardWithDetails) => item.id}
            contentContainerStyle={styles.rewardsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, theme === "dark" && styles.darkEmptyStateText]}>
              No unclaimed badges found.
            </Text>
          </View>
        )
      ) : lockedRewards.length > 0 ? (
        <FlatList
          data={lockedRewards}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={[styles.rewardCard, theme === "dark" && styles.darkRewardCard]}>
              <View style={styles.lockedOverlay}>
                <Image
                  style={styles.lockedImage}
                  source={getImageSource(item.imageUrl)}
                />
              </View>
              <Text style={[styles.rewardTitle, theme === "dark" && styles.darkRewardTitle]}>{item.title}</Text>
             
            </View>
          )}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.rewardsList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, theme === "dark" && styles.darkEmptyStateText]}>No locked rewards found.</Text>
        </View>
      )}

      <Modal isVisible={isModalVisible} style={styles.rewardModal}>
        <View style={[styles.modalContent, theme === "dark" && styles.darkModalContent]}>
          {error ? (
            <>
              <Text style={[styles.errorTitle, theme === "dark" && styles.darkErrorTitle]}>Error Claiming NFT</Text>
              <Image 
                source={require("@/assets/images/icons/error.png")} 
                style={styles.errorIcon}
                defaultSource={require("@/assets/images/icons/SealCheck.png")}
              />
              <Text style={[styles.errorText, theme === "dark" && styles.darkErrorText]}>{error}</Text>
              <TouchableOpacity
                style={[styles.claimModalButton, styles.fullWidthButton]}
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
              {selectedReward && (
                <Image
                  style={styles.modalImage}
                  source={getImageSource(selectedReward.imageUrl as unknown as string)}
                />
              )}
              <Text style={[styles.claimModalTitle, theme === "dark" && {color: "#E0E0E0"}]}>Ready to Claim?🎉</Text>
              <Text style={[styles.modalText, theme === "dark" && styles.darkModalText]}>
                You're about to claim{" "}
                <Text style={[styles.nftNameText, theme === "dark" && styles.darkNftNameText]}>
                  {selectedReward?.title}
                </Text>
                , collectible badge for your achievement!
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, theme === "dark" && styles.darkCancelButton]}
                  onPress={() => toggleModal()}
                >
                  <Text style={[styles.cancelButtonText, theme === "dark" && {color: "#00FF80"}]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.claimModalButton, 
                    theme === "dark" && styles.darkClaimModalButton
                  ]}
                  onPress={() => {
                    if (selectedReward) {
                      handleClaimReward(selectedReward.id);
                      toggleModal();
                    }
                  }}
                >
                  <Text style={[styles.claimModalButtonText, theme === "dark" && {color: "#000"}]}>Claim Now</Text>
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
    padding: 20,
    flex: 1,
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  headerNav: {
    marginTop: 50,
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
  darkHeaderTitle: {
    color: "#FFFFFF",
    fontFamily: "Satoshi",
  },
  tabsContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: 24
  },
  activeTab: {
    color: "#000",
    fontWeight: "700",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    fontFamily: "Satoshi",
  },
  darkActiveTab: {
    color: "#FFFFFF",
    borderBottomColor: "#FFFFFF",
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
  darkTabText: {
    color: "#FFFFFF",
    fontFamily: "Satoshi",
  },
  rewardImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,

  },
  rewardsList: {
    gap: 16,
    paddingBottom: 20,
  },
  rewardCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    backgroundColor: "#FFFFFF",
    display: "flex",
    padding: 4,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    flex: 1,
    alignSelf: "stretch",
    margin: 8,
    maxWidth: "45%",
    width: 152,
    height: 192
  },
  darkRewardCard: {
    borderColor: "#2E3033",
    backgroundColor: "#131313",
  },
  rewardTitle: {
    color: "#2D3C52",
    fontWeight: "600",
    lineHeight: 20,
    fontSize: 16,
    fontFamily: "Satoshi",
    marginBottom: 4,
  },
  darkRewardTitle: {
    color: "#FFFFFF",
    fontFamily: "Satoshi",
  },
  rewardText: {
    color: "#2D3C52",
    fontWeight: "400",
    lineHeight: 16,
    fontSize: 12,
    fontFamily: "Satoshi",
  },
  darkRewardText: {
    color: "#FFFFFF",
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
  darkRewardDescription: {
    color: "#FFFFFF",
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
  darkEmptyStateText: {
    color: "#FFFFFF",
    fontFamily: "Satoshi",
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
    width: "100%",
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
  darkModalContent: {
    backgroundColor: "#0D0D0D",
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
  darkModalText: {
    color: "#FFFFFF",
    fontFamily: "Satoshi",
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
    textAlign: "center",
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
  darkErrorTitle: {
    color: "#FF3B30",
    fontFamily: "Satoshi",
  },
  errorText: {
    color: "#2D3C52",
    fontFamily: "Satoshi",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  darkErrorText: {
    color: "#FFFFFF",
    fontFamily: "Satoshi",
  },
  errorIcon: {
    width: 40,
    height: 40,
    marginBottom: 16,
  },
  fullWidthButton: {
    width: "100%",
    flex: 0,
  },
  nftNameText: {
    color: "#E0E0E0",
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
  },
  darkNftNameText: {
    color: "#E0E0E0",
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
  },
  darkCancelButton: {
    backgroundColor: "#000",
    borderColor: "#00FF80",
  },
  darkCancelButtonText: {
    color: "#FFFFFF",
    fontFamily: "Satoshi",
  },
  darkClaimModalButton: {
    backgroundColor: "#00FF80",
  },
  claimModalTitle: {
    color: "#2D3C52",
    fontFamily: "Satoshi",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 36
  },
});
