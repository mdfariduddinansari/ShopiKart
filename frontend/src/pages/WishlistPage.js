// import React from "react";
// import { useNavigate } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   Box,
//   Container,
//   Grid,
//   Typography,
//   Button,
//   Card,
//   CardContent,
//   CardMedia,
//   IconButton,
//   Rating,
//   Chip,
//   Alert,
//   CircularProgress,
//   Stack,
// } from "@mui/material";
// import {
//   Delete as DeleteIcon,
//   Favorite as FavoriteIcon,
//   ShoppingCart as CartIcon,
//   ArrowForward,
// } from "@mui/icons-material";
// import { toggleWishlist } from "../features/WishlistSlice";
// import { fetchWishlist, addToWishlist, removeFromWishlist } from "../features/WishlistSlice";
// import { addToCart, addToUserCart } from "../features/cartSlice";

// const WishlistPage = () => {
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const { items: wishlist, loading } = useSelector((state) => state.wishlist);
//   const { isAuthenticated } = useSelector((state) => state.auth);

//   React.useEffect(() => {
//     if (isAuthenticated) {
//       dispatch(fetchWishlist());
//     }
//   }, [dispatch, isAuthenticated]);

//   if (loading) {
//     return (
//       <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
//         <CircularProgress />
//       </Box>
//     );
//   }

//   const handleAddToCart = (product) => {
//     const cleanItem = {
//       _id: product._id,
//       productId: product._id,
//       name: product.name,
//       price: Number(product.price),
//       images: product.images || [],
//       quantity: 1,
//     };
//     if (isAuthenticated) {
//       dispatch(addToUserCart(cleanItem));
//     } else {
//       dispatch(addToCart(cleanItem));
//     }
//   };

//   const handleRemove = (product) => {
//     if (isAuthenticated) {
//       dispatch(removeFromWishlist(product._id));
//     } else {
//       // fallback: local toggle (optional, or disable for guests)
//     }
//   };

//   const handleAdd = (product) => {
//     if (isAuthenticated) {
//       dispatch(addToWishlist(product._id));
//     } else {
//       // fallback: local toggle (optional, or disable for guests)
//     }
//   };

//   return (
//     <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa", py: 4 }}>
//       <Container maxWidth="lg">
//         {/* Header */}
//         <Box sx={{ mb: 4 }}>
//           <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
//             <FavoriteIcon sx={{ fontSize: 32, color: "error.main" }} />
//             <Typography variant="h4" fontWeight={700}>
//               My Wishlist
//             </Typography>
//             {wishlist.length > 0 && (
//               <Chip label={`${wishlist.length} items`} color="error" variant="outlined" />
//             )}
//           </Box>
//           <Typography variant="body2" color="text.secondary">
//             Your favorite products saved for later
//           </Typography>
//         </Box>

//         {wishlist.length === 0 ? (
//           <Card sx={{ textAlign: "center", py: 8 }}>
//             <FavoriteIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
//             <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
//               Your wishlist is empty
//             </Typography>
//             <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//               Add items to your wishlist to save them for later
//             </Typography>
//             <Button
//               variant="contained"
//               color="secondary"
//               onClick={() => navigate("/")}
//               size="large"
//             >
//               Start Shopping
//             </Button>
//           </Card>
//         ) : (
//           <Grid container spacing={3}>
//             {wishlist.map((product) => (
//               <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
//                 <Card
//                   sx={{
//                     height: "100%",
//                     display: "flex",
//                     flexDirection: "column",
//                     transition: "all 0.3s ease",
//                     "&:hover": {
//                       transform: "translateY(-8px)",
//                       boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
//                     },
//                   }}
//                 >
//                   {/* Product Image */}
//                   <Box sx={{ position: "relative", overflow: "hidden" }}>
//                     <CardMedia
//                       component="img"
//                       height="200"
//                       image={product.images?.[0] || "https://via.placeholder.com/300"}
//                       alt={product.name}
//                       sx={{
//                         objectFit: "cover",
//                         cursor: "pointer",
//                         "&:hover": {
//                           transform: "scale(1.05)",
//                           transition: "transform 0.2s",
//                         },
//                       }}
//                       onClick={() => navigate(`/product/${product._id}`)}
//                     />

