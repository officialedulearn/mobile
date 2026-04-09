#!/bin/bash
set -e

echo "Fixing import paths..."

# Fix BackButton imports (should be @/components/common/backButton)
find app -name "*.tsx" -type f -exec sed -i "s|from '@/components/backButton'|from '@/components/common/backButton'|g" {} \;
find app -name "*.tsx" -type f -exec sed -i 's|from "@/components/backButton"|from "@/components/common/backButton"|g' {} \;

# Fix OAuthButtons import
sed -i "s|from '@/components/OAuthButtons'|from '@/components/auth/OAuthButtons'|g" app/auth/index.tsx

# Fix ConnectX import  
sed -i "s|from '@/components/ConnectX'|from '@/components/auth/ConnectX'|g" app/connectX.tsx

# Fix Toast import
sed -i "s|from '@/components/Toast'|from '@/components/common/Toast'|g" app/wallet.tsx

# Fix SolanaQR import
sed -i "s|from '@/components/SolanaQR'|from '@/components/wallet/SolanaQR'|g" app/wallet.tsx

# Fix QuizRefreshModal import
sed -i "s|from '@/components/QuizRefreshModal'|from '@/components/quiz/QuizRefreshModal'|g" app/quiz.tsx

# Fix AnimatedPressable import
sed -i "s|from '@/components/AnimatedPressable'|from '@/components/common/AnimatedPressable'|g" app/room/\[id\].tsx

echo "Import paths fixed!"
