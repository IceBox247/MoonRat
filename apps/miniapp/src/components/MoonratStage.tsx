import { motion } from 'framer-motion';
import './MoonratStage.css';

export default function MoonratStage({ mining }: { mining: boolean }) {
  return (
    <div className={`stage ${mining ? 'stage-active' : ''}`}>
      {/* Glowing crystal floor */}
      <div className="stage-glow" />
      <div className="stage-ring" />

      {/* Crystal shards */}
      {mining &&
        Array.from({ length: 6 }).map((_, i) => (
          <motion.span
            key={i}
            className="shard"
            style={{ left: `${18 + i * 12}%` }}
            initial={{ y: 20, opacity: 0, scale: 0.6 }}
            animate={{ y: -60 - (i % 3) * 20, opacity: [0, 1, 0], scale: 1 }}
            transition={{ duration: 1.4 + (i % 3) * 0.3, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}

      {/* The rat */}
      <motion.img
        src="/assets/moonrat-mining.png"
        alt="Moonrat mining"
        className="stage-rat"
        draggable={false}
        animate={
          mining
            ? { rotate: [0, -3, 2, 0], y: [0, -2, 1, 0] }
            : { y: [0, -6, 0] }
        }
        transition={
          mining
            ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      {/* Impact spark */}
      {mining && (
        <motion.div
          className="spark"
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.3, 0.6] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      )}

      <div className={`status-chip ${mining ? 'on' : 'off'}`}>
        <span className="dot" />
        {mining ? 'MINING ACTIVE' : 'IDLE'}
      </div>
    </div>
  );
}
