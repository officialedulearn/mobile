import type { CommunityMember } from "@/interface/Community";

export const parseMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex);
  if (!matches) return [];

  return matches.map((match) => match.substring(1));
};

export const getActiveMentionRange = (
  text: string,
  cursor: number,
): { start: number; query: string } | null => {
  const safeCursor = Math.min(Math.max(0, cursor), text.length);
  const before = text.slice(0, safeCursor);
  const at = before.lastIndexOf("@");
  if (at === -1) return null;
  if (at > 0 && !/\s/.test(before[at - 1] ?? "")) return null;
  const afterAt = before.slice(at + 1);
  if (/\s/.test(afterAt)) return null;
  if (afterAt.length > 48) return null;
  return { start: at, query: afterAt };
};

export const filterMembersForMention = (
  members: CommunityMember[],
  query: string,
): CommunityMember[] => {
  const q = query.toLowerCase();
  const scored = members
    .map((m) => {
      const u = m.user.username.toLowerCase();
      const n = m.user.name.toLowerCase();
      let score = 100;
      if (!q) {
        score = 0;
      } else if (u.startsWith(q) || n.startsWith(q)) {
        score = 0;
      } else if (u.includes(q) || n.includes(q)) {
        score = 1;
      } else {
        score = -1;
      }
      return { m, score };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return a.m.user.username.localeCompare(b.m.user.username);
    });
  return scored.slice(0, 20).map((x) => x.m);
};
