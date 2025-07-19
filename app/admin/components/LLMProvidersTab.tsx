'use client';

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert
} from '@mui/material';

interface LLMProvider {
  key: string;
  name: string;
  endpoint: string;
  isAvailable: boolean;
  avgLatencyMs: number;
  avgTokensPerSecond?: number;
  model?: string;
  usage?: any;
}

interface LLMProvidersTabProps {
  llmProviders: LLMProvider[];
  providerOrder: string[];
  providerEnabled: Record<string, boolean>;
  llmLoading: boolean;
  lastRefresh: Date;
  apiKeyStatus: Record<string, { hasKey: boolean; maskedKey?: string }>;
  testing: boolean;
  testingProvider: string | null;
  moveProviderUp: (index: number) => Promise<void>;
  moveProviderDown: (index: number) => Promise<void>;
  handleProviderToggle: (key: string) => Promise<void>;
  openModelDialog: (provider: string, currentModel: string) => Promise<void>;
  openApiKeyDialog: (provider: string) => Promise<void>;
  removeApiKey: () => Promise<void>;
  testLLMProvider: (providerKey: string) => Promise<void>;
  openOllamaEndpointDialog: (currentEndpoint: string) => void;
  updateOllamaEndpoint: () => Promise<void>;
  resetUsageStats: (providerKey: string) => Promise<void>;
  formatPricing: (provider: LLMProvider) => string;
  loadAllApiKeyStatus: () => Promise<void>;
}

export default function LLMProvidersTab({
  llmProviders,
  providerOrder,
  providerEnabled,
  llmLoading,
  lastRefresh,
  apiKeyStatus,
  testing,
  testingProvider,
  moveProviderUp,
  moveProviderDown,
  handleProviderToggle,
  openModelDialog,
  openApiKeyDialog,
  removeApiKey,
  testLLMProvider,
  openOllamaEndpointDialog,
  updateOllamaEndpoint,
  resetUsageStats,
  formatPricing,
  loadAllApiKeyStatus
}: LLMProvidersTabProps) {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">LLM Provider Status</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            Last: {lastRefresh.toLocaleTimeString()}
          </Typography>
          <Button 
            variant="outlined" 
            onClick={async () => {
              try {
                const response = await fetch('/api/llm/providers', {
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                });
                if (response.ok) {
                  await loadAllApiKeyStatus();
                }
              } catch (error) {
                console.error('Error during manual refresh:', error);
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
                  {provider.avgTokensPerSecond && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      gutterBottom
                      sx={{
                        color: provider.avgTokensPerSecond > 50 ? 'success.main' : 
                               provider.avgTokensPerSecond > 20 ? 'warning.main' : 'error.main'
                      }}
                    >
                      Avg Tokens/Second: {provider.avgTokensPerSecond.toFixed(1)}
                    </Typography>
                  )}
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
                        Total Cost: ${provider.usage.totalCost.toFixed(8)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        Requests: {provider.usage.requestCount}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => resetUsageStats(provider.key)}
                        sx={{ mt: 1 }}
                      >
                        Reset Stats
                      </Button>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    {provider.key !== 'ollama' && (
                      <>
                                                  <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openApiKeyDialog(provider.key)}
                            disabled={false}
                          >
                            {apiKeyStatus[provider.key]?.hasKey ? 'Update API Key' : 'Add API Key'}
                          </Button>
                          {apiKeyStatus[provider.key]?.hasKey && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => removeApiKey()}
                            >
                              Remove Key
                            </Button>
                          )}
                      </>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => openModelDialog(provider.key, provider.model || '')}
                      disabled={provider.key !== 'ollama' && (!apiKeyStatus[provider.key]?.hasKey || !provider.isAvailable)}
                    >
                      Change Model
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => testLLMProvider(provider.key)}
                      disabled={provider.key !== 'ollama' && (!apiKeyStatus[provider.key]?.hasKey || !provider.isAvailable)}
                    >
                      {testing && testingProvider === provider.key ? (
                        <>
                          <CircularProgress size={16} sx={{ mr: 1 }} />
                          Testing...
                        </>
                      ) : (
                        'Test'
                      )}
                    </Button>
                    {provider.key === 'ollama' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => openOllamaEndpointDialog(provider.endpoint)}
                      >
                        Update Endpoint
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
} 