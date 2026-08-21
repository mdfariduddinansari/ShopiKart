// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import {
//   Container,
//   Box,
//   Typography,
//   Grid,
//   Card,
//   CardContent,
//   Button,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   CircularProgress,
//   Alert,
//   Rating,
//   Chip,
//   Divider,
// } from "@mui/material";
// import { DateRange as DateRangeIcon, AttachMoney as PriceIcon } from "@mui/icons-material";
// import api from "../services/api";

// const formatPrice = (price) => {
//   return new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: "USD",
//   }).format(price);
// };

// const RentalItemDetail = () => {
//   const { itemId } = useParams();
//   const navigate = useNavigate();
//   const { isAuthenticated } = useSelector((s) => s.auth || {});

//   const [item, setItem] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [openBooking, setOpenBooking] = useState(false);
//   const [bookingData, setBookingData] = useState({
//     startDate: "",
//     endDate: "",
//     quantity: 1,
//   });
//   const [checkingAvailability, setCheckingAvailability] = useState(false);
//   const [availabilityResult, setAvailabilityResult] = useState(null);
//   const [submittingBooking, setSubmittingBooking] = useState(false);

//   useEffect(() => {
//     fetchItemDetail();
//   }, [itemId]);

//   const fetchItemDetail = async () => {
//     try {
//       setLoading(true);
//       const { data } = await api.get(`/rentals/${itemId}`);
//       setItem(data);
//       setError(null);
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to load item details");
//       console.error("Error fetching item:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRentClick = () => {
//     if (!isAuthenticated) {
//       navigate("/login");
//       return;
//     }
//     setOpenBooking(true);
//   };

//   const closeBooking = () => {
//     setOpenBooking(false);
//     setBookingData({ startDate: "", endDate: "", quantity: 1 });
//     setAvailabilityResult(null);
//   };

//   const calculateDays = (start, end) => {
//     if (!start || !end) return 0;
//     const startDate = new Date(start);
//     const endDate = new Date(end);
//     const diffTime = Math.abs(endDate - startDate);
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     return diffDays;
//   };

//   const handleDateChange = (field, value) => {
//     const newData = { ...bookingData, [field]: value };
//     setBookingData(newData);
//     setAvailabilityResult(null);
//   };

//   const checkAvailability = async () => {
//     if (!bookingData.startDate || !bookingData.endDate) {
//       alert("Please select both start and end dates");
//       return;
//     }

//     try {
//       setCheckingAvailability(true);
//       const { data } = await api.post(`/rentals/${itemId}/check-availability`, {
//         startDate: bookingData.startDate,
//         endDate: bookingData.endDate,
//         quantity: bookingData.quantity,
//       });
//       setAvailabilityResult(data);
//     } catch (err) {
//       alert(err.response?.data?.message || "Error checking availability");
//     } finally {
//       setCheckingAvailability(false);
//     }
//   };

//   const proceedToBooking = async () => {
//     if (!availabilityResult?.available) {
//       alert("Item not available for selected dates");
//       return;
//     }

//     try {
//       setSubmittingBooking(true);
//       console.log('Creating booking with data:', {
//         rentalItem: itemId,
//         startDate: bookingData.startDate,
//         endDate: bookingData.endDate,
//         quantity: bookingData.quantity,
//         totalCost: availabilityResult.cost,
//       });

//       const { data } = await api.post("/bookings", {
//         rentalItem: itemId,
//         startDate: bookingData.startDate,
//         endDate: bookingData.endDate,
//         quantity: bookingData.quantity,
//         totalCost: availabilityResult.cost,
//       });

//       console.log('Booking created successfully:', data);
//       navigate(`/rental-booking/${data._id}`);
//     } catch (err) {
//       console.error('Booking creation error:', err);
//       const errorMsg = err.response?.data?.message || 
//                        err.response?.data?.error ||
//                        err.message || 
//                        "Error creating booking";
//       alert(errorMsg);
//     } finally {
//       setSubmittingBooking(false);
//     }
//   };

//   if (loading) {
//     return (
//       <Container sx={{ display: "flex", justifyContent: "center", py: 8 }}>
//         <CircularProgress />
//       </Container>
//     );
//   }

//   if (error || !item) {
//     return (
//       <Container sx={{ py: 5 }}>
//         <Alert severity="error">{error || "Item not found"}</Alert>
//         <Button variant="contained" onClick={() => navigate("/rental")} sx={{ mt: 2 }}>
//           Back to Rentals
//         </Button>
//       </Container>
//     );
//   }

