import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Rating,
  IconButton,
  Snackbar,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  useTheme,
} from "@mui/material";
import {
  ShoppingCart as CartIcon,
  Favorite as FavoriteFilled,
  FavoriteBorder as FavoriteOutline,
  LocalOffer,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";

import { fetchProducts, clearError } from "../features/productsSlice";
import { addToCart, addToUserCart } from "../features/cartSlice";
import { addToWishlist, removeFromWishlist } from "../features/WishlistSlice";
import ProductRecommendations from "../components/ProductRecommendations";

const formatPrice = (price) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/* ---------- theme tokens ---------- */
const RATING_COLORS = {
  poor: "#d32f2f",
  average: "#f57c00",
  good: "#fbc02d",
  veryGood: "#2e7d32",
  excellent: "#00796b",
  neutral: "#9e9e9e",
};

const ratingColor = (r) => {
  if (r == null || r === 0) return RATING_COLORS.neutral;
  if (r < 2) return RATING_COLORS.poor;
  if (r < 3) return RATING_COLORS.average;
  if (r < 4) return RATING_COLORS.good;
  if (r < 4.5) return RATING_COLORS.veryGood;
  return RATING_COLORS.excellent;
};

export default function HomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();

  const { products, loading, error, page, pages, total } = useSelector((s) => s.products || {});
  const [currentPage, setCurrentPage] = useState(1);
  const { isAuthenticated } = useSelector((s) => s.auth || {});
  const wishlist = useSelector((s) => s.wishlist?.items || []);

  const [searchParams] = useSearchParams();
  const searchTerm = (searchParams.get("search") || "").trim().toLowerCase();
  const selectedCategory = searchParams.get("category") || "All";
  const isFeaturedOnly = searchParams.get("featured") === "true";
  const isLikedOnly = searchParams.get("liked") === "true";

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [quickProduct, setQuickProduct] = useState(null);
  const [currentCouponIndex, setCurrentCouponIndex] = useState(0);
  
  // Track initial app load for startup screen
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Store featured and most liked products separately (independent of pagination)
  const [allFeaturedProducts, setAllFeaturedProducts] = useState([]);
  const [allLikedProducts, setAllLikedProducts] = useState([]);
  
  // Store active coupons
  const [activeCoupons, setActiveCoupons] = useState([]);

  // Hide startup screen after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Fetch active coupons on mount
  useEffect(() => {
    const fetchActiveCoupons = async () => {
      try {
        console.log('Fetching available coupons...');
        const response = await fetch('http://localhost:5000/api/coupons/available');
        const data = await response.json();
        
        console.log('Coupons response:', data);
        
        const coupons = data.data || data.coupons || (Array.isArray(data) ? data : []);
        console.log('Coupons extracted:', coupons);
        
        setActiveCoupons(coupons);
        console.log('Active coupons set:', coupons.length);
      } catch (error) {
        console.error('Error fetching coupons:', error);
      }
    };
    
    fetchActiveCoupons();
  }, []);

  // Auto-rotate coupons
  useEffect(() => {
    if (activeCoupons.length > 1) {
      const interval = setInterval(() => {
        setCurrentCouponIndex((prev) => (prev + 1) % activeCoupons.length);
      }, 5000); // Change coupon every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [activeCoupons.length]);

  const handleNextCoupon = () => {
    setCurrentCouponIndex((prev) => (prev + 1) % activeCoupons.length);
  };

  const handlePrevCoupon = () => {
    setCurrentCouponIndex((prev) => (prev - 1 + activeCoupons.length) % activeCoupons.length);
  };

  // Reset to page 1 when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm, isFeaturedOnly, isLikedOnly]);

  useEffect(() => {
    const categoryParam = selectedCategory === "All" ? "all" : selectedCategory;
    dispatch(
      fetchProducts({
        page: currentPage,
        category: categoryParam,
        keyword: searchTerm,
      })
    );
  }, [dispatch, currentPage, selectedCategory, searchTerm]);

  // normalize products array
  const productList = Array.isArray(products) ? products : products?.products || [];

  // Fetch ALL featured and liked products when category changes to "All"
  useEffect(() => {
    let isMounted = true;
    
    const fetchAllFeaturedAndLiked = async () => {
      try {
        console.log('Starting fetch for all featured/liked products...');
        const response = await fetch('http://localhost:5000/api/products?limit=1000');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched data:', data);
        
        let allProducts = [];
        if (Array.isArray(data)) {
          allProducts = data;
        } else if (data.products && Array.isArray(data.products)) {
          allProducts = data.products;
        } else if (data.data && Array.isArray(data.data)) {
          allProducts = data.data;
        }
        
        console.log('Total products fetched:', allProducts.length);
        
        if (!isMounted) return;
        
        const featured = allProducts.filter(p => p && p.isFeatured === true);
        console.log('Featured products found:', featured.length);
        
        const liked = allProducts.filter(p => {
          const rating = p?.rating ?? 0;
          return rating > 3;
        });
        console.log('Liked products found (rating > 3):', liked.length);
        
        setAllFeaturedProducts(featured);
        setAllLikedProducts(liked);
        
      } catch (error) {
        console.error('Error fetching all featured/liked products:', error);
      }
    };
    
    if (selectedCategory === "All") {
      console.log('Category changed to "All", fetching all products...');
      fetchAllFeaturedAndLiked();
    }
    
    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

 // Update featured and liked products when category selection changes
  useEffect(() => {
    if (selectedCategory !== "All" && productList && productList.length > 0) {
      console.log('Updating featured/liked for category:', selectedCategory);
      const featured = productList.filter(p => p && p.isFeatured === true);
      setAllFeaturedProducts(featured);
      
      const liked = productList.filter(p => {
        const rating = p?.rating ?? 0;
        return rating > 3;
      });
      setAllLikedProducts(liked);
    }
  }, [productList, selectedCategory]);

  const isWishlisted = (p) => wishlist.some((w) => w._id === p._id);

  const safeRating = (p) => {
    const r = p?.rating ?? p?.product?.rating ?? null;
    return r === 0 ? null : r;
  };

  // Filter based on featured parameter
  const filtered = isFeaturedOnly 
    ? productList.filter((p) => p.isFeatured)
    : isLikedOnly
    ? productList.filter((p) => {
        const rating = safeRating(p);
        return rating !== null && rating > 3;
      })
    : productList;

  const getStockCount = (product) =>
    Number(
      product?.countInStock ??
        product?.stock ??
        product?.quantity ??
        product?.available ??
        0
    );

  const handleAddToCart = (e, product, qty = 1) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (!product || !product._id) return;

    const stock = getStockCount(product);
    if (stock <= 0) {
      setSnackMsg(`"${product.name}" is out of stock`);
      setSnackOpen(true);
      return;
    }

    const cleanItem = {
      _id: product._id,
      productId: product._id,
      name: product.name,
      price: Number(product.price),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : undefined,
      discount: product.discount ? Number(product.discount) : undefined,
      images: product.images || [],
      quantity: Number(qty),
    };

    if (isAuthenticated) {
      dispatch(addToUserCart(cleanItem));
    } else {
      dispatch(addToCart(cleanItem));
    }

    setSnackMsg(`Added "${product.name}" to cart`);
    setSnackOpen(true);
  };

  const handleToggleWishlist = (e, product) => {
    e?.stopPropagation?.();
    if (isAuthenticated) {
      if (isWishlisted(product)) {
        dispatch(removeFromWishlist(product._id));
      } else {
        dispatch(addToWishlist(product._id));
      }
    }
    setSnackMsg(isWishlisted(product) ? "Removed from wishlist" : "Added to wishlist");
    setSnackOpen(true);
  };

  const openQuickView = (product, e) => {
    e?.stopPropagation?.();
    setQuickProduct(product);
  };

  const closeQuickView = () => setQuickProduct(null);

  const fullBleedWrapper = {
    width: "100vw",
    mx: "calc(-50vw + 50%)",
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: 0,
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg,#0a0a0a,#1a1a1a)"
            : "linear-gradient(180deg,#fbfdff,#f3f6f9)",
      }}
    >
      {/* Startup/Loading Screen */}
      {isInitialLoad && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: theme.palette.mode === "dark"
              ? "linear-gradient(180deg,#0a0a0a,#1a1a1a)"
              : "linear-gradient(180deg,#fbfdff,#f3f6f9)",
            zIndex: 9999,
            animation: "fadeOut 0.5s ease-in 1.5s forwards",
            "@keyframes fadeOut": {
              "0%": { opacity: 1 },
              "100%": { opacity: 0, visibility: "hidden" },
            },
          }}
        >
          {/* Tricolor top stripe */}
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', height: 4 }}>
            <Box sx={{ flex: 1, background: '#FF9933' }} />
            <Box sx={{ flex: 1, background: '#FFFFFF' }} />
            <Box sx={{ flex: 1, background: '#138808' }} />
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Box
              sx={{
                margin: "0 auto 24px",
                animation: "pulse 2s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": { transform: "scale(1)", opacity: 1 },
                  "50%": { transform: "scale(1.05)", opacity: 0.95 },
                },
              }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="ShopiKart Logo"
                sx={{
                  maxWidth: 180,
                  height: "auto",
                  filter: "drop-shadow(0 12px 36px rgba(0, 102, 204, 0.3))",
                }}
              />
            </Box>

            <Typography
              variant="subtitle1"
              sx={{ mb: 1, fontWeight: 700, background: 'linear-gradient(90deg, #FF9933, #000080, #138808)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              🇮🇳 Proudly Indian
            </Typography>

            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 3, fontWeight: 600 }}
            >
              Your Desi Shopping Destination
            </Typography>

            {/* Ashoka Chakra inspired spinner */}
            <Box sx={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress
                size={50}
                sx={{
                  color: "#000080",
                }}
              />
              <Box sx={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: '#000080' }} />
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 3, display: "block" }}
            >
              Loading amazing deals across India...
            </Typography>
          </Box>

          {/* Tricolor bottom stripe */}
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', height: 4 }}>
            <Box sx={{ flex: 1, background: '#FF9933' }} />
            <Box sx={{ flex: 1, background: '#FFFFFF' }} />
            <Box sx={{ flex: 1, background: '#138808' }} />
          </Box>
        </Box>
      )}

      {/* Auto-Scrolling Ticker */}
      <Box sx={{ ...fullBleedWrapper, py: { xs: 0.35, sm: 0.5 } }}>
        <Container maxWidth={false} sx={{ px: { xs: 1, sm: 2, md: 6 } }}>
          <Box
            sx={{
              width: "100%",
              overflow: "hidden",
              background: theme.palette.mode === "dark" 
                ? "rgba(255,255,255,0.03)"
                : "rgba(255,255,255,0.9)",
              borderRadius: 2,
              py: 0.4,
              position: "relative",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              border: "1px solid",
              borderColor: theme.palette.mode === "dark" 
                ? "rgba(255,255,255,0.08)"
                : "rgba(102, 126, 234, 0.12)",
              backdropFilter: "blur(10px)",
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 50,
                background: theme.palette.mode === "dark"
                  ? "linear-gradient(90deg, rgba(0,0,0,0.8), transparent)"
                  : "linear-gradient(90deg, rgba(255,255,255,0.95), transparent)",
                zIndex: 10,
                pointerEvents: "none",
              },
              "&::after": {
                content: '""',
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: 50,
                background: theme.palette.mode === "dark"
                  ? "linear-gradient(270deg, rgba(0,0,0,0.8), transparent)"
                  : "linear-gradient(270deg, rgba(255,255,255,0.95), transparent)",
                zIndex: 10,
                pointerEvents: "none",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 1,
                animation: "scroll 50s linear infinite",
                "@keyframes scroll": {
                  "0%": { transform: "translateX(0)" },
                  "100%": { transform: "translateX(-50%)" },
                },
                "&:hover": {
                  animationPlayState: "paused",
                },
              }}
            >
              {[
                { title: "⚡ Lightning Fast Delivery"},
                { title: "🔒 100% Secure Payments" },
                { title: "↩️ Easy Returns" },
                { title: "⭐ Premium Indian Quality" },
                { title: "🎁 Dhamaka Offers" },
                { title: "📦 Free Shipping Pan-India" },
                { title: "🇮🇳 Made in India" },
                { title: "💰 Best Prices Guaranteed" },
              ]
                .concat([
                  { title: "⚡ Lightning Fast Delivery"},
                  { title: "🔒 100% Secure Payments" },
                  { title: "↩️ Easy Returns" },
                  { title: "⭐ Premium Indian Quality"},
                  { title: "🎁 Dhamaka Offers" },
                  { title: "📦 Free Shipping Pan-India" },
                  { title: "🇮🇳 Made in India" },
                  { title: "💰 Best Prices Guaranteed" },
                  { title: "⚡ Lightning Fast Delivery"},
                  { title: "🔒 100% Secure Payments" },
                  { title: "↩️ Easy Returns" },
                  { title: "⭐ Premium Indian Quality" },
                  { title: "🎁 Dhamaka Offers" },
                  { title: "📦 Free Shipping Pan-India" },
                ])
                .map((feature, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      minWidth: { xs: 108, sm: 140, md: 155 },
                      background: "linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)",
                      borderRadius: 2,
                      p: { xs: 0.35, md: 0.5 },
                      color: theme.palette.mode === "dark" ? "#fff" : "#667eea",
                      textAlign: "center",
                      boxShadow: "0 2px 8px rgba(102, 126, 234, 0.06)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
                      border: "1px solid",
                      borderColor: theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(102, 126, 234, 0.12)",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 24px rgba(102, 126, 234, 0.15)",
                        background: "linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%)",
                        borderColor: theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.2)"
                          : "rgba(102, 126, 234, 0.25)",
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: "0.6rem", md: "0.73rem" },
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineHeight: 1.1,
                        letterSpacing: "0.3px",
                      }}
                    >
                      {feature.title}
                    </Typography>
                  </Box>
                ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Coupon Banner Carousel - Compact */}
      {activeCoupons.length > 0 && selectedCategory === "All" && (
      <Box sx={{ ...fullBleedWrapper, py: { xs: 0.2, sm: 0.3 }, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 6 } }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 1.5,
            position: 'relative'
          }}>
            {/* Previous Button */}
            <IconButton
              onClick={handlePrevCoupon}
              disabled={activeCoupons.length <= 1}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                background: theme.palette.mode === "dark" 
                  ? "rgba(255,255,255,0.1)" 
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                width: 28,
                height: 28,
                boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
                transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
                backdropFilter: "blur(10px)",
                border: "1.5px solid rgba(255, 255, 255, 0.2)",
                "&:hover": {
                  background: theme.palette.mode === "dark" 
                    ? "rgba(255,255,255,0.2)" 
                    : "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                  transform: "scale(1.08) translateX(-2px)",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
                },
                "&:disabled": {
                  opacity: 0.3,
                  cursor: "not-allowed",
                }
              }}
            >
              <ChevronLeft sx={{ fontSize: 16 }} />
            </IconButton>

            {/* Coupon Banner */}
            <Box
              sx={{
                flex: 1,
                maxWidth: { xs: '100%', sm: 700, md: 900, lg: 1000 },
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: 1.5,
                px: { xs: 0.8, sm: 1.5 },
                py: { xs: 0.45, sm: 0.5 },
                color: "#fff",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 4px 16px rgba(102, 126, 234, 0.25)",
                border: "1.5px solid rgba(255, 255, 255, 0.25)",
                transition: "all 250ms ease",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)",
                  pointerEvents: "none",
                },
              }}
            >
              {(() => {
                const coupon = activeCoupons[currentCouponIndex];
                if (!coupon) return null;
                
                const expiryDate = new Date(coupon.endDate || coupon.expiryDate);
                const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
                
                return (
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} flexWrap="wrap" gap={{ xs: 0.5, sm: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={0.8}>
                        <LocalOffer sx={{ fontSize: { xs: 14, sm: 16 } }} />
                        <Typography sx={{ fontWeight: 900, fontSize: { xs: '0.72rem', sm: '0.9rem' }, lineHeight: 1.2 }}>
                          {coupon.discountType === "percentage" 
                            ? `${coupon.discountValue}% OFF` 
                            : `₹${coupon.discountValue} OFF`}
                          {coupon.description && (
                            <Typography component="span" sx={{ ml: 0.7, fontSize: { xs: '0.63rem', sm: '0.75rem' }, opacity: 0.9, fontWeight: 600 }}>
                              • {coupon.description}
                            </Typography>
                          )}
                        </Typography>
                      </Stack>
                      
                      <Stack direction="row" alignItems="center" spacing={0.7}>
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            background: "rgba(255, 255, 255, 0.25)",
                            borderRadius: 1,
                            px: 0.8,
                            py: 0.2,
                            border: "1.5px dashed rgba(255, 255, 255, 0.5)",
                            backdropFilter: "blur(10px)",
                          }}
                        >
                          <Typography sx={{ fontWeight: 900, fontSize: { xs: '0.68rem', sm: '0.85rem' }, letterSpacing: { xs: "1px", sm: "1.5px" } }}>
                            {coupon.code}
                          </Typography>
                        </Box>
                        
                        <Chip
                          label={daysLeft > 0 ? `${daysLeft}d` : "Today"}
                          size="small"
                          sx={{
                            background: daysLeft > 7 ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 107, 107, 0.8)",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: { xs: "0.6rem", sm: "0.65rem" },
                            height: { xs: 17, sm: 18 },
                            backdropFilter: "blur(10px)",
                          }}
                        />
                        
                        {activeCoupons.length > 1 && (
                          <Typography sx={{ fontSize: { xs: "0.68rem", sm: "0.75rem" }, opacity: 0.8, fontWeight: 600, ml: 0.3 }}>
                            {currentCouponIndex + 1}/{activeCoupons.length}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                );
              })()}
            </Box>

            {/* Next Button */}
            <IconButton
              onClick={handleNextCoupon}
              disabled={activeCoupons.length <= 1}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                background: theme.palette.mode === "dark" 
                  ? "rgba(255,255,255,0.1)" 
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                width: 28,
                height: 28,
                boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
                transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
                backdropFilter: "blur(10px)",
                border: "1.5px solid rgba(255, 255, 255, 0.2)",
                "&:hover": {
                  background: theme.palette.mode === "dark" 
                    ? "rgba(255,255,255,0.2)" 
                    : "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                  transform: "scale(1.08) translateX(2px)",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
                },
                "&:disabled": {
                  opacity: 0.3,
                  cursor: "not-allowed",
                }
              }}
            >
              <ChevronRight sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Container>
      </Box>
      )}

      {/* Featured & Most Liked Side by Side Section */}
      <Box sx={{ ...fullBleedWrapper, py: { xs: 0.5, sm: 0.75 }, background: "linear-gradient(135deg, rgba(255, 153, 51, 0.06) 0%, rgba(19, 136, 8, 0.06) 100%)", borderTop: "3px solid", borderImage: "linear-gradient(90deg, #FF9933, #FFFFFF, #138808) 1", borderBottom: "none" }}>
        <Container maxWidth={false} sx={{ px: { xs: 1, sm: 2, md: 4 } }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: selectedCategory === "All" ? '1fr' : { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 1.25, sm: 2 },
          }}>
          {/* Featured for You Column */}
          <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#667eea", fontSize: { xs: "0.85rem", sm: "0.95rem" }, mb: 0.2 }}>
                ⭐ Featured for You
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, fontSize: { xs: "0.68rem", sm: "0.75rem" } }}>
                Handpicked bestsellers trending across India
              </Typography>
            </Box>
          </Stack>

          {/* Featured Products Scrollable */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              overflowX: "auto",
              overflowY: "hidden",
              pb: 2,
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-track": {
                background: "rgba(0,0,0,0.05)",
                borderRadius: 4,
              },
              "&::-webkit-scrollbar-thumb": {
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: 4,
                "&:hover": {
                  background: "#667eea",
                },
              },
            }}
          >
            {allFeaturedProducts
              .map((p) => {
                const r = safeRating(p);
                const color = ratingColor(r);
                const finalColor = (r !== null && r !== 0) ? color : '#87CEEB';
                const stockCount = getStockCount(p);
                const inStock = stockCount > 0;

                return (
                  <Card
                    key={p._id}
                    onClick={() => navigate(`/product/${p._id}`)}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      minWidth: { xs: 170, sm: 220, md: 250 },
                      maxWidth: { xs: 170, sm: 220, md: 250 },
                      borderRadius: { xs: 2, sm: 3 },
                      cursor: "pointer",
                      overflow: "hidden",
                      border: "2px solid",
                      borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(102, 126, 234, 0.1)",
                      background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "#fff",
                      boxShadow: { xs: "0 8px 18px rgba(0, 0, 0, 0.1)", sm: "0 12px 32px rgba(0, 0, 0, 0.1)" },
                      transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                      flexShrink: 0,
                      backdropFilter: "blur(10px)",
                      "&:hover": {
                        transform: "translateY(-10px) scale(1.02)",
                        boxShadow: "0 24px 56px rgba(102, 126, 234, 0.25)",
                        borderColor: "#667eea",
                      },
                    }}
                  >
                    <Box sx={{ height: 6, width: "100%", background: `linear-gradient(90deg, ${color}, ${color}dd, ${color})` }} />

                    <Box sx={{ position: "relative", background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)", overflow: "hidden" }}>
                      <CardMedia 
                        component="img" 
                        image={p.images?.[0] || "https://via.placeholder.com/600"} 
                        alt={p.name} 
                        sx={{ 
                          height: { xs: 124, sm: 165, md: 180 }, 
                          objectFit: { xs: "contain", sm: "cover" },
                          p: { xs: 0.75, sm: 0 },
                          bgcolor: "#fff",
                          transition: "transform 400ms cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": {
                            transform: "scale(1.1)",
                          },
                        }} 
                      />
                      <Box 
                        sx={{ 
                          position: "absolute", 
                          bottom: 0, 
                          left: 0, 
                          right: 0, 
                          height: "50%", 
                          background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)",
                          pointerEvents: "none",
                        }} 
                      />

                      <Box sx={{ position: "absolute", top: { xs: 6, sm: 8 }, left: { xs: 6, sm: 8 }, display: "flex", gap: 0.4 }}>
                        <Chip
                          label="⭐ Featured"
                          sx={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: { xs: "0.62rem", sm: "0.7rem" },
                            height: { xs: 20, sm: 24 },
                          }}
                        />
                        {safeRating(p) !== null && safeRating(p) > 3 && (
                          <Chip
                            label="💖 Loved"
                            sx={{
                              background: "linear-gradient(135deg, #e91e63 0%, #c2185b 100%)",
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: { xs: "0.62rem", sm: "0.7rem" },
                              height: { xs: 20, sm: 24 },
                            }}
                          />
                        )}
                      </Box>

                      <IconButton
                        onClick={(e) => handleToggleWishlist(e, p)}
                        sx={{ position: "absolute", top: 6, right: 6, bgcolor: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", "&:hover": { bgcolor: "#f5f5f5" }, width: { xs: 28, sm: 36 }, height: { xs: 28, sm: 36 } }}
                        size="small"
                      >
                        {isWishlisted(p) ? <FavoriteFilled sx={{ color: "#e91e63", fontSize: 18 }} /> : <FavoriteOutline sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </Box>

                    <CardContent sx={{ flex: 1, p: { xs: 1, sm: 1.5 }, pb: 0.8 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: { xs: "0.78rem", sm: "0.85rem" }, display: "block", color: "#111" }} noWrap>
                        {p.name}
                      </Typography>

                      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, mb: 0.8, alignItems: "center" }}>
                        <Rating value={r || 0} size="small" readOnly sx={{ transform: "scale(0.75)", transformOrigin: "left" }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: "#667eea", fontSize: "0.7rem" }}>
                          {r ? `${Number(r).toFixed(1)}★` : "New"}
                        </Typography>
                      </Stack>

                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "#667eea", fontSize: { xs: "0.9rem", sm: "1rem" } }}>
                          ₹{Number(p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price ? p.discountPrice : p.price || 0).toFixed(0)}
                        </Typography>
                        {p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price && (
                          <Typography variant="caption" sx={{ textDecoration: "line-through", color: "text.secondary", fontSize: "0.75rem" }}>
                            ₹{Number(p.price || 0).toFixed(0)}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>

                    <CardActions sx={{ p: { xs: 0.8, sm: 1.2 }, pt: 0.3, gap: 0.5 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={(e) => {
                          if (!inStock) {
                            e?.stopPropagation?.();
                            setSnackMsg(`"${p.name}" is out of stock`);
                            setSnackOpen(true);
                            return;
                          }
                          handleAddToCart(e, p);
                        }}
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          borderRadius: 1.5,
                          background: inStock ? finalColor : "#ccc",
                          fontSize: { xs: "0.74rem", sm: "0.8rem" },
                          py: { xs: 0.42, sm: 0.6 },
                          "&:hover": { 
                            background: inStock ? (r !== null && r !== 0 ? `${finalColor}dd` : '#74bfdb') : "#ccc",
                            transform: "translateY(-2px)",
                            boxShadow: inStock ? (r !== null && r !== 0 ? '0 6px 16px rgba(102, 126, 234, 0.3)' : '0 6px 16px rgba(135, 206, 235, 0.3)') : '0 6px 16px rgba(0,0,0,0.1)',
                          },
                        }}
                        disabled={!inStock}
                      >
                        {!inStock ? "Out" : "Quick Add"}
                      </Button>
                    </CardActions>
                  </Card>
                );
              })}
          </Box>

          {allFeaturedProducts.length === 0 && (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                No featured products
              </Typography>
            </Box>
          )}
          </Box>

          {/* Most Loved Products Column */}
          <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#667eea", fontSize: { xs: "0.85rem", sm: "0.95rem" }, mb: 0.2 }}>
                💖 Most Loved Products
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, fontSize: { xs: "0.68rem", sm: "0.75rem" } }}>
                India's favourites — highly rated by happy customers (3+ stars)
              </Typography>
            </Box>
          </Stack>

          {/* Most Liked Products Scrollable */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              overflowX: "auto",
              overflowY: "hidden",
              pb: 2,
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-track": {
                background: "rgba(0,0,0,0.05)",
                borderRadius: 4,
              },
              "&::-webkit-scrollbar-thumb": {
                background: "linear-gradient(135deg, #e91e63 0%, #c2185b 100%)",
                borderRadius: 4,
                "&:hover": {
                  background: "#e91e63",
                },
              },
            }}
          >
            {allLikedProducts
              .map((p) => {
                const r = safeRating(p);
                const color = ratingColor(r);
                const finalColor = (r !== null && r !== 0) ? color : '#87CEEB';
                const stockCount = getStockCount(p);
                const inStock = stockCount > 0;

                return (
                  <Card
                    key={p._id}
                    onClick={() => navigate(`/product/${p._id}`)}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      minWidth: { xs: 170, sm: 220, md: 250 },
                      maxWidth: { xs: 170, sm: 220, md: 250 },
                      borderRadius: { xs: 2, sm: 3 },
                      cursor: "pointer",
                      overflow: "hidden",
                      border: "2px solid",
                      borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(102, 126, 234, 0.1)",
                      background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "#fff",
                      boxShadow: { xs: "0 8px 18px rgba(0, 0, 0, 0.1)", sm: "0 12px 32px rgba(0, 0, 0, 0.1)" },
                      transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                      flexShrink: 0,
                      backdropFilter: "blur(10px)",
                      "&:hover": {
                        transform: "translateY(-10px) scale(1.02)",
                        boxShadow: "0 24px 56px rgba(102, 126, 234, 0.25)",
                        borderColor: "#667eea",
                      },
                    }}
                  >
                    <Box sx={{ height: 6, width: "100%", background: `linear-gradient(90deg, ${color}, ${color}dd, ${color})` }} />

                    <Box sx={{ position: "relative", background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)", overflow: "hidden" }}>
                      <CardMedia 
                        component="img" 
                        image={p.images?.[0] || "https://via.placeholder.com/600"} 
                        alt={p.name} 
                        sx={{ 
                          height: { xs: 124, sm: 165, md: 180 }, 
                          objectFit: { xs: "contain", sm: "cover" },
                          p: { xs: 0.75, sm: 0 },
                          bgcolor: "#fff",
                          transition: "transform 400ms cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": {
                            transform: "scale(1.1)",
                          },
                        }} 
                      />
                      <Box 
                        sx={{ 
                          position: "absolute", 
                          bottom: 0, 
                          left: 0, 
                          right: 0, 
                          height: "50%", 
                          background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)",
                          pointerEvents: "none",
                        }} 
                      />

                      <Box sx={{ position: "absolute", top: { xs: 6, sm: 8 }, left: { xs: 6, sm: 8 }, display: "flex", gap: 0.4 }}>
                        <Chip
                          label="💖 Loved"
                          sx={{
                            background: "linear-gradient(135deg, #e91e63 0%, #c2185b 100%)",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: { xs: "0.62rem", sm: "0.7rem" },
                            height: { xs: 20, sm: 24 },
                          }}
                        />
                        {p.isFeatured && (
                          <Chip
                            label="⭐ Featured"
                            sx={{
                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: { xs: "0.62rem", sm: "0.7rem" },
                              height: { xs: 20, sm: 24 },
                            }}
                          />
                        )}
                      </Box>

                      <IconButton
                        onClick={(e) => handleToggleWishlist(e, p)}
                        sx={{ position: "absolute", top: 6, right: 6, bgcolor: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", "&:hover": { bgcolor: "#f5f5f5" }, width: { xs: 28, sm: 36 }, height: { xs: 28, sm: 36 } }}
                        size="small"
                      >
                        {isWishlisted(p) ? <FavoriteFilled sx={{ color: "#e91e63", fontSize: 18 }} /> : <FavoriteOutline sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </Box>

                    <CardContent sx={{ flex: 1, p: { xs: 1, sm: 1.5 }, pb: 0.8 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: { xs: "0.78rem", sm: "0.85rem" }, display: "block", color: "#111" }} noWrap>
                        {p.name}
                      </Typography>

                      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, mb: 0.8, alignItems: "center" }}>
                        <Rating value={r || 0} size="small" readOnly sx={{ transform: "scale(0.75)", transformOrigin: "left" }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: "#667eea", fontSize: "0.7rem" }}>
                          {r ? `${Number(r).toFixed(1)}★` : "New"}
                        </Typography>
                      </Stack>

                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "#667eea", fontSize: { xs: "0.9rem", sm: "1rem" } }}>
                          ₹{Number(p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price ? p.discountPrice : p.price || 0).toFixed(0)}
                        </Typography>
                        {p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price && (
                          <Typography variant="caption" sx={{ textDecoration: "line-through", color: "text.secondary", fontSize: "0.75rem" }}>
                            ₹{Number(p.price || 0).toFixed(0)}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>

                    <CardActions sx={{ p: { xs: 0.8, sm: 1.2 }, pt: 0.3, gap: 0.5 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={(e) => {
                          if (!inStock) {
                            e?.stopPropagation?.();
                            setSnackMsg(`"${p.name}" is out of stock`);
                            setSnackOpen(true);
                            return;
                          }
                          handleAddToCart(e, p);
                        }}
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          borderRadius: 1.5,
                          background: inStock ? finalColor : "#ccc",
                          fontSize: { xs: "0.74rem", sm: "0.8rem" },
                          py: { xs: 0.42, sm: 0.6 },
                          "&:hover": { 
                            background: inStock ? (r !== null && r !== 0 ? `${finalColor}dd` : '#74bfdb') : "#ccc",
                            transform: "translateY(-2px)",
                            boxShadow: inStock ? (r !== null && r !== 0 ? '0 6px 16px rgba(102, 126, 234, 0.3)' : '0 6px 16px rgba(135, 206, 235, 0.3)') : '0 6px 16px rgba(0,0,0,0.1)',
                          },
                        }}
                        disabled={!inStock}
                      >
                        {!inStock ? "Out" : "Quick Add"}
                      </Button>
                    </CardActions>
                  </Card>
                );
              })}
          </Box>

          {allLikedProducts.length === 0 && (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                No highly-rated products yet
              </Typography>
            </Box>
          )}
          </Box>
          </Box>
        </Container>
      </Box>

      {/* AI-Powered Recommendations Section - Side by Side Square Grid Layout */}
      {!isFeaturedOnly && !isLikedOnly && !searchTerm && selectedCategory === "All" && (
        <Box sx={{ ...fullBleedWrapper, py: 1.5, background: theme.palette.mode === 'dark' ? 'rgba(20,20,30,0.5)' : 'rgba(255,255,255,0.95)' }}>
          <Container maxWidth={false} sx={{ px: { xs: 1, md: 4 } }}>
            {isAuthenticated ? (
              // When authenticated: show personalized and recently-viewed side by side (50-50 split)
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 1.5,
                minHeight: { xs: 'auto', md: '480px' },
              }}>
                <Box>
                  <ProductRecommendations 
                    type="personalized" 
                    limit={9}
                    layout="grid-scroll"
                    itemsPerRow={3}
                  />
                </Box>
                <Box>
                  <ProductRecommendations 
                    type="recently-viewed" 
                    limit={9}
                    layout="grid-scroll"
                    itemsPerRow={3}
                  />
                </Box>
              </Box>
            ) : (
              // When not authenticated: just show trending in full width
              <ProductRecommendations 
                type="trending" 
                limit={9}
                layout="grid-scroll"
                itemsPerRow={3}
              />
            )}
          </Container>
        </Box>
      )}

      {/* Main products section */}
      <Box sx={{ ...fullBleedWrapper, pb: { xs: 4, sm: 6 }, pt: isFeaturedOnly ? 2 : { xs: 2.5, sm: 4 } }}>
        <Container maxWidth={false} sx={{ px: { xs: 1, sm: 2, md: 6 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" sx={{ mb: { xs: 1.5, sm: 3 }, gap: { xs: 1, sm: 0 } }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.25, fontSize: { xs: "1.9rem", sm: "2.2rem", md: "3rem" }, lineHeight: 1.1 }}>
                {isFeaturedOnly ? "⭐ All Featured Products" : isLikedOnly ? "💖 All Loved Products" : searchTerm ? `Search results for "${searchTerm}"` : selectedCategory !== "All" ? `${selectedCategory}` : "🔥 Top Picks Across India"}
              </Typography>
              {!isFeaturedOnly && !isLikedOnly && selectedCategory === "All" && !searchTerm && (
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, fontSize: { xs: "0.76rem", sm: "0.8rem" }, lineHeight: 1.3, display: "block" }}>
                  Bestselling products loved by shoppers across India
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              {(isFeaturedOnly || isLikedOnly) && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate("/")}
                  sx={{
                    fontWeight: 700,
                    textTransform: "none",
                    borderColor: "#667eea",
                    color: "#667eea",
                    "&:hover": { background: "rgba(102, 126, 234, 0.08)" },
                  }}
                >
                  ← Back to Home
                </Button>
              )}
              {!isFeaturedOnly && !isLikedOnly && <Chip icon={<LocalOffer />} label="Best Prices" color="secondary" sx={{ fontWeight: 700, height: { xs: 28, sm: 32 }, fontSize: { xs: "0.75rem", sm: "0.82rem" } }} />}
            </Stack>
          </Stack>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={56} />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Box
              sx={{
                display: "grid",
                gap: { xs: 1.25, md: 2 },
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                  lg: "repeat(5, 1fr)",
                },
                "@media (max-width:390px)": {
                  gridTemplateColumns: "repeat(1, 1fr)",
                },
              }}
            >
              {filtered.map((p) => {
                const r = safeRating(p);
                const color = ratingColor(r);
                const finalColor = (r !== null && r !== 0) ? color : '#87CEEB';
                const hasDiscount = p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price && (!p.discountExpires || new Date(p.discountExpires) > new Date());
                const mainPrice = hasDiscount ? Number(p.discountPrice || 0) : Number(p.price || 0);
                const originalPrice = hasDiscount ? Number(p.price || 0) : null;
                const stockCount = getStockCount(p);
                const inStock = stockCount > 0;

                return (
                  <Card
                    key={p._id}
                    onClick={() => navigate(`/product/${p._id}`)}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: { xs: 1.75, sm: 3 },
                      cursor: "pointer",
                      overflow: "hidden",
                      boxShadow: { xs: "0 6px 20px rgba(0, 0, 0, 0.08)", sm: "0 8px 32px rgba(0, 0, 0, 0.08)" },
                      transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                      border: "2px solid",
                      borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0, 0, 0, 0.05)",
                      background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "#fff",
                      backdropFilter: "blur(10px)",
                      "&:hover": {
                        transform: { xs: "translateY(-4px)", sm: "translateY(-12px) scale(1.02)" },
                        boxShadow: "0 24px 64px rgba(102, 126, 234, 0.2)",
                        borderColor: "#667eea",
                      },
                    }}
                  >
                    <Box sx={{ height: 6, width: "100%", background: `linear-gradient(90deg, ${color}, ${color}dd, ${color})` }} />

                    <Box sx={{ position: "relative", background: "linear-gradient(135deg, #f9fafb 0%, #e9ecef 100%)", overflow: "hidden" }}>
                      <CardMedia 
                        component="img" 
                        image={p.images?.[0] || "https://via.placeholder.com/600"} 
                        alt={p.name} 
                        sx={{ 
                          height: { xs: 145, sm: 220, md: 260, lg: 280 },
                          objectFit: { xs: "contain", sm: "cover" },
                          p: { xs: 0.6, sm: 0 },
                          bgcolor: "#fff",
                          transition: "transform 500ms cubic-bezier(0.4, 0, 0.2, 1)",
                          "@media (hover: hover) and (pointer: fine)": {
                            "&:hover": {
                              transform: "scale(1.12) rotate(1.4deg)",
                            },
                          },
                        }} 
                      />
                      <Box 
                        sx={{ 
                          position: "absolute", 
                          bottom: 0, 
                          left: 0, 
                          right: 0, 
                          height: { xs: "35%", sm: "60%" }, 
                          background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)",
                          pointerEvents: "none",
                        }} 
                      />

                      <Box sx={{ position: "absolute", top: { xs: 6, sm: 16 }, left: { xs: 6, sm: 16 }, display: "flex", gap: { xs: 0.45, sm: 1 }, flexWrap: "wrap", zIndex: 2 }}>
                        {p.isFeatured && <Chip label="⭐ Featured" size="small" sx={{ height: { xs: 22, sm: 24 }, fontSize: { xs: "0.68rem", sm: "0.75rem" }, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", fontWeight: 800, backdropFilter: "blur(10px)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }} />}
                        {r !== null && r > 3 && <Chip label="💖 Loved" size="small" sx={{ height: { xs: 22, sm: 24 }, fontSize: { xs: "0.68rem", sm: "0.75rem" }, background: "linear-gradient(135deg, #e91e63 0%, #c2185b 100%)", color: "#fff", fontWeight: 800, backdropFilter: "blur(10px)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }} />}
                        {hasDiscount && <Chip label="SALE" size="small" sx={{ height: { xs: 22, sm: 24 }, fontSize: { xs: "0.68rem", sm: "0.75rem" }, background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)", color: "#fff", fontWeight: 800, backdropFilter: "blur(10px)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }} />}
                        {p.canBeRented && <Chip label="RENT" size="small" sx={{ height: { xs: 22, sm: 24 }, fontSize: { xs: "0.68rem", sm: "0.75rem" }, background: "linear-gradient(135deg, #ffd54f 0%, #ffb300 100%)", color: "#1a1a1a", fontWeight: 800, backdropFilter: "blur(10px)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }} />}
                      </Box>

                      <IconButton
                        onClick={(e) => handleToggleWishlist(e, p)}
                        sx={{ position: "absolute", top: { xs: 6, sm: 10 }, right: { xs: 6, sm: 10 }, bgcolor: "#ffffffcc", width: { xs: 26, sm: 36 }, height: { xs: 26, sm: 36 }, "&:hover": { bgcolor: "#fff" } }}
                      >
                        {isWishlisted(p) ? <FavoriteFilled sx={{ color: "#e91e63" }} /> : <FavoriteOutline />}
                      </IconButton>
                    </Box>

                    <CardContent sx={{ flex: 1, px: { xs: 0.9, sm: 2 }, py: { xs: 0.75, sm: 1.5 }, pb: 0.45 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25, fontSize: { xs: "0.78rem", sm: "0.95rem" } }} noWrap>
                        {p.name}
                      </Typography>

                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 900, color: "#667eea", fontSize: { xs: "0.9rem", sm: "1rem" } }}>
                            ₹{mainPrice.toFixed(0)}
                          </Typography>
                          {originalPrice && (
                            <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "line-through", fontSize: "0.7rem" }}>
                              ₹{originalPrice.toFixed(0)}
                            </Typography>
                          )}
                        </Box>

                        <Stack alignItems="flex-end" spacing={0}>
                          <Rating value={r || 0} precision={0.5} readOnly size="small" sx={{ transform: { xs: "scale(0.72)", sm: "scale(0.8)" }, transformOrigin: "top right" }} />
                          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: { xs: "0.58rem", sm: "0.65rem" } }}>
                            {r ? `${Number(r).toFixed(1)}/5` : "New"}
                          </Typography>
                        </Stack>
                      </Stack>
                    </CardContent>

                    <CardActions sx={{ p: { xs: 0.55, sm: 1 }, pt: 0, gap: { xs: 0.35, sm: 0.5 }, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
                      <Button
                        startIcon={<CartIcon />}
                        variant="contained"
                        onClick={(e) => {
                          if (!inStock) {
                            e?.stopPropagation?.();
                            setSnackMsg(`"${p.name}" is out of stock`);
                            setSnackOpen(true);
                            return;
                          }
                          
                          if (p.variants && p.variants.length > 0) {
                            e?.stopPropagation?.();
                            navigate(`/product/${p._id}`);
                            return;
                          }
                          
                          handleAddToCart(e, p);
                        }}
                        sx={{
                          flex: 1,
                          textTransform: "none",
                          fontWeight: 700,
                          borderRadius: 1.5,
                          background: inStock ? finalColor : "#ccc",
                          minWidth: 0,
                          fontSize: { xs: "0.68rem", sm: "0.8rem" },
                          py: { xs: 0.35, sm: 0.5 },
                          px: { xs: 0.6, sm: 1.2 },
                          "&:hover": { 
                            background: inStock ? (r !== null && r !== 0 ? `${finalColor}dd` : '#74bfdb') : "#ccc",
                            transform: "translateY(-1px)",
                            boxShadow: inStock ? (r !== null && r !== 0 ? '0 4px 12px rgba(102, 126, 234, 0.2)' : '0 4px 12px rgba(135, 206, 235, 0.3)') : '0 4px 12px rgba(0,0,0,0.1)',
                          },
                        }}
                        disabled={!inStock}
                      >
                        {!inStock 
                          ? "Out" 
                          : (p.variants && p.variants.length > 0 ? "Options" : "Add")
                        }
                      </Button>

                      <Button 
                        variant="outlined" 
                        onClick={(e) => openQuickView(p, e)} 
                        size="small"
                        sx={{ 
                          textTransform: "none", 
                          minWidth: { xs: 52, sm: 64 },
                          fontSize: { xs: "0.65rem", sm: "0.75rem" },
                          py: { xs: 0.28, sm: 0.4 },
                          px: { xs: 0.5, sm: 1.2 },
                          borderColor: "#667eea",
                          color: "#667eea",
                        }}
                      >
                        View
                      </Button>

                      {p.canBeRented && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/rental-item/${p.rentalItemId || p._id}`);
                          }}
                          sx={{ 
                            textTransform: "none",
                            minWidth: { xs: 52, sm: 64 },
                            fontSize: { xs: "0.65rem", sm: "0.75rem" },
                            py: { xs: 0.28, sm: 0.4 },
                            px: { xs: 0.5, sm: 1.2 },
                            borderColor: "#667eea",
                            color: "#667eea",
                          }}
                        >
                          Rent
                        </Button>
                      )}

                      {!inStock && (
                        <Chip label="Out of stock" color="default" size="small" sx={{ ml: 1 }} />
                      )}
                    </CardActions>
                  </Card>
                );
              })}
            </Box>
          )}

          {searchTerm && filtered.length === 0 && !loading && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 2, color: "text.primary" }}>
                No Products Found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                We couldn't find any products matching "{searchTerm}". 
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Try searching with different keywords or browse our categories.
              </Typography>
              <Button variant="contained" color="secondary" onClick={() => navigate("/")} sx={{ textTransform: "none", fontWeight: 700 }}>
                Browse All Products
              </Button>
            </Box>
          )}

          {pages > 1 && (
            <Box sx={{ mt: 6, display: "flex", justifyContent: "center", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <Button variant="outlined" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                Previous
              </Button>
              <Typography sx={{ fontWeight: 700 }}>
                Page {currentPage} of {pages} ({total} total products)
              </Typography>
              <Button variant="outlined" onClick={() => setCurrentPage(Math.min(pages, currentPage + 1))} disabled={currentPage === pages}>
                Next
              </Button>
            </Box>
          )}

          {/* Rental CTA Section */}
          <Box sx={{ mt: { xs: 5, sm: 8 }, mb: 4, textAlign: "center" }}>
            <Box sx={{
              background: "linear-gradient(135deg, rgba(255, 153, 51, 0.08) 0%, rgba(19, 136, 8, 0.08) 100%)",
              borderRadius: 3,
              p: { xs: 2, sm: 4 },
              border: "2px solid",
              borderImage: "linear-gradient(90deg, #FF9933, rgba(0,0,128,0.3), #138808) 1",
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Subtle rangoli-inspired corner decorations */}
              <Box sx={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,153,51,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <Box sx={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(19,136,8,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
              
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, color: "#111", fontSize: { xs: "1.2rem", sm: "1.5rem" } }}>
                ✨ Try Before You Buy
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2.2, maxWidth: 500, mx: "auto", fontSize: { xs: "0.85rem", sm: "1rem" } }}>
                Explore our rental collection across India. Find cameras, tools, equipment, and more at unbeatable daily rates.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/rental")}
                sx={{
                  background: "linear-gradient(135deg, #FF9933 0%, #138808 100%)",
                  color: "#fff",
                  fontWeight: 900,
                  px: { xs: 3.5, sm: 6 },
                  py: { xs: 1.1, sm: 1.5 },
                  textTransform: "none",
                  fontSize: { xs: "0.9rem", sm: "1.05rem" },
                  borderRadius: 2.5,
                  transition: "all 200ms ease",
                  "&:hover": { 
                    background: "linear-gradient(135deg, #138808 0%, #FF9933 100%)",
                    transform: "translateY(-3px)",
                    boxShadow: "0 16px 40px rgba(255, 153, 51, 0.3)",
                  },
                }}
              >
                Browse Rentals →
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Quick view dialog */}
      <Dialog open={Boolean(quickProduct)} onClose={closeQuickView} maxWidth="md" fullWidth>
        <DialogTitle>
          {quickProduct?.name}
          <Typography variant="caption" sx={{ ml: 2, color: "text.secondary" }}>
            {quickProduct?.brand ? ` • ${quickProduct.brand}` : ""}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {quickProduct ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
              <Box>
                <Box component="img" src={quickProduct.images?.[0] || "https://via.placeholder.com/800"} alt={quickProduct.name} sx={{ width: "100%", borderRadius: 2 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  ₹{Number(quickProduct.price || 0).toFixed(2)}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Rating value={safeRating(quickProduct) || 1} readOnly size="small" />
                  <Chip label={safeRating(quickProduct) ? `${Number(safeRating(quickProduct)).toFixed(1)}★` : "No rating"} size="small" />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                  {quickProduct.description || "No description provided."}
                </Typography>

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={(e) => {
                      handleAddToCart(e, quickProduct);
                      closeQuickView();
                    }}
                  >
                    Add to cart
                  </Button>
                  <Button variant="outlined" onClick={() => navigate(`/product/${quickProduct._id}`)}>
                    Open product page
                  </Button>
                </Stack>
              </Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeQuickView}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackOpen} autoHideDuration={2500} onClose={() => setSnackOpen(false)} message={snackMsg} />
    </Box>
  );
}
