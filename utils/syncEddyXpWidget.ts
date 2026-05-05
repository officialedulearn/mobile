/** iOS: widget extension is generated at native build time (`eas build -p ios` or `expo prebuild` on macOS). */
import { User } from "@/interface/User";
import { getMilestoneProgress } from "@/utils/xpMilestones";
import { Platform } from "react-native";

export function syncEddyXpWidgetFromUser(user: User | null) {
  if (Platform.OS !== "ios") return;
  const mod = require("../widgets/EddyXpWidget") as {
    default: { updateSnapshot: (p: Record<string, unknown>) => void };
  };
  if (!user) {
    mod.default.updateSnapshot({
      totalXp: 0,
      streak: 0,
      progress: 0,
      xpToNext: 0,
      segmentLabel: "Open EduLearn",
    });
    return;
  }
  const xp = user.xp || 0;
  const m = getMilestoneProgress(xp);
  mod.default.updateSnapshot({
    totalXp: xp,
    streak: user.streak || 0,
    progress: m.progress,
    xpToNext: m.xpNeeded,
    segmentLabel: m.segmentLabel,
  });
}