//   return (
//     <Container maxWidth="lg" sx={{ py: 5 }}>
//       <Button variant="text" onClick={() => navigate("/rental")} sx={{ mb: 3 }}>
//         ← Back to Rentals
//       </Button>

//       <Grid container spacing={4}>
//         {/* Images */}
//         <Grid item xs={12} md={6}>
//           <Box
//             sx={{
//               width: "100%",
//               aspectRatio: "1",
//               borderRadius: 3,
//               overflow: "hidden",
//               boxShadow: 2,
//             }}
//           >
//             <img
//               src={item.images?.[0] || "https://via.placeholder.com/500"}
//               alt={item.name}
//               style={{ width: "100%", height: "100%", objectFit: "cover" }}
//             />
//           </Box>

//           {/* Thumbnail images */}
//           {item.images && item.images.length > 1 && (
//             <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
//               {item.images.slice(0, 4).map((img, idx) => (
//                 <Box
//                   key={idx}
//                   sx={{
//                     width: 80,
//                     height: 80,
//                     borderRadius: 2,
//                     overflow: "hidden",
//                     cursor: "pointer",
//                     border: "2px solid #eee",
//                   }}
//                 >
//                   <img src={img} alt={`${item.name}-${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
//                 </Box>
//               ))}
//             </Box>
//           )}
//         </Grid>

//         {/* Details */}
//         <Grid item xs={12} md={6}>
//           {/* Title & Category */}
//           <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
//             {item.name}
//           </Typography>

//           <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
//             <Chip label={item.category} color="primary" variant="outlined" />
//             <Chip
//               label={`${item.availableStock} available`}
//               color={item.availableStock > 0 ? "success" : "error"}
//             />
//             {item.featured && <Chip label="Featured" color="secondary" />}
//           </Box>

//           {/* Rating */}
//           {item.rating && (
//             <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
//               <Rating value={parseFloat(item.rating)} readOnly />
//               <Typography variant="body2" color="text.secondary">
//                 {item.rating} ({item.reviews?.length || 0} reviews)
//               </Typography>
//             </Box>
//           )}

//           <Divider sx={{ my: 2 }} />

//           {/* Price */}
//           <Box sx={{ mb: 3 }}>
//             <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
//               <PriceIcon color="secondary" />
//               <Typography variant="h5" color="secondary" fontWeight={700}>
//                 {formatPrice(item.pricePerDay)}/day
//               </Typography>
//             </Box>

//             {item.securityDeposit > 0 && (
//               <Box sx={{ mt: 1, p: 2, bgcolor: "#fff3e0", borderRadius: 1, borderLeft: "4px solid #ff9800" }}>
//                 <Typography variant="subtitle2" fontWeight={700} color="textPrimary">
//                   Security Deposit: {formatPrice(item.securityDeposit)}
//                 </Typography>
//                 <Typography variant="caption" color="textSecondary">
//                   Refundable deposit per item (charged per rental quantity)
//                 </Typography>
//               </Box>
//             )}

//             {item.durationPackages && item.durationPackages.length > 0 && (
//               <Card sx={{ bgcolor: "#f9f9f9", mt: 2 }}>
//                 <CardContent>
//                   <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
//                     Special Packages:
//                   </Typography>
//                   {item.durationPackages.map((pkg, idx) => (
//                     <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
//                       {pkg.minDays}-{pkg.maxDays} days: <strong>{formatPrice(pkg.totalPrice)}</strong>
//                     </Typography>
//                   ))}
//                 </CardContent>
//               </Card>
//             )}
//           </Box>

//           {/* Description */}
//           <Box sx={{ mb: 3 }}>
//             <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
//               Description
//             </Typography>
//             <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
//               {item.description}
//             </Typography>
//           </Box>

