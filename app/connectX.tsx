import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import BackButton from "@/components/backButton";
import ConnectX from "@/components/ConnectX";

export default function ConnectXPage() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerText}>Connect X Account</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Connect Your X Account</Text>
        
        <Text style={styles.description}>
          Link your X (Twitter) account to share achievements, participate in social challenges, and earn additional rewards.
        </Text>
        
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Benefits:</Text>
          <View style={styles.benefit}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.benefitText}>Share your achievements automatically</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.benefitText}>Earn XP for social engagement</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.benefitText}>Participate in exclusive social challenges</Text>
          </View>
          <View style={styles.benefit}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.benefitText}>Get notified about special events</Text>
          </View>
        </View>
        
        <ConnectX />
        
        <Text style={styles.disclaimer}>
          We will never post to your account without your permission. You can disconnect your account at any time.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
  },
  headerText: {
    color: "#2D3C52",
    fontFamily: "Satoshi",
    fontSize: 20,
    fontWeight: "500",
    lineHeight: 24,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    color: "#2D3C52",
    fontFamily: "Satoshi",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    marginBottom: 16,
  },
  description: {
    color: "#61728C",
    fontFamily: "Satoshi",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  benefitsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#EDF3FC",
  },
  benefitsTitle: {
    color: "#2D3C52",
    fontFamily: "Satoshi",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  benefit: {
    flexDirection: "row",
    marginBottom: 8,
  },
  bulletPoint: {
    color: "#00FF80",
    fontSize: 18,
    marginRight: 8,
  },
  benefitText: {
    color: "#2D3C52",
    fontFamily: "Satoshi",
    fontSize: 16,
    lineHeight: 24,
  },
  disclaimer: {
    color: "#61728C",
    fontFamily: "Satoshi",
    fontSize: 14,
    textAlign: "center",
    marginTop: 24,
  },
});