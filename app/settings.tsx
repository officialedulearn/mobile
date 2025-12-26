import { StyleSheet, Text, TouchableOpacity, View, Image, Alert, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import BackButton from "@/components/backButton";
import useUserStore from "@/core/userState";
import useActivityStore from "@/core/activityState";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { UserService } from "@/services/auth.service";
import { WalletService } from "@/services/wallet.service";
import Modal from "react-native-modal";
import * as Clipboard from "expo-clipboard";
import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

type Props = {};

const settings = (props: Props) => {
    const {user, logout, clearAllUserData, theme} = useUserStore();
    const {resetState: resetActivityState} = useActivityStore();
    const [loading, setLoading] = useState(false);
    const [privateKeyModalVisible, setPrivateKeyModalVisible] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [privateKey, setPrivateKey] = useState<string | null>(null);
    const userService = new UserService();
    const payPro = async (userId: string) => {
      // if (!userId) {
      //   Alert.alert("Error", "User information not available");
      //   return;
      // }

      // setLoading(true);
      // const userService = new UserService();

      // try {
      //   const response = await userService.upgradeToPremium(userId);
      //   Alert.alert(
      //     "Premium Upgrade Success", 
      //     "You've successfully upgraded to premium! You now have access to premium features and increased daily credits.", 
      //     [
      //       { 
      //         text: "OK", 
      //         onPress: async () => {
      //           router.reload()
      //         }
      //       }
      //     ]
      //   );
      // } catch (error: Error | any) {
      //   Alert.alert(
      //     "Upgrade Failed",
      //     error.message?.includes("Insufficient balance") 
      //       ? "You don't have enough SOL in your wallet to upgrade to premium. Please add more funds and try again."
      //       : "Failed to upgrade to premium. Please try again later."
      //   );
      // } finally {
      //   setLoading(false);
      // }

    }
    
    const exportPrivateKey = async () => {
      if (!user?.id) {
        Alert.alert("Error", "User information not available");
        return;
      }
      setConfirmModalVisible(true);
    }

    const confirmExportPrivateKey = async () => {
      if (!user?.id) {
        Alert.alert("Error", "User information not available");
        return;
      }
      setConfirmModalVisible(false);
      setLoading(true);
      
      const walletService = new WalletService();
      try {
        const response = await walletService.decryptPrivateKey(user.id);
        if (response.success) {
          setPrivateKey(response.privateKey || null);
          setPrivateKeyModalVisible(true);
        } else {
          Alert.alert("Error", response.error || "Failed to export private key");
        }
      } catch (error) {
        console.error("Error exporting private key:", error);
        Alert.alert("Error", "Failed to export private key. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    const deleteAccount = async () => {
      Alert.alert("Delete Account", "Are you sure you want to delete your account? This action is irreversible.", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await userService.deleteUser(user?.id as unknown as string, (await supabase.auth.getUser()).data.user?.id as string);

              await clearAllUserData();
              resetActivityState();
              router.push("/onboarding");
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert("Error", "Failed to delete account. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]);

    }

  return (
    <View style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <View>
        <View style={styles.headerNav}>
          <BackButton />
          <Text style={[styles.headerTitle, theme === "dark" && { color: "#E0E0E0" }]}>Settings</Text>
        </View>
        
        <View style={styles.settings}>

          <TouchableOpacity 
            style={[styles.getPro, theme === "dark" && styles.getProDark]}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              router.push("/subscription");
            }}
          >
            {theme === "dark" ? (
              <LinearGradient
                colors={['#131313', '#00FF80']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.getProGradient}
              >
                <View style={styles.getProContent}>
                  <View style={{flexDirection: "row", alignItems: "center", gap: 12}}>
                    <Image 
                      source={require("@/assets/images/mainlogo.png")} 
                      style={styles.getProLogo} 
                    />
                    <View>
                      <Text style={styles.getProTitle}>Get Pro</Text>
                      <Text style={styles.getProDescription}>Unlock all features</Text>
                    </View>
                  </View>
                  <View style={styles.getProButtonDark}>
                    <Image 
                      source={require("@/assets/images/icons/dark/CaretRight.png")} 
                      style={{ width: 20, height: 20 }} 
                    />
                  </View>
                </View>
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={['#000000', '#00FF80']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.getProGradient}
              >
                <View style={styles.getProContent}>
                  <View style={{flexDirection: "row", alignItems: "center", gap: 12}}>
                    <Image 
                      source={require("@/assets/images/mainlogo.png")} 
                      style={styles.getProLogo} 
                    />
                    <View>
                      <Text style={styles.getProTitleLight}>Get Pro</Text>
                      <Text style={styles.getProDescriptionLight}>Unlock all features</Text>
                    </View>
                  </View>
                  <View style={styles.getProButtonLight}>
                    <Image 
                      source={require("@/assets/images/icons/CaretRight.png")} 
                      style={{ width: 20, height: 20, tintColor: "#000" }} 
                    />
                  </View>
                </View>
              </LinearGradient>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/editProfile')} style={[styles.settingItem, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}>
            <View  style={{alignItems: "center", flexDirection: "row", gap: 10}}>
              <Image
                source={theme === "dark" ? require("@/assets/images/icons/dark/user.png") : require("@/assets/images/icons/user2.png")}
                style={{ width: 24, height: 24 }} 
              />
              <Text style={[styles.settingText, theme === "dark" && { color: "#E0E0E0" }]}>Edit Profile Info</Text>
            </View>

            <Image 
              source={theme === "dark" ? require("@/assets/images/icons/dark/CaretRight.png") : require("@/assets/images/icons/CaretRight.png")}
              style={{ width: 24, height: 24 }}
            />
          </TouchableOpacity>

        

          <TouchableOpacity 
            style={[styles.settingItem, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]} 
            onPress={() => router.push("/theme")}
            disabled={loading}
          >
            <View style={{alignItems: "center", flexDirection: "row", gap: 10}}>
              <Image
                source={theme === "dark" ? require("@/assets/images/icons/dark/moon.png") : require("@/assets/images/icons/moon.png")}
                style={{ width: 24, height: 24 }} 
              />
              <Text style={[styles.settingText, theme === "dark" && { color: "#E0E0E0" }]}>Theme</Text>
            </View>

            <Image 
              source={theme === "dark" ? require("@/assets/images/icons/dark/CaretRight.png") : require("@/assets/images/icons/CaretRight.png")}
              style={{ width: 24, height: 24 }}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]} 
            onPress={() => deleteAccount()}
            disabled={loading}
          >
            <View style={{alignItems: "center", flexDirection: "row", gap: 10}}>
              <Image
                source={theme === "dark" ? require("@/assets/images/icons/dark/delete.png") : require("@/assets/images/icons/delete.png")}
                style={{ width: 24, height: 24 }} 
              />
              <Text style={[styles.settingText, theme === "dark" && { color: "#E0E0E0" }]}>Delete Account</Text>
            </View>

            <Image 
              source={theme === "dark" ? require("@/assets/images/icons/dark/CaretRight.png") : require("@/assets/images/icons/CaretRight.png")}
              style={{ width: 24, height: 24 }}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]} 
            onPress={() => router.push("/community")}
            disabled={loading}
          >
            <View style={{alignItems: "center", flexDirection: "row", gap: 10}}>
              <Image
                source={theme === "dark" ? require("@/assets/images/icons/dark/message.png") : require("@/assets/images/icons/message.png")}
                style={{ width: 24, height: 24 }} 
              />
              <Text style={[styles.settingText, theme === "dark" && { color: "#E0E0E0" }]}>Community</Text>
            </View>

            <Image 
              source={theme === "dark" ? require("@/assets/images/icons/dark/CaretRight.png") : require("@/assets/images/icons/CaretRight.png")}
              style={{ width: 24, height: 24 }}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]} 
            onPress={() => router.push("/feedback")}
            disabled={loading}
          >
            <View style={{alignItems: "center", flexDirection: "row", gap: 10}}>
              <Image
                source={theme === "dark" ? require("@/assets/images/icons/dark/notebook.png") : require("@/assets/images/icons/notebook.png")}
                style={{ width: 24, height: 24 }} 
              />
              <Text style={[styles.settingText, theme === "dark" && { color: "#E0E0E0" }]}>Give Feedback</Text>
            </View>

            <Image 
              source={theme === "dark" ? require("@/assets/images/icons/dark/CaretRight.png") : require("@/assets/images/icons/CaretRight.png")}
              style={{ width: 24, height: 24 }}
            />
          </TouchableOpacity>

          {/* <TouchableOpacity 
            style={[styles.settingItem, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]} 
            onPress={exportPrivateKey}
            disabled={loading}
          >
            <View style={{alignItems: "center", flexDirection: "row", gap: 10}}>
              <Image
                source={theme === "dark" ? require("@/assets/images/icons/dark/eye.png") : require("@/assets/images/icons/eye.png")}
                style={{ width: 24, height: 24 }} 
              />
              <Text style={[styles.settingText, theme === "dark" && { color: "#E0E0E0" }]}>Export Private Key</Text>
            </View>

            <Image 
              source={theme === "dark" ? require("@/assets/images/icons/dark/CaretRight.png") : require("@/assets/images/icons/CaretRight.png")}
              style={{ width: 24, height: 24 }}
            />
          </TouchableOpacity> */}
        </View>
      </View>

      <TouchableOpacity
        onPress={async () => {
          await logout();
          router.dismissAll();
          router.replace("/");
        }}
        style={[styles.logoutButton]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={[styles.logoutText]}>Logout</Text>
          <Image
            source={require("@/assets/images/icons/logout.png")}
            style={{ width: 20, height: 20 }}
          />
        </View>
      </TouchableOpacity>


      <Modal isVisible={privateKeyModalVisible} style={styles.modal}>
        <View style={[styles.modalContent, theme === "dark" && { backgroundColor: "#131313" }]}>
          <View style={[styles.warningIconContainer, theme === "dark" && { backgroundColor: 'rgba(255, 176, 32, 0.1)', borderColor: '#FFB020' }]}>
            <Image
              source={require("@/assets/images/icons/warning.png")}
              style={{ width: 30, height: 30 }}
            />
          </View>
          <Text style={[styles.modalTitle, theme === "dark" && { color: "#E0E0E0" }]}>Your Private Key</Text>
          <Text style={[styles.modalDescription, theme === "dark" && { color: "#B3B3B3" }]}>
            Keep this private key secure. Anyone with access to this key will have full control over your wallet.
          </Text>
          
          <View style={[styles.privateKeyContainer, theme === "dark" && { backgroundColor: "#2E3033", borderColor: "#2E3033" }]}>
            <Text style={[styles.privateKeyText, theme === "dark" && { color: "#E0E0E0" }]} selectable={true}>
              {privateKey}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.copyButton, theme === "dark" && { backgroundColor: "#00FF80" }]}
            onPress={async () => {
              await Clipboard.setStringAsync(privateKey || "");
              Alert.alert("Success", "Private key copied to clipboard");
            }}
          >
            <View style={styles.copyButtonInner}>
              <Image
                source={require("@/assets/images/icons/copy.png")}
                style={{ width: 16, height: 16 }}
              />
              <Text style={[styles.copyButtonText, theme === "dark" && { color: "#000" }]}>Copy to clipboard</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.closeButton, theme === "dark" && { backgroundColor: "#2E3033", borderColor: "#2E3033" }]}
            onPress={() => {
              setPrivateKeyModalVisible(false);
              setPrivateKey(null);
            }}
          >
            <Text style={[styles.closeButtonText, theme === "dark" && { color: "#E0E0E0" }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal isVisible={confirmModalVisible} style={styles.modal}>
        <View style={[styles.modalContent, theme === "dark" && { backgroundColor: "#131313" }]}>
          <View style={[styles.warningIconContainer, theme === "dark" && { backgroundColor: 'rgba(255, 176, 32, 0.1)', borderColor: '#FFB020' }]}>
            <Image
              source={require("@/assets/images/icons/warning.png")}
              style={{ width: 40, height: 40 }}
            />
          </View>
          <Text style={[styles.modalTitle, theme === "dark" && { color: "#E0E0E0" }]}>Security Warning</Text>
          <Text style={[styles.modalDescription, theme === "dark" && { color: "#B3B3B3" }]}>
            Are you sure you want to export your private key? This key provides complete access to your wallet and funds.
            Only proceed if you are in a secure location.
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.cancelButton, theme === "dark" && { backgroundColor: "#2E3033", borderColor: "#2E3033" }]}
              onPress={() => setConfirmModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, theme === "dark" && { color: "#E0E0E0" }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.confirmButton, theme === "dark" && { backgroundColor: "#00FF80" }]}
              onPress={async () => confirmExportPrivateKey()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme === "dark" ? "#000" : "#FFFFFF"} />
              ) : (
                <Text style={[styles.confirmButtonText, theme === "dark" && { color: "#000" }]}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
    padding: 20,
    justifyContent: "space-between",
  },

  headerNav: {
    marginTop: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 500,
    color: "#2D3C52",
    fontFamily: "Satoshi",
    lineHeight: 24,
  },
  logoutButton: {
    backgroundColor: "#FBEAE9",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 16,
    marginBottom: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: 700,
    color: "#940803",
    fontFamily: "Satoshi",
    lineHeight: 24
  },
  settings: {
    gap: 16,
    flexDirection: "column",
    alignItems: "flex-start",
    marginTop: 16,
    width: "100%",
  },
  settingText: {
    lineHeight: 24,
    fontSize: 14,
    fontFamily: "Satoshi",
    fontWeight: "500",
    color: "#2D3C52"
  },
  settingItem: {
    display: "flex",
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "stretch",
    justifyContent: "space-between",
    width: "100%",
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  modal: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    width: "90%",
  },
  warningIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF9F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFB020',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
    color: "#2D3C52",
    fontFamily: "Satoshi",
  },
  modalDescription: {
    fontSize: 16,
    color: "#61728C",
    marginBottom: 24,
    textAlign: "center",
    fontFamily: "Satoshi",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  privateKeyContainer: {
    backgroundColor: "#F9FBFC",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: "#EDF3FC",
  },
  privateKeyText: {
    fontSize: 14,
    color: "#2D3C52",
    fontFamily: "Satoshi",
  },
  copyButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
    width: "100%",
    alignItems: "center",
  },
  copyButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  copyButtonText: {
    color: "#00FF80",
    fontSize: 16,
    fontFamily: "Satoshi",
    fontWeight: "700",
  },
  closeButton: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
  },
  closeButtonText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "Satoshi",
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 16,
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 16,
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
  },
  cancelButtonText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "Satoshi",
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 16,
    flex: 1,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#00FF80",
    fontSize: 16,
    fontFamily: "Satoshi",
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#A0A0A0",
  },
  getPro: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  getProDark: {
    borderWidth: 0,
  },
  getProGradient: {
    borderRadius: 16,
  },
  getProContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  getProLogo: {
    width: 36,
    height: 36,
  },
  getProTitle: {
    fontSize: 16,
    fontFamily: "Satoshi",
    fontWeight: "700",
    color: "#E0E0E0",
    lineHeight: 20,
    marginBottom: 2,
  },
  getProTitleLight: {
    fontSize: 16,
    fontFamily: "Satoshi",
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 20,
    marginBottom: 2,
  },
  getProDescription: {
    fontSize: 12,
    fontFamily: "Satoshi",
    fontWeight: "400",
    color: "#B3B3B3",
    lineHeight: 16,
  },
  getProDescriptionLight: {
    fontSize: 12,
    fontFamily: "Satoshi",
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 16,
  },
  getProButtonDark: {
    backgroundColor: "#0D0D0D",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2E3033",
  },
  getProButtonLight: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
