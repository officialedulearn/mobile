import { StyleSheet, Text, TouchableOpacity, View, Image, Alert, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import BackButton from "@/components/backButton";
import useUserStore from "@/core/userState";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { UserService } from "@/services/auth.service";
import { WalletService } from "@/services/wallet.service";
import Modal from "react-native-modal";
import * as Clipboard from "expo-clipboard";

type Props = {};

const settings = (props: Props) => {
    const {user, logout} = useUserStore();
    const [loading, setLoading] = useState(false);
    const [privateKeyModalVisible, setPrivateKeyModalVisible] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [privateKey, setPrivateKey] = useState<string | null>(null);

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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View>
        <View style={styles.headerNav}>
          <BackButton />
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        
        <View style={styles.settings}>
          <TouchableOpacity onPress={() => router.push('/editProfile')} style={styles.settingItem}>
            <View  style={{alignItems: "center", flexDirection: "row", gap: 10}}>
              <Image
                source={require("@/assets/images/icons/user2.png")}
                style={{ width: 24, height: 24 }} 
              />
              <Text style={styles.settingText}>Edit Profile Info</Text>
            </View>

            <Image 
              source={require("@/assets/images/icons/CaretRight.png")}
              style={{ width: 24, height: 24 }}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, user?.isPremium ? styles.disabledButton : {}]} 
            onPress={() => router.push('/subscription')}
            disabled={loading || user?.isPremium}
          >
            <View style={{alignItems: "center", flexDirection: "row", gap: 10}}>
              <Image
                source={require("@/assets/images/icons/congrats.png")}
                style={{ width: 24, height: 24 }} 
              />
              <Text style={[styles.settingText, user?.isPremium ? styles.disabledText : {}]}>
                {loading ? "Processing..." : user?.isPremium ? "Premium Active" : "Upgrade to pro"}
              </Text>
            </View>

            <Image 
              source={require("@/assets/images/icons/CaretRight.png")}
              style={{ width: 24, height: 24, opacity: user?.isPremium ? 0.5 : 1 }}
            />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={{alignItems: "center", flexDirection: "row", gap: 10}}>
              <Image
                source={require("@/assets/images/icons/message.png")}
                style={{ width: 24, height: 24 }} 
              />
              <Text style={styles.settingText}>Help & Support</Text>
            </View>

            <Image 
              source={require("@/assets/images/icons/CaretRight.png")}
              style={{ width: 24, height: 24 }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={{alignItems: "center", flexDirection: "row", gap: 10}}>
              <Image
                source={require("@/assets/images/icons/notebook.png")}
                style={{ width: 24, height: 24 }} 
              />
              <Text style={styles.settingText}>Give Feedback</Text>
            </View>

            <Image 
              source={require("@/assets/images/icons/CaretRight.png")}
              style={{ width: 24, height: 24 }}
            />
          </View>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={exportPrivateKey}
            disabled={loading}
          >
            <View style={{alignItems: "center", flexDirection: "row", gap: 10}}>
              <Image
                source={require("@/assets/images/icons/notebook.png")}
                style={{ width: 24, height: 24 }} 
              />
              <Text style={styles.settingText}>Export Private Key</Text>
            </View>

            <Image 
              source={require("@/assets/images/icons/CaretRight.png")}
              style={{ width: 24, height: 24 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => {
          logout();
          router.push("/")

        }}
        style={styles.logoutButton}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>

        <Text style={styles.logoutText}>Logout</Text>
        <Image
          source={require("@/assets/images/icons/logout.png")}
          style={{ width: 20, height: 20 }}
        />
        </View>
      </TouchableOpacity>

      <Modal isVisible={privateKeyModalVisible} style={styles.modal}>
        <View style={styles.modalContent}>
          <View style={styles.warningIconContainer}>
            <Image
              source={require("@/assets/images/icons/warning.png")}
              style={{ width: 30, height: 30 }}
            />
          </View>
          <Text style={styles.modalTitle}>Your Private Key</Text>
          <Text style={styles.modalDescription}>
            Keep this private key secure. Anyone with access to this key will have full control over your wallet.
          </Text>
          
          <View style={styles.privateKeyContainer}>
            <Text style={styles.privateKeyText} selectable={true}>
              {privateKey}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.copyButton}
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
              <Text style={styles.copyButtonText}>Copy to clipboard</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => {
              setPrivateKeyModalVisible(false);
              setPrivateKey(null);
            }}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal isVisible={confirmModalVisible} style={styles.modal}>
        <View style={styles.modalContent}>
          <View style={styles.warningIconContainer}>
            <Image
              source={require("@/assets/images/icons/warning.png")}
              style={{ width: 40, height: 40 }}
            />
          </View>
          <Text style={styles.modalTitle}>Security Warning</Text>
          <Text style={styles.modalDescription}>
            Are you sure you want to export your private key? This key provides complete access to your wallet and funds.
            Only proceed if you are in a secure location.
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setConfirmModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={async () => confirmExportPrivateKey()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm</Text>
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
    marginTop: 50,
    padding: 20,
    justifyContent: "space-between",
  },
  headerNav: {
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
});
