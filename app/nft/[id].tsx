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
  const { user } = useUserStore();

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
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00FF80" />
        <Text style={styles.loadingText}>Loading NFT details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackButton />

      <View style={styles.rewardContainer}>
        <Image 
          source={{ uri: reward?.imageUrl }} 
          style={styles.image}
        />
        <Text style={styles.rewardTitle}>
          {reward?.title}
        </Text>
        <Text style={styles.rewardSubtitle}>
          {reward?.description}
        </Text>
        {userReward?.earnedAt && (
          <View style={styles.claimedAt}>
            <Image
              source={require("@/assets/images/icons/calendar.png")}
              style={{ width: 16, height: 16, marginRight: 8 }}
            />
            <Text style={styles.claimedAtText}>
              Claimed at: {formatDate(userReward.earnedAt)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity 
          onPress={() => {
            if (userReward?.signature) {
              const explorerUrl = `https://solscan.io/tx/${userReward.signature}`;
              
              console.log("Opening explorer URL:", explorerUrl);
              Linking.openURL(explorerUrl)
            }
          }} 
          style={styles.viewOnExplorerButton}
          disabled={!userReward?.signature}
        >
          <Text style={styles.viewOnExplorerText}>
            View on Explorer
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default nftPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
    padding: 20,
    backgroundColor: "#F9FBFC",
  },
  image: {
    borderRadius: 8,
    width: 150,
    height: 160
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
  },
  rewardContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginTop: 30,
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
    marginTop: "auto",
    marginBottom: 20,
    alignItems: "center",
  }
});
