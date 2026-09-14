import React, { useEffect, useState } from "react";
import image from "../assets/background.png";
import paper from "../assets/paper.png";
import rock from "../assets/rock.png";
import scissors from "../assets/scissors.png";
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
  const [creatingGame, setCreatingGame] = useState(false);
  const [joiningInProgress, setJoiningInProgress] = useState(false);

  useEffect(() => {
    disconnect();
    localStorage.removeItem("gameId");
  }, [localGameId]);

  const createGame = async () => {
    if (creatingGame || joiningInProgress) return;
    setCreatingGame(true);

    let response;
    try {
      response = await fetch(`${getBackendHttpUrl()}/games`, { method: "POST" });
    } catch {
      toast.error("Unable to create a game.");
      setCreatingGame(false);
      return;
    }

    if (!response.ok) {
      toast.error("Unable to create a game.");
      setCreatingGame(false);
      return;
    }

    let game;
    try {
      game = await response.json();
    } catch {
      toast.error("Invalid response from the game server.");
      setCreatingGame(false);
      return;
    }
    if (
      !game ||
      !isValidGameId(game.gameId) ||
      typeof game.websocketUrl !== "string" ||
      !isAllowedWebSocketUrl(game.websocketUrl)
    ) {
      toast.error("Invalid response from the game server.");
      setCreatingGame(false);
      return;
    }
    const connected = connectToServer(
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
          setCreatingGame(false);
        }
      },
      (error) => {
        setCreatingGame(false);
        console.error("WebSocket error:", error);
      },
      () => {
        setCreatingGame(false);
        console.log("WebSocket connection closed");
      }
    );
    if (!connected) setCreatingGame(false);
  };

  const joinGame = () => {
    if (creatingGame || joiningInProgress) return;
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

    setJoiningInProgress(true);
    const connected = connectToServer(
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
          setJoiningInProgress(false);
        }
      },
      (error) => {
        setJoiningInProgress(false);
        console.error("WebSocket error:", error);
      },
      () => {
        setJoiningInProgress(false);
        console.log("WebSocket connection closed");
      }
    );
    if (!connected) setJoiningInProgress(false);
  };

  return (
    <>
      <div className="homePage">
        <div className="floatingChoices" aria-hidden="true">
          <img className="floatingChoice fc-1" src={rock} alt="" />
          <img className="floatingChoice fc-2" src={paper} alt="" />
          <img className="floatingChoice fc-3" src={scissors} alt="" />
          <img className="floatingChoice fc-4" src={paper} alt="" />
          <img className="floatingChoice fc-5" src={rock} alt="" />
        </div>
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
              aria-busy={creatingGame}
              disabled={creatingGame || joiningInProgress}
              onClick={() => {
                createGame();
              }}
            >
              {creatingGame ? <><span className="buttonSpinner" aria-hidden="true" /> Creating...</> : "Create Game"}
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
                  aria-label={joiningInProgress ? "Joining game" : "Join game"}
                  aria-busy={joiningInProgress}
                  disabled={creatingGame || joiningInProgress}
                  onClick={() => {
                    joinGame();
                  }}
                >
                  {joiningInProgress ? <span className="buttonSpinner" aria-hidden="true" /> : <span>➜</span>}
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
