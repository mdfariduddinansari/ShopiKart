import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
} from "@mui/material";
import { Notifications as NotificationsIcon, Close } from "@mui/icons-material";
import api from "../services/api";

const NotificationBell = () => {
  const { isAuthenticated } = useSelector((state) => state.auth || {});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/notifications?read=false");
      setNotifications(Array.isArray(data) ? data : []);
      setUnreadCount(data.length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post("/notifications/read/all");
      fetchNotifications();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      fetchNotifications();
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const getNotificationColor = (type) => {
    const colors = {
      booking_confirmed: "success",
      booking_cancelled: "error",
      payment_received: "success",
      rental_started: "info",
      rental_reminder: "warning",
      rental_completed: "success",
      return_pending: "warning",
      damage_reported: "error",
      refund_processed: "success",
      booking_updated: "info",
      purchase_completed: "success",
      rental_item_added_to_cart: "info",
      product_wishlisted: "secondary",
    };
    return colors[type] || "default";
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleOpenMenu}
        sx={{ position: "relative" }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            width: { xs: "calc(100vw - 24px)", sm: 350 },
            maxWidth: 350,
            maxHeight: 500,
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight={700}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </Box>

        <Divider />

        {/* Notifications List */}
        {loading ? (
          <MenuItem disabled>Loading...</MenuItem>
        ) : notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="textSecondary">
              No new notifications
            </Typography>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <Box
              key={notification._id}
              sx={{
                p: 2,
                borderBottom: "1px solid #eee",
                "&:hover": { bgcolor: "#f9f9f9" },
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 1,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Chip
                    label={notification.type}
                    size="small"
                    color={getNotificationColor(notification.type)}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  {notification.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                  {notification.message}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                  {new Date(notification.createdAt).toLocaleDateString()}{" "}
                  {new Date(notification.createdAt).toLocaleTimeString()}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                {!notification.read && (
                  <Button
                    size="small"
                    onClick={() => markAsRead(notification._id)}
                    sx={{ minWidth: "auto" }}
                  >
                    ✓
                  </Button>
                )}
                <IconButton
                  size="small"
                  onClick={() => deleteNotification(notification._id)}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
