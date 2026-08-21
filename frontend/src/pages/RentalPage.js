
// import React, { useEffect, useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useSelector } from "react-redux";
// import {
//   Box,
//   Typography,
//   Grid,
//   Card,
//   CardContent,
//   CardMedia,
//   Button,
//   Container,
//   CircularProgress,
//   Alert,
//   Rating,
//   Chip,
//   Divider,
//   IconButton,
//   InputBase,
// } from "@mui/material";
// import SearchIcon from "@mui/icons-material/Search";
// import { AttachMoney as PriceIcon } from "@mui/icons-material";
// import api from "../services/api";

// const formatPrice = (price) => {
//   return new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   }).format(price);
// };

// const RentalPage = () => {
//   const navigate = useNavigate();

//   const [rentalItems, setRentalItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [query, setQuery] = useState("");

//   const location = useLocation();

//   useEffect(() => {
//     fetchRentalItems();
//   }, []);

//   const fetchRentalItems = async () => {
//     try {
//       setLoading(true);
//       const { data } = await api.get("/rentals");
//       setRentalItems(Array.isArray(data) ? data : []);
//       setError(null);
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to load rental items");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleViewDetails = (itemId) => {
//     navigate(`/rental-item/${itemId}`);
//   };

//   const filteredItems = rentalItems.filter((it) =>
//     it.name?.toLowerCase().includes(query.trim().toLowerCase()) ||
//     it.category?.toLowerCase().includes(query.trim().toLowerCase())
//   );

//   if (loading) {
//     return (
//       <Box sx={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"70vh" }}>
//         <CircularProgress size={60} />
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ backgroundColor:"background.default", minHeight:"100vh", pb:6 }}>
      
//       {/* Hero Section */}
//       <Box
//         sx={{
//           background:"linear-gradient(135deg, #0a7020ff 0%, #10ab0dff 100%)",
//           color:"#fff",
//           py:{ xs:6, md:8 },
//           textAlign:"center",
//           mb:4,
//           borderRadius:"0 0 40px 40px",
//         }}
//       >
//         <Container maxWidth="lg">
//           <Typography variant="h3" sx={{ fontWeight:900, mb:1 }}>
//             Rent Premium Products
//           </Typography>
//           <Typography variant="h6" sx={{ opacity:0.95, mb:3 }}>
//             Enjoy gadgets, tools, gear and more – without buying.
//           </Typography>

//           {/* Search Bar */}
//           <Box
//             sx={{
//               mx:"auto",
//               maxWidth:720,
//               display:"flex",
//               gap:1,
//               alignItems:"center",
//               background:"rgba(255,255,255,0.14)",
//               borderRadius:3,
//               px:2,
//               py:1,
//             }}
//           >
//             <IconButton disabled>
//               <SearchIcon sx={{ color:"#fff" }} />
//             </IconButton>

//             <InputBase
//               placeholder="Search by name or category..."
//               value={query}
//               onChange={(e)=> setQuery(e.target.value)}
//               sx={{ color:"#fff", width:"100%" }}
//             />
//           </Box>
//         </Container>
//       </Box>

//       <Container maxWidth="lg" sx={{ px:{ xs:2, sm:4 } }}>

//         {error && <Alert severity="error" sx={{ mb:4 }}>{error}</Alert>}

//         {filteredItems.length === 0 ? (
//           <Box sx={{ textAlign:"center", py:8 }}>
//             <Typography variant="h6" color="text.secondary">No rental items found</Typography>
//           </Box>
//         ) : (

//           <Grid container spacing={3}>

//             {filteredItems.map((item)=> (
//               <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>

//                 <Card
//                   sx={{
//                     height: 430,   // FIXED CARD HEIGHT
//                     display:"flex",
//                     flexDirection:"column",
//                     borderRadius:3,
//                     overflow:"hidden",
//                     background:"#ffffff",
//                     boxShadow:"0 6px 18px rgba(12,24,40,0.08)",
//                     transition:"all 0.35s ease",
//                     "&:hover": {
//                       boxShadow:"0 14px 36px rgba(12,24,40,0.12)",
//                       transform:"translateY(-8px)",
//                     }
//                   }}
//                 >

//                   {/* Image */}
//                   <CardMedia
//                     component="img"
//                     image={item.images?.[0] || "https://via.placeholder.com/350"}
//                     alt={item.name}
//                     sx={{
//                       height:180,
//                       objectFit:"cover",
//                     }}
//                   />

