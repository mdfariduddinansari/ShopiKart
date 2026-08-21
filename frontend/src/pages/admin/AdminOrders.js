import React, { useEffect, useState } from "react";
import * as XLSX from 'xlsx';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Select,
  MenuItem,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  Grid,
} from "@mui/material";
import { Download } from '@mui/icons-material';
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/orders");
      setOrders(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: "warning",
      processing: "info",
      shipped: "primary",
      delivered: "success",
      cancelled: "error",
    };
    return statusColors[status] || "default";
  };

  const filteredOrders = filterStatus === "all"
    ? orders
    : orders.filter((order) => order.status === filterStatus);

  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleUpdateStatusOpen = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status || "pending");
    setStatusDialogOpen(true);
  };

  const handleStatusDialogClose = () => {
    setStatusDialogOpen(false);
    setSelectedOrder(null);
    setNewStatus("");
  };

  const handleUpdateOrderStatus = async () => {
    try {
      setUpdatingStatus(true);
      await api.put(`/orders/${selectedOrder._id}`, { status: newStatus });
      setSuccessMessage(`Order status updated to "${newStatus}"`);
      handleStatusDialogClose();
      fetchAllOrders();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update order status");
      setTimeout(() => setError(""), 3000);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMarkAsPaid = async (orderId) => {
    try {
      setLoading(true);
      await api.put(`/orders/${orderId}`, { isPaid: true, paidAt: new Date() });
      setSuccessMessage("Order marked as paid");
      fetchAllOrders();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark as paid");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDelivered = async (orderId) => {
    try {
      setLoading(true);
      await api.put(`/orders/${orderId}`, {
        isDelivered: true,
        deliveredAt: new Date(),
      });
      setSuccessMessage("Order marked as delivered");
      fetchAllOrders();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark as delivered");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredOrders.map((order) => ({
        'Order ID': order._id || '',
        'Customer Name': order.user?.name || 'Unknown',
        'Customer Email': order.user?.email || '',
        'Total Amount': order.totalPrice || 0,
        'Status': order.status || 'pending',
        'Payment Status': order.isPaid ? 'Paid' : 'Pending',
        'Paid At': order.isPaid && order.paidAt ? new Date(order.paidAt).toLocaleString() : '',
        'Delivery Status': order.isDelivered ? 'Delivered' : 'Not Delivered',
        'Delivered At': order.isDelivered && order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : '',
        'Shipping Address': order.shippingAddress ? 
          `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipcode}` : '',
        'Number of Items': order.orderItems?.length || 0,
        'Items Total': order.itemsPrice || 0,
        'Shipping Price': order.shippingPrice || 0,
        'Tax': order.taxPrice || 0,
        'Order Date': order.createdAt ? new Date(order.createdAt).toLocaleString() : '',
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const columnWidths = [
        { wch: 25 }, // Order ID
        { wch: 20 }, // Customer Name
        { wch: 30 }, // Customer Email
        { wch: 15 }, // Total Amount
        { wch: 12 }, // Status
        { wch: 15 }, // Payment Status
        { wch: 20 }, // Paid At
        { wch: 15 }, // Delivery Status
        { wch: 20 }, // Delivered At
        { wch: 50 }, // Shipping Address
        { wch: 15 }, // Number of Items
        { wch: 12 }, // Items Total
        { wch: 12 }, // Shipping Price
        { wch: 10 }, // Tax
        { wch: 20 }, // Order Date
      ];
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `ShopiKart_Orders_${date}.xlsx`;

      // Download
      XLSX.writeFile(workbook, filename);

      setSuccessMessage(`Exported ${filteredOrders.length} orders to Excel successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export to Excel. Please try again.');
      setTimeout(() => setError(""), 3000);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 900, color: "#1f2937" }}>
            📦 Orders Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "1rem" }}>
            View and manage all customer orders and their status
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            {successMessage}
          </Alert>
        )}

        {/* Filter Section */}
        <Paper sx={{ mb: 3, p: 2.5, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#6b7280" }}>
                🔍 Filter by Status:
              </Typography>
              <Select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(0);
                }}
                sx={{ 
                  minWidth: 220,
                  borderRadius: 1.5,
                  "& .MuiOutlinedInput-root": {
                    borderColor: "#e5e7eb",
                    "&:hover fieldset": { borderColor: "#667eea" },
                    "&.Mui-focused fieldset": { borderColor: "#667eea" },
                  }
                }}
              >
                <MenuItem value="all">All Orders</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="shipped">Shipped</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </Box>
            <Button
              variant="outlined"
              color="success"
              startIcon={<Download />}
              onClick={handleExportToExcel}
              disabled={orders.length === 0}
              sx={{ 
                whiteSpace: 'nowrap',
                fontWeight: 600,
                borderWidth: 2,
                "&:hover": {
                  borderWidth: 2,
                  backgroundColor: "rgba(16, 185, 129, 0.08)"
                }
              }}
            >
              Export Excel
            </Button>
          </Box>
        </Paper>

        {/* Orders Table */}
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
              <TableCell>Order ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No orders found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow 
                  key={order._id} 
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
                  <TableCell sx={{ fontWeight: 700, color: "#667eea" }}>
                    {order._id.substring(0, 8)}...
                  </TableCell>
                  <TableCell sx={{ color: "#374151" }}>
                    {order.user?.name || "Unknown"}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: "#1f2937" }}>
                    ₹{order.totalPrice.toFixed(0)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.status || "pending"}
                      color={getStatusColor(order.status)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.isPaid ? "Paid" : "Pending"}
                      color={order.isPaid ? "success" : "error"}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "#6b7280" }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center", flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewOrder(order)}
                        sx={{
                          borderColor: "#667eea",
                          color: "#667eea",
                          "&:hover": {
                            backgroundColor: "#667eea",
                            color: "#fff",
                            borderColor: "#667eea"
                          }
                        }}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="info"
                        onClick={() => handleUpdateStatusOpen(order)}
                        sx={{
                          "&:hover": {
                            backgroundColor: "#3b82f6",
                            color: "#fff"
                          }
                        }}
                      >
                        Update
                      </Button>
                      {!order.isPaid && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          onClick={() => handleMarkAsPaid(order._id)}
                          sx={{
                            "&:hover": {
                              backgroundColor: "#10b981",
                              color: "#fff"
                            }
                          }}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: "1px solid #e5e7eb",
            bgcolor: "#f9fafb",
            "& .MuiTablePagination-toolbar": {
              color: "#6b7280"
            }
          }}
        />
      </TableContainer>

      {/* View Order Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={handleViewDialogClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 10px 40px rgba(0,0,0,0.12)"
          }
        }}
      >
        <DialogTitle sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
          fontSize: "1.3rem",
          fontWeight: 900,
          py: 2
        }}>
          📦 Order Details
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {selectedOrder && (
            <Box>
              <Grid container spacing={2}>
                {/* Left Column */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    p: 2.5, 
                    borderRadius: 1.5, 
                    border: "1px solid #e5e7eb",
                    bgcolor: "#f9fafb"
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, color: "#1f2937" }}>
                      Order Info
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: "#6b7280" }}>Order ID</Typography>
                        <Typography sx={{ fontWeight: 700, color: "#667eea" }}>
                          {selectedOrder._id}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: "#6b7280" }}>Customer</Typography>
                        <Typography sx={{ fontWeight: 600 }}>{selectedOrder.user?.name}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: "#6b7280" }}>Email</Typography>
                        <Typography sx={{ fontWeight: 600 }}>{selectedOrder.user?.email}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: "#6b7280" }}>Total Amount</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: "1.2rem", color: "#10b981" }}>
                          ₹{selectedOrder.totalPrice.toFixed(0)}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>

                  <Card sx={{ 
                    p: 2.5, 
                    borderRadius: 1.5, 
                    border: "1px solid #e5e7eb",
                    bgcolor: "#f9fafb",
                    mt: 2
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, color: "#1f2937" }}>
                      Shipping Address
                    </Typography>
                    {selectedOrder.shippingAddress ? (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {selectedOrder.shippingAddress.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#6b7280" }}>
                          {selectedOrder.shippingAddress.address}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#6b7280" }}>
                          {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{" "}
                          {selectedOrder.shippingAddress.zipcode}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: "#6b7280" }}>No address provided</Typography>
                    )}
                  </Card>
                </Grid>

                {/* Right Column */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    p: 2.5, 
                    borderRadius: 1.5, 
                    border: "1px solid #e5e7eb",
                    bgcolor: "#f9fafb"
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, color: "#1f2937" }}>
                      Order Items ({selectedOrder.orderItems.length})
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      {selectedOrder.orderItems.map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            pb: 1.5,
                            borderBottom: index < selectedOrder.orderItems.length - 1 ? "1px solid #e5e7eb" : "none"
                          }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#1f2937" }}>
                              {item.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#6b7280" }}>
                              Qty: {item.qty}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#667eea" }}>
                            ₹{(item.qty * item.price).toFixed(0)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Card>

                  <Card sx={{ 
                    p: 2.5, 
                    borderRadius: 1.5, 
                    border: "1px solid #e5e7eb",
                    bgcolor: "#f9fafb",
                    mt: 2
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, color: "#1f2937" }}>
                      Order Status
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip
                        label={`Status: ${selectedOrder.status}`}
                        color={getStatusColor(selectedOrder.status)}
                        sx={{ fontWeight: 600, height: 32 }}
                      />
                      <Chip
                        label={selectedOrder.isPaid ? "✓ Paid" : "⏳ Payment Pending"}
                        color={selectedOrder.isPaid ? "success" : "error"}
                        sx={{ fontWeight: 600, height: 32 }}
                      />
                    </Box>
                    {!selectedOrder.isPaid && (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => {
                          handleMarkAsPaid(selectedOrder._id);
                          handleViewDialogClose();
                        }}
                        sx={{ mt: 2, fontWeight: 600 }}
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{
          borderTop: "1px solid #e5e7eb",
          p: 2,
          bgcolor: "#f9fafb"
        }}>
          <Button 
            onClick={handleViewDialogClose}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              textTransform: "none",
              fontWeight: 600
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={handleStatusDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Current Status: <strong>{selectedOrder?.status}</strong>
            </Typography>
            <Select
              fullWidth
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusDialogClose} disabled={updatingStatus}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateOrderStatus}
            variant="contained"
            color="secondary"
            disabled={updatingStatus}
          >
            {updatingStatus ? <CircularProgress size={20} /> : "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </AdminLayout>
  );
};

export default AdminOrders;
