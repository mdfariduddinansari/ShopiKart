import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tabs,
  Stack,
} from "@mui/material";
import { Tab, Visibility as VisibilityIcon, Close as CloseIcon } from "@mui/icons-material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import api from "../../services/api";
import { formatPrice } from "../../utils/currency";

const AdminRentalBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [tabValue, setTabValue] = useState("all");
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAllBookings();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAllBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      // Fetch all bookings from backend
      const { data } = await api.get("/bookings");
      setBookings(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      // If admin endpoint doesn't exist, show this error
      setError(
        err.response?.data?.message ||
          "Failed to load bookings. Admin booking endpoint needs to be created."
      );
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetails = () => {
    setOpenDetailsDialog(false);
    setSelectedBooking(null);
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      setUpdating(true);
      setError(null);
      const { data } = await api.put(`/bookings/admin/${bookingId}/status`, {
        status: newStatus,
      });
      setBookings(
        bookings.map((b) => (b._id === bookingId ? data : b))
      );
      setSelectedBooking(data);
      setSuccessMessage(`Booking status updated to ${newStatus.replace(/_/g, " ")}!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update booking status";
      setError(errorMsg);
      console.error("Error:", err);
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdating(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking? Inventory will be restored.")) {
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      const { data } = await api.post(`/bookings/admin/${bookingId}/cancel`, {
        reason: 'Cancelled by admin',
      });
      setBookings(
        bookings.map((b) => (b._id === bookingId ? data : b))
      );
      setSelectedBooking(data);
      setSuccessMessage("Booking cancelled successfully! Inventory has been restored.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to cancel booking";
      setError(errorMsg);
      console.error("Error:", err);
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      awaiting_payment: "warning",
      paid: "success",
      pickup_scheduled: "info",
      in_use: "primary",
      completed: "success",
      cancelled: "error",
    };
    return colors[status] || "default";
  };

  const filteredBookings =
    tabValue === "all"
      ? bookings
      : bookings.filter((b) => b.bookingStatus === tabValue);

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 900, color: "#1f2937" }}>
            🏪 Rental Booking Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "1rem" }}>
            Monitor, manage, and process all rental bookings
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            {successMessage}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 4px 15px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}>
              <CardContent sx={{ p: 2 }}>
                <Typography color="textSecondary" variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Total Bookings
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ color: "#667eea" }}>
                  {bookings.length}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  All time bookings
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 4px 15px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}>
              <CardContent sx={{ p: 2 }}>
                <Typography color="textSecondary" variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Awaiting Payment
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ color: "#f59e0b" }}>
                  {bookings.filter((b) => b.bookingStatus === "awaiting_payment").length}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Pending confirmation
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 4px 15px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}>
              <CardContent sx={{ p: 2 }}>
                <Typography color="textSecondary" variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Active Rentals
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ color: "#10b981" }}>
                  {bookings.filter((b) => b.bookingStatus === "in_use").length}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Currently renting
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 4px 15px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}>
              <CardContent sx={{ p: 2 }}>
                <Typography color="textSecondary" variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Total Revenue
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ color: "#ef4444" }}>
                  ₹{bookings.reduce((sum, b) => sum + (b.finalTotal || 0), 0).toLocaleString()}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  From rentals
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs for Status Filter */}
        <Paper sx={{ mb: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <TabContext value={tabValue}>
            <TabList 
              onChange={(e, v) => setTabValue(v)}
              sx={{
                borderBottom: "2px solid #e5e7eb",
                background: "#f9fafb",
                "& .MuiTab-root": {
                  fontWeight: 700,
                  textTransform: "none",
                  fontSize: "0.95rem",
                  color: "#6b7280",
                  "&.Mui-selected": {
                    color: "#667eea",
                  },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#667eea",
                  height: 3,
                }
              }}
            >
              <Tab label={`All Bookings (${bookings.length})`} value="all" />
              <Tab label={`Awaiting Payment (${bookings.filter(b => b.bookingStatus === "awaiting_payment").length})`} value="awaiting_payment" />
              <Tab label={`Paid (${bookings.filter(b => b.bookingStatus === "paid").length})`} value="paid" />
              <Tab label={`Pickup Scheduled (${bookings.filter(b => b.bookingStatus === "pickup_scheduled").length})`} value="pickup_scheduled" />
              <Tab label={`In Use (${bookings.filter(b => b.bookingStatus === "in_use").length})`} value="in_use" />
              <Tab label={`Returned (${bookings.filter(b => b.bookingStatus === "returned").length})`} value="returned" />
              <Tab label={`Cancelled (${bookings.filter(b => b.bookingStatus === "cancelled").length})`} value="cancelled" />
            </TabList>
          </TabContext>
        </Paper>

        {/* Bookings Table */}
        {filteredBookings.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: "center", borderRadius: 2, background: "#f9fafb", border: "1px dashed #e5e7eb" }}>
            <Typography color="textSecondary" sx={{ fontWeight: 600, mb: 1 }}>
              📭 No bookings found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              No {tabValue !== "all" ? tabValue.replace(/_/g, " ") + " " : ""}bookings at this moment
            </Typography>
          </Paper>
        ) : (
          <TableContainer 
            component={Paper}
            sx={{ 
              borderRadius: 2,
              boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
              overflow: "hidden"
            }}
          >
            <Table>
              <TableHead sx={{ backgroundColor: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, color: "#1f2937", fontSize: "0.9rem" }}>Booking ID</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: "#1f2937", fontSize: "0.9rem" }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: "#1f2937", fontSize: "0.9rem" }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: "#1f2937", fontSize: "0.9rem" }}>Dates</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: "#1f2937", fontSize: "0.9rem" }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: "#1f2937", fontSize: "0.9rem" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: "#1f2937", fontSize: "0.9rem" }}>Payment</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900, color: "#1f2937", fontSize: "0.9rem" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow 
                    key={booking._id}
                    sx={{
                      borderBottom: "1px solid #e5e7eb",
                      "&:hover": {
                        backgroundColor: "#f9fafb",
                      },
                      transition: "background-color 0.2s"
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 100, fontFamily: "monospace", fontWeight: 600, fontSize: "0.85rem" }}>
                        {booking._id.slice(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {booking.user?.name || "N/A"}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                        {booking.user?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {booking.rentalItem?.name || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(booking.startDate).toLocaleDateString()} -{" "}
                        {new Date(booking.endDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                        ({booking.durationDays} days)
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 900, color: "#667eea", fontSize: "1rem" }}>
                        {formatPrice(booking.finalTotal || booking.totalCost)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                        Final Total
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={booking.bookingStatus?.replace(/_/g, " ")?.toUpperCase() || "PENDING"}
                        color={getStatusColor(booking.bookingStatus)}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={booking.isPaid ? "Paid" : "Pending"}
                        color={booking.isPaid ? "success" : "warning"}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleViewDetails(booking)}
                        title="View Details"
                        sx={{
                          background: "#f0f4ff",
                          "&:hover": {
                            background: "#e0e7ff",
                          }
                        }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Booking Details Dialog */}
        <Dialog
          open={openDetailsDialog}
          onClose={handleCloseDetails}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }
          }}
        >
          <DialogTitle sx={{ 
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            fontWeight: 900,
            fontSize: "1.3rem",
            py: 3
          }}>
            📋 Booking Details
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 3, background: "#f9fafb" }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>
                {error}
              </Alert>
            )}
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 1 }}>
                {successMessage}
              </Alert>
            )}
            {selectedBooking && (
              <Grid container spacing={3}>
                {/* Left Column */}
                <Grid item xs={12} md={6}>
                  {/* Booking Info */}
                  <Card sx={{ mb: 2, borderRadius: 2, border: "1px solid #e5e7eb" }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2, color: "#667eea" }}>
                        🎫 Booking Information
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="textSecondary" sx={{ display: "block", mb: 0.5 }}>
                            Booking ID
                          </Typography>
                          <Typography variant="body2" fontFamily="monospace" sx={{ fontWeight: 600, wordBreak: "break-all" }}>
                            {selectedBooking._id}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="textSecondary" sx={{ display: "block", mb: 0.5 }}>
                            Rental Period
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {new Date(selectedBooking.startDate).toLocaleDateString("en-IN")} → {new Date(selectedBooking.endDate).toLocaleDateString("en-IN")}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {selectedBooking.durationDays} days
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Customer Info */}
                  <Card sx={{ mb: 2, borderRadius: 2, border: "1px solid #e5e7eb" }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2, color: "#667eea" }}>
                        👤 Customer Information
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="textSecondary" sx={{ display: "block", mb: 0.5 }}>
                            Name
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {selectedBooking.user?.name}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="textSecondary" sx={{ display: "block", mb: 0.5 }}>
                            Email
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {selectedBooking.user?.email}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Item Info */}
                  <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2, color: "#667eea" }}>
                        📦 Rental Item
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {selectedBooking.rentalItem?.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {selectedBooking.rentalItem?.description}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Right Column - Cost Breakdown */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    background: "linear-gradient(135deg, #f0f4ff 0%, #f9f5ff 100%)",
                    borderRadius: 2,
                    border: "2px solid #e0e7ff",
                    mb: 2
                  }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2, color: "#667eea" }}>
                        💰 Cost Breakdown
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, borderBottom: "1px solid #e0e7ff" }}>
                          <Typography variant="body2" color="textSecondary">Rental Cost</Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {formatPrice(selectedBooking.totalCost || 0)}
                          </Typography>
                        </Box>
                        {selectedBooking.securityDeposit > 0 && (
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, borderBottom: "1px solid #e0e7ff" }}>
                            <Typography variant="body2" color="textSecondary">Security Deposit</Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {formatPrice(selectedBooking.securityDeposit)}
                            </Typography>
                          </Box>
                        )}
                        {selectedBooking.insuranceCost > 0 && (
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, borderBottom: "1px solid #e0e7ff" }}>
                            <Typography variant="body2" color="textSecondary">Insurance (5%)</Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {formatPrice(selectedBooking.insuranceCost)}
                            </Typography>
                          </Box>
                        )}
                        {selectedBooking.deliveryCharge > 0 && (
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, borderBottom: "1px solid #e0e7ff" }}>
                            <Typography variant="body2" color="textSecondary">Delivery Charge</Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {formatPrice(selectedBooking.deliveryCharge)}
                            </Typography>
                          </Box>
                        )}
                        {selectedBooking.taxAmount > 0 && (
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1, borderBottom: "1px solid #e0e7ff" }}>
                            <Typography variant="body2" color="textSecondary">Tax (10%)</Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {formatPrice(selectedBooking.taxAmount)}
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center", 
                          pt: 1.5,
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          px: 2,
                          py: 1.5,
                          borderRadius: 1,
                          color: "#fff"
                        }}>
                          <Typography variant="subtitle2" fontWeight={900}>FINAL TOTAL</Typography>
                          <Typography variant="h6" fontWeight={900}>
                            {formatPrice(selectedBooking.finalTotal || selectedBooking.totalCost)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Status Info */}
                  <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb" }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2, color: "#667eea" }}>
                        ✅ Status Information
                      </Typography>
                      <Stack direction="column" spacing={1.5}>
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="textSecondary" sx={{ display: "block", mb: 0.5 }}>
                            Booking Status
                          </Typography>
                          <Chip
                            label={selectedBooking.bookingStatus?.replace(/_/g, " ")?.toUpperCase() || "PENDING"}
                            color={getStatusColor(selectedBooking.bookingStatus)}
                            sx={{ fontWeight: 700 }}
                            size="small"
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="textSecondary" sx={{ display: "block", mb: 0.5 }}>
                            Payment Method
                          </Typography>
                          <Chip
                            label={selectedBooking.paymentMethod?.replace(/_/g, " ")?.toUpperCase() || "NOT SET"}
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                            size="small"
                          />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Status Update Section */}
                {selectedBooking.bookingStatus !== "completed" && selectedBooking.bookingStatus !== "cancelled" && selectedBooking.bookingStatus !== "returned" && (
                  <Grid item xs={12}>
                    <Card sx={{ borderRadius: 2, border: "1px solid #e5e7eb", background: "#fffbf0" }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2, color: "#d97706" }}>
                          🔄 Update Booking Status
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {["awaiting_payment", "paid", "pickup_scheduled", "in_use", "returned"].map((status) => (
                            <Button
                              key={status}
                              size="small"
                              disabled={updating}
                              variant={selectedBooking.bookingStatus === status ? "contained" : "outlined"}
                              color={selectedBooking.bookingStatus === status ? "primary" : "inherit"}
                              onClick={() => updateBookingStatus(selectedBooking._id, status)}
                              sx={{ textTransform: "capitalize", fontWeight: 700 }}
                            >
                              {status.replace(/_/g, " ")}
                            </Button>
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Cancel Booking Section */}
                {selectedBooking.bookingStatus !== "cancelled" && selectedBooking.bookingStatus !== "completed" && selectedBooking.bookingStatus !== "in_use" && (
                  <Grid item xs={12}>
                    <Card sx={{ borderRadius: 2, border: "2px solid #ef4444", background: "#fef2f2" }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2, color: "#ef4444" }}>
                          ⚠️ Danger Zone - Cancel Booking
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          Cancelling this booking will restore inventory and send a cancellation notification to the customer.
                        </Typography>
                        <Button
                          variant="contained"
                          color="error"
                          fullWidth
                          onClick={() => cancelBooking(selectedBooking._id)}
                          sx={{ fontWeight: 700, py: 1 }}
                        >
                          🗑️ Cancel This Booking
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
            <Button onClick={handleCloseDetails} sx={{ fontWeight: 700 }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default AdminRentalBookings;
