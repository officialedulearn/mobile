import { supabase } from "@/utils/supabase";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Auth = () => {
  const { signUp } = useLocalSearchParams<{ signUp: string }>();
  
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
    } else if (field === 'name') {
      sanitizedValue = value.trim();
    } else if (field === 'username') {
      sanitizedValue = value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    } else if (field === 'referralCode') {
      sanitizedValue = value.trim().toUpperCase();
    }
    
    setFormData({ ...formData, [field]: sanitizedValue });
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

      if (formData.username && formData.username.length > 0 && formData.username.length < 3) {
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
            username: formData.username || ""
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
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.topNavigation}>
        <Image
          source={require("@/assets/images/LOGO-1.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.welcome}>
          {isSignUp ? "Create account" : "Welcome back"}
        </Text>
        <Text style={styles.subtitle}>
          {isSignUp
            ? "Sign up to begin your learning journey"
            : "Log in to continue your learning journey"}
        </Text>
      </View>

      <View style={styles.content}>
        {isSignUp && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#61728C"
              value={formData.name}
              onChangeText={(text) => handleChange("name", text)}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#61728C"
            value={formData.email}
            onChangeText={(text) => handleChange("email", text)}
          />
          <Image
            source={require("@/assets/images/icons/mail.png")}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        {/* <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#61728C"
            secureTextEntry
            value={formData.password}
            onChangeText={(text) => handleChange("password", text)}
          />
          <Image
            source={require("@/assets/images/icons/eye.png")}
            style={styles.icon}
            resizeMode="contain"
          />
        </View> */}

        {isSignUp && (
          <>
            <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Referral Code (Optional)"
              placeholderTextColor="#61728C"
              value={formData.referralCode}
              onChangeText={(text) => handleChange("referralCode", text)}
            />
          </View>
            <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="X username"
              placeholderTextColor="#61728C"
              value={formData.username}
              onChangeText={(text) => handleChange("username", text)}
            />
          </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.signInButton, loading ? styles.disabledButton : null]}
          onPress={() => handleAuth()}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 30, alignItems: "flex-start" }}>
        <Text style={styles.subtitle}>
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <Text
            onPress={() => setIsSignUp(!isSignUp)}
            style={{ color: "#000", fontWeight: "700" }}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
    paddingHorizontal: 24,
    paddingTop: 40,
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
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#61728C",
    fontFamily: "Satoshi",
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
  input: {
    flex: 1,
    fontSize: 16,
    color: "#2D3C52",
    fontFamily: "Satoshi",
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
  buttonText: {
    color: "#00FF80",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },
});

export default Auth;
