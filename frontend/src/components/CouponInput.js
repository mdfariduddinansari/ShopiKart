import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  LocalOffer,
  Check,
  Close,
  ExpandMore,
  ExpandLess,
  ContentCopy,
  Redeem,
  Timer,
  Percent,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import api from '../services/api';

const CouponInput = ({ 
  orderTotal = 0, 
  cartItems = [], 
  onCouponApplied, 
  onCouponRemoved,
  appliedCoupon = null,
}) => {
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth || {});
  
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAvailable, setShowAvailable] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserCoupons();
    } else {
      fetchPublicCoupons();
    }
  }, [user]);

  const fetchUserCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const response = await api.get('/coupons/my-coupons');
      if (response.data.success) {
        const all = [
          ...(response.data.data.personalized || []),
          ...(response.data.data.available || []),
        ];
        setAvailableCoupons(all.slice(0, 6));
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const fetchPublicCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const response = await api.get('/coupons/available');
      if (response.data.success) {
        setAvailableCoupons(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleApplyCoupon = async (code = couponCode) => {
    if (!code.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/coupons/validate', {
        code: code.trim(),
        orderTotal,
        cartItems: cartItems.map(item => ({
          productId: item._id || item.productId,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
        })),
      });

      if (response.data.success) {
        const couponData = response.data.data;
        setSuccess(`🎉 ${couponData.name} applied! You save ₹${couponData.discount}`);
        setCouponCode('');
        
        if (onCouponApplied) {
          onCouponApplied(couponData);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setSuccess('');
    setCouponCode('');
    if (onCouponRemoved) {
      onCouponRemoved();
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCouponCode(code);
  };

  const formatDiscount = (coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}% OFF`;
    } else if (coupon.discountType === 'fixed') {
      return `₹${coupon.discountValue} OFF`;
    } else if (coupon.discountType === 'freeShipping') {
      return 'FREE SHIPPING';
    }
    return `${coupon.discountValue} OFF`;
  };

  const getDaysLeft = (endDate) => {
    const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Expired';
    if (days === 1) return '1 day left';
    if (days <= 7) return `${days} days left`;
    return `Valid till ${new Date(endDate).toLocaleDateString()}`;
  };

  return (
    <Box sx={{ mb: 2 }}>
      {/* Applied Coupon Display */}
      {appliedCoupon && (
        <Alert
          severity="success"
          icon={<Check />}
          action={
            <IconButton size="small" onClick={handleRemoveCoupon}>
              <Close fontSize="small" />
            </IconButton>
          }
          sx={{ mb: 2, borderRadius: 2 }}
        >
          <Typography variant="body2" fontWeight={600}>
            {appliedCoupon.name} ({appliedCoupon.code})
          </Typography>
          <Typography variant="caption">
            You're saving ₹{appliedCoupon.discount}
          </Typography>
        </Alert>
      )}

      {/* Coupon Input */}
      {!appliedCoupon && (
        <>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              background: alpha(theme.palette.primary.main, 0.02),
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <LocalOffer sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={700}>
                Apply Coupon
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                disabled={loading}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                  },
                }}
                InputProps={{
                  style: { textTransform: 'uppercase' }
                }}
              />
              <Button
                variant="contained"
                onClick={() => handleApplyCoupon()}
                disabled={loading || !couponCode.trim()}
                sx={{
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 80,
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Apply'}
              </Button>
            </Stack>

            {error && (
              <Alert severity="error" sx={{ mt: 1.5, py: 0 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mt: 1.5, py: 0 }}>
                {success}
              </Alert>
            )}
          </Paper>

          {/* Available Coupons Toggle */}
          {availableCoupons.length > 0 && (
            <Button
              fullWidth
              onClick={() => setShowAvailable(!showAvailable)}
              endIcon={showAvailable ? <ExpandLess /> : <ExpandMore />}
              sx={{
                mt: 1,
                textTransform: 'none',
                color: 'text.secondary',
                justifyContent: 'space-between',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Redeem fontSize="small" />
                <Typography variant="body2">
                  {availableCoupons.length} coupon{availableCoupons.length > 1 ? 's' : ''} available
                </Typography>
              </Stack>
            </Button>
          )}

          {/* Available Coupons List */}
          <Collapse in={showAvailable}>
            <Box sx={{ mt: 1 }}>
              {loadingCoupons ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Stack spacing={1}>
                  {availableCoupons.map((coupon) => (
                    <Paper
                      key={coupon._id || coupon.code}
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: `1px dashed ${alpha(theme.palette.success.main, 0.5)}`,
                        background: alpha(theme.palette.success.main, 0.03),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip
                            label={formatDiscount(coupon)}
                            size="small"
                            color="success"
                            icon={coupon.discountType === 'percentage' ? <Percent sx={{ fontSize: 14 }} /> : null}
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                          {coupon.personalizedReason && (
                            <Chip
                              label={coupon.personalizedReason}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 20 }}
                            />
                          )}
                        </Stack>
                        <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                          {coupon.name}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.3 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ 
                            fontFamily: 'monospace', 
                            bgcolor: alpha(theme.palette.grey[500], 0.1),
                            px: 0.8,
                            py: 0.2,
                            borderRadius: 0.5,
                          }}>
                            {coupon.code}
                          </Typography>
                          <IconButton size="small" onClick={() => copyCode(coupon.code)}>
                            <ContentCopy sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Stack>
                        {coupon.minimumOrderAmount > 0 && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Min. order: ₹{coupon.minimumOrderAmount}
                          </Typography>
                        )}
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.3 }}>
                          <Timer sx={{ fontSize: 12, color: 'warning.main' }} />
                          <Typography variant="caption" color="warning.main">
                            {getDaysLeft(coupon.endDate)}
                          </Typography>
                        </Stack>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleApplyCoupon(coupon.code)}
                        disabled={loading || (coupon.minimumOrderAmount && orderTotal < coupon.minimumOrderAmount)}
                        sx={{
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontWeight: 600,
                          ml: 1,
                        }}
                      >
                        Apply
                      </Button>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </Collapse>
        </>
      )}
    </Box>
  );
};

export default CouponInput;
