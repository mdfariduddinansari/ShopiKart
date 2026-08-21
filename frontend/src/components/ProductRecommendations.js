import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Rating,
  Skeleton,
  Chip,
  Button,
  Stack,
  useTheme,
} from '@mui/material';
import {
  Favorite as FavoriteFilled,
  FavoriteBorder as FavoriteOutline,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart } from '../features/cartSlice';
import { addToWishlist, removeFromWishlist } from '../features/WishlistSlice';
import api from '../services/api';

// Recommendation type configurations - compact style matching existing template
const RECOMMENDATION_TYPES = {
  personalized: {
    title: '✨ Recommended For You',
    subtitle: 'Personalized picks based on your activity',
    color: '#667eea',
  },
  trending: {
    title: '🔥 Trending Now',
    subtitle: 'Popular products customers are loving',
    color: '#ff5722',
  },
  similar: {
    title: '🏷️ Similar Products',
    subtitle: 'You might also like these',
    color: '#2196f3',
  },
  'recently-viewed': {
    title: '🕐 Recently Viewed',
    subtitle: 'Continue where you left off',
    color: '#607d8b',
  },
  'frequently-bought-together': {
    title: '🛒 Frequently Bought Together',
    subtitle: 'Complete your purchase',
    color: '#4caf50',
  },
  'customers-also-viewed': {
    title: '👀 Customers Also Viewed',
    subtitle: 'Popular with similar shoppers',
    color: '#00bcd4',
  },
  guest: {
    title: '⭐ Popular Products',
    subtitle: 'Best sellers this week',
    color: '#e91e63',
  },
};

// Rating color helper matching existing template
const ratingColor = (r) => {
  if (r == null || r === 0) return '#9e9e9e';
  if (r < 2) return '#d32f2f';
  if (r < 3) return '#f57c00';
  if (r < 4) return '#fbc02d';
  if (r < 4.5) return '#2e7d32';
  return '#00796b';
};

