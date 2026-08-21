import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Container,
  Paper,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  CreditCard as CardIcon,
} from "@mui/icons-material";
import api from "../services/api";

const PaymentPage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});

  const [loading, setLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const amount = location.state?.amount || 0;
  const paymentMethod = location.state?.method || "razorpay";

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${orderId}`);
      setOrderDetails(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch order details");
      console.error("Error fetching order:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!window.Razorpay) {
      setError("Razorpay script failed to load. Please refresh the page.");
      return;
    }

    try {
      setPaymentProcessing(true);
      setError("");

      // Step 1: Create Razorpay order
      const orderResponse = await api.post("/payments/create-order", {
        orderId,
        amount,
      });

      const {
        razorpayOrderId,
        keyId,
        currency,
      } = orderResponse.data;

      // Step 2: Initialize Razorpay checkout
      const options = {
        key: keyId,
        amount: Math.round(amount * 100), // Amount in paise
        currency: currency,
        name: "ShopiKart",
        description: `Order Payment - ${orderId}`,
        image: "/logo.png", // Optional: Add your company logo
        order_id: razorpayOrderId,
        handler: async (response) => {
          // Step 3: Verify payment on backend
          await verifyPayment(response);
        },
        prefill: {
          email: user?.email || orderDetails?.guestEmail || "",
          contact: orderDetails?.shippingAddress?.phone || "",
        },
        notes: {
          orderId: orderId,
        },
        theme: {
          color: "#667eea",
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
            setError("Payment cancelled. Please try again.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initiate payment");
      console.error("Payment error:", err);
      setPaymentProcessing(false);
    }
  };

  const verifyPayment = async (paymentResponse) => {
    try {
      setPaymentProcessing(true);

      // Send payment details to backend for verification
      const verifyResponse = await api.post("/payments/verify", {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        orderId,
      });

      if (verifyResponse.data.success) {
        setSuccess(true);
        
        // Redirect to orders page after 2 seconds
        setTimeout(() => {
          navigate("/orders", {
            state: { paymentSuccess: true, orderId },
          });
        }, 2000);
      } else {
        setError(verifyResponse.data.message || "Payment verification failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Payment verification failed");
      console.error("Verification error:", err);
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", py: 5 }}>
      <Container maxWidth="sm">
        {/* Success State */}
        {success && (
          <Card elevation={0} sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <Box sx={{ mb: 2 }}>
                <CheckIcon sx={{ fontSize: 80, color: "#4caf50" }} />
              </Box>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: "#4caf50" }}>
                Payment Successful!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Your order has been confirmed. Redirecting to your orders page...
              </Typography>
              <CircularProgress />
            </CardContent>
          </Card>
        )}

        {/* Payment Form */}
        {!success && (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Card elevation={0} sx={{ borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", mb: 3 }}>
              <CardContent sx={{ p: 4 }}>
                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                  <CardIcon sx={{ fontSize: 40, color: "#667eea" }} />
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Secure Payment
                  </Typography>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Order Summary */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: "#666", fontWeight: 600 }}>
                    ORDER DETAILS
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Order ID:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {orderId}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Payment Method:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, textTransform: "uppercase" }}>
                      Razorpay
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Amount */}
                <Box
                  sx={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: 2,
                    p: 3,
                    mb: 3,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#fff", mb: 1 }}>
                    Total Amount
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ color: "#fff", fontWeight: 700 }}
                  >
                    ₹{amount.toLocaleString("en-IN")}
                  </Typography>
                </Box>

                {/* Security Badge */}
                <Box sx={{ background: "#f0f4ff", borderRadius: 2, p: 2, mb: 3, textAlign: "center" }}>
                  <Typography variant="body2" sx={{ color: "#667eea", fontSize: "0.9rem" }}>
                    🔒 Secured by Razorpay | SSL Encrypted
                  </Typography>
                </Box>

                {/* Payment Button */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handlePayment}
                  disabled={paymentProcessing}
                  sx={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    py: 1.5,
                    fontWeight: 600,
                    fontSize: "1rem",
                    textTransform: "none",
                    "&:hover": {
                      background: "linear-gradient(135deg, #5568d3 0%, #683a91 100%)",
                    },
                  }}
                >
                  {paymentProcessing ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                      Processing...
                    </>
                  ) : (
                    "Pay with Razorpay"
                  )}
                </Button>

                {/* Back Button */}
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => navigate(`/orders/${orderId}`)}
                  disabled={paymentProcessing}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    fontWeight: 600,
                    fontSize: "1rem",
                    textTransform: "none",
                  }}
                >
                  Back to Order
                </Button>
              </CardContent>
            </Card>

            {/* Info Box */}
            <Card elevation={0} sx={{ borderRadius: 3, background: "#f0f4ff", border: "1px solid #e0e7ff" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: "#667eea" }}>
                  ℹ️ Payment Information
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • Your payment is secured with Razorpay's advanced encryption
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  • You will be asked to enter your card/UPI/bank details in the Razorpay window
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Do not refresh or close this page until payment is complete
                </Typography>
              </CardContent>
            </Card>
          </>
        )}
      </Container>
    </Box>
  );
};

export default PaymentPage;
