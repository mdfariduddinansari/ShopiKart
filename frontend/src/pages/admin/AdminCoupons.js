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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  useTheme,
  alpha,
  Tooltip,
  Tabs,
  Tab,
  InputAdornment,
} from '@mui/material';
import AdminLayout from '../../components/AdminLayout';
import {
  Add,
  Edit,
  Delete,
  LocalOffer,
  TrendingUp,
  People,
  AttachMoney,
  Search,
  FilterList,
  ContentCopy,
  Refresh,
  Download,
  ToggleOn,
  ToggleOff,
} from '@mui/icons-material';
import api from '../../services/api';

const AdminCoupons = () => {
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 0, rowsPerPage: 10, total: 0 });
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscountAmount: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    minimumOrderAmount: 0,
    usageLimit: '',
    usageLimitPerUser: 1,
    isActive: true,
    firstPurchaseOnly: false,
    userType: 'all',
    applicableCategories: [],
    campaign: '',
    selectedUsers: [],
  });

  useEffect(() => {
    fetchCoupons();
    fetchStats();
    fetchUsers();
  }, [pagination.page, pagination.rowsPerPage, statusFilter, search]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page + 1,
        limit: pagination.rowsPerPage,
      });
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const response = await api.get(`/coupons/admin/all?${params}`);
      if (response.data.success) {
        setCoupons(response.data.data);
        setPagination(prev => ({ ...prev, total: response.data.pagination.total }));
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/coupons/admin/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await api.get('/admin/users');
      console.log('[AdminCoupons] Users API Response:', response.data);
      
      // Handle both response formats
      let usersData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      
      if (usersData.length > 0) {
        // Sort by purchase count (most items purchased first)
        const sortedUsers = usersData.sort((a, b) => 
          (b.totalPurchases || b.orderCount || 0) - (a.totalPurchases || a.orderCount || 0)
        );
        console.log('[AdminCoupons] Sorted Users:', sortedUsers);
        setUsers(sortedUsers);
      } else {
        console.warn('[AdminCoupons] No users found in response');
        setUsers([]);
      }
    } catch (error) {
      console.error('[AdminCoupons] Error fetching users:', error.message, error.response?.data);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleOpenDialog = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        ...coupon,
        startDate: new Date(coupon.startDate),
        endDate: new Date(coupon.endDate),
        applicableCategories: coupon.applicableCategories || [],
        selectedUsers: coupon.selectedUsers?.map(u => u._id || u) || [],
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscountAmount: '',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        minimumOrderAmount: 0,
        usageLimit: '',
        usageLimitPerUser: 1,
        isActive: true,
        firstPurchaseOnly: false,
        userType: 'all',
        applicableCategories: [],
        campaign: '',
        selectedUsers: [],
      });
    }
    setDialogOpen(true);
  };

  const handleSaveCoupon = async () => {
    setSaving(true);
    try {
      const data = {
        ...formData,
        usageLimit: formData.usageLimit || null,
        maxDiscountAmount: formData.maxDiscountAmount || null,
        selectedUsers: formData.userType === 'selected' ? formData.selectedUsers : [],
      };

      if (editingCoupon) {
        await api.put(`/coupons/admin/${editingCoupon._id}`, data);
      } else {
        await api.post('/coupons/admin/create', data);
      }
      
      setDialogOpen(false);
      fetchCoupons();
      fetchStats();
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert(error.response?.data?.message || 'Error saving coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      await api.delete(`/coupons/admin/${id}`);
      fetchCoupons();
      fetchStats();
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const handleToggleCoupon = async (id) => {
    try {
      await api.patch(`/coupons/admin/${id}/toggle`);
      fetchCoupons();
    } catch (error) {
      console.error('Error toggling coupon:', error);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'SHOP';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
  };

  const getStatusColor = (coupon) => {
    const now = new Date();
    if (!coupon.isActive) return 'default';
    if (new Date(coupon.endDate) < now) return 'error';
    if (new Date(coupon.startDate) > now) return 'warning';
    return 'success';
  };

  const getStatusLabel = (coupon) => {
    const now = new Date();
    if (!coupon.isActive) return 'Inactive';
    if (new Date(coupon.endDate) < now) return 'Expired';
    if (new Date(coupon.startDate) > now) return 'Scheduled';
    return 'Active';
  };

  // Helper to format date for input
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>
            🎫 Coupon Management
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => { fetchCoupons(); fetchStats(); }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Create Coupon
            </Button>
          </Stack>
        </Stack>

        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LocalOffer color="primary" />
                    <Typography variant="caption" color="text.secondary">Total Coupons</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={800}>{stats.totalCoupons}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TrendingUp color="success" />
                    <Typography variant="caption" color="text.secondary">Active</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={800} color="success.main">{stats.activeCoupons}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <People color="info" />
                    <Typography variant="caption" color="text.secondary">Total Usage</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={800} color="info.main">{stats.totalUsage}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card elevation={0} sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AttachMoney color="warning" />
                    <Typography variant="caption" color="text.secondary">Total Discount</Typography>
                  </Stack>
                  <Typography variant="h4" fontWeight={800} color="warning.main">₹{stats.totalDiscount}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Search coupons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ width: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* Coupons Table */}
        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Discount</TableCell>
                  <TableCell>Usage</TableCell>
                  <TableCell>Valid Period</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No coupons found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons.map((coupon) => (
                    <TableRow key={coupon._id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography fontFamily="monospace" fontWeight={600}>
                            {coupon.code}
                          </Typography>
                          <IconButton size="small" onClick={() => copyCode(coupon.code)}>
                            <ContentCopy sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{coupon.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {coupon.description?.substring(0, 50)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={coupon.discountType === 'percentage' 
                            ? `${coupon.discountValue}%` 
                            : `₹${coupon.discountValue}`}
                          color="primary"
                          size="small"
                        />
                        {coupon.maxDiscountAmount && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Max: ₹{coupon.maxDiscountAmount}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {coupon.usageCount} / {coupon.usageLimit || '∞'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" display="block">
                          {new Date(coupon.startDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          to {new Date(coupon.endDate).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(coupon)}
                          color={getStatusColor(coupon)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={coupon.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton size="small" onClick={() => handleToggleCoupon(coupon._id)}>
                            {coupon.isActive ? <ToggleOn color="success" /> : <ToggleOff />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenDialog(coupon)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDeleteCoupon(coupon._id)}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={pagination.total}
            page={pagination.page}
            onPageChange={(e, page) => setPagination(prev => ({ ...prev, page }))}
            rowsPerPage={pagination.rowsPerPage}
            onRowsPerPageChange={(e) => setPagination(prev => ({ ...prev, rowsPerPage: parseInt(e.target.value), page: 0 }))}
          />
        </Paper>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Coupon Code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  InputProps={{
                    endAdornment: (
                      <Button size="small" onClick={generateCode}>Generate</Button>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Discount Type</InputLabel>
                  <Select
                    value={formData.discountType}
                    label="Discount Type"
                    onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                  >
                    <MenuItem value="percentage">Percentage</MenuItem>
                    <MenuItem value="fixed">Fixed Amount</MenuItem>
                    <MenuItem value="freeShipping">Free Shipping</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Discount Value"
                  value={formData.discountValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) }))}
                  InputProps={{
                    startAdornment: formData.discountType === 'fixed' ? '₹' : null,
                    endAdornment: formData.discountType === 'percentage' ? '%' : null,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Discount (optional)"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxDiscountAmount: e.target.value }))}
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={formatDateForInput(formData.startDate)}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value ? new Date(e.target.value) : null }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={formatDateForInput(formData.endDate)}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value ? new Date(e.target.value) : null }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Minimum Order Amount"
                  value={formData.minimumOrderAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimumOrderAmount: parseFloat(e.target.value) }))}
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Usage Limit (optional)"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
                  placeholder="Unlimited"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Usage Per User"
                  value={formData.usageLimitPerUser}
                  onChange={(e) => setFormData(prev => ({ ...prev, usageLimitPerUser: parseInt(e.target.value) }))}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>User Type</InputLabel>
                  <Select
                    value={formData.userType}
                    label="User Type"
                    onChange={(e) => setFormData(prev => ({ ...prev, userType: e.target.value, selectedUsers: [] }))}
                  >
                    <MenuItem value="all">All Users</MenuItem>
                    <MenuItem value="new">New Users Only</MenuItem>
                    <MenuItem value="selected">Selected Users</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Selected Users Multi-Select - Only show when userType is 'selected' */}
              {formData.userType === 'selected' && (
                <Grid item xs={12}>
                  {usersLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <CircularProgress size={24} />
                      <Typography color="text.secondary">Loading customers...</Typography>
                    </Box>
                  ) : users.length === 0 ? (
                    <Alert severity="warning">
                      No customers found. Please ensure the API endpoint is working correctly.
                    </Alert>
                  ) : (
                    <FormControl fullWidth>
                      <InputLabel>Choose Users (Sorted by Purchase Count)</InputLabel>
                      <Select
                        multiple
                        value={formData.selectedUsers}
                        label="Choose Users (Sorted by Purchase Count)"
                        onChange={(e) => setFormData(prev => ({ ...prev, selectedUsers: e.target.value }))}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip 
                                key={value} 
                                label={users.find(u => u._id === value)?.email || value} 
                                size="small"
                              />
                            ))}
                          </Box>
                        )}
                      >
                        {users.map((user) => (
                          <MenuItem key={user._id} value={user._id}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                              <Typography variant="body2">{user.email}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                ({user.totalPurchases || user.orderCount || 0} purchases)
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Grid>
              )}
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Campaign Name"
                  value={formData.campaign}
                  onChange={(e) => setFormData(prev => ({ ...prev, campaign: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Stack>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                    }
                    label="Active"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.firstPurchaseOnly}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstPurchaseOnly: e.target.checked }))}
                      />
                    }
                    label="First Purchase Only"
                  />
                </Stack>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleSaveCoupon}
              disabled={saving || !formData.name || !formData.discountValue}
            >
              {saving ? <CircularProgress size={20} /> : (editingCoupon ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default AdminCoupons;
