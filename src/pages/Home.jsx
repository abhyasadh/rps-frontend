import React, { useEffect, useState } from "react";
import image from "../assets/background.png";
import { useNavigate } from "react-router-dom";
import {
  connectToServer,
  disconnect,
  getBackendHttpUrl,
  getBackendWsUrl,
  isAllowedWebSocketUrl,
  isValidGameId,
} from "../components/socketService";
import { toast } from "react-toastify";

function Home() {
  const navigate = useNavigate();
  const localGameId = localStorage.getItem("gameId");
  const [joiningGame, setJoiningGame] = useState(false);

  useEffect(() => {
    disconnect();
    localStorage.removeItem("gameId");
  }, [localGameId]);

  const createGame = async () => {
    let response;
    try {
      response = await fetch(`${getBackendHttpUrl()}/games`, { method: "POST" });
    } catch {
      toast.error("Unable to create a game.");
      return;
    }

    if (!response.ok) {
      toast.error("Unable to create a game.");
      return;
    }

    let game;
    try {
      game = await response.json();
    } catch {
      toast.error("Invalid response from the game server.");
      return;
    }
    if (
      !game ||
      !isValidGameId(game.gameId) ||
      typeof game.websocketUrl !== "string" ||
      !isAllowedWebSocketUrl(game.websocketUrl)
    ) {
      toast.error("Invalid response from the game server.");
      return;
    }
    connectToServer(
      game.websocketUrl,
      (message) => {
        if (message.type === "game_created") {
          if (!isValidGameId(message.gameId)) return;
          localStorage.setItem("gameId", message.gameId);
          navigate(`/${message.gameId}`, {state: {opponent: false, choiceMade: false}});
        } else if (message.type === "info") {
          toast.info(message.message);
        } else if (message.type === "error") {
          alert(message.message);
        }
      },
      (error) => console.error("WebSocket error:", error),
      () => console.log("WebSocket connection closed")
    );

  };

  const joinGame = () => {
    let gameIdInput = document.getElementById("gameIdInput");
    const enteredGameId = gameIdInput.value.trim();
    if (!enteredGameId) {
      alert("Please enter a game ID.");
      return;
    }
    if (!isValidGameId(enteredGameId)) {
      toast.error("Game ID is invalid.");
      return;
    }

    connectToServer(
      `${getBackendWsUrl()}/ws/${encodeURIComponent(enteredGameId)}`,
      (message) => {
        if (message.type === "choice_made") {
          return;
        } else if (message.type === "game_joined") {
          if (!isValidGameId(message.gameId)) return;
          localStorage.setItem("gameId", message.gameId);
          navigate(`/${message.gameId}`, {state: {opponent: true, choiceMade: false}});
        } else if (message.type === "info") {
          toast.info(message.message);
        } else if (message.type === "error") {
          toast.error(message.message);
        }
      },
      (error) => console.error("WebSocket error:", error),
      () => console.log("WebSocket connection closed")
    );
  };

  return (
    <>
      <div className="homePage">
        <div className="container">
          <div className="imageContainer">
            <img src={image} alt="" />
          </div>
          <h1>Rock Paper Scissors</h1>

          <div className="menu" id="menu">
            <button
              id="singlePlayerBtn"
              className="button"
              onClick={() => {
                navigate("/singleplayer");
              }}
            >
              Single Player
            </button>
            <button
              id="createGameBtn"
              className="button"
              onClick={() => {
                createGame();
              }}
            >
              Create Game
            </button>
            {!joiningGame ? (
              <button
                id="joinGameBtn"
                className="button"
                onClick={() => {
                  setJoiningGame(true);
                }}
              >
                Join Game
              </button>
            ) : (
              <div className="gameIdInputContainer">
                <input
                  type="text"
                  id="gameIdInput"
                  placeholder="Game ID"
                  autoComplete="off"
                  autoFocus="on"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      joinGame();
                    }
                  }}
                />
                <button
                  id="joinGameSubmitBtn"
                  onClick={() => {
                    joinGame();
                  }}
                >
                  <span>➜</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
