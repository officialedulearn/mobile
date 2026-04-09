#!/usr/bin/env python3
import re
import os

files_to_fix = [
    "app/(tabs)/profile.tsx",
    "app/(tabs)/quizzes.tsx",
    "app/(tabs)/rewards.tsx",
    "app/auth/verifyOtp.tsx",
    "app/joinCommunity.tsx",
    "app/nft/[id].tsx",
    "app/nftClaimed.tsx",
    "app/nfts.tsx",
    "app/notifications.tsx",
    "app/subscription.tsx",
]

replacements = [
    ("You've", "You&apos;ve"),
    ("you've", "you&apos;ve"),
    ("We've", "We&apos;ve"),
    ("we've", "we&apos;ve"),
    ("Let's", "Let&apos;s"),
    ("let's", "let&apos;s"),
    ("You're", "You&apos;re"),
    ("you're", "you&apos;re"),
    ("Didn't", "Didn&apos;t"),
    ("didn't", "didn&apos;t"),
    ("You'll", "You&apos;ll"),
    ("you'll", "you&apos;ll"),
    ("It's", "It&apos;s"),
    ("it's", "it&apos;s"),
]

for file_path in files_to_fix:
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            content = f.read()
        
        for old, new in replacements:
            content = content.replace(old, new)
        
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Fixed {file_path}")
    else:
        print(f"File not found: {file_path}")

print("Done fixing quotes!")
