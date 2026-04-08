import React from "react";
import {
  Image,
  LayoutChangeEvent,
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
  composerHeight,
  theme,
  inputText,
  setInputText,
  isTranscribing,
  isGenerating,
  isNavigating,
  handleSendMessage,
  scrollToBottom,
  startRecording,
  inputContainerOpacity,
  micButtonScale,
  micButtonRotation,
}: {
  composerHeight: SharedValue<number>;
  theme: string;
  inputText: string;
  setInputText: (text: string) => void;
  isTranscribing: boolean;
  isGenerating: boolean;
  isNavigating: boolean;
  handleSendMessage: () => void;
  scrollToBottom: () => void;
  startRecording: () => void;
  inputContainerOpacity: SharedValue<number>;
  micButtonScale: SharedValue<number>;
  micButtonRotation: SharedValue<number>;
}) => {
  const dark = theme === "dark";
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

  return (
    <Animated.View
      onLayout={(e: LayoutChangeEvent) => {
        composerHeight.value = e.nativeEvent.layout.height;
      }}
      style={[
        styles.inputWrapper,
        dark && {
          backgroundColor: "#0D0D0D",
        },
        animatedInputStyle,
      ]}
    >
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
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={() => handleSendMessage()}
          onFocus={() => {
            setTimeout(() => scrollToBottom(), 100);
          }}
          multiline={true}
          editable={!isGenerating && !isNavigating && !isTranscribing}
          textAlignVertical="center"
        />
      )}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.micButton}
          onPress={startRecording}
          disabled={isGenerating || isNavigating || isTranscribing}
          activeOpacity={0.7}
        >
          <Animated.View style={animatedMicStyle}>
            <Image
              source={require("@/assets/images/icons/mic.png")}
              style={[
                { width: 24, height: 24 },
                dark && { tintColor: "#E0E0E0" },
                (isGenerating || isNavigating || isTranscribing) &&
                  styles.disabledSend,
              ]}
            />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => handleSendMessage()}
          disabled={
            inputText.trim() === "" ||
            isGenerating ||
            isNavigating ||
            isTranscribing
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
              (inputText.trim() === "" ||
                isGenerating ||
                isNavigating ||
                isTranscribing) &&
                styles.disabledSend,
            ]}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const ChatRecordingRow = ({
  composerHeight,
  waveAnimations,
  theme,
  recordingOpacity,
  recordingContainerScale,
  onStop,
}: {
  composerHeight: SharedValue<number>;
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
      onLayout={(e: LayoutChangeEvent) => {
        composerHeight.value = e.nativeEvent.layout.height;
      }}
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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 50,
  },
  recordingWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFE6E6",
    borderRadius: 24,
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
    padding: 10,
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
