'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  MenuItem
} from '@mui/material';
import Navigation from '../components/Navigation';


interface LLMRouterConfig {
  selectedModel: string;
  selectedProvider: string;
  latencyWeight: number;
  costWeight: number;
  providers: {
    [key: string]: {
      enabled: boolean;
      priority: number;
    };
  };
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // LLM config dialog state

  // Provider order state
  const [providerOrder, setProviderOrder] = useState<string[]>([
    'ollama', 'openai', 'groq', 'anthropic', 'aws', 'azure'
  ]);
  const [providerEnabled, setProviderEnabled] = useState<Record<string, boolean>>({});

  // Load LLM provider status
  const [llmProviders, setLlmProviders] = useState<any[]>([]);
  const [llmLoading, setLlmLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  // LLM provider management state
  const [providerModels, setProviderModels] = useState<Record<string, string[]>>({});
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [updatingModel, setUpdatingModel] = useState(false);
  
  // API key management state
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState<Record<string, { hasKey: boolean; maskedKey?: string }>>({});

  // Auto-refresh state
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [previousProviderStatus, setPreviousProviderStatus] = useState<Record<string, boolean>>({});
  const [statusNotifications, setStatusNotifications] = useState<string[]>([]);

  // Add Ollama endpoint dialog state
  const [ollamaEndpointDialogOpen, setOllamaEndpointDialogOpen] = useState(false);
  const [ollamaEndpoint, setOllamaEndpoint] = useState('');
  const [ollamaEndpointLoading, setOllamaEndpointLoading] = useState(false);
  const [ollamaEndpointError, setOllamaEndpointError] = useState<string | null>(null);

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        if (userData.role === 'ADMIN') {
          loadData();
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Note: Provider order and enabled state are now loaded from database in loadData()
  // This useEffect was causing the enabled state to be overridden with availability status

  // Debug effect to see current state
  useEffect(() => {
    console.log('Current llmProviders:', llmProviders);
    console.log('Current providerOrder:', providerOrder);
    console.log('Current providerEnabled:', providerEnabled);
  }, [llmProviders, providerOrder, providerEnabled]);

  // Auto-refresh effect - always on!
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;

    const interval = setInterval(async () => {
      console.log('Auto-refreshing provider status...');
      
      // Store current providers for comparison
      const oldProviders = [...llmProviders];
      
      // Update provider status without triggering full re-render
      try {
        const response = await fetch('/api/llm/providers', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });
        if (response.ok) {
          const data = await response.json();
          const newProviders = data.providers || [];
          
          // Update only the status information, preserving the existing structure
          setLlmProviders(prevProviders => {
            const updatedProviders = prevProviders.map(prevProvider => {
              const newProvider = newProviders.find((p: any) => p.key === prevProvider.key);
              if (newProvider) {
                return {
                  ...prevProvider,
                  isAvailable: newProvider.isAvailable,
                  avgLatencyMs: newProvider.avgLatencyMs,
                  model: newProvider.model
                };
              }
              return prevProvider;
            });
            return updatedProviders;
          });
          
          // Update API key status
          await loadAllApiKeyStatus();
          setLastRefresh(new Date());
          
          // Check for status changes and show notifications
          const notifications: string[] = [];
          
          newProviders.forEach((newProvider: any) => {
            const oldProvider = oldProviders.find(p => p.key === newProvider.key);
            if (oldProvider) {
              if (!oldProvider.isAvailable && newProvider.isAvailable) {
                notifications.push(`${newProvider.name} is now online!`);
              } else if (oldProvider.isAvailable && !newProvider.isAvailable) {
                notifications.push(`${newProvider.name} went offline`);
              }
            }
          });
          
          if (notifications.length > 0) {
            setStatusNotifications(prev => [...prev, ...notifications]);
            // Clear notifications after 3 seconds
            setTimeout(() => {
              setStatusNotifications(prev => prev.filter(n => !notifications.includes(n)));
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Error during auto-refresh:', error);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [user]); // Remove llmProviders dependency to prevent re-triggering

  // Load all API key status at once
  const loadAllApiKeyStatus = async () => {
    const providerKeys = ['groq', 'openai', 'anthropic', 'aws', 'azure'];
    const promises = providerKeys.map(loadApiKeyStatus);
    await Promise.all(promises);
  };

  const loadLLMProviders = async () => {
    setLlmLoading(true);
    try {
      const response = await fetch('/api/llm/providers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('LLM Providers API response:', data);
        console.log('Providers array:', data.providers);
        setLlmProviders(data.providers || []);
      } else {
        console.error('Failed to load LLM providers:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading LLM providers:', error);
    } finally {
      setLlmLoading(false);
    }
  };

  const testLLMProvider = async (providerKey: string) => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/llm/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          provider: providerKey,
          prompt: 'Hello! Please respond with a short health tip.'
        })
      });
      
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: 'Failed to test provider' });
    } finally {
      setTesting(false);
    }
  };

  const loadProviderModels = async (provider: string) => {
    try {
      const response = await fetch(`/api/llm/providers/${provider}/models`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProviderModels(prev => ({
            ...prev,
            [provider]: data.models || []
          }));
        }
      }
    } catch (error) {
      console.error(`Error loading ${provider} models:`, error);
    }
  };

