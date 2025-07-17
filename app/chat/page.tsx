'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import Navigation from '../components/Navigation';

export default function ChatPage() {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    setIsLoading(true);
    // TODO: Implement chat functionality
    console.log('Sending message:', inputValue);
    setInputValue('');
    setIsLoading(false);
  };

  return (
    <>
      <Navigation />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          AI Health Companion
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Ask me about your health, meal plans, or fitness goals.
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me about your health..."
              disabled={isLoading}
              multiline
              maxRows={3}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || !inputValue.trim()}
              sx={{ minWidth: 'auto' }}
            >
              <SendIcon />
            </Button>
          </Stack>
        </form>
        
        <Box sx={{ mt:3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Chat functionality will be implemented with MCP integration.
          </Typography>
        </Box>
      </Paper>
    </Container>
    </>
  );
} 