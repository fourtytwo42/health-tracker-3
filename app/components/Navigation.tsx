'use client';

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
  Leaderboard as LeaderboardIcon,
  AdminPanelSettings as AdminIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  HealthAndSafety as HealthIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export default function Navigation() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isAdmin = user?.role === 'ADMIN';

  const navigationItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, href: '/dashboard' },
    { text: 'Chat', icon: <ChatIcon />, href: '/chat' },
    { text: 'Leaderboard', icon: <LeaderboardIcon />, href: '/leaderboard' },
    ...(isAdmin ? [{ text: 'Admin', icon: <AdminIcon />, href: '/admin' }] : []),
  ];

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" color="primary">
          AI Health Companion
        </Typography>
        {user && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Welcome, {user.username}
            </Typography>
            {isAdmin && (
              <Chip
                label="Admin"
                size="small"
                color="primary"
                sx={{ mt: 0.5 }}
              />
            )}
          </Box>
        )}
      </Box>
      <List>
        {navigationItems.map((item) => (
          <ListItem
            key={item.text}
            component={Link}
            href={item.href}
            onClick={handleDrawerToggle}
            sx={{
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            component={Link}
            href="/dashboard"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 600,
            }}
          >
            AI Health Companion
          </Typography>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
            {navigationItems.map((item) => (
              <Button
                key={item.text}
                component={Link}
                href={item.href}
                color="inherit"
                startIcon={item.icon}
                sx={{ textTransform: 'none' }}
              >
                {item.text}
              </Button>
            ))}
          </Box>

          {/* User Menu */}
          {user && (
            <Box sx={{ ml: 2 }}>
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{ p: 0 }}
              >
                <Avatar 
                  sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                >
                  <PersonIcon />
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem 
                  onClick={() => {
                    handleProfileMenuClose();
                    router.push('/profile');
                  }}
                >
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem 
                  onClick={() => {
                    handleProfileMenuClose();
                    router.push('/user-details');
                  }}
                >
                  <ListItemIcon>
                    <HealthIcon fontSize="small" />
                  </ListItemIcon>
                  Health Profile
                </MenuItem>
                <MenuItem 
                  onClick={() => {
                    handleProfileMenuClose();
                    router.push('/settings');
                  }}
                >
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
} 