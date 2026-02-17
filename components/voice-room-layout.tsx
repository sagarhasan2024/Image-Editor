import { Box } from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';

import RoomContainer from './room-container';
import RoomFindButton from './room-find-button';
import RoomEntryButton from './room-entry-button';
import DiscordStyleUserCard from './local-user-proflie';

export default function VoiceRoomLayout() {
  return (
    <DashboardContent maxWidth="lg">
      <Box
        sx={{
          height: 'calc(100vh - 100px)', // Full viewport height minus header
          maxHeight: 'calc(100vh - 100px)', // Full viewport height minus header
          display: 'grid',
          gridTemplateColumns: {
            xs: '100px 1fr',
            sm: '220px 1fr 60px',
            md: '250px 1fr 60px',
            lg: '250px 1fr 60px',
          },
          gridTemplateRows: {
            xs: '80px 1fr 60px',
            sm: '100px 1fr 30px',
            md: '120px 1fr 30px',
            lg: '120px 1fr 30px',
          },
          gap: 1,
        }}
      >
        <Box sx={{ gridArea: '1 / 1 / 2 / 4' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mb: 3,
              borderRadius: 2,
              height: '100%',
              backgroundColor: 'background.neutral',
            }}
          />
        </Box>
        <Box sx={{ gridArea: '2 / 1 / 3 / 2' }}>
          <DiscordStyleUserCard />
          <RoomFindButton />
          <RoomEntryButton />
        </Box>
        <Box
          sx={{
            gridArea: '2 / 2 / 3 / 3',
            overflow: 'hidden',
          }}
        >
          <RoomContainer />
          {/* <InnerRoomUI /> */}
        </Box>
        <Box
          sx={{
            gridArea: '2 / 3 / 3 / 4',
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mb: 3,
              borderRadius: 2,
              height: '100%',
              backgroundColor: 'background.neutral',
            }}
          />
        </Box>
        <Box sx={{ gridArea: '3 / 1 / 4 / 4', backgroundColor: 'lightyellow' }}>
          Additional Content
        </Box>
      </Box>
    </DashboardContent>
  );
}
