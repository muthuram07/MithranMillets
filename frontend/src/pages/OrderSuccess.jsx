import React, { useEffect, useRef, useState } from 'react';
import { Container, Paper, Box, Typography, Button, Divider } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const memes = [
  "When the millet hits different 🌾😎",
  "You: I need groceries. Also you: Buys 10 varieties of millets. Nice.",
  "Delivery driver: 'I carried your happiness.'",
  "Expectation: Instant delivery. Reality: Patience, young grasshopper."
];

export default function OrderSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order ?? null;

  const audioCtxRef = useRef(null);
  const [soundAllowed, setSoundAllowed] = useState(true); // assume allowed; flip to false if blocked
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    // Replace history entry so back doesn't return to checkout
    navigate(window.location.pathname + window.location.search + window.location.hash, { replace: true, state: { order } });

    // request Notification permission non-blocking
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    // guard back button: redirect to order history on pop
    const onPopState = () => navigate('/order/history', { replace: true });
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // WebAudio chime: three descending/ascending notes, short envelope
  const playChime = async () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;

      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;

      // Some browsers require resume on user gesture; attempt to resume
      if (ctx.state === 'suspended') {
        try { await ctx.resume(); } catch (e) { /* resume might fail if not user gesture */ }
      }

      const now = ctx.currentTime;
      const freqs = [880, 1047, 1318]; // pleasant ascending triad
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f, now + i * 0.12);
        g.gain.setValueAtTime(0, now + i * 0.12);
        g.gain.linearRampToValueAtTime(0.14, now + i * 0.12 + 0.01);
        g.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.26);
        o.connect(g).connect(ctx.destination);
        o.start(now + i * 0.12);
        o.stop(now + i * 0.12 + 0.28);
      });

      setPlayed(true);
      return true;
    } catch (e) {
      console.warn('playChime failed', e);
      return false;
    }
  };

  // Try to play on mount. If the attempt fails due to autoplay policy, mark not allowed.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await playChime();
      if (!mounted) return;
      if (!ok) setSoundAllowed(false);
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const funnyLine = memes[Math.floor(Math.random() * memes.length)];

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', background: 'linear-gradient(180deg,#fffefb,#f7fff7)' }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, color: '#0b3d2e' }}>Order Confirmed 🎉</Typography>
        <Typography variant="subtitle1" sx={{ color: '#274c3f', mb: 2 }}>
          Thank you for shopping with Mithran Millets.
        </Typography>

        <Box sx={{ textAlign: 'left', mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>Order ID:</strong> {order?.id ?? order?.orderNo ?? '—'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>Amount:</strong> {order?.totalAmount ? `₹${Number(order.totalAmount).toFixed(2)}` : (order?.amount ? `₹${Number(order.amount).toFixed(2)}` : '—')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>Payment:</strong> {order?.paymentMethod ?? order?.payment?.method ?? '—'}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body1" sx={{ mb: 2 }}>
          From our family of farmers to your plate — we hope these millets bring warmth, health, and a little crunch to your day.
          We pack every order with care, and a secret smile.
        </Typography>

        <Typography variant="subtitle2" sx={{ fontStyle: 'italic', color: '#4b5e4b', mb: 2 }}>{funnyLine}</Typography>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
          <Button variant="contained" onClick={() => navigate('/order/history')}>View Orders</Button>
          <Button variant="outlined" onClick={() => navigate('/')}>Continue Shopping</Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="caption" sx={{ display: 'block', color: '#7a8a7a' }}>
          P.S. Here's a tiny meme to celebrate:
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
            • "When your pantry goes from 0 to superfood in one checkout." •
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" sx={{ color: '#7a8a7a', display: 'block', mb: 1 }}>
            We’ve emailed your invoice and delivery details. If you don’t see it, check your spam (millet jokes aside).
          </Typography>

          {!order && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: '#8a6b4d' }}>
                No order information was detected. If you were redirected here after payment, open Orders to see your purchase.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1 }}>
                <Button variant="contained" onClick={() => navigate('/order/history')}>Go to Orders</Button>
                <Button variant="outlined" onClick={() => navigate('/')}>Back to Shop</Button>
              </Box>
            </Box>
          )}

          {/* If autoplay blocked, show a small user-triggered play button */}
          {!soundAllowed && !played && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1 }}>
              <Button
                variant="contained"
                onClick={async () => {
                  const ok = await playChime();
                  if (!ok) {
                    // if still fails, let user know
                    setSoundAllowed(false);
                  } else {
                    setSoundAllowed(true);
                  }
                }}
              >
                Play congratulatory sound
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
