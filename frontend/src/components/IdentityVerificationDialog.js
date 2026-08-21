import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  VerifiedUser as VerifiedIcon,
  ContactPhone as PhoneIcon,
  AccountBalance as DocumentIcon,
} from '@mui/icons-material';
import api from '../services/api';

const IdentityVerificationDialog = ({ open, onClose, bookingId, onVerificationComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [verificationData, setVerificationData] = useState({
    documentType: '',
    documentNumber: '',
    documentImages: [],
    selfieImage: null,
    alternateContact: {
      name: '',
      phone: '',
      relation: '',
    },
  });

  const [verificationStatus, setVerificationStatus] = useState(null);

  const steps = ['Upload Documents', 'Alternate Contact', 'Review & Submit'];

  const documentTypes = [
    { value: 'aadhar', label: 'Aadhar Card' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'driving_license', label: 'Driving License' },
    { value: 'voter_id', label: 'Voter ID' },
  ];

  useEffect(() => {
    if (open && bookingId) {
      fetchVerificationStatus();
    }
  }, [open, bookingId]);

  const fetchVerificationStatus = async () => {
    try {
      const { data } = await api.get(`/rental-security/${bookingId}/verification/status`);
      setVerificationStatus(data);
    } catch (err) {
      console.error('Error fetching verification status:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setVerificationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAlternateContactChange = (field, value) => {
    setVerificationData(prev => ({
      ...prev,
      alternateContact: {
        ...prev.alternateContact,
        [field]: value
      }
    }));
  };

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    
    if (type === 'documents') {
      if (files.length > 3) {
        setError('Maximum 3 document images allowed');
        return;
      }
      setVerificationData(prev => ({
        ...prev,
        documentImages: files
      }));
    } else if (type === 'selfie') {
      setVerificationData(prev => ({
        ...prev,
        selfieImage: files[0]
      }));
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!verificationData.documentType || !verificationData.documentNumber) {
        setError('Please select document type and enter document number');
        return;
      }
      if (verificationData.documentImages.length === 0) {
        setError('Please upload at least one document image');
        return;
      }
      if (!verificationData.selfieImage) {
        setError('Please upload a selfie for verification');
        return;
      }
    }

    if (activeStep === 1) {
      if (!verificationData.alternateContact.name || !verificationData.alternateContact.phone) {
        setError('Please provide alternate contact details');
        return;
      }
    }

    setError(null);
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('documentType', verificationData.documentType);
      formData.append('documentNumber', verificationData.documentNumber);
      formData.append('alternateContact', JSON.stringify(verificationData.alternateContact));

      verificationData.documentImages.forEach((file, index) => {
        formData.append('documentImages', file);
      });

      if (verificationData.selfieImage) {
        formData.append('selfieImage', verificationData.selfieImage);
      }

      const { data } = await api.post(
        `/rental-security/${bookingId}/identity/submit`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setSuccess('Identity verification submitted successfully! Admin will review within 24 hours.');
      
      if (onVerificationComplete) {
        onVerificationComplete(data.booking);
      }

      setTimeout(() => {
        onClose();
        setActiveStep(0);
        setSuccess(null);
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit verification');
      console.error('Verification submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <DocumentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Upload Identity Documents
            </Typography>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Document Type</InputLabel>
              <Select
                value={verificationData.documentType}
                onChange={(e) => handleInputChange('documentType', e.target.value)}
                label="Document Type"
              >
                {documentTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              margin="normal"
              label="Document Number"
              value={verificationData.documentNumber}
              onChange={(e) => handleInputChange('documentNumber', e.target.value)}
              placeholder="Enter your document number"
            />

            <Box mt={3}>
              <Typography variant="body2" gutterBottom>
                Upload Document Images (Front & Back) - Max 3 images
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ mt: 1 }}
              >
                Choose Document Images
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileChange(e, 'documents')}
                />
              </Button>
              {verificationData.documentImages.length > 0 && (
                <Typography variant="caption" color="success.main" display="block" mt={1}>
                  {verificationData.documentImages.length} file(s) selected
                </Typography>
              )}
            </Box>

            <Box mt={3}>
              <Typography variant="body2" gutterBottom>
                Upload Selfie for Face Verification
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ mt: 1 }}
              >
                Choose Selfie Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'selfie')}
                />
              </Button>
              {verificationData.selfieImage && (
                <Typography variant="caption" color="success.main" display="block" mt={1}>
                  Selfie uploaded: {verificationData.selfieImage.name}
                </Typography>
              )}
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                • Ensure documents are clear and readable<br />
                • All corners of the document should be visible<br />
                • Selfie should clearly show your face<br />
                • Accepted formats: JPEG, PNG, PDF (max 5MB per file)
              </Typography>
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <PhoneIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Alternate Contact Information
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Provide an emergency contact person who can be reached in case we cannot contact you.
            </Typography>

            <TextField
              fullWidth
              margin="normal"
              label="Contact Name"
              value={verificationData.alternateContact.name}
              onChange={(e) => handleAlternateContactChange('name', e.target.value)}
              required
            />

            <TextField
              fullWidth
              margin="normal"
              label="Contact Phone"
              value={verificationData.alternateContact.phone}
              onChange={(e) => handleAlternateContactChange('phone', e.target.value)}
              required
              type="tel"
            />

            <TextField
              fullWidth
              margin="normal"
              label="Relation"
              value={verificationData.alternateContact.relation}
              onChange={(e) => handleAlternateContactChange('relation', e.target.value)}
              placeholder="e.g., Parent, Sibling, Friend"
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <VerifiedIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Review Your Information
            </Typography>

            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Document Type
                    </Typography>
                    <Typography variant="body1">
                      {documentTypes.find(t => t.value === verificationData.documentType)?.label}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Document Number
                    </Typography>
                    <Typography variant="body1">
                      {verificationData.documentNumber}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Documents Uploaded
                    </Typography>
                    <Typography variant="body1">
                      {verificationData.documentImages.length} image(s)
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Selfie Uploaded
                    </Typography>
                    <Chip 
                      label={verificationData.selfieImage ? "✓ Yes" : "✗ No"} 
                      color={verificationData.selfieImage ? "success" : "error"}
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Alternate Contact
                    </Typography>
                    <Typography variant="body1">
                      {verificationData.alternateContact.name} ({verificationData.alternateContact.relation})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {verificationData.alternateContact.phone}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Alert severity="warning" sx={{ mt: 2 }}>
              By submitting, you confirm that all information provided is accurate and authentic. 
              False information may result in booking cancellation.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Identity Verification Required
        {verificationStatus?.identityVerification?.status === 'verified' && (
          <Chip 
            label="Verified" 
            color="success" 
            size="small" 
            icon={<VerifiedIcon />}
            sx={{ ml: 2 }}
          />
        )}
      </DialogTitle>

      <DialogContent dividers>
        {verificationStatus?.identityVerification?.status === 'verified' ? (
          <Alert severity="success">
            <Typography variant="h6">Identity Already Verified</Typography>
            <Typography variant="body2">
              Your identity has been verified. You can proceed with the booking.
            </Typography>
          </Alert>
        ) : verificationStatus?.identityVerification?.status === 'pending' ? (
          <Alert severity="info">
            <Typography variant="h6">Verification Pending</Typography>
            <Typography variant="body2">
              Your documents are under review. We'll notify you once verified (usually within 24 hours).
            </Typography>
          </Alert>
        ) : verificationStatus?.identityVerification?.status === 'rejected' ? (
          <Alert severity="error">
            <Typography variant="h6">Verification Rejected</Typography>
            <Typography variant="body2">
              Reason: {verificationStatus.identityVerification.rejectionReason}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Please resubmit with corrected documents.
            </Typography>
          </Alert>
        ) : null}

        {verificationStatus?.identityVerification?.status !== 'verified' && 
         verificationStatus?.identityVerification?.status !== 'pending' && (
          <>
            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {renderStepContent()}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
        
        {verificationStatus?.identityVerification?.status !== 'verified' && 
         verificationStatus?.identityVerification?.status !== 'pending' && (
          <>
            {activeStep > 0 && (
              <Button onClick={handleBack} disabled={loading}>
                Back
              </Button>
            )}
            
            {activeStep < steps.length - 1 ? (
              <Button onClick={handleNext} variant="contained" disabled={loading}>
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <VerifiedIcon />}
              >
                {loading ? 'Submitting...' : 'Submit Verification'}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default IdentityVerificationDialog;
