#!/usr/bin/env python3
"""
Clean WebSocket test without extra dependencies.
Uses only built-in Python libraries to test WebSocket connectivity.
"""

import socket
import base64
import hashlib
import struct
import json
import threading
import time
import sys
from urllib.parse import urlparse
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path='../.env')


class SimpleWebSocketClient:
    """Simple WebSocket client implementation using only built-in libraries."""
    
    def __init__(self, url):
        self.url = url
        parsed = urlparse(url)
        self.host = parsed.hostname or 'localhost'
        self.port = parsed.port or (443 if parsed.scheme == 'wss' else 8000)
        self.path = parsed.path or '/'
        if parsed.query:
            self.path += '?' + parsed.query
        
        self.socket = None
        self.connected = False
        
    def _generate_key(self):
        """Generate WebSocket key for handshake."""
        import random
        key = ''.join(chr(random.randint(0, 255)) for _ in range(16))
        return base64.b64encode(key.encode()).decode()
        
    def _create_handshake(self, key):
        """Create WebSocket handshake request."""
        handshake = (
            f"GET {self.path} HTTP/1.1\r\n"
            f"Host: {self.host}:{self.port}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            "Sec-WebSocket-Version: 13\r\n"
            "\r\n"
        )
        return handshake.encode()
        
    def _validate_handshake_response(self, response, key):
        """Validate WebSocket handshake response."""
        if b"HTTP/1.1 101" not in response:
            return False
            
        # Validate Sec-WebSocket-Accept
        magic_string = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
        accept_key = base64.b64encode(
            hashlib.sha1((key + magic_string).encode()).digest()
        ).decode()
        
        return f"Sec-WebSocket-Accept: {accept_key}".encode() in response
        
    def connect(self):
        """Connect to WebSocket server."""
        try:
            print(f"Connecting to {self.host}:{self.port}{self.path}")
            
            # Create socket
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.settimeout(10)
            self.socket.connect((self.host, self.port))
            
            # Perform WebSocket handshake
            key = self._generate_key()
            handshake = self._create_handshake(key)
            
            self.socket.send(handshake)
            
            # Read response
            response = b""
            while b"\r\n\r\n" not in response:
                chunk = self.socket.recv(1024)
                if not chunk:
                    raise Exception("Connection closed during handshake")
                response += chunk
                
            if not self._validate_handshake_response(response, key):
                raise Exception("Invalid handshake response")
                
            self.connected = True
            print("✅ Connected successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            self.connected = False
            return False
            
    def _create_frame(self, data, opcode=1):
        """Create a WebSocket frame."""
        if isinstance(data, str):
            data = data.encode('utf-8')
            
        # Frame format: FIN(1) + RSV(3) + OPCODE(4) + MASK(1) + PAYLOAD_LEN(7) + [EXTENDED_PAYLOAD_LEN] + [MASK_KEY] + PAYLOAD
        frame = bytearray()
        
        # First byte: FIN = 1, RSV = 000, OPCODE = opcode
        frame.append(0x80 | opcode)
        
        # Payload length
        payload_len = len(data)
        if payload_len < 126:
            frame.append(0x80 | payload_len)  # MASK = 1, payload length
        elif payload_len < 65536:
            frame.append(0x80 | 126)
            frame.extend(struct.pack('>H', payload_len))
        else:
            frame.append(0x80 | 127)
            frame.extend(struct.pack('>Q', payload_len))
            
        # Masking key (4 bytes)
        import random
        mask_key = struct.pack('>I', random.randint(0, 0xFFFFFFFF))
        frame.extend(mask_key)
        
        # Masked payload
        masked_data = bytearray()
        for i, byte in enumerate(data):
            masked_data.append(byte ^ mask_key[i % 4])
        frame.extend(masked_data)
        
        return bytes(frame)
        
    def _parse_frame(self, data):
        """Parse a WebSocket frame."""
        if len(data) < 2:
            return None, data
            
        # First byte
        fin = (data[0] & 0x80) != 0
        opcode = data[0] & 0x0F
        
        # Second byte
        masked = (data[1] & 0x80) != 0
        payload_len = data[1] & 0x7F
        
        offset = 2
        
        # Extended payload length
        if payload_len == 126:
            if len(data) < offset + 2:
                return None, data
            payload_len = struct.unpack('>H', data[offset:offset+2])[0]
            offset += 2
        elif payload_len == 127:
            if len(data) < offset + 8:
                return None, data
            payload_len = struct.unpack('>Q', data[offset:offset+8])[0]
            offset += 8
            
        # Mask key
        if masked:
            if len(data) < offset + 4:
                return None, data
            mask_key = data[offset:offset+4]
            offset += 4
        else:
            mask_key = None
            
        # Payload
        if len(data) < offset + payload_len:
            return None, data
            
        payload = data[offset:offset+payload_len]
        
        # Unmask payload
        if masked and mask_key:
            unmasked = bytearray()
            for i, byte in enumerate(payload):
                unmasked.append(byte ^ mask_key[i % 4])
            payload = bytes(unmasked)
            
        remaining_data = data[offset+payload_len:]
        
        return {
            'fin': fin,
            'opcode': opcode,
            'payload': payload
        }, remaining_data
        
    def send_message(self, message):
        """Send a message to the WebSocket."""
        if not self.connected or not self.socket:
            print("❌ Not connected")
            return False
            
        try:
            if isinstance(message, dict):
                message = json.dumps(message)
                
            frame = self._create_frame(message)
            self.socket.send(frame)
            print(f"📤 Sent: {message}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send message: {e}")
            return False
            
    def receive_message(self, timeout=1):
        """Receive a message from the WebSocket."""
        if not self.connected or not self.socket:
            return None
            
        try:
            self.socket.settimeout(timeout)
            
            buffer = b""
            while True:
                try:
                    chunk = self.socket.recv(1024)
                    if not chunk:
                        print("Connection closed by server")
                        self.connected = False
                        return None
                        
                    buffer += chunk
                    
                    # Try to parse frame
                    frame, remaining = self._parse_frame(buffer)
                    if frame:
                        buffer = remaining
                        
                        if frame['opcode'] == 1:  # Text frame
                            message = frame['payload'].decode('utf-8')
                            print(f"📩 Received: {message}")
                            return message
                        elif frame['opcode'] == 8:  # Close frame
                            print("Connection closed by server")
                            self.connected = False
                            return None
                            
                except socket.timeout:
                    return None
                    
        except Exception as e:
            print(f"❌ Error receiving message: {e}")
            return None
            
    def close(self):
        """Close the WebSocket connection."""
        if self.socket:
            # Send close frame
            close_frame = self._create_frame(b"", opcode=8)
            try:
                self.socket.send(close_frame)
            except:
                pass
                
            self.socket.close()
            self.socket = None
            
        self.connected = False
        print("🔌 Disconnected")


def test_basic_connection(url):
    """Test basic WebSocket connection."""
    print("🧪 Testing basic connection...")
    
    client = SimpleWebSocketClient(url)
    
    if client.connect():
        time.sleep(1)
        client.close()
        print("✅ Basic connection test passed")
        return True
    else:
        print("❌ Basic connection test failed")
        return False


def test_message_exchange(url):
    """Test sending and receiving messages."""
    print("\n🧪 Testing message exchange...")
    
    client = SimpleWebSocketClient(url)
    
    if not client.connect():
        return False
        
    # Send test messages
    test_messages = [
        {"type": "ping", "timestamp": time.time()},
        {"type": "chat_message", "message": "Hello from clean test!"},
        {"type": "typing_indicator", "is_typing": True}
    ]
    
    for msg in test_messages:
        client.send_message(msg)
        
        # Try to receive response
        response = client.receive_message(timeout=2)
        if response:
            try:
                data = json.loads(response)
                print(f"✅ Received response: {data.get('type', 'unknown')}")
            except json.JSONDecodeError:
                print(f"✅ Received raw response: {response[:100]}...")
        
        time.sleep(0.5)
        
    client.close()
    print("✅ Message exchange test completed")
    return True


def test_stress_connection(url, num_messages=10):
    """Test sending multiple messages quickly."""
    print(f"\n🧪 Testing stress with {num_messages} messages...")
    
    client = SimpleWebSocketClient(url)
    
    if not client.connect():
        return False
        
    # Send messages rapidly
    for i in range(num_messages):
        message = {
            "type": "chat_message",
            "message": f"Stress test message {i+1}",
            "timestamp": time.time()
        }
        
        success = client.send_message(message)
        if not success:
            print(f"❌ Failed to send message {i+1}")
            break
            
        time.sleep(0.1)  # Small delay
        
    # Try to receive any responses
    print("Listening for responses...")
    for _ in range(5):  # Listen for a few seconds
        response = client.receive_message(timeout=1)
        if not response:
            break
            
    client.close()
    print("✅ Stress test completed")
    return True


def interactive_test(url):
    """Interactive test mode."""
    print(f"\n🎯 Interactive mode for {url}")
    print("Commands: 'send <message>', 'ping', 'quit'")
    print("=" * 40)
    
    client = SimpleWebSocketClient(url)
    
    if not client.connect():
        return
        
    # Start background thread for receiving messages
    def receive_loop():
        while client.connected:
            response = client.receive_message(timeout=1)
            # Message is already printed in receive_message
            
    receive_thread = threading.Thread(target=receive_loop, daemon=True)
    receive_thread.start()
    
    try:
        while client.connected:
            command = input("Enter command: ").strip()
            
            if command.lower() == 'quit':
                break
            elif command == 'ping':
                client.send_message({"type": "ping", "timestamp": time.time()})
            elif command.startswith('send '):
                message = command[5:]
                client.send_message({
                    "type": "chat_message",
                    "message": message,
                    "timestamp": time.time()
                })
            else:
                print("Unknown command")
                
    except KeyboardInterrupt:
        pass
    finally:
        client.close()


def main():
    """Main function."""
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        # Use environment variable or default
        daphne_port = os.getenv('DAPHNE_PORT', '8001')
        base_url = f"ws://localhost:{daphne_port}"
        
    debate_id = sys.argv[2] if len(sys.argv) > 2 else "1"
    url = f"{base_url}/ws/debates/{debate_id}/"
    
    print("🧪 Clean WebSocket Test (No External Dependencies)")
    print(f"Target: {url}")
    print("=" * 60)
    
    # Run tests
    test_basic_connection(url)
    test_message_exchange(url)
    test_stress_connection(url)
    
    # Ask for interactive mode
    try:
        response = input("\nRun interactive test? (y/n): ").strip().lower()
        if response == 'y':
            interactive_test(url)
    except KeyboardInterrupt:
        pass
        
    print("\n🎉 All tests completed!")


if __name__ == "__main__":
    main()
