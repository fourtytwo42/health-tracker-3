'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Image as ImageIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface ImageGenerationConfig {
  prompt: string;
  textModel: string;
  quality: 'low' | 'medium' | 'high' | 'auto';
  size: '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
  background: 'opaque' | 'transparent';
  format: 'png' | 'jpeg' | 'webp';
  outputCompression?: number;
}

const defaultConfig: ImageGenerationConfig = {
  prompt: '',
  textModel: 'gpt-4o-mini',
  quality: 'low',
  size: '1024x1024',
  background: 'opaque',
  format: 'png',
};

const textModels = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Cheapest)' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { value: 'gpt-4.1', label: 'GPT-4.1' },
  { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano' },
  { value: 'o3', label: 'O3' },
];

const qualityOptions = [
  { value: 'low', label: 'Low (Fastest, Cheapest)' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High (Slowest, Most Expensive)' },
  { value: 'auto', label: 'Auto (Model decides)' },
];

const sizeOptions = [
  { value: '1024x1024', label: '1024x1024 (Square)' },
  { value: '1536x1024', label: '1536x1024 (Landscape)' },
  { value: '1024x1536', label: '1024x1536 (Portrait)' },
  { value: 'auto', label: 'Auto (Model decides)' },
];

const backgroundOptions = [
  { value: 'opaque', label: 'Opaque' },
  { value: 'transparent', label: 'Transparent (PNG/WebP only)' },
];

const formatOptions = [
  { value: 'png', label: 'PNG (Best quality)' },
  { value: 'jpeg', label: 'JPEG (Faster, smaller)' },
  { value: 'webp', label: 'WebP (Good balance)' },
];

export default function ImageGeneratorTab() {
  const [config, setConfig] = useState<ImageGenerationConfig>(defaultConfig);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{
    revisedPrompt?: string;
    tokens?: number;
    cost?: number;
  } | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<{ hasKey: boolean; maskedKey?: string }>({ hasKey: false });

  const handleConfigChange = (field: keyof ImageGenerationConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    
    // Reset image when config changes
    if (generatedImage) {
      setGeneratedImage(null);
      setImageInfo(null);
    }
  };

  const checkApiKeyStatus = async () => {
    try {
      const response = await fetch('/api/admin/image-generation/api-key-status');
      if (response.ok) {
        const data = await response.json();
        setApiKeyStatus(data);
      }
    } catch (error) {
      console.error('Error checking API key status:', error);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    try {
      const response = await fetch('/api/admin/image-generation/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (response.ok) {
        setShowApiKeyDialog(false);
        setApiKey('');
        await checkApiKeyStatus();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save API key');
      }
    } catch (error) {
      setError('Failed to save API key');
    }
  };

  const removeApiKey = async () => {
    try {
      const response = await fetch('/api/admin/image-generation/api-key', {
        method: 'DELETE',
      });

      if (response.ok) {
        await checkApiKeyStatus();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove API key');
      }
    } catch (error) {
      setError('Failed to remove API key');
    }
  };

  // Check API key status on component mount
  React.useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const generateImage = async () => {
    if (!config.prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (!apiKeyStatus.hasKey) {
      setError('OpenAI API key not configured. Please add your API key first.');
      setShowApiKeyDialog(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setImageInfo(null);

    try {
      const response = await fetch('/api/admin/image-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImage(data.image);
      setImageInfo({
        revisedPrompt: data.revisedPrompt,
        tokens: data.tokens,
        cost: data.cost,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `generated-image-${Date.now()}.${config.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEstimatedCost = () => {
    // Rough cost estimation based on quality and size
    const baseCosts = {
      low: { square: 0.011, portrait: 0.016, landscape: 0.016 },
      medium: { square: 0.042, portrait: 0.063, landscape: 0.063 },
      high: { square: 0.167, portrait: 0.25, landscape: 0.25 },
    };

    const quality = config.quality === 'auto' ? 'medium' : config.quality;
    const size = config.size === 'auto' ? '1024x1024' : config.size;
    
    let costKey: 'square' | 'portrait' | 'landscape' = 'square';
    if (size === '1024x1536') costKey = 'portrait';
    if (size === '1536x1024') costKey = 'landscape';

    return baseCosts[quality][costKey];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Image Generator
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Generate images using GPT Image 1 with configurable settings
      </Typography>

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Configuration
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {apiKeyStatus.hasKey ? (
                    <>
                      <Alert severity="success" sx={{ py: 0, px: 1 }}>
                        API Key: {apiKeyStatus.maskedKey}
                      </Alert>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={removeApiKey}
                      >
                        Remove
                      </Button>
                    </>
                  ) : (
                    <Alert severity="warning" sx={{ py: 0, px: 1 }}>
                      No API Key
                    </Alert>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setShowApiKeyDialog(true)}
                  >
                    {apiKeyStatus.hasKey ? 'Update' : 'Add'} API Key
                  </Button>
                </Box>
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Prompt"
                value={config.prompt}
                onChange={(e) => handleConfigChange('prompt', e.target.value)}
                placeholder="Describe the image you want to generate..."
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Text Model</InputLabel>
                    <Select
                      value={config.textModel}
                      onChange={(e) => handleConfigChange('textModel', e.target.value)}
                      label="Text Model"
                    >
                      {textModels.map(model => (
                        <MenuItem key={model.value} value={model.value}>
                          {model.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Quality</InputLabel>
                    <Select
                      value={config.quality}
                      onChange={(e) => handleConfigChange('quality', e.target.value)}
                      label="Quality"
                    >
                      {qualityOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Size</InputLabel>
                    <Select
                      value={config.size}
                      onChange={(e) => handleConfigChange('size', e.target.value)}
                      label="Size"
                    >
                      {sizeOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Background</InputLabel>
                    <Select
                      value={config.background}
                      onChange={(e) => handleConfigChange('background', e.target.value)}
                      label="Background"
                    >
                      {backgroundOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={config.format}
                      onChange={(e) => handleConfigChange('format', e.target.value)}
                      label="Format"
                    >
                      {formatOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {(config.format === 'jpeg' || config.format === 'webp') && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Compression (%)"
                      value={config.outputCompression || 80}
                      onChange={(e) => handleConfigChange('outputCompression', parseInt(e.target.value) || 80)}
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </Grid>
                )}
              </Grid>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Estimated Cost:</strong> ~${getEstimatedCost().toFixed(3)} per image
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Note:</strong> Using GPT-4o-mini with low quality for cost efficiency
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                startIcon={isGenerating ? <CircularProgress size={20} /> : <ImageIcon />}
                onClick={generateImage}
                disabled={isGenerating || !config.prompt.trim()}
                sx={{ mt: 2 }}
              >
                {isGenerating ? 'Generating...' : 'Generate Image'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Generated Image Panel */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generated Image
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {isGenerating && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <CircularProgress size={60} />
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    Generating image...
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    This may take up to 2 minutes for complex prompts
                  </Typography>
                </Box>
              )}

              {generatedImage && (
                <Box>
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      display: 'flex', 
                      justifyContent: 'center',
                      bgcolor: config.background === 'transparent' ? 'transparent' : 'white'
                    }}
                  >
                    <img
                      src={generatedImage}
                      alt="Generated"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '400px',
                        objectFit: 'contain',
                      }}
                    />
                  </Paper>

                  {imageInfo && (
                    <Box sx={{ mb: 2 }}>
                      {imageInfo.revisedPrompt && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Revised Prompt:</strong> {imageInfo.revisedPrompt}
                        </Typography>
                      )}
                      {imageInfo.tokens && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Tokens Used:</strong> {imageInfo.tokens}
                        </Typography>
                      )}
                      {imageInfo.cost && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Actual Cost:</strong> ${imageInfo.cost.toFixed(4)}
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={downloadImage}
                      fullWidth
                    >
                      Download
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={generateImage}
                      disabled={isGenerating}
                    >
                      Regenerate
                    </Button>
                  </Box>
                </Box>
              )}

              {!isGenerating && !generatedImage && !error && (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  py: 4,
                  border: '2px dashed grey.300',
                  borderRadius: 1
                }}>
                  <ImageIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No image generated yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enter a prompt and click "Generate Image"
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* API Key Dialog */}
      <Dialog open={showApiKeyDialog} onClose={() => setShowApiKeyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {apiKeyStatus.hasKey ? 'Update OpenAI API Key' : 'Add OpenAI API Key'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your OpenAI API key to enable image generation. Your key will be stored securely.
          </Typography>
          <TextField
            fullWidth
            label="OpenAI API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            sx={{ mb: 2 }}
          />
          {apiKeyStatus.hasKey && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Current key: {apiKeyStatus.maskedKey}
            </Typography>
          )}
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> You can get your API key from{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                OpenAI Platform
              </a>
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApiKeyDialog(false)}>Cancel</Button>
          <Button 
            onClick={saveApiKey} 
            variant="contained"
            disabled={!apiKey.trim()}
          >
            {apiKeyStatus.hasKey ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 