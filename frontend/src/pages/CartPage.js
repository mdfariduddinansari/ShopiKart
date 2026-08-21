// import React, { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import {
//   Container,
//   Grid,
//   Card,
//   CardContent,
//   Box,
//   Typography,
//   Button,
//   Stack,
//   Divider,
//   Chip,
//   IconButton,
//   Select,
//   MenuItem,
//   useTheme,
// } from "@mui/material";
// import { Delete as DeleteIcon, ShoppingCart as ShoppingCartIcon } from "@mui/icons-material";
// import ArrowForward from "@mui/icons-material/ArrowForward";
// import { removeFromCart, updateQuantity, clearCart, removeUserCartItem, updateUserCartItem, clearUserCart, fetchUserCart } from "../features/cartSlice";

// const formatPrice = (price) => {
//   return new Intl.NumberFormat("en-IN", {
//     style: "currency",
//     currency: "INR",
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   }).format(price);
// };

// const CartPage = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const theme = useTheme();

//   // Shopping cart only
//   let items = useSelector((state) => state.cart?.items || []);
//   const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated || false);

//   const isEmpty = items.length === 0;

//   // Fetch cart from database when user is authenticated
//   useEffect(() => {
//     if (isAuthenticated) {
//       console.log('CartPage: User is authenticated, fetching cart from database...');
//       dispatch(fetchUserCart());
//     }
//   }, [isAuthenticated, dispatch]);

//   // Shopping cart calculations with proper precision
//   const subtotal = items.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
//   const tax = parseFloat((subtotal * 0.1).toFixed(2));
//   const shipping = subtotal > 2500 ? 0 : 150;
//   const total = parseFloat((subtotal + tax + shipping).toFixed(2));

//   // Handlers
//   const handleQuantityChange = (id, quantity, variantId = null) => {
//     if (quantity > 0) {
//       if (isAuthenticated) {
//         // For authenticated users, use database update
//         const productId = id;
//         dispatch(updateUserCartItem({ productId, quantity, variantId }));
//       } else {
//         // For guests, use local cart
//         dispatch(updateQuantity({ id, quantity }));
//       }
//     }
//   };

//   const handleRemove = (id, variantId = null) => {
//     if (isAuthenticated) {
//       // For authenticated users, use database removal
//       const productId = id;
//       dispatch(removeUserCartItem({ productId, variantId }));
//     } else {
//       // For guests, use local cart
//       dispatch(removeFromCart(id));
//     }
//   };

//   const handleClearCart = () => {
//     if (isAuthenticated) {
//       // For authenticated users, use database clear
//       dispatch(clearUserCart());
//     } else {
//       // For guests, use local cart
//       dispatch(clearCart());
//     }
//   };

//   return (
//     <Container maxWidth="lg" sx={{ py: 8 }}>
//       {isEmpty ? (
//         <Box sx={{ textAlign: "center", py: 12 }}>
//           <ShoppingCartIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
//           <Typography variant="h4" fontWeight={900} sx={{ mb: 2 }}>
//             Your cart is empty
//           </Typography>
//           <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
//             Add some amazing products to get started!
//           </Typography>
//           <Button variant="contained" color="secondary" size="large" onClick={() => navigate("/")}>
//             Shop now
//           </Button>
//         </Box>
//       ) : (
//         <Grid container spacing={4}>
//           <Grid item xs={12} lg={8}>
//             {/* Shopping Cart Items */}
//             <Stack spacing={3}>
//               {items.map((item) => {
//                 const price = item.price || 0;
//                 const qty = item.quantity || 1;
//                 const itemId = item._id || item.productId || item.id;
//                 const productId = item.productId || item._id || item.id; // For authenticated operations
//                 const variantId = item.variant?.variantId || null;
                
//                 // Build display name with variant info
//                 let displayName = item.name;
//                 if (item.variant?.value) {
//                   displayName += ` (${item.variant.type}: ${item.variant.value})`;
//                 }

