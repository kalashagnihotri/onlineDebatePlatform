#!/usr/bin/env python3
"""
Basic WebSocket connection test script.
Tests WebSocket connectivity without authentication requirements.
"""

import asyncio
import websockets
import json
import sys
from datetime import datetime


class WebSocketTester:
    def __init__(self, url):
        self.url = url
        self.websocket = None
        
    async def connect(self):
        """Connect to the WebSocket server."""
        try:
            print(f"Connecting to {self.url}...")
            self.websocket = await websockets.connect(self.url)
            print("✅ Connected successfully!")
            return True
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False
            
    async def disconnect(self):
        """Disconnect from the WebSocket server."""
        if self.websocket:
            await self.websocket.close()
            print("🔌 Disconnected")
            
    async def send_message(self, message_type, data=None):
        """Send a message to the WebSocket server."""
        if not self.websocket:
            print("❌ Not connected")
            return
            
        message = {
            'type': message_type,
            'timestamp': datetime.now().isoformat()
        }
        
        if data:
            message.update(data)
            
        try:
            await self.websocket.send(json.dumps(message))
            print(f"📤 Sent: {message}")
        except Exception as e:
            print(f"❌ Failed to send message: {e}")
            
    async def listen_for_messages(self):
        """Listen for incoming messages."""
        if not self.websocket:
            print("❌ Not connected")
            return
            
        try:
            async for message in self.websocket:
                try:
                    data = json.loads(message)
                    print(f"📩 Received: {data}")
                except json.JSONDecodeError:
                    print(f"📩 Received (raw): {message}")
        except websockets.exceptions.ConnectionClosed:
            print("🔌 Connection closed by server")
        except Exception as e:
            print(f"❌ Error receiving messages: {e}")
            
    async def run_interactive_test(self):
        """Run an interactive test session."""
        if not await self.connect():
            return
            
        print("\n🎯 Interactive WebSocket Test")
        print("Commands:")
        print("  'chat <message>' - Send a chat message")
        print("  'typing' - Send typing indicator")
        print("  'reaction <emoji>' - Send reaction")
        print("  'ping' - Send ping")
        print("  'quit' - Exit")
        print("=" * 50)
        
        # Start listening for messages in the background
        listen_task = asyncio.create_task(self.listen_for_messages())
        
        try:
            while True:
                try:
                    command = await asyncio.wait_for(
                        asyncio.to_thread(input, "Enter command: "), 
                        timeout=0.1
                    )
                    
                    if command.lower() == 'quit':
                        break
                    elif command.startswith('chat '):
                        message = command[5:]
                        await self.send_message('chat_message', {'message': message})
                    elif command == 'typing':
                        await self.send_message('typing_indicator', {'is_typing': True})
                    elif command.startswith('reaction '):
                        emoji = command[9:]
                        await self.send_message('reaction', {'emoji': emoji, 'target_type': 'debate', 'target_id': '1'})
                    elif command == 'ping':
                        await self.send_message('ping')
                    else:
                        print("❓ Unknown command")
                        
                except asyncio.TimeoutError:
                    # No input received, continue listening
                    continue
                except KeyboardInterrupt:
                    break
                    
        finally:
            listen_task.cancel()
            await self.disconnect()


async def test_basic_connection(url):
    """Test basic connection and disconnection."""
    print("🧪 Testing basic connection...")
    tester = WebSocketTester(url)
    
    success = await tester.connect()
    if success:
        await asyncio.sleep(1)  # Wait a bit
        await tester.disconnect()
        print("✅ Basic connection test passed")
    else:
        print("❌ Basic connection test failed")
    
    return success


async def test_message_sending(url):
    """Test sending various types of messages."""
    print("\n🧪 Testing message sending...")
    tester = WebSocketTester(url)
    
    if not await tester.connect():
        return False
        
    # Test different message types
    test_messages = [
        ('chat_message', {'message': 'Hello, WebSocket!'}),
        ('ping', {}),
        ('typing_indicator', {'is_typing': True}),
        ('reaction', {'emoji': '👍', 'target_type': 'debate', 'target_id': '1'})
    ]
    
    for msg_type, data in test_messages:
        await tester.send_message(msg_type, data)
        await asyncio.sleep(0.5)  # Small delay between messages
        
    print("✅ Message sending test completed")
    await tester.disconnect()
    return True


async def test_continuous_connection(url, duration=5):
    """Test keeping connection alive for a period."""
    print(f"\n🧪 Testing continuous connection for {duration} seconds...")
    tester = WebSocketTester(url)
    
    if not await tester.connect():
        return False
        
    # Keep connection alive and send periodic pings
    start_time = asyncio.get_event_loop().time()
    ping_interval = 1  # Send ping every second
    last_ping = 0
    
    try:
        while asyncio.get_event_loop().time() - start_time < duration:
            current_time = asyncio.get_event_loop().time()
            
            if current_time - last_ping >= ping_interval:
                await tester.send_message('ping')
                last_ping = current_time
                
            await asyncio.sleep(0.1)
            
        print("✅ Continuous connection test passed")
        
    except Exception as e:
        print(f"❌ Continuous connection test failed: {e}")
        return False
    finally:
        await tester.disconnect()
        
    return True


def main():
    """Main function to run WebSocket tests."""
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "ws://localhost:8000"
        
    debate_id = sys.argv[2] if len(sys.argv) > 2 else "1"
    url = f"{base_url}/ws/debates/{debate_id}/"
    
    print(f"🚀 WebSocket Test Suite")
    print(f"Target URL: {url}")
    print("=" * 50)
    
    async def run_all_tests():
        # Run automated tests
        await test_basic_connection(url)
        await test_message_sending(url)
        await test_continuous_connection(url)
        
        # Ask if user wants interactive mode
        print("\n" + "=" * 50)
        response = input("Run interactive test? (y/n): ").strip().lower()
        
        if response == 'y':
            tester = WebSocketTester(url)
            await tester.run_interactive_test()
            
        print("\n🎉 All tests completed!")
    
    try:
        asyncio.run(run_all_tests())
    except KeyboardInterrupt:
        print("\n⏹️ Tests interrupted by user")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")


if __name__ == "__main__":
    main()
