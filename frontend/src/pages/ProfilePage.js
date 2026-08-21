// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import {
//   Container,
//   Paper,
//   TextField,
//   Button,
//   Box,
//   Typography,
//   CircularProgress,
//   Alert,
//   Grid,
// } from "@mui/material";
// import { updateUserProfile } from "../features/authSlice";

// const ProfilePage = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     address: "",
//     city: "",
//     state: "",
//     zipcode: "",
//     country: "",
//   });

//   const [successMessage, setSuccessMessage] = useState("");
//   const [errorMessage, setErrorMessage] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     if (!isAuthenticated) {
//       navigate("/login");
//       return;
//     }

//     // Populate form with user data
//     if (user) {
//       setFormData({
//         name: user.name || "",
//         email: user.email || "",
//         phone: user.phone || "",
//         address: user.address || "",
//         city: user.city || "",
//         state: user.state || "",
//         zipcode: user.zipcode || "",
//         country: user.country || "",
//       });
//     }
//   }, [isAuthenticated, user, navigate]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setErrorMessage("");
//     setSuccessMessage("");

//     try {
//       // Create async thunk call
//       const resultAction = await dispatch(updateUserProfile(formData));
      
//       if (updateUserProfile.fulfilled.match(resultAction)) {
//         setSuccessMessage("Profile updated successfully!");
//         setTimeout(() => setSuccessMessage(""), 3000);
//       } else {
//         setErrorMessage(resultAction.payload || "Failed to update profile");
//       }
//     } catch (error) {
//       setErrorMessage(error.message || "An error occurred");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (loading) {
//     return (
//       <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
//         <CircularProgress />
//       </Box>
//     );
//   }

//   if (!isAuthenticated) {
//     return null;
//   }

//   return (
//     <Container maxWidth="sm" sx={{ py: 5 }}>
//       <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
//         <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
//           My Profile
//         </Typography>

//         {successMessage && (
//           <Alert severity="success" sx={{ mb: 2 }}>
//             {successMessage}
//           </Alert>
//         )}

//         {errorMessage && (
//           <Alert severity="error" sx={{ mb: 2 }}>
//             {errorMessage}
//           </Alert>
//         )}

//         <form onSubmit={handleSubmit}>
//           <Grid container spacing={2}>
//             {/* Name */}
//             <Grid item xs={12}>
//               <TextField
//                 fullWidth
//                 label="Full Name"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 variant="outlined"
//                 required
//               />
//             </Grid>

//             {/* Email */}
//             <Grid item xs={12}>
//               <TextField
//                 fullWidth
//                 label="Email"
//                 name="email"
//                 type="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 variant="outlined"
//                 required
//               />
//             </Grid>

//             {/* Phone */}
//             <Grid item xs={12}>
//               <TextField
//                 fullWidth
//                 label="Phone Number"
//                 name="phone"
//                 value={formData.phone}
//                 onChange={handleChange}
//                 variant="outlined"
//                 placeholder="+1 (555) 123-4567"
//               />
//             </Grid>

//             {/* Address */}
//             <Grid item xs={12}>
//               <TextField
//                 fullWidth
//                 label="Street Address"
//                 name="address"
//                 value={formData.address}
//                 onChange={handleChange}
//                 variant="outlined"
//                 placeholder="123 Main Street"
//               />
//             </Grid>

//             {/* City */}
//             <Grid item xs={12} sm={6}>
//               <TextField
//                 fullWidth
//                 label="City"
//                 name="city"
//                 value={formData.city}
//                 onChange={handleChange}
//                 variant="outlined"
//               />
//             </Grid>

//             {/* State */}
//             <Grid item xs={12} sm={6}>
//               <TextField
//                 fullWidth
//                 label="State/Province"
//                 name="state"
//                 value={formData.state}
//                 onChange={handleChange}
//                 variant="outlined"
//               />
//             </Grid>

