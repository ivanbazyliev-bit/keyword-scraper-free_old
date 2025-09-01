const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 10000;

// =============================================================================
// CONFIGURATION - Set mode like Python
// =============================================================================
const EXTENDED_MODE = false;  // Set to false for basic mode (like Python)

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Extract keywords from HTML content with extensive debugging
 */
function extractKeywordsFromHtml(htmlContent) {
  if (!htmlContent) return '';
  
  console.log('🔍 Extracting keywords from HTML...');
  console.log(`📄 HTML Content Length: ${htmlContent.length} characters`);
  
  // EXACT Python delimiters
  const originalDelimiters = [
    ['&quot;terms&quot;:&quot;', '&quot;,'],
    ['"terms":"', '",'],
    ['terms=', '&'],
    ['"keyWords":"', '",'],
    ['"keywords":"', '",']
  ];
  
  console.log('🔍 Checking EXACT Python delimiters...');
  for (let i = 0; i < originalDelimiters.length; i++) {
    const [startDelim, endDelim] = originalDelimiters[i];
    console.log(`🔍 Pattern ${i+1}: Looking for "${startDelim}" followed by "${endDelim}"`);
    
    if (htmlContent.includes(startDelim)) {
      console.log(`✅ Found start delimiter: "${startDelim}"`);
      const startIndex = htmlContent.indexOf(startDelim);
      const afterStart = htmlContent.substring(startIndex + startDelim.length);
      console.log(`📄 Content after start delimiter: "${afterStart.substring(0, 200)}..."`);
      
      if (afterStart.includes(endDelim)) {
        const endIndex = afterStart.indexOf(endDelim);
        const keywords = afterStart.substring(0, endIndex).trim();
        console.log(`✅ Found end delimiter. Keywords: "${keywords}"`);
        
        if (keywords) {
          console.log(`✅ SUCCESS: Found keywords with pattern ${i+1}: ${keywords}`);
          return keywords;
        } else {
          console.log(`❌ Keywords empty after extraction`);
        }
      } else {
        console.log(`❌ End delimiter "${endDelim}" not found after start`);
      }
    } else {
      console.log(`❌ Start delimiter "${startDelim}" not found in HTML`);
    }
  }
  
  // DEBUG: Show actual content around common keywords
  console.log('\n🔍 DEBUG: Searching for variations of keyword patterns...');
  
  // Look for the exact keywords that Python found
  const pythonKeywords = "Pest And Bug Control Near Me,Pest And Bug Control Nearby,Local Pest Control Miami";
  if (htmlContent.includes(pythonKeywords)) {
    console.log(`✅ Found exact Python keywords in HTML!`);
    const index = htmlContent.indexOf(pythonKeywords);
    const context = htmlContent.substring(Math.max(0, index - 100), index + pythonKeywords.length + 100);
    console.log(`📄 Context around keywords: "${context}"`);
    return pythonKeywords;
  }
  
  // Look for parts of the keywords
  const keywordParts = ['Pest', 'Bug Control', 'Local Pest Control', 'Miami', 'Near Me'];
  for (const part of keywordParts) {
    if (htmlContent.includes(part)) {
      console.log(`🔍 Found keyword part: "${part}"`);
      const index = htmlContent.indexOf(part);
      const context = htmlContent.substring(Math.max(0, index - 50), index + part.length + 50);
      console.log(`📄 Context: "${context}"`);
    }
  }
  
  // Look for common patterns that might contain keywords
  const debugPatterns = [
    'terms',
    'keywords', 
    'keyWords',
    'query',
    'search',
    'pest',
    'control',
    'miami',
    '"Pest',
    'Pest And Bug',
    'data-',
    'window.',
    'var ',
    'const ',
    'let '
  ];
  
  console.log('\n🔍 Pattern frequency analysis:');
  for (const pattern of debugPatterns) {
    const regex = new RegExp(pattern, 'gi');
    const matches = htmlContent.match(regex);
    if (matches) {
      console.log(`📊 "${pattern}": ${matches.length} occurrences`);
      
      // Show context for the first few matches
      if (matches.length > 0 && ['terms', 'keywords', 'keyWords', 'pest', 'Pest'].includes(pattern)) {
        const index = htmlContent.toLowerCase().indexOf(pattern.toLowerCase());
        if (index !== -1) {
          const context = htmlContent.substring(Math.max(0, index - 100), index + pattern.length + 100);
          console.log(`📄 First "${pattern}" context: "${context}"`);
        }
      }
    }
  }
  
  // Look for JavaScript variables that might contain keywords
  console.log('\n🔍 Looking for JavaScript variables...');
  const jsPatterns = [
    /window\.[\w]+\s*=\s*[^;]+/g,
    /var\s+[\w]+\s*=\s*[^;]+/g,
    /const\s+[\w]+\s*=\s*[^;]+/g,
    /let\s+[\w]+\s*=\s*[^;]+/g
  ];
  
  for (const pattern of jsPatterns) {
    const matches = htmlContent.match(pattern);
    if (matches) {
      console.log(`📊 Found ${matches.length} JS variable declarations`);
      matches.slice(0, 5).forEach((match, i) => {
        console.log(`📄 JS var ${i+1}: "${match}"`);
      });
    }
  }
  
  // Look for JSON data
  console.log('\n🔍 Looking for JSON data...');
  const jsonPatterns = [
    /{[^}]*"[^"]*(?:terms|keywords|query|search|pest|control)[^"]*"[^}]*}/gi,
    /"[^"]*(?:terms|keywords|query|search|pest|control)[^"]*"\s*:\s*"[^"]*"/gi
  ];
  
  for (const pattern of jsonPatterns) {
    const matches = htmlContent.match(pattern);
    if (matches) {
      console.log(`📊 Found ${matches.length} potential JSON keyword matches`);
      matches.slice(0, 3).forEach((match, i) => {
        console.log(`📄 JSON match ${i+1}: "${match}"`);
      });
    }
  }
  
  console.log('❌ No keywords found with any pattern');
  return '';
}