//           {/* Specifications */}
//           {item.specifications && Object.keys(item.specifications).length > 0 && (
//             <Box sx={{ mb: 3 }}>
//               <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
//                 Specifications
//               </Typography>
//               <Grid container spacing={1}>
//                 {Object.entries(item.specifications).map(([key, value]) => {
//                   // Handle different value types
//                   let displayValue = '';
//                   if (value === null || value === undefined) {
//                     displayValue = 'N/A';
//                   } else if (typeof value === 'object') {
//                     displayValue = JSON.stringify(value);
//                   } else {
//                     displayValue = String(value);
//                   }
//                   return (
//                     <Grid item xs={6} key={key}>
//                       <Typography variant="caption" color="text.secondary">
//                         {key}:
//                       </Typography>
//                       <Typography variant="body2" fontWeight={600}>
//                         {displayValue}
//                       </Typography>
//                     </Grid>
//                   );
//                 })}
//               </Grid>
//             </Box>
//           )}

//           {/* Seller Info */}
//           {item.seller && (
//             <Card sx={{ bgcolor: "#f5f5f5", mb: 3 }}>
//               <CardContent>
//                 <Typography variant="subtitle2" fontWeight={700}>
//                   Seller: {typeof item.seller === 'object' ? item.seller.name : item.seller}
//                 </Typography>
//                 {typeof item.seller === 'object' && item.seller.email && (
//                   <Typography variant="caption" color="text.secondary">
//                     {item.seller.email}
//                   </Typography>
//                 )}
//               </CardContent>
//             </Card>
//           )}

//           {/* Rent Button */}
//           <Button
//             variant="contained"
//             color="secondary"
//             fullWidth
//             size="large"
//             onClick={handleRentClick}
//             disabled={item.availableStock === 0}
//             sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}
//           >
//             {item.availableStock > 0 ? "Rent Now" : "Out of Stock"}
//           </Button>
//         </Grid>
//       </Grid>

//       {/* Booking Dialog */}
//       <Dialog open={openBooking} onClose={closeBooking} maxWidth="sm" fullWidth>
//         <DialogTitle>
//           <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//             <DateRangeIcon />
//             Book: {item.name}
//           </Box>
//         </DialogTitle>
//         <DialogContent>
//           <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
//             <TextField
//               label="Start Date"
//               type="date"
//               value={bookingData.startDate}
//               onChange={(e) => handleDateChange("startDate", e.target.value)}
//               fullWidth
//               InputLabelProps={{ shrink: true }}
//               inputProps={{ min: new Date().toISOString().split("T")[0] }}
//             />

//             <TextField
//               label="End Date"
//               type="date"
//               value={bookingData.endDate}
//               onChange={(e) => handleDateChange("endDate", e.target.value)}
//               fullWidth
//               InputLabelProps={{ shrink: true }}
//               inputProps={{ min: new Date().toISOString().split("T")[0] }}
//             />

//             <TextField
//               label="Quantity"
//               type="number"
//               value={bookingData.quantity}
//               onChange={(e) => handleDateChange("quantity", parseInt(e.target.value) || 1)}
//               fullWidth
//               inputProps={{ min: 1, max: item.availableStock }}
//             />

//             {availabilityResult && (
//               <Card sx={{ bgcolor: availabilityResult.available ? "#f0fdf8" : "#fef2f2" }}>
//                 <CardContent>
//                   <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
//                     {availabilityResult.available ? "✓ Available" : "✗ Not Available"}
//                   </Typography>
//                   {availabilityResult.available && (
//                     <>
//                       <Typography variant="body2">
//                         Duration: {availabilityResult.durationDays} days
//                       </Typography>
//                       <Typography variant="h6" color="secondary" fontWeight={700}>
//                         Total: {formatPrice(availabilityResult.cost)}
//                       </Typography>
//                     </>
//                   )}
//                   {!availabilityResult.available && (
//                     <Typography variant="body2" color="error">
//                       {availabilityResult.message}
//                     </Typography>
//                   )}
//                 </CardContent>
//               </Card>
//             )}
//           </Box>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={closeBooking}>Cancel</Button>
//           {!availabilityResult ? (
//             <Button
//               variant="contained"
//               color="secondary"
//               onClick={checkAvailability}
//               disabled={checkingAvailability || !bookingData.startDate || !bookingData.endDate}
//             >
//               {checkingAvailability ? "Checking..." : "Check Availability"}
//             </Button>
//           ) : (
//             <Button
//               variant="contained"
//               color="secondary"
//               onClick={proceedToBooking}
//               disabled={!availabilityResult.available || submittingBooking}
//             >
//               {submittingBooking ? "Booking..." : "Proceed to Payment"}
//             </Button>
//           )}
//         </DialogActions>
//       </Dialog>
//     </Container>
//   );
// };

// export default RentalItemDetail;



