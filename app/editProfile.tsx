import { StyleSheet, Text, View, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Modal, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import BackButton from '@/components/backButton'
import useUserStore from '@/core/userState'
import { UserService } from '@/services/auth.service'
import { router } from 'expo-router'

type Props = {}

const editProfile = (props: Props) => {
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const userService = new UserService()
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    username: user?.username || ""
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
        username: formData.username
      });
      
      // Update the user in the store
      if (user) {
        setUser({
          ...user,
          name: updatedUser.name,
          username: updatedUser.username
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
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerText}>Edit Profile</Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#61728C"
              value={formData.name}
              onChangeText={(text) => handleChange("name", text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#61728C"
              value={formData.username}
              onChangeText={(text) => handleChange("username", text)}
            />
          </View>
        </View>
        
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
            <Image
              source={require('@/assets/images/icons/cancel.png')}
              style={{ width: 20, height: 20 }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdateProfile}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#00FF80" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Save Changes</Text>
                <Image
                  source={require('@/assets/images/icons/checkmark.png')}
                  style={{ width: 20, height: 20 }}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isError ? styles.errorModal : styles.successModal]}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            {!isError && (
              <Image
                source={require('@/assets/images/icons/checkmark.png')}
                style={{ width: 20, height: 20, marginTop: 10 }}
              />
            )}
            {isError && (
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
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
    marginTop: 50,
    flex: 1,
    paddingHorizontal: 24,
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDF3FC",
    borderRadius: 32,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    marginBottom: 10,
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
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
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
    paddingHorizontal: 16,
    backgroundColor: "#000",
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 140,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: "#00FF80",
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Satoshi",
    lineHeight: 24,
    marginRight: 8,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingBottom: 20,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FF0000',
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontFamily: "Satoshi",
    fontWeight: '500',
  }
})