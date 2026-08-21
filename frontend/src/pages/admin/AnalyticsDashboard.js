import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  TrendingUp,
  ShoppingCart,
  People,
  Category,
  EventNote,
  Search,
  Visibility,
  AttachMoney,
  LocalOffer,
} from "@mui/icons-material";
import AdminLayout from "../../components/AdminLayout";

const AnalyticsDashboard = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Analytics Data States
  const [salesData, setSalesData] = useState(null);
  const [rentalData, setRentalData] = useState(null);
  const [behaviorData, setBehaviorData] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    console.log("=== Fetching Analytics ===");
    console.log("Active Tab:", activeTab);
    console.log("Period:", period);
    
    try {
      const token = localStorage.getItem("userToken");
      
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }
      
      console.log("Token found:", token.substring(0, 20) + "...");
      
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      if (activeTab === 0) {
        // Sales Analytics
        console.log("Fetching sales analytics...");
        const response = await fetch(
          `http://localhost:5000/api/admin/analytics/sales?period=${period}`,
          { headers }
        );
        
        console.log("Sales response status:", response.status);
        
        if (response.status === 401) {
          throw new Error("Unauthorized: Please login again or check admin permissions.");
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Sales data received:", data);
        console.log("Sales summary:", data.summary);
        setSalesData(data);
      } else if (activeTab === 1) {
        // Rental Analytics
        console.log("Fetching rental analytics...");
        const response = await fetch(
          `http://localhost:5000/api/admin/analytics/rentals?period=${period}`,
          { headers }
        );
        
        console.log("Rental response status:", response.status);
        
        if (response.status === 401) {
          throw new Error("Unauthorized: Please login again or check admin permissions.");
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Rental data received:", data);
        console.log("Rental summary:", data.summary);
        setRentalData(data);
      } else if (activeTab === 2) {
        // Customer Behavior Analytics
        console.log("Fetching customer behavior analytics...");
        const response = await fetch(
          `http://localhost:5000/api/admin/analytics/customer-behavior?period=${period}`,
          { headers }
        );
        
        console.log("Behavior response status:", response.status);
        
        if (response.status === 401) {
          throw new Error("Unauthorized: Please login again or check admin permissions.");
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Behavior data received:", data);
        setBehaviorData(data);
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, period]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const MetricCard = ({ title, value, icon: Icon, color, gradient, subtitle }) => (
    <Card
      sx={{
        background: gradient,
        color: "#fff",
        borderRadius: 3,
        boxShadow: `0 8px 24px ${alpha(color, 0.25)}`,
        transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: `0 16px 40px ${alpha(color, 0.35)}`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600, mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              background: "rgba(255,255,255,0.2)",
              borderRadius: 2,
              p: 1.5,
              backdropFilter: "blur(10px)",
            }}
          >
            <Icon sx={{ fontSize: 32 }} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  const SalesAnalytics = () => {
    console.log("Rendering SalesAnalytics, salesData:", salesData);
    
    if (!salesData) {
      return (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Loading sales data...
        </Alert>
      );
    }

    if (!salesData.summary) {
      return (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Sales data received but summary is missing. Check console for details.
        </Alert>
      );
    }

    const hasData = salesData.summary.totalOrders > 0;

    return (
      <Box>
        {!hasData && (
          <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
            No paid orders found for the selected period. Place some orders and mark them as paid to see analytics data.
          </Alert>
        )}

        {/* Summary Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(salesData.summary.totalRevenue)}
              icon={AttachMoney}
              color="#10b981"
              gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Orders"
              value={salesData.summary.totalOrders}
              icon={ShoppingCart}
              color="#667eea"
              gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Average Order Value"
              value={formatCurrency(salesData.summary.averageOrderValue)}
              icon={TrendingUp}
              color="#f59e0b"
              gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Categories"
              value={salesData.categoryPerformance?.length || 0}
              icon={Category}
              color="#8b5cf6"
              gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
            />
          </Grid>
        </Grid>

        {/* Revenue Over Time */}
        {salesData.revenueOverTime && salesData.revenueOverTime.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
            📈 Revenue Trend
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Stack direction="row" spacing={2} sx={{ minWidth: 600 }}>
              {salesData.revenueOverTime.map((item) => (
                <Box
                  key={item._id}
                  sx={{
                    minWidth: 80,
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      height: 150,
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: `${Math.min((item.revenue / salesData.revenueOverTime.reduce((max, i) => Math.max(max, i.revenue), 0)) * 100, 100)}%`,
                        background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
                        borderRadius: "4px 4px 0 0",
                        transition: "all 300ms ease",
                        "&:hover": {
                          opacity: 0.8,
                        },
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
                    {item._id}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
                    {formatCurrency(item.revenue)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Paper>
        )}

        {/* Top Products */}
        {salesData.topProducts && salesData.topProducts.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
            🏆 Top Selling Products
          </Typography>
          <Grid container spacing={2}>
            {salesData.topProducts.slice(0, 6).map((product, index) => (
              <Grid item xs={12} sm={6} md={4} key={product._id}>
                <Card sx={{ borderRadius: 2, border: `2px solid ${index < 3 ? "#667eea" : "transparent"}` }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 900,
                          fontSize: "1.2rem",
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {product.productName}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={`${product.totalQuantity} sold`}
                            size="small"
                            sx={{ fontSize: "0.7rem", height: 20 }}
                          />
                          <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700 }}>
                            {formatCurrency(product.totalRevenue)}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
        )}

        {/* Category Performance */}
        {salesData.categoryPerformance && salesData.categoryPerformance.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
            📊 Category Performance
          </Typography>
          <Grid container spacing={2}>
            {salesData.categoryPerformance.map((cat) => (
              <Grid item xs={12} sm={6} md={4} key={cat._id}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      {cat._id}
                    </Typography>
                    <Typography variant="h6" sx={{ color: "success.main", fontWeight: 900, mb: 0.5 }}>
                      {formatCurrency(cat.totalRevenue)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {cat.totalQuantity} items sold • {cat.totalOrders} orders
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
        )}
      </Box>
    );
  };

  const RentalAnalytics = () => {
    console.log("Rendering RentalAnalytics, rentalData:", rentalData);
    
    if (!rentalData) {
      return (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Loading rental data...
        </Alert>
      );
    }

    if (!rentalData.summary) {
      return (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Rental data received but summary is missing. Check console for details.
        </Alert>
      );
    }

    const hasData = rentalData.summary.totalBookings > 0;

    return (
      <Box>
        {!hasData && (
          <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
            No rental bookings found for the selected period. Create some rental bookings to see analytics data.
          </Alert>
        )}

        {/* Summary Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Rental Revenue"
              value={formatCurrency(rentalData.summary.totalRevenue)}
              icon={AttachMoney}
              color="#10b981"
              gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Bookings"
              value={rentalData.summary.totalBookings}
              icon={EventNote}
              color="#667eea"
              gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Avg Booking Value"
              value={formatCurrency(rentalData.summary.averageBookingValue)}
              icon={TrendingUp}
              color="#f59e0b"
              gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Avg Duration"
              value={`${Math.round(rentalData.summary.averageDuration)} days`}
              icon={LocalOffer}
              color="#8b5cf6"
              gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
            />
          </Grid>
        </Grid>

        {/* Rental Revenue Over Time */}
        {rentalData.rentalRevenueOverTime && rentalData.rentalRevenueOverTime.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
            📈 Rental Revenue Trend
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Stack direction="row" spacing={2} sx={{ minWidth: 600 }}>
              {rentalData.rentalRevenueOverTime.map((item) => (
                <Box key={item._id} sx={{ minWidth: 80, textAlign: "center" }}>
                  <Box
                    sx={{
                      height: 150,
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: `${Math.min((item.revenue / rentalData.rentalRevenueOverTime.reduce((max, i) => Math.max(max, i.revenue), 0)) * 100, 100)}%`,
                        background: "linear-gradient(180deg, #10b981 0%, #059669 100%)",
                        borderRadius: "4px 4px 0 0",
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
                    {item._id}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
                    {formatCurrency(item.revenue)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Paper>
        )}

        {/* Popular Rentals */}
        {rentalData.popularRentals && rentalData.popularRentals.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
            🎯 Most Popular Rental Items
          </Typography>
          <Grid container spacing={2}>
            {rentalData.popularRentals.map((rental, index) => (
              <Grid item xs={12} sm={6} md={4} key={rental._id}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                      {rental.itemName}
                    </Typography>
                    <Typography variant="h6" sx={{ color: "success.main", fontWeight: 900, mb: 0.5 }}>
                      {formatCurrency(rental.totalRevenue)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {rental.totalBookings} bookings • {Math.round(rental.averageDuration)} days avg
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
        )}

        {/* Booking Status */}
        {rentalData.bookingsByStatus && rentalData.bookingsByStatus.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
            📋 Booking Status Distribution
          </Typography>
          <Grid container spacing={2}>
            {rentalData.bookingsByStatus.map((status) => (
              <Grid item xs={12} sm={6} md={3} key={status._id}>
                <Card sx={{ borderRadius: 2, background: alpha(theme.palette.primary.main, 0.05) }}>
                  <CardContent>
                    <Typography variant="caption" sx={{ textTransform: "uppercase", fontWeight: 700, color: "text.secondary" }}>
                      {status._id}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, my: 1 }}>
                      {status.count}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "success.main", fontWeight: 700 }}>
                      {formatCurrency(status.revenue)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
        )}
      </Box>
    );
  };

  const CustomerBehaviorAnalytics = () => {
    if (!behaviorData) {
      return (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No customer behavior data available for the selected period. Make sure you have customer activity in the system.
        </Alert>
      );
    }

    const newCustomers = behaviorData.newVsReturning?.find(item => item._id === 'new') || { customers: 0, totalRevenue: 0 };
    const returningCustomers = behaviorData.newVsReturning?.find(item => item._id === 'returning') || { customers: 0, totalRevenue: 0 };

    return (
      <Box>
        {/* Summary Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="New Customers"
              value={newCustomers.customers}
              icon={People}
              color="#667eea"
              gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              subtitle={formatCurrency(newCustomers.totalRevenue)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Returning Customers"
              value={returningCustomers.customers}
              icon={TrendingUp}
              color="#10b981"
              gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
              subtitle={formatCurrency(returningCustomers.totalRevenue)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Search Queries"
              value={behaviorData.topSearches?.length || 0}
              icon={Search}
              color="#f59e0b"
              gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Product Views"
              value={behaviorData.mostViewedProducts?.reduce((sum, p) => sum + p.totalViews, 0) || 0}
              icon={Visibility}
              color="#8b5cf6"
              gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
            />
          </Grid>
        </Grid>

        {/* Top Customers */}
        {behaviorData.topCustomers && behaviorData.topCustomers.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
            👑 Top Customers
          </Typography>
          <Grid container spacing={2}>
            {behaviorData.topCustomers.map((customer, index) => (
              <Grid item xs={12} sm={6} md={4} key={customer._id}>
                <Card sx={{ borderRadius: 2, border: `2px solid ${index < 3 ? "#667eea" : "transparent"}` }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 900,
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {customer.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
                          {customer.email}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip label={`${customer.totalOrders} orders`} size="small" sx={{ fontSize: "0.7rem", height: 20 }} />
                          <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700 }}>
                            {formatCurrency(customer.totalSpent)}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
        )}

        {/* Top Searches */}
        {behaviorData.topSearches && behaviorData.topSearches.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
            🔍 Top Search Queries
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {behaviorData.topSearches.map((search) => (
              <Chip
                key={search._id}
                label={`${search._id} (${search.searchCount})`}
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              />
            ))}
          </Stack>
        </Paper>
        )}

        {/* Most Viewed Products */}
        {behaviorData.mostViewedProducts && behaviorData.mostViewedProducts.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
            👁️ Most Viewed Products
          </Typography>
          <Grid container spacing={2}>
            {behaviorData.mostViewedProducts.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product._id}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                      {product.productName}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "primary.main" }}>
                          {product.totalViews}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          Total Views
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "success.main" }}>
                          {product.uniqueViewers}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          Unique Viewers
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
        )}

        {/* Category Preferences */}
        {behaviorData.categoryPreferences && behaviorData.categoryPreferences.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
            ❤️ Customer Category Preferences
          </Typography>
          <Grid container spacing={2}>
            {behaviorData.categoryPreferences.map((cat) => (
              <Grid item xs={12} sm={6} md={4} key={cat._id}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      {cat._id}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "primary.main" }}>
                          {cat.totalUsers}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          Interested Users
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "warning.main" }}>
                          {cat.avgInterestScore ? cat.avgInterestScore.toFixed(1) : '0.0'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          Avg Score
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
        )}
      </Box>
    );
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                📊 Advanced Analytics Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comprehensive insights into sales, rentals, and customer behavior
              </Typography>
            </Box>
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Period</InputLabel>
              <Select
                value={period}
                label="Period"
                onChange={(e) => {
                  console.log("Period changed to:", e.target.value);
                  setPeriod(e.target.value);
                }}
                size="small"
              >
                <MenuItem value="day">Daily (30 days)</MenuItem>
                <MenuItem value="week">Weekly (12 weeks)</MenuItem>
                <MenuItem value="month">Monthly (12 months)</MenuItem>
                <MenuItem value="year">Yearly (2 years)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              "& .MuiTab-root": {
                fontWeight: 700,
                fontSize: "0.9rem",
                py: 2,
              },
            }}
          >
            <Tab label="📈 Sales Analytics" />
            <Tab label="🏠 Rental Analytics" />
            <Tab label="👥 Customer Behavior" />
          </Tabs>
        </Paper>

        {/* Content */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <Box>
            {activeTab === 0 && <SalesAnalytics />}
            {activeTab === 1 && <RentalAnalytics />}
            {activeTab === 2 && <CustomerBehaviorAnalytics />}
          </Box>
        )}
      </Container>
    </AdminLayout>
  );
};

export default AnalyticsDashboard;
