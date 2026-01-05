/*
  src/pages/Home.jsx

  Purpose:
  - Home landing page showing featured products and quick navigation actions.
  - Lightweight component that fetches a product list and renders product cards.
*/

/**
 * Home
 * Renders the store home with a product grid. Fetches products on mount.
 */

import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Button } from '@mui/material';
import apiProduct from '../services/apiProduct';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    apiProduct.get('/products').then(res => setProducts(res.data));
  }, []);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Welcome to Our Store</Typography>
      <Grid container spacing={3}>
        {products.map(product => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card>
              <CardMedia component="img" height="200" image={product.image} />
              <CardContent>
                <Typography variant="h6">{product.name}</Typography>
                <Typography>₹{product.price}</Typography>
                <Button onClick={() => navigate(`/products/${product.id}`)}>View</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Home;
