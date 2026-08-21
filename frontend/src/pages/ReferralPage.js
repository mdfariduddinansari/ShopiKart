import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Stack,
  Divider,
  LinearProgress,
  Avatar,
  useTheme,
  alpha,
  Tooltip,
  InputAdornment,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Share,
  ContentCopy,
  PersonAdd,
  EmojiEvents,
  TrendingUp,
  CardGiftcard,
  WhatsApp,
  Email,
  Facebook,
  Twitter,
  Send,
  CheckCircle,
  Schedule,
  Cancel,
  LocalOffer,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const tierColors = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
};

const tierIcons = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
};

const ReferralPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth || {});

  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/referrals');
      return;
    }
    fetchReferralData();
  }, [isAuthenticated, navigate]);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      const [referralRes, rewardsRes, leaderboardRes] = await Promise.all([
        api.get('/referrals/my-referral'),
        api.get('/referrals/rewards'),
        api.get('/referrals/leaderboard'),
      ]);

      if (referralRes.data.success) {
        setReferralData(referralRes.data.data);
      }
      if (rewardsRes.data.success) {
        setRewards(rewardsRes.data.data.coupons || []);
      }
      if (leaderboardRes.data.success) {
        setLeaderboard(leaderboardRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      showSnackbar('Error loading referral data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSnackbar('Copied to clipboard!');
  };

  const shareVia = (platform) => {
    const referralLink = `${window.location.origin}/login?ref=${referralData?.code}`;
    const message = `Join ShopiKart using my referral code ${referralData?.code} and get ${referralData?.refereeReward?.value}% off on your first order! 🛒`;

    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(message + '\n' + referralLink)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(message)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralLink)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent('Join ShopiKart!')}&body=${encodeURIComponent(message + '\n\n' + referralLink)}`;
        break;
      default:
        break;
    }
    if (url) window.open(url, '_blank');
  };

  const handleSendInvites = async () => {
    const emails = inviteEmails.split(',').map(e => e.trim()).filter(e => e);
    if (emails.length === 0) {
      showSnackbar('Please enter email addresses', 'warning');
      return;
    }

    setInviteLoading(true);
    try {
      const response = await api.post('/referrals/invite', { emails });
      if (response.data.success) {
        showSnackbar(`Invitations sent to ${emails.length} email(s)`);
        setInviteEmails('');
        fetchReferralData();
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Error sending invitations', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'first_purchase':
        return <CheckCircle sx={{ color: 'success.main', fontSize: 18 }} />;
      case 'signed_up':
        return <Schedule sx={{ color: 'warning.main', fontSize: 18 }} />;
      case 'invited':
        return <Send sx={{ color: 'info.main', fontSize: 18 }} />;
      case 'expired':
        return <Cancel sx={{ color: 'error.main', fontSize: 18 }} />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
      case 'first_purchase':
        return 'Completed';
      case 'signed_up':
        return 'Signed Up';
      case 'invited':
        return 'Invited';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <Box sx={{ 
        minHeight: '100vh', 
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        pt: 4,
        pb: 8,
      }}>
        <Container maxWidth="lg">
          {/* Hero Section */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 3,
              borderRadius: 4,
              background: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h4" fontWeight={900} gutterBottom>
                  🎁 Refer & Earn
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Invite friends to ShopiKart and earn rewards! Your friend gets{' '}
                  <strong>{referralData?.refereeReward?.value}% off</strong> on their first order, 
                  and you earn <strong>₹{referralData?.referrerReward?.value}</strong> for each successful referral.
                </Typography>

                {/* Referral Code */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: alpha(theme.palette.primary.main, 0.08),
                    border: `2px dashed ${theme.palette.primary.main}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Your Referral Code
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h5" fontWeight={800} fontFamily="monospace" color="primary">
                      {referralData?.code}
                    </Typography>
                    <IconButton onClick={() => copyToClipboard(referralData?.code)} size="small">
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>

                {/* Share Buttons */}
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Tooltip title="Share on WhatsApp">
                    <IconButton 
                      onClick={() => shareVia('whatsapp')}
                      sx={{ bgcolor: '#25D366', color: 'white', '&:hover': { bgcolor: '#128C7E' } }}
                    >
                      <WhatsApp />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Share on Facebook">
                    <IconButton 
                      onClick={() => shareVia('facebook')}
                      sx={{ bgcolor: '#1877F2', color: 'white', '&:hover': { bgcolor: '#0d6efd' } }}
                    >
                      <Facebook />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Share on Twitter">
                    <IconButton 
                      onClick={() => shareVia('twitter')}
                      sx={{ bgcolor: '#1DA1F2', color: 'white', '&:hover': { bgcolor: '#0c8de4' } }}
                    >
                      <Twitter />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Share via Email">
                    <IconButton 
                      onClick={() => shareVia('email')}
                      sx={{ bgcolor: 'grey.700', color: 'white', '&:hover': { bgcolor: 'grey.800' } }}
                    >
                      <Email />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopy />}
                    onClick={() => copyToClipboard(`${window.location.origin}/login?ref=${referralData?.code}`)}
                    sx={{ ml: 1 }}
                  >
                    Copy Link
                  </Button>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                {/* Stats Cards */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 2 }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <PersonAdd sx={{ fontSize: 32, color: 'success.main' }} />
                        <Typography variant="h4" fontWeight={800} color="success.main">
                          {referralData?.successfulReferrals || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Successful Referrals
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2 }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <CardGiftcard sx={{ fontSize: 32, color: 'warning.main' }} />
                        <Typography variant="h4" fontWeight={800} color="warning.main">
                          ₹{referralData?.totalEarnings || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Earnings
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 2 }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Schedule sx={{ fontSize: 32, color: 'info.main' }} />
                        <Typography variant="h4" fontWeight={800} color="info.main">
                          {referralData?.pendingReferrals || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Pending
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card elevation={0} sx={{ bgcolor: alpha(tierColors[referralData?.tier] || tierColors.bronze, 0.2), borderRadius: 2 }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4">
                          {tierIcons[referralData?.tier] || tierIcons.bronze}
                        </Typography>
                        <Typography variant="h6" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                          {referralData?.tier || 'Bronze'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Your Tier
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Tier Progress */}
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Progress to next tier
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {Math.round(referralData?.tierProgress || 0)}%
                    </Typography>
                  </Stack>
                  <LinearProgress 
                    variant="determinate" 
                    value={referralData?.tierProgress || 0} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha(tierColors[referralData?.tier] || tierColors.bronze, 0.2),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: tierColors[referralData?.tier] || tierColors.bronze,
                      }
                    }} 
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Invite by Email Section */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              background: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(255,255,255,0.95)',
            }}
          >
            <Typography variant="h6" fontWeight={700} gutterBottom>
              📧 Invite Friends by Email
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter email addresses separated by commas"
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="contained"
                      onClick={handleSendInvites}
                      disabled={inviteLoading}
                      startIcon={inviteLoading ? <CircularProgress size={16} /> : <Send />}
                    >
                      Send
                    </Button>
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Paper>

          <Grid container spacing={3}>
            {/* Recent Referrals */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(255,255,255,0.95)',
                  height: '100%',
                }}
              >
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  📋 Recent Referrals
                </Typography>
                {referralData?.recentReferrals?.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Email</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Earned</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {referralData.recentReferrals.map((ref, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Typography variant="body2">{ref.email}</Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                {getStatusIcon(ref.status)}
                                <Typography variant="caption">{getStatusLabel(ref.status)}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600} color="success.main">
                                {ref.rewardEarned > 0 ? `₹${ref.rewardEarned}` : '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <PersonAdd sx={{ fontSize: 48, color: 'text.disabled' }} />
                    <Typography color="text.secondary">No referrals yet</Typography>
                    <Typography variant="caption" color="text.disabled">
                      Start sharing your code to earn rewards!
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Leaderboard */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(255,255,255,0.95)',
                  height: '100%',
                }}
              >
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  🏆 Leaderboard
                </Typography>
                {leaderboard?.leaderboard?.length > 0 ? (
                  <Stack spacing={1}>
                    {leaderboard.leaderboard.map((entry, i) => (
                      <Paper
                        key={i}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: i < 3 ? alpha(tierColors.gold, 0.1) : 'background.default',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Typography 
                          variant="h6" 
                          fontWeight={800} 
                          sx={{ 
                            width: 32,
                            color: i === 0 ? tierColors.gold : i === 1 ? tierColors.silver : i === 2 ? tierColors.bronze : 'text.secondary'
                          }}
                        >
                          #{entry.rank}
                        </Typography>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', mr: 1.5 }}>
                          {entry.name[0]}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {entry.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tierIcons[entry.tier]} {entry.tier}
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight={700} color="primary">
                          {entry.referrals}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <EmojiEvents sx={{ fontSize: 48, color: 'text.disabled' }} />
                    <Typography color="text.secondary">No leaderboard data yet</Typography>
                  </Box>
                )}

                {leaderboard?.userRank && (
                  <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                    You're ranked #{leaderboard.userRank} with {leaderboard.userReferrals} referrals!
                  </Alert>
                )}
              </Paper>
            </Grid>

            {/* Reward Coupons */}
            {rewards.length > 0 && (
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(255,255,255,0.95)',
                  }}
                >
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    🎫 Your Referral Rewards
                  </Typography>
                  <Grid container spacing={2}>
                    {rewards.map((coupon) => (
                      <Grid item xs={12} sm={6} md={4} key={coupon._id}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: `2px dashed ${theme.palette.success.main}`,
                            background: alpha(theme.palette.success.main, 0.05),
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <LocalOffer color="success" />
                            <Typography variant="subtitle2" fontWeight={700}>
                              {coupon.name}
                            </Typography>
                          </Stack>
                          <Typography variant="h5" fontWeight={900} color="success.main" sx={{ my: 1 }}>
                            {coupon.discountType === 'percentage' 
                              ? `${coupon.discountValue}% OFF`
                              : `₹${coupon.discountValue} OFF`}
                          </Typography>
                          <Typography variant="caption" fontFamily="monospace" sx={{ 
                            bgcolor: 'grey.200', 
                            px: 1, 
                            py: 0.3, 
                            borderRadius: 1 
                          }}>
                            {coupon.code}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                            Min. order: ₹{coupon.minimumOrderAmount}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            )}

            {/* How It Works */}
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(255,255,255,0.95)',
                }}
              >
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  ❓ How It Works
                </Typography>
                <Grid container spacing={3}>
                  {[
                    { icon: <Share />, title: 'Share Your Code', desc: 'Share your unique referral code with friends' },
                    { icon: <PersonAdd />, title: 'Friend Signs Up', desc: 'They register using your code' },
                    { icon: <CardGiftcard />, title: 'Both Get Rewards', desc: 'They get discount, you earn cash!' },
                    { icon: <TrendingUp />, title: 'Level Up', desc: 'More referrals = higher tier = better rewards' },
                  ].map((step, i) => (
                    <Grid item xs={6} md={3} key={i}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Avatar sx={{ 
                          width: 56, 
                          height: 56, 
                          bgcolor: 'primary.main', 
                          mx: 'auto', 
                          mb: 1 
                        }}>
                          {step.icon}
                        </Avatar>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {step.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {step.desc}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ReferralPage;
