import React from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

const BASE_HEIGHTS = [8, 12, 16, 14, 10];
const MAX_HEIGHTS = [24, 28, 32, 26, 22];

const WaveBar = ({
  anim,
  index,
}: {
  anim: SharedValue<number>;
  index: number;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      anim.value,
      [0, 1],
      [BASE_HEIGHTS[index], MAX_HEIGHTS[index]],
    );
    return {
      height,
      opacity: 0.5 + anim.value * 0.5,
      transform: [{ scaleY: 0.8 + anim.value * 0.2 }],
    };
  });

  return (
    <Animated.View
      style={[styles.waveBar, { backgroundColor: "#FF4444" }, animatedStyle]}
    />
  );
};

const WaveVisualization = ({
  waveAnimations,
}: {
  waveAnimations: SharedValue<number>[];
}) => (
  <View style={styles.waveContainer}>
    {waveAnimations.map((anim, index) => (
      <WaveBar key={index} anim={anim} index={index} />
    ))}
  </View>
);

export const ChatTextInputRow = ({
  theme,
  inputText,
  setInputText,
  isTranscribing,
  isGenerating,
  isNavigating,
  handleSendMessage,
  selectedImageUri,
  setSelectedImageUri,
  startRecording,
  inputContainerOpacity,
  micButtonScale,
  micButtonRotation,
}: {
  theme: string;
  inputText: string;
  setInputText: (text: string) => void;
  isTranscribing: boolean;
  isGenerating: boolean;
  isNavigating: boolean;
  handleSendMessage: () => void;
  selectedImageUri: string | null;
  setSelectedImageUri: (uri: string | null) => void;
  startRecording: () => void;
  inputContainerOpacity: SharedValue<number>;
  micButtonScale: SharedValue<number>;
  micButtonRotation: SharedValue<number>;
}) => {
  const dark = theme === "dark";
  const disabled = isGenerating || isNavigating || isTranscribing;
  const trimmedInput = inputText.trim();
  const animatedInputStyle = useAnimatedStyle(() => ({
    opacity: inputContainerOpacity.value,
    transform: [
      { scale: interpolate(inputContainerOpacity.value, [0, 1], [0.98, 1]) },
    ],
  }));

  const animatedMicStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: micButtonScale.value },
      { rotate: `${micButtonRotation.value}deg` },
    ],
  }));

  const handlePickImage = async () => {
    if (disabled) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to attach an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  return (
    <Animated.View
      style={[
        styles.composerShell,
        dark && {
          backgroundColor: "#0D0D0D",
          borderColor: "#2E3033",
        },
        animatedInputStyle,
      ]}
    >
      {selectedImageUri ? (
        <View style={styles.attachmentPreviewRow}>
          <Image source={{ uri: selectedImageUri }} style={styles.attachmentPreview} />
          <TouchableOpacity
            onPress={() => setSelectedImageUri(null)}
            style={[styles.removeAttachmentButton, dark && { backgroundColor: "#2E3033" }]}
            activeOpacity={0.8}
            accessibilityLabel="Remove selected image"
          >
            <Ionicons name="close" size={14} color={dark ? "#E0E0E0" : "#2D3C52"} />
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.inputWrapper}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            void handlePickImage();
          }}
          disabled={disabled}
          activeOpacity={0.75}
          accessibilityLabel="Pick image"
        >
          <Ionicons
            name="image-outline"
            size={22}
            color={dark ? "#E0E0E0" : "#61728C"}
            style={disabled && styles.disabledSend}
          />
        </TouchableOpacity>
      {isTranscribing ? (
        <View style={styles.transcribingContainer}>
          <Text style={[styles.transcribingText, dark && { color: "#E0E0E0" }]}>
            Transcribing...
          </Text>
        </View>
      ) : (
        <TextInput
          placeholder="Ask Eddie anything..."
          placeholderTextColor={dark ? "#B3B3B3" : "#61728C"}
          style={[styles.textInput, dark && { color: "#E0E0E0" }]}
          value={inputText}
          onChangeText={setInputText}
          returnKeyType="send"
          blurOnSubmit={true}
          onSubmitEditing={() => handleSendMessage()}
          multiline={true}
          editable={!disabled}
          textAlignVertical="center"
        />
      )}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.micButton}
          onPress={startRecording}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Animated.View style={animatedMicStyle}>
            <Image
              source={require("@/assets/images/icons/mic.png")}
              style={[
                { width: 24, height: 24 },
                dark && { tintColor: "#E0E0E0" },
                disabled && styles.disabledSend,
              ]}
            />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => handleSendMessage()}
          disabled={
            trimmedInput === "" ||
            disabled
          }
        >
          <Image
            source={
              dark
                ? require("@/assets/images/icons/dark/send-2.png")
                : require("@/assets/images/icons/send-2.png")
            }
            style={[
              { width: 24, height: 24 },
              (trimmedInput === "" || disabled) && styles.disabledSend,
            ]}
          />
        </TouchableOpacity>
      </View>
      </View>
    </Animated.View>
  );
};

export const ChatRecordingRow = ({
  waveAnimations,
  theme,
  recordingOpacity,
  recordingContainerScale,
  onStop,
}: {
  waveAnimations: SharedValue<number>[];
  theme: string;
  recordingOpacity: SharedValue<number>;
  recordingContainerScale: SharedValue<number>;
  onStop: () => void;
}) => {
  const dark = theme === "dark";
  const animatedWrapperStyle = useAnimatedStyle(() => ({
    opacity: recordingOpacity.value,
    transform: [{ scale: recordingContainerScale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.recordingWrapper,
        dark && {
          backgroundColor: "#1A0D0D",
          borderColor: "#FF4444",
        },
        animatedWrapperStyle,
      ]}
    >
      <WaveVisualization waveAnimations={waveAnimations} />
      <View style={styles.recordingControls}>
        <Text style={[styles.recordingLabel, dark && { color: "#FF4444" }]}>
          Recording...
        </Text>
        <TouchableOpacity
          style={[
            styles.stopRecordingButton,
            dark && { backgroundColor: "#FF4444" },
          ]}
          onPress={onStop}
          activeOpacity={0.8}
        >
          <Image
            source={require("@/assets/images/icons/micoff.png")}
            style={{ width: 20, height: 20, tintColor: "#FFFFFF" }}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    justifyContent: "center",
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: "#FF4444",
    minHeight: 4,
  },
  composerShell: {
    backgroundColor: "#F0F4FF",
    borderColor: "#DDE7F7",
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 48,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 7,
    borderRadius: 999,
  },
  attachmentPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 8,
  },
  attachmentPreview: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  removeAttachmentButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -12,
    marginTop: -36,
  },
  recordingWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFE6E6",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: "#FF4444",
    minHeight: 60,
  },
  recordingControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginLeft: 16,
  },
  recordingLabel: {
    color: "#FF4444",
    fontSize: 14,
    fontFamily: "Urbanist",
    fontWeight: "600",
  },
  stopRecordingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  micButton: {
    padding: 5,
  },
  transcribingContainer: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
  },
  transcribingText: {
    fontFamily: "Urbanist",
    fontSize: 14,
    color: "#61728C",
    fontStyle: "italic",
  },
  textInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontFamily: "Urbanist",
    fontSize: 16,
    color: "#2D3C52",
  },
  sendButton: {
    padding: 5,
  },
  disabledSend: {
    opacity: 0.5,
  },
});
