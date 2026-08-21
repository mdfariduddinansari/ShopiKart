


import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  InputBase,
  IconButton,
  Badge,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  Avatar,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Typography,
  Stack,
  Chip,
  useMediaQuery,
} from "@mui/material";
import {
  ShoppingCart,
  AccountCircle,
  Search,
  Brightness4,
  Brightness7,
  Favorite,
  FavoriteBorder,
  ReceiptLong,
  Logout,
  Dashboard,
  Person,
  Inventory2,
  CardGiftcard,
} from "@mui/icons-material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/authSlice";
import { clearLocalCart } from "../features/cartSlice";
import NotificationBell from "./NotificationBell";
import { useTheme } from "../context/ThemeContext";
import VoiceSearch from "./VoiceSearch";

const categories = ["All", "Electronics", "Fashion", "Home", "Books", "Toys", "Sports"];

const Header = () => {
  const { items } = useSelector((state) => state.cart);
  const { user, orders } = useSelector((state) => state.auth || {});
  const wishlistCount = useSelector((state) => state.wishlist.items?.length || 0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  const [searchTerm, setSearchTerm] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // small pulses for wishlist/cart when counts change
  const [wishPulse, setWishPulse] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);

  // Detect scroll to shrink navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setWishPulse(true);
    const t = setTimeout(() => setWishPulse(false), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlistCount]);

  useEffect(() => {
    setCartPulse(true);
    const t = setTimeout(() => setCartPulse(false), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items?.length]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearLocalCart());
    handleMenuClose();
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
    }
  };

  // Determine active category from URL
  const query = new URLSearchParams(location.search);
  const urlCategory = query.get("category");
  const activeCategory = urlCategory || (location.pathname === "/" ? "All" : "");

  // Derived counts
  const ordersCount = orders?.length || 0;

  return (
    <AppBar
      position="sticky"
      elevation={isScrolled ? 12 : 6}
      sx={{
        background: isDarkMode
          ? "linear-gradient(135deg, rgba(20,20,30,1) 0%, rgba(30,20,40,1) 100%)"
          : "linear-gradient(135deg, #004d40 0%, #00695c 100%)",
        top: 0,
        zIndex: 1100,
        overflow: "hidden",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDarkMode
            ? "none"
            : "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
          pointerEvents: "none",
        },
      }}
    >
      {/* Indian Tricolor Stripe */}
      <Box sx={{ display: 'flex', width: '100%', height: 3 }}>
        <Box sx={{ flex: 1, background: '#FF9933' }} />
        <Box sx={{ flex: 1, background: '#FFFFFF' }} />
        <Box sx={{ flex: 1, background: '#138808' }} />
      </Box>
      {/* Top toolbar */}
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: { xs: "wrap", sm: "nowrap" },
          rowGap: { xs: 0.75, sm: 0 },
          gap: { xs: 0.8, sm: 1.5, md: 2 },
          px: { xs: 0.75, sm: 2, md: 4 },
          py: isScrolled ? { xs: 0.25, sm: 0.4 } : { xs: 0.5, sm: 0.75 },
          minHeight: isScrolled ? { xs: 56, sm: 60 } : { xs: 64, sm: 70 },
          position: "relative",
          zIndex: 2,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Logo / Brand */}
        <Box
          component={Link}
          to="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            textDecoration: "none",
            minWidth: 0,
            order: { xs: 1, sm: 1 },
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              transform: "scale(1.05)",
            },
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="ShopiKart Logo"
            sx={{
              height: isScrolled 
                ? { xs: 32, sm: 38, md: 44 } 
                : { xs: 36, sm: 44, md: 52 },
              width: "auto",
              objectFit: "contain",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          <Typography
            variant="h6"
            sx={{
              color: "white",
              fontSize: isScrolled 
                ? { xs: 15, sm: 22, md: 26 } 
                : { xs: 16, sm: 24, md: 28 },
              fontWeight: 800,
              letterSpacing: 0.8,
              textTransform: "none",
              background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.95) 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            ShopiKart
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: { xs: 0, sm: 0, md: '0.6rem' },
              fontWeight: 600,
              letterSpacing: 0.5,
              display: { xs: 'none', md: 'block' },
              lineHeight: 1,
              mt: -0.3,
            }}
          >
            🇮🇳 Made in India
          </Typography>
        </Box>

        {/* Search bar */}
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{
            display: "flex",
            alignItems: "center",
            width: { xs: "100%", sm: 300, md: 380 },
            maxWidth: { xs: "100%", sm: 600 },
            order: { xs: 3, sm: 2 },
            mt: { xs: 0.25, sm: 0 },
            backgroundColor: "rgba(255,255,255,0.95)",
            borderRadius: 2,
            px: { xs: 0.75, sm: 1 },
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            py: isScrolled ? 0.15 : 0.25,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,1)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
            },
            "&:focus-within": {
              backgroundColor: "rgba(255,255,255,1)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
            },
          }}
        >
          <InputBase
            placeholder={isMobile ? "Search products..." : "Search products, brands..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              flex: 1,
              pl: { xs: 0.5, sm: 1 },
              fontSize: { xs: "0.78rem", sm: "0.9rem" },
            }}
            inputProps={{ "aria-label": "search products" }}
          />
          <VoiceSearch />
          <IconButton
            type="submit"
            sx={{
              backgroundColor: "#00695c",
              color: "#fff",
              p: 1,
              mr: 0.5,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: "0 4px 12px rgba(0, 105, 92, 0.3)",
              "&:hover": { 
                backgroundColor: "#004d40",
                transform: "scale(1.05)",
                boxShadow: "0 6px 20px rgba(0, 105, 92, 0.4)",
              },
            }}
            aria-label="search"
            size="medium"
          >
            <Search fontSize="small" sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Right icons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.25, sm: 1.5 }, ml: { xs: "auto", sm: 0 }, order: { xs: 2, sm: 3 } }}>
          <NotificationBell />

          <Tooltip title={isDarkMode ? "Light mode" : "Dark mode"}>
            <IconButton
              onClick={toggleTheme}
              sx={{
                color: "white",
                borderRadius: 1,
                p: { xs: 0.72, sm: 1 },
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.15)",
                  transform: "scale(1.08)",
                },
              }}
              aria-label="toggle theme"
              size="large"
            >
              {isDarkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          {user ? (
            <>
              {/* Account button */}
              <Button
                color="inherit"
                onClick={handleMenuOpen}
                startIcon={isMobile ? null : <AccountCircle />}
                sx={{
                  color: "white",
                  textTransform: "none",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  minWidth: { xs: 0, sm: "auto" },
                  px: { xs: 0.5, sm: 1.5 },
                }}
                aria-controls={Boolean(anchorEl) ? "account-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={Boolean(anchorEl) ? "true" : undefined}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar sx={{ width: 30, height: 30, bgcolor: "#fff", color: "#00695c", fontWeight: 800 }}>
                    {user.name?.[0]?.toUpperCase() || <AccountCircle />}
                  </Avatar>
                  <Box sx={{ display: { xs: "none", sm: "block" } }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "white" }}>{user.name?.split(" ")[0] || "Account"}</Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)" }}>{user.email?.split?.("@")?.[0] || ""}</Typography>
                  </Box>
                </Box>
              </Button>

              {/* Styled menu */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  elevation: 12,
                  sx: {
                    mt: 1.5,
                    minWidth: { xs: 252, sm: 280 },
                    borderRadius: 2.5,
                    overflow: "hidden",
                    p: 0,
                    backdropFilter: "blur(20px)",
                    background: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(0, 105, 92, 0.1)",
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <Paper sx={{ p: 2, bgcolor: "background.paper", borderBottom: "1px solid rgba(0, 105, 92, 0.1)" }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: "linear-gradient(135deg, #004d40 0%, #00695c 100%)", color: "#fff", width: 48, height: 48, fontWeight: 800 }}>
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{user.name || "User"}</Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>{user.email}</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip label={user.isAdmin ? "Admin" : user.seller ? "Seller" : "Customer"} size="small" />
                      </Box>
                    </Box>
                  </Stack>
                </Paper>

                {/* Action list */}
                <Box sx={{ p: 1 }}>
                  <MenuItem component={Link} to="/profile" onClick={handleMenuClose} sx={{ borderRadius: 1, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", "&:hover": { bgcolor: "rgba(0, 105, 92, 0.08)" } }}>
                    <ListItemIcon>
                      <Person fontSize="small" sx={{ color: "#00695c" }} />
                    </ListItemIcon>
                    <ListItemText>
                      <Typography sx={{ fontWeight: 800 }}>Profile</Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>Manage account</Typography>
                    </ListItemText>
                  </MenuItem>

                  <MenuItem component={Link} to="/orders" onClick={handleMenuClose} sx={{ borderRadius: 1, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", "&:hover": { bgcolor: "rgba(0, 105, 92, 0.08)" } }}>
                    <ListItemIcon>
                      <ReceiptLong fontSize="small" sx={{ color: "#00695c" }} />
                    </ListItemIcon>
                    <ListItemText>
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Typography sx={{ fontWeight: 800 }}>My Orders</Typography>
                        <Chip label={ordersCount} size="small" sx={{ bgcolor: "rgba(0, 105, 92, 0.15)", color: "#00695c", fontWeight: 800 }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>Track or manage orders</Typography>
                    </ListItemText>
                  </MenuItem>

                  <MenuItem component={Link} to="/wishlist" onClick={handleMenuClose} sx={{ borderRadius: 1, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", "&:hover": { bgcolor: "rgba(0, 105, 92, 0.08)" } }}>
                    <ListItemIcon>
                      <Badge color={wishlistCount > 0 ? "error" : "default"} badgeContent={wishlistCount}>
                        {wishlistCount > 0 ? <Favorite sx={{ color: "#ff1744" }} /> : <FavoriteBorder sx={{ color: "#ccc" }} />}
                      </Badge>
                    </ListItemIcon>
                    <ListItemText>
                      <Typography sx={{ fontWeight: 800 }}>Wishlist</Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>Saved items</Typography>
                    </ListItemText>
                  </MenuItem>

                  <MenuItem component={Link} to="/referrals" onClick={handleMenuClose} sx={{ borderRadius: 1, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", "&:hover": { bgcolor: "rgba(255, 107, 107, 0.08)" } }}>
                    <ListItemIcon>
                      <CardGiftcard fontSize="small" sx={{ color: "#ff6b6b" }} />
                    </ListItemIcon>
                    <ListItemText>
                      <Typography sx={{ fontWeight: 800 }}>🎁 Refer & Earn</Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>Invite friends and get rewards</Typography>
                    </ListItemText>
                  </MenuItem>

                  {/* Seller/Admin shortcuts */}
                  {user.seller && (
                    <MenuItem component={Link} to="/seller/dashboard" onClick={handleMenuClose} sx={{ borderRadius: 1, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", "&:hover": { bgcolor: "rgba(0, 105, 92, 0.08)" } }}>
                      <ListItemIcon>
                        <Inventory2 fontSize="small" sx={{ color: "#00695c" }} />
                      </ListItemIcon>
                      <ListItemText>
                        <Typography sx={{ fontWeight: 800 }}>Seller Dashboard</Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>Manage products</Typography>
                      </ListItemText>
                    </MenuItem>
                  )}

                  {user.isAdmin && (
                    <MenuItem component={Link} to="/admin" onClick={handleMenuClose} sx={{ borderRadius: 1, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", "&:hover": { bgcolor: "rgba(0, 105, 92, 0.08)" } }}>
                      <ListItemIcon>
                        <Dashboard fontSize="small" sx={{ color: "#00695c" }} />
                      </ListItemIcon>
                      <ListItemText>
                        <Typography sx={{ fontWeight: 800 }}>Admin Dashboard</Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>Site administration</Typography>
                      </ListItemText>
                    </MenuItem>
                  )}
                </Box>

                <Divider />

                <Box sx={{ p: 1 }}>
                  <MenuItem onClick={handleLogout} sx={{ borderRadius: 1, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", "&:hover": { bgcolor: "rgba(255, 87, 87, 0.08)" } }}>
                    <ListItemIcon>
                      <Logout fontSize="small" sx={{ color: "#ff5757" }} />
                    </ListItemIcon>
                    <ListItemText>
                      <Typography sx={{ fontWeight: 800, color: "#ff5757" }}>Logout</Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>Sign out from this account</Typography>
                    </ListItemText>
                  </MenuItem>
                </Box>
              </Menu>

              {/* Wishlist heart — outlined when empty, filled & red when has items */}
              <Tooltip title="Wishlist">
                <IconButton
                  component={Link}
                  to="/wishlist"
                  sx={{
                    color: wishlistCount > 0 ? "#ff1744" : "white",
                    transform: wishPulse ? "scale(1.12)" : "scale(1)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "scale(1.15)",
                      bgcolor: "rgba(255,255,255,0.15)",
                    },
                    borderRadius: 1,
                    p: { xs: 0.72, sm: 1 },
                  }}
                  aria-label="open wishlist"
                  size="large"
                >
                  <Badge
                    badgeContent={wishlistCount}
                    color={wishlistCount > 0 ? "error" : "default"}
                    sx={{
                      ".MuiBadge-badge": {
                        fontWeight: 700,
                        transform: "translate(8px, -6px)",
                      },
                    }}
                  >
                    {wishlistCount > 0 ? <Favorite /> : <FavoriteBorder />}
                  </Badge>
                </IconButton>
              </Tooltip>
            </>
          ) : (
            isMobile ? (
              <IconButton
                component={Link}
                to="/login"
                sx={{
                  color: "white",
                  borderRadius: 1,
                  p: 1,
                }}
                aria-label="open account"
                size="large"
              >
                <AccountCircle />
              </IconButton>
            ) : (
              <Button
                component={Link}
                to="/login"
                color="inherit"
                startIcon={<AccountCircle />}
                sx={{
                  color: "white",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Account
              </Button>
            )
          )}

          {/* Cart button */}
          <Tooltip title="Cart">
            <IconButton
              component={Link}
              to="/cart"
              sx={{
                color: items?.length > 0 ? "white" : "white",
                position: "relative",
                transform: cartPulse ? "scale(1.08)" : "scale(1)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  transform: "scale(1.12)",
                  bgcolor: "rgba(255,255,255,0.15)",
                },
                borderRadius: 1,
                p: { xs: 0.72, sm: 1 },
              }}
              aria-label="view cart"
              size="large"
            >
              <Badge
                badgeContent={items?.length || 0}
                color={items?.length > 0 ? "error" : "secondary"}
                sx={{
                  ".MuiBadge-badge": {
                    minWidth: 18,
                    height: 18,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    transform: "translate(10px, -6px)",
                  },
                }}
              >
                <ShoppingCart
                  sx={{
                    color: items?.length > 0 ? "#fff" : "inherit",
                    opacity: items?.length > 0 ? 1 : 0.95,
                  }}
                />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Categories row - buttons evenly spaced */}
      <Toolbar
        component="nav"
        variant="dense"
        sx={{
          backgroundColor: isDarkMode ? "#070707" : "rgba(0,0,0,0.1)",
          backdropFilter: "blur(10px)",
          minHeight: isScrolled ? { xs: 32, sm: 36 } : { xs: 36, sm: 40 },
          px: { xs: 0.25, sm: 2, md: 4 },
          gap: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          position: "relative",
          zIndex: 2,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            width: "100%",
            alignItems: "stretch",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            overscrollBehaviorX: "contain",
            "&::-webkit-scrollbar": { height: 6 },
            "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.12)", borderRadius: 2 },
          }}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const to = cat === "All" ? "/" : `/?category=${encodeURIComponent(cat)}`;

            return (
              <Button
                key={cat}
                component={Link}
                to={to}
                size="small"
                aria-current={isActive ? "true" : undefined}
                sx={{
                  flex: { xs: "0 0 auto", sm: 1 },
                  minWidth: { xs: 84, sm: 0 },
                  py: { xs: 0.5, sm: 0.75 },
                  px: { xs: 1, sm: 1.5 },
                  fontSize: { xs: "0.72rem", sm: "0.84rem" },
                  color: isActive ? "#fff" : "rgba(255,255,255,0.85)",
                  textTransform: "none",
                  fontWeight: isActive ? 700 : 600,
                  whiteSpace: "nowrap",
                  scrollSnapAlign: "start",
                  letterSpacing: 0.2,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 0,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: isActive ? "0 6px 18px rgba(0,0,0,0.15)" : "none",
                  transform: isActive ? "translateY(-2px)" : "translateY(0)",
                  bgcolor: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.1)",
                    transform: isActive ? "translateY(-3px)" : "translateY(-2px)",
                  },
                  borderBottom: isActive ? "3px solid rgba(255,255,255,0.9)" : "3px solid transparent",
                }}
              >
                {cat}
              </Button>
            );
          })}

          <Button
            component={Link}
            to="/rental"
            sx={{
              flex: { xs: "0 0 auto", sm: 1 },
              minWidth: { xs: 84, sm: 0 },
              py: { xs: 0.5, sm: 0.75 },
              px: { xs: 1, sm: 1.5 },
              fontSize: { xs: "0.72rem", sm: "0.84rem" },
              color: "rgba(255,255,255,0.85)",
              textTransform: "none",
              fontWeight: 600,
              whiteSpace: "nowrap",
              scrollSnapAlign: "start",
              letterSpacing: 0.2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 0,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.1)",
                transform: "translateY(-2px)",
              },
              borderBottom: "3px solid transparent",
            }}
            size="small"
          >
            Rentals
          </Button>

          <Button
            component={Link}
            to="/reels"
            sx={{
              flex: { xs: "0 0 auto", sm: 1 },
              minWidth: { xs: 84, sm: 0 },
              py: { xs: 0.5, sm: 0.75 },
              px: { xs: 1, sm: 1.5 },
              fontSize: { xs: "0.72rem", sm: "0.84rem" },
              color: "rgba(255,255,255,0.85)",
              textTransform: "none",
              fontWeight: 600,
              whiteSpace: "nowrap",
              scrollSnapAlign: "start",
              letterSpacing: 0.2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 0,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.1)",
                transform: "translateY(-2px)",
              },
              borderBottom: "3px solid transparent",
            }}
            size="small"
          >
            🎬 Reels
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
