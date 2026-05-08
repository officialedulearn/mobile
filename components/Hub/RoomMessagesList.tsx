import type { RoomMessageWithUI } from "@/interface/Community";
import type { LegendListRef, LegendListRenderItemProps } from "@legendapp/list";
import { KeyboardChatLegendList } from "@legendapp/list/keyboard-chat";
import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { RoomMessageItem } from "./RoomMessageItem";
import { styles } from "./room.styles";

type Theme = "dark" | "light";

const MAINTAIN_SCROLL_AT_END = {
  animated: false,
  on: {
    dataChange: true,
    itemLayout: true,
    layout: true,
  },
} as const;

type Props = {
  listRef: React.RefObject<LegendListRef | null>;
  reversedMessages: RoomMessageWithUI[];
  theme: Theme;
  isLoadingMore: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  footerHeight: number;
  composerHeight: SharedValue<number>;
  onLoadOlder: () => void;
  onLongPress: (msg: RoomMessageWithUI) => void;
};

export function RoomMessagesList({
  listRef,
  reversedMessages,
  theme,
  isLoadingMore,
  refreshing,
  onRefresh,
  footerHeight,
  composerHeight,
  onLoadOlder,
  onLongPress,
}: Props) {
  const listHeader = useMemo(
    () =>
      isLoadingMore ? (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator
            size="small"
            color={theme === "dark" ? "#00FF80" : "#000"}
          />
        </View>
      ) : null,
    [isLoadingMore, theme],
  );

  const anchoredEndSpace = useMemo(
    () =>
      reversedMessages.length > 0
        ? {
            anchorIndex: reversedMessages.length - 1,
            anchorOffset: 16,
          }
        : undefined,
    [reversedMessages.length],
  );

  const extraData = useMemo(() => ({ theme }), [theme]);

  const renderItem = useCallback(
    ({ item, index }: LegendListRenderItemProps<RoomMessageWithUI>) => (
      <RoomMessageItem
        msg={item}
        prevMsg={index > 0 ? reversedMessages[index - 1] : undefined}
        theme={theme}
        onLongPress={onLongPress}
      />
    ),
    [onLongPress, reversedMessages, theme],
  );

  const keyExtractor = useCallback((item: RoomMessageWithUI) => item.id, []);

  return (
    <View
      style={[
        styles.messagesContainer,
        theme === "dark" && styles.darkMessagesContainer,
      ]}
    >
      <KeyboardChatLegendList
        ref={listRef}
        alignItemsAtEnd
        anchoredEndSpace={anchoredEndSpace}
        applyWorkaroundForContentInsetHitTestBug
        contentContainerStyle={styles.messagesContent}
        data={reversedMessages}
        estimatedItemSize={100}
        extraContentPadding={composerHeight}
        extraData={extraData}
        initialScrollAtEnd
        keyboardDismissMode="interactive"
        keyboardLiftBehavior="always"
        keyboardShouldPersistTaps="handled"
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        maintainScrollAtEnd={MAINTAIN_SCROLL_AT_END}
        maintainScrollAtEndThreshold={0.16}
        maintainVisibleContentPosition
        offset={footerHeight}
        onRefresh={onRefresh}
        refreshing={refreshing}
        recycleItems={false}
        renderItem={renderItem}
        onStartReached={() => {
          onLoadOlder();
        }}
        onStartReachedThreshold={0.15}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      />
    </View>
  );
}
