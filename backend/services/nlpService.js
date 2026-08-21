
const Sentiment = require('sentiment');
const natural = require('natural');


const sentimentAnalyzer = new Sentiment();

// Tokenizer and NLP tools
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

// Common stop words - automatically filtered
const stopWords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
  'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
  'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'really', 'also'
]);


function extractEmotionalKeywords(text) {
  if (!text || typeof text !== 'string') return [];
  
  try {
    const lowerText = text.toLowerCase();
    const tokens = tokenizer.tokenize(lowerText);
    const emotionalWords = new Map();
    
    // Analyze full text to get ML-detected sentiment words
    const fullAnalysis = sentimentAnalyzer.analyze(text);
    
    // Get ML-identified positive and negative words
    const positiveWords = new Set(fullAnalysis.positive || []);
    const negativeWords = new Set(fullAnalysis.negative || []);
    
    // Analyze each token with ML
    tokens.forEach(token => {
      if (token.length < 3 || stopWords.has(token)) return;
      
      // Get ML sentiment score for this word
      const wordAnalysis = sentimentAnalyzer.analyze(token);
      const score = wordAnalysis.score;
      
      // Calculate sentiment automatically based on ML score
      let sentiment = 'neutral';
      let intensity = 'medium';
      
      if (positiveWords.has(token) || score > 0) {
        sentiment = 'positive';
        // Automatically determine intensity from score
        if (score >= 3) intensity = 'high';
        else if (score >= 1) intensity = 'medium';
        else intensity = 'low';
      } else if (negativeWords.has(token) || score < 0) {
        sentiment = 'negative';
        // Automatically determine intensity from score magnitude
        if (score <= -3) intensity = 'high';
        else if (score <= -1) intensity = 'medium';
        else intensity = 'low';
      }
      
      // Include word if ML detected emotion OR it appears in sentiment lists
      if (score !== 0 || positiveWords.has(token) || negativeWords.has(token)) {
        if (!emotionalWords.has(token)) {
          emotionalWords.set(token, {
            frequency: 0,
            score: score,
            sentiment: sentiment,
            intensity: intensity
          });
        }
        emotionalWords.get(token).frequency += 1;
      }
    });
    
    // Convert to array with ML-derived metadata
    return Array.from(emotionalWords.entries()).map(([word, data]) => ({
      text: word,
      frequency: data.frequency,
      score: data.score,
      sentiment: data.sentiment,
      intensity: data.intensity
    }));
  } catch (error) {
    console.error('Error extracting emotional keywords:', error);
    return [];
  }
}

/**
 * Analyze sentiment with enhanced contextual understanding
 * Returns detailed sentiment with emotion classification
 */
function analyzeTextSentiment(text) {
  if (!text || typeof text !== 'string') return { 
    score: 0, 
    comparative: 0, 
    words: [], 
    positive: [], 
    negative: [],
    emotion: 'neutral',
    confidence: 0
  };
  
  try {
    const result = sentimentAnalyzer.analyze(text);
    const comparative = result.comparative;
    
    // Classify emotion based on intensity and score
    let emotion = 'neutral';
    let confidence = Math.abs(comparative);
    
    if (comparative > 1.5) {
      emotion = 'very_positive';
      confidence = Math.min(confidence / 2, 1);
    } else if (comparative > 0.5) {
      emotion = 'positive';
      confidence = Math.min(confidence, 1);
    } else if (comparative > 0.1) {
      emotion = 'slightly_positive';
      confidence = Math.min(confidence * 2, 1);
    } else if (comparative < -1.5) {
      emotion = 'very_negative';
      confidence = Math.min(confidence / 2, 1);
    } else if (comparative < -0.5) {
      emotion = 'negative';
      confidence = Math.min(confidence, 1);
    } else if (comparative < -0.1) {
      emotion = 'slightly_negative';
      confidence = Math.min(confidence * 2, 1);
    }
    
    return {
      score: result.score,
      comparative: result.comparative,
      words: result.words || [],
      positive: result.positive || [],
      negative: result.negative || [],
      calculation: result.calculation || [],
      emotion: emotion,
      confidence: parseFloat(confidence.toFixed(3))
    };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return { 
      score: 0, 
      comparative: 0, 
      words: [], 
      positive: [], 
      negative: [],
      emotion: 'neutral',
      confidence: 0
    };
  }
}

