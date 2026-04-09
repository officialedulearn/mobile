#!/usr/bin/env python3
import re

# Fix unused error variables - replace "error" with "_error" in catch blocks
files_with_error = [
    "app/(tabs)/hub.tsx",
    "app/(tabs)/profile.tsx",
    "app/(tabs)/quizzes.tsx",
    "app/connectX.tsx",
    "app/nft/[id].tsx",
    "app/nfts.tsx",
    "components/chat/MessageItem.tsx",
]

for file_path in files_with_error:
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Replace catch (error) with catch (_error) and catch (error: any) with catch (_error: any)
        content = re.sub(r'\} catch \(error\)', r'} catch (_error)', content)
        content = re.sub(r'\} catch \(error: any\)', r'} catch (_error: any)', content)
        
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Fixed error variables in {file_path}")
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")

# Remove specific unused imports and variables
specific_fixes = {
    "app/_layout.tsx": [
        (r"const \[isNewUser, setIsNewUser\] = useState\(true\);", ""),
    ],
    "app/auth/index.tsx": [
        (r"import OAuthButtons from '@/components/auth/OAuthButtons';\n", ""),
    ],
    "app/auth/verifyOtp.tsx": [
        (r", getUserError: getUserError1", ""),
        (r", getUserError", ""),
    ],
    "app/connectX.tsx": [
        (r"import \{ UserService \} from '@/services/auth.service';\n", ""),
        (r"import \{ useNotifications \} from '@/hooks/useNotifications';\n", ""),
        (r"    updatedUser;", "    // updatedUser;"),
    ],
    "app/joinCommunity.tsx": [
        (r"const \[success, setSuccess\] = useState\(false\);", ""),
        (r"import \{ StatusBar \} from 'react-native';", ""),
    ],
    "app/nfts.tsx": [
        (r", useEffect", ""),
    ],
    "app/roadmaps/\[id\].tsx": [
        (r"import \{ Share \} from 'react-native';\n", ""),
    ],
    "app/leaderboard.tsx": [
        (r"// eslint-disable-next-line react-hooks/exhaustive-deps\n  useEffect", "  useEffect"),
    ],
    "app/roadmaps/\[id\].tsx": [
        (r"// eslint-disable-next-line react-hooks/exhaustive-deps\n    const handleReloadRoadmap", "    const handleReloadRoadmap"),
    ],
}

for file_path, replacements in specific_fixes.items():
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        original = content
        for pattern, replacement in replacements:
            content = re.sub(pattern, replacement, content)
        
        if content != original:
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"Fixed {file_path}")
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")

# Fix duplicate imports in joinCommunity.tsx
try:
    with open("app/joinCommunity.tsx", 'r') as f:
        lines = f.readlines()
    
    # Remove duplicate react-native import
    seen_rn_import = False
    new_lines = []
    for line in lines:
        if 'from "react-native"' in line or "from 'react-native'" in line:
            if not seen_rn_import:
                new_lines.append(line)
                seen_rn_import = True
        else:
            new_lines.append(line)
    
    with open("app/joinCommunity.tsx", 'w') as f:
        f.writelines(new_lines)
    print("Fixed duplicate imports in app/joinCommunity.tsx")
except Exception as e:
    print(f"Error fixing joinCommunity.tsx: {e}")

print("\nDone!")
