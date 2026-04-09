import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";

export class CardSharingService {
  private readonly apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  private async shareCard(
    cardType: string,
    userId: string,
    queryParams: Record<string, string> = {},
    dialogTitle: string
  ): Promise<void> {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const queryString = new URLSearchParams({
        theme: "dark",
        ...queryParams,
      }).toString();

      const cardUrl = `${this.apiUrl}/cards/${cardType}/${userId}?${queryString}`;

      const fileUri = `${FileSystem.documentDirectory}${cardType}-${userId}.png`;

      const downloadResumable = FileSystem.createDownloadResumable(
        cardUrl,
        fileUri,
        {},
        (downloadProgress) => {
          downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        }
      );

      const downloadPromise = downloadResumable.downloadAsync();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Download timeout")), 30000)
      );

      const result = await Promise.race([downloadPromise, timeoutPromise]);

      if (!result) {
        throw new Error("Download failed");
      }

      const downloadResult = result as FileSystem.FileSystemDownloadResult;

      if (downloadResult.status === 200) {
        const isAvailable = await Sharing.isAvailableAsync();

        if (isAvailable) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: "image/png",
            dialogTitle: dialogTitle,
            UTI: "public.png",
          });
        } else {
          throw new Error("Sharing is not available on this device");
        }
      } else {
        throw new Error(`Failed to download card: ${downloadResult.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Download timeout") {
        throw new Error("The server took too long to generate the card");
      }
      throw error;
    }
  }

  async shareStreakCard(userId: string, streak: number): Promise<void> {
    return this.shareCard("streak", userId, {}, `I'm on a ${streak} day learning streak on EduLearn! 🔥`);
  }

  async shareEarningsCard(userId: string, totalEarnings: number): Promise<void> {
    return this.shareCard(
      "earnings",
      userId,
      {},
      `I've earned $${totalEarnings.toFixed(2)} on EduLearn! 💰`
    );
  }

  async shareLevelCard(userId: string, level: string): Promise<void> {
    return this.shareCard("level", userId, {}, `I just reached ${level} level on EduLearn! 🏆`);
  }

  async shareProfileCard(userId: string, username: string): Promise<void> {
    return this.shareCard("profile", userId, {}, `Check out my EduLearn progress! 🚀 @${username}`);
  }

  async shareNFTMintCard(userId: string, nftTitle: string, nftImageUrl?: string): Promise<void> {
    const queryParams: Record<string, string> = {};

    if (nftTitle) {
      queryParams.nftTitle = nftTitle;
    }

    if (nftImageUrl) {
      queryParams.nftImageUrl = nftImageUrl;
    }

    return this.shareCard("nft-mint", userId, queryParams, `I just minted ${nftTitle} NFT on EduLearn! 🎉`);
  }

  async shareRoadmapProgressCard(roadmapId: string, roadmapTitle: string): Promise<void> {
    return this.shareCard(
      "roadmap-progress",
      roadmapId,
      {},
      `Check out my progress on "${roadmapTitle}" roadmap on EduLearn! 🚀`
    );
  }
}