  const loadApiKeyStatus = async (provider: string) => {
    try {
      const response = await fetch(`/api/llm/providers/${provider}/api-key`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setApiKeyStatus(prev => ({
          ...prev,
          [provider]: {
            hasKey: data.hasApiKey,
            maskedKey: data.maskedApiKey
          }
        }));
      }
    } catch (error) {
      console.error(`Error loading ${provider} API key status:`, error);
    }
  };

  const openModelDialog = async (provider: string, currentModel: string) => {
    setSelectedProvider(provider);
    setSelectedModel(currentModel);
    await loadProviderModels(provider);
    setModelDialogOpen(true);
  };

  const openApiKeyDialog = async (provider: string) => {
    setEditingProvider(provider);
    setApiKey('');
    await loadApiKeyStatus(provider);
    setApiKeyDialogOpen(true);
  };

  const updateProviderModel = async () => {
    setUpdatingModel(true);
    try {
      const response = await fetch(`/api/llm/providers/${selectedProvider}/models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ model: selectedModel })
      });
      
      if (response.ok) {
        setModelDialogOpen(false);
        // Force a refresh of the LLM router to pick up the new model
        try {
          await fetch('/api/llm/refresh', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          });
        } catch (error) {
          console.error('Failed to refresh LLM router:', error);
        }
        // Refresh the providers to show the updated model
        await loadLLMProviders();
        // Reload data to show updated settings
        await loadData();
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to update model');
      }
    } catch (error) {
      setError('Failed to update model');
      console.error('Error updating provider model:', error);
    } finally {
      setUpdatingModel(false);
    }
  };

  const saveApiKey = async () => {
    try {
      const response = await fetch(`/api/llm/providers/${editingProvider}/api-key`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ apiKey })
      });
      
      if (response.ok) {
        setApiKeyDialogOpen(false);
        setApiKey('');
        
        // Immediately refresh everything
        await Promise.all([
          loadApiKeyStatus(editingProvider),
          loadLLMProviders(),
          fetch('/api/llm/refresh', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }).catch(error => console.error('Failed to refresh LLM router:', error))
        ]);
        
        setLastRefresh(new Date());
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to save API key');
      }
    } catch (error) {
      setError('Failed to save API key');
      console.error('Error saving API key:', error);
    }
  };

  const removeApiKey = async () => {
    try {
      const response = await fetch(`/api/llm/providers/${editingProvider}/api-key`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        setApiKeyDialogOpen(false);
        setApiKey('');
        // Immediately refresh everything
        await Promise.all([
          loadApiKeyStatus(editingProvider),
          loadLLMProviders(),
          fetch('/api/llm/refresh', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }).catch(error => console.error('Failed to refresh LLM router:', error))
        ]);
        
        setLastRefresh(new Date());
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to remove API key');
      }
    } catch (error) {
      setError('Failed to remove API key');
      console.error('Error removing API key:', error);
    }
  };

  const clearLLMCache = async () => {
    try {
      const response = await fetch('/api/llm/clear-cache', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        // Show success message
        setError(null);
        // You could add a success state here if needed
      } else {
        setError('Failed to clear cache');
      }
    } catch (error) {
      setError('Failed to clear cache');
      console.error('Error clearing LLM cache:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load LLM providers
      await loadLLMProviders();
      await loadAllApiKeyStatus();

      // Load LLM settings to get provider order and enabled state
      const llmRes = await fetch('/api/settings/llm', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (llmRes.ok) {
        const llmData = await llmRes.json();
        
        // Extract provider order and enabled state from settings
        if (llmData.config?.providers) {
          const providers = llmData.config.providers;
          const orderedProviders = Object.entries(providers)
            .sort(([_, a], [__, b]) => (a as any).priority - (b as any).priority)
            .map(([key, _]) => key);
          
          setProviderOrder(orderedProviders);
          
          const enabledState: Record<string, boolean> = {};
          Object.entries(providers).forEach(([key, config]) => {
            enabledState[key] = (config as any).enabled;
          });
          setProviderEnabled(enabledState);
        } else {
          // Fallback: if no settings exist, create default settings
          const defaultOrder = ['ollama', 'openai', 'groq', 'anthropic', 'aws', 'azure'];
          const defaultEnabled = {
            ollama: true,
            openai: true,
            groq: true,
            anthropic: true,
            aws: false,
            azure: false,
          };
          
          setProviderOrder(defaultOrder);
          setProviderEnabled(defaultEnabled);
          
          // Save the default settings to database
          await saveProviderSettings(defaultOrder, defaultEnabled);
        }
      }
    } catch (err) {
      setError('Failed to load admin data');
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format pricing display
  const formatPricing = (provider: any) => {
    if (!provider.pricing) return 'N/A';
    
    const { pricing, model } = provider;
    
    if (pricing.type === 'free') {
      return 'Free';
    }
    
    if (pricing.type === 'flat') {
      return `$${(pricing.costPer1k * 1000).toFixed(2)}/1M tokens`;
    }
    
    if (pricing.type === 'input_output') {
      // Get model-specific pricing if available
      let inputCost = pricing.inputCostPer1k;
      let outputCost = pricing.outputCostPer1k;
      
      if (model && pricing.modelPricing && pricing.modelPricing[model]) {
        const modelPricing = pricing.modelPricing[model];
        inputCost = modelPricing.inputCostPer1k || inputCost;
        outputCost = modelPricing.outputCostPer1k || outputCost;
      }
      
      if (inputCost === outputCost) {
        return `$${(inputCost * 1000).toFixed(2)}/1M tokens`;
      } else {
        return `$${(inputCost * 1000).toFixed(2)}/1M input, $${(outputCost * 1000).toFixed(2)}/1M output`;
      }
    }
    
    return 'N/A';
  };

  // Helper function to get cost for priority calculation (kept as per 1k for internal calculations)
  const getProviderCost = (provider: any) => {
    if (!provider.pricing) return 0;
    
    const { pricing, model } = provider;
    
    if (pricing.type === 'free') {
      return 0;
    }
    
    if (pricing.type === 'flat') {
      return pricing.costPer1k || 0;
    }
    
    if (pricing.type === 'input_output') {
      // Get model-specific pricing if available
      let inputCost = pricing.inputCostPer1k || 0;
      let outputCost = pricing.outputCostPer1k || 0;
      
      if (model && pricing.modelPricing && pricing.modelPricing[model]) {
        const modelPricing = pricing.modelPricing[model];
        inputCost = modelPricing.inputCostPer1k || inputCost;
        outputCost = modelPricing.outputCostPer1k || outputCost;
      }
      
      // Return average cost for priority calculation
      return (inputCost + outputCost) / 2;
    }
    
    return 0;
  };

  // Function to open the dialog and prefill endpoint
  const openOllamaEndpointDialog = (currentEndpoint: string) => {
    setOllamaEndpoint(currentEndpoint);
    setOllamaEndpointError(null);
    setOllamaEndpointDialogOpen(true);
  };

  // Function to update the endpoint
  const updateOllamaEndpoint = async () => {
    setOllamaEndpointLoading(true);
    setOllamaEndpointError(null);
    try {
      const response = await fetch('/api/llm/providers/ollama/endpoint', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ endpoint: ollamaEndpoint })
      });
      if (response.ok) {
        setOllamaEndpointDialogOpen(false);
        await loadLLMProviders();
      } else {
        const error = await response.json();
        setOllamaEndpointError(error.error || 'Failed to update endpoint');
      }
    } catch (error) {
      setOllamaEndpointError('Failed to update endpoint');
    } finally {
      setOllamaEndpointLoading(false);
    }
  };

  const resetUsageStats = async (providerKey: string) => {
    try {
      const response = await fetch(`/api/llm/usage/${providerKey}/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        // Refresh the providers to show updated usage stats
        await loadLLMProviders();
        setError(null);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to reset usage statistics');
      }
    } catch (error) {
      setError('Failed to reset usage statistics');
      console.error('Error resetting usage stats:', error);
    }
  };