//             {/* Zipcode */}
//             <Grid item xs={12} sm={6}>
//               <TextField
//                 fullWidth
//                 label="Zip/Postal Code"
//                 name="zipcode"
//                 value={formData.zipcode}
//                 onChange={handleChange}
//                 variant="outlined"
//               />
//             </Grid>

//             {/* Country */}
//             <Grid item xs={12} sm={6}>
//               <TextField
//                 fullWidth
//                 label="Country"
//                 name="country"
//                 value={formData.country}
//                 onChange={handleChange}
//                 variant="outlined"
//               />
//             </Grid>

//             {/* Submit Button */}
//             <Grid item xs={12}>
//               <Button
//                 fullWidth
//                 variant="contained"
//                 color="secondary"
//                 type="submit"
//                 sx={{ py: 1.5, mt: 2 }}
//                 disabled={isSubmitting}
//               >
//                 {isSubmitting ? "Saving..." : "Save Changes"}
//               </Button>
//             </Grid>
//           </Grid>
//         </form>

//         {/* Quick Links */}
//         <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid #eee" }}>
//           <Typography variant="body2" color="text.secondary">
//             <Button
//               color="secondary"
//               onClick={() => navigate("/orders")}
//               sx={{ textTransform: "none", fontSize: "0.9rem" }}
//             >
//               View My Orders →
//             </Button>
//           </Typography>
//         </Box>
//       </Paper>
//     </Container>
//   );
// };

// export default ProfilePage;



import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Typography,
  Button,
  TextField,
  Divider,
  Stack,
  Snackbar,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { Lock as LockIcon, ShoppingBag as OrdersIcon, Favorite as WishlistIcon, LocationOn as LocationIcon } from "@mui/icons-material";
