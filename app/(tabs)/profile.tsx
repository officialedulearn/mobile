import DailyCheckInStreak from "@/components/streak";
import useUserStore from "@/core/userState";
import { levels } from "@/utils/constants";
import { supabase } from "@/utils/supabase";
import { getUserMetrics } from "@/utils/utils";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View, TextInput, ScrollView, Dimensions, ActivityIndicator } from "react-native";
import * as Clipboard from 'expo-clipboard';
import { router } from "expo-router";
import Modal from "react-native-modal";
import { WalletService } from "@/services/wallet.service";
import Auth from "../auth";
import { UserService } from "@/services/auth.service";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

type Props = {};

const ACHIEVEMENT_IMAGES = {
  xp: require("@/assets/images/icons/medal-06.png"),
  nft: require("@/assets/images/icons/nft.png"),
  quiz: require("@/assets/images/icons/brain-03.png"),
};

const AchievementCard = ({
  title,
  imageKey,
  metric,
}: {
  title: string;
  imageKey: keyof typeof ACHIEVEMENT_IMAGES;
  metric: string;
}) => {
  return (
    <View style={styles.achievementCard}>
      <Image
        source={ACHIEVEMENT_IMAGES[imageKey]}
        style={{ width: 30, height: 30 }}
      />
      <Text style={styles.cardSubText}>{metric}</Text>

      <Text style={styles.metricTitle}>{title}</Text>
    </View>
  );
};