//                 return (
//                   <Card
//                     key={itemId}
//                     sx={{
//                       display: "flex",
//                       gap: 2,
//                       p: 2,
//                       borderRadius: 3,
//                       alignItems: "flex-start",
//                       border: theme.palette.mode === 'dark' ? '1px solid #333' : "1px solid #e0e0e0",
//                       background: theme.palette.mode === 'dark' 
//                         ? 'linear-gradient(180deg, #2a2a2a, #1f1f1f)'
//                         : "linear-gradient(180deg, #fff, #fbfcfd)",
//                       transition: "all 0.3s ease",
//                       "&:hover": { boxShadow: 2 },
//                     }}
//                   >
//                     <Box sx={{ width: { xs: 100, sm: 140 }, flexShrink: 0 }}>
//                       <Box
//                         component="img"
//                         src={item.variant?.image || item.images?.[0] || "https://via.placeholder.com/200"}
//                         alt={displayName || "product"}
//                         sx={{ width: "100%", height: { xs: 100, sm: 140 }, objectFit: "cover", borderRadius: 2 }}
//                       />
//                     </Box>

//                     <Box sx={{ flex: 1 }}>
//                       <Typography variant="subtitle1" fontWeight={800}>
//                         {displayName}
//                       </Typography>
//                       <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
//                         {formatPrice(price)} each
//                       </Typography>
//                       {item.variant?.value && (
//                         <Typography variant="caption" color="success.main" sx={{ display: "block", mt: 0.5, fontWeight: 600 }}>
//                           Variant: {item.variant.type} - {item.variant.value}
//                         </Typography>
//                       )}

//                       <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center" sx={{ mt: 2 }}>
//                         <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                           <Typography variant="body2" fontWeight={700}>
//                             Qty:
//                           </Typography>
//                           <Select value={qty} onChange={(e) => handleQuantityChange(productId, Number(e.target.value), variantId)} size="small">
//                             {[...Array(10).keys()].map((x) => (
//                               <MenuItem key={x + 1} value={x + 1}>
//                                 {x + 1}
//                               </MenuItem>
//                             ))}
//                           </Select>
//                         </Box>

//                         <Button
//                           variant="outlined"
//                           color="error"
//                           startIcon={<DeleteIcon />}
//                           onClick={() => handleRemove(productId, variantId)}
//                           size="small"
//                         >
//                           Remove
//                         </Button>
//                       </Stack>
//                     </Box>

//                     <Box sx={{ textAlign: "right" }}>
//                       <Typography variant="h6" fontWeight={900} color="secondary">
//                         {formatPrice(price * qty)}
//                       </Typography>
//                     </Box>
//                   </Card>
//                 );
//               })}
//             </Stack>

//             <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
//               <Button variant="outlined" color="error" onClick={handleClearCart}>
//                 Clear cart
//               </Button>
//               <Button variant="contained" color="secondary" onClick={() => navigate("/")}>
//                 Continue shopping
//               </Button>
//             </Stack>
//           </Grid>

//           {/* Order Summary */}
//           <Grid item xs={12} lg={4}>
//             <Card
//               sx={{
//                 position: "sticky",
//                 top: 96,
//                 borderRadius: 3,
//                 boxShadow: "0 12px 36px rgba(0,0,0,0.08)",
//                 overflow: "visible",
//               }}
//             >
//               <CardContent>
//                 <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>
//                   Order summary
//                 </Typography>

