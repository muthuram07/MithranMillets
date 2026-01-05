import React from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

/**
 * NotFound.jsx
 *
 * A friendly, slightly funny 404 page with a clear CTA back to shopping.
 * Drop this file in src/pages and route to it for unmatched routes.
 */

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fff9f0 0%, #f0ead6 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 8,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={8}
          sx={{
            display: 'flex',
            gap: 4,
            alignItems: 'center',
            p: { xs: 4, md: 6 },
            borderRadius: 3,
            background: 'linear-gradient(180deg,#ffffff,#fff8e6)',
            border: '1px solid rgba(13,60,45,0.06)',
            boxShadow: '0 18px 50px rgba(11,61,46,0.08)',
          }}
        >
          <Box
            sx={{
              width: { xs: 110, md: 160 },
              height: { xs: 110, md: 160 },
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#fff7ea',
              flexShrink: 0,
              boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.02)',
            }}
            aria-hidden
          >
            {/* simple SVG mascot — lightweight, no external asset */}
            <svg width="86" height="86" viewBox="0 0 86 86" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lost millet mascot">
              <rect width="86" height="86" rx="12" fill="#f6efe2"/>
              <g transform="translate(14,14)">
                <ellipse cx="29" cy="28" rx="29" ry="28" fill="#f2f7f3"/>
                <path d="M10 34c6-8 22-8 28 0" stroke="#cfe6d9" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="18" cy="24" r="3" fill="#2d6a4f"/>
                <circle cx="40" cy="24" r="3" fill="#2d6a4f"/>
                <path d="M20 36c3 2 11 2 14 0" stroke="#9fbfaf" strokeWidth="2" strokeLinecap="round"/>
              </g>
            </svg>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" sx={{ fontFamily: 'Georgia, serif', fontWeight: 800, color: '#123a2b', mb: 1 }}>
              404 — Page Not Found
            </Typography>

            <Typography variant="h6" sx={{ color: '#3f6b55', mb: 2 }}>
              Oops. This page wandered off into the millet fields and took the map with it.
            </Typography>

            <Typography variant="body1" sx={{ color: '#556b5f', mb: 3 }}>
              We searched under sacks, behind sacks, and even inside the cookie jar, but couldn't find what you were looking for.
              Try heading back to the store — the millets miss you.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/products')}
                sx={{
                  backgroundColor: '#2d6a4f',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: '28px',
                  px: 3,
                  '&:hover': { backgroundColor: '#23583f' },
                }}
              >
                🛍️ Browse Products
              </Button>

              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
                sx={{
                  borderColor: '#cfdccc',
                  color: '#2d6a4f',
                  fontWeight: 700,
                  borderRadius: '28px',
                  px: 3,
                }}
              >
                ← Go Back
              </Button>
            </Box>

            <Typography variant="caption" sx={{ display: 'block', mt: 3, color: '#93a79a' }}>
              If you keep seeing this, the site might be playing hide-and-seek — try refreshing or contact support.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default NotFound;
