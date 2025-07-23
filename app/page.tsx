'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Stack,
} from '@mui/material';
import {
  Chat as ChatIcon,
  FitnessCenter as FitnessIcon,
  Restaurant as FoodIcon,
  TrendingUp as TrendIcon,
  Security as SecurityIcon,
  OfflineBolt as OfflineIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AuthForm {
  username: string;
  password: string;
  email?: string;
}

export default function HomePage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<AuthForm>({
    username: '',
    password: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await axios.post(endpoint, formData);

      const { accessToken, refreshToken, user } = response.data;

      // Use AuthContext to handle login
      login(accessToken, refreshToken);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AuthForm) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const features = [
    {
      icon: <ChatIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'AI Chat Interface',
      description: 'Natural conversation with AI for health management',
    },
    {
      icon: <FoodIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      title: 'Smart Meal Planning',
      description: 'AI-generated personalized meal plans',
    },
    {
      icon: <FitnessIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      title: 'Activity Tracking',
      description: 'Monitor workouts and physical activities',
    },
    {
      icon: <TrendIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      title: 'Biomarker Trends',
      description: 'Track weight, blood pressure, and more',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'error.main' }} />,
      title: 'Secure & Private',
      description: 'Your health data is encrypted and secure',
    },
    {
      icon: <OfflineIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      title: 'Works Offline',
      description: 'PWA that works without internet connection',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0057FF 0%, #00C4B3 100%)',
          color: 'white',
          py: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography variant="h1" sx={{ mb: 2, fontWeight: 700 }}>
                  AI Health Companion
                </Typography>
                <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                  Your intelligent health management platform powered by AI
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Chip
                    label="Chat-First Interface"
                    color="primary"
                    variant="filled"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                  <Chip
                    label="PWA Support"
                    color="secondary"
                    variant="filled"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                  <Chip
                    label="Offline Capable"
                    color="success"
                    variant="filled"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Stack>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Card sx={{ maxWidth: 400, mx: 'auto' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
                      {isLogin ? 'Welcome Back' : 'Get Started'}
                    </Typography>
                    
                    {error && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                      </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                      <TextField
                        fullWidth
                        label="Username"
                        value={formData.username}
                        onChange={handleInputChange('username')}
                        margin="normal"
                        required
                      />
                      
                      {!isLogin && (
                        <TextField
                          fullWidth
                          label="Email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange('email')}
                          margin="normal"
                          required
                        />
                      )}
                      
                      <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange('password')}
                        margin="normal"
                        required
                      />
                      
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{ mt: 3, mb: 2 }}
                      >
                        {loading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          isLogin ? 'Sign In' : 'Create Account'
                        )}
                      </Button>
                      
                      <Button
                        fullWidth
                        variant="text"
                        onClick={() => setIsLogin(!isLogin)}
                        sx={{ mt: 1 }}
                      >
                        {isLogin
                          ? "Don't have an account? Sign up"
                          : 'Already have an account? Sign in'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Typography variant="h2" sx={{ textAlign: 'center', mb: 6 }}>
            Powerful Features
          </Typography>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      p: 3,
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        transition: 'transform 0.3s ease-in-out',
                      },
                    }}
                  >
                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </Container>

      {/* Demo Accounts Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 6 }}>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ mb: 3 }}>
                Try It Out
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Use these demo accounts to explore the platform:
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                <Grid item>
                  <Chip
                    label="Admin: admin / demo"
                    variant="outlined"
                    color="primary"
                  />
                </Grid>
                <Grid item>
                  <Chip
                    label="User: user / demo"
                    variant="outlined"
                    color="secondary"
                  />
                </Grid>
              </Grid>
            </Paper>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
} 