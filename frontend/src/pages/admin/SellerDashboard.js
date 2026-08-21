import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import AdminLayout from "../../components/AdminLayout";
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
  CardContent,
  Divider,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Edit, Delete, Add, Close, Visibility } from "@mui/icons-material";
import api from "../../services/api";

const formatPrice = (price) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth || {});

  const [rentalItems, setRentalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Electronics",
    pricePerDay: 0,
    availableStock: 0,
    images: [""],
    durationPackages: [],
    specifications: {},
    active: true,
    featured: false,
  });

  const [durationPackageForm, setDurationPackageForm] = useState({
    minDays: "",
    maxDays: "",
    totalPrice: "",
  });

  const [showDurationForm, setShowDurationForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchSellerItems();
  }, [isAuthenticated, navigate]);

  const fetchSellerItems = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/rentals/seller/items");
      setRentalItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load rental items");
      console.error("Error fetching rental items:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        name: item.name || "",
        description: item.description || "",
        category: item.category || "Electronics",
        pricePerDay: item.pricePerDay || 0,
        availableStock: item.availableStock || 0,
        images: item.images?.length > 0 ? item.images : [""],
        durationPackages: item.durationPackages || [],
        specifications: item.specifications || {},
        active: item.active !== false,
        featured: item.featured || false,
      });
    } else {
      setSelectedItem(null);
      setFormData({
        name: "",
        description: "",
        category: "Electronics",
        pricePerDay: 0,
        availableStock: 0,
        images: [""],
        durationPackages: [],
        specifications: {},
        active: true,
        featured: false,
      });
    }
    setSubmitError("");
    setSubmitSuccess("");
    setShowDurationForm(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
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

  const handleAddDurationPackage = () => {
    if (
      durationPackageForm.minDays &&
      durationPackageForm.maxDays &&
      durationPackageForm.totalPrice
    ) {
      setFormData({
        ...formData,
        durationPackages: [
          ...formData.durationPackages,
          {
            id: Date.now(),
            minDays: parseInt(durationPackageForm.minDays),
            maxDays: parseInt(durationPackageForm.maxDays),
            totalPrice: parseFloat(durationPackageForm.totalPrice),
          },
        ],
      });
      setDurationPackageForm({ minDays: "", maxDays: "", totalPrice: "" });
      setShowDurationForm(false);
    }
  };

  const handleRemoveDurationPackage = (packageId) => {
    setFormData({
      ...formData,
      durationPackages: formData.durationPackages.filter(
        (p) => p.id !== packageId
      ),
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitError("");
      setSubmitSuccess("");

      if (
        !formData.name ||
        !formData.description ||
        formData.pricePerDay <= 0 ||
        formData.availableStock < 0
      ) {
        setSubmitError("Please fill in all required fields correctly");
        return;
      }

      const submitData = {
        ...formData,
        pricePerDay: parseFloat(formData.pricePerDay),
        availableStock: parseInt(formData.availableStock),
      };

      if (selectedItem) {
        const { data } = await api.put(`/rentals/${selectedItem._id}`, submitData);
        setSubmitSuccess("Rental item updated successfully!");
      } else {
        const { data } = await api.post("/rentals", submitData);
        setSubmitSuccess("Rental item created successfully!");
      }

      setTimeout(() => {
        handleCloseDialog();
        fetchSellerItems();
      }, 1000);
    } catch (err) {
      setSubmitError(err.response?.data?.message || "An error occurred");
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this rental item?")) {
      try {
        await api.delete(`/rentals/${itemId}`);
        setSubmitSuccess("Rental item deleted successfully!");
        fetchSellerItems();
        setTimeout(() => setSubmitSuccess(""), 3000);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete item");
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  const toggleActive = async (item) => {
    try {
      await api.put(`/rentals/${item._id}`, { active: !item.active });
      fetchSellerItems();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update item");
      setTimeout(() => setError(""), 3000);
    }
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography>Please log in to access the seller dashboard.</Typography>
      </Box>
    );
  }

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
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{
              fontWeight: 900,
              color: "#1f2937",
              display: "flex",
              alignItems: "center",
              gap: 1
            }}>
              💼 Seller Inventory Management
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.5 }}>
              Manage your rental products and inventory
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
            }}
          >
            Add Rental Item
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

        {submitSuccess && (
          <Alert 
            severity="success" 
            sx={{ mb: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            {submitSuccess}
          </Alert>
        )}

        {/* Stats Cards */}
        {rentalItems.length > 0 && (
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
                  Total Stock
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 1 }}>
                  {rentalItems.reduce((sum, item) => sum + (item.availableStock || 0), 0)}
                </Typography>
              </Card>
            </Grid>
          </Grid>
        )}

        {rentalItems.length === 0 ? (
          <Paper sx={{ 
            p: 4, 
            textAlign: "center",
            borderRadius: 2,
            boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
          }}>
            <Typography sx={{ color: "#6b7280", mb: 2 }}>
              📦 No rental items yet
            </Typography>
            <Button
              variant="contained"
              onClick={() => handleOpenDialog()}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                textTransform: "none",
                fontWeight: 600
              }}
            >
              Create Your First Rental Item
            </Button>
          </Paper>
        ) : (
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
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Price/Day</TableCell>
                  <TableCell align="center">Stock</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rentalItems.map((item) => (
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
                      {item.name}
                    </TableCell>
                    <TableCell sx={{ color: "#6b7280" }}>
                      {item.category}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "#667eea" }}>
                      {formatPrice(item.pricePerDay)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {item.availableStock}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={item.active ? "✓ Active" : "✗ Inactive"}
                        color={item.active ? "success" : "default"}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleOpenDialog(item)}
                          title="Edit"
                          sx={{
                            "&:hover": {
                              backgroundColor: "rgba(102, 126, 234, 0.1)"
                            }
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(item._id)}
                          title="Delete"
                          sx={{
                            "&:hover": {
                              backgroundColor: "rgba(239, 68, 68, 0.1)"
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                        <IconButton
                          color={item.active ? "success" : "warning"}
                          size="small"
                          onClick={() => toggleActive(item)}
                          title={item.active ? "Deactivate" : "Activate"}
                          sx={{
                            "&:hover": {
                              backgroundColor: item.active ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)"
                            }
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Rental Item Form Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="md" 
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
            {selectedItem ? "✏️ Edit Rental Item" : "➕ Create New Rental Item"}
          </DialogTitle>
          <DialogContent dividers sx={{ py: 3 }}>
            <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              {submitError && (
                <Alert severity="error" sx={{ borderRadius: 1.5 }}>
                  {submitError}
                </Alert>
              )}

              {/* Basic Info */}
              <TextField
                fullWidth
                label="Item Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />

              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      label="Category"
                    >
                      <MenuItem value="Electronics">Electronics</MenuItem>
                      <MenuItem value="Furniture">Furniture</MenuItem>
                      <MenuItem value="Sports">Sports Equipment</MenuItem>
                      <MenuItem value="Tools">Tools</MenuItem>
                      <MenuItem value="Photography">Photography</MenuItem>
                      <MenuItem value="Others">Others</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Active"
                    select
                    name="active"
                    value={formData.active}
                    onChange={(e) =>
                      setFormData({ ...formData, active: e.target.value === "true" })
                    }
                  >
                    <MenuItem value="true">Active</MenuItem>
                    <MenuItem value="false">Inactive</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Price Per Day"
                    name="pricePerDay"
                    type="number"
                    value={formData.pricePerDay}
                    onChange={handleInputChange}
                    inputProps={{ step: "0.01", min: "0" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Available Stock"
                    name="availableStock"
                    type="number"
                    value={formData.availableStock}
                    onChange={handleInputChange}
                    inputProps={{ min: "0" }}
                  />
                </Grid>
              </Grid>

              <FormControlLabel
                control={
                  <Switch
                    name="featured"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData({ ...formData, featured: e.target.checked })
                    }
                  />
                }
                label="Featured Item"
              />

              {/* Images */}
              <Divider sx={{ my: 1 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Product Images
                </Typography>
                {formData.images.map((image, index) => (
                  <Box key={index} sx={{ display: "flex", gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      placeholder="Image URL"
                      value={image}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      size="small"
                    />
                    {formData.images.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveImage(index)}
                        size="small"
                      >
                        <Close />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Button size="small" onClick={handleAddImage} sx={{ mt: 1 }}>
                  + Add Image
                </Button>
              </Box>

              {/* Duration Packages */}
              <Divider sx={{ my: 1 }} />
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    Duration Packages (Optional)
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setShowDurationForm(!showDurationForm)}
                  >
                    {showDurationForm ? "Cancel" : "+ Add Package"}
                  </Button>
                </Box>

                {showDurationForm && (
                  <Card sx={{ mb: 2, bgcolor: "#f9f9f9" }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Min Days"
                            type="number"
                            value={durationPackageForm.minDays}
                            onChange={(e) =>
                              setDurationPackageForm({
                                ...durationPackageForm,
                                minDays: e.target.value,
                              })
                            }
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Max Days"
                            type="number"
                            value={durationPackageForm.maxDays}
                            onChange={(e) =>
                              setDurationPackageForm({
                                ...durationPackageForm,
                                maxDays: e.target.value,
                              })
                            }
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Total Price"
                            type="number"
                            value={durationPackageForm.totalPrice}
                            onChange={(e) =>
                              setDurationPackageForm({
                                ...durationPackageForm,
                                totalPrice: e.target.value,
                              })
                            }
                            size="small"
                          />
                        </Grid>
                      </Grid>
                      <Button
                        fullWidth
                        variant="contained"
                        color="secondary"
                        onClick={handleAddDurationPackage}
                        sx={{ mt: 2 }}
                      >
                        Add Package
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {formData.durationPackages.length > 0 && (
                  <Box>
                    {formData.durationPackages.map((pkg) => (
                      <Box
                        key={pkg.id}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          p: 1,
                          bgcolor: "#f5f5f5",
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">
                          {pkg.minDays}-{pkg.maxDays} days: {formatPrice(pkg.totalPrice)}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveDurationPackage(pkg.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="secondary"
            >
              {selectedItem ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default SellerDashboard;
