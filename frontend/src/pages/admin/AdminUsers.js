

import AdminLayout from "../../components/AdminLayout";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Card,
  Grid,
} from '@mui/material';
import { Delete, AdminPanelSettings } from '@mui/icons-material';
import api from '../../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/users');
      setUsers(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleToggleAdmin = async (id, isAdmin) => {
    try {
      const { data } = await api.put(`/admin/users/${id}`, { isAdmin });
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isAdmin: data.isAdmin } : u))
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

return (
  <AdminLayout>
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 900, 
          color: "#1f2937",
          display: "flex",
          alignItems: "center",
          gap: 1
        }}>
          👥 User Management
        </Typography>
        <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.5 }}>
          Manage all registered users and admin privileges
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            p: 2.5,
            borderRadius: 2,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
          }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
              Total Users
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, mt: 1 }}>
              {users.length}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            p: 2.5,
            borderRadius: 2,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
          }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
              Admins
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, mt: 1 }}>
              {users.filter(u => u.isAdmin).length}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            p: 2.5,
            borderRadius: 2,
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#fff",
            boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)"
          }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
              Regular Users
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, mt: 1 }}>
              {users.filter(u => !u.isAdmin).length}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ 
          borderRadius: 2, 
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          overflow: "hidden"
        }}>
          <Table>
            <TableHead sx={{
              bgcolor: "#f3f4f6",
              "& th": {
                fontWeight: 900,
                fontSize: "0.9rem",
                color: "#1f2937",
                borderBottom: "2px solid #e5e7eb",
                py: 2
              }
            }}>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Joined Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow 
                  key={user._id}
                  hover
                  sx={{
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "#f9fafb"
                    },
                    "& td": {
                      py: 1.5,
                      borderColor: "#f0f0f0"
                    }
                  }}
                >
                  <TableCell sx={{ fontWeight: 700, color: "#1f2937" }}>
                    {user.name}
                  </TableCell>
                  <TableCell sx={{ color: "#6b7280" }}>
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isAdmin ? '👑 Admin' : '👤 User'}
                      color={user.isAdmin ? 'primary' : 'default'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "#6b7280" }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                      <IconButton
                        onClick={() => handleToggleAdmin(user._id, !user.isAdmin)}
                        color={user.isAdmin ? 'primary' : 'default'}
                        size="small"
                        title={user.isAdmin ? "Remove Admin" : "Make Admin"}
                        sx={{
                          "&:hover": {
                            backgroundColor: user.isAdmin ? "rgba(102, 126, 234, 0.1)" : "rgba(107, 114, 128, 0.1)"
                          }
                        }}
                      >
                        <AdminPanelSettings fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(user._id)}
                        color="error"
                        size="small"
                        title="Delete User"
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(239, 68, 68, 0.1)"
                          }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  </AdminLayout>
);
};

export default AdminUsers;
