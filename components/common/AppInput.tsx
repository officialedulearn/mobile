import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  pattern?: RegExp;
  onValidation?: (isValid: boolean) => void;
}

const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  containerStyle,
  pattern,
  onValidation,
  onChangeText,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChangeText = (text: string) => {
    if (pattern && onValidation) {
      onValidation(pattern.test(text));
    }
    onChangeText?.(text);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
        placeholderTextColor="#999"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChangeText={handleChangeText}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Satoshi-Bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Satoshi-Regular',
    color: '#000',
    backgroundColor: '#FFF',
  },
  inputFocused: {
    borderColor: '#00FF80',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  error: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
    fontFamily: 'Satoshi-Regular',
  },
});

export default AppInput;
