import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Psychology as PsychologyIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';

interface SystemMessage {
  id: string;
  key: string;
  title: string;
  content: string;
  category: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AIPromptsTabProps {
  systemMessages: SystemMessage[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

// Define the AI prompt categories we care about
const AI_PROMPT_CATEGORIES = {
  'mcp': {
    label: 'MCP Tool Instructions',
    description: 'Instructions for AI on how to use MCP tools',
    icon: <SettingsIcon />,
    color: 'primary' as const,
  },
  'prompts': {
    label: 'AI Generation Prompts',
    description: 'Prompts sent to AI for generating content',
    icon: <PsychologyIcon />,
    color: 'secondary' as const,
  },
  'chat': {
    label: 'Chat Context & Behavior',
    description: 'System messages that define AI behavior',
    icon: <ChatIcon />,
    color: 'success' as const,
  },
};

export default function AIPromptsTab({
  systemMessages,
  loading,
  onRefresh,
}: AIPromptsTabProps) {
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SystemMessage>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('mcp');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState<Partial<SystemMessage>>({
    key: '',
    title: '',
    content: '',
    category: 'mcp',
    description: '',
    is_active: true,
  });

  // Filter messages to only show AI prompt categories
  const aiPromptMessages = systemMessages.filter(message => 
    Object.keys(AI_PROMPT_CATEGORIES).includes(message.category)
  );

  const filteredMessages = aiPromptMessages.filter(message => {
    const matchesCategory = selectedCategory === 'all' || message.category === selectedCategory;
    const matchesSearch = message.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleEdit = (message: SystemMessage) => {
    setEditingMessage(message.id);
    setEditForm({
      key: message.key,
      title: message.title,
      content: message.content,
      category: message.category,
      description: message.description,
      is_active: message.is_active,
    });
  };

  const handleSave = async (messageId: string) => {
    setSaving(messageId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/system-messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update AI prompt');
      }

      setSuccess('AI prompt updated successfully');
      setEditingMessage(null);
      setEditForm({});
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update AI prompt');
    } finally {
      setSaving(null);
    }
  };

  const handleCancel = () => {
    setEditingMessage(null);
    setEditForm({});
    setError(null);
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this AI prompt? This action cannot be undone.')) {
      return;
    }

    setSaving(messageId);
    setError(null);

    try {
      const response = await fetch(`/api/system-messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete AI prompt');
      }

      setSuccess('AI prompt deleted successfully');
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete AI prompt');
    } finally {
      setSaving(null);
    }
  };

  const handleAdd = async () => {
    if (!newMessage.key || !newMessage.title || !newMessage.content || !newMessage.category) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving('new');
    setError(null);

    try {
      const response = await fetch('/api/system-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessage),
      });

      if (!response.ok) {
        throw new Error('Failed to create AI prompt');
      }

      setSuccess('AI prompt created successfully');
      setAddDialogOpen(false);
      setNewMessage({
        key: '',
        title: '',
        content: '',
        category: 'mcp',
        description: '',
        is_active: true,
      });
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create AI prompt');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          AI Prompts & System Messages
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Manage the actual prompts and system messages sent to the AI. These control how the AI behaves, 
          understands user intent, and generates responses.
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Category Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={selectedCategory} 
          onChange={(_, newValue) => setSelectedCategory(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="All AI Prompts" 
            value="all"
            icon={<PsychologyIcon />}
            iconPosition="start"
          />
          {Object.entries(AI_PROMPT_CATEGORIES).map(([key, config]) => (
            <Tab
              key={key}
              label={config.label}
              value={key}
              icon={config.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {/* Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Search AI prompts"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 200 }}
        />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add AI Prompt
        </Button>
      </Box>

      {/* Messages List */}
      <Grid container spacing={2}>
        {filteredMessages.map((message) => (
          <Grid item xs={12} key={message.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" component="h3">
                        {message.title}
                      </Typography>
                      <Chip
                        label={AI_PROMPT_CATEGORIES[message.category as keyof typeof AI_PROMPT_CATEGORIES]?.label || message.category}
                        color={AI_PROMPT_CATEGORIES[message.category as keyof typeof AI_PROMPT_CATEGORIES]?.color || 'default'}
                        size="small"
                      />
                      <Chip
                        label={message.is_active ? 'Active' : 'Inactive'}
                        color={message.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Key:</strong> {message.key}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {message.description}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {editingMessage === message.id ? (
                      <>
                        <IconButton
                          color="primary"
                          onClick={() => handleSave(message.id)}
                          disabled={saving === message.id}
                        >
                          {saving === message.id ? <CircularProgress size={20} /> : <SaveIcon />}
                        </IconButton>
                        <IconButton color="default" onClick={handleCancel}>
                          <CancelIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(message)}
                          disabled={!!editingMessage}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(message.id)}
                          disabled={saving === message.id}
                        >
                          {saving === message.id ? <CircularProgress size={20} /> : <DeleteIcon />}
                        </IconButton>
                      </>
                    )}
                  </Box>
                </Box>

                {editingMessage === message.id ? (
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Key"
                          value={editForm.key || ''}
                          onChange={(e) => setEditForm({ ...editForm, key: e.target.value })}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Title"
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Category</InputLabel>
                          <Select
                            value={editForm.category || ''}
                            label="Category"
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          >
                            {Object.entries(AI_PROMPT_CATEGORIES).map(([key, config]) => (
                              <MenuItem key={key} value={key}>
                                {config.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Description"
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="AI Prompt Content"
                          value={editForm.content || ''}
                          onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                          multiline
                          rows={8}
                          helperText="This is the actual prompt sent to the AI. Use {placeholders} for dynamic values."
                        />
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2" color="text.secondary">
                        View AI Prompt Content ({message.content.length} characters)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TextField
                        fullWidth
                        multiline
                        rows={10}
                        value={message.content}
                        InputProps={{ readOnly: true }}
                        variant="outlined"
                        sx={{ fontFamily: 'monospace' }}
                      />
                    </AccordionDetails>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add Message Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New AI Prompt</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Key"
                value={newMessage.key || ''}
                onChange={(e) => setNewMessage({ ...newMessage, key: e.target.value })}
                required
                helperText="Unique identifier for this prompt (e.g., 'mcp.meal_plan_instructions')"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title"
                value={newMessage.title || ''}
                onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newMessage.category || ''}
                  label="Category"
                  onChange={(e) => setNewMessage({ ...newMessage, category: e.target.value })}
                  required
                >
                  {Object.entries(AI_PROMPT_CATEGORIES).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Description"
                value={newMessage.description || ''}
                onChange={(e) => setNewMessage({ ...newMessage, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="AI Prompt Content"
                value={newMessage.content || ''}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                multiline
                rows={10}
                required
                helperText="This is the actual prompt sent to the AI. Use {placeholders} for dynamic values."
                sx={{ fontFamily: 'monospace' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={saving === 'new'}
          >
            {saving === 'new' ? <CircularProgress size={20} /> : 'Add AI Prompt'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 