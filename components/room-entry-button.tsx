import React from 'react';

import LockIcon from '@mui/icons-material/Lock';
import { Box, Badge, Avatar, Typography, ButtonBase, AvatarGroup } from '@mui/material';

const RoomEntryButton = () => (
  <ButtonBase
    sx={{
      width: 1,
      height: 60,
      bgcolor: '#2b2d31', // Discord secondary background
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      px: 1.5,
      gap: 1.5,
      textAlign: 'left',
      transition: 'all 0.2s ease',
      border: '1px solid transparent',
      '&:hover': {
        bgcolor: '#35373c',
        borderColor: '#4e5058',
      },
      '&:active': {
        bgcolor: '#404249',
        transform: 'scale(0.98)',
      },
    }}
  >
    {/* Host Avatar with Language Badge */}
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      badgeContent={
        <Box
          sx={{
            bgcolor: '#1e1f22',
            borderRadius: '50%',
            p: 0.2,
            display: 'flex',
            border: '1.5px solid #2b2d31',
          }}
        >
          <Typography sx={{ fontSize: '0.6rem', color: '#b5bac1', fontWeight: 'bold', px: 0.3 }}>
            EN
          </Typography>
        </Box>
      }
    >
      <Avatar
        src="https://i.pravatar.cc/150?u=host1"
        sx={{ width: 36, height: 36, bgcolor: '#5865f2' }}
      />
    </Badge>

    {/* Room Text Info */}
    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography
          variant="body2"
          noWrap
          sx={{ color: '#f2f3f5', fontWeight: 600, fontSize: '0.875rem' }}
        >
          AI Ethics Discussion
        </Typography>
        <LockIcon sx={{ fontSize: 12, color: '#949ba4' }} />
      </Box>

      {/* Participants Sub-text */}
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.2 }}>
        <AvatarGroup
          max={3}
          sx={{
            '& .MuiAvatar-root': {
              width: 16,
              height: 16,
              fontSize: 8,
              border: '1px solid #2b2d31',
            },
          }}
        >
          <Avatar src="https://i.pravatar.cc/150?u=a" />
          <Avatar src="https://i.pravatar.cc/150?u=b" />
          <Avatar src="https://i.pravatar.cc/150?u=c" />
          <Avatar src="https://i.pravatar.cc/150?u=d" />
        </AvatarGroup>
        <Typography sx={{ color: '#949ba4', fontSize: '0.75rem', ml: 1 }}>+24 online</Typography>
      </Box>
    </Box>

    {/* Live Indicator Dot */}
    <Box
      sx={{
        width: 8,
        height: 8,
        bgcolor: '#23a55a',
        borderRadius: '50%',
        boxShadow: '0 0 8px #23a55a',
      }}
    />
  </ButtonBase>
);

export default RoomEntryButton;
