import { Box } from '@mui/material';

import { Scrollbar } from 'src/components/scrollbar';

import RoomCardUI from './room-card';

export default function RoomContainer() {
  return (
    <Scrollbar sx={{ height: '100%' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          // background: 'linear-gradient(135deg, #000000, #506392a2, #396bc979)', // Abstract background
          color: 'white',
          position: 'relative',
          p: 3,
          gap: 3,
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((room) => (
          <RoomCardUI />
        ))}
      </Box>
    </Scrollbar>
  );
}
