#!/usr/bin/env python3
import re
import glob

# Fix Array<T> to T[] and empty object types
for file in glob.glob("app/**/*.tsx", recursive=True):
    with open(file, 'r') as f:
        content = f.read()
    
    original = content
    
    # Fix Array<Type> to Type[]
    content = re.sub(r'Array<(\w+)>', r'\1[]', content)
    
    # Fix type Props = {} to type Props = Record<string, never>
    content = re.sub(r'type Props = \{\}', 'type Props = Record<string, never>', content)
    
    # Fix other empty object types in type definitions
    content = re.sub(r'type (\w+) = \{\}', r'type \1 = Record<string, never>', content)
    
    if content != original:
        with open(file, 'w') as f:
            f.write(content)
        print(f"Fixed {file}")

print("Done!")