//                   <CardContent sx={{ flexGrow:1, display:"flex", flexDirection:"column" }}>

//                     {/* Title */}
//                     <Typography
//                       variant="subtitle1"
//                       fontWeight={800}
//                       sx={{
//                         mb:1,
//                         overflow:"hidden",
//                         textOverflow:"ellipsis",
//                         whiteSpace:"nowrap",
//                       }}
//                     >
//                       {item.name}
//                     </Typography>

//                     {/* Chips */}
//                     <Box sx={{ display:"flex", gap:1, mb:1, flexWrap:"wrap" }}>
//                       <Chip label={item.category || "General"} size="small" variant="outlined" />
//                       <Chip
//                         label={`${item.availableStock ?? 0} in stock`}
//                         size="small"
//                         color={item.availableStock > 0 ? "success" : "error"}
//                       />
//                     </Box>

//                     <Divider sx={{ my:1 }} />

//                     {/* Rating */}
//                     {item.rating && (
//                       <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:1 }}>
//                         <Rating value={parseFloat(item.rating)} readOnly size="small" />
//                         <Typography variant="caption" color="text.secondary">
//                           ({item.reviews?.length || 0})
//                         </Typography>
//                       </Box>
//                     )}

//                     {/* Price */}
//                     <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:2 }}>
//                       <PriceIcon fontSize="small" color="secondary" />
//                       <Typography variant="h6" color="secondary.main" fontWeight={800}>
//                         {formatPrice(item.pricePerDay)}/day
//                       </Typography>
//                     </Box>

//                     {/* Push Button to Bottom */}
//                     <Box sx={{ flexGrow:1 }} />

//                     <Button
//                       variant="contained"
//                       color="secondary"
//                       fullWidth
//                       onClick={() => handleViewDetails(item._id)}
//                       disabled={item.availableStock === 0}
//                       sx={{ borderRadius:2, fontWeight:800 }}
//                     >
//                       {item.availableStock > 0 ? "View Details & Rent" : "Out of Stock"}
//                     </Button>

//                   </CardContent>

//                 </Card>

//               </Grid>
//             ))}

//           </Grid>

//         )}

//       </Container>
//     </Box>
//   );
// };

// export default RentalPage;


import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Container,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  InputBase,
  Tooltip,
  Stack,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Inventory2 as StockIcon, AccessTime as DaysIcon } from "@mui/icons-material";
import api from "../services/api";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price || 0);

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

