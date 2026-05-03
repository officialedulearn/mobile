import { ScreenContainer } from '@/components/common/ScreenContainer';
import usePublicQuizStore from '@/core/quizStore';
import useUserStore from '@/core/userState';
import { useScreenStyles } from '@/hooks/useScreenStyles';
import { useTheme } from '@/hooks/useTheme';
import type { PublicQuizListItem } from '@/types/quizzes.types';
import { Design } from '@/utils/design';
import { LegendList } from '@legendapp/list';
import { Image } from "expo-image";
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const Quizzes = () => {
    const userId = useUserStore((s) => s.user?.id);
    const { isDark } = useTheme();
    const screenStyles = useScreenStyles();
    const [listsReady, setListsReady] = useState(false);
    const {
        publicQuizzes,
        myQuizzes,
        quizError,
        fetchPublicQuizzes,
        fetchMyQuizzes,
    } = usePublicQuizStore();

    const screenWidth = Dimensions.get('window').width;
    const cardWidth = Math.min(screenWidth * 0.72, 300);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        setListsReady(false);
        (async () => {
            try {
                await Promise.all([
                    fetchPublicQuizzes({ limit: 50, sort: 'recent' }),
                    fetchMyQuizzes({ limit: 30 }),
                ]);
            } finally {
                if (!cancelled) setListsReady(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [userId, fetchPublicQuizzes, fetchMyQuizzes]);

    const openQuiz = useCallback((quizId: string) => {
        router.push({ pathname: '/(tabs)/quizzes/[id]', params: { id: quizId } });
    }, []);

    const listHeader = useCallback(
        () => (
            <View style={{ paddingHorizontal: Design.spacing.mdLg }}>
                <Text style={[styles.header, { color: screenStyles.text.primary }]}>Quizzes</Text>
                <Text style={[styles.subtext, { color: screenStyles.text.secondary }]}>
                    Practice what you&apos;ve learned. Earn XP. Get smarter.
                </Text>

                <Text style={[styles.sectionHeader, { color: screenStyles.text.primary }]}>
                    From your AI sessions
                </Text>

                {myQuizzes.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.hScrollContent}
                        snapToInterval={cardWidth + 16}
                        decelerationRate="fast"
                        style={styles.hScroll}
                    >
                        {myQuizzes.map((chat) => (
                            <View
                                key={chat.id}
                                style={[
                                    styles.aiSessionCard,
                                    {
                                        width: cardWidth,
                                        backgroundColor: isDark
                                            ? Design.colors.dark.surface
                                            : Design.colors.background.white,
                                        borderColor: isDark ? Design.colors.dark.border : Design.colors.border.hub,
                                    },
                                ]}
                            >
                                <View style={styles.cardHeaderRow}>
                                    <Image
                                        source={require('@/assets/images/icons/brain1.png')}
                                        style={styles.cardHeaderIcon}
                                    />
                                    <Text
                                        style={[
                                            styles.cardTitle,
                                            {
                                                color: isDark
                                                    ? Design.colors.text.darkPrimary
                                                    : Design.colors.text.primary,
                                            },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {chat.title || 'Untitled'}
                                    </Text>
                                </View>

                                <Text
                                    style={[
                                        styles.cardMeta,
                                        {
                                            color: isDark
                                                ? Design.colors.text.darkSecondary
                                                : Design.colors.text.slateSecondary,
                                        },
                                    ]}
                                >
                                    {new Date(chat.createdAt).toLocaleDateString()}
                                </Text>

                                <View style={styles.cardMetaRow}>
                                    <View style={styles.metaInline}>
                                        <Image
                                            source={require('@/assets/images/icons/medal-05.png')}
                                            style={styles.metaIconSm}
                                        />
                                        <Text
                                            style={[
                                                styles.metaTextSm,
                                                {
                                                    color: isDark
                                                        ? Design.colors.text.darkPrimary
                                                        : Design.colors.text.primary,
                                                },
                                            ]}
                                        >
                                            Up to 10 XP
                                        </Text>
                                    </View>
                                    <View style={styles.metaInline}>
                                        <Image
                                            source={
                                                isDark
                                                    ? require('@/assets/images/icons/dark/clock.png')
                                                    : require('@/assets/images/icons/clock.png')
                                            }
                                            style={styles.metaIconSm}
                                        />
                                        <Text
                                            style={[
                                                styles.metaTextSm,
                                                {
                                                    color: isDark
                                                        ? Design.colors.text.darkPrimary
                                                        : Design.colors.text.primary,
                                                },
                                            ]}
                                        >
                                            ~1 min
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.startBtnSm,
                                        {
                                            backgroundColor: isDark
                                                ? Design.colors.mint.DEFAULT
                                                : Design.colors.primary.accentDarkest,
                                        },
                                    ]}
                                    onPress={() => openQuiz(chat.id)}
                                >
                                    <Text
                                        style={[
                                            styles.startBtnSmText,
                                            {
                                                color: isDark
                                                    ? Design.colors.text.primary
                                                    : Design.colors.mint.DEFAULT,
                                            },
                                        ]}
                                    >
                                        Start
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                ) : (
                    <Text style={[styles.emptyText, { color: screenStyles.text.secondary }]}>
                        No AI session quizzes yet. Publish a quiz from chat to see it here.
                    </Text>
                )}

                <Text
                    style={[
                        styles.sectionHeader,
                        { color: screenStyles.text.primary, marginTop: Design.spacing.md },
                    ]}
                >
                    Public quizzes
                </Text>
                {quizError ? (
                    <Text style={[styles.errorText, { color: Design.colors.semantic.error }]}>{quizError}</Text>
                ) : null}
            </View>
        ),
        [cardWidth, isDark, myQuizzes, openQuiz, quizError, screenStyles.text.primary, screenStyles.text.secondary]
    );

    const renderPublicRow = useCallback(
        ({ item }: { item: PublicQuizListItem }) => {
            const border = isDark ? Design.colors.dark.border : Design.colors.border.hub;
            const surface = isDark ? Design.colors.dark.surface : Design.colors.background.white;
            const primary = isDark ? Design.colors.text.darkPrimary : Design.colors.text.primary;
            const secondary = isDark ? Design.colors.text.darkSecondary : Design.colors.text.slateSecondary;

            return (
                <TouchableOpacity
                    style={[styles.publicRow, { backgroundColor: surface, borderColor: border }]}
                    onPress={() => openQuiz(item.id)}
                    activeOpacity={0.85}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.publicTitle, { color: primary }]} numberOfLines={2}>
                            {item.title}
                        </Text>
                        {item.creatorUsername ? (
                            <Text style={[styles.publicSub, { color: secondary }]} numberOfLines={1}>
                                by {item.creatorUsername}
                            </Text>
                        ) : null}
                        <View style={styles.publicStats}>
                            <Text style={[styles.publicStatText, { color: secondary }]}>
                                {item.attemptCount} attempts
                            </Text>
                            <Text style={[styles.publicStatText, { color: secondary }]}>
                                {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.publicChevronWrap}>
                        <Text style={[styles.publicChevron, { color: primary }]}>›</Text>
                    </View>
                </TouchableOpacity>
            );
        },
        [isDark, openQuiz]
    );

    return (
        <>
            {isDark ? <StatusBar style="light" /> : <StatusBar style="dark" />}
            <ScreenContainer scrollable={false}>
                <View style={styles.flex}>
                    <LegendList
                        data={publicQuizzes}
                        estimatedItemSize={92}
                        keyExtractor={(item) => item.id}
                        renderItem={renderPublicRow}
                        ListHeaderComponent={listHeader}
                        nestedScrollEnabled={Platform.OS === 'android'}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyWrap}>
                                {!listsReady ? (
                                    <ActivityIndicator
                                        color={
                                            isDark ? Design.colors.mint.DEFAULT : Design.colors.primary.accentDarkest
                                        }
                                    />
                                ) : (
                                    <Text style={[styles.emptyCenter, { color: screenStyles.text.secondary }]}>
                                        No public quizzes yet.
                                    </Text>
                                )}
                            </View>
                        }
                    />
                </View>
            </ScreenContainer>
        </>
    );
};