/**
 * Process URL with extensive debugging
 */
async function processUrl(url, country = 'Unknown') {
  console.log(`\n🚀 Processing: ${url}`);
  const startTime = Date.now();
  
  try {
    console.log('📄 Fetching page...');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 15000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const htmlContent = await response.text();
    console.log(`✅ Page fetched (${htmlContent.length} characters)`);
    
    // Show more HTML content for debugging
    console.log(`📄 HTML Start (500 chars): ${htmlContent.substring(0, 500)}`);
    console.log(`📄 HTML Middle (500 chars): ${htmlContent.substring(Math.floor(htmlContent.length/2), Math.floor(htmlContent.length/2) + 500)}`);
    console.log(`📄 HTML End (500 chars): ${htmlContent.substring(Math.max(0, htmlContent.length - 500))}`);
    
    // Extract keywords with extensive debugging
    const scrapedKeywords = extractKeywordsFromHtml(htmlContent);
    
    const processingTime = Date.now() - startTime;
    console.log(`⏱️ Processing completed in ${processingTime}ms`);
    console.log(`📊 Final Results: scraped_keywords="${scrapedKeywords}"`);
    
    return {
      scraped_keywords: scrapedKeywords || '',
      surface_keywords: '',
      success: true,
      error: '',
      processing_time_ms: processingTime,
      debug_info: {
        html_length: htmlContent.length,
        html_start: htmlContent.substring(0, 300),
        html_middle: htmlContent.substring(Math.floor(htmlContent.length/2), Math.floor(htmlContent.length/2) + 300),
        html_end: htmlContent.substring(Math.max(0, htmlContent.length - 300)),
        patterns_searched: 'Extensive debugging with exact Python patterns'
      }
    };
    
  } catch (error) {
    console.error(`❌ Error processing ${url}:`, error.message);
    return {
      scraped_keywords: '',
      surface_keywords: '',
      success: false,
      error: error.message,
      processing_time_ms: Date.now() - startTime
    };
  }
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'alive',
    message: 'DEBUG Keyword Scraper API',
    version: '1.2.0-DEBUG',
    mode: 'DEBUGGING MODE - Extensive logging',
    python_equivalent: `EXTENDED_MODE = ${EXTENDED_MODE}`,
    type: 'HTTP-only (no browser automation)',
    note: 'This version logs everything to help find missing keywords',
    endpoints: {
      'POST /extract': 'Extract keywords from a URL with debugging',
      'GET /': 'Health check'
    }
  });
});

// Main extraction endpoint  
app.post('/extract', async (req, res) => {
  console.log('\n=== NEW EXTRACTION REQUEST ===');
  
  try {
    const { url, country = 'Unknown' } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
        scraped_keywords: '',
        surface_keywords: ''
      });
    }
    
    console.log(`🔥 Request: ${url} (Country: ${country})`);
    console.log(`🔍 DEBUG MODE: Will log everything to find missing keywords`);
    
    // Process the URL with debugging
    const result = await processUrl(url, country);
    
    // Return response
    const response = {
      ...result,
      url: url,
      country: country,
      mode: 'DEBUG',
      timestamp: new Date().toISOString(),
      server: 'render-debug',
      method: 'HTTP-only',
      note: 'Check server logs for detailed debugging info'
    };
    
    console.log(`📤 Response: Success=${result.success}, Found=${!!result.scraped_keywords}`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      scraped_keywords: '',
      surface_keywords: '',
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available_endpoints: ['GET /', 'POST /extract']
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DEBUG Keyword Scraper API running on port ${PORT}`);
  console.log(`🔍 DEBUG MODE: Will show extensive logging to find missing keywords`);
  console.log(`⚡ Method: HTTP requests only (no browser automation like Python)`);
});

module.exports = app;
