
import re
import os

file_path = r'c:\Users\HP\OneDrive\Desktop\yy stuff\projects\bhagG\src\data\chapter2.js'

if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
else:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"File read successfully. Length: {len(content)}")
    
    # Find all [ ... ]
    matches = re.finditer(r'\[(.*?)\]', content)
    
    count = 0
    for match in matches:
        text = match.group(1)
        if '-' in text and '.' in text:
            print(f"Found range: [{text}]")
            count += 1
    
    print(f"Total ranges found: {count}")

