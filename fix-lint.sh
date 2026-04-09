#!/bin/bash
set -e

echo "Starting lint fixes..."

# Fix 1: Fix component function names (lowercase to PascalCase) - these must be React components
# identity.tsx
sed -i 's/^export default function identity()/export default function Identity()/g' app/auth/identity.tsx

# verifyOtp.tsx  
sed -i 's/^export default function verifyOtp()/export default function VerifyOtp()/g' app/auth/verifyOtp.tsx

# editProfile.tsx
sed -i 's/^export default function editProfile()/export default function EditProfile()/g' app/editProfile.tsx

# feedback.tsx
sed -i 's/^export default function feedback()/export default function Feedback()/g' app/feedback.tsx

# joinCommunity.tsx
sed -i 's/^export default function joinCommunity()/export default function JoinCommunity()/g' app/joinCommunity.tsx

# nftPage
sed -i 's/^export default function nftPage()/export default function NftPage()/g' app/nft/\[id\].tsx

# nftClaimed
sed -i 's/^export default function nftClaimed()/export default function NftClaimed()/g' app/nftClaimed.tsx

# settings
sed -i 's/^export default function settings()/export default function Settings()/g' app/settings.tsx

# theme
sed -i 's/^export default function theme()/export default function Theme()/g' app/theme.tsx

echo "Fixed component naming..."
