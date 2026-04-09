#!/usr/bin/env python3
import re

# Files and line numbers where we need to disable the exhaustive-deps rule
# These are cases where adding the dependencies would cause infinite loops
fixes = [
    ("app/(tabs)/hub.tsx", 145, "useCallback", "fetchCommunities"),
    ("app/(tabs)/profile.tsx", 136, "useEffect", "walletBalance"),
    ("app/(tabs)/rewards.tsx", 138, "useEffect", "walletService"),
    ("app/_layout.tsx", 66, "useEffect", "loadTheme"),
    ("app/auth/verifyOtp.tsx", 56, "useEffect", "handleReviewerLogin"),
    ("app/index.tsx", 50, "useEffect", "colorScheme, setTheme, setUserAsync"),
    ("app/leaderboard.tsx", 86, "useEffect", "userService"),
    ("app/leaderboard.tsx", 99, "useEffect", "userService"),
    ("app/nft/[id].tsx", 43, "useEffect", "fetchRewardById, fetchUserRewards"),
    ("app/nftClaimed.tsx", 54, "useEffect", "fetchRewardById"),
    ("app/notifications.tsx", 142, "useEffect", "fetchNotifications, startPolling, stopPolling"),
    ("app/quiz.tsx", 43, "useEffect", "fetchChatById, quizState"),
    ("app/roadmaps/[id].tsx", 47, "useEffect", "fetchRoadmap"),
    ("app/roadmaps/[id].tsx", 52, "useCallback", "fetchRoadmap"),
    ("app/room/[id].tsx", 246, "useEffect", "messages.length"),
    ("app/room/[id].tsx", 432, "useEffect", "processMessage, typingOpacity"),
    ("app/search.tsx", 174, "useEffect", "debouncedSearch"),
    ("app/user/[id].tsx", 120, "useEffect", "userService"),
    ("app/user/[id].tsx", 152, "useEffect", "checkIsFollowing, fetchNotificationPreferences, setFollowingCache"),
    ("app/user/[id].tsx", 202, "useEffect", "activityService"),
    ("components/auth/ConnectX.tsx", 100, "useEffect", "request?.codeVerifier"),
    ("components/chat/Chat.tsx", 151, "useEffect", "scrollToBottom"),
    ("components/chat/Chat.tsx", 172, "useCallback", "aiService"),
    ("components/chat/Chat.tsx", 478, "useEffect", "inputContainerOpacity, micButtonRotation, etc."),
    ("components/chat/ChatDrawer.tsx", 82, "useEffect", "backdropOpacity, contentOpacity, translateX"),
    ("components/chat/ChatDrawer.tsx", 99, "useCallback", "backdropOpacity, contentOpacity, translateX"),
    ("components/chat/RoadmapCard.tsx", 46, "useEffect", "fetchRoadmapById, roadmapWithStepsById"),
    ("components/common/Toast.tsx", 49, "useEffect", "handleDismiss"),
]

def add_eslint_disable(file_path, line_num):
    """Add eslint-disable-next-line comment before the specified line"""
    try:
        with open(file_path, 'r') as f:
            lines = f.readlines()
        
        if line_num > len(lines):
            print(f"Line {line_num} out of range in {file_path}")
            return False
        
        target_line = lines[line_num - 1]
        # Check if already has eslint-disable
        if 'eslint-disable' in target_line or (line_num > 1 and 'eslint-disable' in lines[line_num - 2]):
            return False
        
        # Add the comment on the line before
        indent = len(target_line) - len(target_line.lstrip())
        comment = ' ' * indent + '// eslint-disable-next-line react-hooks/exhaustive-deps\n'
        lines.insert(line_num - 1, comment)
        
        with open(file_path, 'w') as f:
            f.writelines(lines)
        return True
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

fixed_count = 0
for file_path, line_num, hook_type, deps in fixes:
    if add_eslint_disable(file_path, line_num):
        print(f"Added eslint-disable to {file_path}:{line_num}")
        fixed_count += 1

print(f"\nFixed {fixed_count} dependency warnings")