//                 <Stack spacing={1.5} sx={{ mb: 2 }}>
//                   <Box sx={{ display: "flex", justifyContent: "space-between" }}>
//                     <Typography variant="body2" color="text.secondary">
//                       Subtotal ({items.reduce((a, i) => a + (i.quantity ?? 1), 0)} items)
//                     </Typography>
//                     <Typography variant="body2" fontWeight={800}>
//                       {formatPrice(subtotal)}
//                     </Typography>
//                   </Box>
//                   <Box sx={{ display: "flex", justifyContent: "space-between" }}>
//                     <Typography variant="body2" color="text.secondary">
//                       Tax (10%)
//                     </Typography>
//                     <Typography variant="body2" fontWeight={800}>
//                       {formatPrice(tax)}
//                     </Typography>
//                   </Box>
//                   <Box sx={{ display: "flex", justifyContent: "space-between" }}>
//                     <Typography variant="body2" color="text.secondary">
//                       Shipping
//                     </Typography>
//                     {shipping === 0 ? (
//                       <Chip label="FREE" size="small" color="success" />
//                     ) : (
//                       <Typography variant="body2" fontWeight={800}>
//                         {formatPrice(shipping)}
//                       </Typography>
//                     )}
//                   </Box>
//                 </Stack>

//                 <Divider sx={{ my: 2 }} />

//                 <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
//                   <Typography variant="h6" fontWeight={900}>
//                     Total
//                   </Typography>
//                   <Typography variant="h6" fontWeight={900} color="secondary">
//                     {formatPrice(total)}
//                   </Typography>
//                 </Box>

//                 <Button
//                   variant="contained"
//                   color="secondary"
//                   fullWidth
//                   size="large"
//                   endIcon={<ArrowForward />}
//                   sx={{ py: 1.4, fontWeight: 800, mb: 1.5 }}
//                   onClick={() => {
//                     if (isAuthenticated) {
//                       navigate("/checkout");
//                     } else {
//                       navigate("/login");
//                     }
//                   }}
//                 >
//                   {isAuthenticated ? "Proceed to Checkout" : "Login to Checkout"}
//                 </Button>

//                 <Button variant="outlined" fullWidth onClick={() => navigate("/")}>
//                   Continue browsing
//                 </Button>

//                 <Box sx={{ mt: 3, p: 2, background: "#f0fdf8", borderRadius: 2 }}>
//                   <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
//                     ✓ Free shipping on orders above ₹2500
//                   </Typography>
//                   <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
//                     ✓ Secure checkout & easy returns
//                   </Typography>
//                 </Box>
//               </CardContent>
//             </Card>
//           </Grid>
//         </Grid>
//       )}
//     </Container>
//   );
// };

// export default CartPage;



// src/pages/CartPage.js
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Stack,
  Divider,
  Chip,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  useTheme,
  Collapse,
} from "@mui/material";
import { Delete as DeleteIcon, ShoppingCart as ShoppingCartIcon, LocalShipping as ShippingIcon, Percent as PercentIcon, CheckCircle as CheckIcon } from "@mui/icons-material";
import ArrowForward from "@mui/icons-material/ArrowForward";

// Keep these names in sync with your slice exports
import {
  removeFromCart,
  updateQuantity,
  clearCart,
  removeUserCartItem,
  updateUserCartItem,
  clearUserCart,
  fetchUserCart,
} from "../features/cartSlice";

// Price formatter (INR)
const fmt = (price) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
    Number(price || 0)
  );

const idOf = (it) => it._id || it.productId || it.id;

