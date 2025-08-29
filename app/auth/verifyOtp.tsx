import BackButton from "@/components/backButton";
import useUserStore from "@/core/userState";
import { UserService } from "@/services/auth.service";
import { supabase } from "@/utils/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Alert,
} from "react-native";
import { generateUUID } from "@/utils/constants";

type Props = {};

const verifyOtp = (props: Props) => {
  const { 
    email, 
    isSignUp, 
    name, 
    referralCode, 
    username 
  } = useLocalSearchParams<{ 
    email: string;
    isSignUp?: string;
    name?: string;
    referralCode?: string;
    username?: string;
  }>();
  
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [loadingText, setLoadingText] = useState("Verifying...");
  const { setUser } = useUserStore();

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleTextChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    setOtp(numericValue);
  };

  const handleResendOtp = async () => {
    try {
      setResendLoading(true);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
      });

      if (error) {
        if (error.message.includes('rate limit')) {
          Alert.alert("Too Many Attempts", "Please wait before requesting another code");
        } else {
          Alert.alert("Resend Failed", "Unable to resend code. Please try again later.");
        }
        return;
      }

      setTimeLeft(30 * 60);
      setCanResend(false);
      Alert.alert("Code Sent", "A new verification code has been sent to your email");
      
    } catch (error) {
      console.error("Resend OTP error:", error);
      Alert.alert("Network Error", "Unable to resend code. Please check your connection.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (otp.length !== 6) {
      Alert.alert("Invalid Code", "Please enter the complete 6-digit verification code");
      return;
    }

    setLoading(true);
    setLoadingText("Verifying code...");
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: "email",
      });

      if (error) {
        console.error("OTP verification failed:", error.message);
        
        if (error.message.includes('expired')) {
          Alert.alert("Code Expired", "Your verification code has expired. Please request a new one.");
        } else if (error.message.includes('invalid')) {
          Alert.alert("Invalid Code", "The verification code you entered is incorrect. Please try again.");
        } else {
          Alert.alert("Verification Failed", "Unable to verify your code. Please try again.");
        }
        return;
      }

      if (data && data.user) {
        const userService = new UserService();
        if (isSignUp === "1") {
          setLoadingText("Creating your account...");
          
          try {
            const userId = generateUUID();
            const newUser = await userService.createUser({
              id: userId,
              name: name || "",
              email: email,
              referralCode: referralCode || "",
              username: username || "",
            });
            
            setUser(newUser);
            // Redirect new users to identity page first
            router.push("/auth/identity");
          } catch (createError) {
            console.error("User creation failed:", createError);
            Alert.alert(
              "Account Creation Failed", 
              "Your email was verified successfully, but we couldn't complete your account setup. Please contact support or try again."
            );
            return;
          }
        } else {
          setLoadingText("Loading your profile...");
          
          try {
            const userData = await userService.getUser(data.user.email || "");
            setUser(userData);
            // Redirect existing users directly to welcome page
            router.push("/auth/welcome");
          } catch (getUserError) {
            console.error("Get user failed:", getUserError);
            Alert.alert(
              "Profile Load Failed",
              "Unable to load your profile. Please try signing in again."
            );
            return;
          }
        }
      }
    } catch (error) {
      console.error("Error during OTP verification:", error);
      Alert.alert(
        "Connection Error", 
        "Unable to connect to our servers. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
      setLoadingText("Verifying...");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.topNav}>
        <BackButton />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.boldText}>Verify email address?</Text>
        <Text style={styles.subtitle}>
          Enter the six digits code sent to your email address {email}
        </Text>

        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Code</Text>
          <View style={styles.inputContainer}>
            <TextInput
              keyboardType="numeric"
              style={styles.input}
              placeholder="Enter OTP"
              placeholderTextColor="#61728C"
              value={otp}
              onChangeText={handleTextChange}
              maxLength={6}
            />
          </View>
        </View>

        <Text style={styles.expiryText}>
          Code expires in <Text style={styles.timerText}>{formatTime()}</Text>
        </Text>

        <Text style={styles.expiryText}>
          Didn't receive a code? {" "}
          <Text 
            style={[styles.timerText, (!canResend || resendLoading) && { opacity: 0.5 }]}
            onPress={canResend && !resendLoading ? handleResendOtp : undefined}
          >
            {resendLoading ? "Resending..." : "Resend Code"}
          </Text>
        </Text>

        <TouchableOpacity
          style={[styles.signInButton, loading && styles.disabledButton]}
          onPress={() => handleSubmit()}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent={true}
        visible={loading}
        animationType="fade"
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#00FF80" />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
    padding: 20,
    marginTop: 30,
  },
  topNav: {
    marginTop: 20,
    marginBottom: 30,
  },
  contentContainer: {
    paddingHorizontal: 4,
  },
  boldText: {
    fontFamily: "Satoshi",
    color: "#2D3C52",
    fontWeight: "700",
    fontSize: 28,
    lineHeight: 42,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "Satoshi",
    lineHeight: 24,
    fontWeight: "500",
    color: "#61728C",
    marginBottom: 30,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: "Satoshi",
    fontSize: 14,
    lineHeight: 24,
    fontWeight: "500",
    marginBottom: 8,
    color: "#2D3C52",
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
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#2D3C52",
    fontFamily: "Satoshi",
  },
  expiryText: {
    fontFamily: "Satoshi",
    fontSize: 14,
    color: "#61728C",
    marginTop: 10,
    alignContent: "center",
    alignItems: "center",
  },
  timerText: {
    fontWeight: "700",
    color: "#2D3C52",
  },
  signInButton: {
    backgroundColor: "#000",
    width: "100%",
    borderRadius: 50,
    paddingVertical: 16,
    marginTop: 10,
  },
  resendButton: {
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
  disabledButton: {
    opacity: 0.5,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  loaderContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#2D3C52",
    fontFamily: "Satoshi",
  },
});

export default verifyOtp;
