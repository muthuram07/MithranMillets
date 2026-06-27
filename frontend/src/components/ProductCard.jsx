import React from 'react';
import { Card, CardContent, CardMedia, Typography, Button, Box } from '@mui/material';

const BASE_URL = import.meta.env.VITE_PRODUCT_API_BASE_URL || 'http://localhost:8081';

/**
 * Fixed-size product tile (slightly rectangular) with:
 * - uniform card dimensions
 * - fixed image area (cover)
 * - clamped title/description so cards stay same height
 * - action area pinned to bottom
 *
 * Use inside a Grid item (xs/sm/md) — cards will remain visually consistent.
 */
const ProductCard = ({ product, onAdd }) => {
  return (
    <Card
      sx={{
        width: '100%',            // take full column width
        maxWidth: 320,           // control visual size
        minWidth: 240,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 6px 18px rgba(11,61,46,0.08)',
        height: 420,             // fixed card height (rectangle)
      }}
    >
      {/* Image area: fixed height */}
      <Box sx={{ height: 170, width: '100%', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          image={product.imageDownloadUrl ? `${BASE_URL}${product.imageDownloadUrl}` : '/default-product.jpg'}
          alt={product.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </Box>

      {/* Content area: flexible but constrained to keep uniform height */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1, pt: 2 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: '#0b3d2e',
            // clamp title to 2 lines
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.name}
        </Typography>

        <Typography variant="h6" sx={{ color: '#2d6a4f', fontWeight: 700 }}>
          ₹{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.5,
            // clamp description to 3 lines
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: '#6b6b6b',
            flexGrow: 1,
          }}
        >
          {product.description || 'Premium quality millet.'}
        </Typography>

        <Typography variant="caption" sx={{ color: product.stock > 0 ? '#2d6a4f' : '#d9534f' }}>
          {product.stock > 0 ? `In stock: ${product.stock}` : 'Out of stock'}
        </Typography>
      </CardContent>

      {/* Action area fixed at bottom */}
      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          color="success"
          onClick={() => onAdd?.(product)}
          disabled={product.stock === 0}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 1.5,
            backgroundColor: '#2d6a4f',
            '&:hover': { backgroundColor: '#23583f' },
          }}
        >
          Add to Cart
        </Button>
      </Box>
    </Card>
  );
};

export default ProductCard;
