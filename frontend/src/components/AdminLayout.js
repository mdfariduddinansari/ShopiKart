// src/components/AdminLayout.js
import React from "react";
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Divider, Button } from "@mui/material";
import { Dashboard, Inventory, People, ShoppingCart, AirportShuttle, AddBox, Logout, LocalOffer, Analytics, Warehouse, AssignmentReturn, VerifiedUser, AccountBalance } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../features/authSlice";
import { clearLocalCart } from "../features/cartSlice";

const menuItems = [
  { text: "Dashboard", icon: <Dashboard />, path: "/admin", emoji: "📊" },
  { text: "Analytics", icon: <Analytics />, path: "/admin/analytics", emoji: "📈" },
  { text: "Products", icon: <Inventory />, path: "/admin/products", emoji: "📦" },
  { text: "Inventory", icon: <Warehouse />, path: "/admin/inventory", emoji: "🏭" },
  { text: "Rental Items", icon: <AddBox />, path: "/admin/rental-items", emoji: "🎁" },
  { text: "Rental Bookings", icon: <AirportShuttle />, path: "/admin/rental-bookings", emoji: "📅" },
  { text: "Identity Verifications", icon: <VerifiedUser />, path: "/admin/identity-verifications", emoji: "🔐" },
  { text: "Deposit Management", icon: <AccountBalance />, path: "/admin/deposit-management", emoji: "💰" },
  { text: "Users", icon: <People />, path: "/admin/users", emoji: "👥" },
  { text: "Orders", icon: <ShoppingCart />, path: "/admin/orders", emoji: "📋" },
  { text: "Returns", icon: <AssignmentReturn />, path: "/admin/returns", emoji: "🔄" },
  { text: "Coupons", icon: <LocalOffer />, path: "/admin/coupons", emoji: "🎟️" },
];

const drawerWidth = 280;

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearLocalCart());
    navigate("/login");
  };

  return (
    <Box sx={{ display: "flex", width: "100%", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
            color: "#fff",
            position: "fixed",
            top: 0,
            height: "100vh",
            border: "none",
            boxShadow: "2px 0 15px rgba(0,0,0,0.2)",
            overflowY: "auto",
            scrollBehavior: "smooth",
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "rgba(255,255,255,0.05)",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#667eea",
              borderRadius: "3px",
              "&:hover": {
                background: "#764ba2",
              },
            },
          },
        }}
      >
        {/* Logo/Header Section */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            py: 2,
            px: 0,
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              fontSize: "1.3rem",
              letterSpacing: "0.5px",
              mb: 0.5,
            }}
          >
            🚀 Shop Admin
          </Typography>
          <Typography
            variant="caption"
            sx={{
              opacity: 0.9,
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Control Panel
          </Typography>
        </Box>

        <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)", my: 0 }} />

        {/* Menu Items */}
        <List sx={{ py: 1, px: 0, flex: 1 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.text}
                onClick={() => navigate(item.path)}
                sx={{
                  my: 0.8,
                  mx: 0,
                  borderRadius: 0,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  background: isActive
                    ? "linear-gradient(90deg, rgba(102,126,234,0.25) 0%, transparent 100%)"
                    : "transparent",
                  color: isActive ? "#fff" : "#9ca3af",
                  fontWeight: isActive ? 700 : 500,
                  position: "relative",
                  overflow: "hidden",
                  borderLeft: isActive ? "3px solid #10b981" : "3px solid transparent",
                  pl: "calc(2rem - 3px)",
                  pr: 2,
                  py: 1.5,
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: "100%",
                    background: "linear-gradient(90deg, rgba(102,126,234,0.1) 0%, transparent 100%)",
                    opacity: 0,
                    transition: "opacity 0.3s ease",
                  },
                  "&:hover": {
                    backgroundColor: "transparent",
                    color: "#fff",
                    fontWeight: 600,
                    "&::before": {
                      opacity: 1,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? "#667eea" : "inherit",
                    minWidth: 40,
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1.4rem",
                    transition: "color 0.3s ease",
                  }}
                >
                  <span>{item.emoji}</span>
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    "& .MuiTypography-root": {
                      fontSize: "0.95rem",
                      fontWeight: "inherit",
                      letterSpacing: "0.4px",
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)", my: 1 }} />

        {/* Logout Button */}
        <Box sx={{ p: 2, px: 2 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleLogout}
            startIcon={<Logout fontSize="small" />}
            sx={{
              background: "linear-gradient(135deg, #ff5757 0%, #d32f2f 100%)",
              color: "white",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 1.5,
              py: 1.2,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                background: "linear-gradient(135deg, #ff7070 0%, #e53935 100%)",
                transform: "translateY(-2px)",
                boxShadow: "0 8px 20px rgba(255, 87, 87, 0.3)",
              },
            }}
          >
            Logout
          </Button>
        </Box>

        {/* Footer Info */}
        <Box
          sx={{
            p: 2,
            mt: "auto",
            textAlign: "center",
            bgcolor: "rgba(102, 126, 234, 0.05)",
            borderRadius: 0,
            mx: 0,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "#9ca3af",
              fontSize: "0.75rem",
              fontWeight: 600,
              display: "block",
              mb: 0.5,
            }}
          >
            📍 SHOPIKART ADMIN
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#6b7280",
              fontSize: "0.7rem",
              opacity: 0.8,
            }}
          >
            v1.0 Management Suite
          </Typography>
        </Box>
      </Drawer>

      {/* Page Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: "#f3f4f6",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
