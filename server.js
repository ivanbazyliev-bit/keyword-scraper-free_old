const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

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
 * Extract keywords from HTML content (exact Python logic)
 */
function extractKeywordsFromHtml(htmlContent) {
  if (!htmlContent) return '';
  
  console.log('🔍 Extracting keywords from HTML...');
  
  // Same delimiters as your Python version
  const delimiters = [
    ['&quot;terms&quot;:&quot;', '&quot;,'],
    ['"terms":"', '",'],
    ['terms=', '&'],
    ['"keyWords":"', '",'],
    ['"keywords":"', '",']
  ];
  
  for (const [startDelim, endDelim] of delimiters) {
    try {
      if (htmlContent.includes(startDelim)) {
        const startIndex = htmlContent.indexOf(startDelim);
        if (startIndex !== -1) {
          const afterStart = htmlContent.substring(startIndex + startDelim.length);
          const endIndex = afterStart.indexOf(endDelim);
          if (endIndex !== -1) {
            const keywords = afterStart.substring(0, endIndex).trim();
            if (keywords) {
              console.log(`✅ Found HTML keywords using pattern ${startDelim}: ${keywords.substring(0, 50)}...`);
              return keywords;
            }
          }
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  console.log('❌ No HTML keywords found');
  return '';
}

/**
 * Accept cookies on page (same as Python accept_cookies)
 */
async function acceptCookies(page) {
  console.log('🍪 Attempting to accept cookies...');
  
  const selectors = [
    'button:has-text("Accept")',
    'button:has-text("Agree")', 
    'button:has-text("OK")',
    'button:has-text("Allow")',
    'a:has-text("Accept")',
    'button[class*="accept"]',
    'button[class*="agree"]',
    'button[class*="consent"]',
    '[id*="accept"]',
    '[id*="consent"]'
  ];
  
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 3000 });
      const element = await page.$(selector);
      if (element) {
        await element.click();
        await page.waitForTimeout(1000);
        console.log('✅ Cookie dialog accepted');
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  
  console.log('ℹ️ No cookie dialog found');
  return false;
}

/**
 * Extract surface keywords from spans (only used in EXTENDED_MODE)
 */
async function extractSurfaceKeywords(page) {
  if (!EXTENDED_MODE) {
    return '';
  }

  console.log('🎯 Extracting surface keywords from spans...');
  
  const kValues = {};
  
  try {
    // Return to main content (same as Python)
    await page.bringToFront();
    
    // Wait for iframe with ID 'master-1' (exact Python logic)
    try {
      console.log('🔍 Looking for iframe #master-1...');
      await page.waitForSelector('#master-1', { timeout: 10000 });
      
      const iframeElement = await page.$('#master-1');
      if (!iframeElement) {
        console.log('❌ Iframe element not found');
        return '';
      }
      
      // Switch to found iframe (same as Python)
      const iframe = await iframeElement.contentFrame();
      if (!iframe) {
        console.log('❌ Could not access iframe content');
        return '';
      }
      
      console.log('✅ Successfully accessed iframe');
      await page.waitForTimeout(2000);
      
      // Search for elements with class "p_.si34.span" (exact Python selector)
      console.log('🔍 Looking for .p_.si34.span elements...');
      const elements = await iframe.$$('.p_.si34.span');
      console.log(`📊 Found ${elements.length} span elements`);
      
      // Take max 10 elements (same as Python)
      const limitedElements = elements.slice(0, 10);
      
      // Create k1, k2, ..., k10 (exact Python logic)
      for (let i = 0; i < 10; i++) {
        if (i < limitedElements.length) {
          try {
            const text = await limitedElements[i].evaluate(el => el.innerText || el.textContent);
            kValues[`k${i + 1}`] = text ? text.trim() : '';
            if (text && text.trim()) {
              console.log(`🔍 k${i + 1}: ${text.trim()}`);
            }
          } catch (error) {
            kValues[`k${i + 1}`] = '';
          }
        } else {
          kValues[`k${i + 1}`] = '';
        }
      }
      
    } catch (error) {
      console.log(`❌ Error working with iframe: ${error.message}`);
      // Fill with empty values (same as Python)
      for (let i = 1; i <= 10; i++) {
        kValues[`k${i}`] = '';
      }
    }
    
  } catch (error) {
    console.log(`❌ Error in extractSurfaceKeywords: ${error.message}`);
    // Fill with empty values (same as Python)
    for (let i = 1; i <= 10; i++) {
      kValues[`k${i}`] = '';
    }
  }
  
  // Collect span keywords into one string separated by commas (exact Python logic)
  const spanKeywordsList = [];
  for (let i = 1; i <= 10; i++) {
    const value = kValues[`k${i}`] || '';
    if (value.trim()) {
      spanKeywordsList.push(value.trim());
    }
  }
  
  const keywordsSpanString = spanKeywordsList.join(', ');
  
  if (keywordsSpanString) {
    console.log(`✅ Surface keywords result: ${keywordsSpanString}`);
  } else {
    console.log('❌ No surface keywords found');
  }
  
  return keywordsSpanString;
}

/**
 * Process URL with Puppeteer (exactly like Python with Playwright)
 */
async function processUrl(url, country = 'Unknown') {
  console.log(`\n🚀 Processing: ${url}`);
  console.log(`📋 Mode: ${EXTENDED_MODE ? 'EXTENDED' : 'BASIC'} (Python equivalent: EXTENDED_MODE=${EXTENDED_MODE})`);
  const startTime = Date.now();
  
  // Browser configuration (same as your Python args)
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--memory-pressure-off',
      '--max-old-space-size=512',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-images', // Speed up loading
    ]
  });
  
  let page;
  
  try {
    page = await browser.newPage();
    
    // Set user agent (same as Python)
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set viewport (same as Python)
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set timeout (15 seconds like Python BROWSER_TIMEOUT)
    page.setDefaultTimeout(15000);
    
    // Load the page with timeout (same as Python)
    try {
      console.log('📄 Loading page...');
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 15000 
      });
      
      // CRITICAL: Wait for JavaScript to load content (like Python)
      console.log('⏳ Waiting for JavaScript content to load...');
      await page.waitForTimeout(5000); // Wait 5 seconds for JS to inject keywords
      
      console.log('✅ Page loaded successfully');
    } catch (timeoutError) {
      console.log(`⏰ Timeout loading URL ${url}: ${timeoutError.message}`);
      return {
        scraped_keywords: '',
        surface_keywords: '',
        success: false,
        error: 'Timeout loading page',
        processing_time_ms: Date.now() - startTime
      };
    }
    
    try {
      // Get original keywords from HTML AFTER JavaScript execution (same as Python)
      console.log('📊 Getting page source after JavaScript execution...');
      const pageSource = await page.content();
      console.log(`📄 Page source length after JS: ${pageSource.length} characters`);
      
      let keywordsOriginal = extractKeywordsFromHtml(pageSource);
      
      // Get span keywords only in EXTENDED_MODE (like Python)
      let keywordsSpanString = '';
      if (EXTENDED_MODE) {
        console.log('📋 EXTENDED_MODE=true: extracting surface keywords...');
        keywordsSpanString = await extractSurfaceKeywords(page);
      } else {
        console.log('📋 EXTENDED_MODE=false: skipping surface keywords (basic mode like Python)');
      }
      
      // If nothing found - try cookies (same as Python logic)
      if (!keywordsOriginal && (EXTENDED_MODE ? !keywordsSpanString : true)) {
        console.log('🔄 No keywords found, trying cookie acceptance...');
        await acceptCookies(page);
        await page.waitForTimeout(2000);
        
        // Try again after accepting cookies
        const newPageSource = await page.content();
        keywordsOriginal = extractKeywordsFromHtml(newPageSource);
        
        if (EXTENDED_MODE) {
          keywordsSpanString = await extractSurfaceKeywords(page);
        }
      }
      
      const processingTime = Date.now() - startTime;
      
      // Log results (same as Python)
      if (keywordsOriginal) {
        console.log(`✅ Found scraped keywords: ${keywordsOriginal.substring(0, 100)}...`);
      }
      if (EXTENDED_MODE && keywordsSpanString) {
        console.log(`✅ Found surface keywords: ${keywordsSpanString.substring(0, 100)}...`);
      }
      
      if (!keywordsOriginal && (EXTENDED_MODE ? !keywordsSpanString : true)) {
        console.log(`❌ No keywords found for URL: ${url}`);
      }
      
      console.log(`⏱️ Processing completed in ${processingTime}ms`);
      
      return {
        scraped_keywords: keywordsOriginal || '',
        surface_keywords: keywordsSpanString || '',
        success: true,
        error: '',
        processing_time_ms: processingTime,
        mode: EXTENDED_MODE ? 'EXTENDED' : 'BASIC',
        method: 'Puppeteer (like Python Playwright)'
      };
      
    } catch (innerError) {
      console.log(`❌ Error extracting keywords: ${innerError.message}`);
      return {
        scraped_keywords: '',
        surface_keywords: '',
        success: false,
        error: innerError.message,
        processing_time_ms: Date.now() - startTime
      };
    }
    
  } catch (error) {
    console.log(`❌ General error processing URL: ${error.message}`);
    return {
      scraped_keywords: '',
      surface_keywords: '',
      success: false,
      error: error.message,
      processing_time_ms: Date.now() - startTime
    };
  } finally {
    if (page) await page.close();
    await browser.close();
    console.log('🧹 Browser closed');
  }
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'alive',
    message: 'Puppeteer-Based Keyword Scraper API',
    version: '2.0.0',
    mode: EXTENDED_MODE ? 'EXTENDED (scraped + surface keywords)' : 'BASIC (scraped keywords only)',
    python_equivalent: `EXTENDED_MODE = ${EXTENDED_MODE}`,
    type: 'Browser automation with Puppeteer (like Python Playwright)',
    note: 'Now uses browser automation to execute JavaScript like Python',
    endpoints: {
      'POST /extract': 'Extract keywords from a URL using browser automation',
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
    
    // Validate URL
    try {
      new URL(url);
    } catch (urlError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
        scraped_keywords: '',
        surface_keywords: ''
      });
    }
    
    console.log(`🔥 Request: ${url} (Country: ${country})`);
    console.log(`📋 Mode: ${EXTENDED_MODE ? 'EXTENDED' : 'BASIC'} (like Python EXTENDED_MODE=${EXTENDED_MODE})`);
    console.log(`🤖 Method: Puppeteer browser automation (like Python Playwright)`);
    
    // Process the URL with Puppeteer
    const result = await processUrl(url, country);
    
    // Return response
    const response = {
      ...result,
      url: url,
      country: country,
      mode: EXTENDED_MODE ? 'EXTENDED' : 'BASIC',
      timestamp: new Date().toISOString(),
      server: 'render-puppeteer',
      method: 'Puppeteer browser automation'
    };
    
    console.log(`📤 Response: Success=${result.success}, Scraped=${!!result.scraped_keywords}, Surface=${!!result.surface_keywords}`);
    
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
  console.log(`🚀 Puppeteer-Based Keyword Scraper API running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}`);
  console.log(`📊 Extract endpoint: POST http://localhost:${PORT}/extract`);
  console.log(`📋 Mode: ${EXTENDED_MODE ? 'EXTENDED' : 'BASIC'} (Python equivalent: EXTENDED_MODE = ${EXTENDED_MODE})`);
  console.log(`🤖 Method: Puppeteer browser automation (matches Python Playwright approach)`);
});

module.exports = app;