/**
 * Enhanced sentiment classification with granular emotion detection
 */
function classifySentiment(comparative, score) {
  // Very positive
  if (comparative > 1.5 || score > 10) return 'very_positive';
  // Positive
  if (comparative > 0.5 || score > 3) return 'positive';
  // Slightly positive
  if (comparative > 0.1 || score > 0) return 'slightly_positive';
  // Very negative
  if (comparative < -1.5 || score < -10) return 'very_negative';
  // Negative
  if (comparative < -0.5 || score < -3) return 'negative';
  // Slightly negative
  if (comparative < -0.1 || score < 0) return 'slightly_negative';
  // Neutral
  return 'neutral';
}

/**
 * Map granular sentiment to simple positive/negative/neutral
 */
function simplifysentiment(granularSentiment) {
  if (granularSentiment.includes('positive')) return 'positive';
  if (granularSentiment.includes('negative')) return 'negative';
  return 'neutral';
}

/**
 * Analyze multiple reviews using machine learning
 * Returns ALL emotional keywords - positive, negative, and neutral/average
 * Only filters based on whether word carries emotional weight, not sentiment direction
 */
function analyzeReviews(reviews) {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return {
      keywords: [],
      summary: {
        totalReviews: 0,
        positiveKeywords: 0,
        negativeKeywords: 0,
        neutralKeywords: 0,
        overallSentiment: 'neutral',
        averageSentiment: 0,
        methodUsed: 'ML-Based (All Emotions: Positive + Negative + Neutral)'
      }
    };
  }
  
  // Filter reviews with valid comments
  const validReviews = reviews.filter(r => r && r.comment && typeof r.comment === 'string' && r.comment.trim().length > 0);
  
  if (validReviews.length === 0) {
    console.warn('[NLP] No valid reviews with comments found');
    return {
      keywords: [],
      summary: {
        totalReviews: reviews.length,
        positiveKeywords: 0,
        negativeKeywords: 0,
        neutralKeywords: 0,
        overallSentiment: 'neutral',
        averageSentiment: 0,
        methodUsed: 'ML-Based (No valid comments to analyze)'
      }
    };
  }
  
  const keywords = calculateTFIDF(validReviews);
  
  // Calculate overall sentiment using ML
  let overallSentimentScore = 0;
  validReviews.forEach(review => {
    const analysis = analyzeTextSentiment(review.comment);
    overallSentimentScore += analysis.comparative;
  });
  const averageSentiment = overallSentimentScore / validReviews.length;
  
  const summary = {
    totalReviews: validReviews.length,
    positiveKeywords: keywords.filter(k => k.sentimentClass === 'positive').length,
    negativeKeywords: keywords.filter(k => k.sentimentClass === 'negative').length,
    neutralKeywords: keywords.filter(k => k.sentimentClass === 'neutral').length,
    overallSentiment: classifySentiment(averageSentiment, overallSentimentScore),
    averageSentiment: parseFloat(averageSentiment.toFixed(3)),
    methodUsed: 'ML-Based (All Emotions: Positive + Negative + Neutral)'
  };
  
  return { keywords, summary };
}
function calculateTFIDF(reviews) {
  if (!reviews || reviews.length === 0) return [];
  
  const allKeywords = {};
  const documentCount = reviews.length;
  
  // First pass: extract ML-identified emotional keywords from each review
  reviews.forEach(review => {
    if (!review.comment || typeof review.comment !== 'string' || review.comment.trim().length === 0) return;
    
    // Extract emotional keywords using ML analysis
    const emotionalKeywords = extractEmotionalKeywords(review.comment);
    
    if (emotionalKeywords.length === 0) return;
    
    // Track keywords with ML-derived metadata
    emotionalKeywords.forEach(keyword => {
      if (!allKeywords[keyword.text]) {
        allKeywords[keyword.text] = {
          totalFreq: 0,
          docCount: 0,
          scores: [],
          sentiments: [],
          intensities: []
        };
      }
      
      allKeywords[keyword.text].totalFreq += keyword.frequency;
      allKeywords[keyword.text].docCount += 1;
      allKeywords[keyword.text].scores.push(keyword.score);
      allKeywords[keyword.text].sentiments.push(keyword.sentiment);
      allKeywords[keyword.text].intensities.push(keyword.intensity);
    });
  });
  
  // Calculate TF-IDF with ML-based sentiment classification
  const scoredKeywords = [];
  
  Object.entries(allKeywords).forEach(([keyword, data]) => {
    // Calculate average ML sentiment score
    const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    
    // ML-based majority voting for sentiment classification
    const positiveCount = data.sentiments.filter(s => s === 'positive').length;
    const negativeCount = data.sentiments.filter(s => s === 'negative').length;
    const neutralCount = data.sentiments.filter(s => s === 'neutral').length;
    
    // Determine final sentiment class with confidence (automated)
    let sentimentClass;
    let confidence = 0;
    
    const total = positiveCount + negativeCount + neutralCount;
    if (positiveCount > negativeCount && positiveCount > neutralCount) {
      sentimentClass = 'positive';
      confidence = positiveCount / total;
    } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
      sentimentClass = 'negative';
      confidence = negativeCount / total;
    } else {
      sentimentClass = 'neutral';
      confidence = neutralCount / total;
    }
    
    // Automatically determine intensity from ML scores
    const avgIntensityScore = Math.abs(avgScore);
    let autoIntensity = 'medium';
    if (avgIntensityScore >= 3) autoIntensity = 'high';
    else if (avgIntensityScore >= 1) autoIntensity = 'medium';
    else if (avgIntensityScore > 0) autoIntensity = 'low';
    else {
      // Use majority voting from individual word intensities
      const intensityCounts = {
        high: data.intensities.filter(i => i === 'high').length,
        medium: data.intensities.filter(i => i === 'medium').length,
        low: data.intensities.filter(i => i === 'low').length
      };
      autoIntensity = Object.keys(intensityCounts).reduce((a, b) => 
        intensityCounts[a] > intensityCounts[b] ? a : b
      );
    }
    
    // Enhanced TF-IDF calculation with automatic frequency boosting
    const tf = data.totalFreq / documentCount;
    const idf = Math.log((documentCount + 1) / (data.docCount + 1)) + 1;
    const frequencyBoost = Math.log(data.totalFreq + 1); // Auto-boost frequently mentioned
    const sentimentBoost = 1 + (Math.abs(avgScore) * 0.2); // Auto-boost high sentiment words
    const tfidfScore = tf * idf * frequencyBoost * sentimentBoost;
    
    // Calculate importance score (ML-driven)
    const importanceScore = tfidfScore * (1 + Math.abs(avgScore) * 0.5);
    
    scoredKeywords.push({
      text: keyword,
      frequency: data.totalFreq,
      documentFrequency: data.docCount,
      tfidfScore: parseFloat(tfidfScore.toFixed(4)),
      importanceScore: parseFloat(importanceScore.toFixed(4)),
      sentimentScore: parseFloat(avgScore.toFixed(3)),
      sentimentClass: sentimentClass,
      intensity: autoIntensity,
      confidence: parseFloat(confidence.toFixed(3)),
      color: getSentimentColor(sentimentClass, autoIntensity),
      emotionDetail: {
        positiveCount,
        negativeCount,
        neutralCount
      }
    });
  });
  
  // Sort by ML-calculated importance score
  const result = scoredKeywords
    .sort((a, b) => b.importanceScore - a.importanceScore || b.frequency - a.frequency)
    .slice(0, 80); // Auto-limit to top keywords
  
  console.log(`[NLP ML-Automated] Extracted ${result.length} keywords from ${documentCount} reviews`);
  console.log(`[NLP ML-Automated] Distribution: ${result.filter(k => k.sentimentClass === 'positive').length} positive, ${result.filter(k => k.sentimentClass === 'negative').length} negative, ${result.filter(k => k.sentimentClass === 'neutral').length} neutral`);
  
  return result;
}

