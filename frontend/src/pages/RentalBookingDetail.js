import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";
import {
  Payment as PaymentIcon,
  LocalShipping,
  DateRange,
  AttachMoney,
  Security,
} from "@mui/icons-material";
import api from "../services/api";

const formatPrice = (price) => {
  return "₹" + new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const RentalBookingDetail = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth || {});

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod"); // cod, upi, card
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolder: "",
  });

  const [insuranceSelected, setInsuranceSelected] = useState(false);
  const [insuranceCost, setInsuranceCost] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  const insuranceAmount = (booking?.totalCost || 0) * 0.05; // 5% of total cost

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchBookingDetails();
    fetchUserAddresses();
  }, [bookingId, isAuthenticated, navigate]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching booking details for ID:', bookingId);
      const { data } = await api.get(`/bookings/${bookingId}`);
      console.log('Booking data loaded:', data);
      setBooking(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching booking:", err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to load booking details";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  const fetchUserAddresses = async () => {
    try {
      const { data } = await api.get('/users/profile');
      if (data?.addresses && data.addresses.length > 0) {
        setUserAddresses(data.addresses);
        setSelectedAddressId(data.addresses[0]._id);
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
    }
  }

  const handleInsuranceChange = (checked) => {
    setInsuranceSelected(checked);
    setInsuranceCost(checked ? insuranceAmount : 0);
  };

  const handleConfirmCOD = async () => {
    if (!selectedAddressId) {
      setError("Please select a delivery address");
      return;
    }

    try {
      setProcessingPayment(true);
      setError(null);

      const response = await api.post(`/bookings/${bookingId}/confirm-cod`, {
        addressId: selectedAddressId,
        paymentMethod: 'cash_on_delivery',
        insuranceSelected,
        insuranceCost,
        deliveryCharge,
      });

      if (response.data) {
        setBooking(response.data);
      }

      alert("Order confirmed! You can pay on delivery. Check your orders page.");
      navigate("/orders");
    } catch (err) {
      console.error('COD confirmation error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error ||
                          err.message ||
                          "Failed to confirm order. Please try again.";
      setError(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  const calculateTotal = () => {
    return (booking?.totalCost || 0) + (booking?.securityDeposit || 0) + insuranceCost + deliveryCharge;
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({ ...paymentData, [name]: value });
  };

  const validatePaymentData = () => {
    if (!paymentData.cardNumber || paymentData.cardNumber.length !== 16) {
      setError("Card number must be 16 digits");
      return false;
    }
    if (!paymentData.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
      setError("Expiry date must be in MM/YY format");
      return false;
    }
    if (!paymentData.cvv || paymentData.cvv.length !== 3) {
      setError("CVV must be 3 digits");
      return false;
    }
    if (!paymentData.cardHolder) {
      setError("Card holder name is required");
      return false;
    }
    return true;
  };

  const handleProcessPayment = async () => {
    if (!validatePaymentData()) {
      return;
    }

    try {
      setProcessingPayment(true);
      setError(null);

      // Log the data being sent
      console.log('Processing payment with data:', {
        bookingId,
        paymentData: { ...paymentData, cardNumber: '****' },
        insuranceSelected,
        insuranceCost,
        deliveryCharge,
      });

      // Call payment processing endpoint
      const response = await api.post(`/bookings/${bookingId}/pay`, {
        paymentData,
        insuranceSelected,
        insuranceCost,
        deliveryCharge,
      });

      console.log('Payment response:', response.data);

      if (response.data) {
        setBooking(response.data);
      }
      setOpenPaymentDialog(false);

      // Show success message
      alert("Payment successful! Your booking is confirmed.");
      
      // Redirect to booking confirmation page
      setTimeout(() => {
        navigate(`/rental-booking/${bookingId}`);
      }, 2000);
    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error ||
                          err.message ||
                          "Payment processing failed. Please try again.";
      setError(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  }

  const handleCancelBooking = async () => {
    if (
      window.confirm("Are you sure you want to cancel this booking? You may be eligible for a refund.")
    ) {
      try {
        await api.post(`/bookings/${bookingId}/cancel`, {
          reason: "Cancelled by customer",
        });
        alert("Booking cancelled successfully. Refund will be processed.");
        navigate("/");
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to cancel booking. Please try again."
        );
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!booking) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Alert severity="error">Booking not found</Alert>
      </Container>
    );
  }

  const total = calculateTotal();
  const tax = total * 0.1;
  const finalTotal = total + tax;

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Booking Details */}
        <Grid item xs={12} md={8}>
          {/* Booking Header */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  Booking Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Booking ID: {booking._id}
                </Typography>
              </Box>
              <Chip
                label={booking.bookingStatus}
                color={
                  booking.isPaid ? "success" : "warning"
                }
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Rental Item Info */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                Rental Item
              </Typography>
              <Card sx={{ display: "flex" }}>
                {booking.rentalItem?.images?.[0] && (
                  <CardMedia
                    component="img"
                    sx={{ width: 150, height: 150, objectFit: "cover" }}
                    image={booking.rentalItem.images[0]}
                    alt={booking.rentalItem.name}
                  />
                )}
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700}>
                    {booking.rentalItem?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
                    {booking.rentalItem?.description}
                  </Typography>
                  <Typography variant="body2">
                    Category: {booking.rentalItem?.category}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Rental Dates */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                <DateRange sx={{ mr: 1, verticalAlign: "middle" }} />
                Rental Dates
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                    <Typography variant="caption" color="text.secondary">
                      From
                    </Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {new Date(booking.startDate).toLocaleDateString()}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                    <Typography variant="caption" color="text.secondary">
                      To
                    </Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {new Date(booking.endDate).toLocaleDateString()}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Duration: <strong>{booking.durationDays} day(s)</strong>
              </Typography>
              <Typography variant="body2">
                Quantity: <strong>{booking.quantity}</strong>
              </Typography>
            </Box>

            {/* Delivery Address Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                <LocalShipping sx={{ mr: 1, verticalAlign: "middle" }} />
                Delivery Address
              </Typography>
              
              {userAddresses.length > 0 ? (
                <Grid container spacing={2}>
                  {userAddresses.map((address) => (
                    <Grid item xs={12} key={address._id}>
                      <Paper
                        sx={{
                          p: 2,
                          cursor: "pointer",
                          border: selectedAddressId === address._id ? "2px solid #667eea" : "1px solid #e5e7eb",
                          bgcolor: selectedAddressId === address._id ? "#f3f4ff" : "#f9f9f9",
                          transition: "all 0.2s",
                          "&:hover": {
                            borderColor: "#667eea",
                            bgcolor: "#f3f4ff",
                          },
                        }}
                        onClick={() => setSelectedAddressId(address._id)}
                      >
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              border: "2px solid",
                              borderColor: selectedAddressId === address._id ? "#667eea" : "#ccc",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              mt: 0.5,
                              bgcolor: selectedAddressId === address._id ? "#667eea" : "transparent",
                            }}
                          >
                            {selectedAddressId === address._id && (
                              <Typography sx={{ color: "white", fontSize: "14px" }}>✓</Typography>
                            )}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" fontWeight={700}>
                              {address.type} • {address.recipientName}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {address.address}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {address.city}, {address.state} - {address.zipcode}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Phone: {address.phone}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="warning">
                  No addresses found. Please add an address from your profile.
                </Alert>
              )}
            </Box>

            {/* Payment Method Section */}
            {!booking.isPaid && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  Payment Method
                </Typography>
                <Grid container spacing={2}>
                  {/* Cash on Delivery */}
                  <Grid item xs={12} sm={6}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        border: paymentMethod === "cod" ? "2px solid #667eea" : "1px solid #e5e7eb",
                        bgcolor: paymentMethod === "cod" ? "#f3f4ff" : "#f9f9f9",
                        transition: "all 0.2s",
                        "&:hover": { borderColor: "#667eea" },
                      }}
                      onClick={() => setPaymentMethod("cod")}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            border: "2px solid",
                            borderColor: paymentMethod === "cod" ? "#667eea" : "#ccc",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: paymentMethod === "cod" ? "#667eea" : "transparent",
                          }}
                        >
                          {paymentMethod === "cod" && (
                            <Typography sx={{ color: "white", fontSize: "12px" }}>✓</Typography>
                          )}
                        </Box>
                        <Box>
                          <Typography variant="body1" fontWeight={700}>
                            💵 Cash on Delivery
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Pay when you receive
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* UPI */}
                  <Grid item xs={12} sm={6}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        border: paymentMethod === "upi" ? "2px solid #667eea" : "1px solid #e5e7eb",
                        bgcolor: paymentMethod === "upi" ? "#f3f4ff" : "#f9f9f9",
                        transition: "all 0.2s",
                        "&:hover": { borderColor: "#667eea" },
                      }}
                      onClick={() => setPaymentMethod("upi")}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            border: "2px solid",
                            borderColor: paymentMethod === "upi" ? "#667eea" : "#ccc",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: paymentMethod === "upi" ? "#667eea" : "transparent",
                          }}
                        >
                          {paymentMethod === "upi" && (
                            <Typography sx={{ color: "white", fontSize: "12px" }}>✓</Typography>
                          )}
                        </Box>
                        <Box>
                          <Typography variant="body1" fontWeight={700}>
                            📱 UPI
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Google Pay, PhonePe, etc.
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Credit/Debit Card */}
                  <Grid item xs={12} sm={6}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        border: paymentMethod === "card" ? "2px solid #667eea" : "1px solid #e5e7eb",
                        bgcolor: paymentMethod === "card" ? "#f3f4ff" : "#f9f9f9",
                        transition: "all 0.2s",
                        "&:hover": { borderColor: "#667eea" },
                      }}
                      onClick={() => setPaymentMethod("card")}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            border: "2px solid",
                            borderColor: paymentMethod === "card" ? "#667eea" : "#ccc",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: paymentMethod === "card" ? "#667eea" : "transparent",
                          }}
                        >
                          {paymentMethod === "card" && (
                            <Typography sx={{ color: "white", fontSize: "12px" }}>✓</Typography>
                          )}
                        </Box>
                        <Box>
                          <Typography variant="body1" fontWeight={700}>
                            💳 Card
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Credit or Debit Card
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Payment Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: { md: "sticky" }, top: 100, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Price Summary
            </Typography>

            {/* Price Breakdown Table */}
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Item Cost</TableCell>
                    <TableCell align="right">
                      {formatPrice(booking.totalCost)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Security Deposit ({booking.quantity} × {formatPrice(booking.securityDeposit / (booking.quantity || 1))})
                    </TableCell>
                    <TableCell align="right">
                      {formatPrice(booking.securityDeposit || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={insuranceSelected}
                            onChange={(e) => handleInsuranceChange(e.target.checked)}
                            disabled={booking.isPaid}
                          />
                        }
                        label={
                          <Typography variant="body2">
                            Damage Insurance (5%)
                          </Typography>
                        }
                        sx={{ m: 0 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {insuranceSelected ? formatPrice(insuranceAmount) : "-"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Delivery Charge</TableCell>
                    <TableCell align="right">{formatPrice(deliveryCharge)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Subtotal</TableCell>
                    <TableCell align="right" fontWeight={700}>
                      {formatPrice(total)}
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell>Tax (10%)</TableCell>
                    <TableCell align="right" fontWeight={700}>
                      {formatPrice(tax)}
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: "#e8f5e9" }}>
                    <TableCell fontWeight={700}>Total Amount</TableCell>
                    <TableCell align="right" fontWeight={700} sx={{ color: "secondary.main", fontSize: "1.2rem" }}>
                      {formatPrice(finalTotal)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 2 }} />

            {/* Payment Status */}
            {booking.isPaid ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                ✓ Payment Confirmed
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Payment pending
              </Alert>
            )}

            {/* Action Buttons */}
            <Stack spacing={2}>
              {!booking.isPaid && booking.bookingStatus !== "cancelled" && (
                <>
                  {paymentMethod === "cod" ? (
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      size="large"
                      onClick={handleConfirmCOD}
                      disabled={processingPayment || !selectedAddressId}
                      sx={{ fontWeight: 800, py: 1.5 }}
                    >
                      {processingPayment ? "Confirming..." : "✓ Confirm Order - Pay on Delivery"}
                    </Button>
                  ) : paymentMethod === "upi" ? (
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      size="large"
                      disabled={processingPayment || !selectedAddressId}
                      sx={{ fontWeight: 800, py: 1.5 }}
                    >
                      {processingPayment ? "Processing..." : "📱 Pay via UPI"}
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      size="large"
                      onClick={() => setOpenPaymentDialog(true)}
                      disabled={processingPayment || !selectedAddressId}
                      sx={{ fontWeight: 800, py: 1.5 }}
                    >
                      {processingPayment ? "Processing..." : "💳 Pay with Card"}
                    </Button>
                  )}
                </>
              )}

              {booking.bookingStatus === "awaiting_payment" && !booking.isPaid && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  onClick={handleCancelBooking}
                >
                  Cancel Booking
                </Button>
              )}

              <Button fullWidth variant="outlined" onClick={() => navigate("/")}>
                Continue Shopping
              </Button>
            </Stack>

            {/* Security Badge */}
            <Box sx={{ mt: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1, textAlign: "center" }}>
              <Security sx={{ mr: 1, verticalAlign: "middle", color: "success.main" }} />
              <Typography variant="caption" color="text.secondary">
                Secure payment powered by encrypted SSL
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Payment Dialog */}
      <Dialog
        open={openPaymentDialog}
        onClose={() => setOpenPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Complete Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <Alert severity="info">
              Enter your card details to complete the payment of{" "}
              <strong>{formatPrice(finalTotal)}</strong>
            </Alert>

            <TextField
              fullWidth
              label="Card Holder Name"
              name="cardHolder"
              value={paymentData.cardHolder}
              onChange={handlePaymentInputChange}
              placeholder="John Doe"
            />

            <TextField
              fullWidth
              label="Card Number"
              name="cardNumber"
              value={paymentData.cardNumber}
              onChange={handlePaymentInputChange}
              placeholder="1234567890123456"
              inputProps={{ maxLength: 16, pattern: "[0-9]*" }}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Expiry Date"
                  name="expiryDate"
                  value={paymentData.expiryDate}
                  onChange={handlePaymentInputChange}
                  placeholder="MM/YY"
                  inputProps={{ maxLength: 5 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="CVV"
                  name="cvv"
                  type="password"
                  value={paymentData.cvv}
                  onChange={handlePaymentInputChange}
                  placeholder="123"
                  inputProps={{ maxLength: 3, pattern: "[0-9]*" }}
                />
              </Grid>
            </Grid>

            <Alert severity="info" variant="outlined">
              This is a demo payment system. For testing, use any valid 16-digit number.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenPaymentDialog(false)}
            disabled={processingPayment}
          >
            Cancel
          </Button>
          <Button
            onClick={handleProcessPayment}
            variant="contained"
            color="secondary"
            disabled={processingPayment}
            startIcon={<PaymentIcon />}
          >
            {processingPayment ? "Processing..." : "Pay Now"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RentalBookingDetail;
