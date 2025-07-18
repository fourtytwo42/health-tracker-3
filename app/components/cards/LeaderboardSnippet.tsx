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
  Avatar,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

interface LeaderboardSnippetProps {
  currentRank: number;
  totalPoints: number;
  topUsers: Array<{ username: string; points: number }>;
}

export default function LeaderboardSnippet({
  currentRank,
  totalPoints,
  topUsers,
}: LeaderboardSnippetProps) {
  return (
    <Card sx={{ maxWidth: 400, mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrophyIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h3">
            Leaderboard
          </Typography>
        </Box>

        {/* Your Stats */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="primary.contrastText" gutterBottom>
            Your Stats
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip 
              label={`Rank #${currentRank}`}
              size="small"
              color="primary"
            />
            <Chip 
              label={`${totalPoints} points`}
              size="small"
              variant="outlined"
              sx={{ color: 'primary.contrastText', borderColor: 'primary.contrastText' }}
            />
          </Box>
        </Box>

        {/* Top Users */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Top Performers
          </Typography>
          <List dense>
            {topUsers.map((user, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                    {index + 1}
                  </Avatar>
                </ListItemIcon>
                <ListItemText 
                  primary={user.username}
                  secondary={`${user.points} points`}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                  secondaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </CardContent>
    </Card>
  );
} 