import { Box, Button, Container, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import VoiceRoom from './components/VoiceRoom';

function App() {
  const [roomId, setRoomId] = useState('');
  const [joinedRoom, setJoinedRoom] = useState('');

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      setJoinedRoom(roomId);
    }
  };

  if (joinedRoom) {
    return <VoiceRoom roomId={joinedRoom} />;
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Join a Voice Room
          </Typography>
          <TextField
            fullWidth
            label="Room ID"
            variant="outlined"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <Button fullWidth variant="contained" size="large" onClick={handleJoinRoom} disabled={!roomId.trim()}>
            Join Room
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}

export default App;
