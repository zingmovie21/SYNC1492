import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io(); // Connect to the backend

function App() {
  const [roomId, setRoomId] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [playerState, setPlayerState] = useState("paused");
  const [currentTime, setCurrentTime] = useState(0);
  const [audio] = useState(new Audio("/audio/sample.mp3")); // Replace with your audio file

  useEffect(() => {
    // Handle sync updates from the server
    socket.on("play", () => {
      audio.play();
      setPlayerState("playing");
    });

    socket.on("pause", () => {
      audio.pause();
      setPlayerState("paused");
    });

    socket.on("syncPosition", (time) => {
      audio.currentTime = time;
      setCurrentTime(time);
    });

    return () => {
      socket.off("play");
      socket.off("pause");
      socket.off("syncPosition");
    };
  }, [audio]);

  const createRoom = () => {
    socket.emit("createRoom");
    socket.on("roomCreated", (id) => {
      setRoomId(id);
      setCurrentRoom(id);
    });
  };

  const joinRoom = () => {
    socket.emit("joinRoom", roomId);
    setCurrentRoom(roomId);
  };

  const play = () => {
    socket.emit("play");
  };

  const pause = () => {
    socket.emit("pause");
  };

  const updatePosition = () => {
    const position = audio.currentTime;
    setCurrentTime(position);
    socket.emit("updatePosition", position);
  };

  return (
    <div>
      <h1>Sync Music Player</h1>
      {!currentRoom ? (
        <div>
          <button onClick={createRoom}>Create Room</button>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <div>
          <h2>Room ID: {currentRoom}</h2>
          <button onClick={play}>Play</button>
          <button onClick={pause}>Pause</button>
          <button onClick={updatePosition}>Sync Position</button>
        </div>
      )}
    </div>
  );
}

export default App;
