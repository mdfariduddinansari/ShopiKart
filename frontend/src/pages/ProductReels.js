import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Typography,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  Fade,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { fetchProducts } from '../features/productsSlice';
import { addToUserCart, addToCart } from '../features/cartSlice';
import { addToWishlist, removeFromWishlist } from '../features/WishlistSlice';

const ProductReels = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isScrolling, setIsScrolling] = useState(false);
  const [imageIndexes, setImageIndexes] = useState({});

  const { products, loading } = useSelector((state) => state.products);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  // Filter only products marked for reels
  const reelsProducts = products.filter(product => product.showInReels);

  useEffect(() => {
    // Fetch all products and filter for reels on frontend
    dispatch(fetchProducts({ page: 1, sort: '-createdAt', limit: 100 }));
  }, [dispatch]);

  // Auto-slideshow for product images
  useEffect(() => {
    if (reelsProducts.length === 0) return;

    const currentProduct = reelsProducts[currentIndex];
    if (!currentProduct || !currentProduct.images || currentProduct.images.length <= 1) return;

    const interval = setInterval(() => {
      setImageIndexes(prev => {
        const currentImageIndex = prev[currentProduct._id] || 0;
        const nextImageIndex = (currentImageIndex + 1) % currentProduct.images.length;
        return { ...prev, [currentProduct._id]: nextImageIndex };
      });
    }, 1500); // Change image every 1.5 seconds

    return () => clearInterval(interval);
  }, [currentIndex, reelsProducts]);

  useEffect(() => {
    // Scroll to current product
    if (containerRef.current && reelsProducts.length > 0) {
      const productElements = containerRef.current.children;
      if (productElements[currentIndex]) {
        productElements[currentIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }
  }, [currentIndex, reelsProducts]);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0 && currentIndex < reelsProducts.length - 1) {
        // Swipe up - next product
        setCurrentIndex(currentIndex + 1);
      } else if (distance < 0 && currentIndex > 0) {
        // Swipe down - previous product
        setCurrentIndex(currentIndex - 1);
      }
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    
    if (isScrolling) return;
    
    setIsScrolling(true);
    setTimeout(() => setIsScrolling(false), 800);

    if (e.deltaY > 0 && currentIndex < reelsProducts.length - 1) {
      // Scroll down - next product
      setCurrentIndex(currentIndex + 1);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      // Scroll up - previous product
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const cartItem = {
        productId: product._id,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice,
        discount: product.discount,
        image: product.images?.[0],
        quantity: 1,
        stock: product.stock,
      };

      if (isAuthenticated) {
        await dispatch(addToUserCart(cartItem)).unwrap();
      } else {
        dispatch(addToCart(cartItem));
      }

      setSnackbar({
        open: true,
        message: '✓ Added to cart!',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error || 'Failed to add to cart',
        severity: 'error',
      });
    }
  };

  const handleWishlist = async (product) => {
    if (!isAuthenticated) {
      setSnackbar({
        open: true,
        message: 'Please login to add to wishlist',
        severity: 'info',
      });
      return;
    }

    try {
      const isInWishlist = wishlistItems.some((item) => item.productId === product._id);
      
      if (isInWishlist) {
        await dispatch(removeFromWishlist(product._id)).unwrap();
        setSnackbar({
          open: true,
          message: 'Removed from wishlist',
          severity: 'info',
        });
      } else {
        await dispatch(addToWishlist(product._id)).unwrap();
        setSnackbar({
          open: true,
          message: '❤️ Added to wishlist!',
          severity: 'success',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error || 'Failed to update wishlist',
        severity: 'error',
      });
    }
  };

  const handleViewDetails = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleShare = async (product) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on ShopiKart!`,
          url: `${window.location.origin}/product/${product._id}`,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/product/${product._id}`);
      setSnackbar({
        open: true,
        message: 'Link copied to clipboard!',
        severity: 'success',
      });
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item.productId === productId);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!reelsProducts || reelsProducts.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6">No products in reels yet</Typography>
        <Typography variant="body2" color="text.secondary">
          Admin needs to mark products to show in reels
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Go to Home
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        overflow: 'hidden',
        zIndex: 1300,
      }}
    >
      {/* Close Button */}
      <IconButton
        onClick={() => navigate('/')}
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          },
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Products Container */}
      <Box
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        sx={{
          height: '100vh',
          overflowY: 'hidden',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
        }}
      >
        {reelsProducts.map((product, index) => (
          <Box
            key={product._id}
            sx={{
              height: '100vh',
              width: '100vw',
              position: 'relative',
              scrollSnapAlign: 'start',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Product Image with Slideshow */}
            {product.images && product.images.length > 0 && (
              <>
                <Box
                  component="img"
                  src={product.images[imageIndexes[product._id] || 0] || '/placeholder.jpg'}
                  alt={product.name}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transition: 'opacity 0.5s ease-in-out',
                  }}
                />

                {/* Image Indicators */}
                {product.images.length > 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 90,
                      left: 0,
                      right: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 0.5,
                      zIndex: 3,
                    }}
                  >
                    {product.images.map((_, imgIdx) => (
                      <Box
                        key={imgIdx}
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: 
                            (imageIndexes[product._id] || 0) === imgIdx 
                              ? 'white' 
                              : 'rgba(255, 255, 255, 0.4)',
                          transition: 'all 0.3s',
                        }}
                      />
                    ))}
                  </Box>
                )}
              </>
            )}

            {/* Gradient Overlay */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
              }}
            />

            {/* Product Info */}
            <Fade in={currentIndex === index} timeout={500}>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 3,
                  color: 'white',
                  zIndex: 2,
                }}
              >
                <Box sx={{ marginBottom: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', marginBottom: 1 }}>
                    {product.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      ${product.discountPrice || product.price}
                    </Typography>
                    {product.discount > 0 && (
                      <>
                        <Typography
                          variant="body1"
                          sx={{ textDecoration: 'line-through', opacity: 0.7 }}
                        >
                          ${product.price}
                        </Typography>
                        <Chip
                          label={`${product.discount}% OFF`}
                          color="error"
                          size="small"
                        />
                      </>
                    )}
                  </Box>

                  <Typography variant="body2" sx={{ opacity: 0.9, marginBottom: 2 }}>
                    {product.description?.substring(0, 120)}...
                  </Typography>

                  <Chip
                    label={product.category}
                    size="small"
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                  />
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1, marginTop: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<CartIcon />}
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                    sx={{
                      flex: 1,
                      backgroundColor: '#ff4081',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: 1.5,
                      '&:hover': {
                        backgroundColor: '#f50057',
                      },
                    }}
                  >
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<InfoIcon />}
                    onClick={() => handleViewDetails(product._id)}
                    sx={{
                      color: 'white',
                      borderColor: 'white',
                      fontWeight: 'bold',
                      padding: 1.5,
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    Details
                  </Button>
                </Box>
              </Box>
            </Fade>

            {/* Side Action Buttons */}
            <Box
              sx={{
                position: 'absolute',
                right: 16,
                bottom: 150,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                zIndex: 2,
              }}
            >
              <IconButton
                onClick={() => handleWishlist(product)}
                sx={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: isInWishlist(product._id) ? '#ff4081' : 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  },
                }}
              >
                {isInWishlist(product._id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>

              <IconButton
                onClick={() => handleShare(product)}
                sx={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  },
                }}
              >
                <ShareIcon />
              </IconButton>
            </Box>

            {/* Progress Indicator */}
            <Box
              sx={{
                position: 'absolute',
                top: 80,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                gap: 0.5,
                zIndex: 2,
              }}
            >
              {reelsProducts.slice(0, 10).map((_, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: idx === currentIndex ? 24 : 8,
                    height: 3,
                    backgroundColor: idx === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.3)',
                    borderRadius: 1.5,
                    transition: 'all 0.3s',
                  }}
                />
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductReels;
