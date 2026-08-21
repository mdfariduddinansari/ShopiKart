import AdminLayout from "../../components/AdminLayout";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../../utils/currency';
import api from '../../services/api';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Card,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    discountPrice: 0,
    category: 'Others',
    brand: '',
    stock: 0,
    images: [''],
    isFeatured: false,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products');
      setProducts(Array.isArray(data) ? data : data.products || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = filterCategory === 'all' 
    ? products 
    : products.filter(p => p.category === filterCategory);

  const handleOpen = (product = null) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        discountPrice: product.discountPrice || 0,
        category: product.category,
        brand: product.brand || '',
        stock: product.stock,
        images: product.images || [''],
        isFeatured: product.isFeatured || false,
      });
    } else {
      setSelectedProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        discountPrice: 0,
        category: 'Others',
        brand: '',
        stock: 0,
        images: [''],
        isFeatured: false,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.description || formData.price <= 0) {
        setError('Please fill in all required fields');
        return;
      }

      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        discountPrice: parseFloat(formData.discountPrice) || 0,
        stock: parseInt(formData.stock),
      };

      if (selectedProduct) {
        await api.put(`/products/${selectedProduct._id}`, submitData);
        setSuccess('Product updated successfully!');
      } else {
        await api.post('/products', submitData);
        setSuccess('Product created successfully!');
      }

      setTimeout(() => {
        handleClose();
        fetchProducts();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        setSuccess('Product deleted successfully!');
        fetchProducts();
        setTimeout(() => setSuccess(''), 2000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{
              fontWeight: 900,
              color: "#1f2937",
              display: "flex",
              alignItems: "center",
              gap: 1
            }}>
              🛍️ Products Management
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.5 }}>
              Add, edit, or delete products from your catalog
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
            }}
          >
            Add Product
          </Button>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            {success}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              p: 2.5,
              borderRadius: 2,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
            }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
                Total Products
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, mt: 1 }}>
                {products.length}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              p: 2.5,
              borderRadius: 2,
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)"
            }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
                In Stock
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, mt: 1 }}>
                {products.filter(p => p.stock > 0).length}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              p: 2.5,
              borderRadius: 2,
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)"
            }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
                Featured
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, mt: 1 }}>
                {products.filter(p => p.isFeatured).length}
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Filter */}
        <Paper sx={{ 
          mb: 3, 
          p: 2.5, 
          borderRadius: 2, 
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)" 
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#6b7280" }}>
              🔍 Filter by Category:
            </Typography>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
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
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="Electronics">Electronics</MenuItem>
              <MenuItem value="Fashion">Fashion</MenuItem>
              <MenuItem value="Home">Home</MenuItem>
              <MenuItem value="Others">Others</MenuItem>
            </Select>
          </Box>
        </Paper>

        {/* Products Table */}
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
                <TableCell>Product Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No products found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow
                    key={product._id}
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
                    <TableCell sx={{ fontWeight: 700, color: "#1f2937" }}>
                      {product.name}
                    </TableCell>
                    <TableCell sx={{ color: "#6b7280" }}>
                      {product.category}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "#667eea" }}>
                      {formatPrice(product.price)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {product.stock}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.75 }}>
                        <Chip
                          label={product.stock > 0 ? "✓ In Stock" : "✗ Out"}
                          color={product.stock > 0 ? "success" : "error"}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        {product.isFeatured && (
                          <Chip 
                            label="⭐ Featured" 
                            sx={{
                              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                              color: "#fff",
                              fontWeight: 600
                            }}
                            size="small" 
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpen(product)}
                          sx={{
                            "&:hover": {
                              backgroundColor: "rgba(102, 126, 234, 0.1)"
                            }
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(product._id)}
                          sx={{
                            "&:hover": {
                              backgroundColor: "rgba(239, 68, 68, 0.1)"
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add/Edit Product Dialog */}
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="sm"
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
            {selectedProduct ? "✏️ Edit Product" : "➕ Add Product"}
          </DialogTitle>
          <DialogContent sx={{ py: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <TextField
                fullWidth
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                multiline
                rows={3}
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                required
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label="Stock"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
              />
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  label="Category"
                >
                  <MenuItem value="Electronics">Electronics</MenuItem>
                  <MenuItem value="Fashion">Fashion</MenuItem>
                  <MenuItem value="Home">Home</MenuItem>
                  <MenuItem value="Others">Others</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{
            borderTop: "1px solid #e5e7eb",
            p: 2,
            bgcolor: "#f9fafb"
          }}>
            <Button 
              onClick={handleClose}
              sx={{ textTransform: "none", color: "#6b7280" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                textTransform: "none",
                fontWeight: 600
              }}
            >
              {selectedProduct ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default AdminProducts;
