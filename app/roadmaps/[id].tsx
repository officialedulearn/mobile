import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Share } from "react-native";
import React, { useState, useEffect } from "react";
import BackButton from "@/components/backButton";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { RoadmapWithSteps, RoadmapStep } from "@/interface/Roadmap";
import { RoadmapService } from "@/services/roadmap.service";
import useUserStore from "@/core/userState";
import { CardSharingService } from "@/services/cardSharing.service";

const Roadmap = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useUserStore((state) => state.theme);
  const user = useUserStore((state) => state.user);
  const [roadmapData, setRoadmapData] = useState<RoadmapWithSteps | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startingStep, setStartingStep] = useState<string | null>(null);

  const roadmapService = new RoadmapService();
  const cardSharingService = new CardSharingService();
  const fetchRoadmap = async () => {
    if (!id) return;
    
    setIsLoading(true);
    
    try {
      const data = await roadmapService.getRoadmapById(id as string);
      setRoadmapData(data);
    } catch (error: any) {
      console.error("Failed to fetch roadmap:", error);
      Alert.alert("Error", error.message || "Failed to load roadmap");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      fetchRoadmap();
    }, [id])
  );

  const handleStartStep = async (step: RoadmapStep) => {
    if (!user?.id) {
      Alert.alert("Error", "Please login to start a step");
      return;
    }

    setStartingStep(step.id);
    
    try {
      await roadmapService.startRoadmapStep(step.id, {
        userId: user.id,
      });
      
      if (roadmapData?.roadmap.chatId) {
        router.push({
          pathname: '/(tabs)/chat',
          params: { chatIdFromNav: roadmapData.roadmap.chatId }
        });
      }
    } catch (error: any) {
      console.error("Failed to start step:", error);
      Alert.alert("Error", error.message || "Failed to start step. Please try again.");
    } finally {
      setStartingStep(null);
    }
  };

  const calculateTotalTime = () => {
    if (!roadmapData?.steps) return 0;
    return roadmapData.steps.reduce((sum, step) => sum + step.time, 0);
  };

  const calculateProgress = () => {
    if (!roadmapData?.steps || roadmapData.steps.length === 0) return 0;
    const completedSteps = roadmapData.steps.filter(step => step.done).length;
    return Math.round((completedSteps / roadmapData.steps.length) * 100);
  };

  const handleShareProgress = async () => {
    try {
      
      await cardSharingService.shareRoadmapProgressCard(id as string, roadmapData?.roadmap.title || "");
    } catch (error: any) {
      console.error("Failed to share:", error);
    }
  };

  if (isLoading || !roadmapData) {
    return (
      <View style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
        <View style={styles.topNav}>
          <BackButton />
          <Text style={[styles.title, theme === "dark" && { color: "#E0E0E0" }]}>
            Learning Path
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme === "dark" ? "#00FF80" : "#000"} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        theme === "dark" && { backgroundColor: "#0D0D0D" },
      ]}
    >
      <View style={styles.topNav}>
        <BackButton />
        <Text style={[styles.title, theme === "dark" && { color: "#E0E0E0" }]}>
          Learning Path
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.roadmapInfo,
            theme === "dark" && {
              backgroundColor: "#131313",
              borderColor: "#2E3033",
            },
          ]}
        >
        <View style={styles.roadmapInfoHeader}>
          <Image
            source={require("@/assets/images/icons/roadmap.png")}
            style={styles.roadmapInfoHeaderImage}
          />
          <Text
            style={[
              styles.roadmapInfoHeaderTitle,
              theme === "dark" && { color: "#E0E0E0" },
            ]}
          >
            Learning Path: {roadmapData.roadmap.title}
          </Text>
        </View>

        <View style={styles.roadmapDetails}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Image
              source={theme === "dark" ? require("@/assets/images/icons/dark/clock.png") : require("@/assets/images/icons/clock.png")}
              style={styles.roadmapDetailsImage}
            />
            <Text
              style={[
                styles.roadmapDetailsTitle,
                theme === "dark" && { color: "#E0E0E0" },
              ]}
            >
              {calculateTotalTime()}min
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Image
              source={theme === "dark" ? require("@/assets/images/icons/dark/notebook.png") : require("@/assets/images/icons/notebook.png")}
              style={styles.roadmapDetailsImage}
            />
            <Text
              style={[
                styles.roadmapDetailsTitle,
                theme === "dark" && { color: "#E0E0E0" },
              ]}
            >
              {roadmapData.steps.length} steps
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Image
              source={require("@/assets/images/icons/medal-05.png")}
              style={styles.roadmapDetailsImage}
            />
            <Text
              style={[
                styles.roadmapDetailsTitle,
                theme === "dark" && { color: "#E0E0E0" },
              ]}
            >
              Earn up to {roadmapData.steps.length * 3}xp
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.shareButton, 
            theme === "dark" && { backgroundColor: "transparent", borderColor: "#00FF80" }
          ]}
          onPress={handleShareProgress}
        >
          <Text style={[styles.shareButtonText, theme === "dark" && { color: "#00FF80" }]}>
            Share Progress ({calculateProgress()}%)
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.roadmapSteps}>
        {roadmapData.steps.map((step, index) => (
          <View key={step.id} style={styles.roadmapStep}>
            <View style={styles.roadmapStepNumber}>
              <Text style={{ color: "#fff" }}>{index + 1}</Text>
            </View>

            <View style={styles.roadmapStepContent}>
              <Text style={[
                styles.roadmapStepTitle, 
                theme === "dark" && { color: "#E0E0E0" },
                step.done && { textDecorationLine: 'line-through' }
              ]}>
                {step.title}
              </Text>
              <Text style={[
                styles.roadmapStepDescription, 
                theme === "dark" && { color: "#B3B3B3" },
                step.done && { textDecorationLine: 'line-through' }
              ]}>
                {step.description}
              </Text>
              <View style={styles.roadmapStepFooter}>
                <TouchableOpacity 
                  style={[
                    styles.roadmapStepButton, 
                    theme === "dark" && { backgroundColor: "transparent", borderColor: "#00FF80" }
                  ]}
                  onPress={() => handleStartStep(step)}
                  disabled={startingStep === step.id || step.done}
                >
                  {startingStep === step.id ? (
                    <ActivityIndicator size="small" color={theme === "dark" ? "#00FF80" : "#000"} />
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Image 
                        source={theme === "dark" 
                          ? require("@/assets/images/icons/dark/play.png") 
                          : require("@/assets/images/icons/play.png")} 
                        style={styles.roadmapStepButtonIcon} 
                      />
                      <Text style={[styles.roadmapStepButtonText, theme === "dark" && { color: "#00FF80" }]}>
                        Start
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                
                <Text style={[styles.roadmapStepTimeText, theme === "dark" && { color: "#E0E0E0" }]}>
                  {step.time}min
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
  },
  topNav: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    marginTop: 50,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "500",
    fontFamily: "Satoshi",
    color: "#2D3C52",
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  roadmapInfo: {
    marginHorizontal: 24,
    padding: 12,
    gap: 16,
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    marginTop: 30,
  },
  roadmapInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  roadmapInfoHeaderImage: {
    width: 24,
    height: 24,
  },
  roadmapInfoHeaderTitle: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Satoshi",
    color: "#2D3C52",
    lineHeight: 26,
    flex: 1,
    flexWrap: "wrap",
  },
  roadmapDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roadmapDetailsImage: {
    width: 16,
    height: 16,
  },
  roadmapDetailsTitle: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    textAlign: "center",
    fontFamily: "Satoshi",
  },
  roadmapSteps: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 16,
    flexDirection: "column",
  },
  roadmapStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  roadmapStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  roadmapStepContent: {
    flex: 1,
    gap: 8,
  },
  roadmapStepFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
  },
  roadmapStepButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  roadmapStepButtonIcon: {
    width: 16,
    height: 16,
  },
  roadmapStepButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Satoshi",
    fontWeight: "500",
    color: "#000",
  },
  roadmapStepTitle: {
    color: "#2D3C52",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    fontFamily: "Satoshi",
  },
  roadmapStepDescription: {
    color: "#61728C",
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 20,
    fontFamily: "Satoshi",
  },
  roadmapStepTimeText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Satoshi",
    fontWeight: "500",
    color: "#61728C",
  },
  shareButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  shareButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Satoshi",
    fontWeight: "500",
    color: "#000",
  },
});

export default Roadmap;