import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Rating,
  Chip,
  Divider,
  Avatar,
  Stack,
  Paper,
} from "@mui/material";
import { DateRange as DateRangeIcon, Send as SendIcon } from "@mui/icons-material";
import api from "../services/api";

const formatPrice = (price) => {
  return "₹" + new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Animation keyframes
const fadeInUp = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const slideInLeft = `
  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const slideInRight = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const RentalItemDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((s) => s.auth || {});

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openBooking, setOpenBooking] = useState(false);
  const [bookingData, setBookingData] = useState({
    startDate: "",
    endDate: "",
    quantity: 1,
  });
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchItemDetail();
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const fetchItemDetail = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/rentals/${itemId}`);
      setItem(data);
      setSelectedImage(data?.images?.[0] || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load item details");
      console.error("Error fetching item:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/rentals/${itemId}/comments`);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setComments([]);
    }
  };

  const handleRentClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setOpenBooking(true);
  };

  const closeBooking = () => {
    setOpenBooking(false);
    setBookingData({ startDate: "", endDate: "", quantity: 1 });
    setAvailabilityResult(null);
  };

  const handleDateChange = (field, value) => {
    const newData = { ...bookingData, [field]: value };
    setBookingData(newData);
    setAvailabilityResult(null);
  };

  const checkAvailability = async () => {
    if (!bookingData.startDate || !bookingData.endDate) {
      alert("Please select both start and end dates");
      return;
    }

    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);

    if (start > end) {
      alert("End date must be after start date");
      return;
    }

    if (start <= new Date()) {
      alert("Start date must be in the future");
      return;
    }

    if (bookingData.quantity < 1 || bookingData.quantity > item.availableStock) {
      alert(`Please select a quantity between 1 and ${item.availableStock}`);
      return;
    }

    try {
      setCheckingAvailability(true);
      const { data } = await api.post(`/rentals/${itemId}/check-availability`, {
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        quantity: bookingData.quantity,
      });
      setAvailabilityResult(data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error checking availability";
      alert(errorMsg);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const proceedToBooking = async () => {
    if (!availabilityResult?.available) {
      alert("Item not available for selected dates");
      return;
    }

    try {
      setSubmittingBooking(true);
      const { data } = await api.post("/bookings", {
        rentalItem: itemId,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        quantity: bookingData.quantity,
        totalCost: availabilityResult.cost,
      });

      navigate(`/rental-confirmation/${data._id}`);
    } catch (err) {
      console.error('Booking creation error:', err);
      const errorMsg = err.response?.data?.message ||
                       err.response?.data?.error ||
                       err.message ||
                       "Error creating booking";
      alert(errorMsg);
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleAddComment = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!commentText.trim()) {
      alert("Please enter a comment");
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await api.post(`/rentals/${itemId}/comments`, {
        text: commentText.trim(),
      });

      // Handle both single comment response and array
      const newComment = response.data;
      setComments(prev => [newComment, ...prev]);
      setCommentText("");
      // Show success message
      // alert("Comment posted successfully!");
    } catch (err) {
      console.error('Comment error:', err);
      const errorMsg = err.response?.data?.message || err.message || "Error adding comment";
      alert(errorMsg);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <CircularProgress sx={{ color: "#667eea" }} />
      </Box>
    );
  }

  if (error || !item) {
    return (
      <Container sx={{ py: 5 }}>
        <Alert severity="error">{error || "Item not found"}</Alert>
        <Button variant="contained" onClick={() => navigate("/rental")} sx={{ mt: 2 }}>
          Back to Rentals
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", minHeight: "100vh", pb: 8 }}>
      <style>{fadeInUp + slideInLeft + slideInRight}</style>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          variant="text"
          onClick={() => navigate("/rental")}
          sx={{ mb: 3, fontWeight: 700, color: "#667eea" }}
        >
          ← Back to Rentals
        </Button>

        <Grid container spacing={4}>
          {/* Images */}
          <Grid item xs={12} md={5} sx={{ animation: `slideInLeft 0.7s ease-out` }}>
            <Paper
              sx={{
                width: "100%",
                aspectRatio: "1",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 16px 48px rgba(102, 126, 234, 0.2)",
                border: "1px solid rgba(102, 126, 234, 0.1)",
              }}
            >
              <img
                src={selectedImage || item.images?.[0] || "https://via.placeholder.com/700"}
                alt={item.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Paper>

            {/* Thumbnail images */}
            {item.images && item.images.length > 1 && (
              <Box sx={{ display: "flex", gap: 1.5, mt: 2, overflowX: "auto", pb: 1 }}>
                {item.images.slice(0, 6).map((img, idx) => (
                  <Paper
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    sx={{
                      width: 90,
                      height: 90,
                      borderRadius: 2.5,
                      overflow: "hidden",
                      cursor: "pointer",
                      border: selectedImage === img ? "3px solid #667eea" : "2px solid #e5e7eb",
                      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      flexShrink: 0,
                      "&:hover": {
                        transform: "scale(1.05)",
                        borderColor: "#667eea",
                      },
                    }}
                  >
                    <img src={img} alt={`${item.name}-${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </Paper>
                ))}
              </Box>
            )}
          </Grid>

          {/* Details */}
          <Grid item xs={12} md={7} sx={{ animation: `slideInRight 0.7s ease-out` }}>
            {/* Title & Category */}
            <Typography variant="h3" fontWeight={900} sx={{ mb: 1.5, color: "#0f172a" }}>
              {item.name}
            </Typography>

            <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
              <Chip
                label={item.category || "General"}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700, borderColor: "#667eea", color: "#667eea" }}
              />
              {item.featured && <Chip label="Featured" sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", fontWeight: 700 }} />}
            </Box>

            {/* Rating */}
            {item.rating && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Rating value={parseFloat(item.rating)} readOnly size="medium" />
                <Typography variant="body2" fontWeight={700} color="text.secondary">
                  {item.rating} ({item.reviews?.length || 0} reviews)
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 2.5 }} />

            {/* Price Section */}
            <Paper
              sx={{
                p: 2.5,
                background: "linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)",
                borderRadius: 2.5,
                border: "1px solid rgba(102, 126, 234, 0.2)",
                mb: 3,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 1 }}>
                <Typography variant="h4" fontWeight={900} sx={{ color: "#667eea", lineHeight: 1 }}>
                  {formatPrice(item.pricePerDay)}
                </Typography>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    per day
                  </Typography>
                </Box>
              </Box>

              {item.securityDeposit > 0 && (
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 700, color: "#ff9800" }}>
                  Security Deposit: {formatPrice(item.securityDeposit)}
                </Typography>
              )}
            </Paper>

            {/* Duration Packages */}
            {item.durationPackages && item.durationPackages.length > 0 && (
              <Paper sx={{ p: 2.5, background: "#fbfbff", borderRadius: 2.5, border: "1px solid rgba(102, 126, 234, 0.1)", mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1.5, color: "#0f172a" }}>
                  📦 Special Packages:
                </Typography>
                <Stack spacing={1}>
                  {item.durationPackages.map((pkg, idx) => (
                    <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1, borderRadius: 1, background: "white" }}>
                      <Typography variant="body2" fontWeight={700}>{pkg.minDays}-{pkg.maxDays} days</Typography>
                      <Typography variant="body2" fontWeight={900} sx={{ color: "#667eea" }}>{formatPrice(pkg.totalPrice)}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}

            {/* Description */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1, color: "#0f172a" }}>
                📋 Description
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, background: "rgba(255,255,255,0.7)", p: 2, borderRadius: 1.5 }}>
                {item.description}
              </Typography>
            </Box>

            {/* Specifications */}
            {item.specifications && Object.keys(item.specifications).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1.5, color: "#0f172a" }}>
                  ⚙️ Specifications
                </Typography>
                <Grid container spacing={1.5}>
                  {Object.entries(item.specifications).slice(0, 6).map(([key, value]) => {
                    let displayValue = '';
                    if (value === null || value === undefined) {
                      displayValue = 'N/A';
                    } else if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    } else {
                      displayValue = String(value);
                    }
                    return (
                      <Grid item xs={6} key={key}>
                        <Paper sx={{ p: 1.5, background: "white", borderRadius: 1.5, border: "1px solid #e5e7eb" }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>
                            {key}
                          </Typography>
                          <Typography variant="body2" fontWeight={800} sx={{ mt: 0.5, color: "#0f172a" }}>
                            {displayValue}
                          </Typography>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}

            {/* Seller Info */}
            {item.seller && (
              <Paper
                sx={{
                  p: 2.5,
                  background: "linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)",
                  borderRadius: 2.5,
                  border: "1px solid rgba(102, 126, 234, 0.1)",
                  mb: 3,
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <Avatar sx={{ width: 56, height: 56, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", fontWeight: 800 }}>
                  {typeof item.seller === 'object' && item.seller.name ? item.seller.name[0]?.toUpperCase() : "S"}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={900} sx={{ color: "#0f172a" }}>
                    {typeof item.seller === 'object' ? item.seller.name : item.seller}
                  </Typography>
                  {typeof item.seller === 'object' && item.seller.email && (
                    <Typography variant="caption" color="text.secondary">
                      {item.seller.email}
                    </Typography>
                  )}
                </Box>
              </Paper>
            )}

            {/* Rent Button */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleRentClick}
              disabled={item.availableStock === 0}
              sx={{
                py: 1.75,
                fontWeight: 900,
                borderRadius: 2.5,
                background: item.availableStock > 0 ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "linear-gradient(135deg, #ccc 0%, #aaa 100%)",
                color: "#fff",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover:not(:disabled)": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 32px rgba(102, 126, 234, 0.3)",
                },
                "&:active:not(:disabled)": {
                  transform: "translateY(0)",
                },
              }}
            >
              {item.availableStock > 0 ? "🎯 Rent Now" : "Out of Stock"}
            </Button>
          </Grid>
        </Grid>

        {/* Comments Section */}
        <Box sx={{ mt: 8 }}>
          <Divider sx={{ my: 4 }} />
          <Typography variant="h4" fontWeight={900} sx={{ mb: 4, color: "#0f172a" }}>
            💬 Customer Comments & Reviews
          </Typography>

          {/* Add Comment Form */}
          {isAuthenticated ? (
            <Paper
              sx={{
                p: 3,
                background: "linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)",
                borderRadius: 2.5,
                border: "1px solid rgba(102, 126, 234, 0.1)",
                mb: 4,
              }}
            >
              <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", mb: 2 }}>
                <Avatar sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", fontWeight: 900 }}>
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={800}>
                    {user?.name || "You"}
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Share your experience with this rental item..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    variant="outlined"
                    sx={{
                      mt: 1,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": { borderColor: "#667eea" },
                        "&.Mui-focused fieldset": { borderColor: "#667eea" },
                      },
                    }}
                  />
                  <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                    <Button
                      variant="contained"
                      endIcon={<SendIcon />}
                      onClick={handleAddComment}
                      disabled={submittingComment || !commentText.trim()}
                      sx={{
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        fontWeight: 800,
                        borderRadius: 1.5,
                        "&:hover": {
                          boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
                        },
                      }}
                    >
                      {submittingComment ? "Posting..." : "Post Comment"}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Paper>
          ) : (
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                borderRadius: 2.5,
                border: "2px dashed rgba(102, 126, 234, 0.3)",
                mb: 4,
              }}
            >
              <Typography variant="body2" sx={{ mb: 2 }}>
                Please log in to add a comment
              </Typography>
              <Button variant="contained" onClick={() => navigate("/login")} sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                Sign In
              </Button>
            </Paper>
          )}

          {/* Comments List */}
          {comments && comments.length > 0 ? (
            <Grid container spacing={2}>
              {comments.map((comment, idx) => (
                <Grid item xs={12} key={comment._id || idx}>
                  <Paper
                    sx={{
                      p: 2.5,
                      background: "white",
                      borderRadius: 2.5,
                      border: "1px solid #e5e7eb",
                      animation: `fadeInUp 0.6s ease-out ${idx * 0.1}s backwards`,
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Avatar sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", fontWeight: 900, width: 48, height: 48 }}>
                        {comment.user?.name?.[0]?.toUpperCase() || comment.userId?.name?.[0]?.toUpperCase() || comment.author?.[0]?.toUpperCase() || "U"}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={900} sx={{ color: "#0f172a" }}>
                              {comment.user?.name || comment.userId?.name || comment.author || "Anonymous User"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                              {new Date(comment.createdAt || comment.date).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1.5, color: "#4b5563", lineHeight: 1.8, fontSize: "0.95rem" }}>
                          {comment.text || comment.content || ""}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 2.5,
                border: "1px solid #e5e7eb",
                background: "#fafafa",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No comments yet. Be the first to share your experience!
              </Typography>
            </Paper>
          )}
        </Box>
      </Container>

      {/* Booking Dialog */}
      <Dialog
        open={openBooking}
        onClose={closeBooking}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            boxShadow: "0 20px 60px rgba(102, 126, 234, 0.25)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: "1.3rem", color: "#0f172a" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DateRangeIcon sx={{ color: "#667eea" }} />
            Book: {item.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              value={bookingData.startDate}
              onChange={(e) => handleDateChange("startDate", e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().split("T")[0] }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  "&:hover fieldset": { borderColor: "#667eea" },
                  "&.Mui-focused fieldset": { borderColor: "#667eea" },
                },
              }}
            />

            <TextField
              label="End Date"
              type="date"
              value={bookingData.endDate}
              onChange={(e) => handleDateChange("endDate", e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().split("T")[0] }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  "&:hover fieldset": { borderColor: "#667eea" },
                  "&.Mui-focused fieldset": { borderColor: "#667eea" },
                },
              }}
            />

            <TextField
              label="Quantity"
              type="number"
              value={bookingData.quantity}
              onChange={(e) => handleDateChange("quantity", Math.max(1, parseInt(e.target.value || "1")))}
              fullWidth
              inputProps={{ min: 1, max: item.availableStock }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  "&:hover fieldset": { borderColor: "#667eea" },
                  "&.Mui-focused fieldset": { borderColor: "#667eea" },
                },
              }}
            />

            {availabilityResult && (
              <Paper
                sx={{
                  p: 2.5,
                  background: availabilityResult.available ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)" : "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)",
                  borderRadius: 2,
                  border: availabilityResult.available ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 2, color: availabilityResult.available ? "#059669" : "#dc2626" }}>
                  {availabilityResult.available ? "✓ Available" : "✗ Not Available"}
                </Typography>
                
                {availabilityResult.available ? (
                  <>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        Rental Duration
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {availabilityResult.durationDays} day{availabilityResult.durationDays !== 1 ? 's' : ''}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        Quantity Availability
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {bookingData.quantity} of {availabilityResult.availableQuantity} available {bookingData.quantity !== 1 ? 'items' : 'item'}
                        {availabilityResult.bookedQuantity > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                            ({availabilityResult.bookedQuantity} already booked for these dates)
                          </Typography>
                        )}
                      </Typography>
                    </Box>

                    <Box sx={{ 
                      p: 1.5, 
                      background: "rgba(16, 185, 129, 0.15)", 
                      borderRadius: 1, 
                      mb: 0.5 
                    }}>
                      <Typography variant="h6" fontWeight={900} sx={{ color: "#059669", mb: 0.5 }}>
                        {formatPrice(availabilityResult.cost)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total ({availabilityResult.baseCost && `₹${Math.round(availabilityResult.baseCost)} × ${bookingData.quantity}`})
                      </Typography>
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                      {availabilityResult.message}
                    </Typography>
                  </>
                ) : (
                  <Box>
                    <Typography variant="body2" fontWeight={600} sx={{ color: "#dc2626", mb: 1.5 }}>
                      {availabilityResult.message}
                    </Typography>
                    {availabilityResult.earliestAvailableDate && (
                      <Box sx={{ mt: 2, p: 1.5, background: "rgba(102, 126, 234, 0.1)", borderRadius: 1, border: "1px solid rgba(102, 126, 234, 0.3)" }}>
                        <Typography variant="caption" sx={{ display: "block", fontWeight: 700, color: "#667eea", mb: 0.5 }}>
                          ✓ Available from:
                        </Typography>
                        <Typography variant="body2" fontWeight={800} sx={{ color: "#667eea" }}>
                          {new Date(availabilityResult.earliestAvailableDate).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                          Try selecting this date or later for better availability
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                      💡 Tip: Try selecting different dates or reducing the quantity.
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={closeBooking} sx={{ color: "#666" }}>
            Cancel
          </Button>
          {!availabilityResult ? (
            <Button
              variant="contained"
              onClick={checkAvailability}
              disabled={checkingAvailability || !bookingData.startDate || !bookingData.endDate}
              sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", fontWeight: 800, borderRadius: 1.5 }}
            >
              {checkingAvailability ? "Checking..." : "Check Availability"}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={proceedToBooking}
              disabled={!availabilityResult.available || submittingBooking}
              sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", fontWeight: 800, borderRadius: 1.5 }}
            >
              {submittingBooking ? "Booking..." : "Proceed to Payment"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RentalItemDetail;
