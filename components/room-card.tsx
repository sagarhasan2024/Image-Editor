import React from 'react';

import LockIcon from '@mui/icons-material/Lock';
import { Box, Chip, Avatar, Button, Typography, AvatarGroup } from '@mui/material';

const RoomCardUI = () => (
  <Box
    sx={{
      width: 'auto',
      maxWidth: 1,
      background: 'rgba(255, 255, 255, 0.1)', // Transparency
      backdropFilter: 'blur(15px)', // Glass effect
      borderRadius: 2,
      border: '1px solid rgba(255, 255, 255, 0.2)',
      padding: 2,
      boxShadow: '0 8px 24px 0 rgba(0, 0, 0, 0.23)',
      textAlign: 'center',
      position: 'relative',
    }}
  >
    {/* Header Section */}
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.primary',
        gap: 1,
        mb: 3,
      }}
    >
      <Typography variant="h5" fontWeight="600">
        AI Ethics Discussion
      </Typography>
      <LockIcon fontSize="small" sx={{ opacity: 0.7 }} />
      <Chip
        label="[EN]"
        size="small"
        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'text.primary', fontWeight: 'bold' }}
      />
    </Box>

    {/* User Presence Section */}
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'text.primary',
        gap: 3,
        mb: 3,
      }}
    >
      {/* Host Avatar */}
      <Box sx={{ position: 'relative' }}>
        <Avatar
          src="https://i.pravatar.cc/150?u=host"
          sx={{
            width: 100,
            height: 100,
            border: '3px solid #00ffcc',
            boxShadow: '0 0 15px #00ffcc',
          }}
        />
        <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.8 }}>
          Host: Alex Chen
        </Typography>
      </Box>

      {/* Participant Group */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AvatarGroup max={1}>
          <Avatar src="https://i.pravatar.cc/150?u=1" />
          <Avatar src="https://i.pravatar.cc/150?u=2" />
          <Avatar src="https://i.pravatar.cc/150?u=3" />
          <Avatar src="https://i.pravatar.cc/150?u=4" />
          <Avatar src="https://i.pravatar.cc/150?u=5" />
        </AvatarGroup>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          +18
        </Typography>
      </Box>
    </Box>

    {/* Join Button */}
    <Button
      variant="contained"
      sx={{
        borderRadius: '50px',
        py: 0,
        px: 3,
        fontSize: '1rem',
        textTransform: 'none',
        background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
        boxShadow: '0 4px 15px rgba(0, 242, 254, 0.4)',
        '&:hover': {
          background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
        },
      }}
    >
      Join Room
    </Button>
  </Box>
);

export default RoomCardUI;
