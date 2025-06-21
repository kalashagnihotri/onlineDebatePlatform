import React, { useEffect, useState } from 'react';
import { getDebateTopics } from '../services/debateService';
import { List, ListItem, ListItemText, Button, Typography, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

interface Topic {
  id: number;
  title: string;
  description: string;
}

const HomePage = () => {
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const data = await getDebateTopics();
        setTopics(data);
      } catch (error) {
        console.error("Failed to fetch topics", error);
      }
    };

    fetchTopics();
  }, []);

  return (
    <Paper elevation={3} style={{ padding: '2rem' }}>
      <Typography variant="h4" gutterBottom>
        Debate Topics
      </Typography>
      <List>
        {topics.map((topic) => (
          <ListItem
            key={topic.id}
            secondaryAction={
              <Button 
                component={RouterLink} 
                to={`/debates/${topic.id}`} 
                variant="contained"
              >
                View Debate
              </Button>
            }
          >
            <ListItemText
              primary={topic.title}
              secondary={topic.description}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default HomePage; 