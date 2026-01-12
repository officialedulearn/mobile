import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import useUserStore from '@/core/userState';

interface SolanaQRProps {
  address: string;
  amount?: string;
  label?: string;
}

const SolanaQR = ({ address, amount = '', label = 'EduLearn Wallet' }: SolanaQRProps) => {
  const { theme } = useUserStore();

  const buildSolanaUri = () => {
    if (!address) return '';
    
    let uri = `solana:${address}`;
    const params = [];
    
    if (amount) {
      params.push(`amount=${amount}`);
    }
    if (label) {
      params.push(`label=${encodeURIComponent(label)}`);
    }
    
    if (params.length > 0) {
      uri += `?${params.join('&')}`;
    }
    
    return uri;
  };

  const solanaUri = buildSolanaUri();

  if (!solanaUri) {
    return (
      <View style={styles.container}>
        <View style={[styles.qrWrapper, { backgroundColor: '#FFFFFF' }]}>
          <Text style={styles.errorText}>Invalid address</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.qrWrapper, { backgroundColor: '#FFFFFF' }]}>
        <QRCode
          value={solanaUri}
          size={192}
          color="#000000"
          backgroundColor="#FFFFFF"
          logoSize={48}
          logoBackgroundColor="#FFFFFF"
          logoMargin={2}
          logoBorderRadius={8}
          quietZone={8}
        />
      </View>
    </View>
  );
};

export default SolanaQR;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrWrapper: {
    padding: 16,
    borderRadius: 16,
    minHeight: 224,
    minWidth: 224,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
});