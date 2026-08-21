import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Link,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { CardGiftcard, CheckCircle, Visibility, VisibilityOff, LockReset } from "@mui/icons-material";
import { login, register, clearError } from "../features/authSlice";
import api from "../services/api";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ 
    email: "", 
    password: "", 
    name: "", 
    referralCode: searchParams.get('ref') || "" 
  });
  const [referralInfo, setReferralInfo] = useState(null);
  const [referralValidating, setReferralValidating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuggestion, setEmailSuggestion] = useState("");
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  
  // Forgot password states
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: Enter email, 2: Enter OTP & new password
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Validate referral code from URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setIsLogin(false); // Switch to signup mode
      validateReferralCode(refCode);
    }
  }, [searchParams]);

  const validateReferralCode = async (code) => {
    if (!code) {
      setReferralInfo(null);
      return;
    }
    setReferralValidating(true);
    try {
      const response = await api.get(`/referrals/validate/${code}`);
      if (response.data.success) {
        setReferralInfo(response.data.data);
      } else {
        setReferralInfo(null);
      }
    } catch (err) {
      setReferralInfo(null);
    } finally {
      setReferralValidating(false);
    }
  };

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      console.error('Login/Register Error:', error);
      const timer = setTimeout(() => {
        // Error will remain visible until user changes mode or submits again
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.email || !formData.password) {
      return; // Form validation will handle this via HTML required attribute
    }
    
    // Validate email comprehensively
    const isEmailValid = await validateEmailComprehensive(formData.email);
    if (!isEmailValid || emailSuggestion) {
      return;
    }
    
    if (!isLogin && !formData.name) {
      return; // Form validation will handle this via HTML required attribute
    }
    
    console.log(`Attempting ${isLogin ? 'login' : 'registration'}...`);
    
    if (isLogin) {
      dispatch(login({ email: formData.email, password: formData.password }));
    } else {
      dispatch(register({ 
        name: formData.name, 
        email: formData.email, 
        password: formData.password,
        referralCode: formData.referralCode || undefined 
      }));
    }
  };

  // Email validation function
  const validateEmail = (email) => {
    // More comprehensive email regex
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Check for common email domain typos
  const checkEmailDomainTypos = (email) => {
    const commonDomains = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gmil.com': 'gmail.com',
      'gmaill.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
      'hotmil.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
      'outloo.com': 'outlook.com',
      'outlok.com': 'outlook.com',
    };

    const domain = email.split('@')[1];
    if (domain && commonDomains[domain.toLowerCase()]) {
      return email.replace(domain, commonDomains[domain.toLowerCase()]);
    }
    return null;
  };

  // Check for disposable email domains
  const isDisposableEmail = (email) => {
    const disposableDomains = [
      'tempmail.com', 'throwaway.email', '10minutemail.com', 
      'guerrillamail.com', 'mailinator.com', 'trashmail.com',
      'fakeinbox.com', 'yopmail.com', 'temp-mail.org'
    ];
    
    const domain = email.split('@')[1];
    return domain && disposableDomains.includes(domain.toLowerCase());
  };

  // Comprehensive email validation
  const validateEmailComprehensive = async (email) => {
    if (!email) return;

    // Basic format check
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      setEmailSuggestion("");
      return false;
    }

    // Check for domain typos
    const suggestion = checkEmailDomainTypos(email);
    if (suggestion) {
      setEmailSuggestion(`Did you mean ${suggestion}?`);
      setEmailError("");
      return false;
    } else {
      setEmailSuggestion("");
    }

    // Check for disposable emails
    if (isDisposableEmail(email)) {
      setEmailError("Please use a permanent email address");
      return false;
    }

    // Validate domain exists (basic check)
    const domain = email.split('@')[1];
    if (domain) {
      // Check if domain has valid TLD
      const validTLDs = ['com', 'net', 'org', 'edu', 'gov', 'mil', 'co', 'in', 'uk', 'us', 'ca', 'de', 'fr', 'au', 'jp', 'cn', 'ru', 'br', 'it', 'es', 'nl', 'se', 'no', 'fi', 'dk', 'io', 'ai', 'app', 'dev'];
      const tld = domain.split('.').pop().toLowerCase();
      
      if (!validTLDs.includes(tld)) {
        setEmailError("Please enter a valid email domain");
        return false;
      }
    }

    setEmailError("");
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Validate email when user types it
    if (name === 'email') {
      // Debounce validation for better UX
      if (value) {
        validateEmailComprehensive(value);
      } else {
        setEmailError("");
        setEmailSuggestion("");
      }
    }
    
    // Validate referral code when user types it
    if (name === 'referralCode' && value.length >= 4) {
      validateReferralCode(value);
    } else if (name === 'referralCode' && value.length < 4) {
      setReferralInfo(null);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleAcceptEmailSuggestion = () => {
    if (emailSuggestion) {
      const suggested = emailSuggestion.replace('Did you mean ', '').replace('?', '');
      setFormData({ ...formData, email: suggested });
      setEmailSuggestion("");
      validateEmailComprehensive(suggested);
    }
  };

  // Forgot password handlers
  const handleForgotPasswordOpen = () => {
    setForgotPasswordOpen(true);
    setForgotPasswordStep(1);
    setResetEmail("");
    setResetOtp("");
    setNewPassword("");
    setResetError("");
    setResetSuccess("");
  };

  const handleForgotPasswordClose = () => {
    setForgotPasswordOpen(false);
    setForgotPasswordStep(1);
    setResetEmail("");
    setResetOtp("");
    setNewPassword("");
    setResetError("");
    setResetSuccess("");
  };

  const handleRequestReset = async () => {
    setResetError("");
    setResetSuccess("");
    
    if (!resetEmail || !validateEmail(resetEmail)) {
      setResetError("Please enter a valid email address");
      return;
    }

    setResetLoading(true);
    try {
      const response = await api.post('/users/request-password-reset', { email: resetEmail });
      if (response.data.success) {
        setResetSuccess(response.data.message);
        setForgotPasswordStep(2);
      } else {
        setResetError(response.data.message || 'Failed to send reset code');
      }
    } catch (error) {
      setResetError(error.response?.data?.message || 'Failed to send reset code');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetError("");
    setResetSuccess("");

    if (!resetOtp) {
      setResetError("Please enter the OTP");
      return;
    }

    if (!newPassword) {
      setResetError("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters long");
      return;
    }

    setResetLoading(true);
    try {
      const response = await api.post('/users/reset-password', {
        email: resetEmail,
        otp: resetOtp,
        newPassword: newPassword
      });
      if (response.data.success) {
        setResetSuccess(response.data.message);
        setTimeout(() => {
          handleForgotPasswordClose();
        }, 2000);
      } else {
        setResetError(response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      setResetError(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    dispatch(clearError());
    setEmailError("");
    setEmailSuggestion("");
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper
        elevation={4}
        sx={{
          p: 4,
          mt: 6,
          borderRadius: 3,
          backgroundColor: "#ffffff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          align="center"
          gutterBottom
          sx={{ color: "primary.main", fontWeight: "bold" }}
        >
          {isLogin ? "Sign In to ShopiKart" : "Create Your Account"}
        </Typography>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              backgroundColor: '#ffebee',
              color: '#c62828',
              border: '1px solid #ef5350',
              fontWeight: 500,
              fontSize: '0.95rem'
            }}
            onClose={() => dispatch(clearError())}
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <TextField
              margin="normal"
              required
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
            />
          )}
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            error={!!emailError}
            helperText={
              emailError || (
                emailSuggestion && (
                  <span>
                    {emailSuggestion}{' '}
                    <Link
                      component="button"
                      type="button"
                      variant="body2"
                      onClick={handleAcceptEmailSuggestion}
                      sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Use this
                    </Link>
                  </span>
                )
              )
            }
            color={emailSuggestion ? "warning" : "primary"}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {isLogin && (
            <Box textAlign="right" sx={{ mt: 1 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={handleForgotPasswordOpen}
                disabled={loading}
                sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Forgot Password?
              </Link>
            </Box>
          )}
          {!isLogin && (
            <>
              {referralInfo && (
                <Alert 
                  severity="success" 
                  icon={<CardGiftcard />}
                  sx={{ mb: 2, mt: 2 }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    🎉 {referralInfo.referrerName} invited you!
                  </Typography>
                  <Typography variant="body2">
                    {referralInfo.message}
                  </Typography>
                </Alert>
              )}
              <TextField
                margin="normal"
                fullWidth
                label="Referral Code (Optional)"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleChange}
                disabled={loading}
                helperText={referralInfo ? "✓ Valid referral code" : "Enter a referral code to get rewards"}
                InputProps={{
                  endAdornment: referralValidating ? (
                    <CircularProgress size={20} />
                  ) : referralInfo ? (
                    <CheckCircle color="success" />
                  ) : null
                }}
                color={referralInfo ? "success" : "primary"}
              />
            </>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="secondary"
            sx={{ mt: 3, mb: 2, borderRadius: 2, "&:hover": { backgroundColor: "#2fa383" } }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : isLogin ? "Sign In" : "Sign Up"}
          </Button>
          <Box textAlign="center">
            <Link component="button" variant="body2" onClick={toggleMode} disabled={loading}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </Link>
          </Box>
        </Box>
      </Paper>

      {/* Forgot Password Dialog */}
      <Dialog 
        open={forgotPasswordOpen} 
        onClose={handleForgotPasswordClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <LockReset />
            <Typography variant="h6">Reset Password</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {resetError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setResetError('')}>
              {resetError}
            </Alert>
          )}
          {resetSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {resetSuccess}
            </Alert>
          )}

          {forgotPasswordStep === 1 ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your email address and we'll send you an OTP to reset your password.
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Email Address"
                type="email"
                fullWidth
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                disabled={resetLoading}
                required
              />
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                We've sent an OTP to <strong>{resetEmail}</strong>. Enter it below along with your new password.
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="OTP Code"
                type="text"
                fullWidth
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value)}
                disabled={resetLoading}
                required
                inputProps={{ maxLength: 6 }}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="New Password"
                type={showNewPassword ? "text" : "password"}
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={resetLoading}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                        disabled={resetLoading}
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText="Password must be at least 6 characters long"
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleForgotPasswordClose} disabled={resetLoading}>
            Cancel
          </Button>
          {forgotPasswordStep === 1 ? (
            <Button 
              onClick={handleRequestReset} 
              variant="contained" 
              color="primary"
              disabled={resetLoading}
            >
              {resetLoading ? <CircularProgress size={24} /> : 'Send OTP'}
            </Button>
          ) : (
            <Button 
              onClick={handleResetPassword} 
              variant="contained" 
              color="primary"
              disabled={resetLoading}
            >
              {resetLoading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LoginPage;
