import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Avatar,
  IconButton,
  Fab,
} from '@mui/material';
import { motion } from 'framer-motion';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const GOLD = '#e9c46a';
const WHITE = '#ffffff';

/**
 * AboutPage — improved visibility and animations
 *
 * - High-contrast text colors
 * - Subtle decorative overlay (non-blocking)
 * - Framer-motion used consistently for reveal
 * - WebAudio chime + fallback play button
 * - Floating CTA to guide user interaction
 */

const FeatureCard = ({ icon, title, body }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
  >
    <Paper
      elevation={8}
      sx={{
        p: 3,
        borderRadius: 3,
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
        border: '1px solid rgba(255,255,255,0.06)',
        minHeight: 150,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: '#d4a373', color: '#102a20' }}>{icon}</Avatar>
        <Typography variant="h6" sx={{ fontWeight: 800, color: GOLD }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)' }}>
        {body}
      </Typography>
    </Paper>
  </motion.div>
);

export default function AboutPage() {
  const audioCtxRef = useRef(null);
  const [soundAllowed, setSoundAllowed] = useState(true);
  const [played, setPlayed] = useState(false);

  // short premium-sounding chime using WebAudio (triad + gentle pad)
  const playPremiumChime = async () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;

      if (ctx.state === 'suspended') {
        try { await ctx.resume(); } catch (e) {}
      }

      const now = ctx.currentTime;

      // gentle pad (low volume)
      const pad = ctx.createOscillator();
      const padGain = ctx.createGain();
      pad.type = 'sine';
      pad.frequency.setValueAtTime(220, now);
      padGain.gain.setValueAtTime(0, now);
      padGain.gain.linearRampToValueAtTime(0.02, now + 0.01);
      padGain.gain.linearRampToValueAtTime(0, now + 1.6);
      pad.connect(padGain).connect(ctx.destination);
      pad.start(now);
      pad.stop(now + 1.6);

      // harmonic triad for a premium feel
      const freqs = [660, 880, 990];
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, now + 0.08 * i);
        g.gain.setValueAtTime(0, now + 0.08 * i);
        g.gain.linearRampToValueAtTime(0.08, now + 0.08 * i + 0.02);
        g.gain.linearRampToValueAtTime(0, now + 0.08 * i + 0.56);
        o.connect(g).connect(ctx.destination);
        o.start(now + 0.08 * i);
        o.stop(now + 0.08 * i + 0.6);
      });

      setPlayed(true);
      return true;
    } catch (e) {
      console.warn('playPremiumChime failed', e);
      return false;
    }
  };

  // attempt autoplay on mount; if blocked, show play button
  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await playPremiumChime();
      if (!mounted) return;
      if (!ok) setSoundAllowed(false);
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // motion variants for the page container
  const containerVariant = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pt: { xs: 6, md: 10 },
        pb: { xs: 6, md: 12 },
        background:
          'radial-gradient(1200px 600px at 10% 10%, rgba(233,197,106,0.04), transparent), linear-gradient(180deg,#102a20 0%, #163b2d 45%, #1b4332 100%)',
        color: 'rgba(255,255,255,0.95)',
        position: 'relative',
      }}
    >
      {/* decorative non-blocking overlay (reduced impact) */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: 24,
          right: 24,
          width: { xs: 120, md: 240 },
          height: { xs: 120, md: 240 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(233,197,106,0.06), transparent 40%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <motion.div initial="hidden" animate="show" variants={containerVariant}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '1.9rem', md: '2.8rem' },
                  fontFamily: 'Georgia, serif',
                  color: '#fffbe6',
                }}
              >
                About Mithran Millets
              </Typography>

             

              {/* music control */}
              <Box sx={{ ml: 'auto' }}>
                {!soundAllowed && !played ? (
                  <IconButton
                    color="inherit"
                    onClick={async () => {
                      const ok = await playPremiumChime();
                      if (!ok) setSoundAllowed(false);
                      else setSoundAllowed(true);
                    }}
                    aria-label="Play music"
                    sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}
                  >
                    <MusicNoteIcon sx={{ color: GOLD }} />
                  </IconButton>
                ) : null}
              </Box>
            </Box>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.6 }}
          >
            <Typography
              variant="body1"
              sx={{ maxWidth: 900, mb: 4, color: 'rgba(255,255,255,0.94)', fontSize: 16 }}
            >
              Mithran Millets is run by <strong>Indira</strong> & <strong>Murugesan</strong>, and managed by <strong>Thenmozhi</strong> and <strong>Senthilkumar</strong>.
              We are dedicated to reviving traditional grains and empowering local communities through sustainable practices and premium-quality products.
            </Typography>
          </motion.div>

          <Box sx={{ mt: 6 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <FeatureCard
                  icon="🌾"
                  title="Sustainable Sourcing"
                  body="Partnering with small-scale farmers who use regenerative methods to grow nutrient-rich millets."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FeatureCard
                  icon="💚"
                  title="Health First"
                  body="Gluten-free, high-fiber products crafted to support holistic wellness and everyday vitality."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FeatureCard
                  icon="✅"
                  title="Premium Quality"
                  body="Every batch is inspected and packaged to preserve freshness, purity, and nutritional value."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FeatureCard
                  icon="🤝"
                  title="Community Impact"
                  body="We reinvest in rural communities through education, employment, and fair trade practices."
                />
              </Grid>
            </Grid>
          </Box>

          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, ease: 'easeOut' }}>
            <Box sx={{ mt: 8 }}>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 2, color: GOLD }}>
                Our Vision
              </Typography>
              <Typography variant="body1" sx={{ maxWidth: 900, color: 'rgba(255,255,255,0.94)' }}>
                We envision a future where millets are a staple in every household — not just for their health benefits,
                but for the stories they carry. From ancient traditions to modern kitchens, Mithran Millets bridges the gap
                between heritage and innovation.
              </Typography>
            </Box>
          </motion.div>
        </motion.div>
      </Container>

      {/* Floating CTA (subtle, visible) */}
      {/* STARTER BUTTON REMOVED */}
    </Box>
  );
}
