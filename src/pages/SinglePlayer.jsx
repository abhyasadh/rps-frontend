import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getComputerChoice, getRoundResult } from "../utils/gameLogic";
import { fireWinnerConfetti } from "../utils/confetti";
import rock from "../assets/rock.png";
import paper from "../assets/paper.png";
import scissors from "../assets/scissors.png";
import home from "../assets/home.png";
import restart from "../assets/restart.png";
import SEO from "../components/SEO";
import { contentVariants, reducedMotionVariants, stateVariants } from "../motion";

function SinglePlayer() {
  const navigate = useNavigate();
  const [playerChoice, setPlayerChoice] = useState("");
  const [computerChoice, setComputerChoice] = useState("");
  const [result, setResult] = useState("");
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const panelVariants = shouldReduceMotion ? reducedMotionVariants : contentVariants;
  const resultVariants = shouldReduceMotion ? reducedMotionVariants : stateVariants;

  useEffect(() => {
    if (result === "win") fireWinnerConfetti();
  }, [result]);

  const playRound = (move) => {
    const computerMove = getComputerChoice();
    const roundResult = getRoundResult(move, computerMove);

    setPlayerChoice(move);
    setComputerChoice(computerMove);
    setResult(roundResult);

    if (roundResult === "win") {
      setPlayerScore((prev) => prev + 1);
    } else if (roundResult === "lose") {
      setComputerScore((prev) => prev + 1);
    }
  };

  const restartRound = () => {
    setPlayerChoice("");
    setComputerChoice("");
    setResult("");
  };

  const viewChoice = (move) => {
    document.getElementById("choiceImageImg").src = move;
  };

  const isScored = playerScore !== 0 || computerScore !== 0;
  const choiceButtonProps = {
    whileHover: shouldReduceMotion ? undefined : { scale: 1.05 },
    whileTap: shouldReduceMotion ? undefined : { scale: 0.96 },
  };

  return (
    <div className="gamePage">
      <SEO
        title="Single Player"
        description="Play Rock Paper Scissors against the computer. Pick your move and see if you can win!"
        path="/singleplayer"
      />
      <div className="gameArea">
        <motion.div className="players player-1" variants={panelVariants} initial="hidden" animate="visible">
          <div className="playerName">You {isScored ? `(${playerScore})` : ""}</div>
          <div className="choiceImage">
            <img id="choiceImageImg" className="panelImage" src={rock} alt="" />
          </div>
          {playerChoice ? (
            result ? (
              <motion.div
                key={result}
                className="result"
                variants={resultVariants}
                initial="hidden"
                animate="visible"
                style={{ backgroundColor: result === "win" ? "green" : result === "lose" ? "red" : "gray" }}
              >
                {result === "win" ? "WON" : result === "lose" ? "LOST" : "DRAW"}
              </motion.div>
            ) : <div />
          ) : (
            <div className="text">
              <p>Make your choice:</p>
              <div className="choices">
                <motion.button className="choiceBtn" {...choiceButtonProps} onMouseOver={() => viewChoice(rock)} onClick={() => playRound("rock")}>
                  <img src={rock} alt="" width="24px" /> Rock
                </motion.button>
                <motion.button className="choiceBtn" {...choiceButtonProps} onMouseOver={() => viewChoice(paper)} onClick={() => playRound("paper")}>
                  <img src={paper} alt="" width="24px" /> Paper
                </motion.button>
                <motion.button className="choiceBtn" {...choiceButtonProps} onMouseOver={() => viewChoice(scissors)} onClick={() => playRound("scissors")}>
                  <img src={scissors} alt="" width="24px" /> Scissors
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          className="players player-2"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.02 }}
        >
          <div className="playerName">Computer {isScored ? `(${computerScore})` : ""}</div>
          <div className="choiceImage">
            {computerChoice ? (
              <motion.img
                key={computerChoice}
                className="panelImage"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.78, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                src={computerChoice === "rock" ? rock : computerChoice === "paper" ? paper : scissors}
                alt=""
              />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
                <span className="statusText">Computer is Choosing...</span>
              </div>
            )}
          </div>
          {result ? (
            <motion.div
              key={result}
              className="result"
              variants={resultVariants}
              initial="hidden"
              animate="visible"
              style={{ backgroundColor: result === "win" ? "red" : result === "lose" ? "green" : "gray" }}
            >
              {result === "win" ? "LOST" : result === "lose" ? "WON" : "DRAW"}
            </motion.div>
          ) : <div />}
        </motion.div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div className="afterResultPositioner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="afterResult" variants={resultVariants} initial="hidden" animate="visible" exit="exit">
              <motion.button whileHover={shouldReduceMotion ? undefined : { scale: 1.15, rotate: -12 }} whileTap={shouldReduceMotion ? undefined : { scale: 0.88 }} onClick={restartRound}>
                <img src={restart} className="restartIcon" alt="" />
              </motion.button>
              <motion.button whileHover={shouldReduceMotion ? undefined : { scale: 1.15, rotate: 12 }} whileTap={shouldReduceMotion ? undefined : { scale: 0.88 }} onClick={() => navigate("/")}>
                <img src={home} className="homeIcon" alt="" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SinglePlayer;
