import { useEffect, useRef, useState, useCallback } from 'react';

// Enhanced interface for WebSocket messages
export interface WebSocketMessage {
  type: string;
  message?: string;
  session_id?: number;
  user_id?: number;
  username?: string;
  timestamp?: string;
  emoji_reactions?: { [emoji: string]: number };
  image_url?: string;
  participants?: any[];
  typing_users?: any[];
}

export interface Participant {
  id: number;
  username: string;
  is_online?: boolean;
}

export interface TypingUser {
  user_id: number;
  username: string;
}

interface UseWebSocketProps {
  sessionId: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onParticipantsUpdate?: (participants: Participant[]) => void;
  onTyping?: (users: TypingUser[]) => void;
}

export const useWebSocket = ({ 
  sessionId, 
  onMessage, 
  onConnect, 
  onDisconnect,
  onParticipantsUpdate,
  onTyping 
}: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const isConnectingRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const connect = useCallback(() => {
    // Prevent multiple connections
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('🚫 WebSocket already connected/connecting, skipping');
      return;
    }

    if (isConnectingRef.current) {
      console.log('🚫 Connection attempt already in progress');
      return;
    }

    isConnectingRef.current = true;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('❌ No access token found');
      isConnectingRef.current = false;
      return;
    }

    console.log('🔌 Attempting WebSocket connection to:', `ws://localhost:8001/ws/debate/${sessionId}/?token=${token.substring(0, 20)}...`);
    console.log('� Using token:', `${token.substring(0, 20)}...`);
    
    const ws = new WebSocket(`ws://localhost:8001/ws/debate/${sessionId}/?token=${token}`);

    ws.onopen = () => {
      console.log('✅ WebSocket connected successfully');
      setIsConnected(true);
      isConnectingRef.current = false;
      reconnectAttemptsRef.current = 0;
      onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', data.type, data);
        setMessages(prev => [...prev, data]);
        
        // Handle different message types
        if (data.type === 'user_joined' || data.type === 'user_left') {
          console.log('👋 User joined:', data.username);
          if (data.participants) {
            setParticipants(data.participants);
            onParticipantsUpdate?.(data.participants);
          }
        } else if (data.type === 'typing_status') {
          if (data.typing_users) {
            setTypingUsers(data.typing_users);
            onTyping?.(data.typing_users);
          }
        }
        
        onMessage?.(data);
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('🔌 WebSocket disconnected - Code:', event.code, 'Reason:', event.reason, 'Clean:', event.wasClean);
      setIsConnected(false);
      isConnectingRef.current = false;
      wsRef.current = null;
      
      // Handle different close codes
      if (event.code === 1006) {
        console.log('❌ Connection closed abnormally (network issue?)');
      } else if (event.code === 1000) {
        console.log('✅ Connection closed normally');
      }
      
      // Only attempt reconnection if it wasn't a normal close and we haven't exceeded max attempts
      if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        console.log(`🔄 Attempting reconnection ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${reconnectDelay}ms`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.log(`❌ Max reconnection attempts (${maxReconnectAttempts}) reached`);
      }
      
      onDisconnect?.();
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setIsConnected(false);
      isConnectingRef.current = false;
    };

    wsRef.current = ws;
  }, [sessionId, onMessage, onConnect, onDisconnect, onParticipantsUpdate, onTyping]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Intentional disconnect');
      wsRef.current = null;
    }
    
    isConnectingRef.current = false;
    setIsConnected(false);
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent auto-reconnection
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const messageData = {
        type: 'message',
        message,
        session_id: sessionId
      };
      wsRef.current.send(JSON.stringify(messageData));
      console.log('📤 Message sent:', message);
    } else {
      console.error('❌ WebSocket is not connected');
    }
  }, [sessionId]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const typingData = {
        type: isTyping ? 'typing_start' : 'typing_stop',
        session_id: sessionId
      };
      wsRef.current.send(JSON.stringify(typingData));
    }
  }, [sessionId]);

  const sendReaction = useCallback((messageId: number, emoji: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const reactionData = {
        type: 'message_reaction',
        message_id: messageId,
        emoji,
        session_id: sessionId
      };
      wsRef.current.send(JSON.stringify(reactionData));
    }
  }, [sessionId]);

  const sendMessageWithImage = useCallback((message: string, imageUrl: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const messageData = {
        type: 'message_with_image',
        message,
        image_url: imageUrl,
        session_id: sessionId
      };
      wsRef.current.send(JSON.stringify(messageData));
    }
  }, [sessionId]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // Only depend on sessionId to prevent infinite loops

  return {
    isConnected,
    messages,
    participants,
    typingUsers,
    sendMessage,
    sendTyping,
    sendReaction,
    sendMessageWithImage,
    connect,
    disconnect
  };
};