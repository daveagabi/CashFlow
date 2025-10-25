# fix_openai_version.py
"""
Quick fix script for OpenAI library version issues
Run this if you're getting TypeError about 'proxies' parameter
"""

import subprocess
import sys

def check_openai_version():
    """Check installed OpenAI version"""
    try:
        import openai
        version = openai.__version__
        print(f"✓ OpenAI library version: {version}")
        
        # Parse version
        major_version = int(version.split('.')[0])
        
        if major_version >= 1:
            print("✓ You have OpenAI >= 1.0.0 (new API)")
            return True
        else:
            print("⚠️  You have OpenAI < 1.0.0 (old API)")
            print("   Consider upgrading for better compatibility")
            return False
    
    except ImportError:
        print("❌ OpenAI library not installed!")
        return None


def fix_installation():
    """Fix OpenAI installation"""
    print("\n" + "="*70)
    print("🔧 FIXING OPENAI INSTALLATION")
    print("="*70 + "\n")
    
    print("This will:")
    print("  1. Uninstall current OpenAI library")
    print("  2. Install OpenAI >= 1.0.0 (latest stable)")
    print()
    
    response = input("Continue? (y/n): ").strip().lower()
    
    if response != 'y':
        print("❌ Fix cancelled")
        return False
    
    print("\n📦 Uninstalling old version...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "uninstall", "-y", "openai"])
        print("✓ Uninstalled successfully")
    except Exception as e:
        print(f"⚠️  Uninstall warning: {e}")
    
    print("\n📦 Installing OpenAI >= 1.0.0...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "openai>=1.0.0"])
        print("✓ Installed successfully")
        return True
    except Exception as e:
        print(f"❌ Installation failed: {e}")
        return False


def verify_fix():
    """Verify the fix worked"""
    print("\n" + "="*70)
    print("🧪 VERIFYING FIX")
    print("="*70 + "\n")
    
    try:
        # Try importing with new API
        from openai import OpenAI
        print("✓ Successfully imported OpenAI with new API")
        
        # Try creating client (without API key, just to test)
        try:
            client = OpenAI(api_key="test-key")
            print("✓ Client initialization works")
            return True
        except Exception as e:
            if "api_key" in str(e).lower():
                print("✓ Client initialization works (API key issue is normal)")
                return True
            else:
                print(f"⚠️  Client test warning: {e}")
                return False
    
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False


def main():
    """Main function"""
    print("\n" + "="*70)
    print("🔧 OPENAI VERSION FIX UTILITY")
    print("="*70 + "\n")
    
    print("This script fixes the 'proxies' TypeError by ensuring")
    print("you have the correct OpenAI library version.\n")
    
    # Check current version
    current_version_ok = check_openai_version()
    
    if current_version_ok is None:
        print("\n❌ OpenAI library not found!")
        print("Installing from scratch...")
        if fix_installation():
            verify_fix()
    
    elif current_version_ok:
        print("\n✅ Your OpenAI version is correct!")
        print("   The code has been updated to handle both old and new APIs.")
        print("   You should be good to go!")
    
    else:
        print("\nYou have an older version. Would you like to upgrade?")
        if fix_installation():
            verify_fix()
    
    print("\n" + "="*70)
    print("📝 NEXT STEPS")
    print("="*70)
    print()
    print("1. Make sure you have updated ai/ai_client.py with the new code")
    print("2. Try running your tests again:")
    print("   python ai/tests/run_tests.py --fallback-only")
    print("   python ai/tests/run_tests.py --save")
    print()
    print("If you still have issues, try:")
    print("   pip uninstall openai")
    print("   pip install openai==1.3.0")
    print()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nManual fix:")
        print("  pip uninstall openai")
        print("  pip install openai>=1.0.0")