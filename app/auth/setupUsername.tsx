import BackButton from "@/components/backButton";
import useUserStore from "@/core/userState";
import { supabase } from "@/utils/supabase";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

export default function SetupUsername() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const theme = useUserStore((state) => state.theme);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (username.length < 3) {
      setIsAvailable(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setChecking(true);
      try {
        const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
        const response = await fetch(`${API_URL}auth/check-availability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });
        const data = await response.json();
        setIsAvailable(data.usernameAvailable);
      } catch (error) {
        console.error('Availability check error:', error);
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const sanitizeUsername = (value: string): string => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .substring(0, 30);
  };

  const handleSubmit = async () => {
    if (username.length < 3) {
      Alert.alert('Username too short', 'Username must be at least 3 characters');
      return;
    }

    if (!isAvailable) {
      Alert.alert('Username unavailable', 'Please choose a different username');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();

      if (!user) {
        Alert.alert('Session expired', 'Please sign in again');
        router.push('/auth');
        return;
      }

      console.log('Submitting username:', username, 'for user:', user.id);

      const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
      const requestBody = {
        userId: user.id,
        username: username
      };

      console.log('API URL:', `${API_URL}/auth/complete-profile`);
      console.log('Request body:', requestBody);

      const response = await fetch(`${API_URL}/auth/complete-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const responseData = await response.json();
      console.log('Success response:', responseData);

      await useUserStore.getState().setUserAsync();

      Alert.alert('Success', 'Profile updated successfully!');
      router.push('/auth/identity');
    } catch (error: any) {
      console.error('Username submission error:', error);
      Alert.alert('Update failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <KeyboardAvoidingView
      style={[styles.container, isDark && styles.containerDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topNav}>
          <BackButton />
        </View>

        <View style={styles.contentContainer}>
          <Text style={[styles.boldText, isDark && styles.boldTextDark]}>
            Complete Your Profile
          </Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            Add your X (Twitter) username to continue
          </Text>

          <View style={styles.formContainer}>
            <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
              X Username
            </Text>
            <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
              <Text style={[styles.atSymbol, isDark && styles.atSymbolDark]}>@</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="username"
                placeholderTextColor={isDark ? '#B3B3B3' : '#61728C'}
                value={username}
                onChangeText={(text) => setUsername(sanitizeUsername(text))}
                maxLength={30}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
              <View style={styles.statusIcon}>
                {checking && (
                  <ActivityIndicator size="small" color={isDark ? '#B3B3B3' : '#61728C'} />
                )}
                {!checking && isAvailable === true && (
                  <Text style={styles.checkIcon}>✓</Text>
                )}
                {!checking && isAvailable === false && (
                  <Text style={styles.crossIcon}>✕</Text>
                )}
              </View>
            </View>

            {username.length > 0 && username.length < 3 && (
              <Text style={[styles.hintText, isDark && styles.hintTextDark]}>
                Username must be at least 3 characters
              </Text>
            )}
            {isAvailable === false && (
              <Text style={styles.errorText}>
                This username is already taken
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isDark && styles.submitButtonDark,
              (loading || !isAvailable || username.length < 3) && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={loading || !isAvailable || username.length < 3}
          >
            {loading ? (
              <ActivityIndicator size="small" color={isDark ? '#000' : '#00FF80'} />
            ) : (
              <Text style={[styles.buttonText, isDark && styles.buttonTextDark]}>
                Continue
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBFC',
  },
  containerDark: {
    backgroundColor: '#0D0D0D',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
    flexGrow: 1,
  },
  topNav: {
    marginBottom: 30,
    marginTop: 50,
  },
  contentContainer: {
    paddingHorizontal: 4,
  },
  boldText: {
    fontFamily: 'Satoshi-Regular',
    color: '#2D3C52',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 42,
    marginBottom: 12,
  },
  boldTextDark: {
    color: '#E0E0E0',
  },
  subtitle: {
    fontFamily: 'Satoshi-Regular',
    lineHeight: 24,
    fontWeight: '500',
    color: '#61728C',
    marginBottom: 30,
  },
  subtitleDark: {
    color: '#B3B3B3',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 8,
    color: '#2D3C52',
  },
  inputLabelDark: {
    color: '#B3B3B3',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDF3FC',
    borderRadius: 32,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  inputContainerDark: {
    backgroundColor: '#131313',
    borderColor: '#2E3033',
  },
  atSymbol: {
    fontSize: 16,
    color: '#61728C',
    marginRight: 4,
    fontFamily: 'Satoshi-Regular',
  },
  atSymbolDark: {
    color: '#B3B3B3',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2D3C52',
    fontFamily: 'Satoshi-Regular',
  },
  inputDark: {
    color: '#E0E0E0',
  },
  statusIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 18,
    color: '#00FF80',
    fontWeight: 'bold',
  },
  crossIcon: {
    fontSize: 18,
    color: '#FF4444',
    fontWeight: 'bold',
  },
  hintText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#61728C',
    marginTop: 8,
    marginLeft: 16,
  },
  hintTextDark: {
    color: '#B3B3B3',
  },
  errorText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#FF4444',
    marginTop: 8,
    marginLeft: 16,
  },
  submitButton: {
    backgroundColor: '#000',
    width: '100%',
    borderRadius: 50,
    paddingVertical: 16,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDark: {
    backgroundColor: '#00FF80',
  },
  buttonText: {
    color: '#00FF80',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
  buttonTextDark: {
    color: '#000',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
