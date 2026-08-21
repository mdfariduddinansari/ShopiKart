import { Container, Typography, Box, Paper } from "@mui/material";

const AboutPage = () => (
  <Box sx={{ backgroundColor: "background.default", minHeight: "100vh", py: 6 }}>
    <Container>
      <Paper
        elevation={3}
        sx={{
          p: 5,
          borderRadius: 3,
          background: "linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%)",
        }}
      >
        <Typography
          variant="h3"
          fontWeight={700}
          align="center"
          gutterBottom
          sx={{ color: "#1f8a13" }}
        >
          About ShopiKart
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          sx={{ maxWidth: 800, mx: "auto", mb: 4 }}
        >
          Bringing the marketplace to your fingertips.
        </Typography>
        <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.8, fontSize: "1.05rem" }}>
          ShopiKart is your all-in-one destination for shopping and rentals.
          We believe that quality products should be accessible, affordable,
          and convenient for everyone. Whether you’re purchasing the latest
          gadgets or renting home appliances, we’re committed to delivering
          a seamless experience backed by trusted service and secure payments.
        </Typography>
      </Paper>
    </Container>
  </Box>
);

export default AboutPage;
