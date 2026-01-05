import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Button } from '@mui/material';
import api from '../services/api';

const Wishlist = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/wishlist').then(res => setItems(res.data));
  }, []);

  const removeItem = (id) => {
    api.delete(`/wishlist/${id}`).then(() => {
      setItems(prev => prev.filter(i => i.id !== id));
    });
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5">Your Wishlist</Typography>
      <Grid container spacing={3}>
        {items.map(item => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card>
              <CardMedia component="img" height="200" image={item.image} />
              <CardContent>
                <Typography variant="h6">{item.name}</Typography>
                <Typography>₹{item.price}</Typography>
                <Button onClick={() => removeItem(item.id)}>Remove</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Wishlist;
