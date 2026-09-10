import { motion } from 'framer-motion';
import './MoonratStage.css';

/**
 * The mining hero: the big Moonrat logo front-and-center (Moola/ATF style).
 * Tap it to start mining / claim. Glows + throws crystal shards while active.
 * The logo is a shield/wordmark (not a round coin) so it floats & pulses rather
 * than spinning.
 */
export default function MoonratStage({
  mining,
  onTap,
}: {
  mining: boolean;
  onTap?: () => void;
}) {
  return (
    <div className={`stage ${mining ? 'stage-active' : ''}`}>
      {/* Radial hero glow halo */}
      <div className="stage-glow" />
      {/* Slow sparkle sweep behind the logo */}
      <div className="stage-aura" />

      {/* Crystal shards fly out while mining */}
      {mining &&
        Array.from({ length: 6 }).map((_, i) => (
          <motion.span
            key={i}
            className="shard"
            style={{ left: `${22 + i * 11}%` }}
            initial={{ y: 30, opacity: 0, scale: 0.5 }}
            animate={{ y: -70 - (i % 3) * 18, opacity: [0, 1, 0], scale: 1 }}
            transition={{ duration: 1.5 + (i % 3) * 0.3, repeat: Infinity, delay: i * 0.22 }}
          />
        ))}

      {/* The logo */}
      <motion.button
        type="button"
        className="stage-coin-btn"
        onClick={onTap}
        whileTap={{ scale: 0.95 }}
        aria-label={mining ? 'Tap to claim' : 'Tap to mine'}
      >
        <motion.img
          src="/assets/moonrat-mining.png"
          alt="Moonrat mining"
          className="stage-coin"
          draggable={false}
          animate={
            mining
              ? { scale: [1, 1.035, 1], rotateZ: [0, 1.5, -1.5, 0] }
              : { y: [0, -8, 0] }
          }
          transition={
            mining
              ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }
          }
        />
      </motion.button>

      {/* Impact spark */}
      {mining && (
        <motion.div
          className="spark"
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.3, 0.6] }}
          transition={{ duration: 0.7, repeat: Infinity }}
        />
      )}

      <div className={`status-chip ${mining ? 'on' : 'off'}`}>
        <span className="dot" />
        {mining ? 'MINING ACTIVE' : 'TAP TO MINE'}
      </div>
    </div>
  );
}
