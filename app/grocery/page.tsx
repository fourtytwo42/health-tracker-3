'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Chip,
  Stack,
  Divider,
  IconButton,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import Navigation from '../components/Navigation';

interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  aisle: string;
  isChecked: boolean;
}

interface GroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  createdAt: string;
  totalItems: number;
  checkedItems: number;
}

export default function GroceryPage() {
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch grocery lists from API
    // For now, use mock data
    setGroceryLists([
      {
        id: '1',
        name: 'Weekly Meal Plan Shopping',
        items: [
          { id: '1e', name: 'Chicken Breast', quantity: 2, unit: 'lbs', aisle: 'Meat & Seafood', isChecked: false },
          { id: '2', name: 'Broccoli', quantity: 1, unit: 'head', aisle: 'Produce', isChecked: true },
          { id: '3', name: 'Brown Rice', quantity: 1, unit: 'bag', aisle: 'Pantry', isChecked: false },
          { id: '4', name: 'Greek Yogurt', quantity: 2, unit: 'containers', aisle: 'Dairy& Eggs', isChecked: false },
          { id: '5', name: 'Almonds', quantity: 1, unit: 'bag', aisle: 'Snacks', isChecked: true },
        ],
        createdAt: '2024-12-01',
        totalItems: 5,
        checkedItems: 2,
      },
      {
        id: '2',
        name: 'Healthy Snacks',
        items: [
          { id: '6', name: 'Apples', quantity: 6, unit: 'pieces', aisle: 'Produce', isChecked: false },
          { id: '7', name: 'Carrots', quantity: 1, unit: 'bag', aisle: 'Produce', isChecked: false },
          { id: '8', name: 'Hummus', quantity: 1, unit: 'container', aisle: 'Dairy& Eggs', isChecked: false },
        ],
        createdAt: '2024-12-02',
        totalItems: 3,
        checkedItems: 0,
      },
    ]);

    setLoading(false);
  }, []);

  const handleToggleItem = (listId: string, itemId: string) => {
    setGroceryLists(prev => prev.map(list => {
      if (list.id === listId) {
        const updatedItems = list.items.map(item => {
          if (item.id === itemId) {
            return { ...item, isChecked: !item.isChecked };
          }
          return item;
        });
        const checkedItems = updatedItems.filter(item => item.isChecked).length;
        return { ...list, items: updatedItems, checkedItems };
      }
      return list;
    }));
  };

  const handleDeleteList = (listId: string) => {
    setGroceryLists(prev => prev.filter(list => list.id !== listId));
  };

  const handleExportPDF = (listId: string) => {
    // TODO: Implement PDF export
    console.log('Exporting list:', listId);
  };

  const getAisleColor = (aisle: string) => {
    switch (aisle) {
      case 'Produce':
        return 'success';
      case 'Meat & Seafood':
        return 'error';
      case 'Dairy & Eggs':
        return 'info';
      case 'Pantry':
        return 'warning';
      case 'Snacks':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const groupItemsByAisle = (items: GroceryItem[]) => {
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.aisle]) {
        acc[item.aisle] = [];
      }
      acc[item.aisle].push(item);
      return acc;
    }, {} as Record<string, GroceryItem[]>);
    
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading grocery lists...</Typography>
      </Container>
    );
  }

  return (
    <>
      <Navigation />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">Lists</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
        >
          Generate List
        </Button>
      </Box>

      <Stack spacing={3}>
        {groceryLists.map((list) => (
          <Card key={list.id}>
            <CardHeader
              avatar={<ShoppingCartIcon />}
              title={list.name}
              subheader={`Created ${new Date(list.createdAt).toLocaleDateString()} • ${list.checkedItems}/${list.totalItems} items`}
              action={
                <Stack direction="row" spacing={1}>
                  <IconButton onClick={() => handleExportPDF(list.id)}>
                    <DownloadIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteList(list.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              }
            />
            <CardContent>
              <List>
                {groupItemsByAisle(list.items).map(([aisle, items]) => (
                  <Box key={aisle}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={aisle}
                        color={getAisleColor(aisle) as any}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {items.length} items
                      </Typography>
                    </Box>
                    {items.map((item) => (
                      <ListItem key={item.id} dense>
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={item.isChecked}
                            onChange={() => handleToggleItem(list.id, item.id)}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.name}
                          secondary={`${item.quantity} ${item.unit}`}
                          sx={{
                            textDecoration: item.isChecked ? 'line-through' : 'none',
                            color: item.isChecked ? 'text.secondary' : 'text.primary',
                          }}
                        />
                      </ListItem>
                    ))}
                    <Divider sx={{ my: 1 }} />
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
    </>
  );
} 