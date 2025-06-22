#!/usr/bin/env python3
"""
Simple WebSocket connection test.
Tests if the WebSocket server is responding to connections.
"""

import socket
import time
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path='../.env')


def test_tcp_connection(host, port):
    """Test basic TCP connection to the server."""
    print(f"Testing TCP connection to {host}:{port}...")
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            print("✅ TCP connection successful")
            return True
        else:
            print("❌ TCP connection failed")
            return False
            
    except Exception as e:
        print(f"❌ TCP connection error: {e}")
        return False


def test_http_request(host, port, path):
    """Test basic HTTP request to check if server responds."""
    print(f"Testing HTTP request to {host}:{port}{path}...")
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        sock.connect((host, port))
        
        # Send basic HTTP request
        request = f"GET {path} HTTP/1.1\r\nHost: {host}:{port}\r\n\r\n"
        sock.send(request.encode())
        
        # Read response
        response = sock.recv(1024).decode()
        sock.close()
        
        if "HTTP/1.1" in response:
            print("✅ HTTP server responding")
            print(f"Response: {response.split()[1]} {response.split()[2] if len(response.split()) > 2 else ''}")
            return True
        else:
            print("❌ Invalid HTTP response")
            return False
            
    except Exception as e:
        print(f"❌ HTTP request error: {e}")
        return False


def test_websocket_handshake(host, port, path):
    """Test WebSocket handshake."""
    print(f"Testing WebSocket handshake to {host}:{port}{path}...")
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        sock.connect((host, port))
        
        # WebSocket handshake request
        handshake = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: {host}:{port}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n"
            "Sec-WebSocket-Version: 13\r\n"
            "\r\n"
        )
        
        sock.send(handshake.encode())
        
        # Read response
        response = sock.recv(1024).decode()
        sock.close()
        
        if "101 Switching Protocols" in response:
            print("✅ WebSocket handshake successful")
            return True
        elif "HTTP/1.1" in response:
            status_line = response.split('\r\n')[0]
            print(f"❌ WebSocket handshake failed: {status_line}")
            return False
        else:
            print("❌ Invalid WebSocket response")
            return False
            
    except Exception as e:
        print(f"❌ WebSocket handshake error: {e}")
        return False


def check_server_processes():
    """Check if Django/Daphne processes are running."""
    print("Checking for running server processes...")
    
    try:
        import subprocess
        
        # Check for Python processes that might be Django/Daphne
        result = subprocess.run(['tasklist', '/FI', 'IMAGENAME eq python.exe'], 
                              capture_output=True, text=True, shell=True)
        
        if result.returncode == 0 and 'python.exe' in result.stdout:
            print("✅ Python processes found running")
              # Try to find processes listening on configured ports
            django_port = os.getenv('DJANGO_PORT', '8000')
            daphne_port = os.getenv('DAPHNE_PORT', '8001')
            netstat_result = subprocess.run(['netstat', '-an'], 
                                          capture_output=True, text=True, shell=True)
            
            if f':{django_port}' in netstat_result.stdout:
                print(f"✅ Service listening on port {django_port}")
                return True
            elif f':{daphne_port}' in netstat_result.stdout:
                print(f"✅ Service listening on port {daphne_port}")
                return True
            else:
                print(f"⚠️ No service found listening on ports {django_port} or {daphne_port}")
                return False
        else:
            print("❌ No Python processes found")
            return False
            
    except Exception as e:
        print(f"⚠️ Could not check processes: {e}")
        return False


def main():
    """Main function to run connection tests."""
    if len(sys.argv) > 1:
        host = sys.argv[1]
    else:
        host = "localhost"
        
    port = int(sys.argv[2]) if len(sys.argv) > 2 else int(os.getenv('DAPHNE_PORT', '8001'))
    debate_id = sys.argv[3] if len(sys.argv) > 3 else "1"
    
    websocket_path = f"/ws/debates/{debate_id}/"
    
    print("🔍 WebSocket Connection Diagnostic")
    print(f"Target: {host}:{port}{websocket_path}")
    print("=" * 50)
    
    # Run diagnostic tests
    tests_passed = 0
    total_tests = 4
    
    if check_server_processes():
        tests_passed += 1
        
    if test_tcp_connection(host, port):
        tests_passed += 1
        
        if test_http_request(host, port, "/"):
            tests_passed += 1
            
            if test_websocket_handshake(host, port, websocket_path):
                tests_passed += 1
    print("\n" + "=" * 50)
    print(f"📊 Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! WebSocket server is responding correctly.")
    elif tests_passed >= 2:
        print("⚠️ Server is running but WebSocket endpoint may have issues.")
        print("Check your Django/Daphne configuration and routing.")
    elif tests_passed >= 1:
        print("⚠️ Server is accessible but may not be configured for WebSockets.")
        print("Make sure you're running Daphne, not the Django development server.")
    else:
        daphne_port = os.getenv('DAPHNE_PORT', '8001')
        print("❌ Server appears to be down or not accessible.")
        print("Make sure to start your Django server with Daphne:")
        print("  python manage.py runserver (for development)")
        print("  or")
        print(f"  daphne -p {daphne_port} onlineDebatePlatform.asgi:application")
        
    print("\n💡 Troubleshooting tips:")
    print("  1. Ensure server is running: python manage.py runserver")
    print("  2. Check ALLOWED_HOSTS in settings.py")
    print("  3. Verify WebSocket routing in routing.py")
    print("  4. Check firewall/antivirus blocking connections")


if __name__ == "__main__":
    main()
