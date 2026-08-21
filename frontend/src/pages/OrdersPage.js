import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Divider,
  Stack,
  useTheme,
  Select,
  MenuItem,
} from "@mui/material";
import {
  AccessTime as PendingIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelledIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  AssignmentReturn as ReturnIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { fetchUserOrders } from "../features/authSlice";
import api from "../services/api";

const formatPrice = (price) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const OrdersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated, user } = useSelector((state) => state.auth || {});
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Return dialog states
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [processingReturn, setProcessingReturn] = useState(false);

  // Group orders by status
  const ordersByStatus = useMemo(() => {
    const sortByDateDesc = (orderArray) => {
      return [...orderArray].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    return {
      pending: sortByDateDesc(orders.filter((o) => o.status === "pending" || !o.status)),
      processing: sortByDateDesc(orders.filter((o) => o.status === "processing" || o.status === "shipped")),
      delivered: sortByDateDesc(orders.filter((o) => o.status === "delivered")),
      cancelled: sortByDateDesc(orders.filter((o) => o.status === "cancelled")),
    };
  }, [orders]);

  useEffect(() => {
    // Check if user token exists in localStorage
    const userToken = localStorage.getItem('userToken');
    
    // If no token exists and not authenticated, redirect to login
    if (!userToken && !isAuthenticated) {
      navigate("/login");
      return;
    }

    // If authenticated, fetch data
    if (isAuthenticated) {
      fetchOrders();
      fetchRentalBookings();
    }
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const resultAction = await dispatch(fetchUserOrders());

      if (fetchUserOrders.fulfilled.match(resultAction)) {
        setOrders(resultAction.payload);
      } else {
        setError(resultAction.payload || "Failed to fetch orders");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchRentalBookings = async () => {
    try {
      const { data } = await api.get("/bookings/user/bookings");
      // Only show confirmed bookings (not awaiting_payment)
      const confirmedBookings = data?.filter(
        (booking) => booking.bookingStatus !== "awaiting_payment"
      ) || [];
      setBookings(confirmedBookings);
    } catch (err) {
      console.error("Failed to fetch rental bookings:", err);
      setBookings([]);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        setLoading(true);
        await api.post(`/orders/${orderId}/cancel`);
        setSuccessMessage("Order cancelled successfully!");
        await fetchOrders();
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to cancel order");
        setTimeout(() => setError(""), 3000);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePaymentDialogOpen = (order) => {
    setSelectedOrder(order);
    setPaymentDialogOpen(true);
  };

  const handlePaymentDialogClose = () => {
    setPaymentDialogOpen(false);
    setSelectedOrder(null);
    setPaymentData({ cardNumber: "", expiryDate: "", cvv: "" });
  };

  const handleProcessPayment = async () => {
    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv) {
      setError("Please fill in all payment details");
      return;
    }

    try {
      setProcessingPayment(true);
      await api.post(`/orders/payment/process`, {
        orderId: selectedOrder._id,
        ...paymentData,
      });
      setSuccessMessage("Payment processed successfully!");
      handlePaymentDialogClose();
      await fetchOrders();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed");
      setTimeout(() => setError(""), 3000);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Return handling functions
  const handleReturnDialogOpen = (order) => {
    setSelectedReturnOrder(order);
    setReturnDialogOpen(true);
    setReturnReason("");
  };

  const handleReturnDialogClose = () => {
    setReturnDialogOpen(false);
    setSelectedReturnOrder(null);
    setReturnReason("");
  };

  const handleRequestReturn = async () => {
    if (!returnReason.trim()) {
      setError("Please provide a reason for return");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Check if user is authenticated
    const token = localStorage.getItem('userToken');
    if (!token) {
      setError("You are not logged in. Please login again.");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    try {
      setProcessingReturn(true);
      console.log('🔄 Requesting return for order:', selectedReturnOrder._id);
      console.log('📝 Return reason:', returnReason);
      console.log('🔐 Auth token exists:', !!token);
      console.log('📦 Order details:', {
        isDelivered: selectedReturnOrder.isDelivered,
        deliveredAt: selectedReturnOrder.deliveredAt,
        returnStatus: selectedReturnOrder.returnStatus,
        status: selectedReturnOrder.status
      });
      console.log('🌐 API URL:', `http://localhost:5000/api/orders/${selectedReturnOrder._id}/return/request`);
      
      const response = await api.post(`/orders/${selectedReturnOrder._id}/return/request`, {
        reason: returnReason,
      });
      
      console.log('✅ Return request successful:', response.data);
      setSuccessMessage("Return request submitted successfully! Our team will review it shortly.");
      handleReturnDialogClose();
      await fetchOrders();
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error('❌ Return request failed - Full error:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error data:', err.response?.data);
      console.error('❌ Status code:', err.response?.status);
      console.error('❌ Request config:', err.config);
      
      let errorMessage = "Failed to submit return request";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = "Your session has expired. Please login again.";
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to return this order.";
      } else if (err.response?.status === 404) {
        errorMessage = "Order not found.";
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.message || "Invalid return request.";
      } else if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        errorMessage = "Cannot connect to server. Please ensure:\n1. Backend server is running (http://localhost:5000)\n2. You have internet connection\n3. Try refreshing the page";
      } else if (!err.response) {
        errorMessage = "Server is not responding. Please check if backend is running.";
      }
      
      console.error('❌ Showing error to user:', errorMessage);
      setError(errorMessage);
      setTimeout(() => setError(""), 8000);
    } finally {
      setProcessingReturn(false);
    }
  };

  const handleCancelReturn = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel this return request?")) {
      try {
        setLoading(true);
        await api.post(`/orders/${orderId}/return/cancel`);
        setSuccessMessage("Return request cancelled successfully!");
        await fetchOrders();
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to cancel return request");
        setTimeout(() => setError(""), 3000);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: "warning",
      processing: "info",
      shipped: "primary",
      delivered: "success",
      cancelled: "error",
    };
    return statusColors[status] || "default";
  };

  const getPaymentBadge = (isPaid) => {
    return isPaid ? (
      <Chip label="Paid" color="success" size="small" />
    ) : (
      <Chip label="Pending Payment" color="error" size="small" />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}>
        <CircularProgress sx={{ color: "#667eea" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", py: 5 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h3" fontWeight={900} sx={{ mb: 1, color: "#667eea" }}>
            My Orders & Rentals
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: "1.05rem" }}>
            Track and manage your shopping orders and rental bookings
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 4, borderRadius: 3, background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              "& .MuiTab-root": {
                fontWeight: 700,
                fontSize: "1rem",
                textTransform: "none",
                "&.Mui-selected": { color: "#667eea" },
              },
              "& .MuiTabs-indicator": { backgroundColor: "#667eea", height: 4 },
            }}
          >
            <Tab
              label={`Shopping Orders (${orders.length})`}
              value="orders"
              sx={{ py: 2 }}
            />
            <Tab
              label={`Rental Bookings (${bookings.length})`}
              value="rentals"
              sx={{ py: 2 }}
            />
          </Tabs>
        </Paper>

        {/* Shopping Orders Tab */}
        {activeTab === "orders" && (
          <>
            {orders.length === 0 ? (
              <Card
                elevation={0}
                sx={{
                  p: 5,
                  textAlign: "center",
                  borderRadius: 3,
                  background: "#fff",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <ShippingIcon sx={{ fontSize: 80, color: "#ccc", mb: 2 }} />
                <Typography variant="h6" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
                  No orders yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  You haven't placed any orders. Start shopping to see them here!
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "#fff",
                    fontWeight: 800,
                    textTransform: "none",
                  }}
                  onClick={() => navigate("/")}
                >
                  Start Shopping
                </Button>
              </Card>
            ) : (
              <Stack spacing={4}>
                {/* Status Filter Dropdown */}
                <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
                  <Typography fontWeight={700} color="text.secondary">
                    Filter by Status:
                  </Typography>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{
                      minWidth: 200,
                      borderRadius: 1.5,
                      background: "#fff",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#667eea",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#667eea",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#667eea",
                      },
                      "& .MuiSvgIcon-root": {
                        color: "#667eea",
                      },
                    }}
                  >
                    <MenuItem value="all">All Orders</MenuItem>
                    <MenuItem value="pending">Confirmed</MenuItem>
                    <MenuItem value="processing">Processing & Shipped</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </Box>

                {/* Pending Orders Section */}
                {(statusFilter === "all" || statusFilter === "pending") && ordersByStatus.pending.length > 0 && (
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                      <Box
                        sx={{
                          background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                          borderRadius: "50%",
                          p: 1.5,
                          color: "#fff",
                        }}
                      >
                        <PendingIcon sx={{ fontSize: 24 }} />
                      </Box>
                      <Typography variant="h6" fontWeight={800} sx={{ color: "#f59e0b" }}>
                        Confirmed Orders ({ordersByStatus.pending.length})
                      </Typography>
                    </Box>
                    <Stack spacing={3}>
                      {ordersByStatus.pending.map((order) => (
                        <OrderCard
                          key={order._id}
                          order={order}
                          onCancel={handleCancelOrder}
                          onRequestReturn={handleReturnDialogOpen}
                          onCancelReturn={handleCancelReturn}
                          isExpanded={expandedOrders[order._id]}
                          onToggleExpand={(orderId) => setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }))}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Processing/Shipped Orders Section */}
                {(statusFilter === "all" || statusFilter === "processing") && ordersByStatus.processing.length > 0 && (
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                      <Box
                        sx={{
                          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                          borderRadius: "50%",
                          p: 1.5,
                          color: "#fff",
                        }}
                      >
                        <ScheduleIcon sx={{ fontSize: 24 }} />
                      </Box>
                      <Typography variant="h6" fontWeight={800} sx={{ color: "#2563eb" }}>
                        Processing & Shipped ({ordersByStatus.processing.length})
                      </Typography>
                    </Box>
                    <Stack spacing={3}>
                      {ordersByStatus.processing.map((order) => (
                        <OrderCard
                          key={order._id}
                          order={order}
                          onCancel={handleCancelOrder}
                          onRequestReturn={handleReturnDialogOpen}
                          onCancelReturn={handleCancelReturn}
                          isExpanded={expandedOrders[order._id]}
                          onToggleExpand={(orderId) => setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }))}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Delivered Orders Section */}
                {(statusFilter === "all" || statusFilter === "delivered") && ordersByStatus.delivered.length > 0 && (
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                      <Box
                        sx={{
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          borderRadius: "50%",
                          p: 1.5,
                          color: "#fff",
                        }}
                      >
                        <CompleteIcon sx={{ fontSize: 24 }} />
                      </Box>
                      <Typography variant="h6" fontWeight={800} sx={{ color: "#059669" }}>
                        Delivered ({ordersByStatus.delivered.length})
                      </Typography>
                    </Box>
                    <Stack spacing={3}>
                      {ordersByStatus.delivered.map((order) => (
                        <OrderCard
                          key={order._id}
                          order={order}
                          onCancel={handleCancelOrder}
                          onRequestReturn={handleReturnDialogOpen}
                          onCancelReturn={handleCancelReturn}
                          isExpanded={expandedOrders[order._id]}
                          onToggleExpand={(orderId) => setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }))}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Cancelled Orders Section */}
                {(statusFilter === "all" || statusFilter === "cancelled") && ordersByStatus.cancelled.length > 0 && (
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                      <Box
                        sx={{
                          background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                          borderRadius: "50%",
                          p: 1.5,
                          color: "#fff",
                        }}
                      >
                        <CancelledIcon sx={{ fontSize: 24 }} />
                      </Box>
                      <Typography variant="h6" fontWeight={800} sx={{ color: "#dc2626" }}>
                        Cancelled ({ordersByStatus.cancelled.length})
                      </Typography>
                    </Box>
                    <Stack spacing={3}>
                      {ordersByStatus.cancelled.map((order) => (
                        <OrderCard
                          key={order._id}
                          order={order}
                          onCancel={handleCancelOrder}
                          onRequestReturn={handleReturnDialogOpen}
                          onCancelReturn={handleCancelReturn}
                          isExpanded={expandedOrders[order._id]}
                          onToggleExpand={(orderId) => setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }))}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            )}
          </>
        )}

        {/* Rental Bookings Tab */}
        {activeTab === "rentals" && (
          <>
            {bookings.length === 0 ? (
              <Card
                elevation={0}
                sx={{
                  p: 5,
                  textAlign: "center",
                  borderRadius: 3,
                  background: "#fff",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <ShippingIcon sx={{ fontSize: 80, color: "#ccc", mb: 2 }} />
                <Typography variant="h6" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
                  No rental bookings yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  You haven't made any rental bookings. Explore our rental catalog!
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "#fff",
                    fontWeight: 800,
                    textTransform: "none",
                  }}
                  onClick={() => navigate("/rental")}
                >
                  Browse Rental Items
                </Button>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {bookings.map((booking) => (
                  <Grid item xs={12} key={booking._id}>
                    <RentalBookingCard booking={booking} />
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onClose={handlePaymentDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1.2rem" }}>Process Payment</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Order ID: <strong>{selectedOrder?._id}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Amount: <strong>{formatPrice(selectedOrder?.totalPrice)}</strong>
              </Typography>

              <TextField
                fullWidth
                label="Card Number"
                placeholder="1234567890123456"
                value={paymentData.cardNumber}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, cardNumber: e.target.value })
                }
                margin="normal"
                inputProps={{ maxLength: 16 }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": { borderColor: "#667eea" },
                    "&.Mui-focused fieldset": { borderColor: "#667eea" },
                  },
                }}
              />

              <TextField
                fullWidth
                label="Expiry Date"
                placeholder="MM/YY"
                value={paymentData.expiryDate}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, expiryDate: e.target.value })
                }
                margin="normal"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": { borderColor: "#667eea" },
                    "&.Mui-focused fieldset": { borderColor: "#667eea" },
                  },
                }}
              />

              <TextField
                fullWidth
                label="CVV"
                placeholder="123"
                type="password"
                value={paymentData.cvv}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, cvv: e.target.value })
                }
                margin="normal"
                inputProps={{ maxLength: 3 }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": { borderColor: "#667eea" },
                    "&.Mui-focused fieldset": { borderColor: "#667eea" },
                  },
                }}
              />

              <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                This is a demo payment system. Use any valid 16-digit number for testing.
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handlePaymentDialogClose} disabled={processingPayment}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayment}
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                fontWeight: 800,
              }}
              disabled={processingPayment}
            >
              {processingPayment ? <CircularProgress size={20} /> : "Process Payment"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Return Request Dialog */}
        <Dialog open={returnDialogOpen} onClose={handleReturnDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: 1 }}>
            <ReturnIcon sx={{ color: "#667eea" }} />
            Request Product Return
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {error && returnDialogOpen && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError("")}>
                  {error}
                </Alert>
              )}
              
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                You can return this order within 7 days of delivery. Please provide a reason for the return.
              </Alert>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Order ID: <strong>{selectedReturnOrder?._id?.substring(0, 12)}...</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Order Total: <strong>{formatPrice(selectedReturnOrder?.totalPrice)}</strong>
              </Typography>
              {selectedReturnOrder?.deliveredAt && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Delivered On: <strong>{new Date(selectedReturnOrder.deliveredAt).toLocaleDateString("en-IN")}</strong>
                </Typography>
              )}

              <TextField
                fullWidth
                label="Reason for Return"
                placeholder="e.g., Damaged product, wrong item, size issue, etc."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                multiline
                rows={4}
                required
                autoFocus
                error={!returnReason.trim() && returnReason !== ""}
                helperText={!returnReason.trim() && returnReason !== "" ? "Please provide a reason" : ""}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": { borderColor: "#667eea" },
                    "&.Mui-focused fieldset": { borderColor: "#667eea" },
                  },
                }}
              />

              <Alert severity="warning" sx={{ mt: 3, borderRadius: 2 }}>
                Once submitted, your return request will be reviewed by our team. You'll be notified of the status.
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleReturnDialogClose} disabled={processingReturn}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestReturn}
              variant="contained"
              startIcon={processingReturn ? null : <ReturnIcon />}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                fontWeight: 800,
              }}
              disabled={processingReturn || !returnReason.trim()}
            >
              {processingReturn ? <CircularProgress size={20} color="inherit" /> : "Submit Return Request"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Message */}
        {successMessage && (
          <Alert
            severity="success"
            sx={{
              position: "fixed",
              top: 20,
              right: 20,
              zIndex: 1000,
              borderRadius: 2,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            {successMessage}
          </Alert>
        )}
      </Container>
    </Box>
  );
};

