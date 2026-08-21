// import AdminLayout from "../../components/AdminLayout";
// import React, { useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { formatPrice } from '../../utils/currency';
// import {
//   Box,
//   Button,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   IconButton,
//   Typography,
//   Alert,
//   CircularProgress,
//   Card,
//   CardContent,
//   Divider,
//   Grid,
//   Select,
//   MenuItem,
//   FormControl,
//   InputLabel,
//   FormControlLabel,
//   Checkbox,
// } from '@mui/material';
// import { Edit, Delete, Add, Close } from '@mui/icons-material';
// import {
//   fetchAdminProducts,
//   createProduct,
//   updateProduct,
//   deleteProduct,
// } from '../../features/adminSlice';

// const AdminProducts = () => {
//   const dispatch = useDispatch();
//   const adminState = useSelector((state) => state.admin) || {};
//   const { products = [], loading = false, error = null } = adminState;

//   const [open, setOpen] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [formData, setFormData] = useState({
//     name: '',
//     description: '',
//     price: 0,
//     discountPrice: 0,
//     discountExpires: '',
//     category: 'Others',
//     brand: '',
//     stock: 0,
//     images: [''],
//     variants: [],
//     canBeRented: false,
//     rentalItemId: null,
//     isFeatured: false,
//   });
//   const [variantForm, setVariantForm] = useState({
//     type: 'color',
//     value: '',
//     price: '',
//     stock: '',
//     image: '',
//   });
//   const [showVariantForm, setShowVariantForm] = useState(false);
//   const [submitError, setSubmitError] = useState('');
//   const [submitSuccess, setSubmitSuccess] = useState('');

//   useEffect(() => {
//     dispatch(fetchAdminProducts());
//   }, [dispatch]);

//   const navigate = useNavigate();
//   const location = useLocation();

//   // If we were returned here with a linked rental id (new product flow),
//   // open the Add Product dialog and prefill rentalItemId + other prefill fields.
//   useEffect(() => {
//     const params = new URLSearchParams(location.search);
//     const linkedRentalId = params.get('linkedRentalId');
//     const prefillName = params.get('prefillName');
//     const prefillDescription = params.get('prefillDescription');
//     if (linkedRentalId || prefillName || prefillDescription) {
//       setSelectedProduct(null);
//       setFormData((prev) => ({
//         ...{
//           name: '',
//           description: '',
//           price: 0,
//           category: 'Others',
//           brand: '',
//           stock: 0,
//           images: [''],
//           variants: [],
//           canBeRented: false,
//           rentalItemId: null,
//         },
//         ...prev,
//         name: prefillName || prev.name,
//         description: prefillDescription || prev.description,
//         rentalItemId: linkedRentalId || prev.rentalItemId,
//         canBeRented: Boolean(linkedRentalId) || prev.canBeRented,
//       }));
//       setOpen(true);
//     }
//   }, [location.search]);

//   const handleOpen = (product = null) => {
//     if (product) {
//       setSelectedProduct(product);
//       setFormData({
//         ...product,
//         images: product.images?.length > 0 ? product.images : [''],
//         variants: product.variants || [],
//         canBeRented: product.canBeRented || false,
//         rentalItemId: product.rentalItemId || null,
//         isFeatured: product.isFeatured || false,
//         discountPrice: product.discountPrice || 0,
//         discountExpires: product.discountExpires ? new Date(product.discountExpires).toISOString().slice(0,16) : '',
//       });
//     } else {
//       setSelectedProduct(null);
//       setFormData({
//         name: '',
//         description: '',
//         price: 0,
//         discountPrice: 0,
//         discountExpires: '',
//         category: 'Others',
//         brand: '',
//         stock: 0,
//         images: [''],
//         variants: [],
//         canBeRented: false,
//         rentalItemId: null,
//         isFeatured: false,
//       });
//     }
//     setSubmitError('');
//     setSubmitSuccess('');
//     setShowVariantForm(false);
//     setOpen(true);
//   };

