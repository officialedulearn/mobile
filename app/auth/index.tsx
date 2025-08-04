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
import { UserService } from "../../services/auth.service";
import { generateUUID } from "../../utils/constants";

const userService = new UserService();
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
    setFormData({ ...formData, [field]: value });
  };

  const handleAuth = async () => {
    try {
      console.log("Form Data:", formData);
      if (isSignUp) {
        setLoading(true);
        if (!formData.email || !formData.email.includes("@")) {
          Alert.alert("Please enter a valid email address");
          setLoading(false);
          return;
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.signInWithOtp({
          email: formData.email,
        });

        if (error) {
          Alert.alert("Authentication Error", error.message);
          setLoading(false);
          return;
        }

        try {
          await userService.createUser({
            id: generateUUID(),
            email: formData.email,
            name: formData.name || "User", 
            referredBy: formData.referralCode,
            username: formData.username
          });
        } catch (userCreateError: any) {
          console.error("Error creating user:", userCreateError);
          
          if (userCreateError?.message?.includes('timeout') || 
              userCreateError?.message?.includes('Network Error') ||
              userCreateError?.code === 'ECONNABORTED') {
            Alert.alert(
              "Warning",
              "Your account is being created, but some features may be limited until you reconnect to the network.",
              [{ text: "OK" }]
            );
          }
        }

        router.push({
          pathname: '/auth/verifyOtp',
          params: { email: formData.email },
        });
      } else {
        setLoading(true);
        
        if (!formData.email || !formData.email.includes("@")) {
          Alert.alert("Please enter a valid email address");
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase.auth.signInWithOtp({
          email: formData.email,
        });

        if (error) {
          Alert.alert("Authentication Error", error.message);
          setLoading(false);
          return;
        }
        
        router.push({
          pathname: '/auth/verifyOtp',
          params: { email: formData.email },
        });
      }
    } catch (err) {
      console.error("Authentication error:", err);
      Alert.alert(
        "Network Error",
        "Unable to connect to the authentication service. Please check your internet connection and try again."
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
