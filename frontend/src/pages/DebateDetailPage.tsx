import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDebateSession } from '../services/debateService';
import { useWebSocket } from '../hooks/useWebSocket';
import { Box, Typography, Paper, List, ListItem, ListItemText, TextField, Button, Divider } from '@mui/material';

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
}

interface DebateSession {
  id: number;
  topic: {
    title: string;
    description: string;
  };
  messages: Message[];
}

const DebateDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<DebateSession | null>(null);
  const [newMessage, setNewMessage] = useState('');
  
  const sessionId = parseInt(id || '0');
  const { messages: wsMessages, sendMessage } = useWebSocket({
    sessionId,
    onMessage: (message) => {
      console.log('New message received:', message);
    }
  });

  useEffect(() => {
    if (id) {
      const fetchSession = async () => {
        try {
          const data = await getDebateSession(id);
          setSession(data);
        } catch (error) {
          console.error("Failed to fetch session", error);
        }
      };
      fetchSession();
    }
  }, [id]);

  useEffect(() => {
    // Append new WebSocket messages to the session's message list
    if (wsMessages.length > 0) {
      setSession(prevSession => {
        if (!prevSession) return null;
        
        // Transform WebSocket messages to match Message interface
        const newMessages: Message[] = wsMessages.map((wsMsg: any, idx: number) => ({
          id: Date.now() + idx, // Generate a unique ID
          author: wsMsg.user || { id: 0, username: 'Unknown' },
          content: wsMsg.message,
          timestamp: wsMsg.timestamp || new Date().toISOString(),
        }));
        
        return {
          ...prevSession,
          messages: [...prevSession.messages, ...newMessages]
        };
      });
    }
  }, [wsMessages]);

  const handlePostMessage = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  if (!session) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Paper elevation={3} style={{ padding: '2rem' }}>
      <Typography variant="h4" gutterBottom>{session.topic.title}</Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>{session.topic.description}</Typography>
      <Divider style={{ margin: '2rem 0' }} />
      
      <Box sx={{ height: '50vh', overflowY: 'auto', mb: 2, border: '1px solid #444', p: 2, borderRadius: 1 }}>
        <List>
          {session.messages.map((msg) => (
            <ListItem key={msg.id}>
              <ListItemText
                primary={msg.content}
                secondary={`${msg.author.username} at ${new Date(msg.timestamp).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      <Box sx={{ display: 'flex' }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Your message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handlePostMessage()}
        />
        <Button variant="contained" color="primary" onClick={handlePostMessage} sx={{ ml: 2 }}>
          Send
        </Button>
      </Box>
    </Paper>
  );
};

export default DebateDetailPage; 