  // Handle up/down priority movement
  const moveProviderUp = async (index: number) => {
    if (index === 0) return; // Already at top
    const newOrder = Array.from(providerOrder);
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    setProviderOrder(newOrder);
    
    // Save the new order to database
    await saveProviderSettings(newOrder, providerEnabled);
  };

  const moveProviderDown = async (index: number) => {
    if (index === providerOrder.length - 1) return; // Already at bottom
    const newOrder = Array.from(providerOrder);
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setProviderOrder(newOrder);
    
    // Save the new order to database
    await saveProviderSettings(newOrder, providerEnabled);
  };

  // Handle enable/disable toggle
  const handleProviderToggle = async (key: string) => {
    const newEnabled = { ...providerEnabled, [key]: !providerEnabled[key] };
    setProviderEnabled(newEnabled);
    
    // Save the new enabled state to database
    await saveProviderSettings(providerOrder, newEnabled);
  };

  // Save provider settings to database
  const saveProviderSettings = async (order: string[], enabled: Record<string, boolean>) => {
    try {
      const settings = {
        selectedModel: 'llama3.2:3b',
        selectedProvider: 'ollama',
        latencyWeight: 0.5,
        costWeight: 0.5,
        providers: {
          ollama: { enabled: enabled.ollama, priority: order.indexOf('ollama') + 1 },
          openai: { enabled: enabled.openai, priority: order.indexOf('openai') + 1 },
          groq: { enabled: enabled.groq, priority: order.indexOf('groq') + 1 },
          anthropic: { enabled: enabled.anthropic, priority: order.indexOf('anthropic') + 1 },
          aws: { enabled: enabled.aws, priority: order.indexOf('aws') + 1 },
          azure: { enabled: enabled.azure, priority: order.indexOf('azure') + 1 },
        }
      };

      const response = await fetch('/api/settings/llm', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        console.error('Failed to save provider settings');
      }
    } catch (error) {
      console.error('Error saving provider settings:', error);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <div>
      <Navigation />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper sx={{ width: '100%' }}>
          <Box sx={{ p: 3 }}>
            {/* Global Settings Section */}


            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">LLM Provider Status</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                  Last: {lastRefresh.toLocaleTimeString()}
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={async () => {
                    setLlmLoading(true);
                    try {
                      const response = await fetch('/api/llm/providers', {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                      });
                      if (response.ok) {
                        const data = await response.json();
                        const newProviders = data.providers || [];
                        
                        // Update only the status information, preserving the existing structure
                        setLlmProviders(prevProviders => {
                          const updatedProviders = prevProviders.map(prevProvider => {
                            const newProvider = newProviders.find((p: any) => p.key === prevProvider.key);
                            if (newProvider) {
                              return {
                                ...prevProvider,
                                isAvailable: newProvider.isAvailable,
                                avgLatencyMs: newProvider.avgLatencyMs,
                                model: newProvider.model
                              };
                            }
                            return prevProvider;
                          });
                          return updatedProviders;
                        });
                        
                        await loadAllApiKeyStatus();
                        setLastRefresh(new Date());
                      }
                    } catch (error) {
                      console.error('Error during manual refresh:', error);
                    } finally {
                      setLlmLoading(false);
                    }
                  }}
                  disabled={llmLoading}
                  size="small"
                >
                  {llmLoading ? <CircularProgress size={16} /> : 'Refresh Now'}
                </Button>
              </Box>
            </Box>
            <Grid container spacing={2}>
              {providerOrder.length === 0 && llmProviders.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    {llmLoading ? 'Initializing LLM providers... This may take a few seconds.' : 'No providers loaded. Please check the console for debugging information.'}
                  </Alert>
                </Grid>
              )}
              {providerOrder.map((key, index) => {
                const provider = llmProviders.find(p => p.key === key);
                console.log(`Rendering provider ${key}:`, provider);
                if (!provider) {
                  console.log(`Provider ${key} not found in llmProviders`);
                  return (
                    <Grid item xs={12} md={6} key={`provider-${key}`}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6">{key}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Provider not loaded yet...
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                }
                return (
                  <Grid item xs={12} md={6} key={`provider-${provider.key}`}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6">{provider.name}</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Button
                                size="small"
                                onClick={() => moveProviderUp(index)}
                                disabled={index === 0}
                                sx={{ minWidth: 'auto', p: 0.5 }}
                              >
                                ↑
                              </Button>
                              <Button
                                size="small"
                                onClick={() => moveProviderDown(index)}
                                disabled={index === providerOrder.length - 1}
                                sx={{ minWidth: 'auto', p: 0.5 }}
                              >
                                ↓
                              </Button>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={providerEnabled[provider.key] ?? true}
                                  onChange={() => handleProviderToggle(provider.key)}
                                  size="small"
                                />
                              }
                              label={providerEnabled[provider.key] ? 'Enabled' : 'Disabled'}
                              sx={{ mr: 1 }}
                            />
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{
                                transition: 'color 0.3s ease',
                                color: provider.isAvailable ? 'success.main' : 'error.main'
                              }}
                            >
                              {provider.isAvailable ? 'Online' : 'Offline'}
                            </Typography>
                            <Box sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: provider.isAvailable ? '#4caf50' : '#f44336',
                              boxShadow: provider.isAvailable ? '0 0 8px rgba(76, 175, 80, 0.5)' : 'none',
                              transition: 'all 0.3s ease',
                              animation: provider.isAvailable ? 'pulse 2s infinite' : 'none',
                              '@keyframes pulse': {
                                '0%': {
                                  boxShadow: '0 0 8px rgba(76, 175, 80, 0.5)'
                                },
                                '50%': {
                                  boxShadow: '0 0 12px rgba(76, 175, 80, 0.8)'
                                },
                                '100%': {
                                  boxShadow: '0 0 8px rgba(76, 175, 80, 0.5)'
                                }
                              }
                            }} />
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Endpoint: {provider.endpoint}
                        </Typography>
                        {provider.model && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Model: {provider.model}
                          </Typography>
                        )}
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          gutterBottom
                          sx={{
                            transition: 'color 0.3s ease',
                            color: provider.avgLatencyMs < 100 ? 'success.main' : 
                                   provider.avgLatencyMs < 500 ? 'warning.main' : 'error.main'
                          }}
                        >
                          Latency: {provider.avgLatencyMs}ms
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Cost: {formatPricing(provider)}
                        </Typography>
                        {provider.usage && (
                          <Box sx={{ mt: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <strong>Usage Statistics:</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                              Total Tokens: {provider.usage.totalTokens.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                              Total Cost: ${provider.usage.totalCost.toFixed(4)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                              Requests: {provider.usage.requestCount}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                              Last Reset: {new Date(provider.usage.lastResetAt).toLocaleDateString()}
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => resetUsageStats(provider.key)}
                              sx={{ mt: 1 }}
                            >
                              Reset Usage
                            </Button>
                          </Box>
                        )}
                        {provider.key !== 'ollama' && apiKeyStatus[provider.key]?.hasKey && !provider.isAvailable && (
                          <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>
                            API key present but provider offline. Try refreshing.
                          </Alert>
                        )}
                        {provider.key !== 'ollama' && !apiKeyStatus[provider.key]?.hasKey && (
                          <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
                            No API key configured
                          </Alert>
                        )}
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => testLLMProvider(provider.key)}
                            disabled={testing || !provider.isAvailable}
                          >
                            {testing ? 'Testing...' : 'Test Provider'}
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => openModelDialog(provider.key, provider.model || '')}
                            disabled={!provider.isAvailable}
                          >
                            Change Model
                          </Button>
                          {provider.key === 'ollama' && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => openOllamaEndpointDialog(provider.endpoint)}
                              sx={{ ml: 1 }}
                            >
                              Update Endpoint
                            </Button>
                          )}
                          {provider.key !== 'ollama' && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => openApiKeyDialog(provider.key)}
                              sx={{ ml: 1 }}
                            >
                              {apiKeyStatus[provider.key]?.hasKey ? 'Update API Key' : 'Add API Key'}
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
            
