#!/usr/bin/env python3
"""
Simple validation script to check if all required files exist and have basic structure
"""

import os
import sys

def check_project_structure():
    """Check if all required files exist"""
    required_files = [
        'app.py',
        'models.py', 
        'requirements.txt',
        'Dockerfile',
        'docker-compose.yml',
        'backup_db.sh',
        '.env.example',
        'README.md',
        'tests/test_api.py',
        'nginx/crm.conf'
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print(f"❌ Missing files: {missing_files}")
        return False
    
    print("✅ All required files present")
    return True

def check_app_structure():
    """Check if app.py has required content"""
    try:
        with open('app.py', 'r') as f:
            content = f.read()
        
        required_patterns = [
            'create_app',
            'require_api_key',
            '/api/health',
            '/api/contacts',
            'Flask',
            'SQLAlchemy'
        ]
        
        missing_patterns = []
        for pattern in required_patterns:
            if pattern not in content:
                missing_patterns.append(pattern)
        
        if missing_patterns:
            print(f"❌ Missing patterns in app.py: {missing_patterns}")
            return False
        
        print("✅ app.py structure looks good")
        return True
    except Exception as e:
        print(f"❌ Error checking app.py: {e}")
        return False

def main():
    print("🔍 Validating CRM SQLite project structure...")
    
    if not os.path.exists('app.py'):
        print("❌ Not in project directory or app.py missing")
        sys.exit(1)
    
    structure_ok = check_project_structure()
    app_ok = check_app_structure()
    
    if structure_ok and app_ok:
        print("✅ Project validation successful!")
        print("📦 Ready for testing and deployment")
        return True
    else:
        print("❌ Project validation failed")
        return False

if __name__ == '__main__':
    main()