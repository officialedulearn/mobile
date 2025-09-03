import useUserStore from "@/core/userState";
import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Keyboard, Platform } from "react-native";

type Props = {};

const TabLayout = (props: Props) => {
  const theme = useUserStore(s => s.theme);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#00FF80",
        tabBarInactiveTintColor: "#777777",
        tabBarStyle: [
          {
            borderTopWidth: 0,
            elevation: 0,
            height: 70,
            paddingBottom: 15,
            paddingTop: 15,
            backgroundColor: theme === 'dark' ? '#131313' : "#FFF",
            borderColor: theme === 'dark' ? '#131313' : "#FFF",
            borderWidth: 1,
          },
          isKeyboardVisible && {
            display: 'none',
          }
        ],
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
              source={theme === 'dark' ? require("@/assets/images/icons/dark/home.png") : require("@/assets/images/icons/home.png")}
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
              source={theme === 'dark' ? require("@/assets/images/icons/dark/brain2.png") : require("@/assets/images/icons/brain2.png")}
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
              source={theme === 'dark' ? require("@/assets/images/icons/dark/gift.png") : require("@/assets/images/icons/gift.png")}
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
              source={theme === 'dark' ? require("@/assets/images/icons/dark/user.png") : require("@/assets/images/icons/user.png")}
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
    width: 20,
    height: 20,
  },
  chatIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  }
});
