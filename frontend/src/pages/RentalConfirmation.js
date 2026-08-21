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
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Dialog,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  DateRange,
  LocalShipping,
  Add as AddIcon,
  VerifiedUser as VerifiedIcon,
} from "@mui/icons-material";
import api from "../services/api";
import IdentityVerificationDialog from "../components/IdentityVerificationDialog";

const formatPrice = (price) => {
  return "₹" + new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const RentalConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useSelector((state) => state.auth || {});

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [confirming, setConfirming] = useState(false);
  const [insuranceSelected, setInsuranceSelected] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [openVerificationDialog, setOpenVerificationDialog] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [newAddressData, setNewAddressData] = useState({
    recipientName: user?.name || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    type: 'home',
  });
  const [phoneError, setPhoneError] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [fetchingLocation, setFetchingLocation] = useState(false);

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    if (bookingId) {
      fetchBookingDetails();
      fetchUserAddresses();
      fetchVerificationStatus();
    }
  }, [bookingId, isAuthenticated, authLoading]);

  const fetchVerificationStatus = async () => {
    if (!bookingId) return;
    
    try {
      const { data } = await api.get(`/rental-security/${bookingId}/verification/status`);
      setVerificationStatus(data);
    } catch (err) {
      console.error("Error fetching verification status:", err);
      // Set default status if fetch fails - don't block the page
      setVerificationStatus({
        identityVerification: { status: 'not_submitted' },
        contactVerification: { phoneVerified: false },
        depositInfo: { status: 'pending' },
        bookingStatus: 'pending',
        canConfirm: false,
        isIdentityVerified: false,
      });
    }
  };

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/bookings/${bookingId}`);
      console.log("Booking details fetched:", data);
      
      // Only redirect if booking is fully paid/completed, allow pending bookings to stay
      if (data?.bookingStatus === "paid" || data?.status === "completed") {
        console.log("Booking already paid/completed, redirecting to orders");
        setTimeout(() => {
          navigate("/orders");
        }, 1500);
        setError("Order already processed! Redirecting to orders page...");
        return;
      }
      
      setBooking(data);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to load booking details";
      console.error("Error fetching booking:", err);
      console.error("Full error details:", err.response);
      setError(errorMsg);
      
      // Don't auto-redirect on errors - let user see the error message
      // Only redirect if explicitly 404 and user confirms
      if (err.response?.status === 404) {
        console.log("Booking not found (404), but staying on page to show error");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAddresses = async () => {
    try {
      const { data } = await api.get("/users/profile");
      console.log("User profile data:", data);
      console.log("Profile addresses array:", data?.addresses);
      console.log("Profile old address fields:", { 
        address: data?.address, 
        city: data?.city, 
        state: data?.state, 
        zipcode: data?.zipcode, 
        phone: data?.phone 
      });
      
      let addressesToUse = [];
      
      // First, add any saved addresses in the new format
      if (data?.addresses && Array.isArray(data.addresses) && data.addresses.length > 0) {
        console.log("Found addresses in new format:", data.addresses);
        addressesToUse = [...data.addresses];
      }
      
      // Also check for profile address information (old format) and add it if not already in addresses
      if (data && (data.address || data.city || data.state || data.zipcode)) {
        const profileAddress = {
          _id: 'default-' + data._id,
          recipientName: data.name || 'Default Address',
          phone: data.phone || 'Not provided',
          address: data.address || 'Not provided',
          city: data.city || 'Not provided',
          state: data.state || 'Not provided',
          zipcode: data.zipcode || 'Not provided',
          type: 'home',
          isDefault: true
        };
        console.log("Adding profile address:", profileAddress);
        addressesToUse.unshift(profileAddress); // Add at the beginning
      }

      if (addressesToUse.length > 0) {
        console.log("Final addresses to use:", addressesToUse);
        setUserAddresses(addressesToUse);
        setSelectedAddressId(addressesToUse[0]._id);
        setError(null);
      } else {
        setError("No addresses found. Please update your profile with address information.");
        setUserAddresses([]);
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setError("Failed to load addresses. Please try again.");
      setUserAddresses([]);
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedAddressId) {
      setError("Please select a delivery address");
      console.log("No address selected. User addresses:", userAddresses);
      return;
    }

    try {
      setConfirming(true);
      setError(null);

      // Find the selected address object
      const selectedAddress = userAddresses.find(addr => addr._id === selectedAddressId);
      if (!selectedAddress) {
        setError("Selected address not found");
        return;
      }

      // Calculate all costs
      const rentalCost = booking.totalCost || 0;
      const calculatedInsuranceCost = insuranceSelected ? rentalCost * 0.05 : 0;
      const securityDep = booking.securityDeposit || 0;
      const subtotal = rentalCost + securityDep + calculatedInsuranceCost;
      const calculatedTax = subtotal * 0.1;
      const deliveryChg = booking.deliveryCharge || 0;
      
      // Prepare payload - use actual address ID only if it's not a default address
      const payloadData = {
        paymentMethod,
        insuranceSelected,
        insuranceCost: calculatedInsuranceCost,
        securityDeposit: securityDep,
        deliveryCharge: deliveryChg,
        taxAmount: calculatedTax,
        // If it's a default address (starts with 'default-'), send address data inline
        // Otherwise send the database ID
        ...(selectedAddressId.startsWith('default-') 
          ? {
              deliveryAddressData: {
                recipientName: selectedAddress.recipientName,
                phone: selectedAddress.phone,
                address: selectedAddress.address,
                city: selectedAddress.city,
                state: selectedAddress.state,
                zipcode: selectedAddress.zipcode,
              }
            }
          : {
              addressId: selectedAddressId
            }
        )
      };

      console.log("Confirming booking with payload:", payloadData);

      const endpoint =
        paymentMethod === "cod"
          ? `/bookings/${bookingId}/confirm-cod`
          : `/bookings/${bookingId}/pay`;

      console.log("Sending request to:", endpoint);

      const response = await api.post(endpoint, payloadData);

      console.log("Confirmation response:", response.data);

      if (response.data) {
        const message =
          paymentMethod === "cod"
            ? "Order confirmed! Payment will be collected on delivery."
            : "Payment processed successfully!";
        
        alert(message);
        
        // Delay navigation slightly to ensure backend is updated
        setTimeout(() => {
          navigate("/orders");
        }, 1000);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to confirm order";
      console.error("Error confirming order:", err);
      setError(errorMessage);
    } finally {
      setConfirming(false);
    }
  };

  const handleAddNewAddress = async () => {
    try {
      // Validate required fields
      if (!newAddressData.recipientName || !newAddressData.phone || !newAddressData.address || 
          !newAddressData.city || !newAddressData.state || !newAddressData.zipcode) {
        setError("Please fill all address fields");
        return;
      }

      // Validate phone number - exactly 10 digits
      const phoneDigits = newAddressData.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        setError("Phone number must be exactly 10 digits");
        setPhoneError("Phone number must be exactly 10 digits");
        return;
      }
      if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
        setError("Please enter a valid Indian mobile number (starting with 6-9)");
        setPhoneError("Please enter a valid Indian mobile number");
        return;
      }
      setPhoneError("");

      const { data } = await api.post("/users/addresses/add", newAddressData);
      console.log("New address added:", data);

      // Refresh all addresses using the same logic as fetchUserAddresses
      const { data: updatedData } = await api.get("/users/profile");
      console.log("Updated user profile with addresses:", updatedData);
      
      let addressesToUse = [];
      
      // First, add any saved addresses in the new format
      if (updatedData?.addresses && Array.isArray(updatedData.addresses) && updatedData.addresses.length > 0) {
        console.log("Found addresses in new format:", updatedData.addresses);
        addressesToUse = [...updatedData.addresses];
      }
      
      // Also check for profile address information (old format) and add it if not already in addresses
      if (updatedData && (updatedData.address || updatedData.city || updatedData.state || updatedData.zipcode)) {
        const profileAddress = {
          _id: 'default-' + updatedData._id,
          recipientName: updatedData.name || 'Default Address',
          phone: updatedData.phone || 'Not provided',
          address: updatedData.address || 'Not provided',
          city: updatedData.city || 'Not provided',
          state: updatedData.state || 'Not provided',
          zipcode: updatedData.zipcode || 'Not provided',
          type: 'home',
          isDefault: true
        };
        console.log("Adding profile address:", profileAddress);
        addressesToUse.unshift(profileAddress); // Add at the beginning
      }

      if (addressesToUse.length > 0) {
        console.log("Final addresses to use:", addressesToUse);
        setUserAddresses(addressesToUse);
        setSelectedAddressId(data.address._id); // Select the newly added address
        setError(null);
      }

      // Reset form
      setNewAddressData({
        recipientName: user?.name || '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipcode: '',
        type: 'home',
      });
      setShowAddressForm(false);
    } catch (err) {
      console.error("Error adding address:", err);
      setError(err.response?.data?.message || "Failed to add address");
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
        setNewAddressData((prev) => ({
          ...prev,
          city: locationData.District || prev.city,
          state: locationData.State || prev.state,
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

  if (authLoading || loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <CircularProgress sx={{ color: "#667eea" }} />
      </Box>
    );
  }

  if (error && !booking) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate("/rental")}
          sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
        >
          ← Back to Rentals
        </Button>
      </Container>
    );
  }

  if (!booking) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          This booking is not available. It may have already been confirmed. Please check your orders page.
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate("/orders")}
          sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
        >
          → Go to Orders
        </Button>
      </Container>
    );
  }

  const total = booking.totalCost || 0;
  const securityDeposit = booking.securityDeposit || 0;
  const insuranceCost = insuranceSelected ? total * 0.05 : 0;
  const subtotal = total + securityDeposit + insuranceCost;
  const tax = subtotal * 0.1;
  const finalTotal = subtotal + tax;

  return (
    <Box sx={{ background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="lg">
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column - Booking Details */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2, background: "white" }}>
              <Typography variant="h5" fontWeight={900} sx={{ mb: 3, color: "#0f172a" }}>
                ✓ Confirm Your Rental Booking
              </Typography>

              {/* Rental Item Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2, color: "#0f172a" }}>
                  📦 Rental Item
                </Typography>
                <Card sx={{ display: "flex", borderRadius: 2 }}>
                  {booking.rentalItem?.images?.[0] && (
                    <CardMedia
                      component="img"
                      sx={{ width: 150, height: 150, objectFit: "cover" }}
                      image={booking.rentalItem.images[0]}
                      alt={booking.rentalItem.name}
                    />
                  )}
                  <CardContent sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={900}>
                      {booking.rentalItem?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
                      {booking.rentalItem?.description}
                    </Typography>
                    <Chip label={booking.rentalItem?.category} size="small" sx={{ mt: 1 }} />
                  </CardContent>
                </Card>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Rental Dates */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2, color: "#0f172a" }}>
                  <DateRange sx={{ mr: 1, verticalAlign: "middle" }} />
                  Rental Dates & Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: "#f3f4ff", borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        From
                      </Typography>
                      <Typography variant="body1" fontWeight={900}>
                        {new Date(booking.startDate).toLocaleDateString()}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: "#f3f4ff", borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        To
                      </Typography>
                      <Typography variant="body1" fontWeight={900}>
                        {new Date(booking.endDate).toLocaleDateString()}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: "#f3f4ff", borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        Duration
                      </Typography>
                      <Typography variant="body1" fontWeight={900}>
                        {booking.durationDays} day(s)
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: "#f3f4ff", borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        Quantity
                      </Typography>
                      <Typography variant="body1" fontWeight={900}>
                        {booking.quantity}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Identity Verification Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2, color: "#0f172a" }}>
                  <VerifiedIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                  Identity Verification
                </Typography>
                
                {verificationStatus?.isIdentityVerified ? (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    ✅ Your identity has been verified! You can proceed with the booking.
                  </Alert>
                ) : verificationStatus?.identityVerification?.status === 'pending' ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    ⏳ Your documents are under review. Admin will verify within 24 hours.
                  </Alert>
                ) : verificationStatus?.identityVerification?.status === 'rejected' ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    ❌ Verification rejected: {verificationStatus.identityVerification.rejectionReason}
                    <Button 
                      size="small" 
                      sx={{ mt: 1, display: 'block' }}
                      variant="outlined"
                      onClick={() => setOpenVerificationDialog(true)}
                    >
                      Resubmit Documents
                    </Button>
                  </Alert>
                ) : (
                  <Paper sx={{ p: 2, bgcolor: "#fff3cd", border: "2px solid #ffa000" }}>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      ⚠️ Identity verification is required for rental bookings. Please submit your documents to proceed.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<VerifiedIcon />}
                      onClick={() => setOpenVerificationDialog(true)}
                      sx={{ 
                        bgcolor: "#ffa000",
                        '&:hover': { bgcolor: "#ff8f00" }
                      }}
                    >
                      Verify Identity
                    </Button>
                  </Paper>
                )}

                {verificationStatus && !verificationStatus.canConfirm && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Booking confirmation will be enabled once your identity is verified.
                  </Alert>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Delivery Address Selection */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={900} sx={{ color: "#0f172a" }}>
                    <LocalShipping sx={{ mr: 1, verticalAlign: "middle" }} />
                    Select Delivery Address
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => setShowAddressForm(true)}
                    sx={{ fontWeight: 700, color: "#667eea" }}
                  >
                    Add New
                  </Button>
                </Box>

                {userAddresses.length > 0 ? (
                  <Grid container spacing={2}>
                    {userAddresses.map((address) => (
                      <Grid item xs={12} key={address._id}>
                        <Paper
                          sx={{
                            p: 2.5,
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
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                border: "2px solid",
                                borderColor: selectedAddressId === address._id ? "#667eea" : "#ccc",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mt: 0.5,
                                bgcolor: selectedAddressId === address._id ? "#667eea" : "transparent",
                                flexShrink: 0,
                              }}
                            >
                              {selectedAddressId === address._id && (
                                <Typography sx={{ color: "white", fontSize: "16px", fontWeight: 900 }}>✓</Typography>
                              )}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
                                <Typography variant="body1" fontWeight={900}>
                                  {address.recipientName}
                                </Typography>
                                <Chip label={address.type} size="small" />
                              </Box>
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                {address.address}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {address.city}, {address.state} - {address.zipcode}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                📱 {address.phone}
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

              <Divider sx={{ my: 3 }} />

              {/* Payment Method Selection */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 2, color: "#0f172a" }}>
                  💳 Payment Method
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper
                      sx={{
                        p: 2.5,
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
                            width: 28,
                            height: 28,
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
                            <Typography sx={{ color: "white", fontSize: "12px", fontWeight: 900 }}>✓</Typography>
                          )}
                        </Box>
                        <Box>
                          <Typography variant="body1" fontWeight={900}>
                            💵 Cash on Delivery
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Pay at delivery
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper
                      sx={{
                        p: 2.5,
                        cursor: "not-allowed",
                        border: "1px solid #e5e7eb",
                        bgcolor: "#f5f5f5",
                        opacity: 0.7,
                        transition: "all 0.2s",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            border: "2px solid #ccc",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "transparent",
                          }}
                        />
                        <Box>
                          <Typography variant="body1" fontWeight={900} sx={{ color: "#999" }}>
                            💳 Card Payment
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Coming soon
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper
                      sx={{
                        p: 2.5,
                        cursor: "not-allowed",
                        border: "1px solid #e5e7eb",
                        bgcolor: "#f5f5f5",
                        opacity: 0.7,
                        transition: "all 0.2s",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            border: "2px solid #ccc",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "transparent",
                          }}
                        />
                        <Box>
                          <Typography variant="body1" fontWeight={900} sx={{ color: "#999" }}>
                            📱 UPI Payment
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Coming soon
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Right Column - Price Summary */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2, background: "white", position: { md: "sticky" }, top: 100 }}>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 3, color: "#0f172a" }}>
                💰 Order Summary
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell fontWeight={700}>Rental Cost</TableCell>
                      <TableCell align="right" fontWeight={700}>
                        {formatPrice(total)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell fontWeight={700}>Security Deposit</TableCell>
                      <TableCell align="right" fontWeight={700}>
                        {formatPrice(securityDeposit)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <input
                            type="checkbox"
                            checked={insuranceSelected}
                            onChange={(e) => setInsuranceSelected(e.target.checked)}
                            style={{ cursor: "pointer" }}
                          />
                          <Typography fontWeight={700}>
                            Damage Insurance (5%)
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right" fontWeight={700}>
                        {insuranceSelected ? formatPrice(insuranceCost) : "₹0"}
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell fontWeight={700}>Subtotal</TableCell>
                      <TableCell align="right" fontWeight={700}>
                        {formatPrice(subtotal)}
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell fontWeight={700}>Tax (10%)</TableCell>
                      <TableCell align="right" fontWeight={700}>
                        {formatPrice(tax)}
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: "#e8f5e9" }}>
                      <TableCell fontWeight={900} sx={{ fontSize: "1.1rem" }}>
                        Total Amount
                      </TableCell>
                      <TableCell
                        align="right"
                        fontWeight={900}
                        sx={{ fontSize: "1.3rem", color: "#667eea" }}
                      >
                        {formatPrice(finalTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 2 }} />

              <Alert severity="info" sx={{ mb: 3 }}>
                {paymentMethod === "cod"
                  ? "Payment will be collected when you receive the rental item."
                  : "You will be redirected to payment gateway."}
              </Alert>

              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleConfirmOrder}
                  disabled={
                    confirming || 
                    !selectedAddressId || 
                    paymentMethod !== "cod" ||
                    !verificationStatus?.isIdentityVerified
                  }
                  sx={{
                    background: 
                      paymentMethod === "cod" && verificationStatus?.isIdentityVerified
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                        : "#ccc",
                    fontWeight: 900,
                    py: 1.5,
                    fontSize: "1rem",
                  }}
                >
                  {confirming ? "Confirming..." : "✓ Confirm Order"}
                </Button>

                {!verificationStatus?.isIdentityVerified && (
                  <Alert severity="warning" sx={{ textAlign: 'center' }}>
                    Complete identity verification to confirm booking
                  </Alert>
                )}

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate("/rental")}
                  sx={{ fontWeight: 800 }}
                >
                  ← Back to Rentals
                </Button>
              </Stack>

              <Box sx={{ mt: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1, textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  🔒 Your data is secure
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Encrypted SSL connection
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Add Address Dialog */}
        <Dialog open={showAddressForm} onClose={() => setShowAddressForm(false)} maxWidth="sm" fullWidth>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={900} sx={{ mb: 3 }}>
              ➕ Add New Address
            </Typography>

            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Recipient Name"
                value={newAddressData.recipientName}
                onChange={(e) => setNewAddressData({ ...newAddressData, recipientName: e.target.value })}
              />
              <TextField
                fullWidth
                label="Phone Number"
                value={newAddressData.phone}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '');
                  if (digitsOnly.length <= 10) {
                    setNewAddressData({ ...newAddressData, phone: digitsOnly });
                    
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
                }}
                error={!!phoneError}
                helperText={phoneError || "Enter 10-digit mobile number"}
                inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' }}
              />
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={newAddressData.address}
                onChange={(e) => setNewAddressData({ ...newAddressData, address: e.target.value })}
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Pincode"
                    value={newAddressData.zipcode}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      if (digitsOnly.length <= 6) {
                        setNewAddressData({ ...newAddressData, zipcode: digitsOnly });
                        
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
                    }}
                    error={!!pincodeError}
                    helperText={pincodeError || "Enter 6-digit Indian pincode"}
                    inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={newAddressData.city}
                    onChange={(e) => setNewAddressData({ ...newAddressData, city: e.target.value })}
                    disabled={fetchingLocation}
                    helperText={fetchingLocation ? "Fetching from pincode..." : ""}
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="State"
                value={newAddressData.state}
                onChange={(e) => setNewAddressData({ ...newAddressData, state: e.target.value })}
                disabled={fetchingLocation}
                helperText={fetchingLocation ? "Fetching from pincode..." : ""}
              />
              <FormControl fullWidth>
                <InputLabel>Address Type</InputLabel>
                <Select
                  value={newAddressData.type}
                  label="Address Type"
                  onChange={(e) => setNewAddressData({ ...newAddressData, type: e.target.value })}
                >
                  <MenuItem value="home">Home</MenuItem>
                  <MenuItem value="work">Work</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>

              <Stack spacing={2} direction="row" sx={{ mt: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAddNewAddress}
                  sx={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    fontWeight: 900,
                  }}
                >
                  Save Address
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setShowAddressForm(false)}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Dialog>

        {/* Identity Verification Dialog */}
        <IdentityVerificationDialog
          open={openVerificationDialog}
          onClose={() => setOpenVerificationDialog(false)}
          bookingId={bookingId}
          onVerificationComplete={(updatedBooking) => {
            fetchVerificationStatus();
            setOpenVerificationDialog(false);
          }}
        />
      </Container>
    </Box>
  );
};

export default RentalConfirmation;
