import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  AccountBalance as DepositIcon,
  MoneyOff as DeductIcon,
  CheckCircle as RefundIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const AdminDepositManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deductionAmount, setDeductionAmount] = useState(0);
  const [deductionReason, setDeductionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('held');

  useEffect(() => {
    fetchBookings();
  }, [filterStatus]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/bookings');
      
      // Filter bookings based on deposit status
      const filteredBookings = data.filter(b => 
        filterStatus === 'all' ? true : b.depositStatus === filterStatus
      );
      
      setBookings(filteredBookings);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (booking) => {
    setSelectedBooking(booking);
    setDeductionAmount(0);
    setDeductionReason('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBooking(null);
    setDeductionAmount(0);
    setDeductionReason('');
  };

  const handleProcessRefund = async () => {
    if (!selectedBooking) return;

    if (deductionAmount > selectedBooking.securityDeposit) {
      alert('Deduction amount cannot exceed security deposit');
      return;
    }

    if (deductionAmount > 0 && !deductionReason.trim()) {
      alert('Please provide a reason for deduction');
      return;
    }

    try {
      setProcessing(true);
      const { data } = await api.post(
        `/rental-security/${selectedBooking._id}/deposit/refund`,
        {
          deductionAmount: parseFloat(deductionAmount),
          deductionReason: deductionReason.trim() || null,
        }
      );

      alert(data.message);
      handleCloseDialog();
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process deposit refund');
      console.error('Deposit refund error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const getDepositStatusColor = (status) => {
    const colors = {
      pending: 'default',
      held: 'warning',
      refunded: 'success',
      forfeited: 'error',
    };
    return colors[status] || 'default';
  };

  const getBookingStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      active: 'primary',
      completed: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <AdminLayout>
        <Container sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading deposit data...
          </Typography>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          <DepositIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Security Deposit Management
        </Typography>
        
        <Box>
          <Button
            variant={filterStatus === 'all' ? 'contained' : 'outlined'}
            onClick={() => setFilterStatus('all')}
            sx={{ mr: 1 }}
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'held' ? 'contained' : 'outlined'}
            onClick={() => setFilterStatus('held')}
            sx={{ mr: 1 }}
          >
            Held
          </Button>
          <Button
            variant={filterStatus === 'refunded' ? 'contained' : 'outlined'}
            onClick={() => setFilterStatus('refunded')}
            sx={{ mr: 1 }}
          >
            Refunded
          </Button>
          <Button
            variant={filterStatus === 'forfeited' ? 'contained' : 'outlined'}
            onClick={() => setFilterStatus('forfeited')}
          >
            Forfeited
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {bookings.length === 0 ? (
        <Alert severity="info">
          No bookings found with deposit status: {filterStatus}
        </Alert>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    Total Held Deposits
                  </Typography>
                  <Typography variant="h4">
                    ₹{bookings
                      .filter(b => b.depositStatus === 'held')
                      .reduce((sum, b) => sum + b.securityDeposit, 0)
                      .toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    Total Refunded
                  </Typography>
                  <Typography variant="h4">
                    ₹{bookings
                      .filter(b => b.depositStatus === 'refunded')
                      .reduce((sum, b) => sum + (b.depositRefundAmount || 0), 0)
                      .toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="error.main">
                    Total Forfeited
                  </Typography>
                  <Typography variant="h4">
                    ₹{bookings
                      .filter(b => b.depositStatus === 'forfeited')
                      .reduce((sum, b) => sum + b.securityDeposit, 0)
                      .toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary.main">
                    Pending Actions
                  </Typography>
                  <Typography variant="h4">
                    {bookings.filter(b => 
                      b.status === 'completed' && b.depositStatus === 'held'
                    ).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Booking ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Rental Item</TableCell>
                  <TableCell>Booking Status</TableCell>
                  <TableCell>Deposit Amount</TableCell>
                  <TableCell>Deposit Status</TableCell>
                  <TableCell>Refunded Amount</TableCell>
                  <TableCell>Damage Report</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell>{booking._id.slice(-8)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{booking.user?.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {booking.user?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{booking.rentalItem?.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={booking.status}
                        color={getBookingStatusColor(booking.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>₹{booking.securityDeposit?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={booking.depositStatus}
                        color={getDepositStatusColor(booking.depositStatus)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {booking.depositRefundAmount 
                        ? `₹${booking.depositRefundAmount.toLocaleString()}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {booking.damageReport?.reported ? (
                        <Chip label="Reported" color="error" size="small" />
                      ) : (
                        <Chip label="No Damage" color="success" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {booking.depositStatus === 'held' && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<RefundIcon />}
                          onClick={() => handleOpenDialog(booking)}
                        >
                          Process Refund
                        </Button>
                      )}
                      {booking.depositStatus === 'refunded' && booking.depositRefundedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Refunded on {new Date(booking.depositRefundedAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Deposit Refund Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Process Security Deposit Refund</DialogTitle>
        <DialogContent dividers>
          {selectedBooking && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Customer:</strong> {selectedBooking.user?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Rental Item:</strong> {selectedBooking.rentalItem?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Total Deposit:</strong> ₹{selectedBooking.securityDeposit?.toLocaleString()}
                </Typography>
              </Alert>

              <TextField
                fullWidth
                type="number"
                label="Deduction Amount (if any)"
                value={deductionAmount}
                onChange={(e) => setDeductionAmount(e.target.value)}
                sx={{ mb: 2 }}
                helperText={`Refundable: ₹${(
                  selectedBooking.securityDeposit - deductionAmount
                ).toLocaleString()}`}
                inputProps={{ min: 0, max: selectedBooking.securityDeposit, step: 0.01 }}
              />

              {deductionAmount > 0 && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Deduction Reason (Required)"
                  value={deductionReason}
                  onChange={(e) => setDeductionReason(e.target.value)}
                  placeholder="Explain why deposit is being deducted (e.g., damage, late return)"
                  required
                />
              )}

              {deductionAmount === 0 && (
                <Alert severity="success">
                  Full deposit of ₹{selectedBooking.securityDeposit?.toLocaleString()} will be refunded.
                </Alert>
              )}

              {deductionAmount > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  ₹{deductionAmount} will be deducted. ₹
                  {(selectedBooking.securityDeposit - deductionAmount).toLocaleString()} will be
                  refunded.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleProcessRefund}
            disabled={processing || (deductionAmount > 0 && !deductionReason.trim())}
            startIcon={processing ? <CircularProgress size={20} /> : <RefundIcon />}
          >
            {processing ? 'Processing...' : 'Process Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </AdminLayout>
  );
};

export default AdminDepositManagement;
