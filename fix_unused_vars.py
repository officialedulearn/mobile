#!/usr/bin/env python3
import re

# Define files and their unused variables to fix
fixes = {
    "app/(tabs)/profile.tsx": [
        (r"import { Roadmap } from '@/interface/Roadmap';", ""),
        (r"import { Design } from '@/assets/images/design/Design';", ""),
        (r"const isDark = theme === 'dark';", ""),
        (r"const screenStyles = useScreenStyles\(\);", ""),
        (r"const lastSignIn = profile\.metadata\.last_sign_in_at;", ""),
        (r"const \[activeTokenUtilIndex, setActiveTokenUtilIndex\] = useState\(0\);", ""),
        (r"const \[isBurning, setIsBurning\] = useState\(false\);", ""),
        (r"const \[isStaking, setIsStaking\] = useState\(false\);", ""),
        (r"const \[showEDLNPopover, setShowEDLNPopover\] = useState\(false\);", ""),
    ],
    "app/(tabs)/quizzes.tsx": [
        (r"const \[activeIndex, setActiveIndex\] = useState\(0\);", ""),
    ],
    "app/(tabs)/rewards.tsx": [
        (r"const isDark = theme === 'dark';", ""),
        (r"const screenStyles = useScreenStyles\(\);", ""),
        (r"const \[claimingEDLN, setClaimingEDLN\] = useState\(false\);", ""),
        (r"const \[claimingSOL, setClaimingSOL\] = useState\(false\);", ""),
        (r"const \[loadingEarnings, setLoadingEarnings\] = useState\(false\);", ""),
    ],
    "app/_layout.tsx": [
        (r"const \[isNewUser, setIsNewUser\] = useState\(true\);", ""),
    ],
    "app/auth/identity.tsx": [
        (r"const updatedUser = ", ""),
    ],
    "app/auth/index.tsx": [
        (r", setOauthLoading", ""),
    ],
    "app/auth/verifyOtp.tsx": [
        (r", getUserError", ""),
    ],
    "app/joinCommunity.tsx": [
        (r"const \[success, setSuccess\] = useState\(false\);", ""),
    ],
    "app/settings.tsx": [
        (r"const payPro = ", "const _payPro = "),
        (r"const exportPrivateKey = ", "const _exportPrivateKey = "),
    ],
    "app/user/[id].tsx": [
        (r"const joinedAt = ", ""),
        (r"const \[isLoading, setIsLoading\] = useState\(false\);", ""),
    ],
    "app/wallet.tsx": [
        (r"const userService = ", ""),
        (r"const \[buySuccessModalVisible, setBuySuccessModalVisible\] = useState\(false\);", ""),
        (r"const \[transactionLink, setTransactionLink\] = useState\(''\);", ""),
        (r"const \[onrampSuccessModalVisible, setOnrampSuccessModalVisible\] = useState\(false\);", ""),
        (r"const \[completedTransactionDetails, setCompletedTransactionDetails\] = useState\(null as any\);", ""),
        (r"const \[burnSuccessModalVisible, setBurnSuccessModalVisible\] = useState\(false\);", ""),
    ],
}

for file_path, patterns in fixes.items():
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        original = content
        for pattern, replacement in patterns:
            content = re.sub(pattern + r'\n?', replacement + '\n' if replacement else '', content)
        
        if content != original:
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"Fixed {file_path}")
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")

print("Done!")
