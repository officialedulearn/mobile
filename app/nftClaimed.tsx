import { Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Platform, Share } from "react-native";
import React, { useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import useUserStore from "@/core/userState";
import { RewardsService } from "@/services/rewards.service";
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

type Props = {};

const nftClaimed = (props: Props) => {
  const [reward, setReward] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const { rewardId } = useLocalSearchParams();
  const rewardsService = new RewardsService();

  useEffect(() => {
    const fetchReward = async () => {
      if (!rewardId) {
        setError("No reward ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const rewardData = await rewardsService.getRewardById(
          rewardId as string
        );
        
        if (!rewardData) {
          setError("Reward not found");
        } else {
          setReward(rewardData);
        }
      } catch (error) {
        console.error("Failed to fetch reward:", error);
        setError("Failed to load reward details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReward();
  }, [rewardId]);

  const handleViewNFTs = () => {
    router.push("/nfts");
  };

  const handleShareNFT = async () => {
    if (!reward || !reward.imageUrl) {
      console.error('No NFT image to share');
      return;
    }

    try {
      const message = `I just minted "${reward.title}" NFT on EduLearn! Check it out! 🎉`;
      
      const fileUri = FileSystem.cacheDirectory + 'nft-image.png';
      const downloadResult = await FileSystem.downloadAsync(
        reward.imageUrl,
        fileUri
      );
      
      if (downloadResult.status !== 200) {
        alert('Failed to download the image');
        return;
      }

      
      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await Share.share({
          title: 'Share Your NFT Achievement',
          message: message,
          url: contentUri 
        });
      } 
      else {
        await Share.share({
          url: fileUri,
          message: message
        });
      }
    } catch (error) {
      console.error('Error sharing NFT:', error);
      alert('Failed to share NFT');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#00FF80" />
        <Text style={styles.loadingText}>Loading your NFT...</Text>
      </View>
    );
  }

  if (error || !reward) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error || "Failed to load NFT details"}</Text>
        <TouchableOpacity style={styles.viewButton} onPress={handleViewNFTs}>
          <Text style={styles.viewButtonText}>Return to Collection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Image
          source={require("@/assets/images/icons/SealCheck.png")}
          style={styles.checkImage}
        />
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>NFT Claimed 🎉</Text>
          {reward.imageUrl && (
            <Image 
              source={{ uri: reward.imageUrl }} 
              style={styles.nftImage}
              resizeMode="contain"
            />
          )}
          <Text style={styles.subtitle}>
            You've successfully claimed {reward.title || "your NFT"}, a collectible NFT for
            your achievement. You can now view this in your Claimed Collection.
          </Text>
        </View>
      </View>
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.shareButtton} onPress={handleShareNFT}>
          <Text style={styles.shareButtonText}>Share</Text>
          <Image
            source={require("@/assets/images/icons/share.png")}
            style={{ width: 20, height: 20, marginLeft: 10 }}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.viewButton} onPress={handleViewNFTs}>
          <Text style={styles.viewButtonText}>View in collection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default nftClaimed;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F9FBFC",
  },
  centerContent: {
    justifyContent: "center",
  },
  spacer: {
    flex: 1,
  },
  topSection: {
    alignItems: "center",
    flex: 2,
    justifyContent: "center",
  },
  checkImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  welcomeContainer: {
    alignItems: "center",
  },
  infoContainer: {
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    marginBottom: 40,
    flex: 1,
    justifyContent: "flex-end",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  infoImage: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2D3C52",
    textAlign: "center",
    lineHeight: 42,
    fontFamily: "Satoshi",
    fontStyle: "normal",
  },
  subtitle: {
    color: "#61728C",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    fontFamily: "Satoshi",
    textAlign: "center",
    marginBottom: 24,
  },
  infoText: {
    color: "#61728C",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    fontFamily: "Satoshi",
    flex: 1,
  },
  startButton: {
    backgroundColor: "#000",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: "#00FF80",
  },
  buttonText: {
    lineHeight: 24,
    fontFamily: "Satoshi",
    color: "#000",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },
  bottomSection: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  shareButtton: {
    alignItems: "center",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
    justifyContent: "center",
    flex: 1,
  },
  shareButtonText: {
    lineHeight: 24,
    fontFamily: "Satoshi",
    color: "#000",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },
  viewButton: {
    backgroundColor: "#000",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: "center",
  },
  viewButtonText: {
    color: "#00FF80",
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  nftImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginVertical: 16,
  },
  loadingText: {
    marginTop: 12,
    color: "#61728C",
    fontSize: 16,
    fontFamily: "Satoshi",
  },
  errorText: {
    color: "#FF4D4F",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Satoshi",
  }
});
