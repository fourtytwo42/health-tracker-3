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
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  MenuItem,
  Grid
} from '@mui/material';
import Navigation from '../components/Navigation';
import LLMProvidersTab from './components/LLMProvidersTab';
import AIPromptsTab from './components/AIPromptsTab';
import IngredientsTab from './components/IngredientsTab';
import ExercisesTab from './components/ExercisesTab';
import IngredientMappingsTab from './components/IngredientMappingsTab';
import ImageGeneratorTab from './components/ImageGeneratorTab';
import { useAuth } from '@/context/AuthContext';

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
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // LLM Providers state
  const [llmProviders, setLlmProviders] = useState<any[]>([]);
  const [llmLoading, setLlmLoading] = useState(false);
  const [providerOrder, setProviderOrder] = useState<string[]>(['ollama', 'openai', 'groq', 'anthropic']);
  const [providerEnabled, setProviderEnabled] = useState<Record<string, boolean>>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [apiKeyStatus, setApiKeyStatus] = useState<Record<string, { hasKey: boolean; maskedKey?: string }>>({});
  const [testing, setTesting] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  // System Messages state
  const [systemMessages, setSystemMessages] = useState<any[]>([]);
  const [systemMessagesLoading, setSystemMessagesLoading] = useState(false);

  // Ingredients state
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalIngredients, setTotalIngredients] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
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
  const [categories, setCategories] = useState<string[]>([]);
  const [aisles, setAisles] = useState<string[]>([]);

  // Exercises state
  const [exercises, setExercises] = useState<any[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [exerciseCurrentPage, setExerciseCurrentPage] = useState(1);
  const [exercisePageSize, setExercisePageSize] = useState(50);
  const [totalExercises, setTotalExercises] = useState(0);
  const [exerciseTotalPages, setExerciseTotalPages] = useState(0);
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
  const [exerciseCategoryFilter, setExerciseCategoryFilter] = useState('');
  const [exerciseIntensityFilter, setExerciseIntensityFilter] = useState('');
  const [metRange, setMetRange] = useState([0, 20]);
  const [showExerciseFilters, setShowExerciseFilters] = useState(false);
  const [exerciseCategories, setExerciseCategories] = useState<string[]>([]);
  const [exerciseIntensities, setExerciseIntensities] = useState<string[]>([]);
  const [comprehensiveCategories] = useState([
    'Proteins - Meats (beef, pork, lamb, game)',
    'Proteins - Poultry (chicken, turkey, duck)',
    'Proteins - Seafood (fish, shellfish)',
    'Proteins - Eggs',
    'Proteins - Plant Proteins (tofu, tempeh, seitan)',
    'Vegetables - Leafy Greens (spinach, kale)',
    'Vegetables - Cruciferous (broccoli, cauliflower)',
    'Vegetables - Root (carrots, beets, potatoes)',
    'Vegetables - Alliums (onion, garlic)',
    'Vegetables - Nightshades (tomato, eggplant, pepper)',
    'Vegetables - Gourds & Squashes',
    'Fruits - Berries',
    'Fruits - Citrus',
    'Fruits - Stone Fruits',
    'Fruits - Pomes (apple, pear)',
    'Fruits - Tropical (mango, pineapple)',
    'Fruits - Melons',
    'Grains & Starches - Whole Grains (brown rice, quinoa)',
    'Grains & Starches - Refined Grains (white rice, pasta)',
    'Grains & Starches - Ancient Grains (farro, spelt)',
    'Grains & Starches - Tubers & Root Starches (potato, cassava)',
    'Legumes & Pulses - Beans (black, kidney, navy)',
    'Legumes & Pulses - Lentils, Peas, Chickpeas',
    'Dairy & Alternatives - Milk, Yogurt, Cheese, Butter',
    'Dairy & Alternatives - Plant Milks & Cheeses',
    'Nuts & Seeds - Tree Nuts, Peanuts',
    'Nuts & Seeds - Seeds (chia, flax, sunflower)',
    'Fats & Oils - Cooking Oils (olive, avocado)',
    'Fats & Oils - Animal Fats (lard, tallow)',
    'Condiments & Sauces - Mustards, Ketchups, Hot Sauces',
    'Condiments & Sauces - Marinades & Dressings',
    'Herbs & Spices - Fresh Herbs (basil, cilantro)',
    'Herbs & Spices - Dried Spices & Blends',
    'Beverages - Water, Tea, Coffee',
    'Beverages - Juices, Sodas, Alcohol',
    'Sweets & Snacks - Chocolate, Candy',
    'Sweets & Snacks - Chips, Crackers, Granola Bars',
    'Pantry & Canned Goods - Canned Vegetables, Beans',
    'Pantry & Canned Goods - Stocks & Broths, Vinegars',
    'Frozen Foods - Vegetables, Fruits, Prepared Meals',
    'Bakery - Breads, Tortillas, Pastries'
  ]);

  // Dialog states
  const [csvImportDialogOpen, setCsvImportDialogOpen] = useState(false);
  
  // LLM Provider dialog states
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [updatingModel, setUpdatingModel] = useState(false);
  const [providerModels, setProviderModels] = useState<Record<string, string[]>>({});
  
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  const [ollamaEndpointDialogOpen, setOllamaEndpointDialogOpen] = useState(false);
  const [ollamaEndpoint, setOllamaEndpoint] = useState('');
  const [ollamaEndpointLoading, setOllamaEndpointLoading] = useState(false);
  const [ollamaEndpointError, setOllamaEndpointError] = useState<string | null>(null);
  
  const [testResult, setTestResult] = useState<any>(null);
  const [testResultDialogOpen, setTestResultDialogOpen] = useState(false);

  // Load data on component mount
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadData();
    }
  }, [user?.role]);

  // Reload ingredients when search term changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.role === 'ADMIN') {
        setCurrentPage(1); // Reset to first page when searching
        loadIngredients(1, pageSize);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, user?.role, pageSize]);

  // Reload ingredients when filters change
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      setCurrentPage(1); // Reset to first page when filtering
      loadIngredients(1, pageSize);
    }
  }, [ingredientCategoryFilter, ingredientAisleFilter, user?.role, pageSize]);

  // Reload ingredients when nutrition range filters change
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      setCurrentPage(1); // Reset to first page when filtering
      loadIngredients(1, pageSize);
    }
  }, [calorieRange, proteinRange, carbRange, fatRange, fiberRange, sodiumRange, user?.role, pageSize]);

  // Reload exercises when search term changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.role === 'ADMIN') {
        setExerciseCurrentPage(1); // Reset to first page when searching
        loadExercises(1, exercisePageSize);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [exerciseSearchTerm, user?.role, exercisePageSize]);

  // Reload exercises when filters change
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      setExerciseCurrentPage(1); // Reset to first page when filtering
      loadExercises(1, exercisePageSize);
    }
  }, [exerciseCategoryFilter, exerciseIntensityFilter, user?.role, exercisePageSize]);

  // Reload exercises when MET range filters change
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      setExerciseCurrentPage(1); // Reset to first page when filtering
      loadExercises(1, exercisePageSize);
    }
  }, [metRange, user?.role, exercisePageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadLLMProviders(),
        loadSystemMessages(),
        loadIngredients(currentPage, pageSize),
        loadExercises(exerciseCurrentPage, exercisePageSize)
      ]);

      // Load API key status for all providers
      await loadAllApiKeyStatus();

      // Load LLM settings to get provider order and enabled state
      const llmRes = await fetch('/api/settings/llm', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (llmRes.ok) {
        const llmData = await llmRes.json();
        
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
          const defaultOrder = ['ollama', 'openai', 'groq', 'anthropic'];
          const defaultEnabled = {
            ollama: true,
            openai: true,
            groq: true,
            anthropic: true,
          };
          
          setProviderOrder(defaultOrder);
          setProviderEnabled(defaultEnabled);
          
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

  // LLM Provider functions
  const loadLLMProviders = async () => {
    setLlmLoading(true);
    try {
      const response = await fetch('/api/llm/providers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.ok) {
        const data = await response.json();
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

  const loadAllApiKeyStatus = async () => {
    const providerKeys = ['groq', 'openai', 'anthropic'];
    const promises = providerKeys.map(loadApiKeyStatus);
    await Promise.all(promises);
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
      console.log('Test result data:', result);
      setTestResult(result);
      
      // Automatically open the test result dialog
      setTestResultDialogOpen(true);
      
      // Auto-refresh provider data to update usage statistics
      if (result.success) {
        await loadLLMProviders();
      }
    } catch (error) {
      setTestResult({ success: false, error: 'Failed to test provider' });
      setTestResultDialogOpen(true);
      console.error('Error testing provider:', error);
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

  const openModelDialog = async (provider: string, currentModel: string) => {
    setSelectedProvider(provider);
    setSelectedModel(currentModel);
    await loadProviderModels(provider);
    setModelDialogOpen(true);
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

  const openApiKeyDialog = async (provider: string) => {
    setEditingProvider(provider);
    setApiKey('');
    await loadApiKeyStatus(provider);
    setApiKeyDialogOpen(true);
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

  const openOllamaEndpointDialog = (currentEndpoint: string) => {
    setOllamaEndpoint(currentEndpoint);
    setOllamaEndpointError(null);
    setOllamaEndpointDialogOpen(true);
  };

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

  const moveProviderUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = Array.from(providerOrder);
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    setProviderOrder(newOrder);
    await saveProviderSettings(newOrder, providerEnabled);
  };

  const moveProviderDown = async (index: number) => {
    if (index === providerOrder.length - 1) return;
    const newOrder = Array.from(providerOrder);
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setProviderOrder(newOrder);
    await saveProviderSettings(newOrder, providerEnabled);
  };

  const handleProviderToggle = async (key: string) => {
    const newEnabled = { ...providerEnabled, [key]: !providerEnabled[key] };
    setProviderEnabled(newEnabled);
    await saveProviderSettings(providerOrder, newEnabled);
  };

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

  // System Messages functions
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





  // Ingredients functions
  const loadIngredients = async (page = 1, size = 50) => {
    setIngredientsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: size.toString(),
        search: searchTerm,
        category: ingredientCategoryFilter,
        aisle: ingredientAisleFilter,
        includeInactive: 'true'
      });

      // Add nutrition range filters
      if (calorieRange[0] > 0 || calorieRange[1] < 1000) {
        params.append('calorieMin', calorieRange[0].toString());
        params.append('calorieMax', calorieRange[1].toString());
      }
      if (proteinRange[0] > 0 || proteinRange[1] < 100) {
        params.append('proteinMin', proteinRange[0].toString());
        params.append('proteinMax', proteinRange[1].toString());
      }
      if (carbRange[0] > 0 || carbRange[1] < 100) {
        params.append('carbMin', carbRange[0].toString());
        params.append('carbMax', carbRange[1].toString());
      }
      if (fatRange[0] > 0 || fatRange[1] < 100) {
        params.append('fatMin', fatRange[0].toString());
        params.append('fatMax', fatRange[1].toString());
      }
      if (fiberRange[0] > 0 || fiberRange[1] < 50) {
        params.append('fiberMin', fiberRange[0].toString());
        params.append('fiberMax', fiberRange[1].toString());
      }
      if (sodiumRange[0] > 0 || sodiumRange[1] < 2000) {
        params.append('sodiumMin', sodiumRange[0].toString());
        params.append('sodiumMax', sodiumRange[1].toString());
      }
      
      const response = await fetch(`/api/ingredients?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIngredients(data.data || []);
        setTotalIngredients(data.pagination?.totalCount || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        
        if (page === 1) {
          const categoriesResponse = await fetch('/api/ingredients/categories', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          });
          const aislesResponse = await fetch('/api/ingredients/aisles', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          });
          
          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            setCategories(categoriesData.sort());
          }
          
          if (aislesResponse.ok) {
            const aislesData = await aislesResponse.json();
            setAisles(aislesData.sort());
          }
        }
      } else {
        console.error('Failed to load ingredients:', response.status);
      }
    } catch (error) {
      console.error('Error loading ingredients:', error);
    } finally {
      setIngredientsLoading(false);
    }
  };

  const loadExercises = async (page = 1, size = 50) => {
    setExercisesLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: size.toString(),
        search: exerciseSearchTerm,
        category: exerciseCategoryFilter,
        intensity: exerciseIntensityFilter,
        includeInactive: 'true'
      });

      // Add MET range filters
      if (metRange[0] > 0 || metRange[1] < 20) {
        params.append('metMin', metRange[0].toString());
        params.append('metMax', metRange[1].toString());
      }
      
      const response = await fetch(`/api/exercises?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExercises(data.data || []);
        setTotalExercises(data.pagination?.totalCount || 0);
        setExerciseTotalPages(data.pagination?.totalPages || 1);
        
        if (page === 1) {
          const categoriesResponse = await fetch('/api/exercises/categories', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          });
          const intensitiesResponse = await fetch('/api/exercises/intensities', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          });
          
          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            setExerciseCategories(categoriesData.sort());
          }
          
          if (intensitiesResponse.ok) {
            const intensitiesData = await intensitiesResponse.json();
            setExerciseIntensities(intensitiesData.sort());
          }
        }
      } else {
        console.error('Failed to load exercises:', response.status);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setExercisesLoading(false);
    }
  };

  const openIngredientDialog = (ingredient?: any) => {
    // This would open an ingredient dialog
    console.log('Open ingredient dialog:', ingredient);
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

  const openExerciseDialog = (exercise?: any) => {
    // This would open an exercise dialog
    console.log('Open exercise dialog:', exercise);
  };

  const deleteExercise = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return;
    
    try {
      const response = await fetch(`/api/exercises/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        await loadExercises();
        setError(null);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to delete exercise');
      }
    } catch (error) {
      setError('Failed to delete exercise');
      console.error('Error deleting exercise:', error);
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

  if (authLoading || loading) {
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
              <Tab label="AI Prompts" />
              <Tab label="Ingredients" />
              <Tab label="Exercises" />
              <Tab label="Ingredient Mappings" />
              <Tab label="Image Generator" />
            </Tabs>
          </Box>

          {/* LLM Providers Tab */}
          {activeTab === 0 && (
            <LLMProvidersTab
              llmProviders={llmProviders}
              providerOrder={providerOrder}
              providerEnabled={providerEnabled}
              llmLoading={llmLoading}
              lastRefresh={lastRefresh}
              apiKeyStatus={apiKeyStatus}
              testing={testing}
              testingProvider={testingProvider}
              moveProviderUp={moveProviderUp}
              moveProviderDown={moveProviderDown}
              handleProviderToggle={handleProviderToggle}
              openModelDialog={openModelDialog}
              openApiKeyDialog={openApiKeyDialog}
              removeApiKey={removeApiKey}
              testLLMProvider={testLLMProvider}
              openOllamaEndpointDialog={openOllamaEndpointDialog}
              updateOllamaEndpoint={updateOllamaEndpoint}
              resetUsageStats={resetUsageStats}
              formatPricing={formatPricing}
              loadAllApiKeyStatus={loadAllApiKeyStatus}
            />
          )}

          {/* AI Prompts Tab */}
          {activeTab === 1 && (
            <AIPromptsTab
              systemMessages={systemMessages}
              loading={systemMessagesLoading}
              onRefresh={loadSystemMessages}
            />
          )}

          {/* Ingredients Tab */}
          {activeTab === 2 && (
            <IngredientsTab
              ingredients={ingredients}
              ingredientsLoading={ingredientsLoading}
              currentPage={currentPage}
              pageSize={pageSize}
              totalIngredients={totalIngredients}
              totalPages={totalPages}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              ingredientCategoryFilter={ingredientCategoryFilter}
              setIngredientCategoryFilter={setIngredientCategoryFilter}
              ingredientAisleFilter={ingredientAisleFilter}
              setIngredientAisleFilter={setIngredientAisleFilter}
              calorieRange={calorieRange}
              setCalorieRange={setCalorieRange}
              proteinRange={proteinRange}
              setProteinRange={setProteinRange}
              carbRange={carbRange}
              setCarbRange={setCarbRange}
              fatRange={fatRange}
              setFatRange={setFatRange}
              fiberRange={fiberRange}
              setFiberRange={setFiberRange}
              sodiumRange={sodiumRange}
              setSodiumRange={setSodiumRange}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              categories={categories}
              aisles={aisles}
              comprehensiveCategories={comprehensiveCategories}
              openIngredientDialog={openIngredientDialog}
              deleteIngredient={deleteIngredient}
              loadIngredients={loadIngredients}
              setPageSize={setPageSize}
              setCurrentPage={setCurrentPage}
              setCsvImportDialogOpen={setCsvImportDialogOpen}
            />
          )}

          {/* Exercises Tab */}
          {activeTab === 3 && (
            <ExercisesTab
              exercises={exercises}
              exercisesLoading={exercisesLoading}
              currentPage={exerciseCurrentPage}
              pageSize={exercisePageSize}
              totalExercises={totalExercises}
              totalPages={exerciseTotalPages}
              searchTerm={exerciseSearchTerm}
              setSearchTerm={setExerciseSearchTerm}
              exerciseCategoryFilter={exerciseCategoryFilter}
              setExerciseCategoryFilter={setExerciseCategoryFilter}
              exerciseIntensityFilter={exerciseIntensityFilter}
              setExerciseIntensityFilter={setExerciseIntensityFilter}
              metRange={metRange}
              setMetRange={setMetRange}
              showFilters={showExerciseFilters}
              setShowFilters={setShowExerciseFilters}
              categories={exerciseCategories}
              intensities={exerciseIntensities}
              openExerciseDialog={openExerciseDialog}
              deleteExercise={deleteExercise}
              loadExercises={loadExercises}
              setPageSize={setExercisePageSize}
              setCurrentPage={setExerciseCurrentPage}
            />
          )}

          {/* Ingredient Mappings Tab */}
          {activeTab === 4 && (
            <IngredientMappingsTab />
          )}

          {/* Image Generator Tab */}
          {activeTab === 5 && (
            <ImageGeneratorTab />
          )}
        </Paper>

        {/* Model Selection Dialog */}
        <Dialog open={modelDialogOpen} onClose={() => setModelDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Select Model for {selectedProvider}</DialogTitle>
          <DialogContent>
            <TextField
              select
              fullWidth
              label="Model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              sx={{ mt: 2 }}
            >
              {providerModels[selectedProvider]?.map((model: string) => (
                <MenuItem key={model} value={model}>
                  {model}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModelDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={updateProviderModel} 
              variant="contained"
              disabled={updatingModel}
            >
              {updatingModel ? <CircularProgress size={20} /> : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* API Key Dialog */}
        <Dialog open={apiKeyDialogOpen} onClose={() => setApiKeyDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {apiKeyStatus[editingProvider]?.hasKey ? 'Update API Key' : 'Add API Key'} for {editingProvider}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              sx={{ mt: 2 }}
              placeholder="Enter your API key..."
            />
            {apiKeyStatus[editingProvider]?.hasKey && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Current key: {apiKeyStatus[editingProvider]?.maskedKey}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApiKeyDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={saveApiKey} 
              variant="contained"
              disabled={!apiKey.trim()}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Ollama Endpoint Dialog */}
        <Dialog open={ollamaEndpointDialogOpen} onClose={() => setOllamaEndpointDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Update Ollama Endpoint</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Endpoint URL"
              value={ollamaEndpoint}
              onChange={(e) => setOllamaEndpoint(e.target.value)}
              sx={{ mt: 2 }}
              placeholder="http://localhost:11434"
            />
            {ollamaEndpointError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {ollamaEndpointError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOllamaEndpointDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={updateOllamaEndpoint} 
              variant="contained"
              disabled={ollamaEndpointLoading}
            >
              {ollamaEndpointLoading ? <CircularProgress size={20} /> : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Test Result Dialog */}
        <Dialog open={testResultDialogOpen} onClose={() => setTestResultDialogOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            Test Result for {testingProvider}
          </DialogTitle>
          <DialogContent>
            {testResult ? (
              <Box>
                {testResult.success ? (
                  <Box>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      ✅ Test successful!
                    </Alert>
                    
                    {/* Test Details */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Test Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>Provider:</strong> {testResult.provider || testingProvider}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>Prompt:</strong> Hello! Please respond with a short health tip.
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          {testResult.timing?.generationTimeMs && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <strong>Latency:</strong> {testResult.timing.generationTimeMs}ms
                            </Typography>
                          )}
                          {testResult.usage?.totalTokens && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <strong>Total Tokens:</strong> {testResult.usage.totalTokens}
                            </Typography>
                          )}
                          {testResult.timing?.tokensPerSecond && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <strong>Tokens/Second:</strong> {testResult.timing.tokensPerSecond.toFixed(1)}
                            </Typography>
                          )}
                          {testResult.cost && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <strong>Cost:</strong> ${testResult.cost.toFixed(8)}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                    
                    {/* Response */}
                    {testResult.content && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          AI Response:
                        </Typography>
                        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', maxHeight: 400, overflow: 'auto' }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                            {testResult.content}
                          </Typography>
                        </Paper>
                      </Box>
                    )}
                    
                    {/* Token Breakdown */}
                    {testResult.usage && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          Token Breakdown
                        </Typography>
                        <Grid container spacing={2}>
                          {testResult.usage.promptTokens && (
                            <Grid item xs={6} md={3}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Prompt Tokens:</strong> {testResult.usage.promptTokens}
                              </Typography>
                            </Grid>
                          )}
                          {testResult.usage.completionTokens && (
                            <Grid item xs={6} md={3}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Completion Tokens:</strong> {testResult.usage.completionTokens}
                              </Typography>
                            </Grid>
                          )}
                          {testResult.usage.totalTokens && (
                            <Grid item xs={6} md={3}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Total Tokens:</strong> {testResult.usage.totalTokens}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <Alert severity="error" sx={{ mb: 2 }}>
                      ❌ Test failed
                    </Alert>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Test Details
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Provider:</strong> {testingProvider}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Prompt:</strong> Hello! Please respond with a short health tip.
                      </Typography>
                    </Box>
                    {testResult.error && (
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Error Details
                        </Typography>
                        <Paper sx={{ p: 2, backgroundColor: '#ffebee', border: '1px solid #f44336' }}>
                          <Typography variant="body2" color="error.main" sx={{ whiteSpace: 'pre-wrap' }}>
                            {testResult.error}
                          </Typography>
                        </Paper>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTestResultDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* CSV Import Dialog */}
        <Dialog open={csvImportDialogOpen} onClose={() => setCsvImportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Import Ingredients from CSV</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a CSV file with ingredient data. The file should have headers matching the ingredient fields.
            </Typography>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Handle CSV import
                  console.log('CSV file selected:', file);
                }
              }}
              style={{ width: '100%' }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCsvImportDialogOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </div>
  );
} 