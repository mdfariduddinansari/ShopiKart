import { Container, Typography, Box, Button, Paper } from "@mui/material";

const CareersPage = () => (
  <Box sx={{ backgroundColor: "background.default", minHeight: "100vh", py: 6 }}>
    <Container>
      <Paper
        elevation={3}
        sx={{
          p: 5,
          borderRadius: 3,
          textAlign: "center",
          background: "linear-gradient(135deg, #f0fff0 0%, #ffffff 100%)",
        }}
      >
        <Typography
          variant="h3"
          fontWeight={700}
          sx={{ color: "#1f8a13", mb: 2 }}
        >
          Careers at ShopiKart
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 700, mx: "auto", mb: 3, lineHeight: 1.8 }}
        >
          We’re building the future of e-commerce and rentals. Join our
          passionate team of developers, designers, and visionaries working to
          make shopping smarter and more sustainable.
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          sx={{
            px: 4,
            py: 1.2,
            borderRadius: 2,
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          View Open Positions
        </Button>
      </Paper>
    </Container>
  </Box>
);

export default CareersPage;
