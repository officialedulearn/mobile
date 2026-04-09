import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Design } from '@/utils/design';

interface HomeHeaderProps {
  userName: string;
  profileImageUrl?: string;
}

export function HomeHeader({ userName, profileImageUrl }: HomeHeaderProps) {
  const { isDark, colors, spacing } = useTheme();

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.md, gap: spacing.md }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Image
          source={profileImageUrl ? { uri: profileImageUrl } : require('@/assets/images/memoji.png')}
          style={{ width: 40, height: 40, borderRadius: 20 }}
          resizeMode="cover"
        />
        <View style={{ flexDirection: 'column' }}>
          <Text style={[
            styles.greeting,
            { color: isDark ? colors.text.darkPrimary : colors.text.primary }
          ]}>
            Hi {userName}👋
          </Text>
          <Text style={[
            styles.subtext,
            { color: isDark ? colors.text.darkSecondary : colors.text.slateSecondary }
          ]}>
            Learn & earn more XP today
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <TouchableOpacity
          style={[
            styles.iconButton,
            { backgroundColor: isDark ? colors.dark.surfaceElevated : colors.background.white, borderColor: isDark ? colors.dark.border : colors.border.hub }
          ]}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.7}
        >
          <Image
            source={isDark ? require('@/assets/images/icons/dark/notification.png') : require('@/assets/images/icons/notification.png')}
            style={{ width: 20, height: 20 }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.iconButton,
            { backgroundColor: isDark ? colors.dark.surfaceElevated : colors.background.white, borderColor: isDark ? colors.dark.border : colors.border.hub }
          ]}
          onPress={() => router.push('/search')}
          activeOpacity={0.7}
        >
          <Image
            source={isDark ? require('@/assets/images/icons/dark/search.png') : require('@/assets/images/icons/search-normal.png')}
            style={{ width: 20, height: 20 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: Design.spacing.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  greeting: {
    fontFamily: Design.typography.fontFamily.urbanist.regular,
    fontSize: Design.typography.fontSize.lg,
    lineHeight: Design.typography.lineHeight.lg,
    fontWeight: Design.typography.fontWeight.bold,
  },
  subtext: {
    fontFamily: Design.typography.fontFamily.urbanist.regular,
    fontSize: Design.typography.fontSize.sm,
    lineHeight: Design.typography.lineHeight.sm,
    fontWeight: Design.typography.fontWeight.regular,
    marginTop: Design.spacing.xs,
  },
  iconButton: {
    borderRadius: 100,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
});
