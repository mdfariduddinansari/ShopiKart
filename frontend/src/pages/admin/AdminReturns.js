import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Stack,
  Divider,
  Select,
  MenuItem,
} from "@mui/material";
import {
  AssignmentReturn as ReturnIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Done as CompleteIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";

const formatPrice = (price) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const AdminReturns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  
  // Form states
  const [refundAmount, setRefundAmount] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/orders/returns/all");
      setReturns(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch return requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      setError("Please enter a valid refund amount");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      setProcessing(true);
      await api.post(`/orders/${selectedReturn._id}/return/approve`, {
        refundAmount: parseFloat(refundAmount),
      });
      setSuccessMessage("Return approved successfully! Stock has been restored.");
      setApproveDialogOpen(false);
      setRefundAmount("");
      await fetchReturns();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve return");
      setTimeout(() => setError(""), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      setProcessing(true);
      await api.post(`/orders/${selectedReturn._id}/return/reject`, {
        rejectionReason: rejectionReason,
      });
      setSuccessMessage("Return rejected successfully!");
      setRejectDialogOpen(false);
      setRejectionReason("");
      await fetchReturns();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject return");
      setTimeout(() => setError(""), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async () => {
    try {
      setProcessing(true);
      await api.post(`/orders/${selectedReturn._id}/return/complete`);
      setSuccessMessage("Return marked as completed! Refund processed.");
      setCompleteDialogOpen(false);
      await fetchReturns();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete return");
      setTimeout(() => setError(""), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const getReturnStatusColor = (status) => {
    const colors = {
      requested: "warning",
      approved: "info",
      rejected: "error",
      completed: "success",
    };
    return colors[status] || "default";
  };

  const calculateDaysSince = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diffTime = Math.abs(now - then);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredReturns = returns.filter((order) => {
    if (statusFilter === "all") return true;
    return order.returnStatus === statusFilter;
  });

  const returnStats = {
    all: returns.length,
    requested: returns.filter((r) => r.returnStatus === "requested").length,
    approved: returns.filter((r) => r.returnStatus === "approved").length,
    rejected: returns.filter((r) => r.returnStatus === "rejected").length,
    completed: returns.filter((r) => r.returnStatus === "completed").length,
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "50%",
                p: 1.5,
                color: "#fff",
              }}
            >
              <ReturnIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={900} sx={{ color: "#667eea" }}>
                Return Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage customer return requests and process refunds
              </Typography>
            </Box>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccessMessage("")}>
            {successMessage}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                background: "#fff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: "2px solid #e5e7eb",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" },
                ...(statusFilter === "all" && { border: "2px solid #667eea", background: "#f0f4ff" }),
              }}
              onClick={() => setStatusFilter("all")}
            >
              <CardContent>
                <Typography variant="h4" fontWeight={900} sx={{ color: "#667eea" }}>
                  {returnStats.all}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={700}>
                  Total Returns
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                background: "#fff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: "2px solid #e5e7eb",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" },
                ...(statusFilter === "requested" && { border: "2px solid #f59e0b", background: "#fef3c7" }),
              }}
              onClick={() => setStatusFilter("requested")}
            >
              <CardContent>
                <Typography variant="h4" fontWeight={900} sx={{ color: "#f59e0b" }}>
                  {returnStats.requested}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={700}>
                  Pending Approval
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                background: "#fff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: "2px solid #e5e7eb",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" },
                ...(statusFilter === "approved" && { border: "2px solid #3b82f6", background: "#dbeafe" }),
              }}
              onClick={() => setStatusFilter("approved")}
            >
              <CardContent>
                <Typography variant="h4" fontWeight={900} sx={{ color: "#3b82f6" }}>
                  {returnStats.approved}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={700}>
                  Approved
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                background: "#fff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: "2px solid #e5e7eb",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" },
                ...(statusFilter === "rejected" && { border: "2px solid #ef4444", background: "#fee2e2" }),
              }}
              onClick={() => setStatusFilter("rejected")}
            >
              <CardContent>
                <Typography variant="h4" fontWeight={900} sx={{ color: "#ef4444" }}>
                  {returnStats.rejected}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={700}>
                  Rejected
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                background: "#fff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: "2px solid #e5e7eb",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" },
                ...(statusFilter === "completed" && { border: "2px solid #10b981", background: "#d1fae5" }),
              }}
              onClick={() => setStatusFilter("completed")}
            >
              <CardContent>
                <Typography variant="h4" fontWeight={900} sx={{ color: "#10b981" }}>
                  {returnStats.completed}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={700}>
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Returns Table */}
        <Paper sx={{ borderRadius: 3, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          {filteredReturns.length === 0 ? (
            <Box sx={{ p: 5, textAlign: "center" }}>
              <ReturnIcon sx={{ fontSize: 80, color: "#ccc", mb: 2 }} />
              <Typography variant="h6" fontWeight={700} color="text.secondary">
                No return requests found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {statusFilter === "all"
                  ? "There are no return requests at the moment"
                  : `No returns with status "${statusFilter}"`}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                  <TableRow>
                    <TableCell sx={{ color: "#fff", fontWeight: 800 }}>Order ID</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 800 }}>Customer</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 800 }}>Return Reason</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 800 }}>Order Total</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 800 }}>Requested</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 800 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReturns.map((order) => (
                    <TableRow key={order._id} sx={{ "&:hover": { background: "#f9f9f9" } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: "monospace" }}>
                          {order._id.substring(0, 10)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {order.user?.name || "Unknown"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.user?.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {order.returnReason?.substring(0, 50)}
                          {order.returnReason?.length > 50 && "..."}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={800} sx={{ color: "#667eea" }}>
                          {formatPrice(order.totalPrice)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.returnStatus.toUpperCase()}
                          color={getReturnStatusColor(order.returnStatus)}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(order.returnRequestedAt).toLocaleDateString("en-IN")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          ({calculateDaysSince(order.returnRequestedAt)} days ago)
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ViewIcon />}
                            onClick={() => {
                              setSelectedReturn(order);
                              setViewDialogOpen(true);
                            }}
                            sx={{ textTransform: "none", fontWeight: 700 }}
                          >
                            View
                          </Button>

                          {order.returnStatus === "requested" && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<ApproveIcon />}
                                onClick={() => {
                                  setSelectedReturn(order);
                                  setRefundAmount(order.totalPrice.toString());
                                  setApproveDialogOpen(true);
                                }}
                                sx={{ textTransform: "none", fontWeight: 700 }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                startIcon={<RejectIcon />}
                                onClick={() => {
                                  setSelectedReturn(order);
                                  setRejectDialogOpen(true);
                                }}
                                sx={{ textTransform: "none", fontWeight: 700 }}
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {order.returnStatus === "approved" && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<CompleteIcon />}
                              onClick={() => {
                                setSelectedReturn(order);
                                setCompleteDialogOpen(true);
                              }}
                              sx={{ textTransform: "none", fontWeight: 700 }}
                            >
                              Complete
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* View Details Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
            <ViewIcon sx={{ color: "#667eea" }} />
            Return Request Details
          </DialogTitle>
          <DialogContent>
            {selectedReturn && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ mb: 1 }}>
                      Order Information
                    </Typography>
                    <Box sx={{ background: "#f9f9f9", p: 2, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Order ID:</strong> {selectedReturn._id}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Order Total:</strong> {formatPrice(selectedReturn.totalPrice)}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Order Date:</strong>{" "}
                        {new Date(selectedReturn.createdAt).toLocaleDateString("en-IN")}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Delivered On:</strong>{" "}
                        {selectedReturn.deliveredAt
                          ? new Date(selectedReturn.deliveredAt).toLocaleDateString("en-IN")
                          : "N/A"}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ mb: 1 }}>
                      Customer Information
                    </Typography>
                    <Box sx={{ background: "#f9f9f9", p: 2, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Name:</strong> {selectedReturn.user?.name || "Unknown"}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Email:</strong> {selectedReturn.user?.email || "N/A"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Phone:</strong> {selectedReturn.shippingAddress?.phone || "N/A"}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ mb: 1 }}>
                      Return Information
                    </Typography>
                    <Box sx={{ background: "#f9f9f9", p: 2, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Return Status:</strong>{" "}
                        <Chip
                          label={selectedReturn.returnStatus?.toUpperCase()}
                          color={getReturnStatusColor(selectedReturn.returnStatus)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Requested On:</strong>{" "}
                        {new Date(selectedReturn.returnRequestedAt).toLocaleString("en-IN")}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                        Return Reason:
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {selectedReturn.returnReason}
                      </Typography>
                      
                      {selectedReturn.returnStatus === "rejected" && selectedReturn.returnRejectionReason && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="body2" fontWeight={700} sx={{ mb: 1, color: "#ef4444" }}>
                            Rejection Reason:
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {selectedReturn.returnRejectionReason}
                          </Typography>
                        </>
                      )}

                      {selectedReturn.returnStatus === "completed" && selectedReturn.refundAmount && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Refund Amount:</strong> {formatPrice(selectedReturn.refundAmount)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Refund Processed On:</strong>{" "}
                            {new Date(selectedReturn.refundProcessedAt).toLocaleString("en-IN")}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ mb: 1 }}>
                      Order Items
                    </Typography>
                    <Stack spacing={1}>
                      {selectedReturn.orderItems?.map((item, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            p: 2,
                            background: "#f9f9f9",
                            borderRadius: 1.5,
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {item.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Quantity: {item.qty || item.quantity}
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={800}>
                            {formatPrice((item.qty || item.quantity) * item.price)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setViewDialogOpen(false)} variant="contained">
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
            <ApproveIcon sx={{ color: "#10b981" }} />
            Approve Return Request
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                Approving this return will restore the product stock automatically.
              </Alert>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Order ID: <strong>{selectedReturn?._id?.substring(0, 12)}...</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Order Total: <strong>{formatPrice(selectedReturn?.totalPrice)}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Customer: <strong>{selectedReturn?.user?.name}</strong>
              </Typography>

              <TextField
                fullWidth
                label="Refund Amount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                required
                helperText="Enter the amount to be refunded to the customer"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": { borderColor: "#667eea" },
                    "&.Mui-focused fieldset": { borderColor: "#667eea" },
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setApproveDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              disabled={processing || !refundAmount}
              sx={{ fontWeight: 700 }}
            >
              {processing ? <CircularProgress size={20} /> : "Approve Return"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
            <RejectIcon sx={{ color: "#ef4444" }} />
            Reject Return Request
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                Rejecting this return will close the request. The customer will be notified.
              </Alert>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Order ID: <strong>{selectedReturn?._id?.substring(0, 12)}...</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Customer: <strong>{selectedReturn?.user?.name}</strong>
              </Typography>

              <TextField
                fullWidth
                label="Rejection Reason"
                multiline
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this return request is being rejected..."
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover fieldset": { borderColor: "#667eea" },
                    "&.Mui-focused fieldset": { borderColor: "#667eea" },
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setRejectDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              variant="contained"
              color="error"
              startIcon={<RejectIcon />}
              disabled={processing || !rejectionReason.trim()}
              sx={{ fontWeight: 700 }}
            >
              {processing ? <CircularProgress size={20} /> : "Reject Return"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Complete Dialog */}
        <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
            <CompleteIcon sx={{ color: "#667eea" }} />
            Complete Return Process
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                Marking this return as completed indicates that the refund has been processed.
              </Alert>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Order ID: <strong>{selectedReturn?._id?.substring(0, 12)}...</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Customer: <strong>{selectedReturn?.user?.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Refund Amount: <strong>{formatPrice(selectedReturn?.refundAmount || 0)}</strong>
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCompleteDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              variant="contained"
              color="primary"
              startIcon={<CompleteIcon />}
              disabled={processing}
              sx={{
                fontWeight: 700,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              {processing ? <CircularProgress size={20} /> : "Mark as Completed"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminLayout>
  );
};

export default AdminReturns;
