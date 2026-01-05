/*
  src/pages/ProductDetail.jsx

  Purpose:
  - Product detail view: shows product information, images, and add-to-cart actions.
  - Responsible for fetching a single product and rendering details.
*/

/**
 * ProductDetail
 * Displays detailed product information and purchase actions.
 */

import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  CardMedia,
  Box,
  Paper,
} from '@mui/material';
import apiProduct from '../services/apiProduct';
import { CartContext } from '../context/CartContext';
import { toast } from 'react-toastify';
import '../styles/productlist.css'; // reuse the same styles (or import productdetail.css)

const BASE_URL = 'http://localhost:8081';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    let mounted = true;
    apiProduct.get(`/products/${id}`)
      .then(res => { if (mounted) setProduct(res.data); })
      .catch(err => console.error('Error fetching product:', err));
    return () => { mounted = false; };
  }, [id]);

  const handleAdd = async () => {
    try {
      await addToCart(product, 1);
      toast.success('Added to cart!');
    } catch (e) {
      // handled in CartContext
    }
  };

  if (!product) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h6" color="text.secondary">Loading product details...</Typography>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to right, #fefae0, #e9c46a)',
        py: 6,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 4,
            backgroundColor: '#fff8e1',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          {/* fixed image container — same height as list cards (keeps visual consistency) */}
          <Box className="pl-image-wrap pl-detail-image-wrap" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <CardMedia
              component="img"
              image={product.imageDownloadUrl ? `${BASE_URL}${product.imageDownloadUrl}` : '/default-product.jpg'}
              alt={product.name}
              loading="lazy"
              className="pl-image"
              sx={{ borderRadius: 2, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </Box>

          <Typography variant="h4" sx={{ mt: 3, fontWeight: 'bold', color: '#1b4332' }}>
            {product.name}
          </Typography>
          <Typography variant="h6" sx={{ mt: 1, color: '#d4a373' }}>
            ₹{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {product.description || 'Premium quality millet.'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Stock: {product.stock > 0 ? product.stock : 'Out of stock'}
          </Typography>
          <Button
            variant="contained"
            sx={{
              mt: 3,
              backgroundColor: '#d4a373',
              color: '#1b4332',
              fontWeight: 'bold',
              borderRadius: '30px',
              '&:hover': { backgroundColor: '#e9c46a' },
            }}
            disabled={product.stock === 0}
            onClick={handleAdd}
          >
            Add to Cart
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default ProductDetail;
