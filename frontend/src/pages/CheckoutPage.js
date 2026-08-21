import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  useTheme,
  Chip,
  Stack,
  Step,
  Stepper,
  StepLabel,
} from "@mui/material";
import {
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  CreditCard as CardIcon,
  Smartphone as UPIIcon,
  Money as CashIcon,
} from "@mui/icons-material";
import api from "../services/api";
import { clearCart as clearLocalCart, clearUserCart } from "../features/cartSlice";
import CouponInput from "../components/CouponInput";

const formatPrice = (price) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();

  // Get shopping cart items only
  const { items = [] } = useSelector((state) => state.cart || {});
  const { user, isAuthenticated } = useSelector((state) => state.auth || {});

  const [activeStep, setActiveStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isGuest, setIsGuest] = useState(true); // Start with guest checkout as default
  const [guestEmail, setGuestEmail] = useState("");
  const [selectionMade, setSelectionMade] = useState(false); // Track if user has made a selection
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const steps = ["Shipping", "Payment", "Confirm"];

  useEffect(() => {
    // Check if cart is empty first
    if (!items || items.length === 0) {
      navigate("/cart");
      return;
    }

    // Allow guest or authenticated users to checkout
    // Only redirect to login if not authenticated AND not in guest mode AND cart is not empty
    // This gives user time to toggle between guest/login
  }, [items, navigate]);

  // Redirect to login when user selects "Sign In"
  useEffect(() => {
    // Only redirect if user actively selected Sign In (not guest) and is not authenticated
    // AND they've made a selection (not on initial load)
    if (selectionMade && !isGuest && !isAuthenticated) {
      navigate("/login", { state: { from: "/checkout" } });
    }
  }, [isGuest, selectionMade, isAuthenticated, navigate]);

  useEffect(() => {
    // Pre-fill user data if authenticated
    if (isAuthenticated && user) {
      setIsGuest(false); // Set to registered user mode
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        zipcode: user.zipcode || "",
        country: user.country || "",
      });
    }
  }, [isAuthenticated, user]);

  // Shopping cart calculations using discounted price if available
  const subtotal = (items || []).reduce((acc, item) => {
    // Use discountPrice if available, otherwise use price
    const dp = Number(item.discountPrice ?? item.discount ?? 0);
    const price = dp > 0 && dp < Number(item.price) ? dp : Number(item.price ?? 0);
    const qty = Number(item.quantity ?? item.qty ?? 1);
    return acc + price * qty;
  }, 0);
  const tax = parseFloat((subtotal * 0.1).toFixed(2));
  const shipping = subtotal > 2500 ? 0 : 150;
  const total = parseFloat((subtotal + tax + shipping - couponDiscount).toFixed(2));

  // Handle coupon applied
  const handleCouponApplied = (couponData) => {
    console.log('[Checkout] Coupon applied:', couponData);
    setAppliedCoupon(couponData); // couponData has: code, name, discount, etc.
    setCouponDiscount(couponData.discount || 0);
  };

  // Handle coupon removed
  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  // Send OTP to guest email
  const handleSendOtp = async () => {
    setError("");
    if (!guestEmail) {
      setError("Please enter an email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      await api.post("/users/send-otp", { email: guestEmail });
      setOtpSent(true);
      setSuccess("OTP sent to your email!");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    }
  };

  // Verify OTP for guest email
  const handleVerifyOtp = async () => {
    setError("");
    if (!otp || otp.length < 4) {
      setError("Please enter a valid OTP");
      return;
    }

    setVerifyingOtp(true);
    try {
      const response = await api.post("/users/verify-otp", {
        email: guestEmail,
        otp: otp,
      });
      
      if (response.data.success) {
        setEmailVerified(true);
        setSuccess("Email verified successfully!");
        setError("");
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Fetch location details by pincode
  const fetchLocationByPincode = async (pincode) => {
    if (pincode.length !== 6) return;
    
    setFetchingLocation(true);
    setPincodeError("");
    
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const locationData = data[0].PostOffice[0];
        setFormData((prev) => ({
          ...prev,
          city: locationData.District || prev.city,
          state: locationData.State || prev.state,
          country: "India"
        }));
        setPincodeError("");
      } else {
        setPincodeError("Invalid pincode. Please enter a valid Indian pincode.");
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      setPincodeError("Failed to fetch location. Please enter manually.");
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Phone number validation
    if (name === "phone") {
      // Only allow digits and limit to 10
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
        
        // Real-time validation
        if (digitsOnly.length > 0 && digitsOnly.length < 10) {
          setPhoneError(`Enter ${10 - digitsOnly.length} more digit${10 - digitsOnly.length > 1 ? 's' : ''}`);
        } else if (digitsOnly.length === 10) {
          if (!/^[6-9]/.test(digitsOnly)) {
            setPhoneError("Mobile number should start with 6, 7, 8, or 9");
          } else {
            setPhoneError("");
          }
        } else {
          setPhoneError("");
        }
      }
      return;
    }
    
    // Pincode validation and auto-fill
    if (name === "zipcode") {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length <= 6) {
        setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
        
        // Real-time validation
        if (digitsOnly.length > 0 && digitsOnly.length < 6) {
          setPincodeError(`Enter ${6 - digitsOnly.length} more digit${6 - digitsOnly.length > 1 ? 's' : ''}`);
        } else if (digitsOnly.length === 6) {
          setPincodeError("");
          // Fetch location details
          fetchLocationByPincode(digitsOnly);
        } else {
          setPincodeError("");
        }
      }
      return;
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const required = ["name", "phone", "address", "city", "zipcode", "country"];
    for (const key of required) {
      if (!formData[key] || String(formData[key]).trim() === "") {
        setError(`Please enter your ${key === "zipcode" ? "zip/postal code" : key}.`);
        return false;
      }
    }
    // Strict phone validation - exactly 10 digits
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      setPhoneError("Phone number must be exactly 10 digits");
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      setError("Please enter a valid Indian mobile number (starting with 6-9).");
      setPhoneError("Please enter a valid Indian mobile number");
      return false;
    }
    setPhoneError("");
    // Guest email validation and verification
    if (isGuest) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!guestEmail || !emailRegex.test(guestEmail)) {
        setError("Please enter a valid email address.");
        return false;
      }
      // Check if email is verified for guest checkout
      if (!emailVerified) {
        setError("Please verify your email before checkout.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!validateForm()) return;

    if (!items || items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);

    // Build items payload with discounted prices
    const orderItems = items.map((it) => {
      // Use discounted price if available
      const dp = Number(it.discountPrice ?? it.discount ?? 0);
      const price = dp > 0 && dp < Number(it.price) ? dp : Number(it.price ?? 0);
      return {
        productId: it.productId ?? it._id ?? it.id,
        name: it.name ?? it.product?.name,
        price: price,
        quantity: Number(it.quantity ?? it.qty ?? 1),
      };
    });

    const payload = {
      items: orderItems,
      shippingAddress: {
        ...formData,
      },
      subtotal,
      tax,
      shipping,
      total,
      couponCode: appliedCoupon?.code || null,
      couponDiscount: couponDiscount,
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "Pending" : "Processing",
      note: `Placed via ${paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod.toUpperCase()}`,
    };

    // Add guest email if guest checkout
    if (isGuest) {
      payload.guestEmail = guestEmail;
    }

    try {
      // Use guest endpoint for guest checkout, regular endpoint for authenticated users
      const endpoint = isGuest ? "/orders/guest" : "/orders";
      const res = await api.post(endpoint, payload);

      if (res && (res.status === 200 || res.status === 201) && res.data) {
        setSuccess("Order placed successfully!");
        setOpenSnack(true);

        // Clear the applied coupon state (backend handles usage tracking)
        if (appliedCoupon?.code) {
          setAppliedCoupon(null);
          setCouponDiscount(0);
        }

        // Clear shopping cart - both local and database
        try {
          // Clear local cart state
          dispatch(clearLocalCart());
          
          // If authenticated, also clear database cart
          if (isAuthenticated) {
            dispatch(clearUserCart());
          }
        } catch (clearErr) {
          console.warn("Failed to clear cart:", clearErr);
        }

        // Handle different payment methods
        if (paymentMethod === "cod") {
          // Direct confirmation for COD
          setTimeout(() => {
            navigate("/orders");
          }, 1500);
        } else {
          // Redirect to payment gateway for UPI/Card
          setTimeout(() => {
            // TODO: Integrate with actual payment gateway (Razorpay, Stripe, etc.)
            const orderId = res.data._id || res.data.id;
            navigate(`/payment/${orderId}`, { state: { amount: total, method: paymentMethod } });
          }, 1500);
        }
      } else {
        setError("Order placed but server returned unexpected response.");
      }
    } catch (err) {
      console.error("Order error:", err);
      const backendMsg = err?.response?.data?.message || err?.response?.data || err.message;
      setError(typeof backendMsg === "string" ? backendMsg : "Error placing order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}>
      <Container maxWidth="lg" sx={{ py: 5 }}>
        {/* Header */}
        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', width: '100%', height: 3, borderRadius: 2, overflow: 'hidden', mb: 2 }}>
            <Box sx={{ flex: 1, background: '#FF9933' }} />
            <Box sx={{ flex: 1, background: '#FFFFFF' }} />
            <Box sx={{ flex: 1, background: '#138808' }} />
          </Box>
          <Typography variant="h3" fontWeight={900} sx={{ mb: 1, color: "#667eea" }}>
            Secure Checkout
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: "1.1rem" }}>
            Complete your order securely — delivering across India 🇮🇳
          </Typography>
        </Box>

        {/* Guest/Login Toggle */}
        {!isAuthenticated && (
          <Card elevation={0} sx={{ mb: 4, borderRadius: 3, background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
            <CardContent sx={{ p: 3 }}>
              <FormControl component="fieldset" fullWidth>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: "#333" }}>
                  Checkout Type
                </Typography>
                <RadioGroup
                  row
                  value={isGuest ? "guest" : "login"}
                  onChange={(e) => {
                    setSelectionMade(true);
                    setIsGuest(e.target.value === "guest");
                  }}
                >
                  <FormControlLabel
                    value="login"
                    control={<Radio />}
                    label="Sign In"
                    sx={{ mr: 4 }}
                  />
                  <FormControlLabel
                    value="guest"
                    control={<Radio />}
                    label="Continue as Guest"
                  />
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>
        )}

        {/* Stepper */}
        <Box sx={{ mb: 5, background: "#fff", borderRadius: 3, p: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <Stepper activeStep={activeStep} sx={{ "& .MuiStepLabel-label": { fontWeight: 600 } }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

        <Grid container spacing={4}>
          {/* Left Column - Forms */}
          <Grid item xs={12} lg={7}>
            {/* Guest Email Card (only for guest checkout) */}
            {activeStep <= 0 && isGuest && (
              <Card elevation={0} sx={{ mb: 3, borderRadius: 3, background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                    <Box sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: "50%", p: 1.5, color: "#fff" }}>
                      <Typography sx={{ fontSize: 24 }}>✉️</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={800}>
                      Email Verification
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  {!otpSent ? (
                    <>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        variant="outlined"
                        required
                        placeholder="your.email@example.com"
                        disabled={emailVerified}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            "&:hover fieldset": { borderColor: "#667eea" },
                            "&.Mui-focused fieldset": { borderColor: "#667eea" },
                          },
                        }}
                      />
                      <Typography variant="caption" sx={{ mt: 1, display: "block", color: "#666", mb: 2 }}>
                        We'll send a one-time password to verify your email
                      </Typography>
                      <Button
                        fullWidth
                        variant="contained"
                        sx={{
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "#fff",
                          fontWeight: 800,
                          py: 1.2,
                          borderRadius: 2,
                          textTransform: "none",
                          fontSize: "1rem",
                          "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 16px rgba(102, 126, 234, 0.3)" },
                        }}
                        onClick={handleSendOtp}
                        disabled={emailVerified}
                      >
                        {emailVerified ? "✓ Email Verified" : "Send OTP"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <TextField
                        fullWidth
                        label="Enter OTP"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        variant="outlined"
                        placeholder="000000"
                        inputProps={{ maxLength: 6 }}
                        disabled={emailVerified}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            "&:hover fieldset": { borderColor: "#667eea" },
                            "&.Mui-focused fieldset": { borderColor: "#667eea" },
                          },
                        }}
                      />
                      <Typography variant="caption" sx={{ mt: 1, display: "block", color: "#666", mb: 2 }}>
                        OTP sent to {guestEmail}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          fullWidth
                          variant="outlined"
                          sx={{
                            borderColor: "#667eea",
                            color: "#667eea",
                            fontWeight: 800,
                            py: 1.2,
                            borderRadius: 2,
                            textTransform: "none",
                            "&:hover": { background: "rgba(102, 126, 234, 0.05)" },
                          }}
                          onClick={() => {
                            setOtpSent(false);
                            setOtp("");
                          }}
                          disabled={emailVerified || verifyingOtp}
                        >
                          Change Email
                        </Button>
                        <Button
                          fullWidth
                          variant="contained"
                          sx={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "#fff",
                            fontWeight: 800,
                            py: 1.2,
                            borderRadius: 2,
                            textTransform: "none",
                            fontSize: "1rem",
                            "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 16px rgba(102, 126, 234, 0.3)" },
                          }}
                          onClick={handleVerifyOtp}
                          disabled={emailVerified || verifyingOtp || otp.length < 4}
                        >
                          {verifyingOtp ? (
                            <CircularProgress size={20} sx={{ color: "#fff" }} />
                          ) : emailVerified ? (
                            "✓ Verified"
                          ) : (
                            "Verify OTP"
                          )}
                        </Button>
                      </Stack>
                    </>
                  )}

                  {emailVerified && (
                    <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                      ✓ Email verified successfully. You can proceed with checkout.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Shipping Address Card */}
            {activeStep <= 0 && (
              <Card elevation={0} sx={{ mb: 3, borderRadius: 3, background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                    <Box sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: "50%", p: 1.5, color: "#fff" }}>
                      <ShippingIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={800}>
                      Shipping Address
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        variant="outlined"
                        required
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            "&:hover fieldset": { borderColor: "#667eea" },
                            "&.Mui-focused fieldset": { borderColor: "#667eea" },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        variant="outlined"
                        required
                        error={!!phoneError}
                        helperText={phoneError || "Enter 10-digit mobile number"}
                        inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            "&:hover fieldset": { borderColor: "#667eea" },
                            "&.Mui-focused fieldset": { borderColor: "#667eea" },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Street Address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        variant="outlined"
                        required
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            "&:hover fieldset": { borderColor: "#667eea" },
                            "&.Mui-focused fieldset": { borderColor: "#667eea" },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Pincode"
                        name="zipcode"
                        value={formData.zipcode}
                        onChange={handleChange}
                        variant="outlined"
                        required
                        error={!!pincodeError}
                        helperText={pincodeError || "Enter 6-digit Indian pincode"}
                        inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            "&:hover fieldset": { borderColor: "#667eea" },
                            "&.Mui-focused fieldset": { borderColor: "#667eea" },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="City"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        variant="outlined"
                        required
                        disabled={fetchingLocation}
                        helperText={fetchingLocation ? "Fetching from pincode..." : ""}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            "&:hover fieldset": { borderColor: "#667eea" },
                            "&.Mui-focused fieldset": { borderColor: "#667eea" },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="State/Province"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        variant="outlined"
                        disabled={fetchingLocation}
                        helperText={fetchingLocation ? "Fetching from pincode..." : ""}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            "&:hover fieldset": { borderColor: "#667eea" },
                            "&.Mui-focused fieldset": { borderColor: "#667eea" },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        variant="outlined"
                        required
                        disabled={fetchingLocation}
                        helperText={fetchingLocation ? "Fetching from pincode..." : ""}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            "&:hover fieldset": { borderColor: "#667eea" },
                            "&.Mui-focused fieldset": { borderColor: "#667eea" },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        disabled={isGuest && !emailVerified}
                        sx={{
                          background: isGuest && !emailVerified ? "#ccc" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "#fff",
                          fontWeight: 800,
                          py: 1.5,
                          borderRadius: 2,
                          textTransform: "none",
                          fontSize: "1rem",
                          "&:hover": isGuest && !emailVerified ? {} : { transform: "translateY(-2px)", boxShadow: "0 12px 24px rgba(102, 126, 234, 0.3)" },
                        }}
                        onClick={() => setActiveStep(1)}
                        title={isGuest && !emailVerified ? "Please verify your email first" : ""}
                      >
                        {isGuest && !emailVerified ? "Verify Email First" : "Continue to Payment"}
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Payment Method Card */}
            {activeStep === 1 && (
              <Card elevation={0} sx={{ mb: 3, borderRadius: 3, background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                    <Box sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: "50%", p: 1.5, color: "#fff" }}>
                      <PaymentIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={800}>
                      Payment Method
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                    <RadioGroup
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      {/* Cash on Delivery */}
                      <Box
                        sx={{
                          p: 2.5,
                          mb: 2,
                          border: "2px solid",
                          borderColor: paymentMethod === "cod" ? "#667eea" : "#e0e0e0",
                          borderRadius: 2,
                          background: paymentMethod === "cod" ? "linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)" : "#fff",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          "&:hover": { borderColor: "#667eea", boxShadow: "0 8px 24px rgba(102, 126, 234, 0.15)" },
                        }}
                      >
                        <FormControlLabel
                          value="cod"
                          control={<Radio />}
                          label={
                            <Box sx={{ ml: 1 }}>
                              <Typography variant="subtitle1" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CashIcon sx={{ color: "#667eea" }} /> Cash on Delivery
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Pay when your order is delivered
                              </Typography>
                            </Box>
                          }
                          sx={{ width: "100%" }}
                        />
                      </Box>

                      {/* UPI */}
                      <Box
                        sx={{
                          p: 2.5,
                          mb: 2,
                          border: "2px solid",
                          borderColor: paymentMethod === "upi" ? "#667eea" : "#e0e0e0",
                          borderRadius: 2,
                          background: paymentMethod === "upi" ? "linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)" : "#fff",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          "&:hover": { borderColor: "#667eea", boxShadow: "0 8px 24px rgba(102, 126, 234, 0.15)" },
                        }}
                      >
                        <FormControlLabel
                          value="upi"
                          control={<Radio />}
                          label={
                            <Box sx={{ ml: 1 }}>
                              <Typography variant="subtitle1" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <UPIIcon sx={{ color: "#667eea" }} /> UPI Payment
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Pay via Google Pay, PhonePe, BHIM, etc.
                              </Typography>
                            </Box>
                          }
                          sx={{ width: "100%" }}
                        />
                      </Box>

                      {/* Credit/Debit Card */}
                      <Box
                        sx={{
                          p: 2.5,
                          border: "2px solid",
                          borderColor: paymentMethod === "card" ? "#667eea" : "#e0e0e0",
                          borderRadius: 2,
                          background: paymentMethod === "card" ? "linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)" : "#fff",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          "&:hover": { borderColor: "#667eea", boxShadow: "0 8px 24px rgba(102, 126, 234, 0.15)" },
                        }}
                      >
                        <FormControlLabel
                          value="card"
                          control={<Radio />}
                          label={
                            <Box sx={{ ml: 1 }}>
                              <Typography variant="subtitle1" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CardIcon sx={{ color: "#667eea" }} /> Debit/Credit Card
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Visa, Mastercard, American Express
                              </Typography>
                            </Box>
                          }
                          sx={{ width: "100%" }}
                        />
                      </Box>
                    </RadioGroup>
                  </FormControl>

                  <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    {paymentMethod === "cod"
                      ? "✓ Order will be confirmed immediately. Pay on delivery."
                      : "� Secured by Razorpay. Pay with Card, UPI, NetBanking, or Wallet."}
                  </Alert>

                  <Stack direction="row" spacing={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{
                        borderColor: "#667eea",
                        color: "#667eea",
                        fontWeight: 800,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: "none",
                        fontSize: "1rem",
                        "&:hover": { background: "rgba(102, 126, 234, 0.05)" },
                      }}
                      onClick={() => setActiveStep(0)}
                    >
                      Back
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "#fff",
                        fontWeight: 800,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: "none",
                        fontSize: "1rem",
                        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 24px rgba(102, 126, 234, 0.3)" },
                      }}
                      onClick={() => setActiveStep(2)}
                    >
                      Review Order
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Confirm Order Card */}
            {activeStep === 2 && (
              <Card elevation={0} sx={{ mb: 3, borderRadius: 3, background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                    <Box sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: "50%", p: 1.5, color: "#fff" }}>
                      <CheckIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={800}>
                      Review Order
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  <Box sx={{ background: "#f9f9f9", p: 2.5, borderRadius: 2, mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, color: "#667eea" }}>
                      SHIPPING ADDRESS
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {formData.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {formData.address}, {formData.city}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {formData.state} {formData.zipcode}
                    </Typography>
                    <Typography variant="body2">
                      {formData.country} • {formData.phone}
                    </Typography>
                  </Box>

                  <Box sx={{ background: "#f9f9f9", p: 2.5, borderRadius: 2, mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, color: "#667eea" }}>
                      PAYMENT METHOD
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {paymentMethod === "cod"
                        ? "💵 Cash on Delivery"
                        : paymentMethod === "upi"
                        ? "📱 UPI Payment"
                        : "💳 Debit/Credit Card"}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{
                        borderColor: "#667eea",
                        color: "#667eea",
                        fontWeight: 800,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: "none",
                        fontSize: "1rem",
                        "&:hover": { background: "rgba(102, 126, 234, 0.05)" },
                      }}
                      onClick={() => setActiveStep(1)}
                    >
                      Back
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "#fff",
                        fontWeight: 800,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: "none",
                        fontSize: "1rem",
                        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 24px rgba(102, 126, 234, 0.3)" },
                      }}
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <CircularProgress size={24} /> : `Place Order (₹${total})`}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Right Column - Order Summary */}
          <Grid item xs={12} lg={5}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                p: 0,
                position: { lg: "sticky" },
                top: { lg: 100 },
                boxShadow: "0 12px 40px rgba(102, 126, 234, 0.3)",
              }}
            >
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h6" fontWeight={900} sx={{ mb: 3, fontSize: "1.1rem" }}>
                  Order Summary
                </Typography>

                {/* Items List */}
                <Box sx={{ mb: 3, maxHeight: 300, overflowY: "auto", pr: 1 }}>
                  {items.map((item) => {
                    const name = item.name ?? item.product?.name ?? "Product";
                    const qty = Number(item.quantity ?? item.qty ?? 1);
                    const dp = Number(item.discountPrice ?? item.discount ?? 0);
                    const price = dp > 0 && dp < Number(item.price) ? dp : Number(item.price ?? 0);
                    return (
                      <Box
                        key={item.productId ?? item._id ?? name}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1.5,
                          pb: 1.5,
                          borderBottom: "1px solid rgba(255,255,255,0.2)",
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                            {name}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.9 }}>
                            {qty} × {formatPrice(price)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={800}>
                          {formatPrice(price * qty)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                <Divider sx={{ my: 2, opacity: 0.3 }} />

                {/* Coupon Input Section */}
                <Box sx={{ mb: 2, background: "rgba(255,255,255,0.1)", borderRadius: 2, p: 2 }}>
                  <CouponInput
                    orderTotal={subtotal}
                    cartItems={items}
                    onCouponApplied={handleCouponApplied}
                    onCouponRemoved={handleCouponRemoved}
                    appliedCoupon={appliedCoupon}
                  />
                </Box>

                <Divider sx={{ my: 2, opacity: 0.3 }} />

                {/* Pricing Breakdown */}
                <Stack spacing={1.5} sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ opacity: 0.95 }}>
                      Subtotal
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatPrice(subtotal)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ opacity: 0.95 }}>
                      Tax (10%)
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatPrice(tax)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ opacity: 0.95 }}>
                      Shipping
                    </Typography>
                    {shipping === 0 ? (
                      <Chip
                        label="FREE"
                        size="small"
                        sx={{ background: "#10b981", color: "#fff", fontWeight: 700, height: 20 }}
                      />
                    ) : (
                      <Typography variant="body2" fontWeight={700}>
                        {formatPrice(shipping)}
                      </Typography>
                    )}
                  </Box>

                  {couponDiscount > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ opacity: 0.95 }}>
                          Coupon ({appliedCoupon?.code})
                        </Typography>
                        <Chip
                          label="Applied"
                          size="small"
                          sx={{ background: "#10b981", color: "#fff", fontWeight: 700, height: 18, fontSize: "0.65rem" }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight={700} sx={{ color: "#10b981" }}>
                        -{formatPrice(couponDiscount)}
                      </Typography>
                    </Box>
                  )}
                </Stack>

                <Divider sx={{ my: 2, opacity: 0.3 }} />

                {/* Total */}
                <Box sx={{ background: "rgba(255,255,255,0.15)", p: 2.5, borderRadius: 2, textAlign: "center", mb: 3 }}>
                  <Typography variant="caption" sx={{ opacity: 0.85, display: "block", mb: 0.5, fontWeight: 600 }}>
                    TOTAL AMOUNT
                  </Typography>
                  <Typography variant="h4" fontWeight={900} sx={{ fontSize: "2rem" }}>
                    {formatPrice(total)}
                  </Typography>
                </Box>

                <Box sx={{ background: "rgba(255,255,255,0.12)", borderRadius: 2, p: 2, border: "1px solid rgba(255,255,255,0.2)" }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1.5 }}>
                    <CheckIcon sx={{ fontSize: 18, flexShrink: 0, mt: 0.3 }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      Free shipping on orders above ₹2,500 across India
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1.5 }}>
                    <CheckIcon sx={{ fontSize: 18, flexShrink: 0, mt: 0.3 }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      UPI, Cards, Net Banking & Cash on Delivery
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <CheckIcon sx={{ fontSize: 18, flexShrink: 0, mt: 0.3 }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      Secure checkout & easy 30-day returns
                    </Typography>
                  </Box>
                  {/* Indian Trust Badge */}
                  <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem', opacity: 0.9 }}>
                      🇮🇳 Proudly serving customers across Bharat
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={openSnack}
        autoHideDuration={3000}
        onClose={() => setOpenSnack(false)}
        message={success || error}
      />
    </Box>
  );
};

export default CheckoutPage;
