import React, { useState } from 'react';
import { IconButton, Tooltip, Box, Typography, CircularProgress } from '@mui/material';
import { Mic, MicOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const VoiceSearch = ({ variant = 'header' }) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  // Check if browser supports Web Speech API
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSupported = !!SpeechRecognition;

  const startListening = () => {
    if (!isSupported) {
      setError('Voice search is not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
      setTranscript('');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        setTranscript(finalTranscript.trim());
        // Navigate to search results
        navigate(`/?search=${encodeURIComponent(finalTranscript.trim())}`);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else if (event.error === 'network') {
        setError('Network error. Please check your connection.');
      } else {
        setError(`Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
  };

  if (!isSupported) {
    return null; // Don't show the button if voice search is not supported
  }

  // Header variant - compact, styled for search bar
  if (variant === 'header') {
    return (
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Tooltip title={isListening ? 'Stop listening' : 'Voice search'}>
          <IconButton
            onClick={isListening ? stopListening : startListening}
            sx={{
              backgroundColor: '#ffb300',
              color: '#000',
              p: 1,
              mr: 0.5,
              transition: 'all 0.3s ease',
              boxShadow: 1,
              '&:hover': {
                backgroundColor: '#ffa000',
              },
            }}
            size="medium"
            aria-label="voice search"
          >
            {isListening ? (
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress
                  size={20}
                  sx={{
                    position: 'absolute',
                    color: '#fff',
                  }}
                />
                <MicOff fontSize="small" sx={{ fontSize: 18 }} />
              </Box>
            ) : (
              <Mic fontSize="small" sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </Tooltip>

        {isListening && (
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              mt: 1,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 1.5,
              minWidth: 220,
              boxShadow: 2,
              zIndex: 1300,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Listening...
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  alignItems: 'flex-end',
                }}
              >
                {[1, 2, 3, 4].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 3,
                      bgcolor: 'primary.main',
                      borderRadius: 1,
                      animation: `pulse 0.6s ease-in-out ${i * 0.15}s infinite`,
                      '@keyframes pulse': {
                        '0%, 100%': { height: 8 },
                        '50%': { height: 16 },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
            {transcript && (
              <Typography variant="body2" sx={{ mt: 1, fontSize: '0.85rem' }}>
                <strong>Heard:</strong> "{transcript}"
              </Typography>
            )}
          </Box>
        )}

        {error && (
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              mt: 1,
              bgcolor: 'error.lighter',
              border: '1px solid',
              borderColor: 'error.main',
              borderRadius: 1,
              p: 1.5,
              minWidth: 220,
              boxShadow: 2,
              zIndex: 1300,
            }}
          >
            <Typography variant="caption" color="error.main" sx={{ fontSize: '0.85rem' }}>
              {error}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  // Default variant (for navbar or other locations)
  return (
    <Box sx={{ position: 'relative' }}>
      <Tooltip title={isListening ? 'Stop listening' : 'Voice search'}>
        <IconButton
          onClick={isListening ? stopListening : startListening}
          sx={{
            color: isListening ? 'error.main' : 'inherit',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: isListening ? 'error.lighter' : 'action.hover',
            },
          }}
        >
          {isListening ? (
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress
                size={24}
                sx={{
                  position: 'absolute',
                  color: 'error.main',
                }}
              />
              <MicOff fontSize="small" />
            </Box>
          ) : (
            <Mic />
          )}
        </IconButton>
      </Tooltip>

      {isListening && (
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            right: 0,
            mt: 1,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1.5,
            minWidth: 200,
            boxShadow: 2,
            zIndex: 1300,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Listening...
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                alignItems: 'flex-end',
              }}
            >
              {[1, 2, 3, 4].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 3,
                    bgcolor: 'primary.main',
                    borderRadius: 1,
                    animation: `pulse 0.6s ease-in-out ${i * 0.15}s infinite`,
                    '@keyframes pulse': {
                      '0%, 100%': { height: 8 },
                      '50%': { height: 16 },
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
          {transcript && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Heard:</strong> "{transcript}"
            </Typography>
          )}
        </Box>
      )}

      {error && (
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            right: 0,
            mt: 1,
            bgcolor: 'error.lighter',
            border: '1px solid',
            borderColor: 'error.main',
            borderRadius: 1,
            p: 1.5,
            minWidth: 200,
            boxShadow: 2,
            zIndex: 1300,
          }}
        >
          <Typography variant="caption" color="error.main">
            {error}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default VoiceSearch;
