import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AnimatedPressable from "./AnimatedPressable";
import useUserStore from "@/core/userState";
import { RoadmapService } from "@/services/roadmap.service";
import { RoadmapWithSteps } from "@/interface/Roadmap";

type Props = {
  roadmapId: string;
};

const RoadmapCard = ({ roadmapId }: Props) => {
  const theme = useUserStore((s) => s.theme);
  const router = useRouter();
  const [roadmapData, setRoadmapData] = useState<RoadmapWithSteps | null>(null);
  const [loading, setLoading] = useState(true);

  const roadmapService = new RoadmapService()

  useEffect(() => {
    loadRoadmap();
  }, [roadmapId]);

  const loadRoadmap = async () => {
    try {
      setLoading(true);
      const data = await roadmapService.getRoadmapById(roadmapId);
      setRoadmapData(data);
    } catch (error) {
      console.error("Failed to load roadmap:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRoadmap = () => {
    router.push(`/roadmaps/${roadmapId}`);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.card,
          theme === "dark" && styles.cardDark,
        ]}
      >
        <ActivityIndicator
          size="small"
          color={theme === "dark" ? "#00FF80" : "#2D3C52"}
        />
      </View>
    );
  }

  if (!roadmapData) {
    return null;
  }

  const { roadmap, steps } = roadmapData;
  const totalTime = steps.reduce((sum, step) => sum + step.time, 0);
  const completedSteps = steps.filter((step) => step.done).length;

  return (
    <View
      style={[
        styles.card,
        theme === "dark" && styles.cardDark,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Image source={require("@/assets/images/icons/roadmap.png")} style={{
            width: 24,
            height: 24,
          }} />
        </View>
        <Text
          style={[
            styles.title,
            theme === "dark" && styles.textDark,
          ]}
          numberOfLines={2}
        >
          {roadmap.title}
        </Text>
      </View>

      <Text
        style={[
          styles.description,
          theme === "dark" && styles.textSecondaryDark,
        ]}
        numberOfLines={3}
      >
        {roadmap.description}
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Image
            source={theme == "dark" ? require("@/assets/images/icons/dark/clock.png") : require("@/assets/images/icons/dark/clock.png")}
            style={{
              width: 24,
              height: 24,
            }}
          />
          <Text
            style={[
              styles.statText,
              theme === "dark" && styles.textSecondaryDark,
            ]}
          >
            ~{totalTime} mins
          </Text>
        </View>

        <View style={styles.statItem}>
          <Image source={theme == "dark" ? require("@/assets/images/icons/dark/notebook.png") : require("@/assets/images/icons/notebook.png")} style={{
            width: 24,
            height: 24,
          }} />
          <Text
            style={[
              styles.statText,
              theme === "dark" && styles.textSecondaryDark,
            ]}
          >
            {steps.length} Steps
          </Text>
        </View>

        {completedSteps > 0 && (
          <View style={styles.statItem}>
            <Text
              style={[
                styles.statText,
                { color: "#00FF80", fontWeight: "600" },
              ]}
            >
              {completedSteps}/{steps.length} ✓
            </Text>
          </View>
        )}
      </View>

      <AnimatedPressable
        onPress={handleViewRoadmap}
        style={[
          styles.button,
          theme === "dark" && styles.buttonDark,
        ]}
        scale={0.95}
        hapticFeedback={true}
      >
        <Text
          style={[
            styles.buttonText,
            theme === "dark" && styles.buttonTextDark,
          ]}
        >
          View Learning Path
        </Text>
      </AnimatedPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: "#1A1A1A",
    borderColor: "#2E3033",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00FF80",
    justifyContent: "center",
    alignItems: "center",
  },
  iconEmoji: {
    fontSize: 20,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Satoshi-Bold",
    color: "#2D3C52",
    lineHeight: 22,
  },
  textDark: {
    color: "#E0E0E0",
  },
  description: {
    fontSize: 14,
    fontFamily: "Urbanist",
    color: "#61728C",
    lineHeight: 20,
    marginBottom: 16,
  },
  textSecondaryDark: {
    color: "#B3B3B3",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statEmoji: {
    fontSize: 12,
  },
  statText: {
    fontSize: 13,
    fontFamily: "Urbanist",
    color: "#61728C",
  },
  button: {
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  buttonDark: {
    backgroundColor: "#00FF80",
  },
  buttonText: {
    fontSize: 15,
    fontFamily: "Satoshi-Bold",
    color: "#FFFFFF",
  },
  buttonTextDark: {
    color: "#000000",
  },
});

export default RoadmapCard;
