#!/bin/bash
set -e

echo "Fixing empty object types and escaped quotes..."

# Fix empty object types {} to Record<string, never>
find app -name "*.tsx" -type f -exec sed -i 's/type Props = {};/type Props = Record<string, never>;/g' {} \;

# Fix unescaped quotes in JSX
# app/(tabs)/profile.tsx
sed -i "s/You've/You\&apos;ve/g" app/\(tabs\)/profile.tsx

# app/(tabs)/quizzes.tsx
sed -i "s/You've/You\&apos;ve/g" app/\(tabs\)/quizzes.tsx
sed -i "s/Let's/Let\&apos;s/g" app/\(tabs\)/quizzes.tsx

# app/(tabs)/rewards.tsx
sed -i "s/You've/You\&apos;ve/g" app/\(tabs\)/rewards.tsx
sed -i "s/you've/you\&apos;ve/g" app/\(tabs\)/rewards.tsx

# app/auth/verifyOtp.tsx
sed -i "s/We've/We\&apos;ve/g" app/auth/verifyOtp.tsx
sed -i "s/you've/you\&apos;ve/g" app/auth/verifyOtp.tsx
sed -i "s/Didn't/Didn\&apos;t/g" app/auth/verifyOtp.tsx

# app/joinCommunity.tsx
sed -i "s/You're/You\&apos;re/g" app/joinCommunity.tsx
sed -i "s/you're/you\&apos;re/g" app/joinCommunity.tsx
sed -i "s/Let's/Let\&apos;s/g" app/joinCommunity.tsx

# app/nft/[id].tsx
sed -i "s/You've/You\&apos;ve/g" app/nft/\[id\].tsx

# app/nftClaimed.tsx
sed -i "s/You've/You\&apos;ve/g" app/nftClaimed.tsx

# app/nfts.tsx
sed -i "s/You've/You\&apos;ve/g" app/nfts.tsx
sed -i "s/you've/you\&apos;ve/g" app/nfts.tsx

# app/notifications.tsx
sed -i "s/You're/You\&apos;re/g" app/notifications.tsx

# app/subscription.tsx
sed -i "s/You'll/You\&apos;ll/g" app/subscription.tsx
# Fix Array<T> to T[]
sed -i 's/Array<any>/any[]/g' app/subscription.tsx

echo "Types and quotes fixed!"
