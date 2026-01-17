import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import useUserStore from '@/core/userState';
import { Image } from 'expo-image';

WebBrowser.maybeCompleteAuthSession();

interface OAuthButtonsProps {
  onLoadingChange?: (loading: boolean) => void;
}

export default function OAuthButtons({ onLoadingChange }: OAuthButtonsProps) {
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const theme = useUserStore((state) => state.theme);

  const handleOAuthCallback = async (
    supabaseUser: any,
    provider: 'google' | 'apple',
    providerId: string
  ) => {
    const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
    
    try {
      console.log('Calling OAuth callback with:', { 
        supabaseUserId: supabaseUser.id, 
        email: supabaseUser.email,
        provider 
      });

      const response = await fetch(`${API_URL}/auth/oauth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUserId: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '',
          provider: provider,
          providerId: providerId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OAuth callback failed:', errorText);
        throw new Error('Failed to process OAuth callback');
      }

      const { user: backendUser, isNewUser, needsUsername } = await response.json();
      console.log('OAuth callback response:', { isNewUser, needsUsername });

      if (needsUsername) {
        console.log('User needs username, redirecting to setup...');
        router.push('/auth/setupUsername' as any);
      } else {
        console.log('User profile complete, setting user state...');
        await useUserStore.getState().setUserAsync();
        router.push('/(tabs)');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      Alert.alert('Error', 'Failed to complete authentication. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading('google');
    onLoadingChange?.(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'edulearnv2://auth/callback',
          skipBrowserRedirect: true,
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'edulearnv2://auth/callback'
        );

        if (result.type === 'success' && result.url) {
          const url = new URL(result.url);
          const accessToken = url.searchParams.get('access_token');
          const refreshToken = url.searchParams.get('refresh_token');

          if (accessToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (sessionError) {
              throw sessionError;
            }

            if (sessionData?.user) {
              await handleOAuthCallback(sessionData.user, 'google', sessionData.user.id);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      Alert.alert('Authentication Error', error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(null);
      onLoadingChange?.(false);
    }
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Apple Sign-In is only available on iOS');
      return;
    }

    setLoading('apple');
    onLoadingChange?.(true);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,

        });

        if (error) {
          console.error('Apple Sign-In Supabase error:', error);
          Alert.alert('Authentication Error', error.message);
          return;
        }

        if (data?.user) {
          await handleOAuthCallback(data.user, 'apple', credential.user);
        }
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        console.log('User canceled Apple Sign-In');
      } else {
        console.error('Apple Sign-In error:', e);
        Alert.alert('Error', 'Failed to sign in with Apple');
      }
    } finally {
      setLoading(null);
      onLoadingChange?.(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          styles.googleButton,
          isDark && styles.googleButtonDark,
          loading !== null && styles.buttonDisabled,
        ]}
        onPress={handleGoogleLogin}
        disabled={loading !== null}
      >
        {loading === 'google' ? (
          <ActivityIndicator size="small" color={isDark ? '#E0E0E0' : '#2D3C52'} />
        ) : (
          <GoogleIcon />
        )}
        <Text style={[styles.buttonText, isDark && styles.buttonTextDark]}>
          Google
        </Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={
            isDark
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={32}
          style={styles.appleButton}
          onPress={handleAppleLogin}
        />
      )}
    </View>
  );
}

function GoogleIcon() {
  return (
    <View style={styles.iconContainer}>
      <Image source={require('@/assets/images/icons/Google.png')} style={styles.googleIcon} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 32,
    gap: 12,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EDF3FC',
  },
  googleButtonDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#2E3033',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3C52',
    fontFamily: 'Satoshi-Regular',
  },
  buttonTextDark: {
    color: '#E0E0E0',
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 18,
    height: 18,
  }
});
