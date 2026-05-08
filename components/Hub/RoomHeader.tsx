import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import type { Community } from "@/interface/Community";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import BackButton from "@/components/common/backButton";
import { styles } from "./room.styles";

type Theme = "dark" | "light";

type Props = {
  community: Community;
  communityId: string;
  onlineCount: number;
  theme: Theme;
};

export function RoomHeader({
  community,
  communityId,
  onlineCount,
  theme,
}: Props) {
  return (
    <View style={[styles.topNav, theme === "dark" && styles.darkTopNav]}>
      <BackButton />
      <View style={styles.centerSection}>
        <Image
          source={{
            uri:
              community.imageUrl ||
              "https://s2.coinmarketcap.com/static/img/coins/200x200/5426.png",
          }}
          style={styles.communityImage}
        />
        <View>
          <Text style={[styles.title, theme === "dark" && styles.darkTitle]}>
            {community.title}
          </Text>
          <Text
            style={[
              styles.onlineStatus,
              theme === "dark" && styles.darkOnlineStatus,
            ]}
          >
            {onlineCount === 1 ? "Just you here" : `🟢 ${onlineCount} online`}
          </Text>
        </View>
      </View>

      <AnimatedPressable
        style={[styles.infoButton, theme === "dark" && styles.darkInfoButton]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({
            pathname: "/roomInfo/[id]",
            params: { id: communityId },
          });
        }}
        scale={0.9}
        hapticFeedback={true}
      >
        <Image
          source={
            theme === "dark"
              ? require("@/assets/images/icons/dark/information-circle.png")
              : require("@/assets/images/icons/information-circle.png")
          }
          style={styles.infoIcon}
        />
      </AnimatedPressable>
    </View>
  );
}
