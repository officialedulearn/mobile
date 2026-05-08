import { useTheme } from "@/hooks/useTheme";
import type { ActivityPagination } from "@/types/activity.types";
import { Design } from "@/utils/design";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Slot = number | "ellipsis";

function getActivityPaginationSlots(
  currentPage: number,
  totalPages: number,
): Slot[] {
  if (totalPages <= 1) {
    return [1];
  }
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}

type Props = {
  pagination: ActivityPagination;
  isLoading: boolean;
  onGoToPage: (page: number) => void;
};

export function ActivityPaginationBar({
  pagination,
  isLoading,
  onGoToPage,
}: Props) {
  const { colors, isDark } = useTheme();
  const {
    page: currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
  } = pagination;

  const slots = useMemo(
    () => getActivityPaginationSlots(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const navIconColor = colors.textSecondary;
  const inactivePageColor = colors.textSecondary;
  const activePageFg = colors.slate;
  const activePageBg = isDark ? colors.surfaceElevated : colors.surfaceMuted;
  const navBg = isDark ? colors.surfaceElevated : colors.surfaceMuted;

  const canPrev = hasPrevPage && currentPage > 1 && !isLoading;
  const canNext = hasNextPage && currentPage < totalPages && !isLoading;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderMuted,
        },
      ]}
    >
      <View style={styles.row}>
        <TouchableOpacity
          accessibilityLabel="Previous page"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canPrev }}
          disabled={!canPrev}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => onGoToPage(currentPage - 1)}
          style={[
            styles.navButton,
            {
              backgroundColor: navBg,
              borderColor: colors.borderMuted,
              opacity: canPrev ? 1 : 0.45,
            },
          ]}
        >
          <Ionicons color={navIconColor} name="chevron-back" size={20} />
        </TouchableOpacity>

        <View style={styles.pages}>
          {slots.map((slot, index) => {
            const key = slot === "ellipsis" ? `e-${index}` : `p-${slot}`;
            if (slot === "ellipsis") {
              return (
                <View key={key} style={styles.pageCell}>
                  <Text
                    style={[styles.pageInactive, { color: inactivePageColor }]}
                  >
                    ...
                  </Text>
                </View>
              );
            }

            const isActive = slot === currentPage;
            return (
              <TouchableOpacity
                key={key}
                accessibilityLabel={`Page ${slot}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive, disabled: isLoading }}
                disabled={isLoading || isActive}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                onPress={() => onGoToPage(slot)}
                style={[
                  styles.pageCell,
                  isActive && {
                    backgroundColor: activePageBg,
                  },
                ]}
              >
                <Text
                  style={
                    isActive
                      ? [styles.pageActive, { color: activePageFg }]
                      : [styles.pageInactive, { color: inactivePageColor }]
                  }
                >
                  {slot}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          accessibilityLabel="Next page"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canNext }}
          disabled={!canNext}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => onGoToPage(currentPage + 1)}
          style={[
            styles.navButton,
            {
              backgroundColor: navBg,
              borderColor: colors.borderMuted,
              opacity: canNext ? 1 : 0.45,
            },
          ]}
        >
          <Ionicons color={navIconColor} name="chevron-forward" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignSelf: "stretch",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: Design.spacing.sm,
    paddingHorizontal: Design.spacing.md,
    paddingVertical: Design.spacing.sm,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 40,
  },
  navButton: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 35,
  },
  pages: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    justifyContent: "center",
  },
  pageCell: {
    alignItems: "center",
    borderRadius: 8,
    height: 32,
    justifyContent: "center",
    minWidth: 32,
    paddingHorizontal: 4,
  },
  pageActive: {
    fontFamily: Design.typography.fontFamily.satoshi.bold,
    fontSize: 11.2,
    fontWeight: Design.typography.fontWeight.bold,
  },
  pageInactive: {
    fontFamily: Design.typography.fontFamily.satoshi.regular,
    fontSize: Design.typography.fontSize.sm,
    fontWeight: Design.typography.fontWeight.regular,
    lineHeight: 24,
  },
});
