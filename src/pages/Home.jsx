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
import SEO from "../components/SEO";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { contentVariants, reducedMotionVariants, staggerVariants } from "../motion";

function Home() {
  const navigate = useNavigate();
  const localGameId = localStorage.getItem("gameId");
  const [joiningGame, setJoiningGame] = useState(false);
  const [creatingGame, setCreatingGame] = useState(false);
  const [joiningInProgress, setJoiningInProgress] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const entranceVariants = shouldReduceMotion ? reducedMotionVariants : contentVariants;

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
      <SEO
        title={null}
        description="Play Rock Paper Scissors online against friends or the computer. Create a game, share the code, and play in real time."
        path="/"
      />
      <div className="homePage">
        <div className="floatingChoices" aria-hidden="true">
          <img className="floatingChoice fc-1" src={rock} alt="" />
          <img className="floatingChoice fc-2" src={paper} alt="" />
          <img className="floatingChoice fc-3" src={scissors} alt="" />
          <img className="floatingChoice fc-4" src={paper} alt="" />
          <img className="floatingChoice fc-5" src={rock} alt="" />
        </div>
        <motion.div
          className="container"
          variants={staggerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="imageContainer" variants={entranceVariants}>
            <img src={image} alt="" />
          </motion.div>
          <motion.h1 variants={entranceVariants}>Rock Paper Scissors</motion.h1>

          <motion.div className="menu" id="menu" variants={entranceVariants}>
            <motion.button
              id="singlePlayerBtn"
              className="button"
              whileHover={shouldReduceMotion ? undefined : { y: -5, scale: 1.02 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              onClick={() => {
                navigate("/singleplayer");
              }}
            >
              Single Player
            </motion.button>
            <motion.button
              id="createGameBtn"
              className="button"
              aria-busy={creatingGame}
              disabled={creatingGame || joiningInProgress}
              whileHover={shouldReduceMotion ? undefined : { y: -5, scale: 1.02 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              onClick={() => {
                createGame();
              }}
            >
              {creatingGame ? <><span className="buttonSpinner" aria-hidden="true" /> Creating...</> : "Create Game"}
            </motion.button>
            <AnimatePresence mode="wait" initial={false}>
              {!joiningGame ? (
                <motion.button
                  key="join"
                  variants={entranceVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  id="joinGameBtn"
                  className="button"
                  whileHover={shouldReduceMotion ? undefined : { y: -5, scale: 1.02 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                  onClick={() => {
                    setJoiningGame(true);
                  }}
                >
                  Join Game
                </motion.button>
              ) : (
                <motion.div
                  key="join-form"
                  className="gameIdInputContainer"
                  variants={entranceVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
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
                  <motion.button
                    id="joinGameSubmitBtn"
                    aria-label={joiningInProgress ? "Joining game" : "Join game"}
                    aria-busy={joiningInProgress}
                    disabled={creatingGame || joiningInProgress}
                    whileHover={shouldReduceMotion ? undefined : { backgroundColor: "#e7e7e7" }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
                    onClick={() => {
                      joinGame();
                    }}
                  >
                    {joiningInProgress ? <span className="buttonSpinner" aria-hidden="true" /> : <span>➜</span>}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}

export default Home;
