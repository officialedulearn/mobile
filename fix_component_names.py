#!/usr/bin/env python3
import re

# Files and their function names to fix
files = {
    "app/auth/verifyOtp.tsx": ("verifyOtp", "VerifyOtp"),
    "app/editProfile.tsx": ("editProfile", "EditProfile"),
    "app/feedback.tsx": ("feedback", "Feedback"),
    "app/joinCommunity.tsx": ("joinCommunity", "JoinCommunity"),
    "app/nft/[id].tsx": ("nftPage", "NftPage"),
    "app/nftClaimed.tsx": ("nftClaimed", "NftClaimed"),
    "app/settings.tsx": ("settings", "Settings"),
    "app/theme.tsx": ("theme", "Theme"),
}

for file_path, (old_name, new_name) in files.items():
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Replace const functionName = (props: Props) => {
        content = re.sub(
            rf'const {old_name} = \((.*?)\) => {{',
            rf'const {new_name} = (\1) => {{',
            content
        )
        
        # Replace export default old_name with export default new_name
        content = re.sub(
            rf'export default {old_name}',
            rf'export default {new_name}',
            content
        )
        
        # Replace unused props parameter
        content = re.sub(
            r'\(props: Props\)',
            r'(_props: Props)',
            content
        )
        
        with open(file_path, 'w') as f:
            f.write(content)
        
        print(f"Fixed {file_path}: {old_name} -> {new_name}")
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")

print("Done!")
