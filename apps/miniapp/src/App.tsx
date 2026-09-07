import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from './lib/store';
import { useWalletSync } from './hooks/useWalletSync';
import BottomNav from './components/BottomNav';
import BootScreen from './components/BootScreen';
import MineScreen from './screens/MineScreen';
import ExpeditionScreen from './screens/ExpeditionScreen';
import CrewScreen from './screens/CrewScreen';
import VaultScreen from './screens/VaultScreen';
import ProfileScreen from './screens/ProfileScreen';

export default function App() {
  const { ready, error } = useStore();
  useWalletSync();
  const location = useLocation();

  if (error) return <BootScreen error={error} />;
  if (!ready) return <BootScreen />;

  return (
    <div className="app-shell">
      <div className="dust" />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="app-scroll"
        >
          <Routes location={location}>
            <Route path="/" element={<MineScreen />} />
            <Route path="/expedition" element={<ExpeditionScreen />} />
            <Route path="/crew" element={<CrewScreen />} />
            <Route path="/vault" element={<VaultScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}
