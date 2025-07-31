import BackButton from "@/components/backButton";
import useUserStore from "@/core/userState";
import { UserService } from "@/services/auth.service";
import { supabase } from "@/utils/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {};

const verifyOtp = (props: Props) => {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const { setUser } = useUserStore();

  useEffect(() => {
    if (timeLeft <= 0) return;

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

  const handleSubmit = async () => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: "email",
      });

      if (error) {
        console.error("OTP verification failed:", error.message);
        alert("Verification failed: " + error.message);
        return;
      }

      if (data && data.user) {
        const userService = new UserService();
        const userData = await userService.getUser(data.user.email || "");

        setUser(userData);

        router.push("/auth/welcome");
      }
    } catch (error) {
      console.error("Error during OTP verification:", error);
      alert("An error occurred during verification. Please try again.");
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

        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => handleSubmit()}
        >
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>
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
  buttonText: {
    color: "#00FF80",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },
});

export default verifyOtp;
