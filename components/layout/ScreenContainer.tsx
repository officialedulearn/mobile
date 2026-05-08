import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, ViewStyle } from "react-native";
import useUserStore from "@/core/userState";

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollEnabled?: boolean;
  showsVerticalScrollIndicator?: boolean;
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  scrollEnabled = true,
  showsVerticalScrollIndicator = false,
}) => {
  const theme = useUserStore((s) => s.theme);

  const backgroundColor = theme === "dark" ? "#0d0d0d" : "#F9FBFC";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        contentContainerStyle={[styles.scrollContent, style]}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default ScreenContainer;