// Order Card Component
const OrderCard = ({ order, onCancel, onRequestReturn, onCancelReturn, isExpanded, onToggleExpand }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: "#fef3c7", text: "#d97706", icon: "#f59e0b" },
      processing: { bg: "#dbeafe", text: "#1e40af", icon: "#3b82f6" },
      shipped: { bg: "#dbeafe", text: "#1e40af", icon: "#3b82f6" },
      delivered: { bg: "#d1fae5", text: "#065f46", icon: "#10b981" },
      cancelled: { bg: "#fee2e2", text: "#991b1b", icon: "#ef4444" },
    };
    return colors[status] || colors.pending;
  };

  const getReturnStatusColor = (returnStatus) => {
    const colors = {
      requested: { bg: "#fef3c7", text: "#d97706" },
      approved: { bg: "#dbeafe", text: "#1e40af" },
      rejected: { bg: "#fee2e2", text: "#991b1b" },
      completed: { bg: "#d1fae5", text: "#065f46" },
    };
    return colors[returnStatus] || { bg: "#f3f4f6", text: "#6b7280" };
  };

  // Calculate return eligibility
  const calculateReturnEligibility = () => {
    // If order is not delivered, return not eligible
    if (!order.isDelivered) return { eligible: false, daysRemaining: 0 };
    
    // Use deliveredAt if available, otherwise use updatedAt or createdAt as fallback
    const deliveryDate = new Date(order.deliveredAt || order.updatedAt || order.createdAt);
    const currentDate = new Date();
    const daysSinceDelivery = Math.floor((currentDate - deliveryDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = 7 - daysSinceDelivery;
    
    // Check if return status exists and is 'none', or if field doesn't exist (legacy orders)
    const hasNoReturn = !order.returnStatus || order.returnStatus === 'none';
    const eligible = daysSinceDelivery <= 7 && hasNoReturn;
    
    return { eligible, daysRemaining: Math.max(0, daysRemaining) };
  };

  const returnEligibility = calculateReturnEligibility();
  const status = order.status || "pending";
  const colors = getStatusColor(status);
  const isPendingOrCancelled = status === "pending" || status === "cancelled";
  const returnStatus = order.returnStatus || 'none'; // Default to 'none' for orders without this field
  const returnColors = getReturnStatusColor(returnStatus);

  // Debug log for troubleshooting
  console.log('Order Return Debug:', {
    orderId: order._id?.substring(0, 8),
    isDelivered: order.isDelivered,
    deliveredAt: order.deliveredAt,
    returnStatus: returnStatus,
    eligible: returnEligibility.eligible,
    daysRemaining: returnEligibility.daysRemaining
  });

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        background: "#fff",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: `2px solid ${colors.bg}`,
        overflow: "hidden",
        transition: "all 0.3s ease",
        "&:hover": { boxShadow: "0 8px 32px rgba(0,0,0,0.12)", transform: "translateY(-2px)" },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header Row */}
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
              Order ID
            </Typography>
            <Typography variant="body2" fontWeight={800} sx={{ fontSize: "0.9rem", fontFamily: "monospace" }}>
              {order._id?.substring(0, 12)}...
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
              Date
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              {new Date(order.createdAt).toLocaleDateString("en-IN")}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3} sx={{ textAlign: "right" }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
              Total
            </Typography>
            <Typography variant="body2" fontWeight={800} color="#667eea">
              {formatPrice(order.totalPrice || order.total)}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Status Row */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ background: colors.bg, p: 1.5, borderRadius: 1.5 }}>
              <Typography variant="caption" fontWeight={700} sx={{ color: colors.text, fontSize: "0.75rem" }}>
                ORDER STATUS
              </Typography>
              <Typography variant="body2" fontWeight={800} sx={{ color: colors.text, mt: 0.5 }}>
                {status === 'pending' ? 'Confirmed' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Typography>
            </Box>
          </Grid>
          {status !== "cancelled" && (
            <Grid item xs={6} sm={3}>
              <Box sx={{ background: order.isPaid ? "#d1fae5" : "#fef3c7", p: 1.5, borderRadius: 1.5 }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: order.isPaid ? "#065f46" : "#d97706", fontSize: "0.75rem" }}>
                  PAYMENT
                </Typography>
                <Typography variant="body2" fontWeight={800} sx={{ color: order.isPaid ? "#065f46" : "#d97706", mt: 0.5 }}>
                  {order.isPaid ? "Paid" : order.paymentMethod ? order.paymentMethod.toUpperCase() : "COD"}
                </Typography>
              </Box>
            </Grid>
          )}
          {status !== "cancelled" && (
            <Grid item xs={6} sm={3}>
              <Box sx={{ background: "#d1fae5", p: 1.5, borderRadius: 1.5 }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: "#065f46", fontSize: "0.75rem" }}>
                  ORDER
                </Typography>
                <Typography variant="body2" fontWeight={800} sx={{ color: "#065f46", mt: 0.5 }}>
                  ✓ Confirmed
                </Typography>
              </Box>
            </Grid>
          )}
          {/* Return Status Box */}
          {returnStatus !== 'none' && (
            <Grid item xs={6} sm={3}>
              <Box sx={{ background: returnColors.bg, p: 1.5, borderRadius: 1.5 }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: returnColors.text, fontSize: "0.75rem" }}>
                  RETURN STATUS
                </Typography>
                <Typography variant="body2" fontWeight={800} sx={{ color: returnColors.text, mt: 0.5 }}>
                  {returnStatus.charAt(0).toUpperCase() + returnStatus.slice(1)}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Return Eligibility Alert */}
        {returnEligibility.eligible && returnStatus === 'none' && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ReturnIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2" fontWeight={700}>
                Return Eligible - {returnEligibility.daysRemaining} day{returnEligibility.daysRemaining !== 1 ? 's' : ''} remaining
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Return Reason Display */}
        {returnStatus !== 'none' && order.returnReason && (
          <Alert severity={returnStatus === 'rejected' ? 'error' : 'info'} sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 0.5 }}>
              {returnStatus === 'rejected' ? 'RETURN REJECTED' : 'RETURN REASON'}
            </Typography>
            <Typography variant="body2">
              {order.returnReason}
            </Typography>
            {returnStatus === 'rejected' && order.returnRejectionReason && (
              <>
                <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mt: 1, mb: 0.5 }}>
                  REJECTION REASON
                </Typography>
                <Typography variant="body2">
                  {order.returnRejectionReason}
                </Typography>
              </>
            )}
            {returnStatus === 'completed' && order.refundAmount && (
              <Typography variant="body2" fontWeight={700} sx={{ mt: 1, color: '#10b981' }}>
                Refund Amount: {formatPrice(order.refundAmount)}
              </Typography>
            )}
          </Alert>
        )}

        {/* Shipping Address */}
        {order.shippingAddress && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <LocationIcon sx={{ fontSize: 18, color: "#667eea" }} />
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#667eea" }}>
                  SHIPPING ADDRESS
                </Typography>
              </Box>
              <Box sx={{ background: "#f9f9f9", p: 1.5, borderRadius: 1.5 }}>
                <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                  {order.shippingAddress.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  {order.shippingAddress.address}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipcode}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  {order.shippingAddress.phone}
                </Typography>
              </Box>
            </Box>
          </>
        )}

        {/* Order Items Summary */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Items ({order.orderItems?.length || 0})
            </Typography>
            {isPendingOrCancelled && (
              <Button
                size="small"
                onClick={() => onToggleExpand(order._id)}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  color: "#667eea",
                  fontSize: "0.85rem",
                }}
              >
                {isExpanded ? "Hide Details ▼" : "Show Details ▶"}
              </Button>
            )}
          </Box>

          {/* Collapsed View */}
          {!isExpanded && (
            <Stack spacing={1}>
              {order.orderItems?.slice(0, 2).map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1,
                    background: "#f9f9f9",
                    borderRadius: 1,
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ fontSize: "0.9rem" }}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Qty: {item.qty || item.quantity}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={800}>
                    {formatPrice((item.qty || item.quantity) * item.price)}
                  </Typography>
                </Box>
              ))}
              {order.orderItems?.length > 2 && (
                <Typography variant="caption" color="primary" sx={{ fontWeight: 700, mt: 1 }}>
                  +{order.orderItems.length - 2} more items
                </Typography>
              )}
            </Stack>
          )}

          {/* Expanded View - All Details */}
          {isExpanded && (
            <Stack spacing={1.5}>
              {order.orderItems?.map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 2,
                    background: "#f9f9f9",
                    borderRadius: 1.5,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <Box sx={{ display: "flex", gap: 2, mb: 1.5 }}>
                    {item.images?.[0] && (
                      <Box
                        component="img"
                        src={item.images[0]}
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 1,
                          objectFit: "cover",
                          background: "#fff",
                          border: "1px solid #e5e7eb",
                        }}
                      />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={800} sx={{ mb: 0.5 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                        Product ID: {item._id}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Price per unit
                          </Typography>
                          <Typography variant="body2" fontWeight={800}>
                            {formatPrice(item.price)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Quantity
                          </Typography>
                          <Typography variant="body2" fontWeight={800}>
                            {item.qty || item.quantity}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Total
                          </Typography>
                          <Typography variant="body2" fontWeight={800} color="#667eea">
                            {formatPrice((item.qty || item.quantity) * item.price)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Price Breakdown Section */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: "#667eea" }}>
            💰 Order Summary
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Subtotal
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {formatPrice(order.subtotal || order.totalPrice || 0)}
              </Typography>
            </Box>
            {order.tax > 0 && (
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Tax (10%)
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {formatPrice(order.tax || 0)}
                </Typography>
              </Box>
            )}
            {order.shippingCharge !== undefined && (
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Shipping Charge
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {order.shippingCharge > 0 ? formatPrice(order.shippingCharge) : "FREE"}
                </Typography>
              </Box>
            )}
            {order.couponDiscount > 0 && (
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ color: "#10b981", fontWeight: 700 }}>
                  Coupon Discount ({order.couponCode})
                </Typography>
                <Typography variant="body2" sx={{ color: "#10b981", fontWeight: 700 }}>
                  - {formatPrice(order.couponDiscount)}
                </Typography>
              </Box>
            )}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between", bgcolor: "#f0f4ff", p: 1.5, borderRadius: 1 }}>
              <Typography variant="body1" fontWeight={900} sx={{ color: "#667eea" }}>
                Total Amount
              </Typography>
              <Typography variant="body1" fontWeight={900} sx={{ color: "#667eea" }}>
                {formatPrice(order.totalPrice || order.total)}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Action Buttons */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          {/* Cancel Order Button */}
          {status !== "delivered" && status !== "cancelled" && returnStatus === 'none' && (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              size="small"
              onClick={() => onCancel(order._id)}
              startIcon={<CancelledIcon />}
              sx={{
                fontWeight: 700,
                borderRadius: 1.5,
                textTransform: "none",
              }}
            >
              Cancel Order
            </Button>
          )}

          {/* Request Return Button - Only if delivered within 7 days and no existing return */}
          {returnEligibility.eligible && returnStatus === 'none' && (
            <Button
              fullWidth
              variant="contained"
              size="medium"
              onClick={() => onRequestReturn(order)}
              startIcon={<ReturnIcon />}
              sx={{
                fontWeight: 800,
                borderRadius: 1.5,
                textTransform: "none",
                py: 1.5,
                fontSize: "0.95rem",
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                  boxShadow: "0 6px 16px rgba(245, 158, 11, 0.4)",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              🔄 Request Return ({returnEligibility.daysRemaining} {returnEligibility.daysRemaining === 1 ? 'day' : 'days'} left)
            </Button>
          )}

          {/* Cancel Return Request Button - Only if return is in requested status */}
          {returnStatus === 'requested' && (
            <Button
              fullWidth
              variant="outlined"
              color="warning"
              size="small"
              onClick={() => onCancelReturn(order._id)}
              startIcon={<CloseIcon />}
              sx={{
                fontWeight: 700,
                borderRadius: 1.5,
                textTransform: "none",
              }}
            >
              Cancel Return Request
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

// Rental Booking Card Component
const RentalBookingCard = ({ booking }) => {
  const navigate = useNavigate();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const handleCancelRent = async () => {
    try {
      setCancelling(true);
      setCancelError("");
      console.log("Attempting to cancel booking:", booking._id);
      
      // Call backend to cancel booking
      const response = await api.post(`/bookings/${booking._id}/cancel`);
      console.log("✅ Rental cancelled successfully:", response.data);
      
      alert("Rental booking cancelled successfully!");
      setCancelDialogOpen(false);
      
      // Refresh the page to show updated bookings
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to cancel rental booking";
      console.error("❌ Error cancelling rental:", {
        status: err.response?.status,
        message: errorMsg,
        fullError: err,
      });
      setCancelError(errorMsg);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        background: "#fff",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "2px solid #e5e7eb",
        transition: "all 0.3s ease",
        "&:hover": { boxShadow: "0 8px 32px rgba(0,0,0,0.12)", transform: "translateY(-2px)" },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight={800} sx={{ fontSize: "0.9rem", fontFamily: "monospace" }}>
              {booking._id?.substring(0, 12)}...
            </Typography>
            <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
              {booking.rentalItem?.name || "Rental Item"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ textAlign: { xs: "left", sm: "right" } }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
              Total Cost
            </Typography>
            <Typography variant="body1" fontWeight={800} color="#667eea">
              {formatPrice(booking.totalCost)}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Dates and Duration */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ background: "#f0f4ff", p: 1.5, borderRadius: 1.5 }}>
              <Typography variant="caption" fontWeight={700} sx={{ color: "#667eea", fontSize: "0.75rem" }}>
                START DATE
              </Typography>
              <Typography variant="body2" fontWeight={800} sx={{ mt: 0.5 }}>
                {new Date(booking.startDate).toLocaleDateString("en-IN")}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ background: "#f0f4ff", p: 1.5, borderRadius: 1.5 }}>
              <Typography variant="caption" fontWeight={700} sx={{ color: "#667eea", fontSize: "0.75rem" }}>
                END DATE
              </Typography>
              <Typography variant="body2" fontWeight={800} sx={{ mt: 0.5 }}>
                {new Date(booking.endDate).toLocaleDateString("en-IN")}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ background: "#d1fae5", p: 1.5, borderRadius: 1.5 }}>
              <Typography variant="caption" fontWeight={700} sx={{ color: "#065f46", fontSize: "0.75rem" }}>
                DURATION
              </Typography>
              <Typography variant="body2" fontWeight={800} sx={{ color: "#065f46", mt: 0.5 }}>
                {booking.durationDays} days
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ background: booking.bookingStatus === "paid" ? "#d1fae5" : "#fef3c7", p: 1.5, borderRadius: 1.5 }}>
              <Typography variant="caption" fontWeight={700} sx={{ color: booking.bookingStatus === "paid" ? "#065f46" : "#d97706", fontSize: "0.75rem" }}>
                BOOKING STATUS
              </Typography>
              <Typography variant="body2" fontWeight={800} sx={{ color: booking.bookingStatus === "paid" ? "#065f46" : "#d97706", mt: 0.5 }}>
                {booking.bookingStatus?.replace(/_/g, " ")?.toUpperCase() || "PENDING"}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Rental Item Details */}
        {booking.rentalItem && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              📦 Item Details
            </Typography>
            <Grid container spacing={2}>
              {booking.rentalItem.images && booking.rentalItem.images[0] && (
                <Grid item xs={12} sm={3}>
                  <Box
                    component="img"
                    src={booking.rentalItem.images[0]}
                    alt={booking.rentalItem.name}
                    sx={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 2 }}
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={booking.rentalItem.images ? 9 : 12}>
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
                      Category
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {booking.rentalItem.category}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
                      Description
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {booking.rentalItem.description || "No description available"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
                      Price Per Day
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatPrice(booking.rentalItem.pricePerDay)}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Booking Details */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            💰 Cost Breakdown
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Rental Cost ({booking.durationDays} days)
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {formatPrice(booking.totalCost || 0)}
              </Typography>
            </Box>
            {booking.securityDeposit && booking.securityDeposit > 0 && (
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Security Deposit
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {formatPrice(booking.securityDeposit)}
                </Typography>
              </Box>
            )}
            {booking.insuranceCost && booking.insuranceCost > 0 && (
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Insurance (5%)
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {formatPrice(booking.insuranceCost)}
                </Typography>
              </Box>
            )}
            {booking.deliveryCharge && booking.deliveryCharge > 0 && (
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Delivery Charge
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {formatPrice(booking.deliveryCharge)}
                </Typography>
              </Box>
            )}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Tax (10%)
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {formatPrice(booking.taxAmount || 0)}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", bgcolor: "#f0f4ff", p: 1, borderRadius: 1 }}>
              <Typography variant="body2" fontWeight={900} sx={{ color: "#667eea" }}>
                Total Amount
              </Typography>
              <Typography variant="body2" fontWeight={900} sx={{ color: "#667eea" }}>
                {formatPrice(booking.totalCost + (booking.securityDeposit || 0) + (booking.insuranceCost || 0) + (booking.deliveryCharge || 0) + (booking.taxAmount || 0))}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Action Buttons */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          {booking.bookingStatus !== "cancelled" && (
            <Button
              fullWidth
              variant="outlined"
              size="small"
              sx={{
                fontWeight: 700,
                borderRadius: 1.5,
                textTransform: "none",
                borderColor: "#ef4444",
                color: "#ef4444",
                "&:hover": {
                  bgcolor: "rgba(239, 68, 68, 0.08)",
                },
              }}
              onClick={() => setCancelDialogOpen(true)}
            >
              ✕ Cancel Rent
            </Button>
          )}
        </Stack>

        {/* Cancel Confirmation Dialog */}
        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 900, fontSize: "1.2rem", color: "#ef4444" }}>
            Cancel Rental Booking?
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Are you sure you want to cancel this rental booking for <strong>{booking.rentalItem?.name}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Rental Period: {new Date(booking.startDate).toLocaleDateString("en-IN")} to{" "}
              {new Date(booking.endDate).toLocaleDateString("en-IN")}
            </Typography>
            {cancelError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {cancelError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCancelDialogOpen(false)} sx={{ fontWeight: 700 }} disabled={cancelling}>
              Keep Booking
            </Button>
            <Button
              onClick={handleCancelRent}
              disabled={cancelling}
              sx={{
                fontWeight: 700,
                color: "#fff",
                bgcolor: "#ef4444",
                "&:hover": { bgcolor: "#dc2626" },
              }}
              variant="contained"
            >
              {cancelling ? "Cancelling..." : "Cancel Booking"}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default OrdersPage;
