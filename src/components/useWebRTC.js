import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5000';
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // In production, you'd likely need TURN servers for users behind strict firewalls
    // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
  ],
};

export const useWebRTC = (roomId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // Map of peerId -> MediaStream
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const socketRef = useRef(null);
  const peerConnections = useRef({}); // Map of peerId -> RTCPeerConnection

  // --- Utility to create a new Peer Connection for a specific peer ---
  const createPeerConnection = useCallback(
    (peerId) => {
      if (peerConnections.current[peerId]) {
        console.warn(`PeerConnection for ${peerId} already exists.`);
        return peerConnections.current[peerId];
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks to the connection
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      // Handle incoming tracks from this peer
      pc.ontrack = (event) => {
        console.log('Received track from', peerId);
        setRemoteStreams((prev) => ({
          ...prev,
          [peerId]: event.streams[0],
        }));
      };

      // Handle ICE candidate generation and send them to the peer via signaling server
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('ice-candidate', {
            target: peerId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`Connection state with ${peerId}: ${pc.connectionState}`);
      };

      peerConnections.current[peerId] = pc;
      return pc;
    },
    [localStream]
  );

  // --- Initialize media and socket connection ---
  useEffect(() => {
    // 1. Get user media (microphone)
    const initLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setLocalStream(stream);
      } catch (err) {
        console.error('Error accessing microphone:', err);
        // Handle error (e.g., show MUI alert)
      }
    };
    initLocalStream();

    // 2. Connect to signaling server
    socketRef.current = io(SOCKET_SERVER_URL);

    // 3. Join the room
    socketRef.current.emit('join-room', roomId);

    // --- Socket Event Handlers ---
    socketRef.current.on('existing-peers', (peers) => {
      console.log('Existing peers:', peers);
      peers.forEach((peerId) => {
        // Create an offer for each existing peer
        const pc = createPeerConnection(peerId);
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            socketRef.current.emit('offer', {
              target: peerId,
              offer: pc.localDescription,
            });
          });
      });
    });

    socketRef.current.on('peer-joined', (peerId) => {
      console.log('Peer joined:', peerId);
      // Create an offer for the new peer
      const pc = createPeerConnection(peerId);
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          socketRef.current.emit('offer', {
            target: peerId,
            offer: pc.localDescription,
          });
        });
    });

    socketRef.current.on('offer', async (data) => {
      console.log('Received offer from:', data.sender);
      const pc = createPeerConnection(data.sender);
      await pc.setRemoteDescription(data.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit('answer', {
        target: data.sender,
        answer: pc.localDescription,
      });
    });

    socketRef.current.on('answer', async (data) => {
      console.log('Received answer from:', data.sender);
      const pc = peerConnections.current[data.sender];
      if (pc) {
        await pc.setRemoteDescription(data.answer);
      }
    });

    socketRef.current.on('ice-candidate', async (data) => {
      console.log('Received ICE candidate from:', data.sender);
      const pc = peerConnections.current[data.sender];
      if (pc) {
        await pc.addIceCandidate(data.candidate);
      }
    });

    socketRef.current.on('peer-left', (peerId) => {
      console.log('Peer left:', peerId);
      const pc = peerConnections.current[peerId];
      if (pc) {
        pc.close();
        delete peerConnections.current[peerId];
      }
      setRemoteStreams((prev) => {
        const newStreams = { ...prev };
        delete newStreams[peerId];
        return newStreams;
      });
    });

    // Cleanup on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      // Close all peer connections
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
      // Stop local stream tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomId, createPeerConnection, localStream]);

  // --- Screen Sharing Logic ---
  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      // Start screen share
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        // Replace the video track in all peer connections
        const videoTrack = screenStream.getVideoTracks()[0];
        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          } else {
            // If no video track exists (audio-only call), add one
            pc.addTrack(videoTrack, screenStream);
          }
        });
        setIsScreenSharing(true);

        // Stop screen share when user stops it via browser UI
        videoTrack.onended = () => {
          toggleScreenShare(); // Call toggle again to clean up
        };
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    } else {
      // Stop screen share and revert to camera (if any) or just remove video
      // For this example, we'll just stop all video tracks.
      // In a full app, you might want to switch back to a camera feed.
      Object.values(peerConnections.current).forEach((pc) => {
        const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.track.stop();
          pc.removeTrack(videoSender);
        }
      });
      setIsScreenSharing(false);
    }
  }, [isScreenSharing]);

  // --- Mute Controls ---
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        // You could return the new mute state here or manage it in a separate state
      }
    }
  }, [localStream]);

  // --- Volume Control ---
  // const setVolume = useCallback((peerId, volumeLevel) => {
  // Volume is controlled on the audio element, not the track itself
  // We'll handle this in the component by finding the corresponding <audio> tag
  // }, []);

  return {
    localStream,
    remoteStreams,
    toggleMute,
    toggleScreenShare,
    isScreenSharing,
    // setVolume,
  };
};
