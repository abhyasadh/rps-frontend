import './index.css';
import Home from './pages/Home';
import Game from './pages/Game';
import SinglePlayer from './pages/SinglePlayer';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { pageVariants, reducedMotionVariants } from './motion';

function AppRoutes() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <ToastContainer position="top-center" />
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={location.pathname}
          className="routeView"
          variants={shouldReduceMotion ? reducedMotionVariants : pageVariants}
          initial={shouldReduceMotion ? "visible" : "initial"}
          animate={shouldReduceMotion ? "visible" : "animate"}
          exit="exit"
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/singleplayer" element={<SinglePlayer />} />
            <Route path="/:gameId" element={<Game />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <Router>
        <AppRoutes />
      </Router>
    </HelmetProvider>
  );
}

export default App;
