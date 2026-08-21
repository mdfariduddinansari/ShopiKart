


import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Grid,
  Typography,
  Button,
  Rating,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Divider,
  Card,
  CardContent,
  Chip,
  Stack,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Container,
  useTheme,
  Skeleton,
} from "@mui/material";
import {
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  LocalShipping,
  Security,
  Undo,
} from "@mui/icons-material";
import { fetchProducts, fetchProductById } from "../features/productsSlice";
import { addToCart, addToUserCart } from "../features/cartSlice";
import { addToWishlist, removeFromWishlist } from "../features/WishlistSlice";
import ReviewWordCloud from "../components/ReviewWordCloud";
import ProductRecommendations from "../components/ProductRecommendations";
import api from "../services/api";
import { keyframes } from '@mui/system';

/* ======================
  Animation Keyframes
  ====================== */
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

/* ======================
  Strong visual tokens
  ====================== */
const ACCENT = "#0ea5a4"; // general accent (teal)
const NEUTRAL_BG = "#f4f6f8";

const RATING_COLORS = {
  poor: "#d32f2f",       // strong red
  average: "#f57c00",    // orange
  good: "#fbc02d",       // strong yellow
  veryGood: "#2e7d32",   // green
  excellent: "#009688",  // teal
  neutral: "#8e8e93",    // gray
};

function pickColor(rating) {
  // rating may be null -> neutral
  if (rating == null) return RATING_COLORS.neutral;
  const r = Number(rating);
  if (r < 2) return RATING_COLORS.poor;
  if (r < 3) return RATING_COLORS.average;
  if (r < 4) return RATING_COLORS.good;
  if (r < 4.5) return RATING_COLORS.veryGood;
  return RATING_COLORS.excellent;
}
function pickLabel(rating) {
  if (rating == null) return "No rating";
  const r = Number(rating);
  if (r < 2) return "Poor";
  if (r < 3) return "Average";
  if (r < 4) return "Good";
  if (r < 4.5) return "Very Good";
  return "Excellent";
}

/* ======================
   Component
   ====================== */
