'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import Navigation from '../components/Navigation';
import ComponentRenderer, { ComponentJson } from '../components/ComponentRenderer';
import QuickReplies from '../components/QuickReplies';
import axios from 'axios';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  components?: ComponentJson[];
  quickReplies?: Array<{ label: string; value: string }>;
}

export default function ChatPage() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check authentication
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Add welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          content: "Hello! I'm your AI Health Companion. I can help you with meal planning, activity tracking, biomarker logging, and more. What would you like to do today?",
          sender: 'bot',
          timestamp: new Date(),
          quickReplies: [
            { label: 'Create a meal plan', value: 'I want to create a meal plan for this week' },
            { label: 'Log a meal', value: 'I want to log what I ate for lunch' },
            { label: 'Check my progress', value: 'Show me my health progress and leaderboard' },
            { label: 'Set a goal', value: 'I want to set a new fitness goal' },
          ],
        },
      ]);
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    // Add loading message to show the AI is thinking
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '🤔 Thinking... (this may take a moment on first request)',
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, loadingMessage]);

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
          try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Check if token is expired
      try {
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        if (tokenPayload.exp && tokenPayload.exp < currentTime) {
          // Token is expired, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.href = '/';
          return;
        }
      } catch (error) {
        // Invalid token, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/';
        return;
      }

        const response = await axios.post('/api/mcp/sse', {
          tool: 'chat',
          args: { message: inputValue },
        }, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          timeout: 30000, // 30 second timeout
        });

        const { success, data, componentJson, error: responseError } = response.data;

        if (!success) {
          throw new Error(responseError || 'Failed to get response');
        }

        // Remove loading message and add actual response
        setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.message || 'I processed your request successfully!',
          sender: 'bot',
          timestamp: new Date(),
          components: componentJson ? [componentJson] : undefined,
          quickReplies: componentJson?.quickReplies,
        };

        setMessages(prev => [...prev, botMessage]);
        break; // Success, exit retry loop

      } catch (err: any) {
        retryCount++;
        console.error(`Chat error (attempt ${retryCount}):`, err);
        
        if (retryCount >= maxRetries) {
          // Final failure - remove loading message and show error
          setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
          
          setError(err.response?.data?.error || err.message || 'Failed to send message');
          
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: retryCount > 1 
              ? 'I\'m having trouble connecting right now. This might be due to the AI model loading. Please try again in a moment.'
              : 'Sorry, I encountered an error. Please try again.',
            sender: 'bot',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, errorMessage]);
        } else {
          // Update loading message to show retry attempt
          setMessages(prev => prev.map(msg => 
            msg.id === loadingMessage.id 
              ? { ...msg, content: `🤔 Thinking... (attempt ${retryCount + 1} - model may be loading)` }
              : msg
          ));
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }

    setIsLoading(false);
  };

  const handleQuickReply = (value: string) => {
    setInputValue(value);
    // Automatically submit the quick reply
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }
    }, 100);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <>
        <Navigation />
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="warning">
            Please log in to use the chat feature.
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <Container maxWidth="md" sx={{ py: 4, height: 'calc(100vh - 120px)' }}>
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BotIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h5" component="h1">
                AI Health Companion
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Ask me about your health, meal plans, or fitness goals.
            </Typography>
          </Box>

          {/* Messages */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <List sx={{ p: 0 }}>
              {messages.map((message) => (
                <ListItem
                  key={message.id}
                  sx={{
                    flexDirection: 'column',
                    alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    p: 0,
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      maxWidth: '80%',
                      flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main',
                        }}
                      >
                        {message.sender === 'user' ? <PersonIcon /> : <BotIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <Box sx={{ ml: message.sender === 'user' ? 0 : 1, mr: message.sender === 'user' ? 1 : 0 }}>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.100',
                          color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {message.content}
                        </Typography>
                        
                        {/* Render components */}
                        {message.components?.map((component, index) => (
                          <ComponentRenderer
                            key={index}
                            component={component}
                            onQuickReply={handleQuickReply}
                          />
                        ))}
                        
                        {/* Quick replies (only if no components with their own quick replies) */}
                        {message.quickReplies && message.quickReplies.length > 0 && !message.components?.some(c => c.quickReplies) && (
                          <QuickReplies
                            replies={message.quickReplies}
                            onReply={handleQuickReply}
                          />
                        )}
                      </Paper>
                      
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 0.5, display: 'block' }}
                      >
                        {formatTime(message.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
              ))}
              
              {isLoading && (
                <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', p: 0, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', maxWidth: '80%' }}>
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                        <BotIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <Box sx={{ ml: 1 }}>
                      <Paper sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={16} />
                          <Typography variant="body2" color="text.secondary">
                            Thinking...
                          </Typography>
                        </Box>
                      </Paper>
                    </Box>
                  </Box>
                </ListItem>
              )}
            </List>
            <div ref={messagesEndRef} />
          </Box>

          {/* Error Display */}
          {error && (
            <Box sx={{ p: 2 }}>
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            </Box>
          )}

          {/* Input */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <form onSubmit={handleSubmit}>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!isLoading && inputValue.trim()) {
                        handleSubmit(e as any);
                      }
                    }
                  }}
                  placeholder="Ask me about your health..."
                  disabled={isLoading}
                  multiline
                  maxRows={3}
                  variant="outlined"
                  size="small"
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading || !inputValue.trim()}
                  sx={{ minWidth: 'auto', px: 3 }}
                >
                  <SendIcon />
                </Button>
              </Stack>
            </form>
          </Box>
        </Paper>
      </Container>
    </>
  );
} 