//                     {/* Remove from Wishlist Button */}
//                     <IconButton
//                       onClick={() => handleRemove(product)}
//                       sx={{
//                         position: "absolute",
//                         top: 8,
//                         right: 8,
//                         backgroundColor: "rgba(255, 255, 255, 0.9)",
//                         "&:hover": {
//                           backgroundColor: "rgba(255, 255, 255, 1)",
//                         },
//                       }}
//                       size="small"
//                       color="error"
//                     >
//                       <DeleteIcon />
//                     </IconButton>

//                     {/* Stock Status */}
//                     {product.stock && (
//                       <Chip
//                         label={product.stock > 0 ? "In Stock" : "Out of Stock"}
//                         color={product.stock > 0 ? "success" : "error"}
//                         size="small"
//                         sx={{
//                           position: "absolute",
//                           bottom: 8,
//                           left: 8,
//                         }}
//                       />
//                     )}
//                   </Box>

//                   {/* Product Info */}
//                   <CardContent sx={{ flex: 1, pb: 1 }}>
//                     <Typography
//                       gutterBottom
//                       variant="subtitle1"
//                       fontWeight={700}
//                       sx={{
//                         overflow: "hidden",
//                         textOverflow: "ellipsis",
//                         whiteSpace: "nowrap",
//                       }}
//                     >
//                       {product.name}
//                     </Typography>

//                     {/* Brand */}
//                     {product.brand && (
//                       <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
//                         {product.brand}
//                       </Typography>
//                     )}

//                     {/* Rating */}
//                     <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
//                       <Rating value={product.rating || 0} readOnly size="small" />
//                       <Typography variant="caption" color="text.secondary">
//                         ({product.numReviews || 0})
//                       </Typography>
//                     </Box>

//                     {/* Price */}
//                     <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 2 }}>
//                       <Typography variant="h6" fontWeight={700} color="secondary">
//                         ₹{product.price?.toFixed(0)}
//                       </Typography>
//                       {product.discountPrice && product.discountPrice > 0 && (
//                         <Typography
//                           variant="caption"
//                           sx={{ textDecoration: "line-through", color: "text.secondary" }}
//                         >
//                           ₹{product.discountPrice.toFixed(0)}
//                         </Typography>
//                       )}
//                     </Box>

//                     {/* Description Preview */}
//                     <Typography
//                       variant="body2"
//                       color="text.secondary"
//                       sx={{
//                         overflow: "hidden",
//                         textOverflow: "ellipsis",
//                         display: "-webkit-box",
//                         WebkitLineClamp: 2,
//                         WebkitBoxOrient: "vertical",
//                         mb: 2,
//                       }}
//                     >
//                       {product.description}
//                     </Typography>
//                   </CardContent>

//                   {/* Action Buttons */}
//                   <Stack spacing={1} sx={{ p: 2, pt: 0 }}>
//                     <Button
//                       variant="contained"
//                       color="secondary"
//                       fullWidth
//                       size="small"
//                       startIcon={<CartIcon />}
//                       onClick={() => handleAddToCart(product)}
//                       disabled={product.stock === 0}
//                     >
//                       Add to Cart
//                     </Button>
//                     <Button
//                       variant="outlined"
//                       color="secondary"
//                       fullWidth
//                       size="small"
//                       endIcon={<ArrowForward />}
//                       onClick={() => navigate(`/product/${product._id}`)}
//                     >
//                       View Details
//                     </Button>
//                   </Stack>
//                 </Card>
//               </Grid>
//             ))}
//           </Grid>
//         )}

//         {/* Continue Shopping Button */}
//         {wishlist.length > 0 && (
//           <Box sx={{ mt: 6, textAlign: "center" }}>
//             <Button
//               variant="outlined"
//               color="secondary"
//               size="large"
//               onClick={() => navigate("/")}
//             >
//               Continue Shopping
//             </Button>
//           </Box>
//         )}
//       </Container>
//     </Box>
//   );
// };

// export default WishlistPage;



// WishlistPage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Card,
  CardMedia,
  IconButton,
  Rating,
  Chip,
  CircularProgress,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Favorite as FavoriteIcon,
  ShoppingCart as CartIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { fetchWishlist, addToWishlist, removeFromWishlist } from "../features/WishlistSlice";
import { addToCart, addToUserCart } from "../features/cartSlice";

/*
  Key fixes:
  - Fixed card width/height and overflow guards so long names cannot stretch the layout.
  - Single-line ellipsis for product name and brand (title attribute shows full name).
  - Optimistic local state (localIds) for immediate UI feedback + safe server sync (awaits thunk if possible,
    otherwise falls back to a short delay and then re-fetches).
  - Defensive checks so UI doesn't break when product fields are missing.
*/

const WishlistPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: wishlist = [], loading } = useSelector((state) => state.wishlist || {});
  const { isAuthenticated } = useSelector((state) => state.auth || {});

  // Optimistic ui state: list of saved product ids
  const [localIds, setLocalIds] = React.useState(() => (wishlist || []).map((p) => p._id));

  // Keep localIds in sync when store updates (server confirms)
  React.useEffect(() => {
    const fromStore = (wishlist || []).map((p) => p._id);
    if (JSON.stringify(fromStore) !== JSON.stringify(localIds)) setLocalIds(fromStore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlist]);

  // Fetch wishlist on mount / when auth changes
  React.useEffect(() => {
    if (isAuthenticated) dispatch(fetchWishlist());
  }, [dispatch, isAuthenticated]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleAddToCart = (product) => {
    const cleanItem = {
      _id: product._id,
      productId: product._id,
      name: product.name,
      price: Number(product.price || 0),
      images: product.images || [],
      quantity: 1,
    };

    if (isAuthenticated) dispatch(addToUserCart(cleanItem));
    else dispatch(addToCart(cleanItem));
  };

  // Utility to safely attempt awaiting a dispatched thunk (if it returns a promise),
  // otherwise wait a small fallback and then re-fetch the wishlist.
  const dispatchAndSync = async (action) => {
    try {
      const result = dispatch(action);
      if (result && typeof result.then === "function") {
        await result;
      } else {
        // action didn't return a promise — short fallback delay to let store update
        await new Promise((r) => setTimeout(r, 350));
      }
    } catch (e) {
      // swallow - we'll re-fetch to correct UI
    } finally {
      // always re-fetch to ensure store is authoritative
      dispatch(fetchWishlist());
    }
  };

  const handleRemove = async (productId) => {
    if (!productId) return;
    // optimistic UI remove
    setLocalIds((prev) => prev.filter((id) => id !== productId));
    // dispatch removal + sync
    await dispatchAndSync(removeFromWishlist(productId));
  };

  const handleToggle = async (product) => {
    if (!product || !product._id) return;
    const exists = localIds.includes(product._id);

    if (exists) {
      // optimistic remove
      setLocalIds((prev) => prev.filter((id) => id !== product._id));
      await dispatchAndSync(removeFromWishlist(product._id));
    } else {
      // optimistic add (place at top)
      setLocalIds((prev) => [product._id, ...prev]);
      await dispatchAndSync(addToWishlist(product._id));
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f7fb", py: 5 }}>
      <Container maxWidth={false} sx={{ width: { xs: "100%", sm: "94%", md: "88%", lg: "80%" }, mx: "auto", px: { xs: 1.5, sm: 2 } }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <FavoriteIcon sx={{ fontSize: 28, color: "#d32f2f" }} />
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: 0.2 }}>
                My Wishlist
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Compact view — saved items for later
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Button variant="outlined" size="small" onClick={() => navigate("/")}>
              Continue shopping
            </Button>
            <Chip label={`${wishlist.length} items`} color="primary" variant="outlined" />
          </Box>
        </Box>

        {wishlist.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 12 }}>
            <Box 
              sx={{ 
                fontSize: 100, 
                mb: 3,
                animation: "heartbeat 1.5s ease-in-out infinite",
                "@keyframes heartbeat": {
                  "0%, 100%": { transform: "scale(1)" },
                  "25%, 75%": { transform: "scale(1.1)" },
                  "50%": { transform: "scale(0.95)" }
                }
              }}
            >
              💝
            </Box>
            <Typography variant="h4" fontWeight={900} sx={{ mb: 2, background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              No favorites yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: "auto" }}>
              Start adding products you love to create your personal collection
            </Typography>
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => navigate("/")}
              sx={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                color: "#fff",
                fontWeight: 800,
                px: 4,
                py: 1.5,
                fontSize: "1rem",
                textTransform: "none",
                boxShadow: "0 8px 24px rgba(245, 87, 108, 0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #e082ea 0%, #e4465b 100%)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 32px rgba(245, 87, 108, 0.4)"
                }
              }}
            >
              Discover amazing products
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {wishlist.map((product) => {
              const price = Number(product.price || 0);
              const discountPrice = Number(product.discountPrice || 0);
              const hasDiscount = discountPrice > 0 && discountPrice < price;
              const discountPercent = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0;

              const isSaved = localIds.includes(product._id);

              return (
                <Grid item key={product._id} xs={12} sm={6} md={4} lg={2}>
                  <Card
                    sx={{
                      position: "relative",
                      width: "100%",
                      height: 420,
                      borderRadius: 3,
                      overflow: "hidden",
                      cursor: "pointer",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        transform: "translateY(-8px)",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                        "& .overlay": {
                          opacity: 1,
                        },
                        "& .hoverActions": {
                          transform: "translateY(0)",
                          opacity: 1,
                        },
                      },
                    }}
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    {/* Full Image Background */}
                    <CardMedia
                      component="img"
                      image={product.images?.[0] || "https://via.placeholder.com/400"}
                      alt={product.name || "product"}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />

                    {/* Discount Badge */}
                    {hasDiscount && (
                      <Chip
                        label={`${discountPercent}% OFF`}
                        sx={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)",
                          color: "#fff",
                          fontWeight: 900,
                          fontSize: "0.75rem",
                          boxShadow: "0 4px 12px rgba(238, 90, 111, 0.4)",
                          zIndex: 2,
                        }}
                      />
                    )}

                    {/* Remove Button */}
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(product._id);
                      }}
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        bgcolor: "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(10px)",
                        zIndex: 2,
                        "&:hover": {
                          bgcolor: "#fff",
                          transform: "scale(1.1)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        },
                      }}
                      size="small"
                    >
                      <DeleteIcon sx={{ color: "#f5576c" }} />
                    </IconButton>

                    {/* Gradient Overlay */}
                    <Box
                      className="overlay"
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "100%",
                        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
                        opacity: 0,
                        transition: "opacity 0.3s ease",
                        pointerEvents: "none",
                      }}
                    />

                    {/* Product Info - Always Visible at Bottom */}
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 2.5,
                        background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)",
                        color: "#fff",
                        zIndex: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={800}
                        sx={{
                          mb: 0.5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: "1.1rem",
                        }}
                        title={product.name}
                      >
                        {product.name}
                      </Typography>

                      {product.brand && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            mb: 1.5,
                            opacity: 0.9,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            fontWeight: 600,
                          }}
                        >
                          {product.brand}
                        </Typography>
                      )}

                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                          <Typography variant="h5" fontWeight={900}>
                            ₹{hasDiscount ? discountPrice.toFixed(0) : price.toFixed(0)}
                          </Typography>
                          {hasDiscount && (
                            <Typography variant="body2" sx={{ textDecoration: "line-through", opacity: 0.7 }}>
                              ₹{price.toFixed(0)}
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Rating value={product.rating || 0} readOnly size="small" sx={{ color: "#ffd700" }} />
                          <Typography variant="caption" sx={{ opacity: 0.9 }}>
                            ({product.numReviews || 0})
                          </Typography>
                        </Box>
                      </Box>

                      {/* Hover Action Buttons */}
                      <Box
                        className="hoverActions"
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          display: "flex",
                          gap: 1,
                          transform: "translateY(20px)",
                          opacity: 0,
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<CartIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={product.stock === 0}
                          sx={{
                            bgcolor: "#fff",
                            color: "#000",
                            fontWeight: 800,
                            textTransform: "none",
                            "&:hover": {
                              bgcolor: "#f5f5f5",
                            },
                            "&.Mui-disabled": {
                              bgcolor: "rgba(255,255,255,0.3)",
                              color: "rgba(255,255,255,0.5)",
                            },
                          }}
                        >
                          {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                        </Button>

                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggle(product);
                          }}
                          sx={{
                            bgcolor: "rgba(255,255,255,0.2)",
                            backdropFilter: "blur(10px)",
                            "&:hover": {
                              bgcolor: "rgba(255,255,255,0.3)",
                            },
                          }}
                        >
                          <FavoriteIcon sx={{ color: isSaved ? "#ff4757" : "#fff" }} />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Stock Status Badge */}
                    {typeof product.stock !== "undefined" && product.stock === 0 && (
                      <Chip
                        label="Out of Stock"
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          bgcolor: "rgba(0,0,0,0.8)",
                          color: "#fff",
                          fontWeight: 900,
                          fontSize: "1rem",
                          px: 3,
                          py: 2.5,
                          height: "auto",
                          backdropFilter: "blur(10px)",
                          zIndex: 2,
                        }}
                      />
                    )}
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default WishlistPage;
