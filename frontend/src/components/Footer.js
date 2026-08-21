


import React from "react";
import {
  Box,
  Typography,
  Grid,
  Link,
  Button,
  IconButton,
  Stack,
  Divider,
  Container,
  Tooltip,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  ArrowUpward as ArrowUpIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Box
      component="footer"
      sx={{
        background: "linear-gradient(135deg, #004d40 0%, #00695c 100%)",
        color: "#fff",
        mt: { xs: 5, md: 8 },
        pt: 0,
        pb: 4,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
          pointerEvents: "none",
        },
      }}
    >
      {/* Indian Tricolor Top Stripe */}
      <Box sx={{ display: 'flex', width: '100%', height: 4, mb: { xs: 5, md: 8 } }}>
        <Box sx={{ flex: 1, background: '#FF9933' }} />
        <Box sx={{ flex: 1, background: '#FFFFFF' }} />
        <Box sx={{ flex: 1, background: '#138808' }} />
      </Box>
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, px: { xs: 2, sm: 3 } }}>
        {/* Back to Top Button */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <Button
            onClick={scrollToTop}
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              color: "#fff",
              borderRadius: "50%",
              width: 50,
              height: 50,
              minWidth: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.3)",
                transform: "translateY(-4px)",
                boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
              },
            }}
          >
            <ArrowUpIcon sx={{ fontSize: 24 }} />
          </Button>
        </Box>

        <Divider sx={{ bgcolor: "rgba(255,255,255,0.2)", mb: { xs: 4, md: 6 } }} />

        {/* Footer Content Grid */}
        <Grid container spacing={{ xs: 4, md: 5 }} sx={{ mb: { xs: 4, md: 6 } }}>
          {/* Company Info */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{
                mb: 2,
                background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.9) 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: 0.5,
              }}
            >
              ShopiKart
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 700,
                fontSize: '0.75rem',
                mb: 1,
                display: 'block',
                background: 'linear-gradient(90deg, #FF9933, #FFFFFF, #138808)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              🇮🇳 Proudly Made in India
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.8)",
                mb: 2.5,
                lineHeight: 1.7,
              }}
            >
              Your trusted Indian marketplace for quality products, affordable prices, and exceptional service — delivering happiness across Bharat.
            </Typography>

            {/* Contact Info */}
            <Stack spacing={1.5}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <PhoneIcon sx={{ fontSize: 18, mt: 0.3, opacity: 0.8 }} />
                <Typography variant="caption" sx={{ opacity: 0.85, lineHeight: 1.5 }}>
                  +91 9804774676
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EmailIcon sx={{ fontSize: 18, mt: 0.3, opacity: 0.8 }} />
                <Typography variant="caption" sx={{ opacity: 0.85, lineHeight: 1.5 }}>
                  support@shopikart.com
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <LocationIcon sx={{ fontSize: 18, mt: 0.3, opacity: 0.8 }} />
                <Typography variant="caption" sx={{ opacity: 0.85, lineHeight: 1.5 }}>
                  India
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {/* Get to Know Us */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              sx={{
                mb: 2.5,
                fontSize: "0.95rem",
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "rgba(255,255,255,0.95)",
              }}
            >
              Company
            </Typography>
            <Stack spacing={1.2}>
              {[
                { label: "About Us", to: "/about" },
                { label: "Careers", to: "/careers" },
                { label: "Blog", to: "/blog" },
                { label: "Contact", to: "/contact" },
              ].map((link, idx) => (
                <Link
                  key={idx}
                  component={RouterLink}
                  to={link.to}
                  sx={{
                    color: "rgba(255,255,255,0.8)",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    display: "inline-block",
                    width: "fit-content",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      bottom: -4,
                      left: 0,
                      width: 0,
                      height: 2,
                      backgroundColor: "rgba(255,255,255,0.6)",
                      transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    },
                    "&:hover": {
                      color: "#fff",
                      "&::after": {
                        width: "100%",
                      },
                    },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Shop with Us */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              sx={{
                mb: 2.5,
                fontSize: "0.95rem",
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "rgba(255,255,255,0.95)",
              }}
            >
              Shop
            </Typography>
            <Stack spacing={1.2}>
              {[
                { label: "Your Orders", to: "/orders" },
                { label: "Your Cart", to: "/cart" },
                { label: "Wishlist", to: "/wishlist" },
                { label: "Rentals", to: "/rental" },
              ].map((link, idx) => (
                <Link
                  key={idx}
                  component={RouterLink}
                  to={link.to}
                  sx={{
                    color: "rgba(255,255,255,0.8)",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    display: "inline-block",
                    width: "fit-content",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      bottom: -4,
                      left: 0,
                      width: 0,
                      height: 2,
                      backgroundColor: "rgba(255,255,255,0.6)",
                      transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    },
                    "&:hover": {
                      color: "#fff",
                      "&::after": {
                        width: "100%",
                      },
                    },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Connect with Us */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              sx={{
                mb: 2.5,
                fontSize: "0.95rem",
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "rgba(255,255,255,0.95)",
              }}
            >
              Follow Us
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.8)",
                mb: 2.5,
                fontSize: "0.9rem",
              }}
            >
              Connect with us on social media for updates and exclusive offers.
            </Typography>

            {/* Social Icons */}
            <Stack direction="row" spacing={1.5}>
              {[
                { icon: FacebookIcon, href: "https://facebook.com", label: "Facebook" },
                { icon: TwitterIcon, href: "https://twitter.com", label: "Twitter" },
                { icon: InstagramIcon, href: "https://instagram.com", label: "Instagram" },
                { icon: LinkedInIcon, href: "https://linkedin.com", label: "LinkedIn" },
              ].map((social, idx) => {
                const Icon = social.icon;
                return (
                  <Tooltip key={idx} title={social.label}>
                    <IconButton
                      component="a"
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.15)",
                        color: "#fff",
                        width: 44,
                        height: 44,
                        border: "1px solid rgba(255,255,255,0.2)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          bgcolor: "rgba(255,255,255,0.25)",
                          transform: "translateY(-4px)",
                          boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                          borderColor: "rgba(255,255,255,0.4)",
                        },
                      }}
                    >
                      <Icon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>
                );
              })}
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ bgcolor: "rgba(255,255,255,0.2)", my: 4 }} />

        {/* Bottom Section */}
        <Grid container spacing={3} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.85rem",
                lineHeight: 1.6,
              }}
            >
              © {new Date().getFullYear()} ShopiKart. All rights reserved. | Made with ❤️ in India 🇮🇳
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ textAlign: { xs: "left", sm: "right" } }}>
            <Stack direction="row" spacing={2} sx={{ justifyContent: { xs: "flex-start", sm: "flex-end" }, flexWrap: "wrap", rowGap: 1 }}>
              <Link
                href="#"
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                  "&:hover": { color: "#fff" },
                }}
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                  "&:hover": { color: "#fff" },
                }}
              >
                Terms of Service
              </Link>
              <Link
                href="#"
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                  "&:hover": { color: "#fff" },
                }}
              >
                Cookie Policy
              </Link>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Footer;
