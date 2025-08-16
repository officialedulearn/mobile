import React, { useState, useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, useAuthRequest, CodeChallengeMethod } from "expo-auth-session";
import httpClient from "../utils/httpClient";
import useUserStore from "../core/userState";

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URI = makeRedirectUri({
  scheme: "edulearnv2"
});
console.log("Twitter OAuth Redirect URI:", REDIRECT_URI);

const CLIENT_ID = process.env.EXPO_PUBLIC_TWITTER_CLIENT_ID || "";
console.log("Twitter Client ID available:", CLIENT_ID ? "Yes" : "No (empty)");

const discovery = {
  authorizationEndpoint: "https://twitter.com/i/oauth2/authorize",
  tokenEndpoint: "https://api.twitter.com/2/oauth2/token",
};

export default function ConnectX() {
  const [user, setUser] = useState<{id: string, name: string, username: string}>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useUserStore();

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      redirectUri: REDIRECT_URI,
      scopes: ["users.read", "tweet.read"],
      usePKCE: true,
      codeChallengeMethod: CodeChallengeMethod.S256,
    },
    discovery
  );

  useEffect(() => {
    if (request) {
      console.log("Auth request ready");
    } else {
      console.log("Auth request not ready or failed to initialize");
    }
  }, [request]);

  useEffect(() => {
    if (response) {
      console.log("Auth response received:", response.type);
      
      if (response.type === "error") {
        console.error("Auth response error:", response.error);
      }
    }
  }, [response]);

  useEffect(() => {
    const handleResponse = async () => {
      if (response?.type === "success" && response.params.code && currentUser?.email) {
        setIsLoading(true);
        console.log("Received authorization code, sending to backend...");
        
        try {
          const result = await httpClient.post("/twitter/callback", {
            data: {
              code: response.params.code,
              userEmail: currentUser.email,
              redirectUri: REDIRECT_URI 
            }
          });

          console.log("Backend response successful");
          setUser(result.data);
          setError(null);
        } catch (err: any) {
          console.error("Twitter API error:", err);
          // More detailed error reporting
          const errorMessage = err.response?.data?.message || 
                              err.message || 
                              "Failed to connect X account. Please try again.";
          
          console.error("Error details:", errorMessage);
          setError(errorMessage);
        } finally {
          setIsLoading(false);
        }
      } else if (response?.type === "error") {
        console.error("OAuth error response:", response.error);
        setError(`Authorization failed: ${response.error?.message || "Unknown error"}`);
      } else if (response?.type === "cancel") {
        console.log("User canceled the authentication");
        setError("Authentication was canceled");
      }
    };

    handleResponse();
  }, [response, currentUser]);

  const connectTwitter = async () => {
    setError(null);
    
    if (!CLIENT_ID) {
      setError("Twitter integration is not properly configured. Please contact support.");
      return;
    }
    
    try {
      console.log("Starting Twitter authentication...");
      const result = await promptAsync();
      console.log("Auth prompt result:", result.type);
    } catch (err: any) {
      console.error("Twitter auth error:", err);
      setError(err.message || "Failed to start authentication. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.connectButton, isLoading || !request ? styles.disabledButton : null]} 
        onPress={connectTwitter}
        disabled={isLoading || !request}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#00FF80" />
        ) : (
          <Text style={styles.connectButtonText}>Connect X Account</Text>
        )}
      </TouchableOpacity>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userHandle}>@{user.username}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    width: "100%",
  },
  connectButton: {
    backgroundColor: "#000000",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  connectButtonText: {
    color: "#00FF80",
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
  },
  disabledButton: {
    opacity: 0.7,
  },
  errorContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#FFF0F0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorText: {
    color: "#FF3B30",
    fontFamily: "Satoshi",
    fontSize: 14,
    marginBottom: 8,
  },
  dismissText: {
    color: "#2D3C52",
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
  },
  userInfo: {
    marginTop: 15,
    padding: 16,
    backgroundColor: "#F9FBFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EDF3FC",
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Satoshi",
    color: "#2D3C52",
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 14,
    color: "#61728C",
    fontFamily: "Satoshi",
  }
});
