import React from 'react';
import { Box, Container, Paper, Typography, Divider, Accordion, AccordionSummary, AccordionDetails, Button, Link } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const faqs = [
  {
    q: 'How can I track my order?',
    a: 'Go to Orders > Order History. You will see the current status for each order. For urgent updates, call the support number.'
  },
  {
    q: 'What is the return policy?',
    a: 'We accept returns for damaged or incorrect items within 5 days of delivery. Please contact support with your order ID.'
  },
  {
    q: 'Do you offer bulk or wholesale orders?',
    a: 'Yes — contact our support team to discuss bulk pricing and delivery timelines.'
  },
  {
    q: 'How do I change my delivery address?',
    a: 'You can add or edit addresses from the Profile > Addresses section before placing an order. For urgent changes after placing an order, call support immediately.'
  }
];

const Support = () => {
  const phone = '9087615536';
  return (
    <Box sx={{ minHeight: '80vh', py: 6, background: 'linear-gradient(to right, #fefae0, #e9c46a)' }}>
      <Container maxWidth="md">
        <Paper elevation={6} sx={{ p: 4, borderRadius: 3, backgroundColor: '#fff8e1' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#102a20', mb: 1 }}>Support & FAQ</Typography>
          <Typography variant="body1" sx={{ color: '#245a43', mb: 3 }}>Have questions? Find quick answers below or reach us directly for urgent issues.</Typography>

          <Box sx={{ mb: 3 }}>
            {faqs.map((f, i) => (
              <Accordion key={i} disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 700 }}>{f.q}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>{f.a}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" sx={{ fontWeight: 800, color: '#102a20', mb: 1 }}>Urgent / Critical queries</Typography>
          <Typography variant="body1" sx={{ color: '#245a43', mb: 2 }}>If your issue is urgent (delivery problem, payment issues, or incorrect/damaged shipment), please call our support number:</Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button variant="contained" href={`tel:${phone}`} sx={{ backgroundColor: '#d4a373', color: '#102a20', fontWeight: 700 }}>Call: {phone}</Button>
            <Typography variant="body2" sx={{ color: '#245a43' }}>Available 9:00 AM — 6:00 PM, Mon — Sat</Typography>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.6)' }}>Prefer email? Reply at support@mithranmillets.example (monitored during business hours).</Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Support;
