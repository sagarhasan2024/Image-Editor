import React from 'react';

import MicIcon from '@mui/icons-material/Mic';
import { styled, keyframes } from '@mui/system';
import ChatIcon from '@mui/icons-material/Chat';
import PanToolIcon from '@mui/icons-material/PanTool';
import VideocamIcon from '@mui/icons-material/Videocam';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import {
  Box,
  Badge,
  Paper,
  Stack,
  Avatar,
  Slider,
  Tooltip,
  Divider,
  Typography,
  IconButton,
} from '@mui/material';

import { Scrollbar } from 'src/components/scrollbar';

// Animation for the active speaker
const pulse = keyframes`
  0% { box-shadow: 0 0 0 0px rgba(0, 255, 204, 0.7); }
  70% { box-shadow: 0 0 0 15px rgba(0, 255, 204, 0); }
  100% { box-shadow: 0 0 0 0px rgba(0, 255, 204, 0); }
`;

const ActiveAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  border: '4px solid #00ffcc',
  animation: `${pulse} 2s infinite`,
}));

const ControlBar = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  bottom: 10,
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '10px 30px',
  borderRadius: '50px',
  display: 'flex',
  gap: '20px',
  backgroundColor:
    theme.palette.mode === 'dark' ? 'rgba(2, 2, 2, 0.3)' : 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  zIndex: 1000,
}));

const InnerRoomUI = () => (
  <Box
    sx={{
      minHeight: 1,
      height: '100%',
      bgcolor: 'background.neutral',
      color: 'primary.main',
      p: 2,
      position: 'relative',
      borderRadius: 2,
      // background: (theme) =>
      //   `radial-gradient(circle at top right, ${theme.palette.background.neutral}, ${theme.palette.background.paper})`, // Subtle radial gradient
    }}
  >
    {/* Top Navigation */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight="bold">
          AI Ethics Discussion
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          Recording • 01:24:05
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <IconButton color="inherit">
          <ChatIcon />
        </IconButton>
        <IconButton color="inherit">
          <MoreVertIcon />
        </IconButton>
      </Box>
    </Box>

    {/* Main Content Area */}
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {/* The Speaker Stage (Viewing another user) */}
      <Box sx={{ textAlign: 'center', mb: 1, width: '100%' }}>
        <Box sx={{ display: 'inline-block', position: 'relative' }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box
                sx={{
                  bgcolor: '#5865f2',
                  p: 0.5,
                  borderRadius: '50%',
                  display: 'flex',
                  border: '2px solid #0f172a',
                }}
              >
                <Typography
                  sx={{ fontSize: '0.7rem', color: '#f2f3f5', fontWeight: 'bold', px: 0.3 }}
                >
                  Owner
                </Typography>
              </Box>
            }
          >
            <ActiveAvatar src="https://i.pravatar.cc/150?u=otheruser" />
          </Badge>
        </Box>
        <Typography variant="h6" sx={{ my: 1, color: 'primary.main', fontWeight: 600 }}>
          Sarah Jenkins
        </Typography>

        {/* User Interaction Strip */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: '#1e1f22',
            p: '4px 12px',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {/* Local Volume for this specific user */}
          <Tooltip title="User Volume">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 1, width: 80 }}>
              <VolumeUpIcon sx={{ fontSize: 16, color: '#949ba4' }} />
              <Slider
                size="small"
                defaultValue={100}
                sx={{ color: '#5865f2', '& .MuiSlider-thumb': { width: 8, height: 8 } }}
              />
            </Stack>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ bgcolor: '#4e5058', my: 1 }} />

          {/* Quick Social Actions */}
          <Tooltip title="Send Reaction">
            <IconButton size="small" sx={{ color: '#b5bac1', '&:hover': { color: '#ffcc00' } }}>
              <AddReactionIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="View Profile">
            <IconButton size="small" sx={{ color: '#b5bac1', '&:hover': { color: '#fff' } }}>
              <PersonSearchIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Direct Message">
            <IconButton size="small" sx={{ color: '#b5bac1', '&:hover': { color: '#5865f2' } }}>
              <ChatBubbleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Participant Grid */}
      <Scrollbar
        sx={{
          width: '83.333%',
          height: 190,
          borderRadius: 2,
          pt: 1,
          pb: 8,
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: 2,

            justifyItems: 'center',
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 11, 13].map((user) => (
            <Box key={user} sx={{ textAlign: 'center' }}>
              <Avatar
                src={`https://i.pravatar.cc/150?u=${user}`}
                sx={{ width: 60, height: 60, border: '2px solid rgba(255,255,255,0.1)' }}
              />
              <Typography variant="caption" display="block">
                User {user}
              </Typography>
            </Box>
          ))}
        </Box>
      </Scrollbar>
    </Box>

    {/* Floating Control Bar */}
    <ControlBar>
      <Tooltip title="Mute">
        <IconButton
          sx={{
            bgcolor: 'rgba(2, 2, 2, 0.3)',
            color: 'common.white',
            '&:hover': { bgcolor: 'rgba(2, 2, 2, 0.5)' },
          }}
        >
          <MicIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Camera">
        <IconButton
          sx={{
            bgcolor: 'rgba(2, 2, 2, 0.3)',
            color: 'common.white',
            '&:hover': { bgcolor: 'rgba(2, 2, 2, 0.5)' },
          }}
        >
          <VideocamIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Share Screen">
        <IconButton
          sx={{
            bgcolor: 'rgba(2, 2, 2, 0.3)',
            color: 'common.white',
            '&:hover': { bgcolor: 'rgba(2, 2, 2, 0.5)' },
          }}
        >
          <ScreenShareIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Raise Hand">
        <IconButton
          sx={{
            bgcolor: 'rgba(2, 2, 2, 0.3)',
            color: 'common.white',
            '&:hover': { bgcolor: 'rgba(2, 2, 2, 0.5)' },
          }}
        >
          <PanToolIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Leave Room">
        <IconButton sx={{ bgcolor: '#ff4d4d', color: 'white', '&:hover': { bgcolor: '#ff0000' } }}>
          <ExitToAppIcon />
        </IconButton>
      </Tooltip>
    </ControlBar>
  </Box>
);

export default InnerRoomUI;
