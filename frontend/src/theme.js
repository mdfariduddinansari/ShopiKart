



import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#0d1b2a",  
      light: "#1b263b", 
      dark: "#000814",   
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#3fba9c",
      light: "#58d6b5",
      dark: "#2fa383",
      contrastText: "#000000",
    },
    background: {
      default: "#f4f6f8", 
      paper: "#ffffff",  
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 600,
      marginBottom: "1rem",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 500,
      marginBottom: "0.8rem",
    },
    h3: {
      fontSize: "1.8rem",
      fontWeight: 500,
      marginBottom: "0.6rem",
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 500,
      marginBottom: "0.5rem",
    },
    button: {
      textTransform: "none", 
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 16px",
          transition: "all 0.2s ease-in-out",
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0px 2px 6px rgba(0,0,0,0.15)",
            transform: "translateY(-2px)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
          transition: "transform 0.2s ease-in-out, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0px 8px 20px rgba(0,0,0,0.1)",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0px 2px 8px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});

export default theme;
