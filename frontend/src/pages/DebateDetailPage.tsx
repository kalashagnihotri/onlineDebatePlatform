import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getDebateSession } from '../services/debateService';
import { useWebSocket, WebSocketMessage, TypingUser } from '../hooks/useWebSocket';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { 
  PaperAirplaneIcon,
  UserCircleIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PhotoIcon,
  FaceSmileIcon,
  HeartIcon,
  HandThumbUpIcon,
  ShareIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { StatusBadge, CountBadge } from '../components/Badge';
import { NoParticipantsEmpty } from '../components/EmptyState';
import { Card } from '../components/Card';
import toast from 'react-hot-toast';

// Define interfaces for our data structures
interface User {
  id: number;
  username: string;
}

interface Message {
  id: number;
  author: User;
  content: string;
  timestamp: string;
  likes?: number;
  isLiked?: boolean;
  reactions?: { [emoji: string]: number };
  imageUrl?: string;
}

interface DebateSession {
  id: number;
  topic: {
    title: string;
    description: string;
  };
  messages: Message[];
  participants?: User[];
  participant_count?: number;  status?: 'active' | 'ended';
}

const DebateDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<DebateSession | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionId = parseInt(id || '0');

  const { 
    sendMessage, 
    sendTyping, 
    sendReaction, 
    sendMessageWithImage,
    isConnected, 
    participants, 
    typingUsers 
  } = useWebSocket({
    sessionId,
    onMessage: (message: WebSocketMessage) => {
      console.log('New WebSocket message received:', message);
      
      // Prevent duplicates by checking if message already exists
      if (message.type === 'message') {
        setSession(prevSession => {
          if (!prevSession) return null;
          
          // Fallback to find the username from existing participants if not in message
          const authorUsername = message.username || prevSession.participants?.find(p => p.id === message.user_id)?.username || 'Unknown';

          const newMessage: Message = {
            id: Date.now() + Math.random(), // Ensure unique ID
            author: { 
              id: message.user_id || 0, 
              username: authorUsername
            },
            content: message.message || '',
            timestamp: message.timestamp || new Date().toISOString(),
            likes: 0,
            isLiked: false,
            reactions: message.emoji_reactions || {},
            imageUrl: message.image_url
          };
          
          // Check if message already exists to prevent duplicates
          const messageExists = prevSession.messages.some(
            msg => msg.content === newMessage.content && 
                   msg.author.username === newMessage.author.username &&
                   Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 1000
          );
          
          if (messageExists) return prevSession;
          
          return {
            ...prevSession,
            messages: [...prevSession.messages, newMessage]
          };
        });
      }
    },    onParticipantsUpdate: (newParticipants: User[]) => {
      console.log('🔄 DebateDetailPage received participants update:', newParticipants);
      setSession(prevSession => {
        if (!prevSession) return null;
        console.log('🔄 Updating session participants from', prevSession.participants?.length || 0, 'to', newParticipants.length);
        return {
          ...prevSession,
          participants: newParticipants,
          participant_count: newParticipants.length,
        };
      });
    },
    onTyping: (users: TypingUser[]) => {
      console.log('Typing users:', users);
    }
  });

  useEffect(() => {
    if (id) {
      const fetchSession = async () => {
        try {
          setLoading(true);
          const data = await getDebateSession(id);
          setSession(data);
        } catch (error) {
          console.error("Failed to fetch session", error);
          toast.error('Failed to load debate session');
        } finally {
          setLoading(false);
        }
      };
      fetchSession();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };  const handlePostMessage = () => {
    if ((newMessage.trim() || selectedImage) && isConnected) {
      if (selectedImage) {
        // For demo purposes, we'll use the image preview URL
        // In a real app, you'd upload to a server first
        sendMessageWithImage(newMessage, imagePreview);
        setSelectedImage(null);
        setImagePreview('');
      } else {
        sendMessage(newMessage);
      }
      setNewMessage('');
      setIsTyping(false);
      sendTyping?.(false);
      toast.success('Message sent!');
    } else if (!isConnected) {
      toast.error('Not connected to chat');
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicator
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      sendTyping?.(true);
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
      sendTyping?.(false);
    }
    
    // Auto-stop typing after delay
    handleTypingStop();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePostMessage();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setNewMessage(prev => prev + (emoji.emoji || emoji));
    setShowEmojiPicker(false);
  };

  const handleReaction = (messageId: number, emoji: string) => {
    // Optimistic UI update
    setSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: prev.messages.map(msg => {
          if (msg.id === messageId) {
            const newReactions = { ...(msg.reactions || {}) };
            newReactions[emoji] = (newReactions[emoji] || 0) + 1;
            return { ...msg, reactions: newReactions };
          }
          return msg;
        }),
      };
    });
    sendReaction(messageId, emoji);
  };

  const handleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTyping?.(false);
    }, 1000);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-secondary-600 rounded-full animate-spin animate-reverse"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Debate Session Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400">The debate session you're looking for doesn't exist.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-6xl mx-auto space-y-6"
    >      {/* Header Section */}
      <Card className="mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-display text-gray-900 dark:text-white">
                  {session.topic.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Debate Session #{session.id}
                </p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {session.topic.description}
            </p>
          </div>
        </div>

        {/* Connection Status & Stats */}
        <div className="flex flex-wrap items-center gap-4">
          <StatusBadge 
            status={isConnected ? 'online' : 'offline'} 
            showText={true}
            animated={true}
          />          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <UsersIcon className="w-4 h-4" />
            <span className="text-sm">
              {Array.isArray(session.participants) 
                ? session.participants.length 
                : session.participant_count || 1
              } participants
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 relative">
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span className="text-sm">{session.messages.length} messages</span>
            {session.messages.length > 0 && (
              <CountBadge count={session.messages.length} variant="primary" size="xs" />
            )}
          </div>
        </div>
      </Card>

      {/* Chat Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">        {/* Messages Area */}
        <div className="lg:col-span-3">
          <Card padding="none" className="overflow-hidden">
            {/* Messages Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-semibold text-gray-900 dark:text-white">Live Discussion</h3>
            </div>

            {/* Messages List */}
            <div className="h-[60vh] overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {session.messages.map((message, index) => (
                  <motion.div
                    key={`${message.id}-${index}`}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                        <UserCircleIcon className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {message.author.username}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3">
                          <p className="text-gray-900 dark:text-white leading-relaxed">
                            {message.content}
                          </p>
                          {message.imageUrl && (
                            <img 
                              src={message.imageUrl} 
                              alt="Message attachment" 
                              className="mt-2 max-w-xs rounded-lg"
                            />
                          )}
                        </div>

                        {/* Reactions */}
                        {message.reactions && Object.keys(message.reactions).length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {Object.entries(message.reactions).map(([emoji, count]) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(message.id, emoji)}
                                className="flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                              >
                                <span>{emoji}</span>
                                <span className="text-gray-600 dark:text-gray-400">{count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Message Actions */}
                        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleReaction(message.id, '👍')}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                          >
                            <HandThumbUpIcon className="w-3 h-3" />
                            <span>{message.likes || 0}</span>
                          </button>
                          <button 
                            onClick={() => handleReaction(message.id, '❤️')}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                          >
                            <HeartIcon className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleReaction(message.id, '😊')}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400"
                          >
                            <FaceSmileIcon className="w-3 h-3" />
                          </button>
                          <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                            <ShareIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>              <div ref={messagesEndRef} />
              
              {/* Typing Indicator */}
              {typingUsers && typingUsers.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span>
                      {typingUsers.length === 1 
                        ? `${typingUsers[0].username} is typing...`
                        : `${typingUsers.length} people are typing...`
                      }
                    </span>
                  </div>
                </motion.div>
              )}
            </div>            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Image Preview</span>
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview('');
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <img src={imagePreview} alt="Preview" className="max-w-xs rounded-lg" />
                </div>
              )}

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={isConnected ? "Type your message..." : "Connecting..."}
                    disabled={!isConnected}
                    rows={1}
                    className="w-full resize-none rounded-xl border-0 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Image Upload */}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                    >
                      <PhotoIcon className="w-5 h-5" />
                    </button>
                  </label>

                  {/* Emoji Picker */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                    >
                      <FaceSmileIcon className="w-5 h-5" />
                    </button>
                    
                    {showEmojiPicker && (
                      <div className="absolute bottom-full right-0 mb-2 z-20">
                        <EmojiPicker 
                          onEmojiClick={handleEmojiSelect}
                          width={350}
                          height={450}
                          searchDisabled
                          previewConfig={{ showPreview: false }}
                        />
                      </div>
                    )}
                  </div>

                  <motion.button
                    onClick={handlePostMessage}
                    disabled={!isConnected || (!newMessage.trim() && !selectedImage)}
                    className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                    whileHover={{ scale: (newMessage.trim() || selectedImage) && isConnected ? 1.05 : 1 }}
                    whileTap={{ scale: (newMessage.trim() || selectedImage) && isConnected ? 0.95 : 1 }}
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </Card>
        </div>        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Connection Status */}
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Connection Status</h3>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span className={`text-sm ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </Card>          {/* Participants */}
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Participants ({participants.length || 0})
            </h3>
            {/* Debug Info */}
            <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
              <div>WebSocket participants: {JSON.stringify(participants)}</div>
              <div>Session participants: {JSON.stringify(session?.participants || [])}</div>
            </div>
            <div className="space-y-3">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                    <UserCircleIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{participant.username}</p>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${participant.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {participant.is_online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {participants.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No participants yet</p>
                </div>
              )}
            </div>
          </Card>

          {/* Typing Indicator in Sidebar */}
          {typingUsers && typingUsers.length > 0 && (
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Currently Typing</h3>
              <div className="space-y-2">
                {typingUsers.map((user) => (
                  <div key={user.user_id} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                      <span className="text-xs">✏️</span>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{user.username}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Debate Rules */}
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Discussion Guidelines</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span>Be respectful</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span>Stay on topic</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span>Support your arguments</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span>Listen to others</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default DebateDetailPage;