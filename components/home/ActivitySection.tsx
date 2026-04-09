import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Design } from '@/utils/design';

interface Activity {
  id: string;
  title: string;
  xpEarned: number;
}

interface ActivitySectionProps {
  activities: Activity[];
  isLoading: boolean;
}

export function ActivitySection({ activities, isLoading }: ActivitySectionProps) {
  const { isDark, colors, spacing } = useTheme();

  return (
    <View style={[styles.container, { marginTop: spacing.lg }]}>
      <View style={styles.header}>
        <Text style={[
          styles.title,
          { color: isDark ? colors.text.darkPrimary : colors.text.primary }
        ]}>
          Recent Highlights
        </Text>
        <TouchableOpacity
          style={[
            styles.seeMoreButton,
            { borderColor: isDark ? colors.dark.border : colors.border.hub }
          ]}
          onPress={() => router.push('/quizzes')}
        >
          <Text style={[
            styles.seeMoreText,
            { color: isDark ? colors.text.darkPrimary : colors.text.slate }
          ]}>
            See all
          </Text>
          <Image
            source={isDark ? require('@/assets/images/icons/dark/CaretRight.png') : require('@/assets/images/icons/CaretRight.png')}
            style={{ width: 24, height: 24 }}
          />
        </TouchableOpacity>
      </View>

      {activities.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <FontAwesome5 name="trophy" size={24} color={isDark ? colors.text.darkSecondary : colors.text.slateSecondary} />
          <Text style={[
            styles.emptyTitle,
            { color: isDark ? colors.text.darkPrimary : colors.text.primary }
          ]}>
            No highlights yet
          </Text>
          <Text style={[
            styles.emptySubtitle,
            { color: isDark ? colors.text.darkSecondary : colors.text.slateSecondary }
          ]}>
            Complete activities to see your achievements!
          </Text>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[
            styles.loadingText,
            { color: isDark ? colors.text.darkSecondary : colors.text.slateSecondary }
          ]}>
            Loading...
          </Text>
        </View>
      ) : (
        <View style={[
          styles.itemsContainer,
          { backgroundColor: isDark ? colors.dark.surface : colors.background.white, borderColor: isDark ? colors.dark.border : colors.border.hub }
        ]}>
          {activities.slice(0, 3).map((activity, index) => (
            <View key={activity.id}>
              <View style={styles.item}>
                <Text style={[
                  styles.activityTitle,
                  { color: isDark ? colors.text.darkPrimary : colors.text.primary }
                ]}>
                  {activity.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <Image
                    source={require('@/assets/images/icons/medal-05.png')}
                    style={{ width: 20, height: 20, marginBottom: 4 }}
                  />
                  <Text style={[
                    styles.xpText,
                    { color: isDark ? colors.text.darkSecondary : colors.text.slateSecondary }
                  ]}>
                    +{activity.xpEarned} XP
                  </Text>
                </View>
              </View>
              {index < activities.slice(0, 3).length - 1 && (
                <View style={{ height: 0.5, backgroundColor: isDark ? colors.dark.border : colors.border.hub }} />
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'column',
    gap: Design.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    fontWeight: Design.typography.fontWeight.medium,
    lineHeight: Design.typography.lineHeight.md,
  },
  seeMoreButton: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Design.spacing.sm,
    paddingHorizontal: Design.spacing.md,
    paddingVertical: Design.spacing.xs,
    alignItems: 'center',
  },
  seeMoreText: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    lineHeight: Design.typography.lineHeight.md,
    fontSize: Design.typography.fontSize.sm,
    fontWeight: Design.typography.fontWeight.regular,
  },
  itemsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    gap: Design.spacing.sm,
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'column',
    borderWidth: 1,
    overflow: 'hidden',
  },
  item: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: Design.spacing.sm,
    paddingHorizontal: Design.spacing.md,
    width: '100%',
  },
  activityTitle: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.sm,
    fontWeight: Design.typography.fontWeight.medium,
    lineHeight: Design.typography.lineHeight.md,
  },
  xpText: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
    fontWeight: Design.typography.fontWeight.regular,
    lineHeight: Design.typography.lineHeight.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Design.spacing.lg,
  },
  emptyTitle: {
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontSize: Design.typography.fontSize.base,
    fontWeight: Design.typography.fontWeight.medium,
    marginBottom: Design.spacing.xs,
  },
  emptySubtitle: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: Design.spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Design.spacing.lg,
  },
  loadingText: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
  },
});
