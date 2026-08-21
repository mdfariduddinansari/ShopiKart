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
  Grid,
  Card,
  CardMedia,
  TextField,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  ZoomIn as ZoomIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const AdminIdentityVerifications = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/rental-security/admin/pending-verifications');
      setVerifications(data.bookings);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load verifications');
      console.error('Error fetching verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setOpenDialog(true);
    setRejectionReason('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBooking(null);
    setRejectionReason('');
  };

  const handleVerify = async (bookingId, approved) => {
    if (!approved && !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      const { data } = await api.post(`/rental-security/${bookingId}/identity/verify`, {
        approved,
        rejectionReason: approved ? null : rejectionReason,
      });

      alert(data.message);
      handleCloseDialog();
      fetchPendingVerifications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process verification');
      console.error('Verification error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleViewImage = (imageUrl) => {
    setSelectedImage(imageUrl);
    setOpenImageDialog(true);
  };

  const getDocumentTypeLabel = (type) => {
    const types = {
      aadhar: 'Aadhar Card',
      pan: 'PAN Card',
      passport: 'Passport',
      driving_license: 'Driving License',
      voter_id: 'Voter ID',
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <AdminLayout>
        <Container sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading verifications...
          </Typography>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Identity Verifications
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {verifications.length === 0 ? (
        <Alert severity="info">
          No pending identity verifications at this time.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Booking ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Rental Item</TableCell>
                <TableCell>Document Type</TableCell>
                <TableCell>Document Number</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {verifications.map((booking) => (
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
                    {getDocumentTypeLabel(booking.identityVerification?.documentType)}
                  </TableCell>
                  <TableCell>{booking.identityVerification?.documentNumber}</TableCell>
                  <TableCell>
                    <Chip
                      label={booking.identityVerification?.status}
                      color="warning"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewDetails(booking)}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Verification Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Identity Verification Details</DialogTitle>
        <DialogContent dividers>
          {selectedBooking && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <Box p={2}>
                    <Typography variant="h6" gutterBottom>
                      Customer Information
                    </Typography>
                    <Typography variant="body2">
                      <strong>Name:</strong> {selectedBooking.user?.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedBooking.user?.email}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Phone:</strong> {selectedBooking.user?.phone || 'Not provided'}
                    </Typography>
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <Box p={2}>
                    <Typography variant="h6" gutterBottom>
                      Document Information
                    </Typography>
                    <Typography variant="body2">
                      <strong>Type:</strong>{' '}
                      {getDocumentTypeLabel(selectedBooking.identityVerification?.documentType)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Number:</strong> {selectedBooking.identityVerification?.documentNumber}
                    </Typography>
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Document Images
                </Typography>
                <Grid container spacing={2}>
                  {selectedBooking.identityVerification?.documentImages?.map((img, index) => (
                    <Grid item xs={6} sm={4} key={index}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="150"
                          image={`http://localhost:5000${img}`}
                          alt={`Document ${index + 1}`}
                          sx={{ cursor: 'pointer', objectFit: 'contain' }}
                          onClick={() => handleViewImage(`http://localhost:5000${img}`)}
                        />
                        <Box p={1} textAlign="center">
                          <Tooltip title="View Full Size">
                            <IconButton
                              size="small"
                              onClick={() => handleViewImage(`http://localhost:5000${img}`)}
                            >
                              <ZoomIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {selectedBooking.identityVerification?.selfieImage && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Selfie Verification
                  </Typography>
                  <Card sx={{ maxWidth: 300 }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={`http://localhost:5000${selectedBooking.identityVerification.selfieImage}`}
                      alt="Selfie"
                      sx={{ cursor: 'pointer', objectFit: 'contain' }}
                      onClick={() =>
                        handleViewImage(
                          `http://localhost:5000${selectedBooking.identityVerification.selfieImage}`
                        )
                      }
                    />
                  </Card>
                </Grid>
              )}

              <Grid item xs={12}>
                <Card variant="outlined">
                  <Box p={2}>
                    <Typography variant="h6" gutterBottom>
                      Alternate Contact
                    </Typography>
                    <Typography variant="body2">
                      <strong>Name:</strong>{' '}
                      {selectedBooking.contactVerification?.alternateContact?.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Phone:</strong>{' '}
                      {selectedBooking.contactVerification?.alternateContact?.phone || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Relation:</strong>{' '}
                      {selectedBooking.contactVerification?.alternateContact?.relation || 'N/A'}
                    </Typography>
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Rejection Reason (if rejecting)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide reason if documents are invalid or unclear"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<RejectIcon />}
            onClick={() => handleVerify(selectedBooking?._id, false)}
            disabled={processing || !rejectionReason.trim()}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<ApproveIcon />}
            onClick={() => handleVerify(selectedBooking?._id, true)}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Approve & Verify'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Zoom Dialog */}
      <Dialog
        open={openImageDialog}
        onClose={() => setOpenImageDialog(false)}
        maxWidth="lg"
      >
        <DialogContent>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Document"
              style={{ width: '100%', height: 'auto' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImageDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
    </AdminLayout>
  );
};

export default AdminIdentityVerifications;
