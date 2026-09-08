import { useEffect, useRef } from 'react';
import { useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import { api } from '../lib/api';
import { useStore } from '../lib/store';
import { tg } from '../lib/telegram';

/**
 * Keeps the backend in sync with the connected TON wallet.
 * On connect -> POST address (server reads on-chain $MOONRAT balance -> hashrate).
 * On disconnect -> clear.
 *
 * Anti-fraud: if the backend rejects the wallet (already linked to another account),
 * disconnect it here so TON Connect doesn't show "connected" while we ignore it.
 */
export function useWalletSync() {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const { user, reloadUser, ready } = useStore();
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
      } catch (e: any) {
        if (e?.status === 409 || e?.message === 'wallet_already_linked') {
          lastAddr.current = null;
          try {
            await tonConnectUI.disconnect();
          } catch {
            /* ignore */
          }
          const msg = 'This wallet is already linked to another Moonrat account.';
          const w = tg();
          if (w && (w as any).showAlert) (w as any).showAlert(msg);
          else alert(msg);
        }
        // other errors: leave UI in "not connected" state; user can retry
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.account?.address, ready]);
}
