import React from 'react';

import { Box, SvgIcon, Typography, ButtonBase } from '@mui/material';

const RoomFindButton = () => (
  <ButtonBase
    sx={{
      width: 1,
      height: 60,
      bgcolor: '#2b2d311f', // Discord secondary background
      borderRadius: '8px',
      display: 'flex',
      color: 'primary.main',
      alignItems: 'center',
      px: 1.5,
      mb: 1,
      gap: 1.5,
      textAlign: 'left',
      transition: 'all 0.2s ease',
      border: '1px solid transparent',
      '&:hover': {
        bgcolor: '#35373c1a',
        borderColor: '#4e505821',
      },
      '&:active': {
        bgcolor: '#40424942',
        transform: 'scale(0.98)',
      },
    }}
  >
    {/* Room Text Info */}

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <SvgIcon sx={{ color: 'primary.main' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
          <path
            fill="currentColor"
            d="M440 424V88h-88V13.005L88 58.522V424H16v32h86.9L352 490.358V120h56v336h88v-32Zm-120 29.642l-200-27.586V85.478L320 51Z"
          />
          <path fill="currentColor" d="M256 232h32v64h-32z" />
        </svg>
      </SvgIcon>
      <Typography
        variant="body2"
        noWrap
        sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.875rem' }}
      >
        Find a room
      </Typography>
    </Box>
  </ButtonBase>
);

export default RoomFindButton;