// canonical data used to compare store vs visible UI
const canonical = (it) => ({
  id: idOf(it),
  qty: Number(it.quantity || 0),
  price: Number(it.price || 0),
  discountPrice: Number(it.discountPrice ?? it.discount ?? 0),
});

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();

  const storeItems = useSelector((s) => s.cart?.items || []);
  const isAuthenticated = useSelector((s) => s.auth?.isAuthenticated || false);
  const products = useSelector((s) => s.products?.products || []);

  // visibleItems = UI's source-of-truth for instant updates
  const [visibleItems, setVisibleItems] = useState(() => (storeItems || []).map((i) => ({ ...i })));
  const [removingIds, setRemovingIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toRemove, setToRemove] = useState(null);
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "", undo: null });
  const prevSubtotalRef = useRef(0);
  const [subtotalPulse, setSubtotalPulse] = useState(false);

  // Enrich cart items with fresh product data (for current prices and discounts)
  const enrichedItems = useMemo(() => {
    return (visibleItems || []).map((item) => {
      const productId = item.productId || item._id || item.id;
      const product = products.find((p) => p._id === productId);
      
      if (product) {
        return {
          ...item,
          price: product.price || item.price,
          discountPrice: product.discountPrice || item.discountPrice,
          discount: product.discount || item.discount,
        };
      }
      return item;
    });
  }, [visibleItems, products]);

  // sync visibleItems intelligently when store changes (compare ids + qty + price + discount)
  useEffect(() => {
    const storeCanon = (storeItems || []).map(canonical).sort((a, b) => (a.id > b.id ? 1 : -1));
    const visibleCanon = (visibleItems || []).map(canonical).sort((a, b) => (a.id > b.id ? 1 : -1));
    const sStr = JSON.stringify(storeCanon);
    const vStr = JSON.stringify(visibleCanon);

    if (sStr !== vStr) {
      // Adopt store as base; keep currently removing items to allow animation
      const removingSet = new Set(removingIds);
      const keepRemoving = visibleItems.filter((it) => removingSet.has(idOf(it)));
      setVisibleItems([...storeItems.map((it) => ({ ...it })), ...keepRemoving]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeItems]);

  // initial fetch for authenticated users
  useEffect(() => {
    if (isAuthenticated) dispatch(fetchUserCart());
  }, [dispatch, isAuthenticated]);

  // Fetch products to enrich cart data and persist current prices to backend
  useEffect(() => {
    if (visibleItems.length > 0) {
      // For each cart item, update backend with current product prices/discounts
      visibleItems.forEach((item) => {
        const productId = item.productId || item._id || item.id;
        const product = products.find((p) => p._id === productId);
        
        // If product has different price or discount than what's in cart, update it
        if (product && (product.price !== item.price || product.discountPrice !== item.discountPrice)) {
          if (isAuthenticated) {
            dispatch(updateUserCartItem({ 
              productId, 
              quantity: item.quantity, 
              price: product.price,
              discountPrice: product.discountPrice,
              discount: product.discount,
            })).catch(() => {});
          } else {
            // For guest users, update local cart with current prices
            dispatch(updateQuantity({ 
              id: productId, 
              quantity: item.quantity,
              price: product.price,
              discountPrice: product.discountPrice,
            }));
          }
        }
      });
    }
  }, [products, visibleItems, isAuthenticated, dispatch]);

  // compute totals from enrichedItems (use fresh product data)
  const { subtotal, totalQty } = useMemo(() => {
    const sub = enrichedItems.reduce((acc, it) => {
      // use whichever discount field exists: discountPrice or discount
      const dp = Number(it.discountPrice ?? it.discount ?? 0);
      const price = dp > 0 ? dp : Number(it.price ?? 0);
      const qty = Number(it.quantity ?? 0);
      return acc + price * qty;
    }, 0);
    const qty = enrichedItems.reduce((acc, it) => acc + (Number(it.quantity ?? 0) || 0), 0);
    return { subtotal: sub, totalQty: qty };
  }, [enrichedItems]);

  // pulse when subtotal changes
  useEffect(() => {
    const prev = prevSubtotalRef.current;
    if (prev && prev !== subtotal) {
      setSubtotalPulse(true);
      const t = setTimeout(() => setSubtotalPulse(false), 420);
      return () => clearTimeout(t);
    }
    prevSubtotalRef.current = subtotal;
  }, [subtotal]);

  // optimistic quantity change: update visibleItems instantly; dispatch update (don't block UI)
  const handleQtyChange = (productId, value, variantId = null) => {
    const qty = Number(value);
    if (qty <= 0) return;

    setVisibleItems((prev) => prev.map((it) => (idOf(it) === productId ? { ...it, quantity: qty } : it)));

    if (isAuthenticated) dispatch(updateUserCartItem({ productId, quantity: qty, variantId })).catch(() => {});
    else dispatch(updateQuantity({ id: productId, quantity: qty }));
    setSnack({ open: true, severity: "info", message: "Quantity updated", undo: null });
  };

  // removal: collapse animation then dispatch; show undo
  const handleRemoveClick = (productId, variantId = null) => {
    setToRemove({ productId, variantId });
    setConfirmOpen(true);
  };

  const handleConfirmRemove = () => {
    if (!toRemove) return;
    const { productId, variantId } = toRemove;

    setRemovingIds((prev) => [...prev, productId]);

    setTimeout(() => {
      setVisibleItems((prev) => prev.filter((it) => idOf(it) !== productId));

      if (isAuthenticated) dispatch(removeUserCartItem({ productId, variantId })).catch(() => {});
      else dispatch(removeFromCart(productId));

      setRemovingIds((prev) => prev.filter((id) => id !== productId));

      setSnack({
        open: true,
        severity: "success",
        message: "Removed item",
        undo: async () => {
          if (isAuthenticated) await dispatch(fetchUserCart());
          else setVisibleItems((storeItems || []).map((i) => ({ ...i })));
        },
      });
    }, 360);

    setConfirmOpen(false);
    setToRemove(null);
  };

  const handleClear = () => {
    if (isAuthenticated) dispatch(clearUserCart()).catch(() => {});
    else dispatch(clearCart());
    setVisibleItems([]);
    setSnack({ open: true, severity: "warning", message: "Cart cleared", undo: null });
  };

  const handleProceed = () => {
    navigate("/checkout");
  };

  // render: fixed card size, title truncated single-line, discount handling robust
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h4" fontWeight={900} sx={{ mb: 3 }}>
        Your Cart
      </Typography>

      {visibleItems.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 12 }}>
          <Box 
            sx={{ 
              fontSize: 120, 
              mb: 3,
              animation: "float 3s ease-in-out infinite",
              "@keyframes float": {
                "0%, 100%": { transform: "translateY(0px)" },
                "50%": { transform: "translateY(-20px)" }
              }
            }}
          >
            🛒
          </Box>
          <Typography variant="h4" fontWeight={900} sx={{ mb: 2, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Your cart feels lonely 🥺
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: "auto" }}>
            Don't let it stay empty! Fill it with amazing products and exclusive deals waiting just for you.
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            onClick={() => navigate("/")}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              fontWeight: 800,
              px: 4,
              py: 1.5,
              fontSize: "1rem",
              textTransform: "none",
              boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)",
                transform: "translateY(-2px)",
                boxShadow: "0 12px 32px rgba(102, 126, 234, 0.4)"
              }
            }}
          >
            Start exploring best deals
          </Button>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {/* Items column */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              {enrichedItems.map((item) => {
                const rawPrice = Number(item.price || 0);
                // Check multiple discount fields: discountPrice, discount, product.discountPrice
                const dp = Number(item.discountPrice ?? item.discount ?? item.product?.discountPrice ?? 0);
                const hasDiscount = dp > 0 && dp < rawPrice;
                const effectivePrice = hasDiscount ? dp : rawPrice;
                const qty = Number(item.quantity || 0);
                const key = idOf(item);
                const productId = item.productId || item._id || item.id;
                const variantId = item.variant?.variantId || null;
                const displayName = (item.name || "Unnamed product") + (item.variant?.value ? ` — ${item.variant.value}` : "");
                const isRemoving = removingIds.includes(key);

                return (
                  <Collapse in={!isRemoving} timeout={360} key={key}>
                    <Card
                      elevation={0}
                      sx={{
                        display: "flex",
                        gap: 2,
                        p: 2,
                        borderRadius: 3,
                        alignItems: "center",
                        border: `1px solid ${theme.palette.mode === "dark" ? "#2b2b2b" : "#eceff1"}`,
                        background: theme.palette.mode === "dark" ? "#0c0c0c" : "linear-gradient(180deg,#fff,#fbfcfd)",
                        "&:hover": { transform: "translateY(-4px)", boxShadow: "0 10px 30px rgba(16,24,40,0.06)" },
                        height: 140, // strict fixed height so long names can't stretch card
                        boxSizing: "border-box",
                      }}
                    >
                      {/* fixed image box */}
                      <Box sx={{ width: { xs: 84, sm: 110 }, flexShrink: 0 }}>
                        <Box
                          component="img"
                          src={item.variant?.image || (item.images && item.images[0]) || "https://via.placeholder.com/300"}
                          alt={displayName}
                          sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 2 }}
                          onClick={() => navigate(`/product/${productId}`)}
                        />
                      </Box>

                      {/* text column: single-line title */}
                      <Box sx={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <Box>
                          <Typography
                            variant="subtitle1"
                            fontWeight={800}
                            sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            title={displayName}
                          >
                            {displayName}
                          </Typography>

                          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
                            <Typography variant="body2" fontWeight={700} color="secondary">
                              {fmt(effectivePrice)}
                            </Typography>

                            {hasDiscount && (
                              <>
                                <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                                  {fmt(rawPrice)}
                                </Typography>
                                <Chip
                                  label={`-${Math.round(((rawPrice - dp) / rawPrice) * 100)}%`}
                                  size="small"
                                  icon={<PercentIcon sx={{ fontSize: 14 }} />}
                                  sx={{ height: 20, background: "#ff5252", color: "#fff", fontWeight: 700, fontSize: "0.7rem" }}
                                />
                              </>
                            )}
                          </Box>
                        </Box>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body2" fontWeight={700}>
                              Qty:
                            </Typography>

                            <Select
                              value={qty}
                              size="small"
                              onChange={(e) => handleQtyChange(productId, e.target.value, variantId)}
                              sx={{ minWidth: 80 }}
                            >
                              {[...Array(10).keys()].map((x) => (
                                <MenuItem key={x + 1} value={x + 1}>
                                  {x + 1}
                                </MenuItem>
                              ))}
                            </Select>
                          </Box>

                          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} size="small" onClick={() => handleRemoveClick(productId, variantId)}>
                            Remove
                          </Button>

                          <Button variant="text" size="small" onClick={() => navigate(`/product/${productId}`)}>
                            View details
                          </Button>
                        </Stack>
                      </Box>

                      {/* price column fixed width */}
                      <Box sx={{ textAlign: "right", minWidth: 140 }}>
                        {hasDiscount && <Chip label={`-${Math.round(((rawPrice - dp) / rawPrice) * 100)}%`} size="small" sx={{ mb: 1 }} />}

                        <Typography variant="body2" color="text.secondary">
                          Item total
                        </Typography>
                        <Typography variant="h6" fontWeight={900} color="secondary">
                          {fmt(effectivePrice * qty)}
                        </Typography>
                      </Box>
                    </Card>
                  </Collapse>
                );
              })}
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
              <Button variant="outlined" color="error" onClick={handleClear}>
                Clear cart
              </Button>

              <Button variant="contained" color="primary" onClick={() => navigate("/")}>
                Continue shopping
              </Button>
            </Stack>
          </Grid>

          {/* Order summary - derives totals from enrichedItems to update instantly */}
          <Grid item xs={12} lg={4} sx={{ display: "flex", justifyContent: "center" }}>
            <Box sx={{ width: "100%", position: { md: "sticky" }, top: { md: 80 }, maxWidth: 400 }}>
              <Card elevation={0} sx={{ borderRadius: 3, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", boxShadow: "0 20px 60px rgba(102, 126, 234, 0.3)", border: "none", color: "#fff" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={900} sx={{ mb: 3, fontSize: "1.1rem" }}>
                  Order Summary
                </Typography>

                <Stack spacing={2} sx={{ mb: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2.5, p: 2.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
                      Subtotal ({totalQty} {totalQty === 1 ? "item" : "items"})
                    </Typography>

                    <Typography
                      variant="body2"
                      fontWeight={800}
                      sx={{
                        transition: "transform 220ms ease, opacity 220ms ease",
                        transform: subtotalPulse ? "scale(1.08)" : "scale(1)",
                        opacity: subtotalPulse ? 1 : 0.95,
                      }}
                    >
                      {fmt(subtotal)}
                    </Typography>
                  </Box>

                  <Divider sx={{ opacity: 0.2 }} />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PercentIcon sx={{ fontSize: 18 }} />
                      <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
                        Tax (10%)
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={800}>
                      {fmt(Math.round(subtotal * 0.1))}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <ShippingIcon sx={{ fontSize: 18 }} />
                      <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
                        Shipping
                      </Typography>
                    </Box>
                    {subtotal > 2500 ? (
                      <Chip label="FREE" size="small" sx={{ background: "#10b981", color: "#fff", fontWeight: 800, height: 24 }} />
                    ) : (
                      <Typography variant="body2" fontWeight={800}>
                        {fmt(150)}
                      </Typography>
                    )}
                  </Box>
                </Stack>

                <Box sx={{ background: "rgba(255,255,255,0.15)", borderRadius: 2, p: 2.5, mb: 3, textAlign: "center" }}>
                  <Typography variant="caption" sx={{ opacity: 0.85, display: "block", mb: 0.5, fontWeight: 600 }}>
                    Amount due
                  </Typography>
                  <Typography variant="h5" fontWeight={900} sx={{ fontSize: "1.8rem" }}>
                    {fmt(Math.round(subtotal + subtotal * 0.1 + (subtotal > 2500 ? 0 : 150)))}
                  </Typography>
                </Box>

                <Button 
                  variant="contained" 
                  fullWidth 
                  size="large" 
                  endIcon={<ArrowForward />} 
                  sx={{ 
                    mb: 1.5,
                    background: "#fff",
                    color: "#667eea",
                    fontWeight: 800,
                    textTransform: "none",
                    fontSize: "1rem",
                    py: 1.5,
                    "&:hover": {
                      background: "#f5f5f5",
                      transform: "translateY(-2px)",
                      boxShadow: "0 12px 24px rgba(0,0,0,0.15)"
                    }
                  }} 
                  onClick={handleProceed}
                >
                  Proceed to Checkout
                </Button>

                <Button 
                  variant="outlined" 
                  fullWidth 
                  sx={{
                    borderColor: "rgba(255,255,255,0.5)",
                    color: "#fff",
                    fontWeight: 700,
                    textTransform: "none",
                    py: 1,
                    "&:hover": {
                      background: "rgba(255,255,255,0.1)",
                      borderColor: "#fff"
                    }
                  }}
                  onClick={() => navigate("/")}
                >
                  Continue shopping
                </Button>

                <Box sx={{ mt: 3, p: 2.5, background: "rgba(255,255,255,0.12)", borderRadius: 2.5, border: "1px solid rgba(255,255,255,0.2)" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <CheckIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                      Free shipping on orders above ₹2,500
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                      Secure checkout & 30-day returns
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* Confirm remove dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Remove item</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this item from your cart?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmRemove}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snack with optional undo */}
      <Snackbar open={snack.open} autoHideDuration={3200} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: "100%" }}
          action={
            snack.undo ? (
              <Button
                color="inherit"
                size="small"
                onClick={async () => {
                  setSnack((s) => ({ ...s, open: false }));
                  await snack.undo();
                }}
              >
                UNDO
              </Button>
            ) : null
          }
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