const slideInDown = `
  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export default function RentalPage() {
  const navigate = useNavigate();
  const [rentalItems, setRentalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchRentalItems();
  }, []);

  const fetchRentalItems = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/rentals");
      setRentalItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load rental items");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (itemId) => {
    navigate(`/rental-item/${itemId}`);
  };

  const filteredItems = rentalItems.filter((it) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (it.name || "").toLowerCase().includes(q) ||
      (it.category || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <CircularProgress size={60} sx={{ color: "#004d40" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
        pb: 8,
        overflow: "hidden",
      }}
    >
      <style>{fadeInUp + slideInDown}</style>

      {/* Hero Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backgroundAttachment: { xs: "scroll", md: "fixed" },
          color: "#fff",
          py: { xs: 3, md: 5 },
          textAlign: "center",
          mb: 4,
          position: "relative",
          overflow: "hidden",
          borderRadius: "0 0 48px 48px",
          borderBottom: '4px solid',
          borderImage: 'linear-gradient(90deg, #FF9933, #FFFFFF, #138808) 1',
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
            pointerEvents: "none",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60px",
            background: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.05) 100%)",
            pointerEvents: "none",
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "1.6rem", sm: "2.1rem", md: "3rem" },
              letterSpacing: "-0.02em",
              mb: 1.5,
              animation: `slideInDown 0.7s ease-out`,
              textShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            Premium Rental Marketplace
          </Typography>
          <Typography
            variant="body1"
            sx={{
              opacity: 0.95,
              mb: 3,
              fontSize: { xs: "0.9rem", md: "1rem" },
              fontWeight: 600,
              maxWidth: 600,
              mx: "auto",
              animation: `slideInDown 0.8s ease-out 0.1s backwards`,
              lineHeight: 1.5,
            }}
          >
            Rent high-quality cameras, tools, electronics & more — delivered across India, by the day.
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 2,
              px: 2,
              py: 0.5,
              mb: 2,
              fontWeight: 700,
              fontSize: { xs: '0.68rem', sm: '0.8rem' },
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.25)',
              animation: `slideInDown 0.9s ease-out 0.15s backwards`,
            }}
          >
            🇮🇳 Pan-India Delivery • 💰 Affordable Daily Rates • ⭐ Premium Quality
          </Typography>

          {/* Search Bar */}
          <Paper
            component="form"
            onSubmit={(e) => e.preventDefault()}
            sx={{
              mx: "auto",
              maxWidth: 650,
              display: "flex",
              alignItems: "center",
              gap: 1,
              background: "rgba(255,255,255,0.95)",
              borderRadius: 3,
              px: { xs: 1.2, sm: 2 },
              py: { xs: 0.45, sm: 0.6 },
              boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
              backdropFilter: "blur(20px)",
              animation: `fadeInUp 0.8s ease-out 0.2s backwards`,
              border: "1px solid rgba(255,255,255,0.3)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover, &:focus-within": {
                boxShadow: "0 16px 56px rgba(0,0,0,0.2)",
                background: "rgba(255,255,255,1)",
              },
            }}
          >
            <SearchIcon sx={{ color: "#667eea", opacity: 0.8 }} />
            <InputBase
              placeholder="Search by name or category..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{
                flex: 1,
                fontSize: { xs: "0.82rem", sm: "0.9rem" },
                fontWeight: 600,
                color: "#1a1a1a",
                "& input::placeholder": {
                  color: "#999",
                  opacity: 0.7,
                },
              }}
              inputProps={{ "aria-label": "search rentals" }}
            />
          </Paper>
        </Container>
      </Box>

      {/* Content */}
      <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <Box sx={{ width: { xs: "100%", sm: "94%", md: "88%", lg: "80%" }, mx: "auto", px: { xs: 1, sm: 0 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 4, borderRadius: 2, animation: `fadeInUp 0.6s ease-out` }}>
              {error}
            </Alert>
          )}

          {filteredItems.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 12, animation: `fadeInUp 0.6s ease-out` }}>
              <Box sx={{ mb: 2, opacity: 0.5 }}>
                <StockIcon sx={{ fontSize: 80, color: "#004d40" }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#1a1a1a", mb: 1 }}>
                No Rental Items Found
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 400, mx: "auto" }}>
                Try adjusting your search or browse our full collection of premium rental gear.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gap: { xs: 1.25, sm: 2.25, md: 2.5 },
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(3, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                "@media (max-width: 390px)": {
                  gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
                },
              }}
            >
            {filteredItems.map((item, idx) => {
              const rawName = item.name || "";
              const inStock = item.availableStock > 0;

              return (
                <Box key={item._id}>
                  <Card
                    role="article"
                    aria-label={rawName}
                    sx={{
                      minHeight: { xs: 300, sm: 350, md: 372 },
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      borderRadius: { xs: "12px", sm: "16px" },
                      overflow: "hidden",
                      background: "#fff",
                      border: "1px solid rgba(0,77,64,0.05)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      animation: `fadeInUp 0.6s ease-out ${0.1 + idx * 0.08}s backwards`,
                      cursor: "pointer",
                      "&:hover": {
                        transform: "translateY(-12px)",
                        boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
                        "& .rental-image": {
                          transform: "scale(1.08)",
                        },
                        "& .rental-button": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 12px 32px rgba(0,77,64,0.3)",
                        },
                      },
                    }}
                  >
                    {/* Image Container */}
                    <Box
                      sx={{
                        position: "relative",
                        height: { xs: 124, sm: 148, md: 160 },
                        overflow: "hidden",
                        background: "#f6f7fb",
                        flexShrink: 0,
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={item.images?.[0] || "https://via.placeholder.com/800x600?text=No+image"}
                        alt={rawName}
                        className="rental-image"
                        sx={{
                          height: "100%",
                          width: "100%",
                          objectFit: { xs: "contain", sm: "cover" },
                          p: { xs: 0.5, sm: 0 },
                          bgcolor: "#fff",
                          transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      />

                      {/* Stock Badge */}
                      <Chip
                        icon={<StockIcon sx={{ fontSize: 16 }} />}
                        label={`${item.availableStock ?? 0} Available`}
                        sx={{
                          position: "absolute",
                          top: { xs: 8, sm: 12 },
                          right: { xs: 8, sm: 12 },
                          height: { xs: 24, sm: 32 },
                          fontSize: { xs: "0.64rem", sm: "0.75rem" },
                          fontWeight: 800,
                          background: inStock
                            ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                            : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                          color: "#fff",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                        }}
                      />
                    </Box>

                    <CardContent
                      sx={{
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: { xs: 1, sm: 1.5 },
                        p: { xs: 1.15, sm: 2.2 },
                      }}
                    >
                      {/* Title */}
                      <Tooltip title={rawName} placement="top" arrow>
                        <Typography
                          variant="h6"
                          fontWeight={800}
                          sx={{
                            mb: 0.1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            color: "#0f172a",
                            lineHeight: 1.2,
                            minHeight: { xs: 40, sm: 48 },
                            fontSize: { xs: "0.82rem", sm: "1rem" },
                            display: "block",
                          }}
                        >
                          {rawName}
                        </Typography>
                      </Tooltip>

                      {/* Category & Stock Chips */}
                      <Stack direction="row" spacing={0.6} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                        <Chip
                          label={item.category || "General"}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontWeight: 700,
                            height: { xs: 22, sm: 24 },
                            fontSize: { xs: "0.62rem", sm: "0.75rem" },
                            borderColor: "#00695c",
                            color: "#00695c",
                          }}
                        />
                        <Chip
                          icon={<DaysIcon sx={{ fontSize: 14 }} />}
                          label="Daily Rent"
                          size="small"
                          sx={{
                            fontWeight: 700,
                            height: { xs: 22, sm: 24 },
                            fontSize: { xs: "0.62rem", sm: "0.75rem" },
                            background: "rgba(0,105,92,0.1)",
                            color: "#00695c",
                          }}
                        />
                      </Stack>

                      <Divider sx={{ my: 0.5 }} />

                      {/* Price */}
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 900,
                          color: "#00695c",
                          fontSize: { xs: "1rem", sm: "1.45rem" },
                          letterSpacing: "-0.01em",
                          mt: 0.6,
                        }}
                      >
                        {formatPrice(item.pricePerDay)}
                      </Typography>

                      <Box sx={{ flexGrow: 1 }} />

                      {/* Button */}
                      <Button
                        className="rental-button"
                        variant="contained"
                        fullWidth
                        onClick={() => handleViewDetails(item._id)}
                        disabled={!inStock}
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 800,
                          px: { xs: 1.2, sm: 2 },
                          py: { xs: 0.75, sm: 1.1 },
                          fontSize: { xs: "0.68rem", sm: "0.86rem" },
                          background: inStock
                            ? "linear-gradient(135deg, #004d40 0%, #00695c 100%)"
                            : "linear-gradient(135deg, #ccc 0%, #aaa 100%)",
                          color: "#fff",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover:not(:disabled)": {
                            filter: "brightness(1.05)",
                          },
                          "&:active:not(:disabled)": {
                            transform: "translateY(0)",
                          },
                          "&:disabled": {
                            cursor: "not-allowed",
                            opacity: 0.6,
                          },
                        }}
                      >
                        {inStock ? "View Details & Rent" : "Out of Stock"}
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Box>
          )}
        </Box>
      </Box>

      {/* Indian Trust Strip */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: 2, 
        py: { xs: 1, sm: 1.5 }, 
        px: 2,
        mx: 'auto',
        maxWidth: { xs: "94%", sm: 700 },
        mb: 2,
        background: 'linear-gradient(90deg, rgba(255,153,51,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(19,136,8,0.06) 100%)',
        borderRadius: 2,
        border: '1px solid',
        borderImage: 'linear-gradient(90deg, rgba(255,153,51,0.3), rgba(0,0,128,0.1), rgba(19,136,8,0.3)) 1',
      }}>
        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: { xs: '0.66rem', sm: '0.78rem' }, color: 'text.secondary', textAlign: 'center', lineHeight: 1.4 }}>
          
          📦 Fast Delivery Across India • 🔒 Verified Rentals • 💳 Secure Indian Payments • ↩️ Easy Returns
        </Typography>
      </Box>
    </Box>
  );
}