import { updateUserProfile } from "../features/authSlice";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to update map view when coordinates change
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useSelector((s) => s.auth || {});

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
  });
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState({ open: false, severity: "success", message: "" });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [phoneError, setPhoneError] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState("");
  const [locationName, setLocationName] = useState("");
  const mounted = useRef(true);

  // Geocode pincode to get coordinates - using postalcode specific search for accuracy
  const geocodePincode = useCallback(async (pincode, country, city, state) => {
    if (!pincode || pincode.length < 4) {
      setMapCoordinates(null);
      setMapError("");
      setLocationName("");
      return;
    }

    setMapLoading(true);
    setMapError("");

    try {
      // Try multiple search strategies for better accuracy
      let data = null;

      // Strategy 1: Use structured postalcode search (most accurate)
      const countryCode = country ? getCountryCode(country) : "";
      let url = `https://nominatim.openstreetmap.org/search?format=json&postalcode=${encodeURIComponent(pincode)}`;
      if (countryCode) url += `&countrycodes=${countryCode}`;
      url += `&addressdetails=1&limit=5`;

      let response = await fetch(url, {
        headers: { "User-Agent": "ShopiKart/1.0" },
      });
      data = await response.json();

      // Strategy 2: If no results, try with city/state combination
      if ((!data || data.length === 0) && (city || state)) {
        const searchParts = [pincode];
        if (city) searchParts.push(city);
        if (state) searchParts.push(state);
        if (country) searchParts.push(country);
        const searchQuery = searchParts.join(", ");

        response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=5`,
          { headers: { "User-Agent": "ShopiKart/1.0" } }
        );
        data = await response.json();
      }

      // Strategy 3: For Indian pincodes (6 digits), use India-specific search
      if ((!data || data.length === 0) && /^[1-9][0-9]{5}$/.test(pincode)) {
        response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&postalcode=${pincode}&countrycodes=in&addressdetails=1&limit=5`,
          { headers: { "User-Agent": "ShopiKart/1.0" } }
        );
        data = await response.json();
      }

      if (data && data.length > 0) {
        // Find the best match - prefer results that include the postal code in address
        let bestMatch = data[0];
        for (const result of data) {
          if (result.address && result.address.postcode === pincode) {
            bestMatch = result;
            break;
          }
        }

        const { lat, lon, display_name, address } = bestMatch;
        setMapCoordinates([parseFloat(lat), parseFloat(lon)]);
        
        // Build a cleaner location name
        let cleanName = display_name;
        if (address) {
          const parts = [];
          if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
          if (address.city || address.town || address.village) parts.push(address.city || address.town || address.village);
          if (address.state_district) parts.push(address.state_district);
          if (address.state) parts.push(address.state);
          if (address.postcode) parts.push(address.postcode);
          if (address.country) parts.push(address.country);
          if (parts.length > 0) cleanName = parts.join(", ");
        }
        setLocationName(cleanName);
        setMapError("");
      } else {
        setMapCoordinates(null);
        setMapError("Could not find location for this postal code");
        setLocationName("");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setMapError("Failed to fetch location");
      setMapCoordinates(null);
      setLocationName("");
    } finally {
      if (mounted.current) setMapLoading(false);
    }
  }, []);

  // Helper function to get country code from country name
  const getCountryCode = (countryName) => {
    const countryMap = {
      'india': 'in', 'united states': 'us', 'usa': 'us', 'united kingdom': 'gb', 'uk': 'gb',
      'canada': 'ca', 'australia': 'au', 'germany': 'de', 'france': 'fr', 'japan': 'jp',
      'china': 'cn', 'brazil': 'br', 'russia': 'ru', 'italy': 'it', 'spain': 'es',
      'mexico': 'mx', 'netherlands': 'nl', 'sweden': 'se', 'norway': 'no', 'denmark': 'dk',
      'singapore': 'sg', 'new zealand': 'nz', 'south africa': 'za', 'ireland': 'ie',
      'belgium': 'be', 'switzerland': 'ch', 'austria': 'at', 'portugal': 'pt', 'poland': 'pl',
    };
    return countryMap[countryName?.toLowerCase()?.trim()] || '';
  };

  // Debounce pincode lookup
  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.zipcode && form.zipcode.length >= 4) {
        geocodePincode(form.zipcode, form.country, form.city, form.state);
      } else {
        setMapCoordinates(null);
        setMapError("");
        setLocationName("");
      }
    }, 600); // Wait 600ms after user stops typing

    return () => clearTimeout(timer);
  }, [form.zipcode, form.country, form.city, form.state, geocodePincode]);

  useEffect(() => {
    mounted.current = true;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        zipcode: user.zipcode || "",
        country: user.country || "",
      });
    }

    return () => (mounted.current = false);
  }, [user, isAuthenticated, navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    
    // Phone validation
    if (name === 'phone') {
      // Only allow digits
      const phoneValue = value.replace(/\D/g, '');
      if (phoneValue.length <= 10) {
        setForm((p) => ({ ...p, [name]: phoneValue }));
        
        // Validate phone number
        if (phoneValue.length === 0) {
          setPhoneError('');
        } else if (phoneValue.length < 10) {
          setPhoneError(`Enter ${10 - phoneValue.length} more digit${10 - phoneValue.length > 1 ? 's' : ''}`);
        } else if (phoneValue.length === 10) {
          // Check if it starts with 6, 7, 8, or 9 (valid Indian mobile numbers)
          if (/^[6-9]/.test(phoneValue)) {
            setPhoneError('');
          } else {
            setPhoneError('Phone number must start with 6, 7, 8, or 9');
          }
        }
      }
      return;
    }
    
    // Pincode validation
    if (name === 'zipcode') {
      // Only allow digits
      const pincodeValue = value.replace(/\D/g, '');
      if (pincodeValue.length <= 6) {
        setForm((p) => ({ ...p, [name]: pincodeValue }));
        
        // Validate pincode
        if (pincodeValue.length === 0) {
          setPincodeError('');
        } else if (pincodeValue.length < 6) {
          setPincodeError(`Enter ${6 - pincodeValue.length} more digit${6 - pincodeValue.length > 1 ? 's' : ''}`);
        } else if (pincodeValue.length === 6) {
          setPincodeError('');
          // Auto-fetch location for 6-digit pincode
          fetchLocationByPincode(pincodeValue);
        }
      }
      return;
    }
    
    setForm((p) => ({ ...p, [name]: value }));
  };

  // Function to fetch location details from pincode
  const fetchLocationByPincode = async (pincode) => {
    setFetchingLocation(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0];
        setForm((p) => ({
          ...p,
          city: postOffice.District || p.city,
          state: postOffice.State || p.state,
          country: 'India'
        }));
        setPincodeError('');
      } else {
        setPincodeError('Invalid pincode. Please enter a valid Indian pincode.');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      setPincodeError('Failed to fetch location details');
    } finally {
      setFetchingLocation(false);
    }
  };

  const validate = () => {
    if (!form.name || !form.email) {
      setAlert({ open: true, severity: "error", message: "Name and email are required." });
      return false;
    }
    
    // Validate phone if provided
    if (form.phone && (form.phone.length !== 10 || !/^[6-9]\d{9}$/.test(form.phone))) {
      setAlert({ open: true, severity: "error", message: "Please provide a valid 10-digit Indian phone number starting with 6, 7, 8, or 9." });
      return false;
    }
    
    // Validate pincode if provided
    if (form.zipcode && (form.zipcode.length !== 6 || !/^\d{6}$/.test(form.zipcode))) {
      setAlert({ open: true, severity: "error", message: "Please provide a valid 6-digit Indian pincode." });
      return false;
    }
    
    return true;
  };

  const onSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setAlert({ open: false, severity: "", message: "" });

    try {
      // build payload
      const payload = { ...form };

      const res = await dispatch(updateUserProfile(payload));
      if (res?.type && res.type.endsWith("/fulfilled")) {
        setAlert({ open: true, severity: "success", message: "Profile updated successfully." });
      } else {
        const err = res?.payload || res?.error?.message || "Failed to update profile";
        setAlert({ open: true, severity: "error", message: String(err) });
      }
    } catch (err) {
      setAlert({ open: true, severity: "error", message: err?.message || "Unexpected error" });
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((p) => ({ ...p, [name]: value }));
  };

  const handlePasswordSubmit = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setAlert({ open: true, severity: "error", message: "All password fields are required." });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAlert({ open: true, severity: "error", message: "New passwords do not match." });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setAlert({ open: true, severity: "error", message: "New password must be at least 6 characters." });
      return;
    }

    setPasswordBusy(true);
    setAlert({ open: false, severity: "", message: "" });

    try {
      const res = await dispatch(
        updateUserProfile({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        })
      );

      if (res?.type && res.type.endsWith("/fulfilled")) {
        setAlert({ open: true, severity: "success", message: "Password updated successfully." });
        setPasswordDialogOpen(false);
        setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const err = res?.payload || res?.error?.message || "Failed to update password";
        setAlert({ open: true, severity: "error", message: String(err) });
      }
    } catch (err) {
      setAlert({ open: true, severity: "error", message: err?.message || "Unexpected error" });
    } finally {
      if (mounted.current) setPasswordBusy(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", py: 6 }}>
      <Box sx={{ width: "100%", mx: "auto", px: { xs: 2, sm: 3 } }}>
        {/* Header Section */}
        <Box sx={{ maxWidth: { xs: '95%', sm: '85%', md: '70%', lg: '60%' }, mx: 'auto', mb: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom sx={{ color: "#1a1a1a" }}>
                My Profile
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: "1rem" }}>
                Manage your account information and settings
              </Typography>
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => navigate("/orders")}
                startIcon={<OrdersIcon />}
                sx={{
                  fontWeight: 700,
                  borderColor: "#667eea",
                  color: "#667eea",
                  textTransform: "none",
                  borderRadius: 2,
                  "&:hover": { borderColor: "#764ba2", color: "#764ba2" },
                }}
              >
                View Orders
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate("/")}
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                Continue Shopping
              </Button>
            </Stack>
          </Box>
        </Box>

        <Grid container spacing={0.5} justifyContent="center">
          {/* Left Profile Card - 60% Width */}
          <Grid item xs={12} sx={{ maxWidth: { xs: '95%', sm: '85%', md: '70%', lg: '60%' }, mx: 'auto' }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                background: "#fff",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
              }}
            >
              <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 4 }}>
                {/* Avatar */}
                <Box>
                  <Avatar
                    src={user?.avatarUrl}
                    alt={form.name || user?.name || "User"}
                    sx={{
                      width: 140,
                      height: 140,
                      boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      fontSize: "3rem",
                    }}
                  />
                </Box>

                {/* User Info */}
                <Box sx={{ textAlign: "center", width: "100%" }}>
                  <Typography variant="h6" fontWeight={800} sx={{ color: "#1a1a1a", mb: 0.5 }}>
                    {form.name || user?.name || "User Profile"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                    {user?.email}
                  </Typography>
                </Box>

                <Divider sx={{ width: "100%", my: 1 }} />

                {/* Quick Action Buttons */}
                <Stack spacing={1.5} sx={{ width: "100%" }}>
                  <Button
                    fullWidth
                    startIcon={<LockIcon />}
                    onClick={() => setPasswordDialogOpen(true)}
                    sx={{
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "#fff",
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: 1.5,
                      py: 1.2,
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    Update Password
                  </Button>
                  <Button
                    fullWidth
                    startIcon={<WishlistIcon />}
                    onClick={() => navigate("/wishlist")}
                    variant="outlined"
                    sx={{
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: 1.5,
                      borderColor: "#667eea",
                      color: "#667eea",
                      py: 1.2,
                      "&:hover": {
                        borderColor: "#764ba2",
                        color: "#764ba2",
                        background: "rgba(102, 126, 234, 0.05)",
                      },
                    }}
                  >
                    My Wishlist
                  </Button>
                </Stack>

                <Divider sx={{ width: "100%", my: 1 }} />

                {/* Member Since */}
                <Box sx={{ width: "100%", textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                    Member Since
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="#667eea">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" }) : "—"}
                  </Typography>
                </Box>

                {/* Location Map Section */}
                <Divider sx={{ width: "100%", my: 2 }} />
                <Box sx={{ width: "100%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                    <LocationIcon sx={{ color: "#667eea", fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#1a1a1a" }}>
                      Your Location
                    </Typography>
                    {mapLoading && <CircularProgress size={14} sx={{ ml: "auto", color: "#667eea" }} />}
                  </Box>

                  {mapCoordinates ? (
                    <Box>
                      <Box
                        sx={{
                          height: 350,
                          width: '100%',
                          borderRadius: 2,
                          overflow: "hidden",
                          border: "2px solid #667eea",
                          boxShadow: "0 4px 15px rgba(102, 126, 234, 0.2)",
                        }}
                      >
                        <MapContainer
                          center={mapCoordinates}
                          zoom={15}
                          style={{ height: "100%", width: "100%" }}
                          scrollWheelZoom={false}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={mapCoordinates}>
                            <Popup>
                              <strong>{form.zipcode}</strong>
                              <br />
                              {locationName}
                            </Popup>
                          </Marker>
                          <MapUpdater center={mapCoordinates} />
                        </MapContainer>
                      </Box>
                      {locationName && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, display: "block", fontSize: "0.75rem", lineHeight: 1.4 }}
                        >
                          📍 {locationName}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        width: '100%',
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)",
                        borderRadius: 2,
                        border: "2px dashed #ccc",
                        px: 2,
                      }}
                    >
                      <LocationIcon sx={{ color: "#ccc", fontSize: 32, mb: 1 }} />
                      <Typography variant="caption" color="text.secondary" textAlign="center">
                        {mapError || "Enter postal code to see your location"}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Form Section - 60% Width */}
          <Grid item xs={12} sx={{ maxWidth: { xs: '95%', sm: '85%', md: '70%', lg: '60%' }, mx: 'auto' }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3,
                background: "#fff",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
              }}
              component="form"
              onSubmit={onSubmit}
            >
              {/* Alert Message */}
              {alert.open && (
                <Alert
                  severity={alert.severity}
                  sx={{ mb: 3, borderRadius: 1.5 }}
                  onClose={() => setAlert((a) => ({ ...a, open: false }))}
                >
                  {alert.message}
                </Alert>
              )}

              {/* Form Title */}
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1, color: "#1a1a1a" }}>
                Personal Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Update your personal details below
              </Typography>

              <Grid container spacing={3}>
                {/* Full Name */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        "&:hover fieldset": { borderColor: "#667eea" },
                        "&.Mui-focused fieldset": { borderColor: "#667eea" },
                      },
                    }}
                  />
                </Grid>

                {/* Email */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        "&:hover fieldset": { borderColor: "#667eea" },
                        "&.Mui-focused fieldset": { borderColor: "#667eea" },
                      },
                    }}
                  />
                </Grid>

                {/* Phone */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    variant="outlined"
                    placeholder="10-digit mobile number"
                    error={!!phoneError}
                    helperText={phoneError || (form.phone && form.phone.length === 10 && !phoneError ? '✓ Valid' : '')}
                    inputProps={{
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                      maxLength: 10
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        "&:hover fieldset": { borderColor: "#667eea" },
                        "&.Mui-focused fieldset": { borderColor: "#667eea" },
                      },
                    }}
                  />
                </Grid>

                {/* Divider for Contact Info */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      ADDRESS INFORMATION
                    </Typography>
                  </Divider>
                </Grid>

                {/* Info Box */}
                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      background: "linear-gradient(135deg, #f0f4ff 0%, #e8edff 100%)",
                      border: "1px solid #d1dcff",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <LocationIcon sx={{ color: "#fff", fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600} sx={{ color: "#1a1a1a", mb: 0.3 }}>
                        Smart Address Auto-Fill
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Enter your 6-digit postal code and we'll automatically fill in your city, state, and country!
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Postal Code - First for auto-fill */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    name="zipcode"
                    value={form.zipcode}
                    onChange={onChange}
                    variant="outlined"
                    error={!!pincodeError}
                    helperText={fetchingLocation ? '🔄 Fetching location...' : (pincodeError || (form.zipcode && form.zipcode.length === 6 && !pincodeError ? '✓ Valid' : 'Enter 6-digit pincode'))}
                    inputProps={{
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                      maxLength: 6
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        "&:hover fieldset": { borderColor: "#667eea" },
                        "&.Mui-focused fieldset": { borderColor: "#667eea" },
                      },
                    }}
                  />
                </Grid>

                {/* City */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="City"
                    name="city"
                    value={form.city}
                    onChange={onChange}
                    variant="outlined"
                    disabled={fetchingLocation}
                    helperText={fetchingLocation ? '⏳ Auto-filling...' : ''}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        "&:hover fieldset": { borderColor: "#667eea" },
                        "&.Mui-focused fieldset": { borderColor: "#667eea" },
                      },
                      "& .MuiInputBase-input.Mui-disabled": {
                        WebkitTextFillColor: "rgba(0, 0, 0, 0.6)",
                      },
                    }}
                  />
                </Grid>

                {/* State */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="State"
                    name="state"
                    value={form.state}
                    onChange={onChange}
                    variant="outlined"
                    disabled={fetchingLocation}
                    helperText={fetchingLocation ? '⏳ Auto-filling...' : ''}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        "&:hover fieldset": { borderColor: "#667eea" },
                        "&.Mui-focused fieldset": { borderColor: "#667eea" },
                      },
                      "& .MuiInputBase-input.Mui-disabled": {
                        WebkitTextFillColor: "rgba(0, 0, 0, 0.6)",
                      },
                    }}
                  />
                </Grid>

                {/* Address */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    name="address"
                    value={form.address}
                    onChange={onChange}
                    variant="outlined"
                    placeholder="House/Flat No., Street, Area, Landmark"
                    multiline
                    rows={2}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        "&:hover fieldset": { borderColor: "#667eea" },
                        "&.Mui-focused fieldset": { borderColor: "#667eea" },
                      },
                    }}
                  />
                </Grid>

                {/* Country */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    name="country"
                    value={form.country}
                    onChange={onChange}
                    variant="outlined"
                    disabled={fetchingLocation}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        "&:hover fieldset": { borderColor: "#667eea" },
                        "&.Mui-focused fieldset": { borderColor: "#667eea" },
                      },
                      "& .MuiInputBase-input.Mui-disabled": {
                        WebkitTextFillColor: "rgba(0, 0, 0, 0.6)",
                      },
                    }}
                  />
                </Grid>

                {/* Empty grid for spacing */}
                <Grid item xs={12} sm={6} />

                {/* Action Buttons */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid item xs={12} sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setForm({
                        name: user?.name || "",
                        email: user?.email || "",
                        phone: user?.phone || "",
                        address: user?.address || "",
                        city: user?.city || "",
                        state: user?.state || "",
                        zipcode: user?.zipcode || "",
                        country: user?.country || "",
                      });
                      setPhoneError('');
                      setPincodeError('');
                      setAlert({ open: false, severity: "", message: "" });
                    }}
                    sx={{
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: 1.5,
                      borderColor: "#ccc",
                      color: "#666",
                      px: 3,
                      py: 1.2,
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={busy || fetchingLocation}
                    startIcon={busy ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : null}
                    sx={{
                      background: busy ? "#9ca3af" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "#fff",
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: 1.5,
                      px: 4,
                      py: 1.2,
                      "&:hover": {
                        transform: busy ? "none" : "translateY(-2px)",
                        boxShadow: busy ? "none" : "0 8px 25px rgba(102, 126, 234, 0.3)",
                      },
                      transition: "all 0.3s ease",
                      "&:disabled": {
                        background: "#9ca3af",
                        color: "#fff",
                        cursor: "not-allowed",
                      },
                    }}
                  >
                    {busy ? "Saving Changes..." : "Save Changes"}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Snackbar for Notifications */}
        <Snackbar open={alert.open} autoHideDuration={3500} onClose={() => setAlert((a) => ({ ...a, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert onClose={() => setAlert((a) => ({ ...a, open: false }))} severity={alert.severity} sx={{ width: '100%' }}>
            {alert.message}
          </Alert>
        </Snackbar>

        {/* Change Password Dialog */}
        <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, color: "#1a1a1a", fontSize: "1.3rem" }}>
            Change Password
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Current Password"
                name="oldPassword"
                type="password"
                value={passwordForm.oldPassword}
                onChange={handlePasswordChange}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "&:hover fieldset": { borderColor: "#667eea" },
                    "&.Mui-focused fieldset": { borderColor: "#667eea" },
                  },
                }}
              />
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "&:hover fieldset": { borderColor: "#667eea" },
                    "&.Mui-focused fieldset": { borderColor: "#667eea" },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "&:hover fieldset": { borderColor: "#667eea" },
                    "&.Mui-focused fieldset": { borderColor: "#667eea" },
                  },
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setPasswordDialogOpen(false)}
              sx={{
                color: "#666",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 1.5,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordSubmit}
              disabled={passwordBusy}
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 1.5,
              }}
            >
              {passwordBusy ? "Updating..." : "Update Password"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
