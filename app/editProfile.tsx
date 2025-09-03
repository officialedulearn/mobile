import { StyleSheet, Text, View, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Modal, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import BackButton from '@/components/backButton'
import useUserStore from '@/core/userState'
import { UserService } from '@/services/auth.service'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

type Props = {}

const editProfile = (props: Props) => {
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const theme = useUserStore((state) => state.theme)
  const userService = new UserService()
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    learning: user?.learning || ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleUpdateProfile = async () => {
    if (!formData.name.trim() || !formData.username.trim()) {
      setIsError(true);
      setModalMessage("Name and username cannot be empty");
      setShowModal(true);
      return;
    }

    setIsLoading(true);

    try {
      const updatedUser = await userService.editUser({
        name: formData.name,
        email: user?.email as string,
        username: formData.username,
        learning: formData.learning
      });
      
      if (user) {
        setUser({
          ...user,
          name: updatedUser.name,
          username: updatedUser.username,
          learning: updatedUser.learning
        });
      }

      setIsError(false);
      setModalMessage("Profile updated successfully!");
      setShowModal(true);

      setTimeout(() => {
        setShowModal(false);
        router.back();
      }, 2000);

    } catch (error) {
      console.error("Failed to update profile:", error);
      setIsError(true);
      setModalMessage(error instanceof Error ? error.message : "Failed to update profile. Please try again.");
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <View style={styles.header}>
        <BackButton />
        <Text style={[styles.headerText, theme === "dark" && { color: "#E0E0E0" }]}>Edit Profile</Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.content}>
          <View>
            <Text style={[styles.inputLabel, theme === "dark" && { color: "#B3B3B3" }]}>Full Name</Text>
            <View style={[styles.inputContainer, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}>
              <TextInput
                style={[styles.input, theme === "dark" && { color: "#E0E0E0" }]}
                placeholder="Enter your full name"
                placeholderTextColor={theme === "dark" ? "#B3B3B3" : "#61728C"}
                value={formData.name}
                onChangeText={(text) => handleChange("name", text)}
              />
            </View>
          </View>

          <View>
            <Text style={[styles.inputLabel, theme === "dark" && { color: "#B3B3B3" }]}>Username</Text>
            <View style={[styles.inputContainer, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}>
              <TextInput
                style={[styles.input, theme === "dark" && { color: "#E0E0E0" }]}
                placeholder="Enter your username"
                placeholderTextColor={theme === "dark" ? "#B3B3B3" : "#61728C"}
                value={formData.username}
                onChangeText={(text) => handleChange("username", text)}
              />
            </View>
          </View>

          <View>
            <Text style={[styles.inputLabel, theme === "dark" && { color: "#B3B3B3" }]}>What are you learning?</Text>
            <View style={[styles.inputContainer, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}>
              <TextInput
                style={[styles.input, theme === "dark" && { color: "#E0E0E0" }]}
                placeholder="blockchain basics, web3 design, smart contracts..."
                placeholderTextColor={theme === "dark" ? "#B3B3B3" : "#61728C"}
                value={formData.learning}
                onChangeText={(text) => handleChange("learning", text)}
                maxLength={100}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.buttonsContainer}>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.cancelButton, theme === "dark" && {borderColor: "#00FF80", backgroundColor: "#0D0D0D" }]}
              onPress={handleCancel}
            >
              <View style={styles.buttonContent}>
                <Text style={[styles.cancelButtonText, theme === "dark" && { color: "#00FF80", backgroundColor: "#" }]}>Cancel</Text>
                <Image
                  source={theme === "dark" ? require('@/assets/images/icons/dark/cancel.png') : require('@/assets/images/icons/cancel.png')}
                  style={{ width: 20, height: 20 }}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, theme === "dark" && { backgroundColor: "#00FF80" }]}
              onPress={handleUpdateProfile}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme === "dark" ? "#000" : "#00FF80"} />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={[styles.saveButtonText, theme === "dark" && { color: "#000" }]}>Save Changes</Text>
                  <Image
                    source={theme === "dark" ? require('@/assets/images/icons/dark/checkmark.png') : require('@/assets/images/icons/checkmark.png')}
                    style={{ width: 20, height: 20 }}
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[
            styles.modalContent, 
            isError ? 
              (theme === "dark" ? { backgroundColor: "#2E1A1A", borderColor: "#FF6B6B" } : styles.errorModal) : 
              (theme === "dark" ? { backgroundColor: "#1A2E1A", borderColor: "#00FF80" } : styles.successModal)
          ]}>
            <Text style={[styles.modalText, theme === "dark" && { color: "#E0E0E0" }]}>{modalMessage}</Text>
            {!isError && (
              <Image
                source={require('@/assets/images/icons/checkmark.png')}
                style={{ width: 20, height: 20, marginTop: 10 }}
              />
            )}
            {isError && (
              <TouchableOpacity 
                style={[styles.closeButton, theme === "dark" && { backgroundColor: "#FF6B6B" }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.closeButtonText, theme === "dark" && { color: "#000" }]}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

export default editProfile

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60, 
  },
  headerText: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '500',
    fontFamily: "Satoshi",
    color: "#2D3C52"
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 40,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    gap: 16,
  },
  inputLabel: {
    color: "#61728C", 
    fontFamily: "Satoshi",
    fontSize: 14, 
    fontStyle: "normal",
    fontWeight: "500",
    lineHeight: 24, 
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDF3FC",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    marginBottom: 10,
    gap: 8
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#2D3C52",
    fontFamily: "Satoshi",
  },
  updateButton: {
    backgroundColor: "#000",
    width: "100%",
    borderRadius: 50,
    paddingVertical: 16,
    marginTop: 10,
  },
  buttonText: {
    color: "#00FF80",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderColor: "#000",
    borderWidth: 1,
    borderRadius: 16,
    height: 48,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cancelButtonText: {
    color: "#000",
    fontWeight: "500",
    fontSize: 14,
    fontFamily: "Satoshi",
    lineHeight: 24
  },

  saveButton: {
    borderRadius: 16,
    paddingVertical: 10,
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: "#000",
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  saveButtonText: {
    color: "#00FF80",
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Satoshi",
    lineHeight: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 16, 
    marginTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center', // Center buttons horizontally
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '80%',
  },
  successModal: {
    backgroundColor: '#F0FFF4',
    borderColor: '#00FF80',
    borderWidth: 1,
  },
  errorModal: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FF0000',
    borderWidth: 1,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: "Satoshi",
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FF0000',
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontFamily: "Satoshi",
    fontWeight: '500',
  },
  buttonsContainer: {
    justifyContent: 'center', // Center vertically in the available space
    alignItems: 'center', // Center horizontally
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  }
})