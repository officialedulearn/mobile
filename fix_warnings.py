#!/usr/bin/env python3
import re

# Files and lines to fix
files_to_fix = {
    "app/(tabs)/profile.tsx": [
        "import { useScreenStyles } from '@/hooks/useScreenStyles';",
        "import { Design } from '@/assets/images/design/Design';",
        "const isDark = theme === 'dark';",
        "const lastSignIn = profile.metadata.last_sign_in_at;",
        "const [activeTokenUtilIndex, setActiveTokenUtilIndex] = useState(0);",
        "const [isBurning, setIsBurning] = useState(false);",
        "const [isStaking, setIsStaking] = useState(false);",
        "const [showEDLNPopover, setShowEDLNPopover] = useState(false);",
    ],
    "app/(tabs)/quizzes.tsx": [
        "const [isLoading, setIsLoading]",
    ],
    "app/(tabs)/rewards.tsx": [
        "import { useScreenStyles } from '@/hooks/useScreenStyles';",
        "import { Design } from '@/assets/images/design/Design';",
        "const isDark = theme === 'dark';",
    ],
    "app/_layout.tsx": [
        "const [isNewUser, setIsNewUser] = useState(true);",
    ],
    "app/auth/index.tsx": [
        "import OAuthButtons from '@/components/auth/OAuthButtons';",
    ],
    "app/auth/verifyOtp.tsx": [
        ", getUserError",
    ],
    "app/connectX.tsx": [
        "import { UserService } from '@/services/auth.service';",
        "import { useNotifications } from '@/hooks/useNotifications';",
    ],
    "app/joinCommunity.tsx": [
        "const [success, setSuccess] = useState(false);",
    ],
    "app/nfts.tsx": [
        ", useEffect",
    ],
    "app/roadmaps/[id].tsx": [
        "import { Share } from 'react-native';",
    ],
}

for file_path, patterns in files_to_fix.items():
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        original = content
        for pattern in patterns:
            # Remove the entire line if it's an import
            if pattern.startswith('import '):
                content = re.sub(pattern + r'\n', '', content)
            # Remove specific parts like ", getUserError"
            elif pattern.startswith(', '):
                content = content.replace(pattern, '')
            # Comment out variable declarations
            else:
                content = re.sub(pattern, f'// {pattern}', content)
        
        if content != original:
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"Fixed {file_path}")
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")

print("Done!")
