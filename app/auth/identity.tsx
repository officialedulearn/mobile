import { StyleSheet, Text, TextInput, View, TouchableOpacity, Alert } from "react-native";
import React, { useState } from "react";
import BackButton from "@/components/backButton";
import { Image } from "expo-image";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import useUserStore from "@/core/userState";
import { UserService } from "@/services/auth.service";

type Props = {};

const identity = (props: Props) => {
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [learningGoal, setLearningGoal] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser } = useUserStore();
  const userService = new UserService();

  const avatarImages = {
    1: require('@/assets/images/avatars/1.png'),
    2: require('@/assets/images/avatars/2.png'),
    3: require('@/assets/images/avatars/3.png'),
    4: require('@/assets/images/avatars/4.png'),
    5: require('@/assets/images/avatars/8.png'),
    6: require('@/assets/images/avatars/6.png'),
    7: require('@/assets/images/avatars/7.png'),
  };

  const handleAvatarSelect = async (avatarNumber: number) => {
    setSelectedAvatar(avatarNumber);
    try {
      await AsyncStorage.setItem('avatar', avatarNumber.toString());
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
  };

  const handleFinishSetup = async () => {
    if (!selectedAvatar) {
      Alert.alert("Please select an avatar", "Choose an avatar to continue");
      return;
    }

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

      router.push("/auth/welcome");
    } catch (error) {
      console.error("Error updating learning preference:", error);
      Alert.alert("Error", "Failed to save your preferences. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const avatars = [1, 2, 3, 4, 5, 6, 7];

  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <BackButton />
      </View>

      <View style={styles.content}>
        <View style={{ gap: 8 }}>
          <Text style={styles.headerText}>Choose your identity</Text>
          <Text style={styles.subText}>
            This name and avatar will be visible on leaderboards and in your
            profile.
          </Text>
        </View>

        <View style={styles.inputs}>
          <View>
            <Text style={styles.displayNameText}>What do you want to learn?</Text>
            <TextInput 
              placeholder="blockchain basics, web3 design, smart contracts..." 
              style={styles.bioInput}
              value={learningGoal}
              onChangeText={setLearningGoal}
              maxLength={100}
              multiline
            />
          </View>

          <View>
            <Text style={styles.displayNameText}>Select Avatar</Text>
            <View style={styles.avatarGrid}>
              {avatars.map((avatarNumber) => (
                <TouchableOpacity
                  key={avatarNumber}
                  onPress={() => handleAvatarSelect(avatarNumber)}
                  style={[
                    styles.avatarContainer,
                    selectedAvatar === avatarNumber && styles.selectedAvatar
                  ]}
                >
                  <Image 
                    source={avatarImages[avatarNumber as keyof typeof avatarImages]} 
                    style={styles.avatarImage} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </View>

        <TouchableOpacity 
          style={{
            marginTop: 32,
            backgroundColor: selectedAvatar && learningGoal.trim() ? "#00FF80" : "#EDF3FC",
            paddingVertical: 16,
            borderRadius: 32,
            alignItems: "center",
          }} 
          disabled={!selectedAvatar || !learningGoal.trim() || isLoading}
          onPress={handleFinishSetup}
        >
          <Text style={{ 
            color: selectedAvatar && learningGoal.trim() ? "#2D3C52" : "#61728C",
            fontWeight: "600",
            fontSize: 16,
            fontFamily: "Satoshi",
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
    marginTop: 50,
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#F9FBFC",
  },
  topNav: {
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
    fontFamily: "Satoshi",
  },
  subText: {
    color: "#61728C",
    lineHeight: 24,
    fontWeight: "500",
    fontFamily: "Satoshi",
    fontSize: 14,
  },
  displayNameText: {
    color: "#2D3C52",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    fontFamily: "Satoshi",
  },
  inputs: {
    marginTop: 32,
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
    fontFamily: "Satoshi",
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  avatarContainer: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedAvatar: {
    borderColor: "#00FF80",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
  },
});
