import { Tabs } from "expo-router";
import React from "react";
import { Image, StyleSheet } from "react-native";

type Props = {};

const TabLayout = (props: Props) => {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#00FF80",
        tabBarInactiveTintColor: "#777777",
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          height: 70,
          paddingBottom: 15,
          paddingTop: 15
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
          fontFamily: "Satoshi",
        },
        headerShown: false,
        tabBarShowLabel: true,
        tabBarItemStyle: {
          backgroundColor: "transparent",
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/images/icons/home.png")}
              style={[styles.tabIcon, { tintColor: color }]}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="quizzes"
        options={{
          title: "Quizzes",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/images/icons/brain2.png")}
              style={[styles.tabIcon, { tintColor: color }]}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        
        options={{
          title: "", 
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("@/assets/images/icons/Button.png")}
              style={styles.chatIcon}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="rewards"
        options={{
          title: "Rewards",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/images/icons/gift.png")}
              style={[styles.tabIcon, { tintColor: color }]}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/images/icons/user.png")}
              style={[styles.tabIcon, { tintColor: color }]}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabLayout;

const styles = StyleSheet.create({
  tabIcon: {
    width: 30,
    height: 30,
  },
  chatIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  }
});
