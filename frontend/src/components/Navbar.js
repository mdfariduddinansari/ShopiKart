import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Badge, 
  Box,
  Container,
} from '@mui/material';
import { ShoppingCart, Person, Favorite } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/authSlice';
import { clearLocalCart } from '../features/cartSlice';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const wishlistCount = useSelector((state) => state.wishlist.items?.length || 0);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearLocalCart());
    navigate('/login');
  };

  return (
    <AppBar position="sticky" sx={{ backgroundColor: 'background.paper', boxShadow: 2 }}>
      <Container>
        <Toolbar disableGutters sx={{ minHeight: 56, py: 0.5 }}>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              fontWeight: 'bold',
              color: 'primary.main',
              '&:hover': {
                color: 'primary.dark',
              },
              transition: 'color 0.2s',
            }}
            onClick={() => navigate('/')}
          >
            ShopiKart
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {user?.isAdmin && (
              <Button 
                variant="outlined"
                color="primary"
                onClick={() => navigate('/admin')}
                sx={{ mr: 1 }}
              >
                Admin Panel
              </Button>
            )}
            {isAuthenticated ? (
              <>
                <Button 
                  variant="text"
                  color="primary" 
                  startIcon={<Person />}
                  onClick={() => navigate('/profile')}
                  sx={{ 
                    '&:hover': { backgroundColor: 'primary.light' },
                  }}
                >
                  {user.name}
                </Button>
                <Button 
                  variant="text"
                  color="error"
                  onClick={handleLogout}
                  sx={{ 
                    '&:hover': { backgroundColor: 'error.light' },
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button 
                variant="contained"
                color="primary"
                startIcon={<Person />}
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            )}
            <Button 
              variant="outlined"
              color="error"
              startIcon={
                <Badge badgeContent={wishlistCount} color="error">
                  <Favorite />
                </Badge>
              }
              onClick={() => navigate('/wishlist')}
              sx={{ ml: 1 }}
            >
              Wishlist
            </Button>
            <Button 
              variant="contained"
              color="secondary"
              startIcon={
                <Badge badgeContent={0} color="error">
                  <ShoppingCart />
                </Badge>
              }
              onClick={() => navigate('/cart')}
              sx={{ ml: 1 }}
            >
              Cart
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
