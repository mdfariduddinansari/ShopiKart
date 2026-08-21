import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  LinearProgress,
  Badge
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Add,
  Remove,
  Edit,
  History,
  Refresh,
  LocalShipping,
  AttachMoney
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

export default function AdminInventory() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [reorderList, setReorderList] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inventoryStatus, setInventoryStatus] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  
  // Dialog states
  const [restockDialog, setRestockDialog] = useState(false);
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  
  // Form states
  const [restockQuantity, setRestockQuantity] = useState('');
  const [restockReason, setRestockReason] = useState('');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const [statsRes, reorderRes, lowStockRes] = await Promise.all([
        api.get('/products/inventory/stats'),
        api.get('/products/inventory/reorder-list'),
        api.get('/products/inventory/low-stock-alerts')
      ]);

      setStats(statsRes.data);
      setReorderList(reorderRes.data);
      setLowStockAlerts(lowStockRes.data);
      setMessage({ type: '', text: '' });
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to load inventory data' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProductInventory = async (productId) => {
    try {
      const [statusRes, historyRes] = await Promise.all([
        api.get(`/products/${productId}/inventory/status`),
        api.get(`/products/${productId}/inventory/history?limit=20`)
      ]);

      setInventoryStatus(statusRes.data);
      setStockHistory(historyRes.data);
    } catch (error) {
      console.error('Error fetching product inventory:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to load product details' });
    }
  };

  const handleRestock = async () => {
    if (!restockQuantity || restockQuantity <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid quantity' });
      return;
    }

    setSubmitLoading(true);
    try {
      await api.post(
        `/products/${selectedProduct._id || selectedProduct.id}/inventory/restock`,
        { quantity: parseInt(restockQuantity), reason: restockReason }
      );

      setMessage({ type: 'success', text: 'Stock restocked successfully!' });
      setRestockDialog(false);
      setRestockQuantity('');
      setRestockReason('');
      fetchInventoryData();
      if (inventoryStatus) fetchProductInventory(selectedProduct._id || selectedProduct.id);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to restock' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAdjust = async () => {
    if (!adjustQuantity || adjustQuantity === '0') {
      setMessage({ type: 'error', text: 'Please enter a non-zero quantity' });
      return;
    }

    setSubmitLoading(true);
    try {
      await api.post(
        `/products/${selectedProduct._id || selectedProduct.id}/inventory/adjust`,
        { quantity: parseInt(adjustQuantity), note: adjustNote }
      );

      setMessage({ type: 'success', text: 'Stock adjusted successfully!' });
      setAdjustDialog(false);
      setAdjustQuantity('');
      setAdjustNote('');
      fetchInventoryData();
      if (inventoryStatus) fetchProductInventory(selectedProduct._id || selectedProduct.id);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to adjust stock' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_stock': return 'success';
      case 'low_stock': return 'warning';
      case 'out_of_stock': return 'error';
      case 'reorder_needed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_stock': return <CheckCircle />;
      case 'low_stock': return <Warning />;
      case 'out_of_stock': return <Error />;
      case 'reorder_needed': return <TrendingDown />;
      default: return <InventoryIcon />;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ mb: 1 }}>
              📦 Inventory Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor stock levels, manage SKUs, and track inventory movements
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchInventoryData}
            sx={{ fontWeight: 700 }}
          >
            Refresh Data
          </Button>
        </Box>

        {message.text && (
          <Alert 
            severity={message.type} 
            onClose={() => setMessage({ type: '', text: '' })}
            sx={{ mb: 3 }}
          >
            {message.text}
          </Alert>
        )}

        {/* Statistics Cards */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h3" fontWeight={900}>
                        {stats.totalProducts || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Products
                      </Typography>
                    </Box>
                    <InventoryIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h3" fontWeight={900}>
                        {(stats.totalStock || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Units
                      </Typography>
                    </Box>
                    <LocalShipping sx={{ fontSize: 48, opacity: 0.8 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h3" fontWeight={900}>
                        ₹{(stats.totalValue || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Inventory Value
                      </Typography>
                    </Box>
                    <AttachMoney sx={{ fontSize: 48, opacity: 0.8 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h3" fontWeight={900}>
                        {((stats.stockStatus?.reorderNeeded || 0) + (stats.stockStatus?.outOfStock || 0))}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Action Required
                      </Typography>
                    </Box>
                    <Warning sx={{ fontSize: 48, opacity: 0.8 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Stock Status Overview */}
        {stats && (
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
              Stock Status Distribution
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
                  <Typography variant="h4" fontWeight={900}>
                    {stats?.stockStatus?.inStock || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">In Stock</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats?.percentages?.inStock || 0}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Warning sx={{ fontSize: 48, color: '#f59e0b', mb: 1 }} />
                  <Typography variant="h4" fontWeight={900}>
                    {stats?.stockStatus?.lowStock || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Low Stock</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats?.percentages?.lowStock || 0}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <TrendingDown sx={{ fontSize: 48, color: '#ef4444', mb: 1 }} />
                  <Typography variant="h4" fontWeight={900}>
                    {stats?.stockStatus?.reorderNeeded || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Reorder Needed</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats?.percentages?.reorderNeeded || 0}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Error sx={{ fontSize: 48, color: '#dc2626', mb: 1 }} />
                  <Typography variant="h4" fontWeight={900}>
                    {stats?.stockStatus?.outOfStock || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Out of Stock</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats?.percentages?.outOfStock || 0}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab 
              label={
                <Badge badgeContent={reorderList.length} color="error">
                  Reorder List
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={lowStockAlerts.length} color="warning">
                  Low Stock Alerts
                </Badge>
              } 
            />
          </Tabs>
        </Box>

        {/* Reorder List Tab */}
        {activeTab === 0 && (
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: '#ef4444', color: 'white' }}>
              <Typography variant="h6" fontWeight={800}>
                🚨 Products Needing Reorder ({reorderList.length})
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Stock has reached reorder point - immediate action required
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 800 }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Brand</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Current Stock</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Reorder Point</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Suggested Order</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Last Restocked</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reorderList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                        <CheckCircle sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No products need reordering
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reorderList.map((product) => (
                      <TableRow key={product.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', color: '#667eea' }}>
                            {product.sku}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Generated: {product.sku ? new Date(parseInt(product.sku.split('-')[2]) || Date.now()).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {product.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{product.brand}</TableCell>
                        <TableCell>
                          <Chip label={product.category} size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#10b981' }}>
                            ₹{product.price || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={product.currentStock} 
                            color="error" 
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell>{product.reorderPoint}</TableCell>
                        <TableCell>
                          <Chip 
                            label={`${product.suggestedOrderQuantity} units`}
                            color="success"
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {product.lastRestocked 
                              ? new Date(product.lastRestocked).toLocaleDateString()
                              : 'Never'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Add />}
                            onClick={() => {
                              setSelectedProduct(product);
                              setRestockQuantity(product.suggestedOrderQuantity.toString());
                              setRestockDialog(true);
                            }}
                            sx={{ fontWeight: 700 }}
                          >
                            Restock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Low Stock Alerts Tab */}
        {activeTab === 1 && (
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: '#f59e0b', color: 'white' }}>
              <Typography variant="h6" fontWeight={800}>
                ⚠️ Low Stock Warnings ({lowStockAlerts.length})
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Products below low stock threshold - monitor closely
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 800 }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Brand</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Current Stock</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Low Stock Threshold</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Stock Level</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStockAlerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <CheckCircle sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          All products have healthy stock levels
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    lowStockAlerts.map((product) => {
                      const stockPercent = (product.currentStock / product.lowStockThreshold) * 100;
                      return (
                        <TableRow key={product.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', color: '#f59e0b' }}>
                              {product.sku}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Generated: {product.sku ? new Date(parseInt(product.sku.split('-')[2]) || Date.now()).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {product.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{product.brand}</TableCell>
                          <TableCell>
                            <Chip label={product.category} size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700} sx={{ color: '#10b981' }}>
                              ₹{product.price || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={product.currentStock} 
                              color="warning" 
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell>{product.lowStockThreshold}</TableCell>
                          <TableCell>
                            <Box sx={{ width: 100 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={Math.min(stockPercent, 100)} 
                                color={stockPercent < 50 ? 'error' : 'warning'}
                                sx={{ height: 8, borderRadius: 1 }}
                              />
                              <Typography variant="caption">
                                {stockPercent.toFixed(0)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="Restock">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setRestockDialog(true);
                                  }}
                                >
                                  <Add />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="View History">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    fetchProductInventory(product.id);
                                    setHistoryDialog(true);
                                  }}
                                >
                                  <History />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Restock Dialog */}
        <Dialog open={restockDialog} onClose={() => setRestockDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>
            📦 Restock Product
          </DialogTitle>
          <DialogContent>
            {selectedProduct && (
              <Box sx={{ pt: 2 }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedProduct.name}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                    <strong>SKU:</strong> {selectedProduct.sku}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    <strong>Current Stock:</strong> {selectedProduct.currentStock} | <strong>Reorder Point:</strong> {selectedProduct.reorderPoint} | <strong>Low Stock Threshold:</strong> {selectedProduct.lowStockThreshold}
                  </Typography>
                  {selectedProduct.price && (
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      <strong>Unit Price:</strong> ₹{selectedProduct.price}
                    </Typography>
                  )}
                </Alert>
                <TextField
                  label="Quantity to Add"
                  type="number"
                  fullWidth
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  sx={{ mb: 2 }}
                  inputProps={{ min: 1 }}
                />
                <TextField
                  label="Reason (optional)"
                  fullWidth
                  multiline
                  rows={3}
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                  placeholder="e.g., Received from supplier"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRestockDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleRestock}
              disabled={submitLoading}
              startIcon={submitLoading ? <CircularProgress size={20} /> : <Add />}
            >
              Restock
            </Button>
          </DialogActions>
        </Dialog>

        {/* Adjust Stock Dialog */}
        <Dialog open={adjustDialog} onClose={() => setAdjustDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>
            ✏️ Adjust Stock
          </DialogTitle>
          <DialogContent>
            {selectedProduct && (
              <Box sx={{ pt: 2 }}>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedProduct.name}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                    <strong>SKU:</strong> {selectedProduct.sku}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    <strong>Current Stock:</strong> {selectedProduct.currentStock} units
                  </Typography>
                  {selectedProduct.price && (
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      <strong>Unit Price:</strong> ₹{selectedProduct.price}
                    </Typography>
                  )}
                </Alert>
                <TextField
                  label="Adjustment Quantity"
                  type="number"
                  fullWidth
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  sx={{ mb: 2 }}
                  helperText="Use negative numbers to reduce stock, positive to increase"
                />
                <TextField
                  label="Note"
                  fullWidth
                  multiline
                  rows={3}
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="e.g., Damaged units removed"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdjustDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleAdjust}
              disabled={submitLoading}
              startIcon={submitLoading ? <CircularProgress size={20} /> : <Edit />}
            >
              Adjust
            </Button>
          </DialogActions>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={historyDialog} onClose={() => setHistoryDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>
            📊 Stock Movement History
          </DialogTitle>
          <DialogContent>
            {inventoryStatus && (
              <Box sx={{ pt: 2 }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {inventoryStatus.name}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                    <strong>SKU:</strong> {inventoryStatus.sku}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    <strong>Current Stock:</strong> {inventoryStatus.currentStock} | <strong>Stock Status:</strong> {inventoryStatus.stockStatus || 'N/A'}
                  </Typography>
                  {inventoryStatus.price && (
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      <strong>Unit Price:</strong> ₹{inventoryStatus.price} | <strong>Total Value:</strong> ₹{(inventoryStatus.currentStock * inventoryStatus.price).toLocaleString()}
                    </Typography>
                  )}
                </Alert>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f9fafb' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Quantity</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>From</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>To</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Note</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stockHistory.map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Typography variant="caption">
                              {new Date(entry.date).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={entry.type} 
                              size="small"
                              color={
                                entry.type === 'restock' || entry.type === 'return' ? 'success' :
                                entry.type === 'sale' ? 'primary' :
                                'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              fontWeight={700}
                              color={entry.type === 'sale' || entry.type === 'damaged' || entry.type === 'expired' ? 'error' : 'success'}
                            >
                              {entry.type === 'sale' || entry.type === 'damaged' || entry.type === 'expired' ? '-' : '+'}{entry.quantity}
                            </Typography>
                          </TableCell>
                          <TableCell>{entry.previousStock}</TableCell>
                          <TableCell>{entry.newStock}</TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {entry.note || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHistoryDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminLayout>
  );
}
