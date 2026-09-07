import { motion } from 'framer-motion';

export default function BootScreen({ error }: { error?: string }) {
  return (
    <div className="app-shell" style={{ display: 'grid', placeItems: 'center' }}>
      <div className="dust" />
      <div style={{ textAlign: 'center', padding: 24, position: 'relative', zIndex: 2 }}>
        <motion.img
          src="/assets/moonrat-badge.png"
          alt="Moonrat"
          width={140}
          height={140}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{ filter: 'drop-shadow(0 0 30px rgba(53,230,255,0.5))' }}
        />
        <h1 style={{ marginTop: 18, fontSize: 26, letterSpacing: 1 }} className="gold-text">
          MOONRAT
        </h1>
        <p style={{ color: 'var(--text-dim)', marginTop: 6, fontSize: 13, letterSpacing: 3 }}>
          MINE • HOLD • EXPLORE
        </p>

        {error ? (
          <p style={{ color: 'var(--danger)', marginTop: 22, fontSize: 13, maxWidth: 280 }}>
            Could not start the expedition ({error}). Please reopen the app from Telegram.
          </p>
        ) : (
          <div style={{ marginTop: 26, display: 'flex', gap: 6, justifyContent: 'center' }}>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                style={{ width: 8, height: 8, borderRadius: 8, background: 'var(--cyan)' }}
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
