import { useEffect, useRef } from 'react';
import { useTonWallet } from '@tonconnect/ui-react';
import { api } from '../lib/api';
import { useStore } from '../lib/store';

/**
 * Keeps the backend in sync with the connected TON wallet.
 * On connect -> POST address (server reads on-chain $MOONRAT balance -> hashrate).
 * On disconnect -> clear.
 */
export function useWalletSync() {
  const wallet = useTonWallet();
  const { user, setUser, reloadUser, ready } = useStore();
  const lastAddr = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    const addr = wallet?.account?.address ?? null;
    if (addr === lastAddr.current) return;
    lastAddr.current = addr;

    (async () => {
      try {
        if (addr) {
          await api.walletConnect(addr);
        } else if (user?.walletAddress) {
          await api.walletDisconnect();
        }
        await reloadUser();
      } catch {
        /* surfaced elsewhere */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.account?.address, ready]);
}
