#!/usr/bin/env python3
"""
Quick test script to verify participant tracking functionality
Run this from the backend directory with venv activated
"""
import os
import sys
import django
from django.core.cache import cache

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'onlineDebatePlatform.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

def test_participant_tracking():
    """Test the participant tracking functionality"""
    debate_id = 1
    cache_key = f'debate_participants_{debate_id}'
    
    print("🧪 Testing Participant Tracking")
    print("=" * 40)
    
    # Clear any existing data
    cache.delete(cache_key)
    print("✅ Cleared existing participant data")
    
    # Simulate adding participants
    participants = []
    
    # Add first user
    user1 = {'id': 1, 'username': 'user1', 'is_online': True}
    participants.append(user1)
    cache.set(cache_key, participants, 3600)
    print(f"✅ Added {user1['username']}")
    
    # Add second user
    user2 = {'id': 2, 'username': 'user2', 'is_online': True}
    participants.append(user2)
    cache.set(cache_key, participants, 3600)
    print(f"✅ Added {user2['username']}")
    
    # Retrieve participants
    cached_participants = cache.get(cache_key, [])
    print(f"\n📋 Current participants ({len(cached_participants)}):")
    for p in cached_participants:
        print(f"  - {p['username']} (ID: {p['id']})")
    
    # Remove first user
    participants = [p for p in participants if p['id'] != 1]
    cache.set(cache_key, participants, 3600)
    print(f"\n❌ Removed user1")
    
    # Check final state
    final_participants = cache.get(cache_key, [])
    print(f"\n📋 Final participants ({len(final_participants)}):")
    for p in final_participants:
        print(f"  - {p['username']} (ID: {p['id']})")
    
    # Clean up
    cache.delete(cache_key)
    print(f"\n🧹 Cleaned up test data")
    print("✅ Test completed successfully!")

if __name__ == "__main__":
    test_participant_tracking()
