import { StyleSheet, Text, TextInput, View, TouchableOpacity, Alert } from "react-native";
import React, { useState } from "react";
import BackButton from "@/components/backButton";
import { router } from "expo-router";
import useUserStore from "@/core/userState";
import { UserService } from "@/services/auth.service";
import { useNotifications } from "@/hooks/useNotifications";
import { RoadmapService } from "@/services/roadmap.service";

type Props = {};

const identity = (props: Props) => {
  const [learningGoal, setLearningGoal] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser, theme } = useUserStore();
  const { scheduleNotification } = useNotifications();
  const userService = new UserService();
  const roadmapService = new RoadmapService();

  const handleFinishSetup = async () => {
    if (!learningGoal.trim()) {
      Alert.alert("Please enter your learning goal", "Tell us what you want to learn");
      return;
    }

    if (!user) {
      Alert.alert("Error", "User not found. Please try again.");
      return;
    }

    setIsLoading(true);

    try {
      const updatedUser = await userService.updateUserLearning({
        name: user.name,
        email: user.email,
        username: user.username,
        learning: learningGoal.trim()
      });

      setUser({
        ...user,
        learning: learningGoal.trim()
      });

      try {
        const roadmap = await roadmapService.getUserRoadmaps(user.id);

        if (roadmap && roadmap.length > 0) {
          await scheduleNotification("Your roadmap has been generated", "You are now ready to start your learning journey", {
            screen: `roadmaps/${roadmap[0].id}`
          });
        }
      } catch (roadmapError) {
        console.error("Error fetching roadmap:", roadmapError);
      }

      router.push("/auth/welcome");
    } catch (error) {
      console.error("Error updating learning preference:", error);
      Alert.alert("Error", "Failed to save your preferences. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
      <View style={styles.topNav}>
        <BackButton />
      </View>

      <View style={styles.content}>
        <View style={{ gap: 8 }}>
          <Text style={[styles.headerText, theme === "dark" && { color: "#E0E0E0" }]}>What do you want to learn?</Text>
          <Text style={[styles.subText, theme === "dark" && { color: "#B3B3B3" }]}>
            Tell us your learning goal so we can create a personalized roadmap for you.
          </Text>
        </View>

        <View style={styles.inputs}>
          <View>
            <Text style={[styles.displayNameText, theme === "dark" && { color: "#B3B3B3" }]}>Your learning goal</Text>
            <TextInput 
              placeholder="blockchain basics, web3 design, smart contracts..." 
              placeholderTextColor={theme === "dark" ? "#B3B3B3" : "#61728C"}
              style={[styles.bioInput, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033", color: "#E0E0E0" }]}
              value={learningGoal}
              onChangeText={setLearningGoal}
              maxLength={100}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[
            {
              marginTop: 32,
              backgroundColor: learningGoal.trim() ? "#00FF80" : (theme === "dark" ? "#2E3033" : "#EDF3FC"),
              paddingVertical: 16,
              borderRadius: 32,
              alignItems: "center",
            },
            (!learningGoal.trim() || isLoading) && { opacity: 0.5 }
          ]}
          disabled={!learningGoal.trim() || isLoading}
          onPress={handleFinishSetup}
        >
          <Text style={{ 
            color: learningGoal.trim() ? "#2D3C52" : (theme === "dark" ? "#B3B3B3" : "#61728C"),
            fontWeight: "600",
            fontSize: 16,
            fontFamily: "Satoshi-Regular",
          }}>
            {isLoading ? "Setting up..." : "Finish Setup"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default identity;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#F9FBFC",
  },
  topNav: {
    marginTop: 50,
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    marginTop: 20,
    gap: 24
  },
  headerText: {
    color: "#2D3C52",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 42,
    fontFamily: "Satoshi-Regular",
  },
  subText: {
    color: "#61728C",
    lineHeight: 24,
    fontWeight: "500",
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
  },
  displayNameText: {
    color: "#2D3C52",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    fontFamily: "Satoshi-Regular",
  },
  inputs: {
    marginTop: 32,
    gap: 24
  },
  bioInput: {
    gap: 8,
    paddingVertical: 14,    
    paddingHorizontal: 16,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Satoshi-Regular",
  },
});
