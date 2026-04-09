import React from 'react';
import { View, ScrollView, ViewStyle, ScrollViewProps } from 'react-native';
import { useScreenStyles } from '@/hooks/useScreenStyles';

interface ScreenContainerProps extends ScrollViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
}

export function ScreenContainer({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  ...props
}: ScreenContainerProps) {
  const screenStyles = useScreenStyles();

  const containerStyle = [screenStyles.container, style];
  const scrollContentStyle = [screenStyles.scrollContent, contentContainerStyle];

  if (!scrollable) {
    return (
      <View style={containerStyle}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={containerStyle}
      contentContainerStyle={scrollContentStyle}
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  );
}
