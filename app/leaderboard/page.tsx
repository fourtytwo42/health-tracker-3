'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Stack,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  EmojiEvents as EmojiEventsIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import Navigation from '../components/Navigation';

interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
  rank: number;
  mealsLogged: number;
  activitiesLogged: number;
  biomarkersLogged: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`leaderboard-tabpanel-${index}`}
      aria-labelledby={`leaderboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py:3}}>{children}</Box>}
    </div>
  );
}

export default function LeaderboardPage() {
  const [tabValue, setTabValue] = useState(0);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [aroundMe, setAroundMe] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch leaderboard data from API
    // For now, use mock data
    setGlobalLeaderboard([
      {
        userId: '1',
        username: 'HealthChampion',
        totalPoints: 1250,
        rank: 1,
        mealsLogged: 45,
        activitiesLogged: 32,
        biomarkersLogged: 18
      },
      {
        userId: '2',
        username: 'FitnessGuru',
        totalPoints: 1180,
        rank: 2,
        mealsLogged: 42,
        activitiesLogged: 38,
        biomarkersLogged: 15
      },
      {
        userId: '3',
        username: 'WellnessWarrior',
        totalPoints: 1100,
        rank: 3,
        mealsLogged: 38,
        activitiesLogged: 35,
        biomarkersLogged: 20
      },
      {
        userId: '4',
        username: 'NutritionNinja',
        totalPoints: 980,
        rank: 4,
        mealsLogged: 50,
        activitiesLogged: 25,
        biomarkersLogged: 12
      },
      {
        userId: '5',
        username: 'ActiveLife',
        totalPoints: 920,
        rank: 5,
        mealsLogged: 35,
        activitiesLogged: 40,
        biomarkersLogged: 10,
      },
    ]);

    setMyRank({
      userId: 'current',
      username: 'You',
      totalPoints:245,
      rank: 15,
      mealsLogged: 12,
      activitiesLogged: 8,
      biomarkersLogged: 5,
    });

    setAroundMe([
      {
        userId: '13',
        username: 'Runner123',
        totalPoints: 280,
        rank:13,
        mealsLogged: 15,
        activitiesLogged: 12,
        biomarkersLogged:8
      },
      {
        userId: '14',
        username: 'YogaMaster',
        totalPoints: 265,
        rank:14,
        mealsLogged: 18,
        activitiesLogged: 6,
        biomarkersLogged: 10
      },
      {
        userId: 'current',
        username: 'You',
        totalPoints: 245,
        rank:15,
        mealsLogged: 12,
        activitiesLogged: 8,
        biomarkersLogged:5
      },
      {
        userId: '16',
        username: 'GymBuddy',
        totalPoints: 220,
        rank:16,
        mealsLogged: 10,
        activitiesLogged: 15,
        biomarkersLogged:3
      },
      {
        userId: '17',
        username: 'HealthyEater',
        totalPoints: 20,
        rank:17,
        mealsLogged: 20,
        activitiesLogged: 5,
        biomarkersLogged: 4,
      },
    ]);

    setLoading(false);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <EmojiEventsIcon sx={{ color: 'gold' }} />;
      case 2:
        return <EmojiEventsIcon sx={{ color: 'silver' }} />;
      case 3:
        return <EmojiEventsIcon sx={{ color: 'bronze' }} />;
      default:
        return <TrendingUpIcon />;
    }
  };

  const renderLeaderboardList = (entries: LeaderboardEntry[]) => (
    <List>
      {entries.map((entry) => (
        <ListItem
          key={entry.userId}
          sx={{
            bgcolor: entry.userId === 'current' ? 'primary.light' : 'transparent',
            borderRadius: 1,
            mb: 1,
          }}
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: entry.userId === 'current' ? 'primary.main' : 'grey.500' }}>
              {getRankIcon(entry.rank)}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h6" component="span">
                  #{entry.rank}
                </Typography>
                <Typography variant="body1" component="span" fontWeight="bold">
                  {entry.username}
                </Typography>
                <Chip label={`${entry.totalPoints} pts`} size="small" color="primary" />
              </Stack>
            }
            secondary={
              <Stack direction="row" spacing={2}>
                <Chip label={`${entry.mealsLogged} meals`} size="small" variant="outlined" />
                <Chip label={`${entry.activitiesLogged} activities`} size="small" variant="outlined" />
                <Chip label={`${entry.biomarkersLogged} biomarkers`} size="small" variant="outlined" />
              </Stack>
            }
          />
        </ListItem>
      ))}
    </List>
  );

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Loading leaderboard...</Typography>
      </Container>
    );
  }

  return (
    <>
      <Navigation />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Leaderboard
        </Typography>

      <Paper sx={{ width: 100 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="leaderboard tabs"
          centered
        >
          <Tab label="Global Top" />
          <Tab label="Around Me" />
          <Tab label="My Rank" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Global Leaderboard
          </Typography>
          {renderLeaderboardList(globalLeaderboard)}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Around Me
          </Typography>
          {renderLeaderboardList(aroundMe)}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            My Ranking
          </Typography>
          {myRank && (
            <Card sx={{ bgcolor: 'primary.light' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 64 }}>
                    <PersonIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      #{myRank.rank}
                    </Typography>
                    <Typography variant="h6">{myRank.username}</Typography>
                    <Typography variant="body1" color="primary">
                      {myRank.totalPoints} points
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Chip label={`${myRank.mealsLogged} meals`} />
                  <Chip label={`${myRank.activitiesLogged} activities`} />
                  <Chip label={`${myRank.biomarkersLogged} biomarkers`} />
                </Stack>
              </CardContent>
            </Card>
          )}
        </TabPanel>
      </Paper>
    </Container>
    </>
  );
} 