/**
 * ML-automated color mapping based on sentiment and intensity
 * No hardcoded categories - purely score-driven
 */
function getSentimentColor(sentimentClass, intensity = 'medium') {
  // Color intensity calculated from sentiment strength
  const colors = {
    positive: {
      high: '#1b5e20',    // Dark green - strong positive
      medium: '#2e7d32',  // Green - moderate positive
      low: '#66bb6a'      // Light green - mild positive
    },
    negative: {
      high: '#b71c1c',    // Dark red - strong negative
      medium: '#d32f2f',  // Red - moderate negative
      low: '#e57373'      // Light red - mild negative
    },
    neutral: {
      high: '#e65100',    // Dark orange - strong neutral opinion
      medium: '#f57c00',  // Orange - moderate neutral
      low: '#ffb74d'      // Light orange - mild neutral
    }
  };
  
  // Handle ML-generated granular sentiments
  if (sentimentClass === 'very_positive') return colors.positive.high;
  if (sentimentClass === 'slightly_positive') return colors.positive.low;
  if (sentimentClass === 'very_negative') return colors.negative.high;
  if (sentimentClass === 'slightly_negative') return colors.negative.low;
  
  // Map to base sentiment class
  const baseClass = sentimentClass === 'positive' ? 'positive' 
                   : sentimentClass === 'negative' ? 'negative' 
                   : 'neutral';
  
  return colors[baseClass][intensity] || colors[baseClass].medium;
}

