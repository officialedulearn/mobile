import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Image,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Modal from 'react-native-modal';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import BackButton from '@/components/backButton';
import Toast, { ToastType } from '@/components/Toast';
import SolanaQR from '@/components/SolanaQR';
import useUserStore from '@/core/userState';
import { WalletService, DeviceInfo } from '@/services/wallet.service';
import { UserService } from '@/services/auth.service';
import { generateUUID } from '@/utils/constants';

const getHighQualityImageUrl = (url: string | null | undefined): string | undefined => {
  if (!url || typeof url !== 'string') return undefined;
  return url
    .replace(/_normal(\.[a-z]+)$/i, '_400x400$1')
    .replace(/_mini(\.[a-z]+)$/i, '_400x400$1')
    .replace(/_bigger(\.[a-z]+)$/i, '_400x400$1');
};

const walletService = new WalletService();
const userService = new UserService();

function Wallet() {
  const { user, theme } = useUserStore();
  const { width } = useWindowDimensions();
  
  const [solBalance, setSolBalance] = useState(0);
  const [edlnBalance, setEdlnBalance] = useState(0);
  const [prices, setPrices] = useState({ SOL: 0, EDLN: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [isBuyModalVisible, setBuyModalVisible] = useState(false);
  const [buyAmount, setBuyAmount] = useState('');
  const [buySuccessModalVisible, setBuySuccessModalVisible] = useState(false);
  const [transactionLink, setTransactionLink] = useState<string>('');
  const [isBuying, setIsBuying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [buyMethod, setBuyMethod] = useState<'sol' | 'cash' | null>(null);
  const [purchaseType, setPurchaseType] = useState<'edln' | 'sol' | null>(null);
  const [onrampStep, setOnrampStep] = useState<'method' | 'otp' | 'payment'>('method');
  const [otp, setOtp] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [isProcessingOnramp, setIsProcessingOnramp] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{
    id: string;
    accountNumber: string;
    accountName: string;
    fiatAmount: number;
    bank: string;
  } | null>(null);
  const [onrampSuccessModalVisible, setOnrampSuccessModalVisible] = useState(false);
  const completedEventIdsRef = useRef<Set<string>>(new Set());
  const [completedTransactionDetails, setCompletedTransactionDetails] = useState<{
    amount: number;
    fiatAmount: number;
    currency: string;
    signature?: string;
  } | null>(null);
  
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<ToastType>('error');
  const [toastMessage, setToastMessage] = useState('');
  
  const [isBurning, setIsBurning] = useState(false);
  const [burningAmount, setBurningAmount] = useState<number | null>(null);
  const [burnSuccessModalVisible, setBurnSuccessModalVisible] = useState(false);
  const [activeTokenUtilIndex, setActiveTokenUtilIndex] = useState(0);

  useEffect(() => {
    const loadStoredToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('onramp_verified_token');
        if (storedToken) {
          setVerifiedToken(JSON.parse(storedToken));
        }
      } catch (e) {
        console.error('Failed to parse stored token:', e);
        await AsyncStorage.removeItem('onramp_verified_token');
      }
    };
    loadStoredToken();
  }, []);

  const netWorth = useMemo(() => {
    return (edlnBalance * prices.EDLN) + (solBalance * prices.SOL);
  }, [edlnBalance, prices.EDLN, solBalance, prices.SOL]);

  const solValue = useMemo(() => {
    return solBalance * prices.SOL;
  }, [solBalance, prices.SOL]);

  const edlnValue = useMemo(() => {
    return edlnBalance * prices.EDLN;
  }, [edlnBalance, prices.EDLN]);

  const showToast = (type: ToastType, message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  useEffect(() => {
    const fillUpBalances = async () => {
      if (!user?.address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [balance, priceData] = await Promise.all([
          walletService.getBalance(user.address),
          walletService.getPrices()
        ]);

        setSolBalance(balance.sol);
        setEdlnBalance(balance.tokenAccount || 0);
        setPrices(prevPrices => {
          if (prevPrices.SOL === priceData.SOL && prevPrices.EDLN === priceData.EDLN) {
            return prevPrices;
          }
          return priceData;
        });
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err?.message || 'Failed to fetch wallet data';
        setError(errorMsg);
        showToast('error', errorMsg);
        console.error('Error fetching wallet data:', err);
      } finally {
        setLoading(false);
      }
    };

    fillUpBalances();
  }, [user?.address]);

  useEffect(() => {
    if (!user?.address) return;

    const address = user.address;
    let isMounted = true;

    const checkWebhookUpdates = async () => {
      if (!address || !isMounted) return;
      
      try {
        const result = await walletService.getPendingWebhookEvents(address);
        
        if (!isMounted) return;
        
        if (result.hasUpdates && result.events.length > 0) {
          const completedEvents = result.events.filter(
            event => (event.status === 'COMPLETED' || event.status === 'PAID') && 
                     !completedEventIdsRef.current.has(event.id)
          );
          
          if (completedEvents.length > 0 && isMounted) {
            console.log('Webhook updates detected, refreshing balance...');
            
            const [balance, priceData] = await Promise.all([
              walletService.getBalance(address),
              walletService.getPrices()
            ]);

            if (!isMounted) return;

            setSolBalance(prev => {
              const newBalance = balance.sol;
              return Math.abs(prev - newBalance) > 0.0001 ? newBalance : prev;
            });
            setEdlnBalance(prev => {
              const newBalance = balance.tokenAccount || 0;
              return Math.abs(prev - newBalance) > 0.0001 ? newBalance : prev;
            });
            setPrices(prevPrices => {
              if (prevPrices.SOL === priceData.SOL && prevPrices.EDLN === priceData.EDLN) {
                return prevPrices;
              }
              return priceData;
            });
            
            const firstCompletedEvent = completedEvents[0];
            
            setCompletedTransactionDetails({
              amount: firstCompletedEvent.amount,
              fiatAmount: firstCompletedEvent.fiatAmount,
              currency: firstCompletedEvent.currency,
              signature: firstCompletedEvent.signature
            });
            
            completedEvents.forEach(event => {
              completedEventIdsRef.current.add(event.id);
            });
            setBuyModalVisible(false);
            showToast('success', `Transaction completed! Your ${firstCompletedEvent.currency} has been credited.`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            for (const event of completedEvents) {
              await walletService.clearWebhookEvent(address, event.id);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error checking webhook updates:', err);
        }
      }
    };

    const interval = setInterval(checkWebhookUpdates, 5000);
    
    checkWebhookUpdates();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user?.address]);

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopied(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('error', 'Failed to copy to clipboard');
    }
  };

  const toggleBuyModal = () => {
    setBuyModalVisible(!isBuyModalVisible);
    if (!isBuyModalVisible) {
      setBuyAmount('');
      setBuyMethod(null);
      setPurchaseType(null);
      setOnrampStep('method');
      setOtp('');
      setCashAmount('');
      setPaymentDetails(null);
    }
  };

  const getDeviceInfo = (): DeviceInfo => {
    return {
      uuid: generateUUID(),
      device: Device.modelName || Device.deviceName || 'Unknown',
      os: Platform.OS,
      browser: Platform.OS === 'ios' ? 'Safari' : 'Chrome',
      ip: '0.0.0.0'
    };
  };

  const handleInitiateOnramp = async () => {
    try {
      setIsProcessingOnramp(true);
      
      if (verifiedToken) {
        setOnrampStep('otp');
        setIsProcessingOnramp(false);
        return;
      }
      
      await walletService.initiateOnramp(user?.id || '');
      setOnrampStep('otp');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to initiate purchase';
      showToast('error', errorMsg);
    } finally {
      setIsProcessingOnramp(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setIsProcessingOnramp(true);

      const amount = parseFloat(cashAmount);
      if (isNaN(amount) || amount <= 0) {
        showToast('error', 'Please enter a valid amount');
        setIsProcessingOnramp(false);
        return;
      }

      let tokenToUse = verifiedToken;

      if (!verifiedToken) {
        if (!otp || otp.length < 4) {
          showToast('error', 'Please enter a valid OTP');
          setIsProcessingOnramp(false);
          return;
        }

        const deviceInfo = getDeviceInfo();
        const verifiedResponse = await walletService.verifyOnramp(user?.email || '', otp, deviceInfo);
        
        tokenToUse = verifiedResponse.verifiedResponse as string;
        setVerifiedToken(tokenToUse);
        await AsyncStorage.setItem('onramp_verified_token', JSON.stringify(tokenToUse));
      }
      
      const order = purchaseType === 'sol' 
        ? await walletService.onrampFiatToSol(
            user?.id || '',
            amount,
            tokenToUse
          )
        : await walletService.onrampFiatToEdln(
            user?.id || '',
            amount,
            tokenToUse
          );

      if (order?.order) {
        setPaymentDetails({
          id: order.order.id || '',
          accountNumber: order.order.accountNumber || '',
          accountName: order.order.accountName || '',
          fiatAmount: order.order.fiatAmount || 0,
          bank: order.order.bank || ''
        });
        setOnrampStep('payment');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        throw new Error('Invalid order response');
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to verify OTP';
      showToast('error', errorMsg);
    } finally {
      setIsProcessingOnramp(false);
    }
  };

  const refreshBalance = async () => {
    if (!user?.address) return;
    
    try {
      setIsRefreshing(true);
      const [balance, priceData] = await Promise.all([
        walletService.getBalance(user.address),
        walletService.getPrices()
      ]);

      setSolBalance(balance.sol);
      setEdlnBalance(balance.tokenAccount || 0);
      setPrices(priceData);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to refresh balance';
      showToast('error', errorMsg);
      console.error('Error refreshing balance:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBuyEDLN = async () => {
    try {
      setIsBuying(true);
      const amount = parseFloat(buyAmount);
      if (isNaN(amount) || amount <= 0) {
        showToast('error', 'Please enter a valid amount');
        setIsBuying(false);
        return;
      }

      if (amount > solBalance) {
        showToast('error', 'Insufficient SOL balance');
        setIsBuying(false);
        return;
      }

      const result = await walletService.swapSolToEDLN(user?.id || '', amount);
      console.log(`Successfully bought EDLN with ${amount} SOL`);
      
      setTransactionLink(result.response || '');
      
      setIsBuying(false);
      toggleBuyModal();
      
      showToast('success', 'EDLN purchased successfully!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      await refreshBalance();
      
      setTimeout(async () => {
        await refreshBalance();
      }, 5000);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to complete purchase';
      showToast('error', errorMsg);
      setIsBuying(false);
    }
  };

  const getCreditsFromBurnAmount = (amount: number): number => {
    switch(amount) {
      case 1000:
        return 3;
      case 5000:
        return 10;
      case 10000:
        return 20;
      default:
        return 0;
    }
  };

  const handleBurnTokens = async (burnAmount: number) => {
    try {
      setIsBurning(true);
      setBurningAmount(burnAmount);
      await walletService.burnEDLN(user?.id || '', burnAmount);
      const credits = getCreditsFromBurnAmount(burnAmount);
      await userService.incrementCredits(user?.id || '', credits);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refreshBalance();
      
      setTimeout(async () => {
        await refreshBalance();
      }, 2000);
      
      setIsBurning(false);
      setBurningAmount(null);
      showToast('success', `Tokens burned! You received ${credits} credits.`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to burn tokens';
      showToast('error', errorMsg);
      setIsBurning(false);
      setBurningAmount(null);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatTokenAmount = (value: number, decimals: number = 4) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals
    });
  };

  const getModalTitle = () => {
    if (buyMethod === null && purchaseType === null) return 'Buy Tokens';
    if (buyMethod === null && purchaseType !== null) {
      return purchaseType === 'sol' ? 'Buy SOL' : 'Buy EDLN';
    }
    if (buyMethod === 'sol') {
      return purchaseType === 'sol' ? 'Buy SOL with SOL' : 'Buy with SOL';
    }
    return purchaseType === 'sol' ? 'Buy SOL with Cash' : 'Buy with Cash';
  };

  const profileImageUrl = getHighQualityImageUrl(user?.profilePictureURL as string);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, theme === 'dark' && { backgroundColor: '#0D0D0D' }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme === 'dark' ? '#00FF80' : '#000'} />
          <Text style={[styles.loadingText, theme === 'dark' && { color: '#E0E0E0' }]}>
            Loading wallet data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, theme === 'dark' && { backgroundColor: '#0D0D0D' }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.container}>
          <BackButton />
          <View style={[styles.errorContainer, theme === 'dark' && { backgroundColor: '#131313' }]}>
            <Text style={[styles.errorTitle, theme === 'dark' && { color: '#E0E0E0' }]}>Error</Text>
            <Text style={[styles.errorText, theme === 'dark' && { color: '#B3B3B3' }]}>{error}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, theme === 'dark' && { backgroundColor: '#0D0D0D' }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Toast
        visible={toastVisible}
        type={toastType}
        message={toastMessage}
        onDismiss={() => setToastVisible(false)}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <BackButton />
            <Text style={[styles.headerText, theme === 'dark' && { color: '#E0E0E0' }]}>Wallet</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={[styles.walletAddressCard, theme === 'dark' && { backgroundColor: '#131313', borderColor: '#2E3033' }]}>
            <View style={styles.walletAddressHeader}>
              <Image 
                source={theme === 'dark' ? require('@/assets/images/icons/dark/wallet.png') : require('@/assets/images/icons/wallet.png')} 
                style={styles.walletIconSmall}
              />
              <Text style={[styles.walletAddressLabel, theme === 'dark' && { color: '#B3B3B3' }]}>
                Wallet Address
              </Text>
            </View>
            <View style={styles.walletAddressRow}>
              <Text 
                style={[styles.walletAddressText, theme === 'dark' && { color: '#E0E0E0' }]} 
                numberOfLines={1} 
                ellipsizeMode="middle"
              >
                {user?.address}
              </Text>
              <TouchableOpacity
                onPress={() => copyToClipboard(user?.address || '')}
                style={styles.copyButtonInline}
              >
                <Image
                  source={theme === 'dark' ? require('@/assets/images/icons/dark/copy.png') : require('@/assets/images/icons/copy.png')}
                  style={styles.copyIconSmall}
                />
              </TouchableOpacity>
            </View>
            {copied && (
              <Text style={[styles.copiedTextSmall, theme === 'dark' && { color: '#00FF80' }]}>
                Address copied!
              </Text>
            )}
          </View>

          <View style={[styles.balanceMainCard, theme === 'dark' && { backgroundColor: '#131313', borderColor: '#2E3033' }]}>
            <View style={styles.balanceHeaderRow}>
              <Text style={[styles.balanceLabel, theme === 'dark' && { color: '#B3B3B3' }]}>
                Total Balance
              </Text>
              <TouchableOpacity
                onPress={refreshBalance}
                disabled={isRefreshing}
                style={styles.refreshButtonSmall}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={theme === 'dark' ? '#00FF80' : '#000'} />
                ) : (
                  <FontAwesome5 name="sync-alt" size={14} color={theme === 'dark' ? '#00FF80' : '#000'} />
                )}
              </TouchableOpacity>
            </View>
            <Text style={[styles.netWorthLarge, theme === 'dark' && { color: '#E0E0E0' }]}>
              ${formatCurrency(netWorth)}
            </Text>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                onPress={() => {
                  setReceiveModalVisible(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[styles.actionButtonPrimary, theme === 'dark' && { backgroundColor: '#00FF80' }]}
              >
                <Text style={[styles.actionButtonPrimaryText, theme === 'dark' && { color: '#000' }]}>
                  Receive SOL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  toggleBuyModal();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[styles.actionButtonPrimary, theme === 'dark' && { backgroundColor: '#00FF80' }]}
              >
                <Text style={[styles.actionButtonPrimaryText, theme === 'dark' && { color: '#000' }]}>
                  Buy Tokens
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.tokenBalancesSection, theme === 'dark' && { backgroundColor: '#131313', borderColor: '#2E3033' }]}>
            <View style={[styles.tokenBalanceCard, theme === 'dark' && { backgroundColor: '#0D0D0D' }]}>
              <View style={styles.tokenBalanceHeader}>
                <Text style={[styles.tokenName, theme === 'dark' && { color: '#E0E0E0' }]}>Solana</Text>
                <Text style={[styles.tokenTick, theme === 'dark' && { color: '#B3B3B3' }]}>SOL</Text>
              </View>
              <Text style={[styles.tokenBalanceAmount, theme === 'dark' && { color: '#E0E0E0' }]}>
                {formatTokenAmount(solBalance, 4)}
              </Text>
              <Text style={[styles.tokenBalanceUSD, theme === 'dark' && { color: '#B3B3B3' }]}>
                ${formatCurrency(solValue)}
              </Text>
            </View>

            <View style={[styles.tokenBalanceCard, theme === 'dark' && { backgroundColor: '#0D0D0D' }]}>
              <View style={styles.tokenBalanceHeader}>
                <Text style={[styles.tokenName, theme === 'dark' && { color: '#E0E0E0' }]}>EduLearn</Text>
                <Text style={[styles.tokenTick, theme === 'dark' && { color: '#B3B3B3' }]}>EDLN</Text>
              </View>
              <Text style={[styles.tokenBalanceAmount, theme === 'dark' && { color: '#E0E0E0' }]}>
                {formatTokenAmount(edlnBalance, 2)}
              </Text>
              <Text style={[styles.tokenBalanceUSD, theme === 'dark' && { color: '#B3B3B3' }]}>
                ${formatCurrency(edlnValue)}
              </Text>
            </View>
          </View>

          <View style={styles.tokenUtilities}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tokenUtilitiesContainer}
              snapToInterval={width - 40}
              decelerationRate="fast"
              onScroll={(event) => {
                const contentOffsetX = event.nativeEvent.contentOffset.x;
                const index = Math.round(contentOffsetX / (width - 40));
                setActiveTokenUtilIndex(index);
              }}
              scrollEventThrottle={16}
            >
              <View style={[styles.tokenUtility, { width: width - 40 }, theme === 'dark' && { backgroundColor: '#131313', borderColor: '#2E3033' }]}>
                <Text style={[styles.tokenUtilityText, theme === 'dark' && { color: '#E0E0E0' }]}>
                  Burn 1000 $EDLN and get 3 credits
                </Text>
                <TouchableOpacity
                  style={[
                    styles.tokenUtilityButton,
                    theme === 'dark' && { backgroundColor: '#00FF80' },
                    (isBurning || edlnBalance < 1000) && styles.disabledButton
                  ]}
                  onPress={() => {
                    handleBurnTokens(1000);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  disabled={isBurning || edlnBalance < 1000}
                >
                  {isBurning && burningAmount === 1000 ? (
                    <ActivityIndicator size="small" color={theme === 'dark' ? '#000' : '#00FF80'} />
                  ) : (
                    <Text style={[styles.tokenUtilityButtonText, theme === 'dark' && { color: '#000' }]}>Burn</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={[styles.tokenUtility, { width: width - 40 }, theme === 'dark' && { backgroundColor: '#131313', borderColor: '#2E3033' }]}>
                <Text style={[styles.tokenUtilityText, theme === 'dark' && { color: '#E0E0E0' }]}>
                  Burn 5000 $EDLN and get 10 credits
                </Text>
                <TouchableOpacity
                  style={[
                    styles.tokenUtilityButton,
                    theme === 'dark' && { backgroundColor: '#00FF80' },
                    (isBurning || edlnBalance < 5000) && styles.disabledButton
                  ]}
                  onPress={() => {
                    handleBurnTokens(5000);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  disabled={isBurning || edlnBalance < 5000}
                >
                  {isBurning && burningAmount === 5000 ? (
                    <ActivityIndicator size="small" color={theme === 'dark' ? '#000' : '#00FF80'} />
                  ) : (
                    <Text style={[styles.tokenUtilityButtonText, theme === 'dark' && { color: '#000' }]}>Burn</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={[styles.tokenUtility, { width: width - 40 }, theme === 'dark' && { backgroundColor: '#131313', borderColor: '#2E3033' }]}>
                <Text style={[styles.tokenUtilityText, theme === 'dark' && { color: '#E0E0E0' }]}>
                  Burn 10000 $EDLN and get 20 credits
                </Text>
                <TouchableOpacity
                  style={[
                    styles.tokenUtilityButton,
                    theme === 'dark' && { backgroundColor: '#00FF80' },
                    (isBurning || edlnBalance < 10000) && styles.disabledButton
                  ]}
                  onPress={() => {
                    handleBurnTokens(10000);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  disabled={isBurning || edlnBalance < 10000}
                >
                  {isBurning && burningAmount === 10000 ? (
                    <ActivityIndicator size="small" color={theme === 'dark' ? '#000' : '#00FF80'} />
                  ) : (
                    <Text style={[styles.tokenUtilityButtonText, theme === 'dark' && { color: '#000' }]}>Burn</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={[styles.tokenUtility, { width: width - 40 }, theme === 'dark' && { backgroundColor: '#131313', borderColor: '#2E3033' }]}>
                <Text style={[styles.tokenUtilityText, theme === 'dark' && { color: '#E0E0E0' }]}>
                  Stake 5000 $EDLN for 30 days and earn 500 XP
                </Text>
                <TouchableOpacity
                  style={[styles.tokenUtilityButton, styles.disabledButton]}
                  disabled={true}
                >
                  <Text style={[styles.tokenUtilityButtonText, { color: '#61728C' }]}>Coming Soon</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.paginationContainer}>
              {[0, 1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    activeTokenUtilIndex === index && styles.paginationDotActive,
                    theme === 'dark' && { backgroundColor: activeTokenUtilIndex === index ? '#00FF80' : '#61728C' },
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      <Modal
        isVisible={receiveModalVisible}
        style={styles.modal}
        onBackdropPress={() => setReceiveModalVisible(false)}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <View style={[styles.modalContent, theme === 'dark' && { backgroundColor: '#131313' }]}>
          <Text style={[styles.modalTitle, theme === 'dark' && { color: '#E0E0E0' }]}>Receive SOL</Text>
          <Text style={[styles.modalDescription, theme === 'dark' && { color: '#B3B3B3' }]}>
            Scan this QR code to receive SOL to your wallet
          </Text>

          <View style={styles.qrContainer}>
            <SolanaQR 
              address={user?.address || ''} 
              amount="" 
              label="EduLearn Wallet" 
            />
          </View>

          <View style={[styles.addressContainer, theme === 'dark' && { backgroundColor: 'rgba(0, 255, 128, 0.1)' }]}>
            <Text style={[styles.addressLabel, theme === 'dark' && { color: '#B3B3B3' }]}>
              Your Wallet Address
            </Text>
            <View style={styles.addressRow}>
              <Text style={[styles.addressText, theme === 'dark' && { color: '#E0E0E0' }]} numberOfLines={1}>
                {user?.address ? `${user.address.slice(0, 16)}...${user.address.slice(-16)}` : ''}
              </Text>
              <TouchableOpacity
                onPress={() => copyToClipboard(user?.address || '')}
                style={styles.copyButtonSmall}
              >
                <Image
                  source={require('@/assets/images/icons/copy.png')}
                  style={styles.copyIconSmall}
                />
              </TouchableOpacity>
            </View>
          </View>

          {copied && (
            <Text style={styles.copiedToast}>Address copied to clipboard!</Text>
          )}

          <TouchableOpacity
            onPress={() => {
              setReceiveModalVisible(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[styles.modalButton, theme === 'dark' && { backgroundColor: '#00FF80' }]}
          >
            <Text style={[styles.modalButtonText, theme === 'dark' && { color: '#000' }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        isVisible={isBuyModalVisible}
        style={styles.modal}
        onBackdropPress={toggleBuyModal}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <View style={[styles.modalContent, theme === 'dark' && { backgroundColor: '#131313' }]}>
          <Text style={[styles.modalTitle, theme === 'dark' && { color: '#E0E0E0' }]}>
            {getModalTitle()}
          </Text>

          {buyMethod === null && purchaseType === null && (
            <View style={styles.modalBody}>
              <Text style={[styles.modalLabel, theme === 'dark' && { color: '#B3B3B3' }]}>
                What would you like to buy?
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setPurchaseType('edln');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[styles.optionButton, theme === 'dark' && { backgroundColor: '#2E3033', borderColor: '#2E3033' }]}
              >
                <Text style={[styles.optionTitle, theme === 'dark' && { color: '#E0E0E0' }]}>
                  Buy EDLN Tokens
                </Text>
                <Text style={[styles.optionSubtitle, theme === 'dark' && { color: '#B3B3B3' }]}>
                  Purchase EDLN tokens
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setPurchaseType('sol');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[styles.optionButton, theme === 'dark' && { backgroundColor: '#2E3033', borderColor: '#2E3033' }]}
              >
                <Text style={[styles.optionTitle, theme === 'dark' && { color: '#E0E0E0' }]}>
                  Buy SOL
                </Text>
                <Text style={[styles.optionSubtitle, theme === 'dark' && { color: '#B3B3B3' }]}>
                  Purchase SOL tokens
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleBuyModal}
                style={styles.cancelButtonModal}
              >
                <Text style={[styles.cancelButtonTextModal, theme === 'dark' && { color: '#B3B3B3' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {buyMethod === null && purchaseType !== null && (
            <View style={styles.modalBody}>
              <Text style={[styles.modalLabel, theme === 'dark' && { color: '#B3B3B3' }]}>
                How would you like to pay?
              </Text>
              {purchaseType === 'edln' && (
                <TouchableOpacity
                  onPress={() => {
                    setBuyMethod('sol');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[styles.optionButton, theme === 'dark' && { backgroundColor: '#2E3033', borderColor: '#2E3033' }]}
                >
                  <Text style={[styles.optionTitle, theme === 'dark' && { color: '#E0E0E0' }]}>
                    Buy with SOL
                  </Text>
                  <Text style={[styles.optionSubtitle, theme === 'dark' && { color: '#B3B3B3' }]}>
                    Swap your SOL for EDLN tokens
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  setBuyMethod('cash');
                  handleInitiateOnramp();
                }}
                disabled={isProcessingOnramp}
                style={[
                  styles.optionButton,
                  theme === 'dark' && { backgroundColor: '#2E3033', borderColor: '#2E3033' },
                  isProcessingOnramp && styles.disabledButton
                ]}
              >
                <Text style={[styles.optionTitle, theme === 'dark' && { color: '#E0E0E0' }]}>
                  Buy with Cash
                </Text>
                <Text style={[styles.optionSubtitle, theme === 'dark' && { color: '#B3B3B3' }]}>
                  {purchaseType === 'sol' ? 'Purchase SOL with bank transfer' : 'Purchase EDLN with bank transfer'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setPurchaseType(null);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={styles.cancelButtonModal}
              >
                <Text style={[styles.cancelButtonTextModal, theme === 'dark' && { color: '#B3B3B3' }]}>
                  Back
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {buyMethod === 'sol' && (
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, theme === 'dark' && { backgroundColor: '#2E3033', borderColor: '#2E3033', color: '#E0E0E0' }]}
                  placeholder="Amount in SOL"
                  placeholderTextColor={theme === 'dark' ? '#B3B3B3' : '#61728C'}
                  keyboardType="numeric"
                  value={buyAmount}
                  onChangeText={(text) => {
                    setBuyAmount(text);
                    const amount = parseFloat(text);
                    if (!isNaN(amount) && amount > solBalance) {
                      showToast('error', 'Insufficient SOL balance');
                    }
                  }}
                  editable={!isBuying}
                />
                <Text style={[styles.balanceHint, theme === 'dark' && { color: '#B3B3B3' }]}>
                  Available: {formatTokenAmount(solBalance, 4)} SOL
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setBuyMethod(null);
                    setPurchaseType(null);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  disabled={isBuying}
                  style={[styles.backButton, theme === 'dark' && { backgroundColor: '#000', borderColor: '#00FF80' }]}
                >
                  <Text style={[styles.backButtonText, theme === 'dark' && { color: '#00FF80' }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleBuyEDLN}
                  disabled={isBuying || !buyAmount || parseFloat(buyAmount) <= 0 || parseFloat(buyAmount) > solBalance}
                  style={[
                    styles.buyButton,
                    theme === 'dark' && { backgroundColor: '#00FF80' },
                    (isBuying || !buyAmount || parseFloat(buyAmount) <= 0 || parseFloat(buyAmount) > solBalance) && styles.disabledButton
                  ]}
                >
                  {isBuying ? (
                    <ActivityIndicator size="small" color={theme === 'dark' ? '#000' : '#00FF80'} />
                  ) : (
                    <Text style={[styles.buyButtonText, theme === 'dark' && { color: '#000' }]}>Buy EDLN</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {buyMethod === 'cash' && onrampStep === 'otp' && (
            <View style={styles.modalBody}>
              {!verifiedToken && (
                <View style={[styles.infoBox, theme === 'dark' && { backgroundColor: 'rgba(0, 255, 128, 0.1)' }]}>
                  <Text style={[styles.infoText, theme === 'dark' && { color: '#E0E0E0' }]}>
                    An OTP has been sent to <Text style={styles.boldText}>{user?.email}</Text>
                  </Text>
                </View>
              )}

              {verifiedToken && (
                <View style={[styles.infoBox, theme === 'dark' && { backgroundColor: 'rgba(0, 255, 128, 0.1)' }]}>
                  <FontAwesome5 name="check-circle" size={20} color="#00FF80" />
                  <Text style={[styles.infoText, theme === 'dark' && { color: '#E0E0E0' }]}>
                    Account verified! Enter amount to continue
                  </Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, theme === 'dark' && { color: '#E0E0E0' }]}>Amount (NGN)</Text>
                <TextInput
                  style={[styles.input, theme === 'dark' && { backgroundColor: '#2E3033', borderColor: '#2E3033', color: '#E0E0E0' }]}
                  placeholder="Enter amount"
                  placeholderTextColor={theme === 'dark' ? '#B3B3B3' : '#61728C'}
                  keyboardType="numeric"
                  value={cashAmount}
                  onChangeText={setCashAmount}
                  editable={!isProcessingOnramp}
                />
              </View>

              {!verifiedToken && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, theme === 'dark' && { color: '#E0E0E0' }]}>Enter OTP</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput, theme === 'dark' && { backgroundColor: '#2E3033', borderColor: '#2E3033', color: '#E0E0E0' }]}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor={theme === 'dark' ? '#B3B3B3' : '#61728C'}
                    value={otp}
                    onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                    maxLength={6}
                    editable={!isProcessingOnramp}
                    textAlign="center"
                  />
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setBuyMethod(null);
                    setPurchaseType(null);
                    setOnrampStep('method');
                    setOtp('');
                    setCashAmount('');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  disabled={isProcessingOnramp}
                  style={[styles.backButton, theme === 'dark' && { backgroundColor: '#000', borderColor: '#00FF80' }]}
                >
                  <Text style={[styles.backButtonText, theme === 'dark' && { color: '#00FF80' }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  disabled={isProcessingOnramp || (!verifiedToken && !otp) || !cashAmount}
                  style={[
                    styles.buyButton,
                    theme === 'dark' && { backgroundColor: '#00FF80' },
                    (isProcessingOnramp || (!verifiedToken && !otp) || !cashAmount) && styles.disabledButton
                  ]}
                >
                  {isProcessingOnramp ? (
                    <ActivityIndicator size="small" color={theme === 'dark' ? '#000' : '#00FF80'} />
                  ) : (
                    <Text style={[styles.buyButtonText, theme === 'dark' && { color: '#000' }]}>
                      {verifiedToken ? 'Continue' : 'Verify & Continue'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {buyMethod === 'cash' && onrampStep === 'payment' && paymentDetails && (
            <View style={styles.modalBody}>
              <View style={[styles.infoBox, theme === 'dark' && { backgroundColor: 'rgba(0, 255, 128, 0.1)' }]}>
                <Text style={[styles.infoText, theme === 'dark' && { color: '#E0E0E0' }]}>
                  Transfer funds to complete your order
                </Text>
              </View>

              <View style={[styles.paymentDetails, theme === 'dark' && { backgroundColor: '#2E3033' }]}>
                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, theme === 'dark' && { color: '#B3B3B3' }]}>Order ID</Text>
                  <Text style={[styles.paymentValue, theme === 'dark' && { color: '#E0E0E0' }]}>{paymentDetails.id}</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, theme === 'dark' && { color: '#B3B3B3' }]}>Bank</Text>
                  <Text style={[styles.paymentValue, theme === 'dark' && { color: '#E0E0E0' }]}>{paymentDetails.bank}</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, theme === 'dark' && { color: '#B3B3B3' }]}>Account Name</Text>
                  <Text style={[styles.paymentValue, theme === 'dark' && { color: '#E0E0E0' }]}>{paymentDetails.accountName}</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, theme === 'dark' && { color: '#B3B3B3' }]}>Account Number</Text>
                  <View style={styles.accountNumberRow}>
                    <Text style={[styles.paymentValue, theme === 'dark' && { color: '#E0E0E0' }]}>{paymentDetails.accountNumber}</Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(paymentDetails.accountNumber)}
                      style={styles.copyButtonSmall}
                    >
                      <Image
                        source={require('@/assets/images/icons/copy.png')}
                        style={styles.copyIconSmall}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, theme === 'dark' && { color: '#B3B3B3' }]}>Amount</Text>
                  <Text style={[styles.paymentAmount, theme === 'dark' && { color: '#00FF80' }]}>
                    ₦{paymentDetails.fiatAmount.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={[styles.warningBox, theme === 'dark' && { backgroundColor: 'rgba(255, 193, 7, 0.1)' }]}>
                <Text style={[styles.warningText, theme === 'dark' && { color: '#FFB300' }]}>
                  Your {purchaseType === 'sol' ? 'SOL' : 'EDLN'} tokens will be credited after payment confirmation
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  toggleBuyModal();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[styles.modalButton, theme === 'dark' && { backgroundColor: '#00FF80' }]}
              >
                <Text style={[styles.modalButtonText, theme === 'dark' && { color: '#000' }]}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
}

export default Wallet;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FBFC',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerText: {
    color: '#2D3C52',
    fontFamily: 'Satoshi-Regular',
    fontSize: 20,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#2D3C52',
    fontFamily: 'Satoshi-Regular',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#FF5555',
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
  },
  errorTitle: {
    color: '#fff',
    fontFamily: 'Satoshi-Regular',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    color: '#fff',
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  walletAddressCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDF3FC',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  walletAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  walletIconSmall: {
    width: 20,
    height: 20,
  },
  walletAddressLabel: {
    color: '#61728C',
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    fontWeight: '500',
  },
  walletAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletAddressText: {
    color: '#2D3C52',
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  copyButtonInline: {
    padding: 4,
  },
  copyIconSmall: {
    width: 16,
    height: 16,
  },
  copyButtonSmall: {
    padding: 4,
  },
  copiedTextSmall: {
    color: '#00FF80',
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  balanceMainCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDF3FC',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  balanceLabel: {
    color: '#61728C',
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    fontWeight: '500',
  },
  refreshButtonSmall: {
    padding: 4,
  },
  netWorthLarge: {
    color: '#2D3C52',
    fontFamily: 'Satoshi-Regular',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 20,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimaryText: {
    color: '#00FF80',
    fontFamily: 'Satoshi-Regular',
    fontSize: 16,
    fontWeight: '600',
  },
  tokenBalancesSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDF3FC',
    borderRadius: 16,
    padding: 4,
    marginTop: 12,
    flexDirection: 'row',
    gap: 4,
  },
  tokenBalanceCard: {
    flex: 1,
    backgroundColor: '#F9FBFC',
    borderRadius: 12,
    padding: 16,
  },
  tokenBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tokenName: {
    color: '#2D3C52',
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    fontWeight: '600',
  },
  tokenTick: {
    color: '#61728C',
    fontFamily: 'Satoshi-Regular',
    fontSize: 10,
    fontWeight: '500',
  },
  tokenBalanceAmount: {
    color: '#2D3C52',
    fontFamily: 'Satoshi-Regular',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  tokenBalanceUSD: {
    color: '#61728C',
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    fontWeight: '500',
  },
  tokenUtilities: {
    marginTop: 20,
  },
  tokenUtilitiesContainer: {
    paddingRight: 10,
  },
  tokenUtility: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginRight: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDF3FC',
  },
  tokenUtilityText: {
    color: '#2D3C52',
    fontFamily: 'Satoshi-Regular',
    fontSize: 16,
    flex: 1,
    paddingRight: 15,
  },
  tokenUtilityButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    minHeight: 40,
  },
  tokenUtilityButtonText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 16,
    fontWeight: '500',
    color: '#00FF80',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#61728C',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#00FF80',
  },
  bottomPadding: {
    height: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#2D3C52',
    fontFamily: 'Satoshi-Regular',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    color: '#61728C',
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalBody: {
    width: '100%',
    gap: 16,
  },
  modalLabel: {
    color: '#61728C',
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  addressContainer: {
    backgroundColor: 'rgba(0, 255, 128, 0.1)',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  addressLabel: {
    color: '#61728C',
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addressText: {
    color: '#000',
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  copiedToast: {
    color: '#00FF80',
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: '#F9FBFC',
    borderWidth: 2,
    borderColor: '#EDF3FC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  optionTitle: {
    color: '#2D3C52',
    fontFamily: 'Satoshi-Regular',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionSubtitle: {
    color: '#61728C',
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    fontWeight: '400',
  },
  cancelButtonModal: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonTextModal: {
    color: '#61728C',
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#2D3C52',
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FBFC',
    borderWidth: 1,
    borderColor: '#EDF3FC',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Satoshi-Regular',
    color: '#2D3C52',
  },
  otpInput: {
    letterSpacing: 8,
    fontSize: 18,
  },
  balanceHint: {
    color: '#61728C',
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    textAlign: 'right',
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#000000',
    fontFamily: 'Satoshi-Regular',
    fontSize: 16,
    fontWeight: '700',
  },
  buyButton: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    color: '#00FF80',
    fontFamily: 'Satoshi-Regular',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#F0FFF9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: '#000',
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
  },
  paymentDetails: {
    backgroundColor: '#F9FBFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF3FC',
  },
  paymentLabel: {
    color: '#61728C',
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    fontWeight: '500',
  },
  paymentValue: {
    color: '#2D3C52',
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    fontWeight: '600',
  },
  accountNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentAmount: {
    color: '#000000',
    fontFamily: 'Satoshi-Regular',
    fontSize: 18,
    fontWeight: '700',
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    color: '#F57C00',
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#000000',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalButtonText: {
    color: '#00FF80',
    fontFamily: 'Satoshi-Regular',
    fontSize: 16,
    fontWeight: '700',
  },
});
