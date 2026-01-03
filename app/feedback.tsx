import { StyleSheet, Text, View, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Image, Modal, ActivityIndicator, ScrollView } from 'react-native'
import React, { useState } from 'react'
import BackButton from '@/components/backButton'
import useUserStore from '@/core/userState'
import { FeedbackService } from '@/services/feedback.service'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

type Props = {}

const feedback = (props: Props) => {
  const user = useUserStore((state) => state.user)
  const theme = useUserStore((state) => state.theme)
  const feedbackService = new FeedbackService()
  
  const [feedbackContent, setFeedbackContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<'bug' | 'feature' | 'improvement' | 'other'>('other');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const categories = [
    { value: 'bug', label: 'Bug Report', icon: require('@/assets/images/icons/warning.png') },
    { value: 'feature', label: 'Feature Request', icon: require('@/assets/images/icons/notebook.png') },
    { value: 'improvement', label: 'Improvement', icon: require('@/assets/images/icons/checkmark.png') },
    { value: 'other', label: 'Other', icon: require('@/assets/images/icons/message.png') },
  ];

  const handleSubmitFeedback = async () => {
    if (feedbackContent.trim().length < 10) {
      setIsError(true);
      setModalMessage("Feedback must be at least 10 characters long");
      setShowModal(true);
      return;
    }

    if (feedbackContent.trim().length > 500) {
      setIsError(true);
      setModalMessage("Feedback must not exceed 500 characters");
      setShowModal(true);
      return;
    }

    setIsLoading(true);

    try {
      await feedbackService.submitFeedback(
        user?.id as string,
        feedbackContent.trim(),
        selectedCategory
      );

      setIsError(false);
      setModalMessage("Thank you for your feedback! We'll review it soon.");
      setShowModal(true);

      setTimeout(() => {
        setShowModal(false);
        router.back();
      }, 2000);

    } catch (error) {
      console.error("Failed to submit feedback:", error);
      setIsError(true);
      setModalMessage(error instanceof Error ? error.message : "Failed to submit feedback. Please try again.");
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const charCount = feedbackContent.length;
  const maxChars = 500;
  const minChars = 10;

  return (
    <KeyboardAvoidingView
      style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BackButton />
          <Text style={[styles.headerText, theme === "dark" && { color: "#E0E0E0" }]}>Give Feedback</Text>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.content}>
            <View>
              <Text style={[styles.sectionLabel, theme === "dark" && { color: "#B3B3B3" }]}>Category</Text>
              <View style={styles.categoryContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.categoryOption,
                      selectedCategory === category.value && styles.categoryOptionSelected,
                      theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" },
                      theme === "dark" && selectedCategory === category.value && { borderColor: "#00FF80" },
                    ]}
                    onPress={() => setSelectedCategory(category.value as any)}
                  >
                    <Image
                      source={category.icon}
                      style={[
                        styles.categoryIcon,
                        selectedCategory === category.value && { tintColor: theme === "dark" ? "#00FF80" : "#000" }
                      ]}
                    />
                    <Text style={[
                      styles.categoryText,
                      selectedCategory === category.value && styles.categoryTextSelected,
                      theme === "dark" && { color: "#E0E0E0" },
                      theme === "dark" && selectedCategory === category.value && { color: "#00FF80" }
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={[styles.sectionLabel, theme === "dark" && { color: "#B3B3B3" }]}>Your Feedback</Text>
              <View style={[styles.textAreaContainer, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}>
                <TextInput
                  style={[styles.textArea, theme === "dark" && { color: "#E0E0E0" }]}
                  placeholder="Tell us what you think... (minimum 10 characters)"
                  placeholderTextColor={theme === "dark" ? "#B3B3B3" : "#61728C"}
                  value={feedbackContent}
                  onChangeText={setFeedbackContent}
                  multiline
                  numberOfLines={6}
                  maxLength={maxChars}
                  textAlignVertical="top"
                />
              </View>
              <View style={styles.charCountContainer}>
                <Text style={[
                  styles.charCount,
                  theme === "dark" && { color: "#B3B3B3" },
                  charCount < minChars && { color: "#FF6B6B" },
                  charCount >= minChars && charCount <= maxChars && theme === "dark" && { color: "#00FF80" },
                  charCount >= minChars && charCount <= maxChars && theme !== "dark" && { color: "#00AA55" },
                ]}>
                  {charCount}/{maxChars} characters {charCount < minChars && `(${minChars - charCount} more needed)`}
                </Text>
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
                  <Text style={[styles.cancelButtonText, theme === "dark" && { color: "#00FF80" }]}>Cancel</Text>
                  <Image
                    source={theme === "dark" ? require('@/assets/images/icons/dark/cancel.png') : require('@/assets/images/icons/cancel.png')}
                    style={{ width: 20, height: 20 }}
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  theme === "dark" && { backgroundColor: "#00FF80" },
                  (isLoading || charCount < minChars) && styles.disabledButton
                ]}
                onPress={handleSubmitFeedback}
                disabled={isLoading || charCount < minChars}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme === "dark" ? "#000" : "#00FF80"} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={[styles.submitButtonText, theme === "dark" && { color: "#000" }]}>Submit</Text>
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
      </ScrollView>

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

export default feedback

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    backgroundColor: "#F9FBFC",
  },
  headerText: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '500',
    fontFamily: "Satoshi-Regular",
    color: "#2D3C52"
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  content: {
    gap: 24,
  },
  sectionLabel: {
    color: "#61728C", 
    fontFamily: "Satoshi-Regular",
    fontSize: 14, 
    fontStyle: "normal",
    fontWeight: "500",
    lineHeight: 24, 
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    gap: 8,
  },
  categoryOptionSelected: {
    borderColor: "#000",
    borderWidth: 2,
  },
  categoryIcon: {
    width: 18,
    height: 18,
  },
  categoryText: {
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    fontWeight: "400",
  },
  categoryTextSelected: {
    fontWeight: "600",
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: "#EDF3FC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    minHeight: 150,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    minHeight: 120,
  },
  charCountContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  charCount: {
    fontSize: 12,
    color: "#61728C",
    fontFamily: "Satoshi-Regular",
  },
  buttonsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 16, 
    width: '100%',
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
    fontFamily: "Satoshi-Regular",
    lineHeight: 24
  },
  submitButton: {
    borderRadius: 16,
    paddingVertical: 10,
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: "#000",
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  submitButtonText: {
    color: "#00FF80",
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Satoshi-Regular",
    lineHeight: 24,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    fontFamily: "Satoshi-Regular",
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
    fontFamily: "Satoshi-Regular",
    fontWeight: '500',
  },
})