            {/* Status Notifications */}
            {statusNotifications.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {statusNotifications.map((notification, index) => (
                  <Alert 
                    key={index} 
                    severity="success" 
                    sx={{ mb: 1 }}
                    onClose={() => setStatusNotifications(prev => prev.filter((_, i) => i !== index))}
                  >
                    {notification}
                  </Alert>
                ))}
              </Box>
            )}
            
            {/* Test Result */}
            {testResult && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Test Result
                </Typography>
                <Card>
                  <CardContent>
                    {testResult.success ? (
                      <Box>
                        <Typography variant="body2" color="success.main" gutterBottom>
                          ✅ Test successful using {testResult.provider}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          Response: {testResult.content}
                        </Typography>
                        {testResult.usage && (
                          <Typography variant="body2" color="text.secondary">
                            Tokens used: {testResult.usage.totalTokens}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="error.main">
                        ❌ Test failed: {testResult.error}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Provider Model Selection Dialog */}
        <Dialog open={modelDialogOpen} onClose={() => setModelDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Select {selectedProvider} Model</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Choose a model from available {selectedProvider} models:
            </Typography>
            
            {!providerModels[selectedProvider] || providerModels[selectedProvider].length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Loading models...
                </Typography>
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                {providerModels[selectedProvider].map((model: string) => (
                  <Box
                    key={model}
                    sx={{
                      p: 2,
                      border: selectedModel === model ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      backgroundColor: selectedModel === model ? '#f3f6ff' : 'transparent',
                      '&:hover': {
                        backgroundColor: selectedModel === model ? '#f3f6ff' : '#f5f5f5'
                      }
                    }}
                    onClick={() => setSelectedModel(model)}
                  >
                    <Typography variant="subtitle1" fontWeight="medium">
                      {model}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModelDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={updateProviderModel} 
              variant="contained"
              disabled={updatingModel || !selectedModel}
            >
              {updatingModel ? 'Updating...' : 'Update Model'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* API Key Management Dialog */}
        <Dialog open={apiKeyDialogOpen} onClose={() => setApiKeyDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Manage {editingProvider} API Key</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {apiKeyStatus[editingProvider]?.hasKey 
                ? `Current API Key: ${apiKeyStatus[editingProvider]?.maskedKey}`
                : 'No API key configured. Add one to enable this provider.'
              }
            </Typography>
            
            <TextField
              fullWidth
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              margin="normal"
              placeholder="Enter your API key"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApiKeyDialogOpen(false)}>Cancel</Button>
            {apiKeyStatus[editingProvider]?.hasKey && (
              <Button onClick={removeApiKey} color="error">
                Remove Key
              </Button>
            )}
            <Button 
              onClick={saveApiKey} 
              variant="contained"
              disabled={!apiKey.trim()}
            >
              Save API Key
            </Button>
          </DialogActions>
        </Dialog>

        {/* Ollama Endpoint Dialog */}
        <Dialog open={ollamaEndpointDialogOpen} onClose={() => setOllamaEndpointDialogOpen(false)}>
          <DialogTitle>Update Ollama Endpoint</DialogTitle>
          <DialogContent>
            <TextField
              label="Ollama Endpoint"
              fullWidth
              value={ollamaEndpoint}
              onChange={e => setOllamaEndpoint(e.target.value)}
              margin="normal"
              autoFocus
            />
            {ollamaEndpointError && (
              <Alert severity="error" sx={{ mt: 1 }}>{ollamaEndpointError}</Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOllamaEndpointDialogOpen(false)} disabled={ollamaEndpointLoading}>Cancel</Button>
            <Button onClick={updateOllamaEndpoint} variant="contained" disabled={ollamaEndpointLoading}>
              {ollamaEndpointLoading ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </div>
  );
}