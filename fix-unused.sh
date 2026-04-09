#!/bin/bash
set -e

echo "Fixing unused imports and variables..."

# app/(tabs)/chat.tsx - Remove useUserStore
sed -i "s/import useUserStore from '@\/core\/userState';//g" app/\(tabs\)/chat.tsx
# Fix Array<Message> to Message[]
sed -i 's/Array<Message>/Message[]/g' app/\(tabs\)/chat.tsx

# app/(tabs)/quizzes.tsx - Remove unused imports
sed -i "/import { QuizCard } from '@\/components\/quiz\/QuizCard';/d" app/\(tabs\)/quizzes.tsx

# app/(tabs)/rewards.tsx - Remove unused imports
sed -i 's/ActivityIndicator,//' app/\(tabs\)/rewards.tsx
sed -i "/import { LinearGradient } from 'expo-linear-gradient';/d" app/\(tabs\)/rewards.tsx
sed -i "/import { Design } from '@\/assets\/images\/design\/Design';/d" app/\(tabs\)/rewards.tsx

# app/auth/index.tsx - Remove unused imports
sed -i "/import { Route } from '@\/types';/d" app/auth/index.tsx
sed -i "/import OAuthButtons from '@\/components\/auth\/OAuthButtons';/d" app/auth/index.tsx

# app/index.tsx - Remove unused imports
sed -i "/import { UserService } from '@\/services\/auth.service';/d" app/index.tsx
sed -i "s/, useState//" app/index.tsx
sed -i "/import { useNotifications } from '@\/hooks\/useNotifications';/d" app/index.tsx

# app/joinCommunity.tsx - Remove StatusBar
sed -i 's/StatusBar, //' app/joinCommunity.tsx

# app/nftClaimed.tsx - Remove Platform and Share
sed -i 's/, Platform//' app/nftClaimed.tsx
sed -i 's/, Share//' app/nftClaimed.tsx

# app/nfts.tsx - Remove ImageSourcePropType and useEffect
sed -i 's/ImageSourcePropType,//' app/nfts.tsx
sed -i 's/, useEffect//' app/nfts.tsx

# app/search.tsx - Remove 'use' and 'theme'
sed -i "s/, use//" app/search.tsx

# app/theme.tsx - Remove useState
sed -i "s/, useState//" app/theme.tsx

# app/wallet.tsx - Remove Linking and router
sed -i 's/Linking,//' app/wallet.tsx
sed -i "/import { router } from 'expo-router';/d" app/wallet.tsx

# app/auth/welcome.tsx - Remove useColorScheme
sed -i "s/, useColorScheme//" app/auth/welcome.tsx

# components/common/Toast.tsx - Remove useUserStore
sed -i "/import useUserStore from '@\/core\/userState';/d" components/common/Toast.tsx

echo "Unused imports removed!"
