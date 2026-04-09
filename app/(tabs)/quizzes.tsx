import useActivityStore from '@/core/activityState';
import useUserStore from '@/core/userState';
import useChatStore from '@/core/chatState';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DataTable } from 'react-native-paper';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { useTheme } from '@/hooks/useTheme';
import { useScreenStyles } from '@/hooks/useScreenStyles';
import { Design } from '@/utils/design';

const Quizzes = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [page, setPage] = useState<number>(0);
  const [numberOfItemsPerPageList] = useState([10, 15, 20]);
  const [itemsPerPage, onItemsPerPageChange] = useState(numberOfItemsPerPageList[0]);

  const { updateUserCredits, user } = useUserStore();
  const { isDark } = useTheme();
  const screenStyles = useScreenStyles();
  const { chatList, fetchChatList } = useChatStore();
  const { quizActivities, isLoading, fetchQuizActivities } = useActivityStore();

  const chats = React.useMemo(
    () =>
      chatList
        .filter((c) => !c.tested)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [chatList]
  );

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth * 0.75;
  const from = page * itemsPerPage;
  // const [isLoading, setIsLoading]o = Math.min((page + 1) * itemsPerPage, quizActivities.length);

  useEffect(() => {
    setPage(0);
  }, [itemsPerPage]);

  useEffect(() => {
    if (!user?.id) return;
    fetchChatList(user.id as unknown as string);
    fetchQuizActivities(user.id as unknown as string);
  }, [user?.id, fetchChatList, fetchQuizActivities]);

  // const [isLoading, setIsLoading]tartQuiz = (chatId: string) => {
    const currentCredits = Number(user?.credits) || 0;

    if (currentCredits <= 0.5) {
      router.push('/freeTrialIntro');
      return;
    }

    updateUserCredits(currentCredits - 0.5);

    router.push({
      pathname: '/quiz',
      params: { chatId: chatId },
    });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    // const [isLoading, setIsLoading]ndex = Math.round(contentOffsetX / (cardWidth + 20));
    setActiveIndex(index);
  };

  // const [isLoading, setIsLoading]estedChats = chats.filter((chat) => !chat.tested);

  return (
    <>
      {isDark ? <StatusBar style="light" /> : <StatusBar style="dark" />}
      <ScreenContainer scrollable={true}>
        <View style={{ paddingHorizontal: Design.spacing.mdLg }}>
          <Text style={[
            styles.header,
            { color: isDark ? screenStyles.text.primary : screenStyles.text.primary }
          ]}>
            Quizzes
          </Text>
          <Text style={[
            styles.subtext,
            { color: isDark ? screenStyles.text.secondary : screenStyles.text.secondary }
          ]}>
            Practice what you&apos;ve learned. Earn XP. Get smarter.
          </Text>

          <Text style={[
            styles.sectionHeader,
            { color: isDark ? screenStyles.text.primary : screenStyles.text.primary }
          ]}>
            Quizzes From Your AI Sessions
          </Text>

          {chats.length > 0 ? (
            <>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContent}
                snapToInterval={cardWidth + 20}
                decelerationRate="fast"
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.horizontalScrollView}
              >
                {testedChats.map((chat) => (
                  <View
                    key={chat.id}
                    style={[
                      styles.chatItem,
                      {
                        width: cardWidth,
                        backgroundColor: isDark ? Design.colors.dark.surface : Design.colors.background.white,
                        borderColor: isDark ? Design.colors.dark.border : Design.colors.border.hub,
                      }
                    ]}
                  >
                    <View style={styles.chatItemHeader}>
                      <Image
                        source={require('@/assets/images/icons/brain1.png')}
                        style={styles.chatIcon}
                      />
                      <Text style={[
                        styles.chatText,
                        { color: isDark ? Design.colors.text.darkPrimary : Design.colors.text.primary }
                      ]} numberOfLines={1}>
                        {chat.title || 'Untitled Chat'}
                      </Text>
                    </View>

                    <Text style={[
                      styles.dateText,
                      { color: isDark ? Design.colors.text.darkSecondary : Design.colors.text.slateSecondary }
                    ]}>
                      From your chat on{' '}
                      {new Date(chat.createdAt).toLocaleDateString()}
                    </Text>

                    <View style={styles.metadataRow}>
                      <View style={styles.metadataItem}>
                        <Image
                          source={require('@/assets/images/icons/medal-05.png')}
                          style={styles.metadataIcon}
                        />
                        <Text style={[
                          styles.xpText,
                          { color: isDark ? Design.colors.text.darkPrimary : Design.colors.text.primary }
                        ]}>
                          Earn up to 10 XP
                        </Text>
                      </View>

                      <View style={styles.metadataItem}>
                        <Image
                          source={isDark ? require('@/assets/images/icons/dark/clock.png') : require('@/assets/images/icons/clock.png')}
                          style={styles.metadataIcon}
                        />
                        <Text style={[
                          styles.xpText,
                          { color: isDark ? Design.colors.text.darkPrimary : Design.colors.text.primary }
                        ]}>
                          ~ 1 min
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.startButton,
                        {
                          backgroundColor: isDark ? Design.colors.mint.DEFAULT : Design.colors.primary.accentDarkest,
                          marginBottom: 10
                        }
                      ]}
                      onPress={() => {
                        startQuiz(chat.id);
                      }}
                    >
                      <Text style={[
                        styles.startButtonText,
                        { color: isDark ? Design.colors.text.primary : Design.colors.mint.DEFAULT }
                      ]}>
                        Start Quiz
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : (
            <Text style={[
              styles.emptyText,
              { color: isDark ? Design.colors.text.darkSecondary : Design.colors.text.slateSecondary }
            ]}>
              No quizzes available.
            </Text>
          )}

          <View style={styles.historyHeader}>
            <Text style={[
              styles.sectionHeader,
              { color: isDark ? Design.colors.text.darkPrimary : Design.colors.text.primary }
            ]}>
              Quiz History
            </Text>

            <TouchableOpacity style={[
              styles.searchButton,
              {
                backgroundColor: isDark ? Design.colors.dark.surface : Design.colors.background.white,
                borderColor: isDark ? Design.colors.dark.border : Design.colors.border.hub,
              }
            ]}>
              <Image
                source={isDark ? require('@/assets/images/icons/dark/search.png') : require('@/assets/images/icons/search-normal.png')}
                style={styles.searchIcon}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.historyList}>
            {quizActivities.length > 0 ? (
              <>
                {quizActivities.slice(from, to).map((activity, index) => (
                  <View key={index} style={[
                    styles.activityCard,
                    {
                      backgroundColor: isDark ? Design.colors.dark.surface : Design.colors.background.white,
                      borderColor: isDark ? Design.colors.dark.border : Design.colors.border.hub,
                    }
                  ]}>
                    <View style={styles.activityContainer}>
                      <View style={styles.activityLeftColumn}>
                        <Text style={[
                          styles.chatText,
                          { color: isDark ? Design.colors.text.darkPrimary : Design.colors.text.primary }
                        ]} numberOfLines={1}>
                          {activity.title || 'Untitled Quiz'}
                        </Text>

                        <View style={styles.metadataItem}>
                          <Image
                            source={isDark ? require('@/assets/images/icons/dark/clock.png') : require('@/assets/images/icons/clock.png')}
                            style={styles.metadataIcon}
                          />
                          <Text style={[
                            styles.xpText,
                            { color: isDark ? Design.colors.text.darkPrimary : Design.colors.text.primary }
                          ]}>
                            1 min
                          </Text>
                        </View>

                        <View style={styles.metadataItem}>
                          <Image
                            source={require('@/assets/images/icons/medal-05.png')}
                            style={styles.metadataIcon}
                          />
                          <Text style={[
                            styles.xpText,
                            { color: isDark ? Design.colors.text.darkSecondary : Design.colors.text.slateSecondary }
                          ]}>
                            +{activity.xpEarned} XP
                          </Text>
                        </View>
                      </View>

                      <View style={styles.activityRightColumn}>
                        <View style={styles.metadataItem}>
                          <Image
                            source={isDark ? require('@/assets/images/icons/dark/calendar.png') : require('@/assets/images/icons/calendar.png')}
                            style={styles.metadataIcon}
                          />
                          <Text style={[
                            styles.dateText,
                            { color: isDark ? Design.colors.text.darkSecondary : Design.colors.text.slateSecondary }
                          ]}>
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </Text>
                        </View>

                        <View style={styles.metadataItem}>
                          <Image
                            source={isDark ? require('@/assets/images/icons/dark/notebook.png') : require('@/assets/images/icons/notebook.png')}
                            style={styles.metadataIcon}
                          />
                          <Text style={[
                            styles.scoreText,
                            { color: isDark ? Design.colors.text.darkPrimary : Design.colors.text.primary }
                          ]}>
                            {activity.xpEarned}/5 ({activity.xpEarned * 20}%)
                          </Text>
                        </View>

                        <View style={[
                          styles.statusBadge,
                          activity.xpEarned >= 3 ? styles.statusPassed : styles.statusFailed
                        ]}>
                          <View style={[
                            styles.statusDot,
                            activity.xpEarned >= 3 ? styles.statusDotPassed : styles.statusDotFailed
                          ]} />
                          <Text style={[
                            styles.statusText,
                            activity.xpEarned >= 3 ? styles.statusTextPassed : styles.statusTextFailed
                          ]}>
                            {activity.xpEarned >= 3 ? 'Passed' : 'Failed'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}

                {quizActivities.length > itemsPerPage && (
                  <View style={[
                    styles.tableContainer,
                    { backgroundColor: isDark ? Design.colors.dark.surface : Design.colors.background.white }
                  ]}>
                    <DataTable style={[
                      styles.table,
                      { backgroundColor: isDark ? Design.colors.dark.surface : Design.colors.background.white }
                    ]}>
                      <View style={styles.paginationContainer}>
                        <DataTable.Pagination
                          page={page}
                          numberOfPages={Math.ceil(quizActivities.length / itemsPerPage)}
                          onPageChange={(page) => setPage(page)}
                          onItemsPerPageChange={onItemsPerPageChange}
                          showFastPaginationControls
                          style={styles.pagination}
                        />
                      </View>
                    </DataTable>
                  </View>
                )}
              </>
            ) : (
              <Text style={[
                styles.emptyText,
                { color: isDark ? Design.colors.text.darkSecondary : Design.colors.text.slateSecondary }
              ]}>
                No quiz history available.
              </Text>
            )}
          </View>
        </View>
      </ScreenContainer>
    </>
  );
};

export default Quizzes;

const styles = StyleSheet.create({
  header: {
    fontSize: Design.typography.fontSize.xl,
    fontWeight: Design.typography.fontWeight.semibold,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    lineHeight: Design.typography.lineHeight.xl,
  },
  subtext: {
    fontSize: Design.typography.fontSize.sm,
    marginTop: Design.spacing.sm,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    lineHeight: Design.typography.lineHeight.md,
    fontWeight: Design.typography.fontWeight.regular,
    marginBottom: Design.spacing.lg,
  },
  sectionHeader: {
    fontSize: Design.typography.fontSize.lg,
    fontWeight: Design.typography.fontWeight.semibold,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    lineHeight: Design.typography.lineHeight.lg,
    marginTop: Design.spacing.lg,
    marginBottom: Design.spacing.sm,
  },
  chatText: {
    fontSize: Design.typography.fontSize.base,
    marginLeft: Design.spacing.sm,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    lineHeight: Design.typography.lineHeight.md,
    fontWeight: Design.typography.fontWeight.medium,
  },
  dateText: {
    fontSize: Design.typography.fontSize.sm,
    marginLeft: Design.spacing.sm,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    lineHeight: Design.typography.lineHeight.md,
    fontWeight: Design.typography.fontWeight.regular,
  },
  xpText: {
    fontSize: Design.typography.fontSize.sm,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    lineHeight: Design.typography.lineHeight.md,
    fontWeight: Design.typography.fontWeight.medium,
  },
  chatItem: {
    paddingVertical: Design.spacing.md,
    paddingHorizontal: Design.spacing.sm,
    borderRadius: 12,
    marginTop: Design.spacing.xs,
    borderWidth: 1,
    gap: Design.spacing.md,
  },
  activityCard: {
    padding: Design.spacing.sm,
    borderRadius: 12,
    marginTop: Design.spacing.sm,
    marginBottom: Design.spacing.sm,
    borderWidth: 1,
  },
  horizontalScrollView: {
    gap: Design.spacing.md,
    marginBottom: Design.spacing.xs,
  },
  chatItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatIcon: {
    width: 20,
    height: 20,
    borderRadius: 25,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Design.spacing.sm,
    justifyContent: 'space-between',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Design.spacing.xs,
  },
  metadataIcon: {
    width: 20,
    height: 20,
    marginRight: Design.spacing.xs,
  },
  startButton: {
    borderRadius: 12,
    textAlign: 'center',
    marginTop: Design.spacing.sm,
  },
  startButtonText: {
    fontSize: Design.typography.fontSize.base,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    fontWeight: Design.typography.fontWeight.medium,
    padding: Design.spacing.md,
    textAlign: 'center',
    lineHeight: Design.typography.lineHeight.md,
  },
  scrollViewContent: {
    gap: Design.spacing.md,
    paddingVertical: Design.spacing.sm,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Design.spacing.lg,
    marginBottom: Design.spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Design.spacing.md,
    paddingVertical: Design.spacing.xs,
    borderRadius: 999,
  },
  statusPassed: {
    backgroundColor: '#F2FFF7',
  },
  statusFailed: {
    backgroundColor: '#FBEAE9',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Design.spacing.sm,
  },
  statusDotPassed: {
    backgroundColor: Design.colors.semantic.successDark,
  },
  statusDotFailed: {
    backgroundColor: '#940803',
  },
  statusText: {
    fontSize: Design.typography.fontSize.sm,
    fontWeight: Design.typography.fontWeight.medium,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
  },
  statusTextPassed: {
    color: Design.colors.semantic.successDark,
  },
  statusTextFailed: {
    color: '#940803',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Design.spacing.lg,
  },
  searchButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Design.spacing.sm,
  },
  searchIcon: {
    width: 20,
    height: 20,
  },
  historyList: {
    marginTop: Design.spacing.md,
  },
  activityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityLeftColumn: {
    flex: 1,
    paddingRight: Design.spacing.md,
    justifyContent: 'center',
    gap: Design.spacing.xs,
    alignItems: 'flex-start',
  },
  activityRightColumn: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: Design.spacing.xs,
  },
  scoreText: {
    fontSize: Design.typography.fontSize.sm,
    fontFamily: Design.typography.fontFamily.satoshi.medium,
    lineHeight: Design.typography.lineHeight.md,
    fontWeight: Design.typography.fontWeight.medium,
  },
  emptyText: {
    marginTop: Design.spacing.md,
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    textAlign: 'center',
  },
  tableContainer: {
    marginTop: Design.spacing.lg,
    marginBottom: Design.spacing.lg,
  },
  table: {
    backgroundColor: 'white',
  },
  pagination: {
    backgroundColor: 'white',
  },
});
