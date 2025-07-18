'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
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
  CardActions,
  IconButton,
  Chip,
  Grid,
  MenuItem
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import Navigation from '../components/Navigation';

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number;
  createdAt: string;
  updatedAt: string;
}

interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

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
  const [tabValue, setTabValue] = useState(0);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [llmConfig, setLlmConfig] = useState<LLMRouterConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Feature flag dialog state
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [flagForm, setFlagForm] = useState({
    key: '',
    name: '',
    description: '',
    enabled: false,
    rolloutPercentage: 0
  });

  // LLM config dialog state
  const [llmDialogOpen, setLlmDialogOpen] = useState(false);
  const [llmForm, setLlmForm] = useState({
    selectedModel: 'llama3.2:3b',
    selectedProvider: 'ollama',
    latencyWeight: 0.7,
    costWeight: 0.3,
    providers: {
      ollama: { enabled: true, priority: 1 },
      groq: { enabled: true, priority: 2 },
      openai: { enabled: true, priority: 3 },
      anthropic: { enabled: true, priority: 4 },
      aws: { enabled: false, priority: 5 },
      azure: { enabled: false, priority: 6 }
    }
  });

  // Load LLM provider status
  const [llmProviders, setLlmProviders] = useState<any[]>([]);
  const [llmLoading, setLlmLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  // Ollama model selection state
  const [ollamaModels, setOllamaModels] = useState<any[]>([]);
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [updatingModel, setUpdatingModel] = useState(false);

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

  const loadLLMProviders = async () => {
    setLlmLoading(true);
    try {
      const response = await fetch('/api/llm/providers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLlmProviders(data.providers || []);
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

  const loadOllamaModels = async () => {
    try {
      const response = await fetch('/api/llm/ollama-models', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOllamaModels(data.models || []);
      }
    } catch (error) {
      console.error('Error loading Ollama models:', error);
    }
  };

  const openModelDialog = async (currentModel: string) => {
    setSelectedModel(currentModel);
    await loadOllamaModels();
    setModelDialogOpen(true);
  };

  const updateOllamaModel = async () => {
    setUpdatingModel(true);
    try {
      // Update the LLM settings with the new model
      const currentSettings = await fetch('/api/settings/llm', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      }).then(res => res.json());

      const updatedSettings = {
        ...currentSettings.config,
        selectedModel: selectedModel,
        selectedProvider: 'ollama'
      };

      const response = await fetch('/api/settings/llm', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(updatedSettings)
      });
      
      if (response.ok) {
        setModelDialogOpen(false);
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
      console.error('Error updating Ollama model:', error);
    } finally {
      setUpdatingModel(false);
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

      const [flagsRes, settingsRes, llmRes] = await Promise.all([
        fetch('/api/feature-flags', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        }),
        fetch('/api/settings', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        }),
        fetch('/api/settings/llm', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        })
      ]);

      // Load LLM providers status
      await loadLLMProviders();

      if (flagsRes.ok) {
        const flagsData = await flagsRes.json();
        setFeatureFlags(flagsData.flags);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData.settings);
      }

      if (llmRes.ok) {
        const llmData = await llmRes.json();
        setLlmConfig(llmData.config);
        setLlmForm(llmData.config);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const openFlagDialog = (flag?: FeatureFlag) => {
    if (flag) {
      setEditingFlag(flag);
      setFlagForm({
        key: flag.key,
        name: flag.name,
        description: flag.description || '',
        enabled: flag.enabled,
        rolloutPercentage: flag.rolloutPercentage
      });
    } else {
      setEditingFlag(null);
      setFlagForm({
        key: '',
        name: '',
        description: '',
        enabled: false,
        rolloutPercentage: 0
      });
    }
    setFlagDialogOpen(true);
  };

  const saveFeatureFlag = async () => {
    try {
      const response = await fetch('/api/feature-flags', {
        method: editingFlag ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(flagForm)
      });

      if (response.ok) {
        setFlagDialogOpen(false);
        loadData();
      } else {
        setError('Failed to save feature flag');
      }
    } catch (err) {
      setError('Failed to save feature flag');
      console.error('Error saving feature flag:', err);
    }
  };

  const deleteFeatureFlag = async (key: string) => {
    try {
      const response = await fetch(`/api/feature-flags/${key}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });

      if (response.ok) {
        loadData();
      } else {
        setError('Failed to delete feature flag');
      }
    } catch (err) {
      setError('Failed to delete feature flag');
      console.error('Error deleting feature flag:', err);
    }
  };

  const saveLLMConfig = async () => {
    try {
      const response = await fetch('/api/settings/llm', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(llmForm)
      });

      if (response.ok) {
        setLlmDialogOpen(false);
        loadData();
      } else {
        setError('Failed to save LLM config');
      }
    } catch (err) {
      setError('Failed to save LLM config');
      console.error('Error saving LLM config:', err);
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
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Feature Flags" />
            <Tab label="Settings" />
            <Tab label="LLM Router" />
            <Tab label="LLM Providers" />
          </Tabs>

          {/* Feature Flags Tab */}
          {tabValue === 0 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Feature Flags</Typography>
                <Button variant="contained" onClick={() => openFlagDialog()}>
                  Add Feature Flag
                </Button>
              </Box>

              {featureFlags.map((flag) => (
                <Card key={flag.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6">{flag.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Key: {flag.key}
                        </Typography>
                        {flag.description && (
                          <Typography variant="body2" color="text.secondary">
                            {flag.description}
                          </Typography>
                        )}
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label={flag.enabled ? 'Enabled' : 'Disabled'} 
                            color={flag.enabled ? 'success' : 'default'}
                            size="small"
                          />
                          {flag.enabled && (
                            <Chip 
                              label={`${flag.rolloutPercentage}% rollout`} 
                              variant="outlined"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Box>
                        <IconButton onClick={() => openFlagDialog(flag)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => deleteFeatureFlag(flag.key)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Settings Tab */}
          {tabValue === 1 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                System Settings
              </Typography>
              {settings.map((setting) => (
                <Card key={setting.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6">{setting.key}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {setting.value}
                    </Typography>
                    {setting.description && (
                      <Typography variant="body2" color="text.secondary">
                        {setting.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* LLM Router Tab */}
          {tabValue === 2 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">LLM Router Configuration</Typography>
                <Button variant="contained" onClick={() => setLlmDialogOpen(true)}>
                  Edit Configuration
                </Button>
              </Box>

              {llmConfig && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Weights
                    </Typography>
                    <Typography variant="body2">
                      Latency Weight: {llmConfig.latencyWeight}
                    </Typography>
                    <Typography variant="body2">
                      Cost Weight: {llmConfig.costWeight}
                    </Typography>

                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Providers
                    </Typography>
                    {Object.entries(llmConfig.providers).map(([name, config]) => (
                      <Box key={name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label={name} 
                          color={config.enabled ? 'success' : 'default'}
                          size="small"
                        />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          Priority: {config.priority}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {/* LLM Providers Tab */}
          {tabValue === 3 && (
            <Box sx={{ p: 3 }}>
              {/* Global Settings Section */}
              {llmConfig && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">Global LLM Settings</Typography>
                      <Button 
                        variant="outlined" 
                        onClick={() => setLlmDialogOpen(true)}
                        size="small"
                      >
                        Configure
                      </Button>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Current Provider: <strong>{llmConfig.selectedProvider}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Current Model: <strong>{llmConfig.selectedModel}</strong>
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Latency Weight: <strong>{llmConfig.latencyWeight}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Cost Weight: <strong>{llmConfig.costWeight}</strong>
                        </Typography>
                      </Grid>
                    </Grid>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                      These settings apply to all users globally
                    </Typography>
                  </CardContent>
                </Card>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">LLM Provider Status</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    onClick={clearLLMCache}
                    size="small"
                  >
                    Clear Cache
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={loadLLMProviders}
                    disabled={llmLoading}
                  >
                    {llmLoading ? <CircularProgress size={20} /> : 'Refresh'}
                  </Button>
                </Box>
              </Box>

              {llmLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {llmProviders.map((provider) => (
                    <Grid item xs={12} md={6} key={provider.name}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">{provider.name}</Typography>
                            <Chip 
                              label={provider.isAvailable ? 'Available' : 'Unavailable'} 
                              color={provider.isAvailable ? 'success' : 'error'}
                              size="small"
                            />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Endpoint: {provider.endpoint}
                          </Typography>
                          
                          {provider.model && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Model: {provider.model}
                            </Typography>
                          )}
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Latency: {provider.avgLatencyMs}ms
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Cost: ${provider.costPer1k}/1k tokens
                          </Typography>
                          
                          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => testLLMProvider(provider.key)}
                              disabled={testing || !provider.isAvailable}
                            >
                              {testing ? 'Testing...' : 'Test Provider'}
                            </Button>
                            
                            {provider.name === 'Ollama' && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => openModelDialog(provider.model || '')}
                                disabled={!provider.isAvailable}
                              >
                                Change Model
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                  
                  {llmProviders.length === 0 && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                          No LLM providers configured. Check your environment variables.
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Required: OLLAMA_BASE_URL, OPENAI_API_KEY, GROQ_API_KEY, or ANTHROPIC_API_KEY
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
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
          )}
        </Paper>

        {/* Feature Flag Dialog */}
        <Dialog open={flagDialogOpen} onClose={() => setFlagDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingFlag ? 'Edit Feature Flag' : 'Add Feature Flag'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Key"
              value={flagForm.key}
              onChange={(e) => setFlagForm({ ...flagForm, key: e.target.value })}
              margin="normal"
              disabled={!!editingFlag}
            />
            <TextField
              fullWidth
              label="Name"
              value={flagForm.name}
              onChange={(e) => setFlagForm({ ...flagForm, name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={flagForm.description}
              onChange={(e) => setFlagForm({ ...flagForm, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={flagForm.enabled}
                  onChange={(e) => setFlagForm({ ...flagForm, enabled: e.target.checked })}
                />
              }
              label="Enabled"
              sx={{ mt: 2 }}
            />
            {flagForm.enabled && (
              <Box sx={{ mt: 2 }}>
                <Typography gutterBottom>Rollout Percentage</Typography>
                <Slider
                  value={flagForm.rolloutPercentage}
                  onChange={(e, value) => setFlagForm({ ...flagForm, rolloutPercentage: value as number })}
                  min={0}
                  max={100}
                  step={5}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFlagDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveFeatureFlag} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* LLM Config Dialog */}
        <Dialog open={llmDialogOpen} onClose={() => setLlmDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>LLM Router Configuration</DialogTitle>
          <DialogContent>
            <Typography variant="h6" gutterBottom>
              Global Model & Provider Settings
            </Typography>
            
            <TextField
              select
              fullWidth
              label="Selected Provider"
              value={llmForm.selectedProvider}
              onChange={(e) => setLlmForm({ ...llmForm, selectedProvider: e.target.value })}
              margin="normal"
            >
              <MenuItem value="ollama">Ollama (Local)</MenuItem>
              <MenuItem value="openai">OpenAI</MenuItem>
              <MenuItem value="groq">Groq</MenuItem>
              <MenuItem value="anthropic">Anthropic</MenuItem>
              <MenuItem value="aws">AWS Bedrock</MenuItem>
              <MenuItem value="azure">Azure AI</MenuItem>
            </TextField>

            <TextField
              fullWidth
              label="Selected Model"
              value={llmForm.selectedModel}
              onChange={(e) => setLlmForm({ ...llmForm, selectedModel: e.target.value })}
              margin="normal"
              helperText="This model will be used for all users"
            />

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Router Weights
            </Typography>
            
            <Typography gutterBottom>Latency Weight</Typography>
            <Slider
              value={llmForm.latencyWeight}
              onChange={(e, value) => setLlmForm({ ...llmForm, latencyWeight: value as number })}
              min={0}
              max={1}
              step={0.1}
              marks
              valueLabelDisplay="auto"
            />
            
            <Typography gutterBottom sx={{ mt: 2 }}>Cost Weight</Typography>
            <Slider
              value={llmForm.costWeight}
              onChange={(e, value) => setLlmForm({ ...llmForm, costWeight: value as number })}
              min={0}
              max={1}
              step={0.1}
              marks
              valueLabelDisplay="auto"
            />

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Providers
            </Typography>
            {Object.entries(llmForm.providers).map(([name, config]) => (
              <Box key={name} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enabled}
                      onChange={(e) => setLlmForm({
                        ...llmForm,
                        providers: {
                          ...llmForm.providers,
                          [name]: { ...config, enabled: e.target.checked }
                        }
                      })}
                    />
                  }
                  label={name}
                />
                <TextField
                  type="number"
                  label="Priority"
                  value={config.priority}
                  onChange={(e) => setLlmForm({
                    ...llmForm,
                    providers: {
                      ...llmForm.providers,
                      [name]: { ...config, priority: parseInt(e.target.value) }
                    }
                  })}
                  sx={{ ml: 2, width: 100 }}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLlmDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveLLMConfig} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Ollama Model Selection Dialog */}
        <Dialog open={modelDialogOpen} onClose={() => setModelDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Select Ollama Model</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Choose a model from your installed Ollama models:
            </Typography>
            
            {ollamaModels.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Loading models...
                </Typography>
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                {ollamaModels.map((model) => (
                  <Box
                    key={model.name}
                    sx={{
                      p: 2,
                      border: selectedModel === model.name ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      backgroundColor: selectedModel === model.name ? '#f3f6ff' : 'transparent',
                      '&:hover': {
                        backgroundColor: selectedModel === model.name ? '#f3f6ff' : '#f5f5f5'
                      }
                    }}
                    onClick={() => setSelectedModel(model.name)}
                  >
                    <Typography variant="subtitle1" fontWeight="medium">
                      {model.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Size: {(model.size / 1024 / 1024 / 1024).toFixed(1)} GB
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Modified: {new Date(model.modified_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModelDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={updateOllamaModel} 
              variant="contained"
              disabled={updatingModel || !selectedModel}
            >
              {updatingModel ? 'Updating...' : 'Update Model'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </div>
  );
}