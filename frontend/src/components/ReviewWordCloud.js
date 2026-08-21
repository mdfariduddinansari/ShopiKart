import React, { useMemo, useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import api from '../services/api';

export default function ReviewWordCloud({ reviews, productId, color = "#0ea5a4" }) {
  const theme = useTheme();
  const [cloudData, setCloudData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch AI-analyzed keywords from backend
  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);

        if (productId) {
          // Use product-specific analysis endpoint
          const response = await api.get(`/reviews/analyze/${productId}`);
          setCloudData(response.data);
        } else if (reviews && Array.isArray(reviews) && reviews.length > 0) {
          // Use batch analysis endpoint
          const response = await api.post('/reviews/analyze-batch', { reviews });
          setCloudData(response.data);
        } else {
          setCloudData({
            keywords: [],
            summary: {
              totalReviews: 0,
              positiveKeywords: 0,
              negativeKeywords: 0,
              neutralKeywords: 0,
              overallSentiment: 'neutral'
            }
          });
        }
      } catch (err) {
        console.error('Error fetching review analysis:', err);
        setError('Unable to analyze reviews');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have productId or reviews
    if (productId || (reviews && Array.isArray(reviews) && reviews.length > 0)) {
      fetchAnalysis();
    } else {
      setLoading(false);
    }
  }, [productId, reviews]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 300,
          backgroundColor: theme.palette.mode === 'dark' ? '#262626' : '#f5f5f5',
          borderRadius: 2,
          border: `2px dashed ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} />
          <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
            Analyzing reviews...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 300,
          backgroundColor: theme.palette.mode === 'dark' ? '#262626' : '#f5f5f5',
          borderRadius: 2,
          border: `2px dashed ${theme.palette.divider}`,
        }}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const keywords = cloudData?.keywords || [];
  const summary = cloudData?.summary || {};

  // Count keywords by sentiment
  const positiveWords = keywords.filter(k => k.sentimentClass === 'positive');
  const negativeWords = keywords.filter(k => k.sentimentClass === 'negative');
  const neutralWords = keywords.filter(k => k.sentimentClass === 'neutral');

  if (!keywords || keywords.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 300,
          backgroundColor: theme.palette.mode === 'dark' ? '#262626' : '#f5f5f5',
          borderRadius: 2,
          border: `2px dashed ${theme.palette.divider}`,
        }}
      >
        <Typography color="text.secondary">No keywords to display</Typography>
      </Box>
    );
  }

  // Main keyword is the most frequent one
  const mainKeyword = keywords.length > 0 ? keywords[0] : null;
  const cloudKeywords = keywords.slice(1); // All except main
  const maxValue = cloudKeywords.length > 0 ? Math.max(...cloudKeywords.map(w => w.frequency), 1) : 1;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Sentiment Summary Stats */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Box sx={{ 
          px: 1.5, 
          py: 0.5, 
          borderRadius: 1, 
          bgcolor: '#e8f5e9', 
          border: '1px solid #4caf50',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5
        }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4caf50' }} />
          <Typography variant="caption" fontWeight={700} sx={{ color: '#2e7d32', fontSize: '0.7rem' }}>
            Positive: {positiveWords.length}
          </Typography>
        </Box>
        <Box sx={{ 
          px: 1.5, 
          py: 0.5, 
          borderRadius: 1, 
          bgcolor: '#fff3e0', 
          border: '1px solid #ff9800',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5
        }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ff9800' }} />
          <Typography variant="caption" fontWeight={700} sx={{ color: '#e65100', fontSize: '0.7rem' }}>
            Neutral: {neutralWords.length}
          </Typography>
        </Box>
        <Box sx={{ 
          px: 1.5, 
          py: 0.5, 
          borderRadius: 1, 
          bgcolor: '#ffebee', 
          border: '1px solid #f44336',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5
        }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f44336' }} />
          <Typography variant="caption" fontWeight={700} sx={{ color: '#c62828', fontSize: '0.7rem' }}>
            Negative: {negativeWords.length}
          </Typography>
        </Box>
      </Box>

      {/* Word Cloud Container */}
      <Box
      sx={{
        position: 'relative',
        width: '100%',
        flex: 1,
        minHeight: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.mode === 'dark' ? '#262626' : '#fafafa',
          borderRadius: 2,
          border: `2px solid ${theme.palette.divider}`,
          overflow: 'visible',
          pointerEvents: 'auto',
          p: 3,
        }}
      >
      {/* Main Keyword - Centered */}
      {mainKeyword && (
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              fontSize: '48px',
              fontWeight: 900,
              color: mainKeyword.color,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textShadow: `0 4px 12px ${mainKeyword.color}33`,
              '&:hover': {
                transform: 'scale(1.1)',
                textShadow: `0 6px 16px ${mainKeyword.color}66`,
              },
              whiteSpace: 'nowrap',
            }}
          >
            {mainKeyword.text}
          </Box>
          <Box
            sx={{
              fontSize: '12px',
              color: theme.palette.text.secondary,
              mt: 1,
              fontWeight: 500,
            }}
          >
            Appears {mainKeyword.frequency} time{mainKeyword.frequency > 1 ? 's' : ''} • 
            <Box
              component="span"
              sx={{
                ml: 0.5,
                fontWeight: 700,
                color: mainKeyword.color,
              }}
            >
              {mainKeyword.sentimentClass.charAt(0).toUpperCase() + mainKeyword.sentimentClass.slice(1)}
            </Box>
          </Box>
        </Box>
      )}

      {/* Word Cloud - All Keywords Around Main with Collision Detection */}
      {cloudKeywords.length > 0 && (() => {
        // Calculate positions with collision detection
        const positions = [];
        const cellSize = 8; // Grid cell for spatial hashing
        const occupiedCells = new Set();
        
        const getWordsAtCell = (x, y, width, height) => {
          const cells = new Set();
          const minCellX = Math.floor((x - width / 2) / cellSize);
          const maxCellX = Math.floor((x + width / 2) / cellSize);
          const minCellY = Math.floor((y - height / 2) / cellSize);
          const maxCellY = Math.floor((y + height / 2) / cellSize);
          
          for (let cx = minCellX; cx <= maxCellX; cx++) {
            for (let cy = minCellY; cy <= maxCellY; cy++) {
              cells.add(`${cx},${cy}`);
            }
          }
          return cells;
        };
        
        const isColliding = (x, y, width, height) => {
          const cells = getWordsAtCell(x, y, width, height);
          for (const cell of cells) {
            if (occupiedCells.has(cell)) return true;
          }
          return false;
        };
        
        const markOccupied = (x, y, width, height) => {
          const cells = getWordsAtCell(x, y, width, height);
          cells.forEach(cell => occupiedCells.add(cell));
        };

        cloudKeywords.forEach((word, idx) => {
          const sizeRatio = word.frequency / maxValue;
          let fontSize = 11 + sizeRatio * 14; // Tighter range: 11px to 25px
          let estimatedWidth = fontSize * word.text.length * 0.6;
          let estimatedHeight = fontSize * 1.4;
          
          const total = cloudKeywords.length;
          const angle = (idx / total) * Math.PI * 2;
          const baseRadius = 100 + (idx % 3) * 20; // Tighter radii: 100, 120, 140
          let x = Math.cos(angle) * baseRadius;
          let y = Math.sin(angle) * baseRadius;
          
          let collision = isColliding(x, y, estimatedWidth, estimatedHeight);
          let attempts = 0;
          
          // Try alternative positions if collision detected
          while (collision && attempts < 8) {
            const offsetAngle = angle + (attempts + 1) * (Math.PI / 4);
            const offsetRadius = baseRadius - (attempts + 1) * 15;
            x = Math.cos(offsetAngle) * Math.max(offsetRadius, 70);
            y = Math.sin(offsetAngle) * Math.max(offsetRadius, 70);
            collision = isColliding(x, y, estimatedWidth, estimatedHeight);
            attempts++;
          }
          
          // If still colliding, reduce font size
          if (collision) {
            fontSize = Math.max(8, fontSize * 0.75);
            estimatedWidth = fontSize * word.text.length * 0.6;
            estimatedHeight = fontSize * 1.4;
          }
          
          markOccupied(x, y, estimatedWidth, estimatedHeight);
          positions.push({ word, x, y, fontSize });
        });
        
        return (
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              left: 0,
              top: 0,
              overflow: 'visible',
            }}
          >
            {positions.map((pos, idx) => (
              <Box
                key={idx}
                component="span"
                sx={{
                  position: 'absolute',
                  fontSize: `${pos.fontSize}px`,
                  fontWeight: 700,
                  color: pos.word.color,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: 0.75,
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  textOverflow: 'visible',
                  wordBreak: 'keep-all',
                  zIndex: 5,
                  pointerEvents: 'auto',
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                  '&:hover': {
                    opacity: 1,
                    zIndex: 15,
                    textShadow: `0 2px 8px ${pos.word.color}44`,
                    transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(1.15)`,
                  },
                  title: `${pos.word.sentimentClass.charAt(0).toUpperCase() + pos.word.sentimentClass.slice(1)} - Frequency: ${pos.word.frequency}`,
                }}
              >
                {pos.word.text}
              </Box>
            ))}
          </Box>
        );
      })()}

      {/* Gradient overlay for depth */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.03) 100%)',
          pointerEvents: 'none',
          borderRadius: 2,
        }}
      />
      </Box>
      </Box>

      {/* Sentiment Distribution Bar */}
      <Box sx={{ mt: 2, px: 1 }}>
        <Box sx={{ display: 'flex', height: 8, borderRadius: 1, overflow: 'hidden', bgcolor: '#e0e0e0' }}>
          {positiveWords.length > 0 && (
            <Box 
              sx={{ 
                flex: positiveWords.length, 
                bgcolor: '#4caf50',
                transition: 'all 0.5s ease'
              }} 
            />
          )}
          {neutralWords.length > 0 && (
            <Box 
              sx={{ 
                flex: neutralWords.length, 
                bgcolor: '#ff9800',
                transition: 'all 0.5s ease'
              }} 
            />
          )}
          {negativeWords.length > 0 && (
            <Box 
              sx={{ 
                flex: negativeWords.length, 
                bgcolor: '#f44336',
                transition: 'all 0.5s ease'
              }} 
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 700, fontSize: '0.65rem' }}>
            {Math.round((positiveWords.length / keywords.length) * 100)}%
          </Typography>
          <Typography variant="caption" sx={{ color: '#ff9800', fontWeight: 700, fontSize: '0.65rem' }}>
            {Math.round((neutralWords.length / keywords.length) * 100)}%
          </Typography>
          <Typography variant="caption" sx={{ color: '#f44336', fontWeight: 700, fontSize: '0.65rem' }}>
            {Math.round((negativeWords.length / keywords.length) * 100)}%
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
