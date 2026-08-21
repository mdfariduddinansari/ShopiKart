import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Grid, 
  Paper, 
  Typography, 
  CircularProgress, 
  Alert, 
  Box,
  Card,
  CardContent,
  useTheme
} from "@mui/material";
import {
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { fetchAdminStats } from "../../features/adminSlice";
import AdminLayout from "../../components/AdminLayout";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { stats = {}, loading, error } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminStats());
  }, [dispatch]);

  const metrics = [
    { 
      label: "Total Products", 
      value: stats.totalProducts || 0, 
      icon: InventoryIcon,
      color: "#667eea",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    { 
      label: "Total Users", 
      value: stats.totalUsers || 0,
      icon: PeopleIcon,
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
    },
    { 
      label: "Total Orders", 
      value: stats.totalOrders || 0,
      icon: ShoppingCartIcon,
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
    },
  ];

  return (
    <AdminLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 900, color: "#1f2937" }}>
          📊 Admin Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "1rem" }}>
          Overview of your store performance and statistics
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
      
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <Grid item xs={12} sm={6} md={3} key={m.label}>
                <Card
                  sx={{
                    background: m.gradient,
                    color: "#fff",
                    borderRadius: 3,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    border: "none",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                    },
                  }}
                >
                  <CardContent sx={{ position: "relative", p: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600, fontSize: "0.9rem", mb: 1 }}>
                          {m.label}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900, fontSize: "2.5rem" }}>
                          {m.value}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          background: "rgba(255,255,255,0.2)",
                          borderRadius: 2,
                          p: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon sx={{ fontSize: 32, color: "#fff" }} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;


