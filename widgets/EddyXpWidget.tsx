import {
  HStack,
  Image,
  Link,
  ProgressView,
  Spacer,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  font,
  foregroundStyle,
  padding,
  progressViewStyle,
  tint,
  widgetAccentedRenderingMode,
  widgetURL,
} from "@expo/ui/swift-ui/modifiers";
import {
  createWidget,
  type WidgetEnvironment,
} from "expo-widgets";

type EddyXpWidgetProps = {
  totalXp: number;
  streak: number;
  progress: number;
  xpToNext: number;
  segmentLabel: string;
};

const accent = "#58CC02";

function EddyXpWidgetView(
  p: EddyXpWidgetProps,
  environment: WidgetEnvironment,
) {
  "widget";
  const isSmall = environment.widgetFamily === "systemSmall";
  const isDark = environment.colorScheme !== "light";
  const textPrimary = isDark ? "#FFFFFF" : "#1C1C1E";
  const textSecondary = isDark ? "#D1D1D6" : "#636366";
  const textTertiary = isDark ? "#8E8E93" : "#8E8E93";
  const progressValue =
    p.progress >= 0 && p.progress <= 1 ? p.progress : 0;

  const mascot = (
    <Image
      systemName="graduationcap.fill"
      color={accent}
      size={isSmall ? 28 : 40}
      modifiers={[widgetAccentedRenderingMode("fullColor")]}
    />
  );

  const xpLine = (
    <Text
      modifiers={[
        font({ size: isSmall ? 20 : 26, weight: "bold" }),
        foregroundStyle(textPrimary),
      ]}
    >
      {p.totalXp.toLocaleString()} XP
    </Text>
  );

  const streakLine = (
    <Text
      modifiers={[
        font({ size: isSmall ? 12 : 14, weight: "semibold" }),
        foregroundStyle(textSecondary),
      ]}
    >
      {`🔥 ${p.streak} day streak`}
    </Text>
  );

  const progressBlock = (
    <VStack spacing={4}>
      <ProgressView
        value={p.xpToNext > 0 ? progressValue : 1}
        modifiers={[progressViewStyle("linear"), tint(accent)]}
      />
      <Text
        modifiers={[
          font({ size: isSmall ? 10 : 12, weight: "regular" }),
          foregroundStyle(textTertiary),
        ]}
      >
        {p.xpToNext > 0
          ? `${p.xpToNext} XP to go · ${p.segmentLabel}`
          : p.segmentLabel}
      </Text>
    </VStack>
  );

  if (isSmall) {
    return (
      <VStack
        spacing={6}
        modifiers={[padding({ all: 12 }), widgetURL("edulearnv2://")]}
        alignment="leading"
      >
        <HStack spacing={8}>
          {mascot}
          <VStack spacing={2} alignment="leading">
            {xpLine}
            {streakLine}
          </VStack>
        </HStack>
        {progressBlock}
        <Spacer />
        <Link
          label="Open"
          destination="edulearnv2://"
          modifiers={[
            font({ size: 12, weight: "semibold" }),
            foregroundStyle(textPrimary),
          ]}
        />
      </VStack>
    );
  }

  return (
    <HStack
      spacing={12}
      modifiers={[padding({ all: 14 }), widgetURL("edulearnv2://")]}
      alignment="top"
    >
      {mascot}
      <VStack spacing={8} alignment="leading">
        <Text
          modifiers={[
            font({ size: 11, weight: "semibold" }),
            foregroundStyle(textSecondary),
          ]}
        >
          EduLearn
        </Text>
        {xpLine}
        {streakLine}
        {progressBlock}
        <HStack>
          <Spacer />
          <Link
            label="Open app"
            destination="edulearnv2://"
            modifiers={[
              font({ size: 12, weight: "semibold" }),
              foregroundStyle(textPrimary),
            ]}
          />
        </HStack>
      </VStack>
    </HStack>
  );
}

export default createWidget("EddyXpWidget", EddyXpWidgetView);