const Profile = (props: Props) => {
  const user = useUserStore((state) => state.user);
  const walletBalance = useUserStore((state) => state.walletBalance);
  const fetchWalletBalance = useUserStore((state) => state.fetchWalletBalance);
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
  const [burnSuccessModalVisible, setBurnSuccessModalVisible] = React.useState(false);
  const [isBurning, setIsBurning] = React.useState(false);
  const [isBuying, setIsBuying] = React.useState(false);
  const [isStaking, setIsStaking] = React.useState(false);

  const walletService = new WalletService()
  const authService = new UserService()
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

      await walletService.swapSolToEDLN(user?.id || "", amount);
      console.log(`Buying ${amount} SOL worth of EDLN`);
      
      await fetchWalletBalance(); 
      setIsBuying(false);
      toggleBuyModal();
    } catch (error: any) {
      setBuyError(error.message || "Failed to complete purchase");
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
    } catch (error: any) {
      console.error("Error burning tokens:", error);
      setIsBurning(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Profile</Text>
        <TouchableOpacity onPress={() => router.push("/settings")} style={styles.settingsButton}>
          <Image
            source={require("@/assets/images/icons/settings.png")}
            style={{ width: 40, height: 40 }}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.cardHeader}>
          <View style={styles.identity}>
            <Image
              source={require("@/assets/images/memoji.png")}
              style={{ width: 50, height: 50, borderRadius: 25 }}
            />
            <Text style={styles.cardText}>{user?.name}</Text>
            <TouchableOpacity 
              style={styles.verifyButton} 
              onPress={() => router.push("/connectX")}
            >
              <Image
                source={require("@/assets/images/icons/verified.png")}
                style={styles.verifyIcon} 
              />
              <Text style={styles.verifyText}>Get Verified</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.levelContainer}>
            <View style={styles.levelIconContainer}>
              <Image
                source={require("@/assets/images/icons/level.png")}
                style={[styles.levelIcon, { width: 28, height: 28 }]}
              />
              <Text style={styles.levelNumber}>
                {levels.indexOf(user?.level?.toLowerCase() || "") + 1}
              </Text>
            </View>
            <Text style={styles.levelText}>{user?.level}</Text>
          </View>
        </View>
        <View style={{ alignItems: "center", alignSelf: "center" }}>
          <View style={styles.xpDisplay}>
            <Image source={require("@/assets/images/icons/medal-05.png")} width={24} height={24}/>
            <Text style={styles.xpText}>{user?.xp} XP</Text>
          </View>
        </View>
        <View style={styles.walletCard}>
          <View style={styles.walletInfoContainer}>
            <Image source={require("@/assets/images/icons/wallet.png")} />
            <Text style={styles.walletText}>{user?.address}</Text>
            <TouchableOpacity
              onPress={async () => {
                await Clipboard.setStringAsync(user?.address || "");
              }}
            >
              <Image
                source={require("@/assets/images/icons/copy.png")}
                style={{ width: 16, height: 16 }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceHeader}>Balance</Text>
            <View style={styles.balancesWrapper}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceValue}>
                  {walletBalance?.sol.toFixed(4)}
                </Text>
                <Text style={styles.balanceTicker}>SOL</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.buyButton}
                onPress={toggleBuyModal}
              >
                <Text style={styles.buyButtonIcon}>+</Text>
              </TouchableOpacity>
              
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <Text style={styles.balanceValue}>
                  {walletBalance?.tokenAccount.toFixed(2)}
                </Text>
                <Text style={styles.balanceTicker}>EDLN</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.achievements}>
        <AchievementCard
          title="XP Earned"
          imageKey="xp"
          metric={userMetrics.xp + " XP"}
        />

        <AchievementCard
          title="NFT collected"
          imageKey="nft"
          metric={userMetrics.nfts.toString()}
        />
        <AchievementCard
          title="Quiz Completed"
          imageKey="quiz"
          metric={userMetrics.quizCompleted.toString()}
        />
      </View>
      <DailyCheckInStreak lastSignIn={lastSignIn} />
      <View style={styles.refCard}>
        <View style={styles.invitePush}>
          <Image
            source={require("@/assets/images/icons/congrats.png")}
            style={{ width: 62, height: 62 }}
          />
          <View style={{flexDirection: "column", gap: 4}}>
            <Text style={{fontFamily: "Satoshi", fontSize: 16,fontWeight: 500,color: "#2D3C52", lineHeight: 30}}>Invite friends, earn rewards!</Text>
            <Text style={styles.cardSubText}>Share your referral link and earn XP when they join. </Text>
          </View>
        </View>

        <View style={styles.referralCodeContainer}>
          <Text style={styles.referralCode}>{user?.referralCode}</Text>
          <TouchableOpacity
            onPress={async () => {
              await Clipboard.setStringAsync(user?.referralCode || "");
            }}
            style={{flexDirection: "row", alignItems: "center", gap: 8}}
          >
            <Text style={[styles.cardSubText, {fontSize: 16, lineHeight: 26}]}>Copy Code</Text>
            <Image
              source={require("@/assets/images/icons/copy.png")}
              style={{ width: 16, height: 16 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tokenUtilities}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tokenUtilitiesContainer}
          snapToInterval={Dimensions.get('window').width - 40} // Full width minus padding
          decelerationRate="fast"
          onScroll={(event) => {
            const contentOffsetX = event.nativeEvent.contentOffset.x;
            const screenWidth = Dimensions.get('window').width - 40;
            const index = Math.round(contentOffsetX / screenWidth);
            setActiveTokenUtilIndex(index);
          }}
          scrollEventThrottle={16}
        >
          <View style={styles.tokenUtility}>
            <Text style={styles.tokenUtilityText}>
              Burn 1000 $EDLN and get 10 credits
            </Text>
            <TouchableOpacity
              style={[styles.tokenUtilityButton, isBurning && styles.disabledButton]}
              onPress={handleBurnTokens}
              disabled={isBurning}
            >
              {isBurning ? (
                <ActivityIndicator size="small" color="#00FF80" />
              ) : (
                <Text style={styles.tokenUtilityButtonText}>Burn</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.tokenUtility}>
            <Text style={styles.tokenUtilityText}>
              Stake 5000 $EDLN for 30 days and earn 500 XP
            </Text>
            <TouchableOpacity
              style={[styles.tokenUtilityButton, styles.disabledButton]}
              disabled={true}
            >
              <Text style={[styles.tokenUtilityButtonText, {color: '#61728C'}]}>Coming Soon</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.paginationContainer}>
          {[0, 1].map((index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationDot,
                activeTokenUtilIndex === index ? styles.paginationDotActive : {},
              ]}
            />
          ))}
        </View>
      </View>

      <Modal isVisible={isBuyModalVisible} style={styles.buyModal}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Buy EDLN Tokens</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Amount in SOL"
              keyboardType="numeric"
              value={buyAmount}
              onChangeText={setBuyAmount}
              editable={!isBuying}
            />
            <Text style={styles.balanceText}>
              Available: {walletBalance?.sol.toFixed(4)} SOL
            </Text>
          </View>
          
          {buyError && (
            <Text style={styles.errorText}>{buyError}</Text>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={toggleBuyModal}
              disabled={isBuying}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buyModalButton, isBuying && styles.disabledButton]}
              onPress={handleBuyEDLN}
              disabled={isBuying}
            >
              {isBuying ? (
                <ActivityIndicator size="small" color="#00FF80" />
              ) : (
                <Text style={styles.buyModalButtonText}>Buy EDLN</Text>
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
        <View style={styles.modalContent}>
          <View style={styles.burnSuccessIconContainer}>
            <FontAwesome5 name="fire" size={30} color="#00FF80" />
          </View>
          <Text style={styles.modalTitle}>Tokens Burned Successfully!</Text>
          <Text style={styles.modalDescription}>You've received 10 credits and your wallet balance has been updated.</Text>
          <TouchableOpacity
            style={styles.okButton}
            onPress={() => setBurnSuccessModalVisible(false)}
          >
            <Text style={styles.okButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    padding: 20,
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
    marginTop: 20,
    padding: 20,
    backgroundColor: "#000",
    borderRadius: 16,
    flexDirection: "column",
    gap: 15,
  },
  cardHeader: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },
  identity: {
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardText: {
    color: "#00FF80",
    textAlign: "center",
    fontFamily: "Satoshi",
    fontSize: 17.436,
    fontWeight: 500,
    lineHeight: 26.1,
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#00FF80",
    padding: 8,
    borderRadius: 8,
  },
  verifyIcon: {
    width: 20,
    height: 20,
  },
  verifyText: {
    color: "#000",
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "500",
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
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  levelText: {
    color: "#00FF80",
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "500",
  },
  xpDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  xpText: {
    color: "#00FF80",
    fontWeight: 500,
    lineHeight: 22,
    fontSize: 14,
    fontFamily: "Satoshi",
  },
  walletCard: {
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    padding: 20,
    borderRadius: 16,
    gap: 20,
  },
  walletInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
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
  balanceValue: {
    color: "#00FF80",
    fontFamily: "Satoshi",
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
  balanceDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(237, 243, 252, 0.5)",
  },
  connectButton: {
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    textAlign: "center",
    borderRadius: 16,
    padding: 10,
  },
  walletText: {
    color: "#00FF80",
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
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
    marginTop: 20,
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
    gap: 24,
    alignItems: "center",
    flexDirection: "row",
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
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: 500,
  },
  buyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#00FF80",
    justifyContent: "center",
    alignItems: "center",
  },
  buyButtonIcon: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
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
    fontFamily: "Satoshi",
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
    fontFamily: "Satoshi",
    fontSize: 16,
    marginBottom: 8,
  },
  balanceText: {
    color: "#61728C",
    fontFamily: "Satoshi",
    fontSize: 14,
    textAlign: "right",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
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
  },
  buyModalButton: {
    backgroundColor: "#000000",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buyModalButtonText: {
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
  errorText: {
    color: "#FF3B30",
    fontFamily: "Satoshi",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  tokenUtilities: {
    marginTop: 20,
  },
  tokenUtilitiesContainer: {
    paddingHorizontal: 20,
  },
  tokenUtility: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginRight: 10,
    width: Dimensions.get('window').width - 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#EDF3FC",
  },
  tokenUtilityText: {
    color: "#2D3C52",
    fontFamily: "Satoshi",
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
    backgroundColor: '#F0FFF9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00FF80',
    marginBottom: 16,
  },
  modalDescription: {
    color: '#61728C',
    fontFamily: 'Satoshi',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  okButton: {
    backgroundColor: '#000000',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  okButtonText: {
    color: '#00FF80',
    fontFamily: 'Satoshi',
    fontSize: 16,
    fontWeight: '700',
  },
  tokenUtilityButtonText: {
    fontFamily: 'Satoshi',
    fontSize: 16,
    fontWeight: '500',
    color: "#00FF80",
  }
});