//   const handleClose = () => {
//     setOpen(false);
//     setSelectedProduct(null);
//   };

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData({
//       ...formData,
//       [name]: type === 'checkbox' ? checked : value,
//     });
//   };

//   const handleCanBeRentedChange = (e) => {
//     const checked = e.target.checked;
//     setFormData({ ...formData, canBeRented: checked });

//     if (checked) {
//       const params = new URLSearchParams();
//       if (formData.name) params.set('prefillName', formData.name);
//       if (formData.description) params.set('prefillDescription', formData.description);
//       if (selectedProduct && selectedProduct._id) params.set('productId', selectedProduct._id);
//       navigate(`/admin/rental-items?${params.toString()}`);
//     }
//   };

//   const handleImageChange = (index, value) => {
//     const newImages = [...formData.images];
//     newImages[index] = value;
//     setFormData({ ...formData, images: newImages });
//   };

//   const handleAddImage = () => {
//     setFormData({
//       ...formData,
//       images: [...formData.images, ''],
//     });
//   };

//   const handleRemoveImage = (index) => {
//     setFormData({
//       ...formData,
//       images: formData.images.filter((_, i) => i !== index),
//     });
//   };

//   const handleAddVariant = () => {
//     if (variantForm.value && variantForm.price && variantForm.stock) {
//       setFormData({
//         ...formData,
//         variants: [
//           ...formData.variants,
//           { ...variantForm, id: Date.now() },
//         ],
//       });
//       setVariantForm({
//         type: 'color',
//         value: '',
//         price: '',
//         stock: '',
//         image: '',
//       });
//       setShowVariantForm(false);
//     }
//   };

//   const handleRemoveVariant = (variantId) => {
//     setFormData({
//       ...formData,
//       variants: formData.variants.filter((v) => v.id !== variantId),
//     });
//   };

//   const handleSubmit = async () => {
//     try {
//       setSubmitError('');
//       setSubmitSuccess('');

//       if (!formData.name || !formData.description || formData.price <= 0 || formData.stock < 0) {
//         setSubmitError('Please fill in all required fields');
//         return;
//       }

//       const submitData = {
//         ...formData,
//         price: parseFloat(formData.price),
//         stock: parseInt(formData.stock),
//         discountPrice: formData.discountPrice !== undefined && formData.discountPrice !== '' ? parseFloat(formData.discountPrice) : 0,
//         discountExpires: formData.discountExpires ? new Date(formData.discountExpires).toISOString() : null,
//       };

//       if (selectedProduct) {
//         const resultAction = await dispatch(updateProduct({ id: selectedProduct._id, productData: submitData }));
//         if (updateProduct.fulfilled.match(resultAction)) {
//           setSubmitSuccess('Product updated successfully!');
//         } else {
//           setSubmitError(resultAction.payload || 'Failed to update product');
//         }
//       } else {
//         const resultAction = await dispatch(createProduct(submitData));
//         if (createProduct.fulfilled.match(resultAction)) {
//           setSubmitSuccess('Product created successfully!');
//         } else {
//           setSubmitError(resultAction.payload || 'Failed to create product');
//         }
//       }

//       setTimeout(() => {
//         handleClose();
//         dispatch(fetchAdminProducts());
//       }, 1000);
//     } catch (err) {
//       setSubmitError(err.message || 'An error occurred');
//     }
//   };

//   const handleDelete = async (productId) => {
//     if (window.confirm('Are you sure you want to delete this product?')) {
//       try {
//         const resultAction = await dispatch(deleteProduct(productId));
//         if (deleteProduct.fulfilled.match(resultAction)) {
//           setSubmitSuccess('Product deleted successfully!');
//           dispatch(fetchAdminProducts());
//         } else {
//           setSubmitError(resultAction.payload || 'Failed to delete product');
//         }
//         setTimeout(() => {
//           setSubmitError('');
//           setSubmitSuccess('');
//         }, 3000);
//       } catch (err) {
//         setSubmitError(err.message || 'An error occurred');
//       }
//     }
//   };

//   return (
//     <AdminLayout>
//       <Box sx={{ p: 3 }}>
//         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//           <Typography variant="h5" fontWeight={700}>
//             Manage Products
//           </Typography>
//           <Button
//             variant="contained"
//             color="secondary"
//             startIcon={<Add />}
//             onClick={() => handleOpen()}
//           >
//             Add Product
//           </Button>
//         </Box>

//         {submitError && (
//           <Alert severity="error" sx={{ mb: 2 }}>
//             {submitError}
//           </Alert>
//         )}

//         {submitSuccess && (
//           <Alert severity="success" sx={{ mb: 2 }}>
//             {submitSuccess}
//           </Alert>
//         )}

//         {loading && (
//           <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
//             <CircularProgress />
//           </Box>
//         )}

//         {!loading && products.length > 0 && (
//           <TableContainer component={Paper}>
//             <Table>
//               <TableHead sx={{ bgcolor: '#f5f5f5' }}>
//                 <TableRow>
//                   <TableCell>Name</TableCell>
//                   <TableCell>Category</TableCell>
//                   <TableCell>Price</TableCell>
//                   <TableCell>Discount</TableCell>
//                   <TableCell>Stock</TableCell>
//                   <TableCell>Can Rent</TableCell>
//                   <TableCell>Featured</TableCell>
//                   <TableCell align="center">Actions</TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {products.map((product) => (
//                   <TableRow key={product._id} hover>
//                     <TableCell fontWeight={700}>{product.name}</TableCell>
//                     <TableCell>{product.category}</TableCell>
//                     <TableCell>
//                       {product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price ? (
//                         <>
//                           <Typography component="span" sx={{ fontWeight: 900, color: 'error.main' }}>{formatPrice(product.discountPrice)}</Typography>
//                           <Typography component="span" sx={{ ml: 1, textDecoration: 'line-through', color: 'text.secondary' }}>{formatPrice(product.price)}</Typography>
//                         </>
//                       ) : (
//                         formatPrice(product.price)
//                       )}
//                     </TableCell>
//                     <TableCell>{product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price ? `${formatPrice(product.discountPrice)}` : '-'}</TableCell>
//                     <TableCell>{product.stock}</TableCell>
//                     <TableCell>{product.canBeRented ? '✓ Yes' : 'No'}</TableCell>
//                     <TableCell>{product.isFeatured ? '⭐ Featured' : '-'}</TableCell>
//                     <TableCell align="center">
//                       <IconButton
//                         color="primary"
//                         size="small"
//                         onClick={() => handleOpen(product)}
//                       >
//                         <Edit fontSize="small" />
//                       </IconButton>
//                       <IconButton
//                         color="error"
//                         size="small"
//                         onClick={() => handleDelete(product._id)}
//                       >
//                         <Delete fontSize="small" />
//                       </IconButton>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         )}

//         {!loading && products.length === 0 && (
//           <Paper sx={{ p: 4, textAlign: 'center' }}>
//             <Typography color="textSecondary">No products found</Typography>
//           </Paper>
//         )}

//         {/* Product Form Dialog */}
//         <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
//           <DialogTitle>
//             {selectedProduct ? 'Edit Product' : 'Add New Product'}
//           </DialogTitle>
//           <DialogContent dividers>
//             <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
//               {/* Basic Info */}
//               <TextField
//                 fullWidth
//                 label="Product Name"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleInputChange}
//               />

//               <TextField
//                 fullWidth
//                 label="Description"
//                 name="description"
//                 value={formData.description}
//                 onChange={handleInputChange}
//                 multiline
//                 rows={3}
//               />

//               <Grid container spacing={2}>
//                 <Grid item xs={12} sm={6}>
//                   <TextField
//                     fullWidth
//                     label="Price"
//                     name="price"
//                     type="number"
//                     value={formData.price}
//                     onChange={handleInputChange}
//                   />
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <Grid container spacing={1}>
//                     <Grid item xs={12} sm={7}>
//                       <TextField
//                         fullWidth
//                         label="Discount Price (optional)"
//                         name="discountPrice"
//                         type="number"
//                         value={formData.discountPrice || ''}
//                         onChange={handleInputChange}
//                         helperText="Set a lower price to mark as on-sale"
//                       />
//                     </Grid>
//                     <Grid item xs={12} sm={5}>
//                       <TextField
//                         fullWidth
//                         label="Discount expiry (optional)"
//                         name="discountExpires"
//                         type="datetime-local"
//                         value={formData.discountExpires || ''}
//                         onChange={handleInputChange}
//                         InputLabelProps={{ shrink: true }}
//                         helperText="Optional: when set, discount is removed after this date/time"
//                       />
//                     </Grid>
//                   </Grid>
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <TextField
//                     fullWidth
//                     label="Stock"
//                     name="stock"
//                     type="number"
//                     value={formData.stock}
//                     onChange={handleInputChange}
//                   />
//                 </Grid>
//               </Grid>

//               <Grid container spacing={2}>
//                 <Grid item xs={12} sm={6}>
//                   <FormControl fullWidth>
//                     <InputLabel>Category</InputLabel>
//                     <Select
//                       name="category"
//                       value={formData.category}
//                       onChange={handleInputChange}
//                       label="Category"
//                     >
//                       <MenuItem value="Electronics">Electronics</MenuItem>
//                       <MenuItem value="Home">Home</MenuItem>
//                       <MenuItem value="Books">Books</MenuItem>
//                       <MenuItem value="Others">Others</MenuItem>
//                       <MenuItem value="Fashion">Fashion</MenuItem>
//                       <MenuItem value="Toys">Toys</MenuItem>
//                       <MenuItem value="Sports">Sports</MenuItem>
//                     </Select>
//                   </FormControl>
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <TextField
//                     fullWidth
//                     label="Brand"
//                     name="brand"
//                     value={formData.brand}
//                     onChange={handleInputChange}
//                   />
//                 </Grid>
//               </Grid>

//               {/* Rental Option */}
//               <Divider sx={{ my: 2 }} />
//               <Box>
//                 <FormControlLabel
//                   control={
//                     <Checkbox
//                       name="canBeRented"
//                       checked={formData.canBeRented}
//                       onChange={handleCanBeRentedChange}
//                     />
//                   }
//                   label="This product can be rented (customers can rent via rental system)"
//                 />
//                 <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
//                   Note: You'll need to create a separate rental item in the rental inventory.
//                   Link the Rental Item ID here to enable rental.
//                 </Typography>
//                 {formData.canBeRented && (
//                   <TextField
//                     fullWidth
//                     label="Rental Item ID (from rental inventory)"
//                     name="rentalItemId"
//                     value={formData.rentalItemId || ''}
//                     onChange={handleInputChange}
//                     placeholder="Paste the Rental Item ID here"
//                     sx={{ mt: 1 }}
//                   />
//                 )}
//               </Box>

//               {/* Featured Product Option */}
//               <Divider sx={{ my: 2 }} />
//               <Box>
//                 <FormControlLabel
//                   control={
//                     <Checkbox
//                       name="isFeatured"
//                       checked={formData.isFeatured}
//                       onChange={handleInputChange}
//                     />
//                   }
//                   label="Mark as Featured Product"
//                 />
//                 <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
//                   Featured products will be highlighted in a special section on the homepage
//                 </Typography>
//               </Box>

//               {/* Images */}
//               <Divider sx={{ my: 2 }} />
//               <Box>
//                 <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
//                   Product Images
//                 </Typography>
//                 {formData.images.map((image, index) => (
//                   <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
//                     <TextField
//                       fullWidth
//                       placeholder="Image URL"
//                       value={image}
//                       onChange={(e) => handleImageChange(index, e.target.value)}
//                     />
//                     {formData.images.length > 1 && (
//                       <IconButton
//                         color="error"
//                         onClick={() => handleRemoveImage(index)}
//                       >
//                         <Close />
//                       </IconButton>
//                     )}
//                   </Box>
//                 ))}
//                 <Button
//                   size="small"
//                   onClick={handleAddImage}
//                   sx={{ mt: 1 }}
//                 >
//                   + Add Image
//                 </Button>
//               </Box>

//               {/* Variants */}
//               <Divider sx={{ my: 2 }} />
//               <Box>
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
//                   <Typography variant="subtitle2" fontWeight={700}>
//                     Variants (optional)
//                   </Typography>
//                   <Button
//                     size="small"
//                     onClick={() => setShowVariantForm(!showVariantForm)}
//                   >
//                     {showVariantForm ? 'Cancel' : '+ Add Variant'}
//                   </Button>
//                 </Box>

//                 {showVariantForm && (
//                   <Card sx={{ mb: 2, bgcolor: '#f9f9f9' }}>
//                     <CardContent>
//                       <Grid container spacing={2}>
//                         <Grid item xs={12} sm={6}>
//                           <FormControl fullWidth size="small">
//                             <InputLabel>Type</InputLabel>
//                             <Select
//                               value={variantForm.type}
//                               onChange={(e) =>
//                                 setVariantForm({ ...variantForm, type: e.target.value })
//                               }
//                               label="Type"
//                             >
//                               <MenuItem value="color">Color</MenuItem>
//                               <MenuItem value="size">Size</MenuItem>
//                               <MenuItem value="model">Model</MenuItem>
//                             </Select>
//                           </FormControl>
//                         </Grid>
//                         <Grid item xs={12} sm={6}>
//                           <TextField
//                             fullWidth
//                             label="Value"
//                             placeholder="e.g., Red, Large, Pro"
//                             value={variantForm.value}
//                             onChange={(e) =>
//                               setVariantForm({ ...variantForm, value: e.target.value })
//                             }
//                             size="small"
//                           />
//                         </Grid>
//                         <Grid item xs={12} sm={6}>
//                           <TextField
//                             fullWidth
//                             label="Price Modifier"
//                             type="number"
//                             value={variantForm.price}
//                             onChange={(e) =>
//                               setVariantForm({ ...variantForm, price: e.target.value })
//                             }
//                             size="small"
//                           />
//                         </Grid>
//                         <Grid item xs={12} sm={6}>
//                           <TextField
//                             fullWidth
//                             label="Stock"
//                             type="number"
//                             value={variantForm.stock}
//                             onChange={(e) =>
//                               setVariantForm({ ...variantForm, stock: e.target.value })
//                             }
//                             size="small"
//                           />
//                         </Grid>
//                         <Grid item xs={12}>
//                           <TextField
//                             fullWidth
//                             label="Variant Image URL"
//                             placeholder="Image URL for this variant (optional)"
//                             value={variantForm.image}
//                             onChange={(e) =>
//                               setVariantForm({ ...variantForm, image: e.target.value })
//                             }
//                             size="small"
//                           />
//                           {variantForm.image && (
//                             <Box sx={{ mt: 1, textAlign: 'center' }}>
//                               <Box
//                                 component="img"
//                                 src={variantForm.image}
//                                 alt="Variant preview"
//                                 sx={{ maxWidth: '150px', maxHeight: '150px', borderRadius: 1 }}
//                               />
//                             </Box>
//                           )}
                        
//                         </Grid>
//                       </Grid>
//                       <Button
//                         fullWidth
//                         variant="contained"
//                         color="secondary"
//                         onClick={handleAddVariant}
//                         sx={{ mt: 2 }}
//                       >
//                         Add Variant
//                       </Button>
//                     </CardContent>
//                   </Card>
//                 )}

//                 {formData.variants.length > 0 && (
//                   <Box>
//                     {formData.variants.map((variant, index) => (
//                       <Box key={variant.id} sx={{
//                         display: 'flex',
//                         justifyContent: 'space-between',
//                         alignItems: 'center',
//                         p: 2,
//                         bgcolor: '#f5f5f5',
//                         borderRadius: 1,
//                         mb: 1,
//                       }}>
//                         <Box sx={{ flex: 1 }}>
//                           <Typography variant="body2" fontWeight={700}>
//                             {variant.type}: {variant.value}
//                           </Typography>
//                           <Typography variant="caption" color="textSecondary">
//                             Stock: {variant.stock}, Price: +{variant.price}
//                           </Typography>
//                           {variant.image && (
//                             <Box sx={{ mt: 1 }}>
//                               <Box
//                                 component="img"
//                                 src={variant.image}
//                                 alt={variant.value}
//                                 sx={{ maxWidth: '100px', maxHeight: '100px', borderRadius: 1 }}
//                               />
//                             </Box>
//                           )}
//                         </Box>
//                         <IconButton
//                           size="small"
//                           color="error"
//                           onClick={() => handleRemoveVariant(variant.id)}
//                         >
//                           <Delete fontSize="small" />
//                         </IconButton>
//                       </Box>
//                     ))}
//                   </Box>
//                 )}
//               </Box>
//             </Box>
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={handleClose}>Cancel</Button>
//             <Button
//               onClick={handleSubmit}
//               variant="contained"
//               color="secondary"
//             >
//               {selectedProduct ? 'Update' : 'Create'}
//             </Button>
//           </DialogActions>
//         </Dialog>
//       </Box>
//     </AdminLayout>
//   );
// };

// export default AdminProducts;






// src/pages/admin/AdminProducts.js
import AdminLayout from "../../components/AdminLayout";
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { formatPrice } from '../../utils/currency';
import * as XLSX from 'xlsx';
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
  FormControlLabel,
  Checkbox,
  InputAdornment,
} from '@mui/material';
import { Edit, Delete, Add, Close, Search, Clear, Download } from '@mui/icons-material';
import {
  fetchAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../features/adminSlice';

const AdminProducts = () => {
  const dispatch = useDispatch();
  const adminState = useSelector((state) => state.admin) || {};
  const { products = [], loading = false, error = null } = adminState;

  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    discountPrice: 0,
    discountExpires: '',
    category: 'Others',
    brand: '',
    stock: 0,
    images: [''],
    variants: [],
    canBeRented: false,
    rentalItemId: null,
    isFeatured: false,
    showInReels: false,
    specifications: [],
    productHighlights: [],
    additionalInfo: [],
  });
  const [variantForm, setVariantForm] = useState({
    type: 'color',
    value: '',
    price: '',
    stock: '',
    image: '',
  });
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // new: search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchAdminProducts());
  }, [dispatch]);

  const navigate = useNavigate();
  const location = useLocation();

  // prefill logic preserved...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const linkedRentalId = params.get('linkedRentalId');
    const prefillName = params.get('prefillName');
    const prefillDescription = params.get('prefillDescription');
    if (linkedRentalId || prefillName || prefillDescription) {
      setSelectedProduct(null);
      setFormData((prev) => ({
        ...{
          name: '',
          description: '',
          price: 0,
          category: 'Others',
          brand: '',
          stock: 0,
          images: [''],
          variants: [],
          canBeRented: false,
          rentalItemId: null,
        },
        ...prev,
        name: prefillName || prev.name,
        description: prefillDescription || prev.description,
        rentalItemId: linkedRentalId || prev.rentalItemId,
        canBeRented: Boolean(linkedRentalId) || prev.canBeRented,
      }));
      setOpen(true);
    }
  }, [location.search]);

  const handleOpen = (product = null) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        ...product,
        images: product.images?.length > 0 ? product.images : [''],
        variants: product.variants || [],
        canBeRented: product.canBeRented || false,
        rentalItemId: product.rentalItemId || null,
        isFeatured: product.isFeatured || false,
        showInReels: product.showInReels || false,
        discountPrice: product.discountPrice || 0,
        discountExpires: product.discountExpires ? new Date(product.discountExpires).toISOString().slice(0,16) : '',
        specifications: product.specifications || [],
        productHighlights: product.productHighlights || [],
        additionalInfo: product.additionalInfo || [],
      });
    } else {
      setSelectedProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        discountPrice: 0,
        discountExpires: '',
        category: 'Others',
        brand: '',
        stock: 0,
        images: [''],
        variants: [],
        canBeRented: false,
        rentalItemId: null,
        isFeatured: false,
        showInReels: false,
        specifications: [],
        productHighlights: [],
        additionalInfo: [],
      });
    }
    setSubmitError('');
    setSubmitSuccess('');
    setShowVariantForm(false);
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

  const handleCanBeRentedChange = (e) => {
    const checked = e.target.checked;
    setFormData({ ...formData, canBeRented: checked });

    if (checked) {
      const params = new URLSearchParams();
      if (formData.name) params.set('prefillName', formData.name);
      if (formData.description) params.set('prefillDescription', formData.description);
      if (selectedProduct && selectedProduct._id) params.set('productId', selectedProduct._id);
      navigate(`/admin/rental-items?${params.toString()}`);
    }
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const handleAddImage = () => {
    setFormData({
      ...formData,
      images: [...formData.images, ''],
    });
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleAddVariant = () => {
    if (variantForm.value && variantForm.price && variantForm.stock) {
      setFormData({
        ...formData,
        variants: [
          ...formData.variants,
          { ...variantForm, id: Date.now() },
        ],
      });
      setVariantForm({
        type: 'color',
        value: '',
        price: '',
        stock: '',
        image: '',
      });
      setShowVariantForm(false);
    }
  };

  const handleRemoveVariant = (variantId) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((v) => v.id !== variantId),
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitError('');
      setSubmitSuccess('');

      if (!formData.name || !formData.description || formData.price <= 0 || formData.stock < 0) {
        setSubmitError('Please fill in all required fields');
        return;
      }

      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        discountPrice: formData.discountPrice !== undefined && formData.discountPrice !== '' ? parseFloat(formData.discountPrice) : 0,
        discountExpires: formData.discountExpires ? new Date(formData.discountExpires).toISOString() : null,
      };

      if (selectedProduct) {
        const resultAction = await dispatch(updateProduct({ id: selectedProduct._id, productData: submitData }));
        if (updateProduct.fulfilled.match(resultAction)) {
          setSubmitSuccess('Product updated successfully!');
        } else {
          setSubmitError(resultAction.payload || 'Failed to update product');
        }
      } else {
        const resultAction = await dispatch(createProduct(submitData));
        if (createProduct.fulfilled.match(resultAction)) {
          setSubmitSuccess('Product created successfully!');
        } else {
          setSubmitError(resultAction.payload || 'Failed to create product');
        }
      }

      setTimeout(() => {
        handleClose();
        dispatch(fetchAdminProducts());
      }, 1000);
    } catch (err) {
      setSubmitError(err.message || 'An error occurred');
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const resultAction = await dispatch(deleteProduct(productId));
        if (deleteProduct.fulfilled.match(resultAction)) {
          setSubmitSuccess('Product deleted successfully!');
          dispatch(fetchAdminProducts());
        } else {
          setSubmitError(resultAction.payload || 'Failed to delete product');
        }
        setTimeout(() => {
          setSubmitError('');
          setSubmitSuccess('');
        }, 3000);
      } catch (err) {
        setSubmitError(err.message || 'An error occurred');
      }
    }
  };

  // ----- new: filtered & grouped products by category -----
  const filteredProducts = useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      return name.includes(q) || desc.includes(q) || brand.includes(q) || category.includes(q);
    });
  }, [products, searchTerm]);

  const groupedByCategory = useMemo(() => {
    return filteredProducts.reduce((acc, p) => {
      const cat = p.category || 'Others';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {});
  }, [filteredProducts]);

  const categoriesSorted = useMemo(() => {
    return Object.keys(groupedByCategory).sort((a, b) => {
      if (a === 'Others') return 1;
      if (b === 'Others') return -1;
      return a.localeCompare(b);
    });
  }, [groupedByCategory]);

  // Export to Excel function
  const handleExportToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredProducts.map((product) => ({
        'Product Name': product.name || '',
        'Description': product.description || '',
        'Category': product.category || 'Others',
        'Brand': product.brand || '',
        'Price': product.price || 0,
        'Discount Price': product.discountPrice || '',
        'Discount Expires': product.discountExpires ? new Date(product.discountExpires).toLocaleString() : '',
        'Stock': product.stock || 0,
        'Can Be Rented': product.canBeRented ? 'Yes' : 'No',
        'Rental Item ID': product.rentalItemId || '',
        'Featured': product.isFeatured ? 'Yes' : 'No',
        'Show in Reels': product.showInReels ? 'Yes' : 'No',
        'Number of Images': product.images?.length || 0,
        'Number of Variants': product.variants?.length || 0,
        'Created At': product.createdAt ? new Date(product.createdAt).toLocaleString() : '',
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const columnWidths = [
        { wch: 30 }, // Product Name
        { wch: 40 }, // Description
        { wch: 15 }, // Category
        { wch: 15 }, // Brand
        { wch: 12 }, // Price
        { wch: 15 }, // Discount Price
        { wch: 20 }, // Discount Expires
        { wch: 10 }, // Stock
        { wch: 15 }, // Can Be Rented
        { wch: 25 }, // Rental Item ID
        { wch: 12 }, // Featured
        { wch: 15 }, // Number of Images
        { wch: 18 }, // Number of Variants
        { wch: 20 }, // Created At
      ];
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `ShopiKart_Products_${date}.xlsx`;

      // Download
      XLSX.writeFile(workbook, filename);

      setSubmitSuccess(`Exported ${filteredProducts.length} products to Excel successfully!`);
      setTimeout(() => setSubmitSuccess(''), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setSubmitError('Failed to export to Excel. Please try again.');
      setTimeout(() => setSubmitError(''), 3000);
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
          <Typography variant="h5" fontWeight={700}>
            Manage Products
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
            {/* Search space */}
            <TextField
              size="small"
              placeholder="Search products by name, brand, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{ minWidth: { xs: '60%', sm: 420 }, mr: 1, background: '#fff', borderRadius: 1 }}
            />

            <Button
              variant="outlined"
              color="success"
              startIcon={<Download />}
              onClick={handleExportToExcel}
              disabled={products.length === 0}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Export Excel
            </Button>

            <Button
              variant="contained"
              color="secondary"
              startIcon={<Add />}
              onClick={() => handleOpen()}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add Product
            </Button>
          </Box>
        </Box>

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {submitSuccess}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && products.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">No products found</Typography>
          </Paper>
        )}

        {/* Category-wise tables */}
        {!loading && products.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {categoriesSorted.length === 0 && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="textSecondary">No products match your search</Typography>
              </Paper>
            )}

            {categoriesSorted.map((cat) => {
              const list = groupedByCategory[cat] || [];
              return (
                <Box key={cat}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" fontWeight={800}>{cat}</Typography>
                    <Typography variant="caption" color="text.secondary">{list.length} item{list.length !== 1 ? 's' : ''}</Typography>
                  </Box>

                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#fafafa' }}>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Price</TableCell>
                          <TableCell>Discount</TableCell>
                          <TableCell>Stock</TableCell>
                          <TableCell>Can Rent</TableCell>
                          <TableCell>Featured</TableCell>
                          <TableCell>In Reels</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {list.map((product) => (
                          <TableRow key={product._id} hover>
                            <TableCell sx={{ fontWeight: 700, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={product.name}>
                              {product.name}
                            </TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell>
                              {product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price ? (
                                <>
                                  <Typography component="span" sx={{ fontWeight: 900, color: 'error.main' }}>{formatPrice(product.discountPrice)}</Typography>
                                  <Typography component="span" sx={{ ml: 1, textDecoration: 'line-through', color: 'text.secondary' }}>{formatPrice(product.price)}</Typography>
                                </>
                              ) : (
                                formatPrice(product.price)
                              )}
                            </TableCell>
                            <TableCell>
                              {product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price ? `${formatPrice(product.discountPrice)}` : '-'}
                            </TableCell>
                            <TableCell>{product.stock}</TableCell>
                            <TableCell>{product.canBeRented ? '✓ Yes' : 'No'}</TableCell>
                            <TableCell>{product.isFeatured ? '⭐ Featured' : '-'}</TableCell>
                            <TableCell>{product.showInReels ? '🎬 Yes' : '-'}</TableCell>
                            <TableCell align="center">
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleOpen(product)}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDelete(product._id)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Product Form Dialog (unchanged) */}
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedProduct ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Basic Info */}
              <TextField
                fullWidth
                label="Product Name"
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
                  <TextField
                    fullWidth
                    label="Price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={7}>
                      <TextField
                        fullWidth
                        label="Discount Price (optional)"
                        name="discountPrice"
                        type="number"
                        value={formData.discountPrice || ''}
                        onChange={handleInputChange}
                        helperText="Set a lower price to mark as on-sale"
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        fullWidth
                        label="Discount expiry (optional)"
                        name="discountExpires"
                        type="datetime-local"
                        value={formData.discountExpires || ''}
                        onChange={handleInputChange}
                        InputLabelProps={{ shrink: true }}
                        helperText="Optional: when set, discount is removed after this date/time"
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Stock"
                    name="stock"
                    type="number"
                    value={formData.stock}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>

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
                      <MenuItem value="Home">Home</MenuItem>
                      <MenuItem value="Books">Books</MenuItem>
                      <MenuItem value="Others">Others</MenuItem>
                      <MenuItem value="Fashion">Fashion</MenuItem>
                      <MenuItem value="Toys">Toys</MenuItem>
                      <MenuItem value="Sports">Sports</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>

              {/* Rental Option */}
              <Divider sx={{ my: 2 }} />
              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="canBeRented"
                      checked={formData.canBeRented}
                      onChange={handleCanBeRentedChange}
                    />
                  }
                  label="This product can be rented (customers can rent via rental system)"
                />
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                  Note: You'll need to create a separate rental item in the rental inventory.
                  Link the Rental Item ID here to enable rental.
                </Typography>
                {formData.canBeRented && (
                  <TextField
                    fullWidth
                    label="Rental Item ID (from rental inventory)"
                    name="rentalItemId"
                    value={formData.rentalItemId || ''}
                    onChange={handleInputChange}
                    placeholder="Paste the Rental Item ID here"
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>

              {/* Featured Product Option */}
              <Divider sx={{ my: 2 }} />
              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                    />
                  }
                  label="Mark as Featured Product"
                />
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                  Featured products will be highlighted in a special section on the homepage
                </Typography>
              </Box>

              {/* Show in Reels Option */}
              <Divider sx={{ my: 2 }} />
              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="showInReels"
                      checked={formData.showInReels}
                      onChange={handleInputChange}
                    />
                  }
                  label="🎬 Show in Product Reels"
                />
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                  This product will appear in the Instagram-style reels feed for quick browsing and shopping
                </Typography>
              </Box>

              {/* ========= Amazon-style Product Info Fields ========= */}
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Product Highlights ("About this item" bullet points)
                </Typography>
                {formData.productHighlights.map((h, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      placeholder={`Highlight ${i + 1}`}
                      value={h}
                      onChange={(e) => {
                        const arr = [...formData.productHighlights];
                        arr[i] = e.target.value;
                        setFormData({ ...formData, productHighlights: arr });
                      }}
                      size="small"
                    />
                    <IconButton color="error" onClick={() => {
                      setFormData({ ...formData, productHighlights: formData.productHighlights.filter((_, idx) => idx !== i) });
                    }}>
                      <Close />
                    </IconButton>
                  </Box>
                ))}
                <Button size="small" onClick={() => setFormData({ ...formData, productHighlights: [...formData.productHighlights, ''] })} sx={{ mt: 0.5 }}>
                  + Add Highlight
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Technical Details / Specifications
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                  Key-value pairs like Brand, Material, Dimensions, Country of Origin, etc.
                </Typography>
                {formData.specifications.map((spec, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      placeholder="Key (e.g. Material)"
                      value={spec.key}
                      onChange={(e) => {
                        const arr = [...formData.specifications];
                        arr[i] = { ...arr[i], key: e.target.value };
                        setFormData({ ...formData, specifications: arr });
                      }}
                      size="small"
                      sx={{ width: '40%' }}
                    />
                    <TextField
                      placeholder="Value (e.g. Resin)"
                      value={spec.value}
                      onChange={(e) => {
                        const arr = [...formData.specifications];
                        arr[i] = { ...arr[i], value: e.target.value };
                        setFormData({ ...formData, specifications: arr });
                      }}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <IconButton color="error" onClick={() => {
                      setFormData({ ...formData, specifications: formData.specifications.filter((_, idx) => idx !== i) });
                    }}>
                      <Close />
                    </IconButton>
                  </Box>
                ))}
                <Button size="small" onClick={() => setFormData({ ...formData, specifications: [...formData.specifications, { key: '', value: '' }] })} sx={{ mt: 0.5 }}>
                  + Add Specification
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Additional Information
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                  Manufacturer, Net Quantity, Item Weight, Included Components, etc.
                </Typography>
                {formData.additionalInfo.map((info, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      placeholder="Key (e.g. Manufacturer)"
                      value={info.key}
                      onChange={(e) => {
                        const arr = [...formData.additionalInfo];
                        arr[i] = { ...arr[i], key: e.target.value };
                        setFormData({ ...formData, additionalInfo: arr });
                      }}
                      size="small"
                      sx={{ width: '40%' }}
                    />
                    <TextField
                      placeholder="Value (e.g. TiedRibbons)"
                      value={info.value}
                      onChange={(e) => {
                        const arr = [...formData.additionalInfo];
                        arr[i] = { ...arr[i], value: e.target.value };
                        setFormData({ ...formData, additionalInfo: arr });
                      }}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <IconButton color="error" onClick={() => {
                      setFormData({ ...formData, additionalInfo: formData.additionalInfo.filter((_, idx) => idx !== i) });
                    }}>
                      <Close />
                    </IconButton>
                  </Box>
                ))}
                <Button size="small" onClick={() => setFormData({ ...formData, additionalInfo: [...formData.additionalInfo, { key: '', value: '' }] })} sx={{ mt: 0.5 }}>
                  + Add Info
                </Button>
              </Box>

              {/* Images */}
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Product Images
                </Typography>
                {formData.images.map((image, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      placeholder="Image URL"
                      value={image}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                    />
                    {formData.images.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <Close />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Button
                  size="small"
                  onClick={handleAddImage}
                  sx={{ mt: 1 }}
                >
                  + Add Image
                </Button>
              </Box>

              {/* Variants */}
              <Divider sx={{ my: 2 }} />
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Variants (optional)
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setShowVariantForm(!showVariantForm)}
                  >
                    {showVariantForm ? 'Cancel' : '+ Add Variant'}
                  </Button>
                </Box>

                {showVariantForm && (
                  <Card sx={{ mb: 2, bgcolor: '#f9f9f9' }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Type</InputLabel>
                            <Select
                              value={variantForm.type}
                              onChange={(e) =>
                                setVariantForm({ ...variantForm, type: e.target.value })
                              }
                              label="Type"
                            >
                              <MenuItem value="color">Color</MenuItem>
                              <MenuItem value="size">Size</MenuItem>
                              <MenuItem value="model">Model</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Value"
                            placeholder="e.g., Red, Large, Pro"
                            value={variantForm.value}
                            onChange={(e) =>
                              setVariantForm({ ...variantForm, value: e.target.value })
                            }
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Price Modifier"
                            type="number"
                            value={variantForm.price}
                            onChange={(e) =>
                              setVariantForm({ ...variantForm, price: e.target.value })
                            }
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Stock"
                            type="number"
                            value={variantForm.stock}
                            onChange={(e) =>
                              setVariantForm({ ...variantForm, stock: e.target.value })
                            }
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Variant Image URL"
                            placeholder="Image URL for this variant (optional)"
                            value={variantForm.image}
                            onChange={(e) =>
                              setVariantForm({ ...variantForm, image: e.target.value })
                            }
                            size="small"
                          />
                          {variantForm.image && (
                            <Box sx={{ mt: 1, textAlign: 'center' }}>
                              <Box
                                component="img"
                                src={variantForm.image}
                                alt="Variant preview"
                                sx={{ maxWidth: '150px', maxHeight: '150px', borderRadius: 1 }}
                              />
                            </Box>
                          )}
                        
                        </Grid>
                      </Grid>
                      <Button
                        fullWidth
                        variant="contained"
                        color="secondary"
                        onClick={handleAddVariant}
                        sx={{ mt: 2 }}
                      >
                        Add Variant
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {formData.variants.length > 0 && (
                  <Box>
                    {formData.variants.map((variant, index) => (
                      <Box key={variant.id} sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        bgcolor: '#f5f5f5',
                        borderRadius: 1,
                        mb: 1,
                      }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={700}>
                            {variant.type}: {variant.value}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Stock: {variant.stock}, Price: +{variant.price}
                          </Typography>
                          {variant.image && (
                            <Box sx={{ mt: 1 }}>
                              <Box
                                component="img"
                                src={variant.image}
                                alt={variant.value}
                                sx={{ maxWidth: '100px', maxHeight: '100px', borderRadius: 1 }}
                              />
                            </Box>
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveVariant(variant.id)}
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
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="secondary"
            >
              {selectedProduct ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default AdminProducts;
