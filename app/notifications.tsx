import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import BackButton from '@/components/backButton';
import useUserStore from '@/core/userState';
import useNotificationsStore from '@/core/notificationsState';
import * as Haptics from 'expo-haptics';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type NotificationItemProps = {
  notification: {
    id: string;
    title: string;
    content: string;
    createdAt: Date | string;
  };
  onDelete: (id: string) => void;
};

const NotificationItem = ({ notification, onDelete }: NotificationItemProps) => {
  const theme = useUserStore((state) => state.theme);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (date: Date | string) => {
    const notificationDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return notificationDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: notificationDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await onDelete(notification.id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderRightActions = () => {
    return (
      <TouchableOpacity
        onPress={handleDelete}
        disabled={isDeleting}
        style={[
          styles.deleteAction,
          theme === 'dark' && { backgroundColor: '#2E1515' },
        ]}
        activeOpacity={0.7}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <FontAwesome5 name="trash-alt" size={20} color="#FF4444" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
      onSwipeableOpen={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <View
        style={[
          styles.notificationCard,
          theme === 'dark' && {
            backgroundColor: '#131313',
            borderColor: '#2E3033',
          },
        ]}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text
              style={[
                styles.notificationTitle,
                theme === 'dark' && { color: '#E0E0E0' },
              ]}
            >
              {notification.title}
            </Text>
          </View>
          <Text
            style={[
              styles.notificationContentText,
              theme === 'dark' && { color: '#B3B3B3' },
            ]}
          >
            {notification.content}
          </Text>
          <Text
            style={[
              styles.notificationTime,
              theme === 'dark' && { color: '#61728C' },
            ]}
          >
            {formatDate(notification.createdAt)}
          </Text>
        </View>
      </View>
    </Swipeable>
  );
};

const Notifications = () => {
  const theme = useUserStore((state) => state.theme);
  const user = useUserStore((state) => state.user);
  const {
    notifications,
    isLoading,
    error,
    fetchNotifications,
    deleteNotification,
    startPolling,
    stopPolling,
    refreshNotifications,
  } = useNotificationsStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications('desc');
      startPolling(30000);
    }

    return () => {
      stopPolling();
    };
  }, [user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  const renderItem = ({ item }: { item: any }) => (
    <NotificationItem notification={item} onDelete={handleDelete} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5
        name="bell-slash"
        size={64}
        color={theme === 'dark' ? '#2E3033' : '#EDF3FC'}
      />
      <Text
        style={[
          styles.emptyTitle,
          theme === 'dark' && { color: '#E0E0E0' },
        ]}
      >
        No notifications yet
      </Text>
      <Text
        style={[
          styles.emptySubtitle,
          theme === 'dark' && { color: '#B3B3B3' },
        ]}
      >
        You'll see your notifications here when they arrive
      </Text>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={[
          styles.container,
          theme === 'dark' && { backgroundColor: '#0D0D0D' },
        ]}
      >
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <View
          style={[
            styles.topNav,
            theme === 'dark' && { backgroundColor: '#0D0D0D' },
          ]}
        >
          <BackButton />
          <Text
            style={[
              styles.topNavText,
              theme === 'dark' && { color: '#E0E0E0' },
            ]}
          >
            Notifications
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading && notifications.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={theme === 'dark' ? '#00FF66' : '#00FF80'}
            />
            <Text
              style={[
                styles.loadingText,
                theme === 'dark' && { color: '#B3B3B3' },
              ]}
            >
              Loading notifications...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text
              style={[
                styles.errorText,
                theme === 'dark' && { color: '#E0E0E0' },
              ]}
            >
              {error}
            </Text>
            <TouchableOpacity
              style={[
                styles.retryButton,
                theme === 'dark' && {
                  backgroundColor: '#131313',
                  borderColor: '#2E3033',
                },
              ]}
              onPress={() => fetchNotifications('desc')}
            >
              <Text
                style={[
                  styles.retryButtonText,
                  theme === 'dark' && { color: '#E0E0E0' },
                ]}
              >
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              notifications.length === 0 && styles.emptyListContent,
            ]}
            ListEmptyComponent={renderEmptyState}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme === 'dark' ? '#00FF66' : '#00FF80'}
                colors={['#00FF80']}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBFC',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FBFC',
    marginTop: 50,
    gap: 16,
  },
  topNavText: {
    fontWeight: '500',
    fontFamily: 'Satoshi',
    fontSize: 20,
    color: '#2D3C52',
    lineHeight: 24,
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  emptyListContent: {
    flex: 1,
  },
  notificationCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#EDF3FC',
  },
  notificationContent: {
    gap: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  notificationTitle: {
    fontFamily: 'Satoshi',
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3C52',
    lineHeight: 24,
    flex: 1,
  },
  notificationContentText: {
    fontFamily: 'Satoshi',
    fontSize: 14,
    color: '#61728C',
    lineHeight: 20,
    marginTop: 4,
  },
  notificationTime: {
    fontFamily: 'Satoshi',
    fontSize: 12,
    color: '#61728C',
    marginTop: 4,
  },
  deleteAction: {
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 16,
    marginLeft: 12,
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: 'Satoshi',
    fontSize: 14,
    color: '#61728C',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontFamily: 'Satoshi',
    fontSize: 14,
    color: '#2D3C52',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDF3FC',
  },
  retryButtonText: {
    fontFamily: 'Satoshi',
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3C52',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontFamily: 'Satoshi',
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3C52',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Satoshi',
    fontSize: 14,
    color: '#61728C',
    textAlign: 'center',
    lineHeight: 20,
  },
});