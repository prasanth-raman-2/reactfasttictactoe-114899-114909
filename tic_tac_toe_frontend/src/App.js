import React, { useState, useEffect } from 'react';
import './App.css';

// Backend API base URL
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3001";

// Minimal Board cell component
function Square({ value, onClick, disabled }) {
  return (
    <button
      className="ttt-square"
      onClick={onClick}
      disabled={disabled || value}
      aria-label={value ? `Cell occupied by ${value}` : "Click to make move"}
    >
      {value}
    </button>
  );
}

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');
  const [gameId, setGameId] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [status, setStatus] = useState("Start a new game!");
  const [nextPlayer, setNextPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // PUBLIC_INTERFACE
  const newGame = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/game/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        throw new Error("Failed to start new game");
      }
      const data = await response.json();
      setGameId(data.game_id);
      setBoard(data.board);
      setNextPlayer(data.next_player || "X"); // fallback if not present
      setWinner(null);
      setStatus("Game started! X goes first.");
      setError(null);
    } catch (err) {
      setError("Could not start a new game. " + err.message);
    }
    setIsLoading(false);
  };

  // PUBLIC_INTERFACE
  const fetchState = async (gid) => {
    if (!gid) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/game/${gid}/state`);
      if (!response.ok) throw new Error("Failed to fetch game state");
      const data = await response.json();
      setBoard(data.board);
      setNextPlayer(data.next_player);
      setWinner(data.winner);
      setStatus(generateStatus(data));
    } catch (err) {
      setError("Could not fetch game state. " + err.message);
    }
    setIsLoading(false);
  };

  // PUBLIC_INTERFACE
  const makeMove = async (idx) => {
    if (!gameId || winner || board[idx]) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/game/${gameId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: idx })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Invalid move");
      }
      // Expect backend to return up-to-date state
      const data = await response.json();
      setBoard(data.board);
      setNextPlayer(data.next_player);
      setWinner(data.winner);
      setStatus(generateStatus(data));
    } catch (err) {
      setError("Move failed: " + err.message);
    }
    setIsLoading(false);
  };

  function generateStatus(gameData) {
    if (!gameData) return "";
    if (gameData.winner) {
      return `Winner: ${gameData.winner === "draw" ? "Draw" : gameData.winner}`;
    }
    return `Next player: ${gameData.next_player}`;
  }

  // Re-fetch game state on mount if game in progress
  useEffect(() => {
    if (gameId) {
      fetchState(gameId);
    }
    // eslint-disable-next-line
  }, [gameId]);

  // PUBLIC_INTERFACE
  const handleSquareClick = (idx) => {
    if (!winner && !board[idx] && !isLoading) {
      makeMove(idx);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <h1 className="ttt-title">Tic Tac Toe</h1>
        <div className="ttt-controls">
          <button
            className="ttt-btn ttt-btn-new"
            onClick={newGame}
            disabled={isLoading}
          >
            {gameId ? "Restart Game" : "Start Game"}
          </button>
        </div>
        <div className="ttt-status" aria-live="polite">
          {status}
        </div>
        {error && (
          <div className="ttt-error" role="alert">{error}</div>
        )}
        <div className="ttt-board" role="region" aria-label="Tic Tac Toe board">
          {board.map((val, idx) => (
            <Square
              key={idx}
              value={val}
              onClick={() => handleSquareClick(idx)}
              disabled={!!winner || !gameId || isLoading}
            />
          ))}
        </div>
        {winner && (
          <div className="ttt-winner">
            {winner === "draw"
              ? "It's a draw!"
              : `🎉 Winner: ${winner} 🎉`}
          </div>
        )}
        <footer className="ttt-footer">
          <span>
            Modern minimal Tic Tac Toe &mdash; Powered by React & FastAPI
          </span>
        </footer>
      </header>
    </div>
  );
}

export default App;