export default Quizzes;

const styles = StyleSheet.create({
    flex: { flex: 1 },
    listContent: {
        paddingBottom: Design.spacing.xl,
    },
    emptyWrap: {
        paddingVertical: Design.spacing.lg,
        alignItems: 'center',
    },
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
        marginTop: Design.spacing.sm,
        marginBottom: Design.spacing.sm,
    },
    hScroll: { marginBottom: Design.spacing.xs },
    hScrollContent: {
        gap: 16,
        paddingVertical: Design.spacing.sm,
        paddingHorizontal: 0,
    },
    aiSessionCard: {
        paddingVertical: Design.spacing.md,
        paddingHorizontal: Design.spacing.md,
        borderRadius: 12,
        marginTop: Design.spacing.xs,
        borderWidth: 1,
        gap: Design.spacing.sm,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardHeaderIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    cardTitle: {
        fontSize: Design.typography.fontSize.base,
        marginLeft: Design.spacing.sm,
        fontFamily: Design.typography.fontFamily.satoshi.medium,
        lineHeight: Design.typography.lineHeight.base,
        fontWeight: Design.typography.fontWeight.medium,
        flex: 1,
    },
    cardMeta: {
        fontSize: Design.typography.fontSize.sm,
        fontFamily: Design.typography.fontFamily.satoshi.regular,
    },
    cardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    metaInline: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaIconSm: {
        width: 18,
        height: 18,
        marginRight: Design.spacing.xs,
    },
    metaTextSm: {
        fontSize: Design.typography.fontSize.sm,
        fontFamily: Design.typography.fontFamily.satoshi.medium,
    },
    startBtnSm: {
        borderRadius: 12,
        marginTop: Design.spacing.sm,
    },
    startBtnSmText: {
        fontSize: Design.typography.fontSize.base,
        fontFamily: Design.typography.fontFamily.satoshi.medium,
        fontWeight: Design.typography.fontWeight.medium,
        paddingVertical: Design.spacing.md,
        textAlign: 'center',
    },
    publicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Design.spacing.mdLg,
        marginBottom: Design.spacing.sm,
        paddingVertical: Design.spacing.md,
        paddingHorizontal: Design.spacing.md,
        borderRadius: 12,
        borderWidth: 1,
    },
    publicTitle: {
        fontSize: Design.typography.fontSize.base,
        fontFamily: Design.typography.fontFamily.satoshi.medium,
        fontWeight: Design.typography.fontWeight.medium,
    },
    publicSub: {
        fontSize: Design.typography.fontSize.xs,
        marginTop: 2,
        fontFamily: Design.typography.fontFamily.satoshi.regular,
    },
    publicStats: {
        flexDirection: 'row',
        gap: Design.spacing.md,
        marginTop: Design.spacing.xs,
    },
    publicStatText: {
        fontSize: Design.typography.fontSize.xs,
        fontFamily: Design.typography.fontFamily.satoshi.regular,
    },
    publicChevronWrap: { paddingLeft: Design.spacing.sm },
    publicChevron: {
        fontSize: 22,
        fontWeight: Design.typography.fontWeight.medium,
    },
    emptyText: {
        marginTop: Design.spacing.sm,
        marginBottom: Design.spacing.sm,
        fontFamily: Design.typography.fontFamily.satoshi.regular,
    },
    errorText: {
        fontSize: Design.typography.fontSize.sm,
        marginBottom: Design.spacing.sm,
        fontFamily: Design.typography.fontFamily.satoshi.regular,
    },
    emptyCenter: {
        textAlign: 'center',
        fontFamily: Design.typography.fontFamily.satoshi.regular,
        paddingHorizontal: Design.spacing.md,
    },
});
