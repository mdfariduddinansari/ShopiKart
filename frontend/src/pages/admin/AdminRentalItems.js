import AdminLayout from "../../components/AdminLayout";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { formatPrice } from "../../utils/currency";
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
  Chip,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";

const AdminRentalItems = () => {
  const [rentalItems, setRentalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Others",
    pricePerDay: 0,
    securityDeposit: 0,
    availableStock: 1,
    images: [""],
    specifications: [],
    durationPackages: [],
    active: true,
    featured: false,
  });
  const [specificationForm, setSpecificationForm] = useState({ key: "", value: "" });
  const [durationPackageForm, setDurationPackageForm] = useState({
    duration: "",
    price: "",
  });

  useEffect(() => {
    fetchRentalItems();
  }, []);

  const location = useLocation();

  // If admin was redirected here with prefill params, open the create dialog
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prefillName = params.get("prefillName");
    const prefillDescription = params.get("prefillDescription");
    if (prefillName || prefillDescription) {
      setFormData((prev) => ({
        ...prev,
        name: prefillName || prev.name,
        description: prefillDescription || prev.description,
      }));
      setSelectedItem(null);
      setOpen(true);
    }
  }, [location.search]);

  const fetchRentalItems = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/rental-items");
      setRentalItems(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch rental items");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        ...item,
        images: item.images?.length > 0 ? item.images : [""],
        specifications: item.specifications || [],
        durationPackages: item.durationPackages || [],
      });
    } else {
      setSelectedItem(null);
      setFormData({
        name: "",
        description: "",
        category: "Others",
        pricePerDay: 0,
        securityDeposit: 0,
        availableStock: 1,
        images: [""],
        specifications: [],
        durationPackages: [],
        active: true,
        featured: false,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedItem(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const handleAddImage = () => {
    setFormData({
      ...formData,
      images: [...formData.images, ""],
    });
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleAddSpecification = () => {
    if (specificationForm.key && specificationForm.value) {
      setFormData({
        ...formData,
        specifications: [...formData.specifications, { ...specificationForm }],
      });
      setSpecificationForm({ key: "", value: "" });
    }
  };

  const handleRemoveSpecification = (index) => {
    setFormData({
      ...formData,
      specifications: formData.specifications.filter((_, i) => i !== index),
    });
  };

  const handleAddDurationPackage = () => {
    if (durationPackageForm.duration && durationPackageForm.price) {
      setFormData({
        ...formData,
        durationPackages: [
          ...formData.durationPackages,
          {
            duration: parseInt(durationPackageForm.duration),
            price: parseFloat(durationPackageForm.price),
          },
        ],
      });
      setDurationPackageForm({ duration: "", price: "" });
    }
  };

  const handleRemoveDurationPackage = (index) => {
    setFormData({
      ...formData,
      durationPackages: formData.durationPackages.filter((_, i) => i !== index),
    });
  };

  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.description || formData.pricePerDay <= 0) {
        setError("Please fill in all required fields");
        return;
      }

      const submitData = {
        ...formData,
        pricePerDay: parseFloat(formData.pricePerDay),
        securityDeposit: parseFloat(formData.securityDeposit),
        availableStock: parseInt(formData.availableStock),
      };

      if (selectedItem) {
        await api.put(`/admin/rental-items/${selectedItem._id}`, submitData);
        setSuccess("Rental item updated successfully!");
        handleClose();
        await fetchRentalItems();
        setTimeout(() => setSuccess(""), 3000);
        return;
      }

      // create new rental item
      const { data } = await api.post("/admin/rental-items", submitData);
      setSuccess("Rental item created successfully!");

      // check if caller passed a productId to auto-link
      const params = new URLSearchParams(location.search);
      const productId = params.get("productId");
      if (productId) {
        try {
          await api.put(`/admin/products/${productId}`, { rentalItemId: data._id, canBeRented: true });
        } catch (linkErr) {
          console.error("Failed to link rental item to product:", linkErr);
        }
        // go back to products list (optionally we could add query flags)
        navigate('/admin/products');
      } else {
        // No product to auto-link: return to products page with linkedRentalId so add-product flow can pick it up
        const retParams = new URLSearchParams();
        retParams.set('linkedRentalId', data._id);
        if (formData.name) retParams.set('prefillName', formData.name);
        if (formData.description) retParams.set('prefillDescription', formData.description);
        navigate(`/admin/products?${retParams.toString()}`);
      }

      handleClose();
      await fetchRentalItems();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save rental item");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this rental item?")) {
      try {
        await api.delete(`/admin/rental-items/${id}`);
        setSuccess("Rental item deleted successfully!");
        await fetchRentalItems();
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete rental item");
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <Box sx={{ mb: 4, p: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" sx={{
            fontWeight: 900,
            color: "#1f2937",
            display: "flex",
            alignItems: "center",
            gap: 1
          }}>
            🎁 Rental Items Management
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.5 }}>
            Add, edit, or delete rental items from your platform
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
          Add New Item
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
      <Grid container spacing={2} sx={{ mb: 4, px: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            p: 2.5,
            borderRadius: 2,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
          }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
              Total Items
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, mt: 1 }}>
              {rentalItems.length}
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
              Active Items
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, mt: 1 }}>
              {rentalItems.filter(item => item.active).length}
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
              {rentalItems.filter(item => item.featured).length}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ 
        overflow: "hidden",
        borderRadius: 2,
        boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
        mx: 3
      }}>
        <TableContainer>
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
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">
                  Price/Day
                </TableCell>
                <TableCell align="right">
                  Deposit
                </TableCell>
                <TableCell align="right">
                  Stock
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rentalItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No rental items found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rentalItems.map((item) => (
                  <TableRow 
                    key={item._id} 
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
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#6b7280" }}>
                          {item.seller?.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: "#6b7280" }}>{item.category}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "#667eea" }}>
                      {formatPrice(item.pricePerDay)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "#667eea" }}>
                      {formatPrice(item.securityDeposit)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {item.availableStock}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.75 }}>
                        <Chip
                          label={item.active ? "✓ Active" : "✗ Inactive"}
                          color={item.active ? "success" : "default"}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        {item.featured && (
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
                          onClick={() => handleOpen(item)}
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
                          onClick={() => handleDelete(item._id)}
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
      </Paper>

      {/* Edit/Create Dialog */}
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
          {selectedItem ? "✏️ Edit Rental Item" : "➕ Add Rental Item"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Item Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            margin="normal"
            multiline
            rows={3}
            required
          />

          <TextField
            fullWidth
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            margin="normal"
            select
            SelectProps={{
              native: true,
            }}
          >
            <option value="Electronics">Electronics</option>
            <option value="Tools">Tools</option>
            <option value="Sports">Sports</option>
            <option value="Furniture">Furniture</option>
            <option value="Vehicles">Vehicles</option>
            <option value="Cameras">Cameras</option>
            <option value="Others">Others</option>
          </TextField>

          <TextField
            fullWidth
            label="Price Per Day"
            name="pricePerDay"
            type="number"
            value={formData.pricePerDay}
            onChange={handleInputChange}
            margin="normal"
            required
            inputProps={{ step: "0.01", min: "0" }}
          />

          <TextField
            fullWidth
            label="Security Deposit (per item)"
            name="securityDeposit"
            type="number"
            value={formData.securityDeposit}
            onChange={handleInputChange}
            margin="normal"
            required
            inputProps={{ step: "0.01", min: "0" }}
            helperText="Refundable security deposit charged per rental item"
          />

          <TextField
            fullWidth
            label="Available Stock"
            name="availableStock"
            type="number"
            value={formData.availableStock}
            onChange={handleInputChange}
            margin="normal"
            required
            inputProps={{ min: "0" }}
          />

          <Box sx={{ mt: 2, mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                />
              }
              label="Active"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                />
              }
              label="Featured"
            />
          </Box>

          {/* Images */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Images
            </Typography>
            {formData.images.map((image, index) => (
              <Box key={index} sx={{ mb: 1, display: "flex", gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Image URL"
                  value={image}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                />
                <Button
                  color="error"
                  onClick={() => handleRemoveImage(index)}
                >
                  Remove
                </Button>
              </Box>
            ))}
            <Button size="small" onClick={handleAddImage}>
              Add Image
            </Button>
          </Box>

          {/* Specifications */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Specifications
            </Typography>
            {formData.specifications.map((spec, index) => (
              <Box key={index} sx={{ mb: 1, display: "flex", gap: 1, alignItems: "center" }}>
                <Typography sx={{ flex: 1 }}>
                  {spec.key}: {spec.value}
                </Typography>
                <Button
                  color="error"
                  size="small"
                  onClick={() => handleRemoveSpecification(index)}
                >
                  Remove
                </Button>
              </Box>
            ))}
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <TextField
                size="small"
                placeholder="Key"
                value={specificationForm.key}
                onChange={(e) =>
                  setSpecificationForm({ ...specificationForm, key: e.target.value })
                }
              />
              <TextField
                size="small"
                placeholder="Value"
                value={specificationForm.value}
                onChange={(e) =>
                  setSpecificationForm({ ...specificationForm, value: e.target.value })
                }
              />
              <Button size="small" onClick={handleAddSpecification}>
                Add
              </Button>
            </Box>
          </Box>

          {/* Duration Packages */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Duration Packages
            </Typography>
            {formData.durationPackages.map((pkg, index) => (
              <Box key={index} sx={{ mb: 1, display: "flex", gap: 1, alignItems: "center" }}>
                <Typography sx={{ flex: 1 }}>
                  {pkg.duration} days - {formatPrice(pkg.price)}
                </Typography>
                <Button
                  color="error"
                  size="small"
                  onClick={() => handleRemoveDurationPackage(index)}
                >
                  Remove
                </Button>
              </Box>
            ))}
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <TextField
                size="small"
                type="number"
                placeholder="Duration (days)"
                value={durationPackageForm.duration}
                onChange={(e) =>
                  setDurationPackageForm({ ...durationPackageForm, duration: e.target.value })
                }
              />
              <TextField
                size="small"
                type="number"
                placeholder="Price"
                value={durationPackageForm.price}
                onChange={(e) =>
                  setDurationPackageForm({ ...durationPackageForm, price: e.target.value })
                }
              />
              <Button size="small" onClick={handleAddDurationPackage}>
                Add
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="secondary">
            {selectedItem ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminRentalItems;
