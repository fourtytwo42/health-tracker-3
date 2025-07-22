'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Pagination,
  Select,
  MenuItem,
  Alert,
  Collapse,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';

interface Ingredient {
  id: string;
  name: string;
  category: string | null;
}

interface IngredientMapping {
  id: string;
  keyword: string;
  ingredientId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ingredient: Ingredient;
}

export default function IngredientMappingsTab() {
  const [mappings, setMappings] = useState<IngredientMapping[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMapping, setEditingMapping] = useState<IngredientMapping | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    keyword: '',
    ingredientId: '',
    isActive: true
  });
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);

  // Fetch mappings and ingredients
  useEffect(() => {
    fetchMappings();
    fetchIngredients();
  }, []);

  const fetchMappings = async () => {
    try {
      const response = await fetch('/api/ingredients/mappings');
      const result = await response.json();
      if (result.success) {
        setMappings(result.data);
      }
    } catch (error) {
      console.error('Error fetching mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/ingredients?limit=1000');
      const result = await response.json();
      if (result.success) {
        setIngredients(result.data.ingredients);
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const handleCreateMapping = async () => {
    try {
      const response = await fetch('/api/ingredients/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        setMappings([...mappings, result.data]);
        setFormData({ keyword: '', ingredientId: '', isActive: true });
        setShowForm(false);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error creating mapping:', error);
      alert('Failed to create mapping');
    }
  };

  const handleUpdateMapping = async () => {
    if (!editingMapping) return;

    try {
      const response = await fetch('/api/ingredients/mappings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingMapping.id,
          ...formData
        })
      });

      const result = await response.json();
      if (result.success) {
        setMappings(mappings.map(m => m.id === editingMapping.id ? result.data : m));
        setEditingMapping(null);
        setFormData({ keyword: '', ingredientId: '', isActive: true });
        setShowForm(false);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error updating mapping:', error);
      alert('Failed to update mapping');
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mapping?')) return;

    try {
      const response = await fetch(`/api/ingredients/mappings?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        setMappings(mappings.filter(m => m.id !== id));
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error deleting mapping:', error);
      alert('Failed to delete mapping');
    }
  };

  const handleEdit = (mapping: IngredientMapping) => {
    setEditingMapping(mapping);
    setFormData({
      keyword: mapping.keyword,
      ingredientId: mapping.ingredientId,
      isActive: mapping.isActive
    });
    setShowForm(true);
    setFilteredIngredients([]);
  };

  const handleCancel = () => {
    setEditingMapping(null);
    setFormData({ keyword: '', ingredientId: '', isActive: true });
    setShowForm(false);
    setFilteredIngredients([]);
  };

  // Filter ingredients based on keyword
  const filterIngredientsByKeyword = (keyword: string) => {
    if (!keyword.trim()) {
      setFilteredIngredients([]);
      return;
    }

    const filtered = ingredients.filter(ingredient =>
      ingredient.name.toLowerCase().includes(keyword.toLowerCase()) ||
      (ingredient.category && ingredient.category.toLowerCase().includes(keyword.toLowerCase()))
    ).slice(0, 10); // Limit to 10 suggestions

    setFilteredIngredients(filtered);
  };

  const handleKeywordChange = (keyword: string) => {
    setFormData({ ...formData, keyword });
    filterIngredientsByKeyword(keyword);
  };

  const filteredMappings = mappings.filter(mapping =>
    mapping.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h2">
          Ingredient Mappings
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setShowForm(true)}
        >
          Add Mapping
        </Button>
      </Box>

      {/* Search */}
      <Box position="relative">
        <SearchIcon sx={{ position: 'absolute', left: 12, top: 12, color: 'text.secondary' }} />
        <TextField
          fullWidth
          placeholder="Search mappings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ '& .MuiInputBase-root': { pl: 5 } }}
        />
      </Box>

      {/* Form */}
      {showForm && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {editingMapping ? 'Edit Mapping' : 'Add New Mapping'}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Keyword"
                  value={formData.keyword}
                  onChange={(e) => handleKeywordChange(e.target.value)}
                  placeholder="e.g., salt, black pepper"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Ingredient</InputLabel>
                  <Select
                    value={formData.ingredientId}
                    onChange={(e) => setFormData({ ...formData, ingredientId: e.target.value })}
                    label="Ingredient"
                    disabled={!formData.keyword.trim()}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      {formData.keyword.trim() ? 'Select an ingredient...' : 'Enter a keyword first'}
                    </MenuItem>
                    {filteredIngredients.map((ingredient) => (
                      <MenuItem key={ingredient.id} value={ingredient.id}>
                        <Box>
                          <Typography variant="body2">
                            {ingredient.name}
                          </Typography>
                          {ingredient.category && (
                            <Typography variant="caption" color="text.secondary">
                              {ingredient.category}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
              <Switch
                checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
                  }
                  label="Active"
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={1}>
              <Button
                    variant="contained"
                onClick={editingMapping ? handleUpdateMapping : handleCreateMapping}
                disabled={!formData.keyword || !formData.ingredientId}
              >
                {editingMapping ? 'Update' : 'Create'}
              </Button>
                  <Button variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Mappings List */}
      <Box display="flex" flexDirection="column" gap={2}>
        {filteredMappings.map((mapping) => (
          <Card key={mapping.id}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body1" fontWeight="medium">
                      {mapping.keyword}
                    </Typography>
                    <Typography color="text.secondary">→</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {mapping.ingredient.name}
                    </Typography>
                    {mapping.ingredient.category && (
                      <Chip label={mapping.ingredient.category} size="small" />
                    )}
                    {!mapping.isActive && (
                      <Chip label="Inactive" size="small" color="error" />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Created: {new Date(mapping.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box display="flex" gap={1}>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(mapping)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteMapping(mapping.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {filteredMappings.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography color="text.secondary">
          {searchTerm ? 'No mappings found matching your search.' : 'No ingredient mappings found.'}
          </Typography>
        </Box>
      )}
    </Box>
  );
} 