const ProductRecommendations = ({
  type = 'personalized',
  productId = null,
  limit = 16,
  showTitle = true,
  layout = 'scroll', // 'scroll', 'grid', or 'grid-scroll'
  itemsPerRow = 3,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  
  const { user, isAuthenticated } = useSelector((state) => state.auth || {});
  const wishlist = useSelector((state) => state.wishlist?.items || []);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeConfig, setActiveConfig] = useState(null);

  const config = activeConfig || RECOMMENDATION_TYPES[type] || RECOMMENDATION_TYPES.trending;

  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, productId, isAuthenticated, user?._id, limit]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    setActiveConfig(null); // Reset to original type config
    
    try {
      let endpoint = '';
      
      console.log('[ProductRecommendations] Fetching:', {
        type,
        isAuthenticated,
        userId: user?._id,
        limit
      });
      
      switch (type) {
        case 'personalized':
          if (isAuthenticated && user?._id) {
            endpoint = `/recommendations/personalized?limit=${limit}`;
            console.log('[ProductRecommendations] Using personalized endpoint:', endpoint);
          } else {
            endpoint = `/recommendations/trending?limit=${limit}`;
            console.log('[ProductRecommendations] Not authenticated, using trending');
          }
          break;
        case 'trending':
          endpoint = `/recommendations/trending?limit=${limit}`;
          break;
        case 'similar':
          if (!productId) { setLoading(false); return setProducts([]); }
          endpoint = `/recommendations/similar/${productId}?limit=${limit}`;
          break;
        case 'recently-viewed':
          if (!isAuthenticated || !user?._id) { 
            console.log('[ProductRecommendations] Not authenticated for recently-viewed');
            setLoading(false); 
            return setProducts([]); 
          }
          endpoint = `/recommendations/recently-viewed?limit=${limit}`;
          break;
        case 'frequently-bought-together':
          if (!productId) { setLoading(false); return setProducts([]); }
          endpoint = `/recommendations/frequently-bought/${productId}?limit=${limit}`;
          break;
        case 'customers-also-viewed':
          if (!productId) { setLoading(false); return setProducts([]); }
          endpoint = `/recommendations/also-viewed/${productId}?limit=${limit}`;
          break;
        case 'for-you':
          endpoint = `/recommendations/for-you?limit=${limit}`;
          break;
        default:
          endpoint = `/recommendations/trending?limit=${limit}`;
      }

      console.log('[ProductRecommendations] Calling:', endpoint);
      const response = await api.get(endpoint);
      
      console.log('[ProductRecommendations] Response:', {
        success: response.data.success,
        count: response.data.count,
        type: response.data.type
      });
      
      if (response.data.success) {
        // Remove duplicates based on product ID
        const uniqueProducts = Array.from(
          new Map((response.data.data || []).map(p => [p._id, p])).values()
        );
        console.log('[ProductRecommendations] Setting', uniqueProducts.length, 'products');
        
        // Fallback: if personalized returned 0 results, try trending
        if (uniqueProducts.length === 0 && type === 'personalized') {
          console.log('[ProductRecommendations] Personalized empty, falling back to trending');
          try {
            const fallbackRes = await api.get(`/recommendations/trending?limit=${limit}`);
            if (fallbackRes.data.success && fallbackRes.data.data?.length > 0) {
              const fallbackProducts = Array.from(
                new Map(fallbackRes.data.data.map(p => [p._id, p])).values()
              );
              setActiveConfig(RECOMMENDATION_TYPES.trending);
              setProducts(fallbackProducts);
              setLoading(false);
              return;
            }
          } catch (fallbackErr) {
            console.error('[ProductRecommendations] Trending fallback failed:', fallbackErr);
          }
        }
        
        // Fallback: if recently-viewed returned 0, try trending
        if (uniqueProducts.length === 0 && type === 'recently-viewed') {
          console.log('[ProductRecommendations] Recently viewed empty, falling back to trending');
          try {
            const fallbackRes = await api.get(`/recommendations/trending?limit=${limit}`);
            if (fallbackRes.data.success && fallbackRes.data.data?.length > 0) {
              const fallbackProducts = Array.from(
                new Map(fallbackRes.data.data.map(p => [p._id, p])).values()
              );
              setActiveConfig(RECOMMENDATION_TYPES.trending);
              setProducts(fallbackProducts);
              setLoading(false);
              return;
            }
          } catch (fallbackErr) {
            console.error('[ProductRecommendations] Trending fallback failed:', fallbackErr);
          }
        }

        setProducts(uniqueProducts);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('[ProductRecommendations] Error:', err);
      
      // On error, try trending as ultimate fallback
      if (type !== 'trending') {
        try {
          console.log('[ProductRecommendations] Error occurred, trying trending fallback');
          const fallbackRes = await api.get(`/recommendations/trending?limit=${limit}`);
          if (fallbackRes.data.success && fallbackRes.data.data?.length > 0) {
            const fallbackProducts = Array.from(
              new Map(fallbackRes.data.data.map(p => [p._id, p])).values()
            );
            setProducts(fallbackProducts);
            setLoading(false);
            return;
          }
        } catch (fallbackErr) {
          console.error('[ProductRecommendations] Ultimate fallback also failed');
        }
      }
      
      setError('Failed to load recommendations');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const isWishlisted = (p) => wishlist.some((w) => w._id === p._id);

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    
    const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price;
    
    dispatch(addToCart({
      _id: product._id,
      productId: product._id,
      name: product.name,
      price: Number(product.price),
      discountPrice: hasDiscount ? Number(product.discountPrice) : undefined,
      discount: product.discount ? Number(product.discount) : undefined,
      images: product.images || [product.image],
      quantity: 1,
    }));
  };

  const handleToggleWishlist = (e, product) => {
    e.stopPropagation();
    if (isWishlisted(product)) {
      dispatch(removeFromWishlist(product._id));
    } else {
      dispatch(addToWishlist(product._id));
    }
  };

  const trackProductView = async (prodId) => {
    if (!user) return;
    try {
      await api.post('/recommendations/track/view', {
        productId: prodId,
        source: 'recommendation',
      });
    } catch (err) {
      // Silent fail
    }
  };

  const getStockCount = (product) =>
    Number(product?.stock ?? product?.countInStock ?? product?.quantity ?? 0);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const renderProductCard = (p, config, theme) => {
    const r = p.rating || 0;
    const color = ratingColor(r);
    const stockCount = getStockCount(p);
    const inStock = stockCount > 0;
    const hasDiscount = p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price;
    const price = hasDiscount ? p.discountPrice : p.price;
    const discountPercent = hasDiscount ? Math.round((1 - p.discountPrice / p.price) * 100) : 0;

    // Adjust card size based on layout
    const cardWidth = layout === 'grid-scroll' ? '100%' : 200;
    const cardHeight = layout === 'grid-scroll' ? 280 : 320;

    return (
      <Card
        key={p._id}
        onClick={() => {
          trackProductView(p._id);
          navigate(`/product/${p._id}`);
        }}
        sx={{
          minWidth: layout === 'scroll' ? cardWidth : undefined,
          maxWidth: layout === 'scroll' ? cardWidth : undefined,
          width: layout === 'grid-scroll' ? '100%' : undefined,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2.5,
          cursor: 'pointer',
          overflow: 'hidden',
          border: '2px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          background: theme.palette.mode === 'dark' ? '#1a1a2e' : '#fff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          height: cardHeight,
          position: 'relative',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: `0 12px 24px ${config.color}30, 0 6px 12px rgba(0,0,0,0.1)`,
            borderColor: config.color,
          },
        }}
      >
        {/* Image section */}
        <Box sx={{ 
          position: 'relative', 
          background: theme.palette.mode === 'dark' ? '#252540' : '#fafafa', 
          overflow: 'hidden',
          height: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0.75
        }}>
          <CardMedia
            component="img"
            image={p.images?.[0] || p.image || 'https://via.placeholder.com/400'}
            alt={p.name}
            sx={{ 
              maxHeight: '100%',
              maxWidth: '100%',
              objectFit: 'contain',
              transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)',
              '.MuiCard-root:hover &': {
                transform: 'scale(1.08)',
              }
            }}
          />

          {/* Discount badge */}
          {hasDiscount && (
            <Chip
              label={`${discountPercent}% OFF`}
              sx={{
                position: 'absolute',
                top: 6,
                left: 6,
                background: 'linear-gradient(135deg, #ff1744 0%, #d50000 100%)',
                color: '#fff',
                fontWeight: 900,
                fontSize: '0.65rem',
                height: 22,
                letterSpacing: '0.3px',
                boxShadow: '0 3px 12px rgba(255, 23, 68, 0.4)',
                backdropFilter: 'blur(4px)',
              }}
            />
          )}

          {/* Stock status */}
          {!inStock && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.25,
            }}>
              <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.3px' }}>
                OUT OF STOCK
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', fontWeight: 600 }}>
                Unavailable
              </Typography>
            </Box>
          )}

          {/* Wishlist button */}
          <IconButton
            onClick={(e) => handleToggleWishlist(e, p)}
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              bgcolor: isWishlisted(p) ? 'rgba(233, 30, 99, 0.1)' : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 3px 12px rgba(0,0,0,0.12)',
              '&:hover': { 
                bgcolor: isWishlisted(p) ? 'rgba(233, 30, 99, 0.15)' : '#fff',
                transform: 'scale(1.1)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
              },
              width: 32,
              height: 32,
              transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
              border: isWishlisted(p) ? '2px solid #e91e63' : '2px solid rgba(0,0,0,0.08)',
            }}
            size="small"
          >
            {isWishlisted(p) ? (
              <FavoriteFilled sx={{ color: '#e91e63', fontSize: 16 }} />
            ) : (
              <FavoriteOutline sx={{ fontSize: 16, color: '#666' }} />
            )}
          </IconButton>
        </Box>

        {/* Content */}
        <CardContent sx={{ flex: 1, p: 1.25, pb: 0.75, display: 'flex', flexDirection: 'column', gap: 0.6 }}>
          {/* Brand/Category */}
          {p.brand && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary', 
                fontWeight: 600, 
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.3px'
              }}
            >
              {p.brand}
            </Typography>
          )}

          <Typography
            variant="body2"
            sx={{ 
              fontWeight: 700, 
              fontSize: '0.8rem', 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              color: theme.palette.mode === 'dark' ? '#fff' : '#1a1a1a',
              lineHeight: 1.3,
              minHeight: '2.1em',
            }}
          >
            {p.name}
          </Typography>

          {/* Rating */}
          <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center' }}>
            <Rating 
              value={r || 0} 
              size="small" 
              readOnly 
              precision={0.5}
              sx={{ 
                '& .MuiRating-icon': { 
                  color: color,
                  fontSize: '0.9rem'
                }
              }} 
            />
            {r > 0 && (
              <Typography variant="caption" sx={{ fontWeight: 700, color: color, fontSize: '0.7rem' }}>
                {Number(r).toFixed(1)}
              </Typography>
            )}
          </Stack>

          {/* Price */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 'auto' }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: config.color, fontSize: '1.05rem' }}>
              ₹{Number(price || 0).toLocaleString()}
            </Typography>
            {hasDiscount && (
              <Typography 
                variant="caption" 
                sx={{ 
                  textDecoration: 'line-through', 
                  color: 'text.disabled', 
                  fontSize: '0.7rem', 
                  fontWeight: 600,
                  lineHeight: 1
                }}
              >
                ₹{Number(p.price || 0).toLocaleString()}
              </Typography>
            )}
          </Box>
        </CardContent>

        {/* Actions */}
        <CardActions sx={{ p: 1.25, pt: 0, gap: 0.6 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={(e) => {
              if (!inStock) {
                e.stopPropagation();
                return;
              }
              handleAddToCart(e, p);
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: 1.5,
              background: inStock 
                ? `linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%)`
                : 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)',
              fontSize: '0.75rem',
              py: 0.75,
              boxShadow: inStock ? `0 3px 10px ${config.color}30` : 'none',
              transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
              letterSpacing: '0.3px',
              '&:hover': {
                background: inStock 
                  ? `linear-gradient(135deg, ${config.color}ee 0%, ${config.color} 100%)`
                  : 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)',
                transform: inStock ? 'translateY(-1px)' : 'none',
                boxShadow: inStock ? `0 6px 16px ${config.color}40` : 'none',
              },
            }}
            disabled={!inStock}
          >
            {!inStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${p._id}`);
            }}
            sx={{
              minWidth: 'auto',
              px: 1.25,
              py: 0.6,
              borderWidth: '2px',
              borderColor: config.color,
              color: config.color,
              fontWeight: 700,
              fontSize: '0.7rem',
              textTransform: 'none',
              borderRadius: 1.5,
              letterSpacing: '0.3px',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: `${config.color}15`,
                borderColor: config.color,
                borderWidth: '2px',
              },
            }}
          >
            View
          </Button>
        </CardActions>
      </Card>
    );
  };

  // Loading state - responsive skeleton
  if (loading) {
    return (
      <Box sx={{ py: 2, px: { xs: 1, md: 2 } }}>
        {showTitle && (
          <>
            <Skeleton variant="text" width={250} height={32} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width={300} height={16} sx={{ mb: 2 }} />
          </>
        )}
        <Box sx={{ 
          display: layout === 'grid' ? 'grid' : 'flex', 
          gap: 2,
          gridTemplateColumns: layout === 'grid' ? { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' } : undefined,
          overflow: layout === 'scroll' ? 'hidden' : 'visible'
        }}>
          {[...Array(layout === 'grid' ? 10 : 6)].map((_, i) => (
            <Skeleton 
              key={i} 
              variant="rectangular" 
              width={layout === 'grid' ? '100%' : 200} 
              height={280} 
              sx={{ borderRadius: 2.5, flexShrink: 0 }} 
            />
          ))}
        </Box>
      </Box>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <Box sx={{ 
        py: 3, 
        px: { xs: 2, md: 3 },
        textAlign: 'center',
        background: theme.palette.mode === 'dark' 
          ? 'rgba(255,255,255,0.03)' 
          : 'rgba(0,0,0,0.02)',
        borderRadius: 3,
        mb: 3,
      }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Could not load recommendations
        </Typography>
        <Button 
          onClick={fetchRecommendations} 
          variant="outlined" 
          size="small"
          sx={{ 
            textTransform: 'none', 
            fontWeight: 700, 
            borderColor: config.color, 
            color: config.color,
            '&:hover': { background: `${config.color}10` }
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // Don't render if no products
  if (products.length === 0) {
    return null;
  }

  return (
    <Box sx={{ 
      py: 2.5, 
      px: { xs: 2, md: 3 },
      background: theme.palette.mode === 'dark' 
        ? `linear-gradient(135deg, ${config.color}10 0%, ${config.color}05 100%)` 
        : `linear-gradient(135deg, ${config.color}05 0%, ${config.color}08 100%)`,
      borderRadius: 3,
      mb: 3,
      position: 'relative',
      border: `2px solid ${config.color}15`,
      boxShadow: `0 4px 20px ${config.color}10`,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header with Title and Info */}
      {showTitle && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, px: 0.5 }}>
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 900, 
                color: config.color, 
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                letterSpacing: '-0.5px',
              }}
            >
              {config.title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.3, fontSize: '0.875rem' }}>
              {config.subtitle}
            </Typography>
          </Box>
          <Chip
            label={`${products.length} items`}
            sx={{
              bgcolor: config.color,
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.8rem',
              height: 32,
              px: 1,
              borderRadius: 2,
              boxShadow: `0 4px 12px ${config.color}30`,
            }}
          />
        </Stack>
      )}

      {/* Scroll Left Button - Only for horizontal scroll */}
      {layout === 'scroll' && canScrollLeft && (
        <IconButton
          onClick={() => scroll('left')}
          sx={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            bgcolor: 'background.paper',
            boxShadow: `0 4px 16px ${config.color}30`,
            width: 44,
            height: 44,
            border: `2px solid ${config.color}`,
            '&:hover': { 
              bgcolor: config.color,
              color: '#fff',
              transform: 'translateY(-50%) scale(1.15)',
              boxShadow: `0 6px 20px ${config.color}40`,
            },
          }}
        >
          <ChevronLeft sx={{ fontSize: 28 }} />
        </IconButton>
      )}

      {/* Scroll Right Button - Only for horizontal scroll */}
      {layout === 'scroll' && canScrollRight && products.length > 4 && (
        <IconButton
          onClick={() => scroll('right')}
          sx={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            bgcolor: 'background.paper',
            boxShadow: `0 4px 16px ${config.color}30`,
            width: 44,
            height: 44,
            border: `2px solid ${config.color}`,
            '&:hover': { 
              bgcolor: config.color,
              color: '#fff',
              transform: 'translateY(-50%) scale(1.15)',
              boxShadow: `0 6px 20px ${config.color}40`,
            },
          }}
        >
          <ChevronRight sx={{ fontSize: 28 }} />
        </IconButton>
      )}

      {/* Products Container */}
      {layout === 'scroll' ? (
        // Scrollable Horizontal Layout
        <Box
          ref={scrollRef}
          onScroll={handleScroll}
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            pb: 1,
            px: { xs: 5, md: 6 },
          }}
        >
          {products.map((p) => (
            renderProductCard(p, config, theme)
          ))}
        </Box>
      ) : (
        // Grid Layout with Vertical Scroll
        <Box
          ref={scrollRef}
          onScroll={handleScroll}
          sx={{
            display: 'grid',
            gap: layout === 'grid-scroll' ? 0.8 : 1.5,
            gridTemplateColumns: {
              xs: `repeat(${Math.min(itemsPerRow, 2)}, 1fr)`,
              sm: `repeat(${itemsPerRow}, 1fr)`,
              md: `repeat(${itemsPerRow}, 1fr)`,
            },
            px: 0.8,
            pb: 0.8,
            overflowY: layout === 'grid-scroll' ? 'auto' : 'visible',
            overflowX: 'hidden',
            maxHeight: layout === 'grid-scroll' ? '420px' : undefined,
            scrollbarWidth: layout === 'grid-scroll' ? 'thin' : 'none',
            '&::-webkit-scrollbar': {
              width: layout === 'grid-scroll' ? '6px' : '0px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0,0,0,0.05)',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              background: `${config.color}40`,
              borderRadius: 4,
              '&:hover': {
                background: `${config.color}60`,
              },
            },
            flex: 1,
          }}
        >
          {products.map((p) => (
            renderProductCard(p, config, theme)
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ProductRecommendations;
