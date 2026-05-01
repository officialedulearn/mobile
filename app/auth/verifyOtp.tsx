import OtpCodeInput from "@/components/auth/OtpCodeInput";
import BackButton from "@/components/common/backButton";
import ScreenLoader from "@/components/common/ScreenLoader";
import useUserStore from "@/core/userState";
import { UserService } from "@/services/auth.service";
import { NotificationService } from "@/services/notification.service";
import { generateUUID } from "@/utils/constants";
import { supabase } from "@/utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = Record<string, never>;

function maskEmailHint(email: string) {
  if (!email) return "";
  const at = email.indexOf("@");
  if (at <= 0) return email;
  const user = email.slice(0, at);
  const domain = email.slice(at + 1);
  const head = user.slice(0, Math.min(2, user.length));
  return `${head}•••••@${domain}`;
}

const VerifyOtp = (_props: Props) => {
  const { 
    email, 
    isSignUp, 
    name, 
    referralCode, 
    username,
    isReviewer,
    isLogin
  } = useLocalSearchParams<{ 
    email: string;
    isSignUp?: string;
    name?: string;
    referralCode?: string;
    username?: string;
    isReviewer?: string;
    isLogin?: string;
  }>();
  
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(2 * 60);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [loadingText, setLoadingText] = useState("Verifying...");
  const autoSubmitLock = useRef(false);
  const handleSubmitRef = useRef<() => Promise<void>>(async () => {});
  const { setUser } = useUserStore();
  const theme = useUserStore((state) => state.theme);

  useEffect(() => {
    if (otp.length < 6) autoSubmitLock.current = false;
  }, [otp]);

  useEffect(() => {
    if (isReviewer === "1" && email === "playreview@edulearn.com") {
      handleReviewerLogin();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          Alert.alert(
            "Profile Load Failed",
            "Unable to load reviewer profile. Please contact support."
          );
        }
      }
    } catch (error) {
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

      setTimeLeft(2 * 60);
      setCanResend(false);
      Alert.alert("Code Sent", "A new verification code has been sent to your email");
      NotificationService.scheduleNotification("New Verification Code", "A new verification code has been sent to your email", {
        screen: "verifyOtp",
        email: email,
      });
    } catch (error) {
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

    if (loading) return;

    if (otp.length !== 6) {
      Alert.alert("Invalid Code", "Please enter the complete 6-digit verification code");
      return;
    }

    setLoading(true);
    setLoadingText("Verifying your OTP...");
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: "email",
      });

      if (error) {
        
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
        setLoadingText("Loading your profile...");
        
        try {
          const userService = new UserService();
          const userData = await userService.getUser(data.user.email || "");
          
          if (!userData) {
            Alert.alert(
              "User Not Found",
              "Unable to find your account. Please contact support."
            );
            return;
          }
          
          setUser(userData);
          
          if (isLogin === "0") {
            NotificationService.scheduleNotification(
              "Welcome to EduLearn!", 
              "Account verified successfully! Let&apos;s set up your profile.", 
              {
                screen: "identity",
                email: email,
              }
            );
            router.push("/auth/identity");
          } else {
            NotificationService.scheduleNotification(
              "Welcome Back!", 
              "You&apos;re all set up and ready to continue learning.", 
              {
                screen: "welcome",
                email: email,
              }
            );
            router.push("/auth/welcome");
          }
        } catch (getUserError: any) {
          const errorMessage = getUserError?.response?.data?.message || getUserError?.message || "Unknown error";
          Alert.alert(
            "Login Failed",
            `Error: ${errorMessage}\n\nPlease try again or contact support.`
          );
        }
      }
    } catch (error) {
      Alert.alert(
        "Connection Error", 
        "Unable to connect to our servers. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
      setLoadingText("Verifying...");
    }
  };

  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (isReviewer === "1") return;
    if (otp.length !== 6 || loading || autoSubmitLock.current) return;
    autoSubmitLock.current = true;
    const t = setTimeout(() => {
      void handleSubmitRef.current();
    }, 240);
    return () => clearTimeout(t);
  }, [otp, loading, isReviewer]);

  return (
    <View style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <View style={styles.topNav}>
        <BackButton />
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.boldText, theme === "dark" && { color: "#E0E0E0" }]}>
          {isReviewer === "1" ? "Authenticating..." : "Verify account with OTP"}
        </Text>
        <Text style={[styles.subtitle, theme === "dark" && { color: "#B3B3B3" }]}>
          {isReviewer === "1"
            ? "Logging in Google Play reviewer account automatically..."
            : `We've sent a 6-digit code to ${maskEmailHint(email || "")}`}
        </Text>

        {isReviewer !== "1" && (
          <>
            <View style={styles.formContainer}>
              <OtpCodeInput
                value={otp}
                onChange={setOtp}
                theme={theme === "dark" ? "dark" : "light"}
                editable={!loading}
                autoFocus
              />
            </View>

            {loading ? (
              <Text style={[styles.verifyHint, theme === "dark" && styles.verifyHintDark]}>
                Verifying your OTP…
              </Text>
            ) : null}

            <Text style={[styles.expiryText, theme === "dark" && { color: "#B3B3B3" }]}>
              Code expires in <Text style={[styles.timerText, theme === "dark" && { color: "#E0E0E0" }]}>{formatTime()}</Text>
            </Text>

            <View style={styles.resendContainer}>
              <Text style={[styles.expiryText, theme === "dark" && { color: "#B3B3B3" }]}>
                Didn&apos;t receive a code?{" "}
              </Text>
              <TouchableOpacity 
                onPress={handleResendOtp}
                disabled={!canResend || resendLoading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text 
                  style={[
                    styles.resendText, 
                    theme === "dark" && { color: "#00FF80" },
                    (!canResend || resendLoading) && { opacity: 0.5 }
                  ]}
                >
                  {resendLoading ? "Resending..." : "Resend Code"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.signInButton, 
                theme === "dark" && { backgroundColor: "#00FF80" },
                loading && styles.disabledButton
              ]}
              onPress={() => handleSubmit()}
              disabled={loading}
            >
              <Text style={[styles.buttonText, theme === "dark" && styles.buttonTextDark]}>
                Submit
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ScreenLoader visible={loading} message={loadingText} />
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
    fontFamily: "Satoshi-Regular",
    color: "#2D3C52",
    fontWeight: "700",
    fontSize: 28,
    lineHeight: 42,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "Satoshi-Regular",
    lineHeight: 24,
    fontWeight: "500",
    color: "#61728C",
    marginBottom: 30,
  },
  formContainer: {
    marginBottom: 8,
  },
  verifyHint: {
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    color: "#61728C",
    textAlign: "center",
    marginBottom: 16,
  },
  verifyHintDark: {
    color: "#94A3B8",
  },
  expiryText: {
    fontFamily: "Satoshi-Regular",
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
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  resendText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    color: "#2D3C52",
    textDecorationLine: "underline",
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
    fontFamily: "Satoshi-Medium",
    textAlign: "center",
    fontSize: 16,
  },
  buttonTextDark: {
    color: "#000",
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default VerifyOtp;
