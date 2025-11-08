import { Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Linking } from "react-native";
import React, { useEffect, useState } from "react";
import BackButton from "@/components/backButton";
import { RewardsService } from "@/services/rewards.service";
import { useLocalSearchParams } from "expo-router";
import useUserStore from "@/core/userState";
import { format } from "date-fns";

type Props = {};

const nftPage = (props: Props) => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reward, setReward] = useState<any>(null);
  const [userReward, setUserReward] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const rewardService = new RewardsService();
  const { user, theme } = useUserStore();


  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const rewardData = await rewardService.getRewardById(id as string);
        setReward(rewardData);

        if (user?.id && id) {
          const userRewards = await rewardService.getUserRewards(user.id);
          const userSpecificReward = userRewards.find(r => r.id === id);
          if (userSpecificReward) {
            setUserReward(userSpecificReward);
          }
        }
      } catch (error) {
        console.error("Error fetching rewards:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, user?.id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date unavailable";
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, theme === "dark" && {backgroundColor: "#0D0D0D"}]}>
        <ActivityIndicator size="large" color={theme === "dark" ? "#00FF80" : "#000"} />
        <Text style={[styles.loadingText, theme === "dark" && {color: "#E0E0E0"}]}>Loading NFT details...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
      <BackButton />

      <View style={styles.contentContainer}>
        <View style={styles.rewardContainer}>
          <Image 
            source={{ uri: reward?.imageUrl }} 
            style={styles.image}
            resizeMode="contain"
          />
          <Text style={[styles.rewardTitle, theme === "dark" && { color: "#E0E0E0" }]}>
            {reward?.title}
          </Text>
          <Text style={[styles.rewardSubtitle, theme === "dark" && { color: "#B3B3B3" }]}>
            {reward?.description}
          </Text>
          {userReward?.earnedAt && (
            <View style={styles.claimedAt}>
              <Image
                source={theme === "dark" ? require("@/assets/images/icons/dark/calendar.png") : require("@/assets/images/icons/calendar.png")}
                style={{ width: 16, height: 16, marginRight: 8 }}
              />
              <Text style={[styles.claimedAtText, theme === "dark" && { color: "#B3B3B3" }]}>
                Claimed at: <Text style={{ color: "#E0E0E0", fontWeight: "700" }}>{formatDate(userReward.earnedAt)}</Text>
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.bottomButtonContainer}>
        {userReward?.signature ? (
          <TouchableOpacity 
            onPress={() => {
              const explorerUrl = `https://solscan.io/tx/${userReward.signature}`;
              console.log("Opening explorer URL:", explorerUrl);
              Linking.openURL(explorerUrl);
            }} 
            style={[styles.viewOnExplorerButton, theme === "dark" && { backgroundColor: "#00FF80" }]}
          >
            <Text style={[styles.viewOnExplorerText, theme === "dark" && { color: "#000" }]}>
              View on Explorer
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={() => {
              if (reward?.signature) {
                const explorerUrl = `https://solscan.io/tx/${reward.signature}`;
                console.log("Opening explorer URL:", explorerUrl);
                Linking.openURL(explorerUrl);
              }
            }} 
            style={[styles.viewOnExplorerButton, theme === "dark" && { backgroundColor: "#00FF80" }]}
            disabled={!reward?.signature}
          >
            <Text style={[styles.viewOnExplorerText, theme === "dark" && { color: "#000" }]}>
              View this user's badge on chain
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default nftPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 50,
    backgroundColor: "#F9FBFC",
  },
  contentContainer: {
    flex: 1,
    marginTop: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    borderRadius: 8,
    width: 250,
    height: 250,
    marginBottom: 10
  },
  rewardTitle: {
    color: "#2D3C52",
    fontSize: 24,
    lineHeight: 36,
    fontWeight: "700",
    fontFamily: "Satoshi",
    textAlign: "center"
  },
  rewardSubtitle: {
    color: "#61728C",
    lineHeight: 24,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
    fontFamily: "Satoshi",
    paddingHorizontal: 20
  },
  rewardContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16
  },
  claimedAt: {
    flexDirection: "row",
    alignItems: "center",
  },
  claimedAtText: {
    color: "#61728C",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 24,
    fontWeight: "500",
    fontFamily: "Satoshi",
  },
  viewOnExplorerButton: {
     borderRadius: 16,
     gap: 12,
     display: "flex",
     alignItems: "center",
     paddingTop: 10,
     paddingBottom: 16,
     backgroundColor: "#000",
     width: "100%"
  },
  viewOnExplorerText: {
    color: "#00FF80",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 24,
    fontFamily: "Satoshi",  
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#61728C",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Satoshi",
  },
  bottomButtonContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: "center",
    width: "100%"
  },
  notClaimedContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  notClaimedText: {
    color: "#61728C",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Satoshi",
  },
});
