export const XP_MILESTONES = {
  novice: 0,
  beginner: 500,
  intermediate: 1500,
  advanced: 3000,
  expert: 5000,
} as const;

const NEXT_TIER_LABEL: Record<number, string> = {
  500: "Beginner",
  1500: "Intermediate",
  3000: "Advanced",
  5000: "Expert",
};

export function getMilestoneProgress(currentXP: number) {
  const m = XP_MILESTONES;
  if (currentXP >= m.expert) {
    return {
      progress: 1,
      xpNeeded: 0,
      currentLevel: m.expert,
      nextLevel: m.expert,
      segmentLabel: "Top level",
    };
  }
  if (currentXP >= m.advanced) {
    return {
      progress:
        (currentXP - m.advanced) / (m.expert - m.advanced),
      xpNeeded: m.expert - currentXP,
      currentLevel: m.advanced,
      nextLevel: m.expert,
      segmentLabel: `Next: ${NEXT_TIER_LABEL[m.expert]}`,
    };
  }
  if (currentXP >= m.intermediate) {
    return {
      progress:
        (currentXP - m.intermediate) /
        (m.advanced - m.intermediate),
      xpNeeded: m.advanced - currentXP,
      currentLevel: m.intermediate,
      nextLevel: m.advanced,
      segmentLabel: `Next: ${NEXT_TIER_LABEL[m.advanced]}`,
    };
  }
  if (currentXP >= m.beginner) {
    return {
      progress:
        (currentXP - m.beginner) /
        (m.intermediate - m.beginner),
      xpNeeded: m.intermediate - currentXP,
      currentLevel: m.beginner,
      nextLevel: m.intermediate,
      segmentLabel: `Next: ${NEXT_TIER_LABEL[m.intermediate]}`,
    };
  }
  return {
    progress: currentXP / m.beginner,
    xpNeeded: m.beginner - currentXP,
    currentLevel: m.novice,
    nextLevel: m.beginner,
    segmentLabel: `Next: ${NEXT_TIER_LABEL[m.beginner]}`,
  };
}
