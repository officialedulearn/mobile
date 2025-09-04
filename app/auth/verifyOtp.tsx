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
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = {};

const verifyOtp = (props: Props) => {
  const { 
    email, 
    isSignUp, 
    name, 
    referralCode, 
    username,
    isReviewer
  } = useLocalSearchParams<{ 
    email: string;
    isSignUp?: string;
    name?: string;
    referralCode?: string;
    username?: string;
    isReviewer?: string;
  }>();
  
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [loadingText, setLoadingText] = useState("Verifying...");
  const { setUser } = useUserStore();
  const theme = useUserStore((state) => state.theme);

  useEffect(() => {
    if (isReviewer === "1" && email === "playreview@edulearn.com") {
      handleReviewerLogin();
    }
  }, [isReviewer, email]);

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

  const handleReviewerLogin = async () => {
    setLoading(true);
    setLoadingText("Authenticating reviewer account...");
    
    try {
      const userService = new UserService();
      
      if (isSignUp === "1") {
        setLoadingText("Creating reviewer account...");
        
        try {
          const userId = generateUUID();
          const newUser = await userService.createUser({
            id: userId,
            name: name || "Google Play Reviewer",
            email: email,
            referralCode: referralCode || "",
            username: username || "playreview",
          });
          await AsyncStorage.setItem('isReviewer', 'true');
          
          setUser(newUser);
          router.push("/auth/identity");
        } catch (createError) {
          console.error("Reviewer account creation failed:", createError);
          try {
            const userData = await userService.getUser(email);
            setUser(userData);
            
            router.push("/auth/welcome");
          } catch (getUserError) {
            Alert.alert(
              "Account Access Failed", 
              "Unable to access reviewer account. Please contact support."
            );
          }
        }
      } else {
        setLoadingText("Loading reviewer profile...");
        
        try {
          await AsyncStorage.setItem('isReviewer', 'true');
          const userData = await userService.getUser(email);
          setUser(userData);
          router.push("/auth/welcome");
        } catch (getUserError) {
          console.error("Get reviewer user failed:", getUserError);
          Alert.alert(
            "Profile Load Failed",
            "Unable to load reviewer profile. Please contact support."
          );
        }
      }
    } catch (error) {
      console.error("Reviewer login error:", error);
      Alert.alert(
        "Authentication Failed", 
        "Unable to authenticate reviewer account. Please contact support."
      );
    } finally {
      setLoading(false);
      setLoadingText("Verifying...");
    }
  };

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
    if (isReviewer === "1") {
      Alert.alert("Not Required", "No OTP needed for reviewer account");
      return;
    }

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
    if (isReviewer === "1") {
      Alert.alert("Not Required", "Authentication is automatic for reviewer account");
      return;
    }

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
    <View style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <View style={styles.topNav}>
        <BackButton />
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.boldText, theme === "dark" && { color: "#E0E0E0" }]}>
          {isReviewer === "1" ? "Authenticating..." : "Verify email address?"}
        </Text>
        <Text style={[styles.subtitle, theme === "dark" && { color: "#B3B3B3" }]}>
          {isReviewer === "1" 
            ? "Logging in Google Play reviewer account automatically..." 
            : `Enter the six digits code sent to your email address ${email}`
          }
        </Text>

        {isReviewer !== "1" && (
          <>
            <View style={styles.formContainer}>
              <Text style={[styles.inputLabel, theme === "dark" && { color: "#B3B3B3" }]}>Code</Text>
              <View style={[styles.inputContainer, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}>
                <TextInput
                  keyboardType="numeric"
                  style={[styles.input, theme === "dark" && { color: "#E0E0E0" }]}
                  placeholder="Enter OTP"
                  placeholderTextColor={theme === "dark" ? "#B3B3B3" : "#61728C"}
                  value={otp}
                  onChangeText={handleTextChange}
                  maxLength={6}
                />
              </View>
            </View>

            <Text style={[styles.expiryText, theme === "dark" && { color: "#B3B3B3" }]}>
              Code expires in <Text style={[styles.timerText, theme === "dark" && { color: "#E0E0E0" }]}>{formatTime()}</Text>
            </Text>

            <Text style={[styles.expiryText, theme === "dark" && { color: "#B3B3B3" }]}>
              Didn't receive a code? {" "}
              <Text 
                style={[
                  styles.timerText, 
                  theme === "dark" && { color: "#00FF80" },
                  (!canResend || resendLoading) && { opacity: 0.5 }
                ]}
                onPress={canResend && !resendLoading ? handleResendOtp : undefined}
              >
                {resendLoading ? "Resending..." : "Resend Code"}
              </Text>
            </Text>

            <TouchableOpacity
              style={[
                styles.signInButton, 
                theme === "dark" && { backgroundColor: "#00FF80" },
                loading && styles.disabledButton
              ]}
              onPress={() => handleSubmit()}
              disabled={loading}
            >
              <Text style={[styles.buttonText, theme === "dark" && { color: "#000" }]}>Submit</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Modal
        transparent={true}
        visible={loading}
        animationType="fade"
      >
        <View style={styles.loadingOverlay}>
          <View style={[styles.loaderContainer, theme === "dark" && { backgroundColor: "#131313" }]}>
            <ActivityIndicator size="large" color="#00FF80" />
            <Text style={[styles.loadingText, theme === "dark" && { color: "#E0E0E0" }]}>{loadingText}</Text>
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
  },
  topNav: {
    marginTop: 30,
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
    textAlign: "center",
    marginBottom: 8,
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
    marginTop: 30,
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
