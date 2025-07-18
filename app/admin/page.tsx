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
  MenuItem,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
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
    'ollama', 'openai', 'groq', 'anthropic'
  ]);
  const [providerEnabled, setProviderEnabled] = useState<Record<string, boolean>>({});

  // Load LLM provider status
  const [llmProviders, setLlmProviders] = useState<any[]>([]);
  const [llmLoading, setLlmLoading] = useState(false);

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

  // Test state
  const [testing, setTesting] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  // Auto-refresh state
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [previousProviderStatus, setPreviousProviderStatus] = useState<Record<string, boolean>>({});
  const [statusNotifications, setStatusNotifications] = useState<string[]>([]);

  // Add Ollama endpoint dialog state
  const [ollamaEndpointDialogOpen, setOllamaEndpointDialogOpen] = useState(false);
  const [ollamaEndpoint, setOllamaEndpoint] = useState('');
  const [ollamaEndpointLoading, setOllamaEndpointLoading] = useState(false);
  const [ollamaEndpointError, setOllamaEndpointError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // System messages state
  const [systemMessages, setSystemMessages] = useState<any[]>([]);
  const [systemMessagesLoading, setSystemMessagesLoading] = useState(false);
  const [systemMessageCategories, setSystemMessageCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [systemMessageDialogOpen, setSystemMessageDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [systemMessageForm, setSystemMessageForm] = useState({
    key: '',
    title: '',
    content: '',
    category: '',
    description: ''
  });

  // Ingredients state
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<any>(null);
  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    description: '',
    servingSize: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    sugar: '',
    sodium: '',
    cholesterol: '',
    saturatedFat: '',
    monounsaturatedFat: '',
    polyunsaturatedFat: '',
    transFat: '',
    netCarbs: '',
    glycemicIndex: '',
    glycemicLoad: '',
    dietaryFlags: '',
    allergens: '',
    category: '',
    aisle: ''
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [aisles, setAisles] = useState<string[]>([]);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [ingredientCategoryFilter, setIngredientCategoryFilter] = useState('');
  const [ingredientAisleFilter, setIngredientAisleFilter] = useState('');
  const [calorieRange, setCalorieRange] = useState([0, 1000]);
  const [proteinRange, setProteinRange] = useState([0, 100]);
  const [carbRange, setCarbRange] = useState([0, 100]);
  const [fatRange, setFatRange] = useState([0, 100]);
  const [fiberRange, setFiberRange] = useState([0, 50]);
  const [sodiumRange, setSodiumRange] = useState([0, 2000]);
  const [showFilters, setShowFilters] = useState(false);
  const [comprehensiveCategories] = useState([
    // Proteins
    'Proteins - Meats (beef, pork, lamb, game)',
    'Proteins - Poultry (chicken, turkey, duck)',
    'Proteins - Seafood (fish, shellfish)',
    'Proteins - Eggs',
    'Proteins - Plant Proteins (tofu, tempeh, seitan)',
    
    // Vegetables
    'Vegetables - Leafy Greens (spinach, kale)',
    'Vegetables - Cruciferous (broccoli, cauliflower)',
    'Vegetables - Root (carrots, beets, potatoes)',
    'Vegetables - Alliums (onion, garlic)',
    'Vegetables - Nightshades (tomato, eggplant, pepper)',
    'Vegetables - Gourds & Squashes',
    
    // Fruits
    'Fruits - Berries',
    'Fruits - Citrus',
    'Fruits - Stone Fruits',
    'Fruits - Pomes (apple, pear)',
    'Fruits - Tropical (mango, pineapple)',
    'Fruits - Melons',
    
    // Grains & Starches
    'Grains & Starches - Whole Grains (brown rice, quinoa)',
    'Grains & Starches - Refined Grains (white rice, pasta)',
    'Grains & Starches - Ancient Grains (farro, spelt)',
    'Grains & Starches - Tubers & Root Starches (potato, cassava)',
    
    // Legumes & Pulses
    'Legumes & Pulses - Beans (black, kidney, navy)',
    'Legumes & Pulses - Lentils, Peas, Chickpeas',
    
    // Dairy & Alternatives
    'Dairy & Alternatives - Milk, Yogurt, Cheese, Butter',
    'Dairy & Alternatives - Plant Milks & Cheeses',
    
    // Nuts & Seeds
    'Nuts & Seeds - Tree Nuts, Peanuts',
    'Nuts & Seeds - Seeds (chia, flax, sunflower)',
    
    // Fats & Oils
    'Fats & Oils - Cooking Oils (olive, avocado)',
    'Fats & Oils - Animal Fats (lard, tallow)',
    
    // Condiments & Sauces
    'Condiments & Sauces - Mustards, Ketchups, Hot Sauces',
    'Condiments & Sauces - Marinades & Dressings',
    
    // Herbs & Spices
    'Herbs & Spices - Fresh Herbs (basil, cilantro)',
    'Herbs & Spices - Dried Spices & Blends',
    
    // Beverages
    'Beverages - Water, Tea, Coffee',
    'Beverages - Juices, Sodas, Alcohol',
    
    // Sweets & Snacks
    'Sweets & Snacks - Chocolate, Candy',
    'Sweets & Snacks - Chips, Crackers, Granola Bars',
    
    // Pantry & Canned Goods
    'Pantry & Canned Goods - Canned Vegetables, Beans',
    'Pantry & Canned Goods - Stocks & Broths, Vinegars',
    
    // Frozen Foods
    'Frozen Foods - Vegetables, Fruits, Prepared Meals',
    
    // Bakery
    'Bakery - Breads, Tortillas, Pastries'
  ]);
  const [csvImportDialogOpen, setCsvImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

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
                  avgTokensPerSecond: newProvider.avgTokensPerSecond,
                  model: newProvider.model,
                  usage: newProvider.usage // Also update usage statistics
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
    const providerKeys = ['groq', 'openai', 'anthropic'];
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
    setTestingProvider(providerKey);
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
      
      // Auto-refresh provider data to update usage statistics
      if (result.success) {
        await loadLLMProviders();
      }
    } catch (error) {
      setTestResult({ success: false, error: 'Failed to test provider' });
    } finally {
      setTesting(false);
      setTestingProvider(null);
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

  const loadSystemMessages = async () => {
    setSystemMessagesLoading(true);
    try {
      const response = await fetch('/api/system-messages', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSystemMessages(data.data || []);
      } else {
        console.error('Failed to load system messages:', response.status);
      }
    } catch (error) {
      console.error('Error loading system messages:', error);
    } finally {
      setSystemMessagesLoading(false);
    }
  };

  const loadSystemMessageCategories = async () => {
    try {
      const response = await fetch('/api/system-messages/categories', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSystemMessageCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error loading system message categories:', error);
    }
  };

  const loadIngredients = async () => {
    setIngredientsLoading(true);
    try {
      const response = await fetch('/api/ingredients', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIngredients(data.data || []);
      } else {
        console.error('Failed to load ingredients:', response.status);
      }
    } catch (error) {
      console.error('Error loading ingredients:', error);
    } finally {
      setIngredientsLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadLLMProviders(),
        loadSystemMessages(),
        loadSystemMessageCategories(),
        loadIngredients()
      ]);

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
          const defaultOrder = ['ollama', 'openai', 'groq', 'anthropic'];
          const defaultEnabled = {
            ollama: true,
            openai: true,
            groq: true,
            anthropic: true,
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

  // System message management functions
  const openSystemMessageDialog = (message?: any) => {
    if (message) {
      setEditingMessage(message);
      setSystemMessageForm({
        key: message.key,
        title: message.title,
        content: message.content,
        category: message.category,
        description: message.description || ''
      });
    } else {
      setEditingMessage(null);
      setSystemMessageForm({
        key: '',
        title: '',
        content: '',
        category: '',
        description: ''
      });
    }
    setSystemMessageDialogOpen(true);
  };

  const saveSystemMessage = async () => {
    try {
      const url = editingMessage 
        ? `/api/system-messages/${editingMessage.key}`
        : '/api/system-messages';
      
      const method = editingMessage ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(systemMessageForm)
      });

      if (response.ok) {
        setSystemMessageDialogOpen(false);
        await loadSystemMessages();
        setError(null);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to save system message');
      }
    } catch (error) {
      setError('Failed to save system message');
      console.error('Error saving system message:', error);
    }
  };

  const deleteSystemMessage = async (key: string) => {
    if (!confirm('Are you sure you want to delete this system message?')) return;
    
    try {
      const response = await fetch(`/api/system-messages/${key}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        await loadSystemMessages();
        setError(null);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to delete system message');
      }
    } catch (error) {
      setError('Failed to delete system message');
      console.error('Error deleting system message:', error);
    }
  };

  const toggleSystemMessageActive = async (key: string) => {
    try {
      const response = await fetch(`/api/system-messages/${key}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        await loadSystemMessages();
        setError(null);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to toggle system message');
      }
    } catch (error) {
      setError('Failed to toggle system message');
      console.error('Error toggling system message:', error);
    }
  };

  // Ingredients management functions
  const openIngredientDialog = (ingredient?: any) => {
    if (ingredient) {
      setEditingIngredient(ingredient);
      setIngredientForm({
        name: ingredient.name,
        description: ingredient.description,
        servingSize: ingredient.servingSize,
        calories: ingredient.calories,
        protein: ingredient.protein,
        carbs: ingredient.carbs,
        fat: ingredient.fat,
        fiber: ingredient.fiber,
        sugar: ingredient.sugar,
        sodium: ingredient.sodium,
        cholesterol: ingredient.cholesterol,
        saturatedFat: ingredient.saturatedFat,
        monounsaturatedFat: ingredient.monounsaturatedFat,
        polyunsaturatedFat: ingredient.polyunsaturatedFat,
        transFat: ingredient.transFat,
        netCarbs: ingredient.netCarbs,
        glycemicIndex: ingredient.glycemicIndex,
        glycemicLoad: ingredient.glycemicLoad,
        dietaryFlags: ingredient.dietaryFlags,
        allergens: ingredient.allergens,
        category: ingredient.category,
        aisle: ingredient.aisle
      });
    } else {
      setEditingIngredient(null);
      setIngredientForm({
        name: '',
        description: '',
        servingSize: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        fiber: '',
        sugar: '',
        sodium: '',
        cholesterol: '',
        saturatedFat: '',
        monounsaturatedFat: '',
        polyunsaturatedFat: '',
        transFat: '',
        netCarbs: '',
        glycemicIndex: '',
        glycemicLoad: '',
        dietaryFlags: '',
        allergens: '',
        category: '',
        aisle: ''
      });
    }
    setIngredientDialogOpen(true);
  };

  const saveIngredient = async () => {
    try {
      const url = editingIngredient ? `/api/ingredients/${editingIngredient.id}` : '/api/ingredients';
      const method = editingIngredient ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(ingredientForm)
      });

      if (response.ok) {
        setIngredientDialogOpen(false);
        await loadIngredients();
        setError(null);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to save ingredient');
      }
    } catch (error) {
      setError('Failed to save ingredient');
      console.error('Error saving ingredient:', error);
    }
  };

  const deleteIngredient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ingredient?')) return;
    
    try {
      const response = await fetch(`/api/ingredients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        await loadIngredients();
        setError(null);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to delete ingredient');
      }
    } catch (error) {
      setError('Failed to delete ingredient');
      console.error('Error deleting ingredient:', error);
    }
  };

  const importIngredientsFromCSV = async () => {
    setImporting(true);
    setImportResults(null);
    try {
      const formData = new FormData();
      if (csvFile) {
        formData.append('file', csvFile);
      }

      const response = await fetch('/api/ingredients/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        setImportResults(data);
        setCsvImportDialogOpen(false);
        setCsvFile(null);
        setCsvData('');
        await loadIngredients();
      } else {
        const error = await response.json();
        setImportResults({ success: false, error: error.error || 'Failed to import CSV' });
      }
    } catch (error) {
      setImportResults({ success: false, error: 'Failed to import CSV' });
      console.error('Error importing CSV:', error);
    } finally {
      setImporting(false);
    }
  };

  const deleteAllIngredients = async () => {
    if (!confirm('Are you sure you want to delete ALL ingredients? This action cannot be undone.')) return;
    
    try {
      const response = await fetch('/api/ingredients/delete-all', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.ok) {
        await loadIngredients();
        setError(null);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to delete all ingredients');
      }
    } catch (error) {
      setError('Failed to delete all ingredients');
      console.error('Error deleting all ingredients:', error);
    }
  };

  // Filter ingredients based on search and filter criteria
  const getFilteredIngredients = () => {
    return ingredients.filter(ingredient => {
      // Text search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        ingredient.name.toLowerCase().includes(searchLower) ||
        (ingredient.description && ingredient.description.toLowerCase().includes(searchLower)) ||
        ingredient.category?.toLowerCase().includes(searchLower) ||
        ingredient.aisle?.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory = !ingredientCategoryFilter || ingredient.category === ingredientCategoryFilter;

      // Aisle filter
      const matchesAisle = !ingredientAisleFilter || ingredient.aisle === ingredientAisleFilter;

      // Nutritional range filters
      const matchesCalories = ingredient.calories >= calorieRange[0] && ingredient.calories <= calorieRange[1];
      const matchesProtein = ingredient.protein >= proteinRange[0] && ingredient.protein <= proteinRange[1];
      const matchesCarbs = ingredient.carbs >= carbRange[0] && ingredient.carbs <= carbRange[1];
      const matchesFat = ingredient.fat >= fatRange[0] && ingredient.fat <= fatRange[1];
      const matchesFiber = !ingredient.fiber || (ingredient.fiber >= fiberRange[0] && ingredient.fiber <= fiberRange[1]);
      const matchesSodium = !ingredient.sodium || (ingredient.sodium >= sodiumRange[0] && ingredient.sodium <= sodiumRange[1]);

      return matchesSearch && matchesCategory && matchesAisle && 
             matchesCalories && matchesProtein && matchesCarbs && 
             matchesFat && matchesFiber && matchesSodium;
    });
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
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab label="LLM Providers" />
              <Tab label="System Messages" />
              <Tab label="Ingredients" />
            </Tabs>
          </Box>

          {/* LLM Providers Tab */}
          {activeTab === 0 && (
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
                                  avgTokensPerSecond: newProvider.avgTokensPerSecond,
                                  model: newProvider.model,
                                  usage: newProvider.usage // Also update usage statistics
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
          )}

          {/* System Messages Tab */}
          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">System Messages</Typography>
                <Button
                  variant="contained"
                  onClick={() => openSystemMessageDialog()}
                >
                  Add New Message
                </Button>
              </Box>

              {/* Category Filter */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  select
                  label="Filter by Category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {systemMessageCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {systemMessagesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {systemMessages
                    .filter(message => selectedCategory === 'all' || message.category === selectedCategory)
                    .map((message) => (
                      <ListItem
                        key={message.key}
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          backgroundColor: message.isActive ? 'background.paper' : 'action.hover'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h6">{message.title}</Typography>
                              <Chip 
                                label={message.category} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                              <Chip 
                                label={message.isActive ? 'Active' : 'Inactive'} 
                                size="small" 
                                color={message.isActive ? 'success' : 'default'}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Key:</strong> {message.key}
                              </Typography>
                              {message.description && (
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  {message.description}
                                </Typography>
                              )}
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{
                                  maxHeight: 100,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical'
                                }}
                              >
                                <strong>Content:</strong> {message.content}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              onClick={() => toggleSystemMessageActive(message.key)}
                              color={message.isActive ? 'success' : 'default'}
                            >
                              {message.isActive ? <VisibilityIcon /> : <VisibilityOffIcon />}
                            </IconButton>
                            <IconButton
                              onClick={() => openSystemMessageDialog(message)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => deleteSystemMessage(message.key)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                </List>
              )}
            </Box>
          )}

          {/* Ingredients Tab */}
          {activeTab === 2 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Ingredients Management</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setCsvImportDialogOpen(true)}
                  >
                    Import CSV
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/ingredients/example', {
                          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                        });
                        if (response.ok) {
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'ingredients_example.csv';
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        }
                      } catch (error) {
                        console.error('Error downloading example CSV:', error);
                      }
                    }}
                  >
                    Download Example
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/ingredients/export', {
                          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                        });
                        if (response.ok) {
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'ingredients.csv';
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        }
                      } catch (error) {
                        console.error('Error exporting ingredients:', error);
                      }
                    }}
                  >
                    Export All
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={async () => {
                      if (!confirm('Are you sure you want to delete ALL ingredients? This action cannot be undone.')) return;
                      
                      try {
                        const response = await fetch('/api/ingredients/delete-all', {
                          method: 'DELETE',
                          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                        });
                        if (response.ok) {
                          await loadIngredients();
                          setError(null);
                        } else {
                          const error = await response.json();
                          setError(error.error || 'Failed to delete all ingredients');
                        }
                      } catch (error) {
                        setError('Failed to delete all ingredients');
                        console.error('Error deleting all ingredients:', error);
                      }
                    }}
                  >
                    Delete All
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => openIngredientDialog()}
                  >
                    Add Ingredient
                  </Button>
                </Box>
              </Box>

              {/* Search and Filter Section */}
              <Box sx={{ mb: 3 }}>
                {/* Search Bar */}
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Search ingredients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, description, category, or aisle..."
                    variant="outlined"
                    size="small"
                  />
                </Box>

                {/* Filter Toggle */}
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setShowFilters(!showFilters)}
                    size="small"
                  >
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                  </Button>
                </Box>

                {/* Filter Panel */}
                {showFilters && (
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Filters
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {/* Category Filter */}
                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          fullWidth
                          label="Category"
                          value={ingredientCategoryFilter}
                          onChange={(e) => setIngredientCategoryFilter(e.target.value)}
                          size="small"
                        >
                          <MenuItem value="">All Categories</MenuItem>
                          {comprehensiveCategories.map((category) => (
                            <MenuItem key={category} value={category}>
                              {category}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      {/* Aisle Filter */}
                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          fullWidth
                          label="Aisle"
                          value={ingredientAisleFilter}
                          onChange={(e) => setIngredientAisleFilter(e.target.value)}
                          size="small"
                        >
                          <MenuItem value="">All Aisles</MenuItem>
                          {aisles.map((aisle) => (
                            <MenuItem key={aisle} value={aisle}>
                              {aisle}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      {/* Calorie Range */}
                      <Grid item xs={12} md={6}>
                        <Typography gutterBottom>
                          Calories: {calorieRange[0]} - {calorieRange[1]}
                        </Typography>
                        <Slider
                          value={calorieRange}
                          onChange={(_, newValue) => setCalorieRange(newValue as number[])}
                          valueLabelDisplay="auto"
                          min={0}
                          max={1000}
                          step={10}
                        />
                      </Grid>

                      {/* Protein Range */}
                      <Grid item xs={12} md={6}>
                        <Typography gutterBottom>
                          Protein: {proteinRange[0]} - {proteinRange[1]}g
                        </Typography>
                        <Slider
                          value={proteinRange}
                          onChange={(_, newValue) => setProteinRange(newValue as number[])}
                          valueLabelDisplay="auto"
                          min={0}
                          max={100}
                          step={1}
                        />
                      </Grid>

                      {/* Carb Range */}
                      <Grid item xs={12} md={6}>
                        <Typography gutterBottom>
                          Carbs: {carbRange[0]} - {carbRange[1]}g
                        </Typography>
                        <Slider
                          value={carbRange}
                          onChange={(_, newValue) => setCarbRange(newValue as number[])}
                          valueLabelDisplay="auto"
                          min={0}
                          max={100}
                          step={1}
                        />
                      </Grid>

                      {/* Fat Range */}
                      <Grid item xs={12} md={6}>
                        <Typography gutterBottom>
                          Fat: {fatRange[0]} - {fatRange[1]}g
                        </Typography>
                        <Slider
                          value={fatRange}
                          onChange={(_, newValue) => setFatRange(newValue as number[])}
                          valueLabelDisplay="auto"
                          min={0}
                          max={100}
                          step={1}
                        />
                      </Grid>

                      {/* Fiber Range */}
                      <Grid item xs={12} md={6}>
                        <Typography gutterBottom>
                          Fiber: {fiberRange[0]} - {fiberRange[1]}g
                        </Typography>
                        <Slider
                          value={fiberRange}
                          onChange={(_, newValue) => setFiberRange(newValue as number[])}
                          valueLabelDisplay="auto"
                          min={0}
                          max={50}
                          step={0.5}
                        />
                      </Grid>

                      {/* Sodium Range */}
                      <Grid item xs={12} md={6}>
                        <Typography gutterBottom>
                          Sodium: {sodiumRange[0]} - {sodiumRange[1]}mg
                        </Typography>
                        <Slider
                          value={sodiumRange}
                          onChange={(_, newValue) => setSodiumRange(newValue as number[])}
                          valueLabelDisplay="auto"
                          min={0}
                          max={2000}
                          step={10}
                        />
                      </Grid>

                      {/* Clear Filters */}
                      <Grid item xs={12}>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setSearchTerm('');
                            setIngredientCategoryFilter('');
                            setIngredientAisleFilter('');
                            setCalorieRange([0, 1000]);
                            setProteinRange([0, 100]);
                            setCarbRange([0, 100]);
                            setFatRange([0, 100]);
                            setFiberRange([0, 50]);
                            setSodiumRange([0, 2000]);
                          }}
                          size="small"
                        >
                          Clear All Filters
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {/* Results Count */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {getFilteredIngredients().length} of {ingredients.length} ingredients
                  </Typography>
                </Box>
              </Box>

              {ingredientsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {getFilteredIngredients().map((ingredient) => (
                    <Grid item xs={12} md={6} lg={4} key={ingredient.id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="h6" component="div">
                              {ingredient.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => openIngredientDialog(ingredient)}
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => deleteIngredient(ingredient.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                          
                          {ingredient.description && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {ingredient.description}
                            </Typography>
                          )}
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>Serving:</strong> {ingredient.servingSize}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Calories:</strong> {ingredient.calories}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Protein:</strong> {ingredient.protein}g
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Carbs:</strong> {ingredient.carbs}g
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Fat:</strong> {ingredient.fat}g
                            </Typography>
                          </Box>
                          
                          {(ingredient.fiber || ingredient.sugar || ingredient.sodium) && (
                            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                              {ingredient.fiber && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Fiber:</strong> {ingredient.fiber}g
                                </Typography>
                              )}
                              {ingredient.sugar && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Sugar:</strong> {ingredient.sugar}g
                                </Typography>
                              )}
                              {ingredient.sodium && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Sodium:</strong> {ingredient.sodium}mg
                                </Typography>
                              )}
                            </Box>
                          )}
                          
                          {(ingredient.cholesterol || ingredient.saturatedFat || ingredient.monounsaturatedFat || ingredient.polyunsaturatedFat) && (
                            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                              {ingredient.cholesterol && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Cholesterol:</strong> {ingredient.cholesterol}mg
                                </Typography>
                              )}
                              {ingredient.saturatedFat && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Sat Fat:</strong> {ingredient.saturatedFat}g
                                </Typography>
                              )}
                              {ingredient.monounsaturatedFat && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Mono Fat:</strong> {ingredient.monounsaturatedFat}g
                                </Typography>
                              )}
                              {ingredient.polyunsaturatedFat && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Poly Fat:</strong> {ingredient.polyunsaturatedFat}g
                                </Typography>
                              )}
                            </Box>
                          )}
                          
                          {(ingredient.netCarbs || ingredient.glycemicIndex || ingredient.glycemicLoad) && (
                            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                              {ingredient.netCarbs && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Net Carbs:</strong> {ingredient.netCarbs}g
                                </Typography>
                              )}
                              {ingredient.glycemicIndex && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>GI:</strong> {ingredient.glycemicIndex}
                                </Typography>
                              )}
                              {ingredient.glycemicLoad && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>GL:</strong> {ingredient.glycemicLoad}
                                </Typography>
                              )}
                            </Box>
                          )}
                          
                          {(ingredient.dietaryFlags || ingredient.allergens) && (
                            <Box sx={{ mb: 1 }}>
                              {ingredient.dietaryFlags && (
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  <strong>Dietary:</strong> {ingredient.dietaryFlags}
                                </Typography>
                              )}
                              {ingredient.allergens && (
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  <strong>Allergens:</strong> {ingredient.allergens}
                                </Typography>
                              )}
                            </Box>
                          )}
                          
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            {ingredient.category && (
                              <Chip 
                                label={ingredient.category} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                            )}
                            {ingredient.aisle && (
                              <Chip 
                                label={ingredient.aisle} 
                                size="small" 
                                color="secondary" 
                                variant="outlined"
                              />
                            )}
                            <Chip 
                              label={ingredient.isActive ? 'Active' : 'Inactive'} 
                              size="small" 
                              color={ingredient.isActive ? 'success' : 'default'}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
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

        {/* System Message Dialog */}
        <Dialog open={systemMessageDialogOpen} onClose={() => setSystemMessageDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingMessage ? 'Edit System Message' : 'Add New System Message'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Key"
              value={systemMessageForm.key}
              onChange={(e) => setSystemMessageForm(prev => ({ ...prev, key: e.target.value }))}
              margin="normal"
              disabled={!!editingMessage}
              helperText="Unique identifier for this message (e.g., 'chat.welcome')"
            />
            <TextField
              fullWidth
              label="Title"
              value={systemMessageForm.title}
              onChange={(e) => setSystemMessageForm(prev => ({ ...prev, title: e.target.value }))}
              margin="normal"
              helperText="Display name for this message"
            />
            <TextField
              select
              fullWidth
              label="Category"
              value={systemMessageForm.category}
              onChange={(e) => setSystemMessageForm(prev => ({ ...prev, category: e.target.value }))}
              margin="normal"
            >
              {systemMessageCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Description"
              value={systemMessageForm.description}
              onChange={(e) => setSystemMessageForm(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              multiline
              rows={2}
              helperText="Optional description of what this message is used for"
            />
            <TextField
              fullWidth
              label="Content"
              value={systemMessageForm.content}
              onChange={(e) => setSystemMessageForm(prev => ({ ...prev, content: e.target.value }))}
              margin="normal"
              multiline
              rows={8}
              helperText="The actual message content. Use {placeholder} for dynamic values."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSystemMessageDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={saveSystemMessage} 
              variant="contained"
              disabled={!systemMessageForm.key || !systemMessageForm.title || !systemMessageForm.content || !systemMessageForm.category}
            >
              {editingMessage ? 'Update Message' : 'Add Message'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Test Result Dialog */}
        <Dialog open={!!testResult} onClose={() => setTestResult(null)} maxWidth="md" fullWidth>
          <DialogTitle>
            Test Result - {testResult?.provider || 'Unknown Provider'}
          </DialogTitle>
          <DialogContent>
            {testResult?.success ? (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Test completed successfully!
                </Alert>
                <Typography variant="h6" gutterBottom>
                  Response:
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: 1, 
                  border: '1px solid #e0e0e0',
                  maxHeight: 300,
                  overflow: 'auto'
                }}>
                  <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {testResult.content}
                  </Typography>
                </Box>
                {testResult.usage && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Usage Statistics:
                    </Typography>
                    <Typography variant="body2">
                      Prompt Tokens: {testResult.usage.promptTokens || 0}
                    </Typography>
                    <Typography variant="body2">
                      Completion Tokens: {testResult.usage.completionTokens || 0}
                    </Typography>
                    <Typography variant="body2">
                      Total Tokens: {testResult.usage.totalTokens || 0}
                    </Typography>
                    {testResult.cost !== undefined && (
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                        Estimated Cost: ${Number(testResult.cost || 0).toFixed(8)}
                      </Typography>
                    )}
                    {testResult.timing && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          Performance Metrics:
                        </Typography>
                        <Typography variant="body2">
                          Generation Time: {testResult.timing.generationTimeMs}ms
                        </Typography>
                        {testResult.timing.tokensPerSecond && (
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            Tokens/Second: {testResult.timing.tokensPerSecond.toFixed(2)}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            ) : (
              <Alert severity="error">
                {testResult?.error || 'Test failed with unknown error'}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTestResult(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* CSV Import Dialog */}
        <Dialog open={csvImportDialogOpen} onClose={() => setCsvImportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Import Ingredients from CSV</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Please select a CSV file containing ingredient data. The file should have columns for 'name', 'description', 'servingSize', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium', 'category', and 'aisle'.
            </Typography>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setCsvFile(e.target.files[0]);
                  setCsvData(''); // Clear previous data if a new file is selected
                }
              }}
              style={{ display: 'none' }}
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input">
              <Button variant="outlined" component="span">
                Choose CSV File
              </Button>
            </label>
            {csvFile && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Selected File: {csvFile.name}
              </Typography>
            )}
            {csvData && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                File Content (for preview):
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{csvData}</pre>
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCsvImportDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={importIngredientsFromCSV} 
              variant="contained"
              disabled={!csvFile || importing}
            >
              {importing ? <CircularProgress size={20} /> : 'Import CSV'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Ingredient Dialog */}
        <Dialog open={ingredientDialogOpen} onClose={() => setIngredientDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Name"
              value={ingredientForm.name}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, name: e.target.value }))}
              margin="normal"
              autoFocus={!editingIngredient}
              helperText="Required. Name of the ingredient."
            />
            <TextField
              fullWidth
              label="Description"
              value={ingredientForm.description}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              helperText="Optional. More details about the ingredient."
            />
            <TextField
              fullWidth
              label="Serving Size"
              value={ingredientForm.servingSize}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, servingSize: e.target.value }))}
              margin="normal"
              helperText="Required. Example: 1 cup, 100g, 1 piece."
            />
            <TextField
              fullWidth
              label="Calories"
              value={ingredientForm.calories}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, calories: e.target.value }))}
              margin="normal"
              type="number"
              helperText="Required. Number of calories per serving."
            />
            <TextField
              fullWidth
              label="Protein"
              value={ingredientForm.protein}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, protein: e.target.value }))}
              margin="normal"
              type="number"
              helperText="Optional. Grams of protein per serving."
            />
            <TextField
              fullWidth
              label="Carbs"
              value={ingredientForm.carbs}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, carbs: e.target.value }))}
              margin="normal"
              type="number"
              helperText="Optional. Grams of carbs per serving."
            />
            <TextField
              fullWidth
              label="Fat"
              value={ingredientForm.fat}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, fat: e.target.value }))}
              margin="normal"
              type="number"
              helperText="Optional. Grams of fat per serving."
            />
            <TextField
              fullWidth
              label="Fiber"
              value={ingredientForm.fiber}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, fiber: e.target.value }))}
              margin="normal"
              type="number"
              helperText="Optional. Grams of fiber per serving."
            />
            <TextField
              fullWidth
              label="Sugar"
              value={ingredientForm.sugar}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, sugar: e.target.value }))}
              margin="normal"
              type="number"
              helperText="Optional. Grams of sugar per serving."
            />
            <TextField
              fullWidth
              label="Sodium"
              value={ingredientForm.sodium}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, sodium: e.target.value }))}
              margin="normal"
              type="number"
              helperText="Optional. Milligrams of sodium per serving."
            />
            <TextField
              fullWidth
              label="Cholesterol"
              value={ingredientForm.cholesterol}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, cholesterol: e.target.value }))}
              margin="normal"
              type="number"
              helperText="Optional. Milligrams of cholesterol per serving."
            />
            <TextField
              fullWidth
              label="Saturated Fat"
              value={ingredientForm.saturatedFat}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, saturatedFat: e.target.value }))}
              margin="normal"
              type="number"
              helperText="Optional. Grams of saturated fat per serving."
            />
            <TextField
              fullWidth
              label="Monounsaturated Fat"
              value={ingredientForm.monounsaturatedFat}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, monounsaturatedFat: e.target.value }))}
              margin="normal"
              type="number"
              helperText="Optional. Grams of monounsaturated fat per serving."
            />
            <TextField
              fullWidth
              label="Polyunsaturated Fat"
              value={ingredientForm.polyunsaturatedFat}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, polyunsaturatedFat: e.target.value }))}
              margin="normal"
              type="number"
              helperText="Optional. Grams of polyunsaturated fat per serving."
            />
            <TextField
              fullWidth
              label="Trans Fat"
              value={ingredientForm.transFat}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, transFat: e.target.value }))}
              margin="normal"
              type="number"
              helperText="Optional. Grams of trans fat per serving."
            />
            <TextField
              fullWidth
              label="Net Carbs"
              value={ingredientForm.netCarbs}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, netCarbs: e.target.value }))}
              margin="normal"
              type="number"
              helperText="Optional. Grams of net carbs per serving."
            />
            <TextField
              fullWidth
              label="Glycemic Index"
              value={ingredientForm.glycemicIndex}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, glycemicIndex: e.target.value }))}
              margin="normal"
              type="number"
              helperText="Optional. Glycemic index of the ingredient."
            />
            <TextField
              fullWidth
              label="Glycemic Load"
              value={ingredientForm.glycemicLoad}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, glycemicLoad: e.target.value }))}
              margin="normal"
              type="number"
              helperText="Optional. Glycemic load of the ingredient."
            />
            <TextField
              fullWidth
              label="Dietary Flags"
              value={ingredientForm.dietaryFlags}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, dietaryFlags: e.target.value }))}
              margin="normal"
              helperText="Optional. Dietary flags (e.g., 'Vegan', 'Gluten-Free')."
            />
            <TextField
              fullWidth
              label="Allergens"
              value={ingredientForm.allergens}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, allergens: e.target.value }))}
              margin="normal"
              helperText="Optional. Allergens (e.g., 'Peanuts', 'Dairy')."
            />
            <TextField
              select
              fullWidth
              label="Category"
              value={ingredientForm.category}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, category: e.target.value }))}
              margin="normal"
              helperText="Select a category for the ingredient."
            >
              {comprehensiveCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Aisle"
              value={ingredientForm.aisle}
              onChange={(e) => setIngredientForm(prev => ({ ...prev, aisle: e.target.value }))}
              margin="normal"
              helperText="Optional. Aisle in the store (e.g., 'Dairy', 'Produce', 'Meat')."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIngredientDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={saveIngredient} 
              variant="contained"
              disabled={!ingredientForm.name || !ingredientForm.servingSize || !ingredientForm.calories}
            >
              {editingIngredient ? 'Update Ingredient' : 'Add Ingredient'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </div>
  );
}