export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();

  const { products, loading, error, selectedProduct } = useSelector((s) => s.products || {});
  const { isAuthenticated } = useSelector((s) => s.auth || {});
  const wishlist = useSelector((s) => s.wishlist?.items || []);

  const [reviews, setReviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // review dialog
  const [openReview, setOpenReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  
  // cart success message
  const [cartSuccess, setCartSuccess] = useState("");

  // Image zoom state (Amazon-style)
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);
  const ZOOM_LEVEL = 2.5; // magnification factor
  const LENS_SIZE = 180; // size of the lens square on the main image

  const handleMouseEnterImage = useCallback(() => setIsZooming(true), []);
  const handleMouseLeaveImage = useCallback(() => setIsZooming(false), []);
  const handleMouseMoveImage = useCallback((e) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }, []);
  
  // AI Review Summary
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);

  // fetch products if needed AND fetch individual product by id
  useEffect(() => {
    if (!products || (Array.isArray(products) && products.length === 0)) {
      dispatch(fetchProducts());
    }
    // Always fetch the specific product by ID to ensure it's loaded (especially on refresh/new products)
    dispatch(fetchProductById(id));
  }, [dispatch, id, products]);

  // Scroll to top when product page opens or product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // safe product lookup - use selectedProduct (from fetchProductById) as fallback
  const product = useMemo(() => {
    if (!products && !selectedProduct) return null;
    const list = Array.isArray(products) ? products : products?.products || [];
    // First try to find in products list, then fall back to selectedProduct
    return list.find((p) => p._id === id) ?? selectedProduct ?? null;
  }, [products, id, selectedProduct]);

  // set reviews and default image on product load
  useEffect(() => {
    if (product?.reviews) setReviews(product.reviews || []);
    if (product?.images?.length) setSelectedImage(product.images[0]);
  }, [product]);

  // Fetch AI summary when reviews are available
  useEffect(() => {
    if (reviews && reviews.length > 0 && id) {
      fetchAiSummary();
    }
  }, [reviews, id]);

  const fetchAiSummary = async () => {
    if (reviews.length === 0) return;
    
    setLoadingAiSummary(true);
    try {
      const response = await api.post(`/products/${id}/ai-summary`, {
        reviews: reviews.map(r => ({
          rating: r.rating,
          comment: r.comment,
          isGenuineBuyer: r.isGenuineBuyer
        }))
      });
      
      if (response.data.success) {
        setAiSummary(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching AI summary:', err);
    } finally {
      setLoadingAiSummary(false);
    }
  };

  // Track product view for recommendations
  useEffect(() => {
    if (id && isAuthenticated) {
      const trackView = async () => {
        try {
          await api.post('/recommendations/track/view', {
            productId: id,
            source: 'direct'
          });
          console.log('[Track] Product view tracked:', id);
        } catch (err) {
          console.error('[Track] Error tracking view:', err);
        }
      };
      trackView();
    }
  }, [id, isAuthenticated]);

  // compute avg rating from verified buyers only
  const avgRating = useMemo(() => {
    if (reviews && reviews.length > 0) {
      // Filter only verified buyer reviews
      const verifiedReviews = reviews.filter(r => r.isGenuineBuyer);
      
      if (verifiedReviews.length > 0) {
        const sum = verifiedReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0);
        const avg = Number((sum / verifiedReviews.length).toFixed(1));
        return avg === 0 ? null : Math.max(1, avg);
      }
    }
    if (product && Number(product.rating) >= 1) return Number(product.rating);
    return null;
  }, [reviews, product]);

  // compute weighted rating: 60% verified buyer + 40% all customers
  const weightedRating = useMemo(() => {
    if (reviews && reviews.length > 0) {
      const verifiedReviews = reviews.filter(r => r.isGenuineBuyer);
      const allReviews = reviews;
      
      let verifiedAvg = 0;
      let allAvg = 0;
      
      if (verifiedReviews.length > 0) {
        const verifiedSum = verifiedReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0);
        verifiedAvg = verifiedSum / verifiedReviews.length;
      }
      
      if (allReviews.length > 0) {
        const allSum = allReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0);
        allAvg = allSum / allReviews.length;
      }
      
      // If there's a large disagreement (difference >= 2 stars) between
      // verified-buyer average and all-customer average, prefer verified
      // opinions strongly: 90% verified + 10% all customers.
      // Otherwise use the default 60% verified + 40% all customers.
      const diff = Math.abs(verifiedAvg - allAvg);
      const weighted = (verifiedReviews.length > 0 && allReviews.length > 0 && diff >= 2)
        ? (verifiedAvg * 0.8) + (allAvg * 0.2)
        : (verifiedAvg * 0.6) + (allAvg * 0.4);
      const rounded = Number(weighted.toFixed(1));
      return rounded === 0 ? null : Math.max(1, rounded);
    }
    if (product && Number(product.rating) >= 1) return Number(product.rating);
    return null;
  }, [reviews, product]);

  // Count verified buyer reviews - moved before early returns
  const verifiedBuyerCount = useMemo(() => {
    return reviews ? reviews.filter((r) => r.isGenuineBuyer).length : 0;
  }, [reviews]);

  // related by category
  const related = useMemo(() => {
    if (!product || !products) return [];
    const list = Array.isArray(products) ? products : products.products || [];
    return list.filter((p) => p._id !== product._id && p.category === product.category).slice(0, 8);
  }, [product, products]);

  const isWishlisted = Boolean(wishlist.find((w) => w._id === id));

  // handlers
  const handleAddToCart = () => {
    if (!product) return;
    
    // Check if variants exist and one is required to be selected
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      alert("Please select a variant");
      return;
    }

    // Check if selected variant is out of stock
    if (selectedVariant && selectedVariant.stock <= 0) {
      alert("This variant is out of stock");
      return;
    }

    // Use discounted price if available and lower than base price (variants take precedence)
    const effectivePrice = selectedVariant
      ? Number(selectedVariant.price)
      : (product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price
        ? Number(product.discountPrice)
        : Number(product.price));

    const cartItem = {
      _id: product._id,
      productId: product._id,
      name: product.name,
      price: Number(product.price), // Store original price
      discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined, // Store discount price if available
      discount: product.discount ? Number(product.discount) : undefined, // Store discount percentage if available
      images: product.images || [],
      quantity: Number(quantity),
    };

    // Add variant information if selected
    if (selectedVariant) {
      cartItem.variant = {
        type: selectedVariant.type,
        value: selectedVariant.value,
        variantId: selectedVariant._id,
        price: Number(selectedVariant.price),
        image: selectedVariant.image || null,
      };
      console.log('=== ADDING VARIANT TO CART ===');
      console.log('Variant:', cartItem.variant);
    }

    console.log('=== PRODUCT PAGE ADD TO CART ===');
    console.log('Cart item:', cartItem);
    console.log('Is authenticated:', isAuthenticated);

    if (isAuthenticated) {
      dispatch(addToUserCart(cartItem));
    } else {
      dispatch(addToCart(cartItem));
    }
    
    // Show success message
    setCartSuccess(`Added ${quantity} ${quantity === 1 ? 'item' : 'items'} to cart!`);
    setTimeout(() => setCartSuccess(""), 3000);
  };

  // Check if user has already reviewed this product
  const [userReview, setUserReview] = useState(null);

  useEffect(() => {
    if (isAuthenticated && id) {
      checkUserReview();
    }
  }, [id, isAuthenticated]);

  const checkUserReview = async () => {
    try {
      const res = await api.get(`/products/${id}/reviews/check`);
      if (res.data.hasReviewed) {
        setUserReview(res.data.review);
        setReviewRating(res.data.review.rating);
        setReviewComment(res.data.review.comment);
      }
    } catch (err) {
      console.error('Error checking review:', err);
    }
  };

  const handleSubmitReview = async () => {
    // Validate input
    if (!reviewComment || !reviewComment.trim()) {
      setSubmitError("Please write a comment.");
      return;
    }
    
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setSubmitError("Please select a rating between 1 and 5.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");
    
    try {
      console.log('Submitting review:', { rating: reviewRating, comment: reviewComment });
      const res = await api.post(`/products/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      console.log('Review response:', res.data);
      
      if (res.data && res.data.reviews) {
        setReviews(res.data.reviews);
        setUserReview(res.data.reviews.find(r => r.user === userReview?.user || true));
      }
      
      setSubmitSuccess(userReview ? "Review updated successfully!" : "Review submitted successfully!");
      setOpenReview(false);
      
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (err) {
      console.error('Review submission error:', err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to submit review.";
      setSubmitError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;

    setSubmitting(true);
    try {
      const res = await api.delete(`/products/${id}/reviews`);
      if (res.data) {
        setReviews(product.reviews.filter(r => r.user !== userReview.user));
        setUserReview(null);
        setReviewRating(5);
        setReviewComment("");
        setSubmitSuccess("Review deleted successfully!");
        setTimeout(() => setSubmitSuccess(""), 3000);
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      setSubmitError("Failed to delete review.");
    } finally {
      setSubmitting(false);
    }
  };

  // loading / error / not found
  if (loading) return (
    <Box sx={{ background: theme.palette.mode === 'dark' ? '#1a1a1a' : NEUTRAL_BG, py: 4, minHeight: '100vh' }}>
      <Container maxWidth={false} sx={{ width: { xs: '100%', sm: '94%', md: '88%', lg: '80%' }, mx: 'auto', px: { xs: 2, md: 4 } }}>
        {/* Skeleton for top colored band and title */}
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="rectangular" height={10} sx={{ borderRadius: 2, mb: 2 }} animation="wave" />
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mt: 2 }}>
            <Box sx={{ flex: 1, pr: 2 }}>
              <Skeleton variant="text" width="70%" height={40} animation="wave" />
              <Box sx={{ mt: 1 }}>
                <Skeleton variant="text" width={150} height={20} animation="wave" />
                <Skeleton variant="rectangular" width={200} height={30} sx={{ mt: 1, borderRadius: 1 }} animation="wave" />
                <Skeleton variant="text" width={180} height={16} sx={{ mt: 0.5 }} animation="wave" />
              </Box>
            </Box>
            <Stack direction="row" spacing={1}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rectangular" width={80} height={20} sx={{ borderRadius: 1 }} animation="wave" />
              ))}
            </Stack>
          </Box>
        </Box>

        {/* Main layout skeleton */}
        <Grid container spacing={4} alignItems="flex-start">
          {/* Left: image + description skeleton */}
          <Grid item xs={12} md={8}>
            <Paper elevation={6} sx={{ p: 2, borderRadius: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Skeleton 
                    variant="rectangular" 
                    height={520} 
                    sx={{ borderRadius: 2 }} 
                    animation="wave" 
                  />
                  <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton 
                        key={i} 
                        variant="rectangular" 
                        width={96} 
                        height={72} 
                        sx={{ borderRadius: 1 }} 
                        animation="wave" 
                      />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Skeleton variant="text" width="40%" height={24} animation="wave" />
                  <Skeleton variant="text" width="60%" height={48} sx={{ mt: 1 }} animation="wave" />
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="text" width="100%" height={20} animation="wave" />
                    <Skeleton variant="text" width="100%" height={20} animation="wave" />
                    <Skeleton variant="text" width="80%" height={20} animation="wave" />
                  </Box>
                  <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Skeleton variant="rectangular" width={150} height={42} sx={{ borderRadius: 2 }} animation="wave" />
                    <Skeleton variant="rectangular" width={56} height={42} sx={{ borderRadius: 2 }} animation="wave" />
                  </Box>
                  <Box sx={{ mt: 3 }}>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} variant="text" width="90%" height={40} sx={{ mt: 1 }} animation="wave" />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Reviews skeleton */}
            <Box sx={{ mt: 3, pt: 3 }}>
              <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} animation="wave" />
              {[1, 2, 3].map((i) => (
                <Paper key={i} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                  <Stack direction="row" spacing={2}>
                    <Skeleton variant="circular" width={40} height={40} animation="wave" />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="30%" height={24} animation="wave" />
                      <Skeleton variant="rectangular" width={120} height={20} sx={{ mt: 1, borderRadius: 1 }} animation="wave" />
                      <Skeleton variant="text" width="100%" height={20} sx={{ mt: 1 }} animation="wave" />
                      <Skeleton variant="text" width="90%" height={20} animation="wave" />
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </Grid>

          {/* Right sidebar skeleton */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Skeleton variant="text" width="40%" height={24} animation="wave" />
              <Skeleton variant="text" width="60%" height={48} sx={{ mt: 1 }} animation="wave" />
              <Skeleton variant="rectangular" width={100} height={32} sx={{ mt: 1, borderRadius: 1 }} animation="wave" />
              <Skeleton variant="text" width="100%" height={1} sx={{ my: 2 }} animation="wave" />
              <Skeleton variant="text" width="40%" height={24} animation="wave" />
              <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2 }}>
                <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: 1 }} animation="wave" />
                <Skeleton variant="rectangular" width={60} height={40} sx={{ borderRadius: 1 }} animation="wave" />
                <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: 1 }} animation="wave" />
              </Box>
              <Skeleton variant="rectangular" width="100%" height={42} sx={{ borderRadius: 2, mb: 1 }} animation="wave" />
              <Skeleton variant="rectangular" width="100%" height={42} sx={{ borderRadius: 2 }} animation="wave" />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
  if (error) return (
    <Container sx={{ py: 6 }}>
      <Alert severity="error">{error}</Alert>
    </Container>
  );
  if (!product) return (
    <Container sx={{ py: 6 }}>
      <Alert severity="info">Product not found.</Alert>
    </Container>
  );

  // visual tokens derived
  const ratingColor = pickColor(avgRating);
  const ratingLabel = pickLabel(avgRating);
  const showRating = avgRating != null;
  
  // fallback for related items: use their own rating if >=1 else neutral
  const relatedColor = (r) => pickColor(r && r >= 1 ? r : null);

  // strong gradient & glow for main card
  const mainGradient = showRating
    ? `linear-gradient(180deg, ${ratingColor}11, ${ratingColor}08, #fff 45%)`
    : `linear-gradient(180deg, #ffffff, #ffffff)`;
  const glow = showRating && avgRating >= 4.5 ? `${ratingColor}55` : "transparent";

  // Pricing display: support optional product-level discountPrice (sale price)
  const hasDiscount = !selectedVariant && product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price && (!product.discountExpires || new Date(product.discountExpires) > new Date());
  const displayPrice = selectedVariant ? Number(selectedVariant.price) : (hasDiscount ? Number(product.discountPrice) : Number(product.price));
  const originalPrice = (!selectedVariant && hasDiscount) ? Number(product.price) : null;
  const discountPercent = originalPrice ? Math.round((1 - (displayPrice / originalPrice)) * 100) : null;

  // Add-to-cart style uses more saturated color (solid)
  const addToCartSx = {
    background: showRating ? ratingColor : '#87CEEB',
    color: "#fff",
    fontWeight: 800,
    px: 3,
    py: 1.05,
    borderRadius: 2,
    boxShadow: showRating ? `0 10px 24px ${ratingColor}33` : '0 10px 24px rgba(135, 206, 235, 0.2)',
    "&:hover": { filter: "brightness(0.95)" },
  };

  // full-bleed wrapper
  const bgColor = theme.palette.mode === 'dark' ? '#1a1a1a' : NEUTRAL_BG;
  return (
    <Box sx={{ background: bgColor, py: { xs: 2, sm: 4 }, minHeight: '100vh' }}>
      <Container maxWidth={false} sx={{ width: { xs: '100%', sm: '94%', md: '88%', lg: '80%' }, mx: 'auto', px: { xs: 1.25, sm: 2, md: 4 } }}>
        {/* Top colored band (strong) */}
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              height: { xs: 7, sm: 10 },
              width: "100%",
              borderRadius: 2,
              background: showRating ? `linear-gradient(90deg, ${ratingColor}, ${ratingColor}cc)` : `${RATING_COLORS.neutral}`,
              boxShadow: showRating ? `0 8px 24px ${ratingColor}33` : "none",
            }}
          />
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "flex-end" }, mt: { xs: 1.25, sm: 2 }, flexDirection: { xs: "column", sm: "row" }, gap: { xs: 1, sm: 0 } }}>
            <Box sx={{ flex: 1, pr: { xs: 0, sm: 2 }, animation: `${fadeInUp} 0.6s ease-out` }}>
              <Typography 
                variant="h5" 
                fontWeight={900}
                sx={{
                  fontSize: { xs: "1.05rem", sm: "1.5rem", md: "1.7rem" },
                  wordBreak: 'break-word',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: 1.3
                }}
              >
                {product.name}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: { xs: "0.62rem", sm: "0.75rem" } }}>VERIFIED BUYER RATING</Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Rating value={showRating ? Number(avgRating) : 0} precision={0.5} readOnly />
                  {showRating ? (
                    <>
                      <Typography variant="subtitle1" fontWeight={900}>{avgRating}</Typography>
                      <Chip
                        label={ratingLabel}
                        sx={{
                          bgcolor: ratingColor,
                          color: "#fff",
                          fontWeight: 900,
                          px: 1,
                          height: 28,
                          borderRadius: 1,
                        }}
                      />
                    </>
                  ) : (
                    <Chip label="No rating" sx={{ bgcolor: "#eee", color: "#666", fontWeight: 800 }} />
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.62rem", sm: "0.75rem" } }}>({verifiedBuyerCount} verified {verifiedBuyerCount === 1 ? 'review' : 'reviews'} of {reviews.length} total)</Typography>
              </Box>

              {/* Weighted Overall Rating (60% Verified + 40% All Customers) */}
              {weightedRating !== null && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: { xs: "0.62rem", sm: "0.75rem" } }}>ALL CUSTOMER RATING (60% Verified • 40% All)</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Rating value={Number(weightedRating)} precision={0.5} readOnly />
                    <Typography variant="subtitle1" fontWeight={900}>{weightedRating}</Typography>
                    <Chip
                      label={pickLabel(weightedRating)}
                      sx={{
                        bgcolor: pickColor(weightedRating),
                        color: "#fff",
                        fontWeight: 900,
                        px: 1,
                        height: 28,
                        borderRadius: 1,
                      }}
                    />
                  </Stack>
                </Box>
              )}
            </Box>
            {/* legend (smaller) */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>   
              <Stack direction="row" spacing={0.5} alignItems="center"><Box sx={{ width: 14, height: 8, bgcolor: RATING_COLORS.poor }} /><Typography variant="caption">Poor</Typography></Stack>
              <Stack direction="row" spacing={0.5} alignItems="center"><Box sx={{ width: 14, height: 8, bgcolor: RATING_COLORS.average }} /><Typography variant="caption">Average</Typography></Stack>
              <Stack direction="row" spacing={0.5} alignItems="center"><Box sx={{ width: 14, height: 8, bgcolor: RATING_COLORS.good }} /><Typography variant="caption">Good</Typography></Stack>
              <Stack direction="row" spacing={0.5} alignItems="center"><Box sx={{ width: 14, height: 8, bgcolor: RATING_COLORS.excellent }} /><Typography variant="caption">Excellent</Typography></Stack>
            </Stack>
          </Box>
        </Box>

        {/* Main layout */}
        <Grid container spacing={{ xs: 2, md: 4 }} alignItems="flex-start">
          {/* Left: image + description + reviews (bigger) */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={6}
              sx={{
                p: { xs: 1.2, sm: 2 },
                borderRadius: 3,
                background: mainGradient,
                borderLeft: `6px solid ${ratingColor}`,
                boxShadow: glow !== "transparent" ? `0 18px 44px ${glow}` : undefined,
                border: `1px solid ${showRating ? `${ratingColor}22` : "#eee"}`,
                animation: `${fadeInUp} 0.7s ease-out`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: glow !== "transparent" ? `0 24px 56px ${glow}` : '0 10px 24px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                <Grid item xs={12} md={6}>
                  {/* Amazon-style: vertical thumbnails + main image + zoom preview */}
                  <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, animation: `${fadeInUp} 0.7s ease-out` }}>
                    {/* Vertical thumbnail strip (left side) */}
                    {product.images && product.images.length > 0 && (
                      <Box sx={{
                        display: { xs: 'none', sm: 'flex' },
                        flexDirection: 'column',
                        gap: 1,
                        overflowY: 'auto',
                        maxHeight: { md: 520 },
                        pr: 0.5,
                        '&::-webkit-scrollbar': { width: 3 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: `${ratingColor}44`, borderRadius: 2 },
                      }}>
                        {selectedVariant?.image && (
                          <Box
                            onClick={() => setSelectedImage(selectedVariant.image)}
                            onMouseEnter={() => setSelectedImage(selectedVariant.image)}
                            sx={{
                              width: 64, height: 64, flex: '0 0 auto', cursor: 'pointer', overflow: 'hidden',
                              borderRadius: 1,
                              border: (selectedImage || product.images?.[0]) === selectedVariant.image ? `3px solid ${ratingColor}` : '2px solid #e0e0e0',
                              transition: 'all 0.2s', position: 'relative',
                              '&:hover': { borderColor: ratingColor, transform: 'scale(1.08)', boxShadow: `0 2px 8px ${ratingColor}33` },
                            }}
                          >
                            <Box component="img" src={selectedVariant.image} alt="variant" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <Box sx={{
                              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '8px', fontWeight: 'bold'
                            }}>VARIANT</Box>
                          </Box>
                        )}
                        {product.images.map((img, idx) => (
                          <Box
                            key={idx}
                            onClick={() => setSelectedImage(img)}
                            onMouseEnter={() => setSelectedImage(img)}
                            sx={{
                              width: 64, height: 64, flex: '0 0 auto', cursor: 'pointer', overflow: 'hidden',
                              borderRadius: 1,
                              border: (selectedImage || product.images?.[0]) === img ? `3px solid ${ratingColor}` : '2px solid #e0e0e0',
                              transition: 'all 0.2s',
                              '&:hover': { borderColor: ratingColor, transform: 'scale(1.08)', boxShadow: `0 2px 8px ${ratingColor}33` },
                            }}
                          >
                            <Box component="img" src={img} alt={`thumb-${idx}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* Main image with zoom lens */}
                    <Box sx={{ flex: 1, position: 'relative' }}>
                      <Box
                        ref={imageContainerRef}
                        onMouseEnter={handleMouseEnterImage}
                        onMouseLeave={handleMouseLeaveImage}
                        onMouseMove={handleMouseMoveImage}
                        sx={{
                          position: 'relative',
                          height: { xs: 290, sm: 360, md: 520 },
                          overflow: 'hidden',
                          borderRadius: 2,
                          cursor: isZooming ? 'crosshair' : 'pointer',
                          background: '#fff',
                          boxShadow: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Box
                          component="img"
                          src={selectedVariant?.image || selectedImage || product.images?.[0] || 'https://via.placeholder.com/900x700'}
                          alt={product.name}
                          draggable={false}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            p: 1,
                            userSelect: 'none',
                          }}
                        />

                        {/* Lens overlay on main image */}
                        {isZooming && (
                          <Box
                            sx={{
                              position: 'absolute',
                              width: LENS_SIZE,
                              height: LENS_SIZE,
                              border: `2px solid ${ratingColor}`,
                              background: `${ratingColor}15`,
                              pointerEvents: 'none',
                              transform: 'translate(-50%, -50%)',
                              top: `${zoomPosition.y}%`,
                              left: `${zoomPosition.x}%`,
                              zIndex: 2,
                              boxShadow: `0 0 0 9999px rgba(0,0,0,0.12)`,
                            }}
                          />
                        )}
                      </Box>

                      {/* Zoom preview panel (appears on hover) */}
                      {isZooming && (
                        <Paper
                          elevation={8}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: '105%',
                            width: { md: 480, lg: 540 },
                            height: { md: 520 },
                            zIndex: 10,
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: `2px solid ${ratingColor}33`,
                            display: { xs: 'none', lg: 'block' },
                            backgroundImage: `url(${selectedVariant?.image || selectedImage || product.images?.[0] || 'https://via.placeholder.com/900x700'})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: `${ZOOM_LEVEL * 100}%`,
                            backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                            boxShadow: `0 20px 60px rgba(0,0,0,0.25)`,
                            animation: `${fadeIn} 0.15s ease-out`,
                          }}
                        />
                      )}

                      {/* Mobile: horizontal thumbnail strip (below image) */}
                      {product.images && product.images.length > 0 && (
                        <Box sx={{
                          display: { xs: 'flex', sm: 'none' },
                          gap: 1, mt: 2, overflowX: 'auto', px: 1,
                        }}>
                          {product.images.map((img, idx) => (
                            <Box
                              key={idx}
                              onClick={() => setSelectedImage(img)}
                              sx={{
                                width: 64, height: 52, flex: '0 0 auto', cursor: 'pointer', overflow: 'hidden',
                                borderRadius: 1,
                                border: (selectedImage || product.images?.[0]) === img ? `3px solid ${ratingColor}` : '1px solid #eee',
                              }}
                            >
                              <Box component="img" src={img} alt={`thumb-${idx}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>{product.brand || "Brand"}</Typography>

                  {/* <--- REPLACED LEFT PRICE BLOCK ---> */}
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
                    <Typography variant="h4" fontWeight={900} sx={{ color: ratingColor, fontSize: { xs: "1.65rem", sm: "2.125rem" } }}>
                      ₹{displayPrice?.toFixed(0)}
                    </Typography>

                    {originalPrice && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textDecoration: 'line-through', ml: 1 }}
                      >
                        ₹{originalPrice.toFixed(0)}
                      </Typography>
                    )}

                    {discountPercent && (
                      <Chip
                        label={`-${discountPercent}%`}
                        size="small"
                        sx={{ ml: 1 }}
                        color="secondary"
                      />
                    )}

                    {selectedVariant && (
                      <Typography
                        variant="body2"
                        color="success.main"
                        fontWeight={700}
                        sx={{ ml: 1 }}
                      >
                        (Variant Price)
                      </Typography>
                    )}
                  </Box>

                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 3, 
                      lineHeight: 1.6,
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      animation: `${fadeInUp} 0.8s ease-out 0.2s backwards`,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-word'
                    }}
                  >
                    {product.description}
                  </Typography>
                  {product.canBeRented && (
                    <Paper sx={{ p: 2, mb: 3, backgroundColor: `${ratingColor}15`, border: `2px solid ${ratingColor}`, borderRadius: 2 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ fontSize: 24 }}>🔄</Box>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Available for Rent</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Don't want to buy? You can rent this product for a limited time!
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  )}

                  {/* Variant Selection - REQUIRED if variants exist */}
                  {product.variants && product.variants.length > 0 && (
                    <Box sx={{ mb: 3, p: 2, backgroundColor: selectedVariant ? `${ratingColor}15` : "#fff3cd", borderRadius: 2, border: `2px solid ${selectedVariant ? ratingColor : "#ffd54f"}`, transition: 'all 0.3s ease' }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: selectedVariant ? ratingColor : "#f57f17", display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: "0.84rem", sm: "0.95rem" } }}>
                        {selectedVariant ? (
                          <>
                            <span>✓</span> Variant Selected
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: '18px' }}>⚠</span> Please Select an Option
                          </>
                        )}
                      </Typography>
                      {/* Group variants by type */}
                      {Array.from(new Set(product.variants.map(v => v.type))).map((type) => (
                        <Box key={type} sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight={600} sx={{ mb: 1.2, textTransform: 'capitalize', color: '#333', fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                            {type}:
                          </Typography>
                          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
                            {product.variants
                              .filter(v => v.type === type)
                              .map((variant) => (
                                    <Box
                                  key={variant._id}
                                  onClick={() => variant.stock > 0 && setSelectedVariant(variant)}
                                  sx={{
                                    py: { xs: 1.1, sm: 1.5 },
                                    px: { xs: 1.3, sm: 2 },
                                    border: '2px solid',
                                    borderColor: selectedVariant?._id === variant._id ? ratingColor : (variant.stock <= 0 ? '#ccc' : '#ddd'),
                                    borderRadius: 1,
                                    cursor: variant.stock <= 0 ? 'not-allowed' : 'pointer',
                                    backgroundColor: selectedVariant?._id === variant._id ? `${ratingColor}20` : (variant.stock <= 0 ? '#f5f5f5' : '#fff'),
                                    opacity: variant.stock <= 0 ? 0.5 : 1,
                                    transition: 'all 0.2s',
                                    '&:hover': variant.stock <= 0 ? {} : { borderColor: ratingColor, boxShadow: 2, transform: 'translateY(-2px)' },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    minWidth: { xs: '92px', sm: '110px' },
                                    position: 'relative'
                                  }}
                                >
                                  {variant.image && (
                                    <Box
                                      component="img"
                                      src={variant.image}
                                      alt={variant.value}
                                      sx={{
                                        width: { xs: '56px', sm: '70px' },
                                        height: { xs: '56px', sm: '70px' },
                                        objectFit: 'cover',
                                        borderRadius: '6px',
                                        border: selectedVariant?._id === variant._id ? `2px solid ${ratingColor}` : '1px solid #eee',
                                      }}
                                    />
                                  )}
                                  <Typography variant="body2" fontWeight={600} sx={{ color: '#222', fontSize: { xs: "0.76rem", sm: "0.875rem" } }}>{variant.value}</Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>₹{variant.price}</Typography>
                                  {variant.stock <= 0 && (
                                    <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 600 }}>Out of Stock</Typography>
                                  )}
                                </Box>
                              ))}
                          </Stack>
                        </Box>
                      ))}
                      {selectedVariant && selectedVariant.stock <= 0 && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          This variant is currently out of stock.
                        </Alert>
                      )}
                    </Box>
                  )}

                  <Stack direction="row" spacing={{ xs: 1, sm: 2 }} sx={{ mb: 2 }}>
                    <Button 
                      startIcon={<CartIcon />} 
                      sx={{
                        ...addToCartSx,
                        px: { xs: 2, sm: 3 },
                        py: { xs: 0.85, sm: 1.05 },
                        fontSize: { xs: "0.8rem", sm: "0.92rem" },
                        minWidth: 0,
                        flex: 1,
                      }} 
                      onClick={handleAddToCart}
                      disabled={product.stock === 0 || (selectedVariant && selectedVariant.stock <= 0)}
                    >
                      Add to cart
                    </Button>
                    <IconButton
                      onClick={() => {
                        if (isAuthenticated) {
                          if (isWishlisted) {
                            dispatch(removeFromWishlist(product._id));
                          } else {
                            dispatch(addToWishlist(product._id));
                          }
                        } else {
                          // Optionally show login prompt or fallback to local
                        }
                      }}
                      color={isWishlisted ? "error" : "default"}
                      sx={{
                        border: "2px solid",
                        borderColor: isWishlisted ? "error.main" : "#ddd",
                        borderRadius: 2,
                        p: { xs: 1.1, sm: 1.5 },
                        transition: "all 0.2s",
                        "&:hover": { borderColor: "error.main", backgroundColor: "error.lighter" },
                      }}
                    >
                      {isWishlisted ? <FavoriteIcon sx={{ fontSize: { xs: 24, sm: 32 }, color: '#e91e63' }} /> : <FavoriteBorderIcon sx={{ fontSize: { xs: 24, sm: 32 }, color: '#e91e63' }} />}
                    </IconButton>
                  </Stack>

                  <Stack spacing={2} divider={<Divider orientation="horizontal" flexItem />}>
                    <Box sx={{ animation: `${fadeInUp} 0.6s ease-out 0.3s backwards` }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ transition: 'all 0.3s ease', '&:hover': { transform: 'translateX(4px)' } }}>
                        <LocalShipping sx={{ color: ratingColor, fontWeight: 700 }} />
                        <Box>
                          <Typography variant="body2" fontWeight={800} sx={{ color: ratingColor }}>Free Pan-India Shipping</Typography>
                          <Typography variant="caption" color="text.secondary">Delivered across all Indian pincodes</Typography>
                        </Box>
                      </Stack>
                    </Box>
                    <Box sx={{ animation: `${fadeInUp} 0.6s ease-out 0.35s backwards` }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ transition: 'all 0.3s ease', '&:hover': { transform: 'translateX(4px)' } }}>
                        <Security sx={{ color: ratingColor, fontWeight: 700 }} />
                        <Box>
                          <Typography variant="body2" fontWeight={800} sx={{ color: ratingColor }}>Secure Indian Payments</Typography>
                          <Typography variant="caption" color="text.secondary">UPI, Cards, Net Banking & COD available</Typography>
                        </Box>
                      </Stack>
                    </Box>
                    <Box sx={{ animation: `${fadeInUp} 0.6s ease-out 0.4s backwards` }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ transition: 'all 0.3s ease', '&:hover': { transform: 'translateX(4px)' } }}>
                        <Undo sx={{ color: ratingColor, fontWeight: 700 }} />
                        <Box>
                          <Typography variant="body2" fontWeight={800} sx={{ color: ratingColor }}>Easy 30-Day Returns</Typography>
                          <Typography variant="caption" color="text.secondary">Hassle-free returns &amp; refunds across India</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Stack>

                  {/* Made in India Trust Strip */}
                  <Box sx={{ 
                    mt: 2, 
                    p: { xs: 1.1, sm: 1.5 }, 
                    borderRadius: 2, 
                    background: 'linear-gradient(90deg, rgba(255,153,51,0.08) 0%, rgba(255,255,255,0.05) 50%, rgba(19,136,8,0.08) 100%)',
                    border: '1px solid',
                    borderImage: 'linear-gradient(90deg, #FF9933, rgba(0,0,128,0.2), #138808) 1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: { xs: '0.68rem', sm: '0.8rem' }, background: 'linear-gradient(90deg, #FF9933, #000080, #138808)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      🇮🇳 Trusted by millions of Indian shoppers
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* ====================== Amazon-style Product Information ====================== */}
            {(product.specifications?.length > 0 || product.productHighlights?.length > 0 || product.additionalInfo?.length > 0) && (
              <Paper
                elevation={3}
                sx={{
                  mt: 3,
                  borderRadius: 3,
                  overflow: 'hidden',
                  animation: `${fadeInUp} 0.8s ease-out 0.2s backwards`,
                  border: `1px solid ${showRating ? `${ratingColor}22` : '#eee'}`,
                }}
              >
                {/* Section header */}
                <Box sx={{
                  px: 3, py: 2,
                  background: `linear-gradient(90deg, ${ratingColor}12, transparent)`,
                  borderBottom: `2px solid ${ratingColor}22`,
                }}>
                  <Typography variant="h6" fontWeight={900} sx={{ color: ratingColor }}>
                    Product Information
                  </Typography>
                </Box>

                  <Box sx={{ p: { xs: 1.2, md: 3 } }}>
                  {/* About this item – bullet highlights */}
                  {product.productHighlights?.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5, color: '#111', fontSize: { xs: "0.95rem", sm: "1rem" } }}>
                        About this item
                      </Typography>
                      <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
                        {product.productHighlights.map((h, i) => (
                          <Box
                            component="li"
                            key={i}
                            sx={{
                              mb: 1.25,
                              color: 'text.secondary',
                              fontSize: { xs: '0.82rem', sm: '0.938rem' },
                              lineHeight: 1.7,
                              '&::marker': { color: ratingColor, fontWeight: 700 },
                            }}
                          >
                            {h}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Technical Details + Additional Information side-by-side */}
                  <Grid container spacing={{ xs: 2, md: 4 }}>
                    {/* Technical Details table */}
                    {product.specifications?.length > 0 && (
                      <Grid item xs={12} md={product.additionalInfo?.length > 0 ? 7 : 12}>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5, color: '#111', fontSize: { xs: "0.95rem", sm: "1rem" } }}>
                          Technical Details
                        </Typography>
                        <Box
                          component="table"
                          sx={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            '& tr:nth-of-type(odd)': { bgcolor: `${ratingColor}06` },
                            '& tr:hover': { bgcolor: `${ratingColor}0c` },
                            '& td': {
                              py: 1.25,
                              px: 2,
                              fontSize: { xs: '0.78rem', sm: '0.875rem' },
                              borderBottom: '1px solid #eee',
                            },
                          }}
                        >
                          <tbody>
                            {product.specifications.map((spec, i) => (
                              <tr key={i}>
                                <Box
                                  component="td"
                                  sx={{
                                    fontWeight: 700,
                                    color: 'text.secondary',
                                    width: '40%',
                                    verticalAlign: 'top',
                                  }}
                                >
                                  {spec.key}
                                </Box>
                                <Box component="td" sx={{ color: 'text.primary' }}>
                                  {spec.value}
                                </Box>
                              </tr>
                            ))}
                          </tbody>
                        </Box>
                      </Grid>
                    )}

                    {/* Additional Information table */}
                    {product.additionalInfo?.length > 0 && (
                      <Grid item xs={12} md={product.specifications?.length > 0 ? 5 : 12}>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5, color: '#111', fontSize: { xs: "0.95rem", sm: "1rem" } }}>
                          Additional Information
                        </Typography>
                        <Box
                          component="table"
                          sx={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            '& tr:nth-of-type(odd)': { bgcolor: `${ratingColor}06` },
                            '& tr:hover': { bgcolor: `${ratingColor}0c` },
                            '& td': {
                              py: 1.25,
                              px: 2,
                              fontSize: { xs: '0.78rem', sm: '0.875rem' },
                              borderBottom: '1px solid #eee',
                            },
                          }}
                        >
                          <tbody>
                            {product.additionalInfo.map((info, i) => (
                              <tr key={i}>
                                <Box
                                  component="td"
                                  sx={{
                                    fontWeight: 700,
                                    color: 'text.secondary',
                                    width: '45%',
                                    verticalAlign: 'top',
                                  }}
                                >
                                  {info.key}
                                </Box>
                                <Box component="td" sx={{ color: 'text.primary' }}>
                                  {info.value}
                                </Box>
                              </tr>
                            ))}
                          </tbody>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Paper>
            )}

            {/* Reviews */}
            <Box sx={{ 
              mt: 3, 
              pt: 3, 
              borderTop: `3px solid ${ratingColor}`,
              animation: `${fadeInUp} 0.9s ease-out 0.3s backwards`
            }}>
              <Typography 
                variant="h6" 
                fontWeight={900} 
                sx={{ 
                  mb: 2, 
                  color: ratingColor,
                  animation: `${fadeInUp} 0.8s ease-out 0.4s backwards`
                }}
              >
                Customer reviews
              </Typography>
              {submitSuccess && <Alert severity="success" sx={{ mb: 2 }}>{submitSuccess}</Alert>}

              {/* AI Review Analysis & Word Cloud Side by Side */}
              {reviews.length > 0 && (
                <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, width: '100%' }}>
                  {/* AI Review Analysis */}
                  <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                    <Box sx={{ 
                      p: 2.5, 
                      borderRadius: 3, 
                      background: `linear-gradient(145deg, ${ratingColor}0a, ${ratingColor}04, rgba(255,255,255,0.9))`, 
                      border: `2px solid ${ratingColor}33`, 
                      boxShadow: `0 8px 32px ${ratingColor}15`, 
                      height: '100%',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Decorative accent line at top */}
                      <Box sx={{ 
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3, 
                        background: `linear-gradient(90deg, ${ratingColor}, ${ratingColor}88, transparent)` 
                      }} />

                      {/* Header with confidence */}
                      <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ mb: 2.5 }}>
                        <Box sx={{ 
                          width: 42, height: 42, borderRadius: 2, 
                          background: `linear-gradient(135deg, ${ratingColor}, ${ratingColor}cc)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '20px', boxShadow: `0 4px 12px ${ratingColor}44`,
                          flexShrink: 0
                        }}>
                          🤖
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={900} sx={{ color: ratingColor, lineHeight: 1.2 }}>
                            AI Review Analysis
                          </Typography>
                          {aiSummary && (
                            <Box sx={{ mt: 1 }}>
                              {/* Confidence bar with percentage */}
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary', minWidth: 72, fontSize: '0.7rem' }}>
                                  Confidence
                                </Typography>
                                <Box sx={{ flex: 1, height: 6, bgcolor: '#e8e8e8', borderRadius: 3, overflow: 'hidden' }}>
                                  <Box sx={{ 
                                    height: '100%', 
                                    width: `${aiSummary.confidencePercent || (aiSummary.confidenceLevel === 'Very High' ? 90 : aiSummary.confidenceLevel === 'High' ? 72 : aiSummary.confidenceLevel === 'Medium' ? 55 : 30)}%`,
                                    background: aiSummary.confidenceLevel === 'Very High' ? 'linear-gradient(90deg, #1b5e20, #4caf50)' 
                                      : aiSummary.confidenceLevel === 'High' ? 'linear-gradient(90deg, #2e7d32, #66bb6a)' 
                                      : aiSummary.confidenceLevel === 'Medium' ? 'linear-gradient(90deg, #e65100, #ffb74d)' 
                                      : 'linear-gradient(90deg, #757575, #bdbdbd)',
                                    borderRadius: 3,
                                    transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                  }} />
                                </Box>
                                <Chip 
                                  label={`${aiSummary.confidencePercent || '—'}%`}
                                  size="small"
                                  sx={{ 
                                    height: 20, minWidth: 42,
                                    bgcolor: aiSummary.confidenceLevel === 'Very High' ? '#1b5e20' 
                                      : aiSummary.confidenceLevel === 'High' ? '#2e7d32' 
                                      : aiSummary.confidenceLevel === 'Medium' ? '#e65100' 
                                      : '#616161',
                                    color: '#fff', fontWeight: 800, fontSize: '0.68rem',
                                    '& .MuiChip-label': { px: 0.75 }
                                  }}
                                />
                              </Stack>
                              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.62rem', mt: 0.25, display: 'block' }}>
                                {aiSummary.confidenceLevel === 'Very High' ? 'Highly reliable — rich data with verified buyers' 
                                  : aiSummary.confidenceLevel === 'High' ? 'Reliable — good volume of quality reviews' 
                                  : aiSummary.confidenceLevel === 'Medium' ? 'Moderate — analysis may improve with more reviews' 
                                  : 'Limited data — results are approximate'}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Stack>
                      
                      {loadingAiSummary ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
                          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                            <CircularProgress size={48} sx={{ color: ratingColor }} thickness={3} />
                            <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography variant="caption" fontWeight={800} sx={{ color: ratingColor, fontSize: '0.7rem' }}>AI</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" fontWeight={700}>Analyzing customer feedback...</Typography>
                            <Typography variant="caption" color="text.secondary">Processing sentiment, themes & insights using NLP</Typography>
                          </Box>
                        </Box>
                      ) : aiSummary ? (
                        <Box>
                          {/* AI Summary Text - Enhanced */}
                          <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.7)', border: `1px solid ${ratingColor}15`, position: 'relative' }}>
                            <Box sx={{ position: 'absolute', top: 8, left: 12, fontSize: '1.2rem', opacity: 0.15 }}>💬</Box>
                            <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.primary', pl: 0.5 }}>
                              {aiSummary.aiSummary}
                            </Typography>
                          </Box>

                          {/* Statistics Grid - Enhanced */}
                          {aiSummary.statistics && (
                            <Grid container spacing={1} sx={{ mb: 2, width: '100%' }}>
                              <Grid item xs={3}>
                                <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: `${ratingColor}08`, border: `1px solid ${ratingColor}22`, borderRadius: 1.5 }}>
                                  <Typography variant="h6" fontWeight={900} color={ratingColor} sx={{ fontSize: '1.1rem' }}>
                                    {aiSummary.statistics.totalReviews}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.63rem' }}>Reviews</Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={3}>
                                <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: '#e8f5e910', border: '1px solid #4caf5033', borderRadius: 1.5 }}>
                                  <Typography variant="h6" fontWeight={900} color="success.main" sx={{ fontSize: '1.1rem' }}>
                                    {aiSummary.statistics.verifiedReviews}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.63rem' }}>Verified</Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={3}>
                                <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: '#e3f2fd10', border: '1px solid #1976d233', borderRadius: 1.5 }}>
                                  <Typography variant="h6" fontWeight={900} color="primary.main" sx={{ fontSize: '1.1rem' }}>
                                    {aiSummary.statistics.recommendationRate}%
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.63rem' }}>Recommend</Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={3}>
                                <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: `${ratingColor}08`, border: `1px solid ${ratingColor}22`, borderRadius: 1.5 }}>
                                  <Typography variant="h6" fontWeight={900} color={ratingColor} sx={{ fontSize: '1.1rem' }}>
                                    {aiSummary.statistics.averageRating}★
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.63rem' }}>Avg Rating</Typography>
                                </Paper>
                              </Grid>
                            </Grid>
                          )}

                          {/* Confidence Factors Breakdown */}
                          {aiSummary.confidenceFactors && (
                            <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid #eee' }}>
                              <Typography variant="caption" fontWeight={700} sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Analysis Confidence Factors
                              </Typography>
                              <Stack spacing={0.5}>
                                {[
                                  { key: 'reviewVolume', label: 'Review Volume', icon: '📊' },
                                  { key: 'verifiedBuyers', label: 'Verified Buyers', icon: '✅' },
                                  { key: 'commentQuality', label: 'Comment Depth', icon: '📝' },
                                  { key: 'aspectCoverage', label: 'Topic Coverage', icon: '🎯' },
                                  { key: 'ratingDiversity', label: 'Rating Diversity', icon: '📈' }
                                ].map(factor => {
                                  const data = aiSummary.confidenceFactors[factor.key];
                                  if (!data) return null;
                                  const pct = Math.round((data.score / data.max) * 100);
                                  return (
                                    <Box key={factor.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                      <Typography sx={{ fontSize: '0.72rem', minWidth: 16 }}>{factor.icon}</Typography>
                                      <Typography variant="caption" sx={{ minWidth: 90, fontSize: '0.68rem', color: 'text.secondary' }}>{factor.label}</Typography>
                                      <Box sx={{ flex: 1, height: 5, bgcolor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                                        <Box sx={{ 
                                          height: '100%', width: `${pct}%`,
                                          bgcolor: pct >= 75 ? '#4caf50' : pct >= 50 ? '#ff9800' : '#bdbdbd',
                                          borderRadius: 3, transition: 'width 0.8s ease-out'
                                        }} />
                                      </Box>
                                      <Typography variant="caption" sx={{ minWidth: 28, textAlign: 'right', fontSize: '0.65rem', fontWeight: 700, color: pct >= 75 ? '#2e7d32' : pct >= 50 ? '#e65100' : '#757575' }}>
                                        {data.score}/{data.max}
                                      </Typography>
                                    </Box>
                                  );
                                })}
                              </Stack>
                            </Box>
                          )}

                          <Grid container spacing={1.5} sx={{ mb: 2, width: '100%' }}>
                            {/* Rating Distribution */}
                            {aiSummary.ratingDistribution && (
                              <Grid item xs={12}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid #eee' }}>
                                  <Typography variant="caption" fontWeight={700} sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Rating Distribution
                                  </Typography>
                                  <Stack spacing={0.5}>
                                    {[5, 4, 3, 2, 1].map(star => {
                                      const count = aiSummary.ratingDistribution[star] || 0;
                                      const percent = Math.round((count / aiSummary.statistics.totalReviews) * 100);
                                      return (
                                        <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <Typography variant="caption" sx={{ minWidth: 22, fontSize: '0.7rem', fontWeight: 600 }}>{star}★</Typography>
                                          <Box sx={{ flex: 1, height: 7, bgcolor: '#f0f0f0', borderRadius: 3.5, overflow: 'hidden' }}>
                                            <Box sx={{ 
                                              height: '100%', 
                                              width: `${percent}%`,
                                              background: star >= 4 ? 'linear-gradient(90deg, #66bb6a, #4caf50)' : star === 3 ? 'linear-gradient(90deg, #ffca28, #ff9800)' : 'linear-gradient(90deg, #ef5350, #f44336)',
                                              borderRadius: 3.5,
                                              transition: 'width 0.8s ease-out'
                                            }} />
                                          </Box>
                                          <Typography variant="caption" sx={{ minWidth: 48, textAlign: 'right', fontSize: '0.68rem', fontWeight: 600 }}>{count} ({percent}%)</Typography>
                                        </Box>
                                      );
                                    })}
                                  </Stack>
                                </Box>
                              </Grid>
                            )}

                            {/* Aspect Analysis */}
                            {aiSummary.aspectAnalysis && aiSummary.aspectAnalysis.length > 0 && (
                              <Grid item xs={12}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid #eee' }}>
                                  <Typography variant="caption" fontWeight={700} sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Top Discussed Aspects
                                  </Typography>
                                  <Stack spacing={0.75}>
                                    {aiSummary.aspectAnalysis.slice(0, 4).map((aspect, i) => (
                                      <Box key={i} sx={{ p: 1, borderRadius: 1.5, border: `1px solid ${ratingColor}18`, bgcolor: `${ratingColor}04`, transition: 'all 0.2s', '&:hover': { bgcolor: `${ratingColor}0a` } }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                          <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <Typography variant="caption" sx={{ fontSize: '0.8rem' }}>
                                              {aspect.aspect === 'quality' ? '🏆' : aspect.aspect === 'value' ? '💰' : aspect.aspect === 'performance' ? '⚡' : aspect.aspect === 'design' ? '🎨' : aspect.aspect === 'durability' ? '🛡️' : aspect.aspect === 'shipping' ? '📦' : '🤝'}
                                            </Typography>
                                            <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'capitalize', fontSize: '0.75rem' }}>
                                              {aspect.aspect}
                                            </Typography>
                                          </Stack>
                                          <Chip 
                                            label={`${aspect.positiveRate}% positive`}
                                            size="small"
                                            sx={{ 
                                              height: 18,
                                              bgcolor: aspect.positiveRate >= 70 ? '#e8f5e9' : aspect.positiveRate >= 50 ? '#fff3e0' : '#ffebee',
                                              color: aspect.positiveRate >= 70 ? '#2e7d32' : aspect.positiveRate >= 50 ? '#e65100' : '#c62828',
                                              border: `1px solid ${aspect.positiveRate >= 70 ? '#4caf5044' : aspect.positiveRate >= 50 ? '#ff980044' : '#f4433644'}`,
                                              fontWeight: 700,
                                              fontSize: '0.62rem'
                                            }}
                                          />
                                        </Stack>
                                        <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, height: 4, borderRadius: 2, overflow: 'hidden' }}>
                                          <Box sx={{ flex: aspect.sentiment.positive || 0.01, bgcolor: '#4caf50', borderRadius: 2 }} />
                                          <Box sx={{ flex: aspect.sentiment.neutral || 0.01, bgcolor: '#ff9800', borderRadius: 2 }} />
                                          <Box sx={{ flex: aspect.sentiment.negative || 0.01, bgcolor: '#f44336', borderRadius: 2 }} />
                                        </Box>
                                        <Stack direction="row" spacing={1} sx={{ mt: 0.25 }}>
                                          <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#4caf50' }}>Positive</Typography>
                                          <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#ff9800' }}>Neutral</Typography>
                                          <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#f44336' }}>Negative</Typography>
                                        </Stack>
                                      </Box>
                                    ))}
                                  </Stack>
                                </Box>
                              </Grid>
                            )}
                          </Grid>

                          <Grid container spacing={1.5} sx={{ width: '100%' }}>
                            {/* Key Strengths */}
                            {aiSummary.keyStrengths && aiSummary.keyStrengths.length > 0 && (
                              <Grid item xs={12}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#e8f5e9', border: '1px solid #4caf5044' }}>
                                  <Typography variant="caption" fontWeight={700} sx={{ color: '#2e7d32', mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    ✓ Key Strengths
                                  </Typography>
                                  <Stack spacing={0.5}>
                                    {aiSummary.keyStrengths.slice(0, 4).map((strength, i) => (
                                      <Box key={i} sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                                        <Box sx={{ 
                                          minWidth: 20, height: 20, borderRadius: '50%', 
                                          bgcolor: '#4caf50', color: '#fff', 
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          fontSize: '0.65rem', fontWeight: 700, flexShrink: 0
                                        }}>
                                          {i + 1}
                                        </Box>
                                        <Typography variant="caption" sx={{ flex: 1, lineHeight: 1.5, fontSize: '0.74rem' }}>
                                          "{strength}"
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Stack>
                                </Box>
                              </Grid>
                            )}
                            
                            {/* Key Weaknesses */}
                            {aiSummary.keyWeaknesses && aiSummary.keyWeaknesses.length > 0 && (
                              <Grid item xs={12}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fff3e0', border: '1px solid #ff980044' }}>
                                  <Typography variant="caption" fontWeight={700} sx={{ color: '#e65100', mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    ⚠ Areas to Consider
                                  </Typography>
                                  <Stack spacing={0.5}>
                                    {aiSummary.keyWeaknesses.slice(0, 4).map((weakness, i) => (
                                      <Box key={i} sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                                        <Box sx={{ 
                                          minWidth: 20, height: 20, borderRadius: '50%', 
                                          bgcolor: '#ff9800', color: '#fff', 
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          fontSize: '0.65rem', fontWeight: 700, flexShrink: 0
                                        }}>
                                          {i + 1}
                                        </Box>
                                        <Typography variant="caption" sx={{ flex: 1, lineHeight: 1.5, fontSize: '0.74rem' }}>
                                          "{weakness}"
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Stack>
                                </Box>
                              </Grid>
                            )}
                          </Grid>
                          
                          {/* Powered by NLP footer */}
                          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
                              Powered by NLP Sentiment Analysis
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
                              Based on {aiSummary.statistics?.totalReviews || reviews.length} reviews
                            </Typography>
                          </Box>

                        </Box>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                          <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            Unable to generate AI analysis at this time.
                          </Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                            Try refreshing the page
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Word Cloud */}
                  <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                    <Box sx={{ p: 2, borderRadius: 2, border: `3px solid ${ratingColor}`, backgroundColor: `${ratingColor}08`, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.2, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: { xs: '0.72rem', sm: '0.85rem' } }}>
                        What customers say
                      </Typography>
                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ReviewWordCloud productId={id} color={ratingColor} />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}

              {reviews.length === 0 ? (
                <Paper sx={{ p: 4, borderRadius: 2, border: `2px solid ${ratingColor}44`, backgroundColor: `${ratingColor}08` }}>
                  <Typography color="text.secondary">No reviews yet — be the first to review.</Typography>
                  {isAuthenticated ? (
                    <Button sx={{ mt: 2, borderColor: ratingColor, color: ratingColor, '&:hover': { backgroundColor: `${ratingColor}08` } }} onClick={() => setOpenReview(true)} variant="outlined">Write a review</Button>
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                      Please <strong>log in</strong> to write a review.
                    </Typography>
                  )}
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {reviews.map((r, idx) => (
                    <Paper 
                      key={idx} 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        border: r.isGenuineBuyer ? `2px solid ${ratingColor}` : `1px solid ${ratingColor}44`, 
                        backgroundColor: r.isGenuineBuyer ? `${ratingColor}08` : 'transparent',
                        animation: `${fadeInUp} 0.6s ease-out ${0.2 + idx * 0.1}s backwards`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          boxShadow: `0 8px 24px ${ratingColor}22`,
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Stack direction="row" spacing={2}>
                        <Avatar sx={{ bgcolor: "secondary.main" }}>{(r.name?.[0] || "U").toUpperCase()}</Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 1 }}>
                            <Typography fontWeight={900}>{r.name || "User"}</Typography>
                            {r.isGenuineBuyer && (
                              <Chip 
                                label="Verified Buyer" 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  height: 24,
                                  backgroundColor: '#e8f5e9',
                                  borderColor: '#4caf50',
                                  color: '#2e7d32',
                                  fontWeight: 600,
                                  fontSize: '0.75rem'
                                }} 
                              />
                            )}
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <Rating value={Number(r.rating) || 1} size="small" precision={0.5} readOnly />
                            <Typography variant="caption" color="text.secondary">{new Date(r.createdAt || Date.now()).toLocaleDateString()}</Typography>
                            {r.updatedAt && r.updatedAt !== r.createdAt && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>(edited)</Typography>
                            )}
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{r.comment}</Typography>
                          
                          {/* Edit/Delete buttons for user's own review */}
                          {userReview && r.user === userReview.user && (
                            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={() => setOpenReview(true)}
                              >
                                Edit
                              </Button>
                              <Button 
                                size="small" 
                                variant="outlined"
                                color="error"
                                onClick={handleDeleteReview}
                              >
                                Delete
                              </Button>
                            </Stack>
                          )}
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            
              {isAuthenticated && (
                <Button 
                  variant="contained" 
                  onClick={() => setOpenReview(true)} 
                  sx={{ mt: 3, background: ratingColor, color: '#fff', fontWeight: 700, '&:hover': { filter: 'brightness(0.95)' } }}
                >
                  {userReview ? "Edit your review" : "Write a review"}
                </Button>
              )}
            </Box>
          </Grid>

          {/* Right rail (sticky) */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: { md: "sticky" }, top: 96 }}>
              {cartSuccess && <Alert severity="success" sx={{ mb: 2 }}>{cartSuccess}</Alert>}
              <Paper sx={{ 
                p: { xs: 1.5, sm: 3 }, 
                borderRadius: 2, 
                mb: 2, 
                boxShadow: glow !== "transparent" ? `0 14px 36px ${glow}` : undefined, 
                borderTop: `4px solid ${ratingColor}`,
                animation: `${slideInRight} 0.7s ease-out`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: glow !== "transparent" ? `0 20px 48px ${glow}` : '0 12px 28px rgba(0,0,0,0.1)'
                }
              }}>
                <Typography variant="subtitle2" color="text.secondary">Price</Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                  <Typography variant="h4" fontWeight={900} sx={{ color: ratingColor, fontSize: { xs: "1.55rem", sm: "2.125rem" } }}>₹{displayPrice?.toFixed(0)}</Typography>
                  {originalPrice && (
                    <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through', ml: 1 }}>₹{originalPrice.toFixed(0)}</Typography>
                  )}
                  {discountPercent && (
                    <Chip label={`-${discountPercent}%`} size="small" sx={{ ml: 1 }} color="secondary" />
                  )}
                </Box>

                <Typography variant="subtitle2" sx={{ color: ratingColor, fontWeight: 700 }}>Availability</Typography>
                <Chip label={product.stock > 0 ? "In stock" : "Out of stock"} color={product.stock > 0 ? "success" : "error"} sx={{ mb: 2 }} />

                <Chip label={product.stock > 0 ? "In stock" : "Out of stock"} color={product.stock > 0 ? "success" : "error"} sx={{ mb: 2, fontWeight: 700 }} />
                <Divider sx={{ my: 1, borderColor: `${ratingColor}22` }} />

                <Typography variant="subtitle2" sx={{ color: ratingColor, fontWeight: 700 }}>Quantity</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, mb: 2 }}>
                  <Button 
                    size="small" 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    variant="outlined"
                    sx={{ 
                      minWidth: 40, 
                      fontWeight: 700, 
                      borderColor: ratingColor, 
                      color: ratingColor,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: `0 4px 12px ${ratingColor}33`
                      },
                      '&:active': {
                        transform: 'scale(0.95)'
                      }
                    }}
                  >
                    −
                  </Button>
                  <Box sx={{ px: 3, fontWeight: 700, fontSize: '1.1rem', minWidth: 40, textAlign: 'center' }}>{quantity}</Box>
                  <Button 
                    size="small" 
                    onClick={() => setQuantity(quantity + 1)}
                    variant="outlined"
                    sx={{ 
                      minWidth: 40, 
                      fontWeight: 700, 
                      borderColor: ratingColor, 
                      color: ratingColor,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: `0 4px 12px ${ratingColor}33`
                      },
                      '&:active': {
                        transform: 'scale(0.95)'
                      }
                    }}
                  >
                    +
                  </Button>
                </Stack>

                <Button 
                  fullWidth 
                  startIcon={<CartIcon />} 
                  variant="contained" 
                  sx={{ 
                    ...addToCartSx,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover:not(:disabled)': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 12px 32px ${ratingColor}44`,
                      filter: 'brightness(0.98)'
                    },
                    '&:active:not(:disabled)': {
                      transform: 'translateY(0)'
                    }
                  }} 
                  onClick={handleAddToCart} 
                  disabled={product.stock === 0 || (selectedVariant && selectedVariant.stock <= 0)}
                >
                  Add to cart
                </Button>
                <Button 
                  fullWidth 
                  variant="contained" 
                  sx={{ 
                    mt: 1, 
                    background: ratingColor, 
                    color: '#fff', 
                    fontWeight: 700,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                      filter: 'brightness(0.95)',
                      transform: 'translateY(-2px)',
                      boxShadow: `0 12px 32px ${ratingColor}44`
                    },
                    '&:active': {
                      transform: 'translateY(0)'
                    }
                  }} 
                  onClick={() => navigate("/checkout")}
                >
                  Buy now
                </Button>

                {product.canBeRented && (
                  <>
                    <Divider sx={{ my: 2, borderColor: `${ratingColor}22` }} />
                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{ mt: 1, borderColor: ratingColor, color: ratingColor, fontWeight: 700, '&:hover': { backgroundColor: `${ratingColor}08`, borderColor: ratingColor } }}
                      onClick={() => {
                        if (product.rentalItemId) {
                          navigate(`/rental-item/${product.rentalItemId}`);
                        } else {
                          navigate(`/rental?item=${product._id}`);
                        }
                      }}
                    >
                      Rent this item
                    </Button>
                  </>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Share</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button size="small" fullWidth variant="outlined" sx={{ borderColor: ratingColor, color: ratingColor, fontWeight: 600, '&:hover': { backgroundColor: `${ratingColor}08` } }} onClick={() => navigator.clipboard?.writeText(window.location.href)}>Copy link</Button>
                  <Button size="small" fullWidth variant="outlined" sx={{ borderColor: ratingColor, color: ratingColor, fontWeight: 600, '&:hover': { backgroundColor: `${ratingColor}08` } }} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, "_blank")}>WhatsApp</Button>
                </Stack>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* AI-Powered Product Recommendations */}
      <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 3 }, mb: 2, px: { xs: 1.25, sm: 3 } }}>
        {/* Similar Products */}
        <ProductRecommendations 
          type="similar" 
          productId={id}
          limit={8} 
        />

        {/* Frequently Bought Together */}
        <ProductRecommendations 
          type="frequently-bought-together" 
          productId={id}
          limit={6} 
        />

        {/* Customers Also Viewed */}
        <ProductRecommendations 
          type="customers-also-viewed" 
          productId={id}
          limit={8} 
        />
      </Container>

      {/* Review dialog */}
      <Dialog open={openReview} onClose={() => {
        setOpenReview(false);
        if (!userReview) {
          setReviewRating(5);
          setReviewComment("");
        }
      }} maxWidth="sm" fullWidth>
        <DialogTitle>{userReview ? "Edit your review" : "Write a review"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Rating value={reviewRating} onChange={(e, v) => setReviewRating(v || 1)} size="large" />
            <TextField label="Your review" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} multiline rows={5} fullWidth />
            {submitError && <Alert severity="error">{submitError}</Alert>}
            {submitSuccess && <Alert severity="success">{submitSuccess}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenReview(false);
            if (!userReview) {
              setReviewRating(5);
              setReviewComment("");
            }
          }}>Cancel</Button>
          {userReview && (
            <Button 
              onClick={handleDeleteReview} 
              variant="outlined"
              color="error"
              disabled={submitting}
            >
              Delete Review
            </Button>
          )}
          <Button onClick={handleSubmitReview} variant="contained" disabled={submitting} sx={{ background: ACCENT, color: "#fff" }}>
            {submitting ? <CircularProgress size={18} /> : (userReview ? "Update" : "Submit")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

