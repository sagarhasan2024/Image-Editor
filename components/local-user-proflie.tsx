import React, { useState } from 'react';

import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import HeadsetIcon from '@mui/icons-material/Headset';
import SettingsIcon from '@mui/icons-material/Settings';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import {
  Box,
  Stack,
  Paper,
  Badge,
  Avatar,
  Slider,
  Tooltip,
  Typography,
  IconButton,
} from '@mui/material'; // For input level visualization

const DiscordStyleUserCard = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [volume, setVolume] = useState(80);

  return (
    <Paper
      elevation={0}
      sx={{
        width: 1,
        bgcolor: 'background.neutral', // Discord-inspired background
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid divider',
        mb: 1,
      }}
    >
      {/* Profile Header Container */}
      <Box sx={{ p: '16px 16px 8px 16px' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#23a55a', // Online Green
                color: '#23a55a',
                boxShadow: '0 0 0 2px #232428',
                width: 14,
                height: 14,
                borderRadius: '50%',
              },
            }}
          >
            <Avatar
              src="https://i.pravatar.cc/150?u=me"
              sx={{ width: 48, height: 48, bgcolor: '#5865f2' }}
            />
          </Badge>

          <Box sx={{ overflow: 'hidden' }}>
            <Typography
              variant="subtitle2"
              sx={{ color: '#f2f3f5', fontWeight: 700, lineHeight: 1.2 }}
            >
              Alex Chen
            </Typography>
            <Typography variant="caption" sx={{ color: '#b5bac1', display: 'block' }}>
              #0001
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Mic Input Visualization (Simulated) */}
      <Box sx={{ px: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {[2, 5, 8, 4, 3, 6, 4].map((h, i) => (
          <Box
            key={i}
            sx={{
              width: 4,
              height: h * 1.5,
              bgcolor: !isMuted ? '#23a55a' : '#4e5058',
              borderRadius: 1,
            }}
          />
        ))}
        <Typography variant="caption" sx={{ ml: 1, color: '#b5bac1', fontSize: '0.65rem' }}>
          {isMuted ? 'MUTED' : 'VOICE CONNECTED'}
        </Typography>
      </Box>

      {/* Control Strip */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          px: 1,
          py: 0.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Mute">
            <IconButton
              size="small"
              onClick={() => setIsMuted(!isMuted)}
              sx={{ color: isMuted ? '#f23f42' : '#b5bac1', '&:hover': { bgcolor: '#35373c' } }}
            >
              {isMuted ? <MicOffIcon fontSize="small" /> : <MicIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Deafen">
            <IconButton
              size="small"
              onClick={() => setIsDeafened(!isDeafened)}
              sx={{ color: isDeafened ? '#f23f42' : '#b5bac1', '&:hover': { bgcolor: '#35373c' } }}
            >
              <HeadsetIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Tooltip title="User Settings">
          <IconButton size="small" sx={{ color: '#b5bac1', '&:hover': { bgcolor: '#35373c' } }}>
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Volume Slider Drawer */}
      <Box sx={{ p: '8px 16px' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <GraphicEqIcon sx={{ color: '#b5bac1', fontSize: 18 }} />
          <Slider
            size="small"
            value={volume}
            onChange={(e, v) => setVolume(v as number)}
            sx={{
              color: '#5865f2', // Discord Blue
              height: 4,
              '& .MuiSlider-thumb': {
                width: 10,
                height: 10,
                boxShadow: 'none',
                '&:hover, &.Mui-focusVisible': { boxShadow: 'none' },
              },
              '& .MuiSlider-rail': { bgcolor: '#4e5058' },
            }}
          />
        </Stack>
      </Box>
    </Paper>
  );
};

export default DiscordStyleUserCard;
