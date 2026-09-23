import React, { useEffect, useState } from "react";
import {
  getBackendWsUrl,
  isSocketConnected,
  isValidGameId,
  sendMessage,
  setMessageHandler,
} from "../components/socketService";
import { fireWinnerConfetti } from "../utils/confetti";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import rock from "../assets/rock.png";
import paper from "../assets/paper.png";
import scissors from "../assets/scissors.png";
import home from "../assets/home.png";
import restart from "../assets/restart.png";
import ready from "../assets/ready.png";
import copy from "../assets/copy.png";
import { connectToServer } from "../components/socketService";
import SEO from "../components/SEO";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { contentVariants, reducedMotionVariants, stateVariants } from "../motion";

function Game() {
  const { gameId } = useParams();

  const navigate = useNavigate();
  const location = useLocation();

  const [choice, setChoice] = useState("");
  const [hasOpponent, setHasOpponent] = useState(
    location.state?.opponent ?? true
  );
  const [opponentChoice, setOpponentChoice] = useState("");

  const [result, setResult] = useState("");
  const [status, setStatus] = useState(
    hasOpponent
      ? location.state?.choiceMade ?? false
        ? "Opponent have made their choice!"
        : "Opponent is Choosing..."
      : "Waiting for Opponent to Join..."
  );

  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  const [rematchRequests, setRematchRequests] = useState({
    you: false,
    opponent: false,
  });
  const shouldReduceMotion = useReducedMotion();
  const panelVariants = shouldReduceMotion ? reducedMotionVariants : contentVariants;
  const resultVariants = shouldReduceMotion ? reducedMotionVariants : stateVariants;

  useEffect(() => {
    if (result === "win") fireWinnerConfetti();
  }, [result]);

  useEffect(() => {
    if (!isValidGameId(gameId)) {
      navigate("/");
      return undefined;
    }

    const handleMessage = (message) => {
      if (message.type === "player_joined") {
        setHasOpponent(true);
        setStatus("Opponent is Choosing...");
      } else if (message.type === "choice_made") {
        setStatus("Opponent have made their choice!");
        setHasOpponent(true);
      } else if (message.type === "game_result") {
        setOpponentChoice(message.opponentChoice);
        setResult(message.result);
        if (message.result === "win") {
          setPlayerScore((prevScore) => prevScore + 1);
        } else if (message.result === "lose") {
          setOpponentScore((prevScore) => prevScore + 1);
        }
      } else if (message.type === "rematch_requested") {
        setRematchRequests((prev) => ({ ...prev, opponent: true }));
      } else if (message.type === "rematch_accepted") {
        setChoice("");
        setOpponentChoice("");
        setResult("");
        setRematchRequests({
          you: false,
          opponent: false,
        });
        setStatus("Opponent is Choosing...");
      } else if (message.type === "info") {
        toast.info(message.message);
        if (message.code === "player_disconnected" || message.message === "Other player disconnected. Game ended.") {
          setHasOpponent(false);
          setPlayerScore(0);
          setOpponentScore(0);
          setChoice("");
          setOpponentChoice("");
          setResult("");
          setRematchRequests({
            you: false,
            opponent: false,
          });
          setStatus("Waiting for Opponent to Join...");
        }
      } else if (message.type === "error") {
        toast.error(message.message);
        navigate("/");
      }
    };

    setMessageHandler(handleMessage);
    if (!isSocketConnected()) {
      connectToServer(
        `${getBackendWsUrl()}/ws/${encodeURIComponent(gameId)}`,
        handleMessage,
        (error) => console.error("WebSocket error:", error),
        () => console.log("WebSocket connection closed")
      );
      localStorage.setItem("gameId", gameId);
    }
    return () => setMessageHandler(null);
  }, [navigate, gameId]);

  const sendMove = (move) => {
    if (hasOpponent) {
      setChoice(move);
      sendMessage({ type: "make_choice", gameId, choice: move });
    }
  };

  const viewChoice = (move) => {
    document.getElementById("choiceImageImg").src = move;
  };

  console.log(hasOpponent);

  return (
    <div className="gamePage">
      <SEO
        title="Game"
        description="Play Rock Paper Scissors against an opponent in real time."
        path={`/${gameId}`}
        noindex
        nofollow
      />
      <div className="gameArea">
        <motion.div className="players player-1" variants={panelVariants} initial="hidden" animate="visible">
          <div className="playerName">
            You{" "}
            {playerScore !== 0 || opponentScore !== 0 ? `(${playerScore})` : ""}
          </div>
          <div className="choiceImage">
            <img id="choiceImageImg" className="panelImage" src={rock} alt="" />
          </div>
          {choice ? (
            result ? (
              <motion.div
                key={result}
                className="result"
                variants={resultVariants}
                initial="hidden"
                animate="visible"
                style={{
                  backgroundColor:
                    result === "win"
                      ? "green"
                      : result === "lose"
                      ? "red"
                      : "gray",
                }}
              >
                {result === "win" ? "WON" : result === "lose" ? "LOST" : "DRAW"}
              </motion.div>
            ) : (
              <div></div>
            )
          ) : (
            <div className="text">
              <p>Make your choice:</p>
              <div className="choices">
                <motion.button
                  id="rockBtn"
                  className={`choiceBtn ${hasOpponent ? "" : "disabled"}`}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                  onMouseOver={() => viewChoice(rock)}
                  onClick={() => sendMove("rock")}
                >
                  <img src={rock} alt="" width="24px" /> Rock
                </motion.button>

                <motion.button
                  id="paperBtn"
                  className={`choiceBtn ${hasOpponent ? "" : "disabled"}`}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                  onMouseOver={() => viewChoice(paper)}
                  onClick={() => sendMove("paper")}
                >
                  <img src={paper} alt="" width="24px" /> Paper
                </motion.button>

                <motion.button
                  id="scissorsBtn"
                  className={`choiceBtn ${hasOpponent ? "" : "disabled"}`}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                  onMouseOver={() => viewChoice(scissors)}
                  onClick={() => sendMove("scissors")}
                >
                  <img src={scissors} alt="" width="24px" /> Scissors
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
        <motion.div className="players player-2" variants={panelVariants} initial="hidden" animate="visible" transition={{ delay: 0.02 }}>
          <div className="playerName">
            Opponent{" "}
            {playerScore !== 0 || opponentScore !== 0
              ? `(${opponentScore})`
              : ""}
          </div>
          <div className="choiceImage">
            {opponentChoice ? (
              <motion.img
                id="opponentChoice"
                className="panelImage"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.78, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                src={
                  opponentChoice === "rock"
                    ? rock
                    : opponentChoice === "paper"
                    ? paper
                    : scissors
                }
                alt=""
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                {status === "Opponent have made their choice!" ? (
                  <img src={ready} className="readyImage" alt="" />
                ) : (
                  <div className="lds-ellipsis">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                )}
                <span className="statusText">{status}</span>
              </div>
            )}
          </div>
          {hasOpponent ? (
            result ? (
              rematchRequests.opponent ? (
                <motion.button
                  className="result accept"
                  whileHover={shouldReduceMotion ? undefined : { y: -5, scale: 1.03 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.93 }}
                  onClick={() => {
                    setRematchRequests((prev) => ({ ...prev, you: true }));
                    sendMessage({ type: "request_rematch", gameId });
                  }}
                >
                  REMATCH?
                </motion.button>
              ) : (
                <motion.div
                  key={result}
                  className="result"
                  variants={resultVariants}
                  initial="hidden"
                  animate="visible"
                  style={{
                    backgroundColor:
                      result === "win"
                        ? "red"
                        : result === "lose"
                        ? "green"
                        : "gray",
                  }}
                >
                  {result === "win"
                    ? "LOST"
                    : result === "lose"
                    ? "WON"
                    : "DRAW"}
                </motion.div>
              )
            ) : (
              <div></div>
            )
          ) : (
            <div className="text">
              <div className="gameId">
                Game ID: {gameId}
                <img
                  src={copy}
                  className="copyIcon"
                  alt=""
                  onClick={() => {
                    navigator.clipboard.writeText(gameId);
                  }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>
      <AnimatePresence>
      {result && (
          <motion.div className="afterResultPositioner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="afterResult" variants={resultVariants} initial="hidden" animate="visible" exit="exit">
              {rematchRequests.you && (
                <span className="rematchRequests left">Rematch Requested!</span>
              )}
              <motion.button
                whileHover={shouldReduceMotion ? undefined : { scale: 1.15, rotate: -12 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.88 }}
                onClick={() => {
                  setRematchRequests((prev) => ({ ...prev, you: true }));
                  sendMessage({ type: "request_rematch", gameId });
                }}
              >
                <img src={restart} className="restartIcon" alt="" />
              </motion.button>
              <motion.button
                whileHover={shouldReduceMotion ? undefined : { scale: 1.15, rotate: 12 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.88 }}
                onClick={() => {
                  navigate("/");
                }}
              >
                <img src={home} className="homeIcon" alt="" />
              </motion.button>
            </motion.div>
          </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

export default Game;
