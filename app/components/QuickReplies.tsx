'use client';

import React from 'react';
import {
  Box,
  Chip,
  Stack,
} from '@mui/material';

interface QuickReply {
  label: string;
  value: string;
}

interface QuickRepliesProps {
  replies: QuickReply[];
  onReply: (value: string) => void;
}

export default function QuickReplies({ replies, onReply }: QuickRepliesProps) {
  return (
    <Box sx={{ mt: 1 }}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {replies.map((reply, index) => (
          <Chip
            key={index}
            label={reply.label}
            size="small"
            variant="outlined"
            clickable
            onClick={() => onReply(reply.value)}
            sx={{ 
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
              }
            }}
          />
        ))}
      </Stack>
    </Box>
  );
} 