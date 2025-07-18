'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Store as StoreIcon,
} from '@mui/icons-material';

interface GroceryItem {
  name: string;
  quantity: string;
  aisle?: string;
  checked?: boolean;
}

interface GroceryListCardProps {
  title: string;
  items: GroceryItem[];
  totalItems: number;
  estimatedCost?: string;
}

export default function GroceryListCard({
  title,
  items,
  totalItems,
  estimatedCost,
}: GroceryListCardProps) {
  // Group items by aisle
  const groupedItems = items.reduce((acc, item) => {
    const aisle = item.aisle || 'Other';
    if (!acc[aisle]) {
      acc[aisle] = [];
    }
    acc[aisle].push(item);
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  return (
    <Card sx={{ maxWidth: 500, mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CartIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
        </Box>

        {/* Summary */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip 
              label={`${totalItems} items`}
              size="small"
              variant="outlined"
            />
            {estimatedCost && (
              <Chip 
                label={`Est. ${estimatedCost}`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {/* Grocery Items by Aisle */}
        {Object.entries(groupedItems).map(([aisle, aisleItems], aisleIndex) => (
          <Box key={aisle} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <StoreIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
              <Typography variant="subtitle2" color="text.secondary">
                {aisle}
              </Typography>
            </Box>
            <List dense>
              {aisleItems.map((item, itemIndex) => (
                <ListItem key={itemIndex} sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={item.name}
                    secondary={item.quantity}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
            {aisleIndex < Object.keys(groupedItems).length - 1 && (
              <Divider sx={{ my: 1 }} />
            )}
          </Box>
        ))}
      </CardContent>
    </Card>
  );
} 