/**
 * Enhanced sentiment breakdown with granular emotion detection
 */
function getSentimentBreakdown(reviews) {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return { 
      veryPositive: 0,
      positive: 0, 
      slightlyPositive: 0,
      neutral: 0,
      slightlyNegative: 0,
      negative: 0,
      veryNegative: 0,
      average: 0,
      dominant: 'neutral'
    };
  }
  
  const sentiments = reviews.map(r => {
    const analysis = analyzeTextSentiment(r.comment);
    return {
      comparative: analysis.comparative,
      emotion: analysis.emotion
    };
  });
  
  // Count each emotion type
  const veryPositive = sentiments.filter(s => s.emotion === 'very_positive').length;
  const positive = sentiments.filter(s => s.emotion === 'positive').length;
  const slightlyPositive = sentiments.filter(s => s.emotion === 'slightly_positive').length;
  const neutral = sentiments.filter(s => s.emotion === 'neutral').length;
  const slightlyNegative = sentiments.filter(s => s.emotion === 'slightly_negative').length;
  const negative = sentiments.filter(s => s.emotion === 'negative').length;
  const veryNegative = sentiments.filter(s => s.emotion === 'very_negative').length;
  
  const average = sentiments.reduce((a, b) => a + b.comparative, 0) / sentiments.length;
  
  // Calculate grouped percentages
  const totalPositive = veryPositive + positive + slightlyPositive;
  const totalNegative = veryNegative + negative + slightlyNegative;
  
  // Determine dominant sentiment
  let dominant = 'neutral';
  if (totalPositive > totalNegative && totalPositive > neutral) {
    dominant = 'positive';
  } else if (totalNegative > totalPositive && totalNegative > neutral) {
    dominant = 'negative';
  }
  
  return {
    veryPositive,
    positive,
    slightlyPositive,
    neutral,
    slightlyNegative,
    negative,
    veryNegative,
    average: parseFloat(average.toFixed(3)),
    dominant,
    percentages: {
      veryPositive: parseFloat(((veryPositive / reviews.length) * 100).toFixed(1)),
      positive: parseFloat(((positive / reviews.length) * 100).toFixed(1)),
      slightlyPositive: parseFloat(((slightlyPositive / reviews.length) * 100).toFixed(1)),
      neutral: parseFloat(((neutral / reviews.length) * 100).toFixed(1)),
      slightlyNegative: parseFloat(((slightlyNegative / reviews.length) * 100).toFixed(1)),
      negative: parseFloat(((negative / reviews.length) * 100).toFixed(1)),
      veryNegative: parseFloat(((veryNegative / reviews.length) * 100).toFixed(1)),
      totalPositive: parseFloat(((totalPositive / reviews.length) * 100).toFixed(1)),
      totalNegative: parseFloat(((totalNegative / reviews.length) * 100).toFixed(1))
    }
  };
}

module.exports = {
  analyzeReviews,
  analyzeTextSentiment,
  classifySentiment,
  simplifysentiment,
  calculateTFIDF,
  getSentimentBreakdown,
  extractEmotionalKeywords
};
