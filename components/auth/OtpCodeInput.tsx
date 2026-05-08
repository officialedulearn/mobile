import React, { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, TextInput, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const GAP = 10;
const CELL_HEIGHT = 54;
const SPRING = { damping: 22, stiffness: 260, mass: 0.85 };

type ThemeMode = "light" | "dark";

type OtpCodeInputProps = {
  value: string;
  onChange: (next: string) => void;
  theme: ThemeMode;
  editable?: boolean;
  autoFocus?: boolean;
};

export default function OtpCodeInput({
  value,
  onChange,
  theme,
  editable = true,
  autoFocus = true,
}: OtpCodeInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [rowWidth, setRowWidth] = useState(0);
  const slideX = useSharedValue(0);
  const cellWShared = useSharedValue(0);
  const isDark = theme === "dark";

  const cellW = rowWidth > 0 ? (rowWidth - GAP * 5) / 6 : 0;
  const activeIndex = Math.min(value.length, 5);

  useEffect(() => {
    cellWShared.value = cellW;
  }, [cellW, cellWShared]);

  useEffect(() => {
    if (cellW <= 0) return;
    slideX.value = withSpring(activeIndex * (cellW + GAP), SPRING);
  }, [activeIndex, cellW, slideX]);

  useEffect(() => {
    if (!autoFocus) return;
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [autoFocus]);

  const sliderStyle = useAnimatedStyle(() => ({
    width: cellWShared.value,
    transform: [{ translateX: slideX.value }],
  }));

  const onRowLayout = (e: LayoutChangeEvent) => {
    setRowWidth(e.nativeEvent.layout.width);
  };

  const ringColor = isDark ? "#00FF80" : "#2563EB";
  const cellBg = isDark ? "#1A1A1A" : "#ECEEF2";
  const digitColor = isDark ? "#E0E0E0" : "#111827";

  const cellStyle = () => [
    styles.cellSlot,
    {
      width: cellW || undefined,
      flex: cellW > 0 ? undefined : 1,
      height: CELL_HEIGHT,
      borderRadius: 14,
      backgroundColor: cellBg,
    },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.row} onLayout={onRowLayout}>
        <View style={styles.layers} pointerEvents="box-none">
          <View style={styles.bgRow}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={`bg-${i}`} style={cellStyle()} />
            ))}
          </View>
          {cellW > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.slideRing,
                {
                  height: CELL_HEIGHT,
                  borderColor: ringColor,
                  borderRadius: 14,
                },
                sliderStyle,
              ]}
            />
          ) : null}
          <View style={styles.digitRow} pointerEvents="none">
            {Array.from({ length: 6 }).map((_, i) => {
              const ch = value[i] ?? "";
              return (
                <View key={`d-${i}`} style={cellStyle()}>
                  {ch ? (
                    <Animated.Text
                      key={`${i}-${ch}`}
                      entering={FadeIn.duration(160)}
                      exiting={FadeOut.duration(90)}
                      style={[styles.digit, { color: digitColor }]}
                    >
                      {ch}
                    </Animated.Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={(t) => onChange(t.replace(/[^0-9]/g, "").slice(0, 6))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={6}
          editable={editable}
          caretHidden
          style={styles.hiddenInput}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  row: {
    position: "relative",
    minHeight: CELL_HEIGHT,
  },
  layers: {
    width: "100%",
    minHeight: CELL_HEIGHT,
    position: "relative",
  },
  bgRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    gap: GAP,
    alignItems: "center",
  },
  digitRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    gap: GAP,
    alignItems: "center",
    zIndex: 3,
  },
  cellSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
  slideRing: {
    position: "absolute",
    left: 0,
    top: 0,
    borderWidth: 2,
    backgroundColor: "transparent",
    zIndex: 2,
  },
  digit: {
    fontSize: 22,
    fontFamily: "Satoshi-Medium",
    fontVariant: ["tabular-nums"],
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    zIndex: 10,
  },
});
