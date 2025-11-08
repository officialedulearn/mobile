import { supabase } from "@/utils/supabase";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import useUserStore from "@/core/userState";
import { StatusBar } from "expo-status-bar";
import { Route } from "expo-router/build/Route";

const Auth = () => {
  const { signUp } = useLocalSearchParams<{ signUp: string }>();
  const theme = useUserStore((state) => state.theme);
  const scrollViewRef = useRef<ScrollView>(null);

  const [isSignUp, setIsSignUp] = useState(signUp === "1");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    referralCode: "",
    username: ""
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSignUp(signUp === "1");
  }, [signUp]);

  const handleChange = (field: string, value: string) => {
    let sanitizedValue = value;

    if (field === 'email') {
      sanitizedValue = value.trim().toLowerCase();
    } else if (field === 'username') {
      sanitizedValue = value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    } else if (field === 'referralCode') {
      sanitizedValue = value.trim().toUpperCase();
    }

    setFormData({ ...formData, [field]: sanitizedValue });
  };

  const handleInputFocus = (inputType: string) => {
    setTimeout(() => {
      if (scrollViewRef.current && inputType === 'username') {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      Alert.alert("Email Required", "Please enter your email address");
      return false;
    }

    if (!validateEmail(formData.email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address (e.g., user@example.com)");
      return false;
    }

    if (isSignUp) {
      if (!formData.name.trim()) {
        Alert.alert("Name Required", "Please enter your full name");
        return false;
      }

      if (formData.name.trim().length < 2) {
        Alert.alert("Invalid Name", "Name must be at least 2 characters long");
        return false;
      }

      if (!formData.username.trim()) {
        Alert.alert("Username Required", "Please enter your X username");
        return false;
      }

      if (formData.username.length < 3) {
        Alert.alert("Invalid Username", "Username must be at least 3 characters long");
        return false;
      }
    }

    return true;
  };

  const handleAuth = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      if (formData.email === "playreview@edulearn.com") {
        if (isSignUp) {
          router.push({
            pathname: '/auth/verifyOtp',
            params: {
              email: formData.email,
              isSignUp: "1",
              name: formData.name,
              referralCode: formData.referralCode || "",
              username: formData.username || "",
              isReviewer: "1"
            },
          });
        } else {
          router.push({
            pathname: '/auth/verifyOtp',
            params: {
              email: formData.email,
              isReviewer: "1"
            },
          });
        }
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
      });

      if (error) {
        if (error.message.includes('rate limit')) {
          Alert.alert("Too Many Attempts", "Please wait before requesting another code");
        } else if (error.message.includes('invalid email')) {
          Alert.alert("Invalid Email", "Please check your email address and try again");
        } else {
          Alert.alert("Authentication Error", error.message);
        }
        return;
      }

      if (isSignUp) {
        router.push({
          pathname: '/auth/verifyOtp',
          params: {
            email: formData.email,
            isSignUp: "1",
            name: formData.name,
            referralCode: formData.referralCode || "",
            username: formData.username
          },
        });
      } else {
        router.push({
          pathname: '/auth/verifyOtp',
          params: { email: formData.email },
        });
      }

    } catch (err) {
      console.error("Authentication error:", err);
      Alert.alert(
        "Connection Error",
        "Unable to connect to our servers. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, theme === "dark" && styles.containerDark]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        <View style={{ marginTop: 20, marginBottom: -10 }}>
          <TouchableOpacity
            style={[
              styles.backButton,
              theme === "dark" && {
                backgroundColor: "#131313",
                borderColor: "#2E3033",
              },
            ]}
            onPress={() => router.back()}
          >
            <Image 
              source={
                theme === "dark"
                  ? require("@/assets/images/icons/dark/CaretLeft.png")
                  : require("@/assets/images/icons/CaretLeft.png")
              } 
              style={styles.backButtonIcon} 
            />
          </TouchableOpacity>
        </View>
        <View style={styles.topNavigation}>
          <Image
            source={theme === "dark" ? require("@/assets/images/logo.png") : require("@/assets/images/LOGO-1.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.welcome, theme === "dark" && styles.welcomeDark]}>
            {isSignUp ? "Create account" : "Welcome back 👋"}
          </Text>
          <Text style={[styles.subtitle, theme === "dark" && styles.subtitleDark]}>
            {isSignUp
              ? "Sign up to begin your learning journey"
              : "Log in to continue your learning journey"}
          </Text>
        </View>

        <View style={styles.content}>
          {isSignUp && (
            <View style={[styles.inputContainer, theme === "dark" && styles.inputContainerDark]}>
              <TextInput
                style={[styles.input, theme === "dark" && styles.inputDark]}
                placeholder="Full Name"
                placeholderTextColor={theme === "dark" ? "#B3B3B3" : "#61728C"}
                value={formData.name}
                onChangeText={(text) => handleChange("name", text)}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                textContentType="name"
              />
            </View>
          )}

          <View style={[styles.inputContainer, theme === "dark" && styles.inputContainerDark]}>
            <TextInput
              style={[styles.input, theme === "dark" && styles.inputDark]}
              placeholder="Email"
              placeholderTextColor={theme === "dark" ? "#B3B3B3" : "#61728C"}
              value={formData.email}
              onChangeText={(text) => handleChange("email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              textContentType="emailAddress"
            />
            <Image
              source={theme === "dark" ? require("@/assets/images/icons/dark/mail.png") : require("@/assets/images/icons/mail.png")}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>

          {isSignUp && (
            <>
              <View style={[styles.inputContainer, theme === "dark" && styles.inputContainerDark]}>
                <TextInput
                  style={[styles.input, theme === "dark" && styles.inputDark]}
                  placeholder="Referral Code (Optional)"
                  placeholderTextColor={theme === "dark" ? "#B3B3B3" : "#61728C"}
                  value={formData.referralCode}
                  onChangeText={(text) => handleChange("referralCode", text)}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              <View style={[styles.inputContainer, theme === "dark" && styles.inputContainerDark]}>
                <TextInput
                  style={[styles.input, styles.usernameInput, theme === "dark" && styles.inputDark]}
                  placeholder="X username"
                  placeholderTextColor={theme === "dark" ? "#B3B3B3" : "#61728C"}
                  value={formData.username}
                  onChangeText={(text) => handleChange("username", text)}
                  onFocus={() => handleInputFocus("username")}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  textContentType="username"
                  
                />
              </View>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.signInButton,
              loading ? styles.disabledButton : null,
              theme === "dark" && styles.signInButtonDark
            ]}
            onPress={() => handleAuth()}
            disabled={loading}
          >
            <Text style={[styles.buttonText, theme === "dark" && styles.buttonTextDark]}>
              {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
            </Text>
          </TouchableOpacity>

          {isSignUp && (
            <View style={styles.privacyContainer}>
              <Text style={[styles.privacyText, theme === "dark" && styles.privacyTextDark]}>
                By signing up, you are agreeing to our{" "}
                <Text
                  style={[styles.privacyLink, theme === "dark" && styles.privacyLinkDark]}
                  onPress={() => {
                    Linking.openURL("https://support.edulearn.fun/privacy-policy");
                  }}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>
          )}
        </View>

        <View style={{ marginTop: 30, alignItems: "center", justifyContent: "center" }}>
          <Text style={[styles.subtitle, theme === "dark" && styles.subtitleDark]}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <Text
              onPress={() => setIsSignUp(!isSignUp)}
              style={[{ fontWeight: "700", textDecorationLine: "underline", lineHeight: 24 }, theme === "dark" ? { color: "#00FF80" } : { color: "#000" }]}
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
  },
  containerDark: {
    backgroundColor: "#0D0D0D",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    flexGrow: 1,
  },
  topNavigation: {
    marginBottom: 10,
  },
  logo: {
    width: 130,
    height: 160,
  },
  textContainer: {
    marginBottom: 40,
  },
  welcome: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Satoshi",
    color: "#2D3C52",
    marginBottom: 8,
  },
  welcomeDark: {
    color: "#E0E0E0",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#61728C",
    fontFamily: "Satoshi",
  },
  subtitleDark: {
    color: "#B3B3B3",
  },
  content: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDF3FC",
    borderRadius: 32,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  inputContainerDark: {
    backgroundColor: "#131313",
    borderColor: "#2E3033",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#2D3C52",
    fontFamily: "Satoshi",
  },
  inputDark: {
    color: "#E0E0E0",
  },
  icon: {
    width: 20,
    height: 20,
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  signInButton: {
    backgroundColor: "#000",
    width: "100%",
    borderRadius: 50,
    paddingVertical: 16,
    marginTop: 10,
  },
  signInButtonDark: {
    backgroundColor: "#00FF80",
  },
  buttonText: {
    color: "#00FF80",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },
  buttonTextDark: {
    color: "#000",
  },
  usernameInput: {
    color: "#2D3C52",
  },
  privacyContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  privacyText: {
    fontSize: 12,
    color: "#61728C",
    textAlign: "center",
  },
  privacyTextDark: {
    color: "#B3B3B3",
  },
  privacyLink: {
    fontWeight: "700",
    color: "#000",
  },
  privacyLinkDark: {
    color: "#00FF80",
  },
  backButton: {
    padding: 10,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#EDF3FC",
  },
  backButtonIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
});

export default Auth;
