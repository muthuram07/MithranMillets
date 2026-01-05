import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box
      sx={{
        py: 2,
        px: 2,
        textAlign: 'center',
        background: 'linear-gradient(to right, #1b4332, #2d6a4f)',
        color: '#fefae0',
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        zIndex: 1200,
      }}
    >
      <Typography variant="body2" sx={{ fontFamily: 'Georgia, serif', fontWeight: 500 }}>
        &copy; {new Date().getFullYear()} Mithran Millets. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
