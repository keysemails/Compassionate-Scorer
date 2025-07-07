// API Configuration (will be managed by settings)
let GEMINI_API_KEY = 'AIzaSyAM6lEnvvWnDiy4g1t6jDriW7kGilS2zFM';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// Global variables
let analysisResults = {
    totalScore: 0,
    starRating: 0,
    confidence: 0,
    summary: '',
    breakdown: [],
    findings: []
};

// Tab management
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked nav tab
    event.target.classList.add('active');
}

// API Key Management
function saveApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    if (!apiKey) {
        alert('Please enter an API key');
        return;
    }
    
    // Validate API key format
    if (!apiKey.startsWith('AIza') || apiKey.length < 35) {
        alert('Invalid API key format. Please check your key.');
        return;
    }
    
    localStorage.setItem('gemini_api_key', apiKey);
    GEMINI_API_KEY = apiKey;
    updateApiStatus();
    alert('API key saved successfully!');
}

function clearApiKey() {
    localStorage.removeItem('gemini_api_key');
    GEMINI_API_KEY = '';
    document.getElementById('apiKeyInput').value = '';
    updateApiStatus();
    alert('API key cleared!');
}

function loadApiKey() {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        GEMINI_API_KEY = savedKey;
        document.getElementById('apiKeyInput').value = savedKey;
    }
    updateApiStatus();
}

function updateApiStatus() {
    const statusDiv = document.getElementById('apiStatus');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const analyzeButton = document.getElementById('analyzeButton');

    if (GEMINI_API_KEY) {
        statusDiv.className = 'api-status connected';
        statusIndicator.className = 'status-indicator status-connected';
        statusText.textContent = 'API Status: Connected ✓';
        analyzeButton.disabled = false;
        analyzeButton.style.opacity = '1';
    } else {
        statusDiv.className = 'api-status disconnected';
        statusIndicator.className = 'status-indicator status-disconnected';
        statusText.textContent = 'API Status: No API Key ✗';
        analyzeButton.disabled = true;
        analyzeButton.style.opacity = '0.5';
    }
}

async function testApiConnection() {
    if (!GEMINI_API_KEY) {
        alert('Please save an API key first');
        return;
    }

    const testBtn = event.target;
    const originalText = testBtn.textContent;
    testBtn.textContent = '🔄 Testing...';
    testBtn.disabled = true;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Hello, respond with just "API working"'
                    }]
                }]
            })
        });

        console.log('Test API Response Status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Test API Response:', data);
            alert('✅ API connection successful!');
        } else {
            const errorText = await response.text();
            console.error('Test API Error:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('Test API Error:', error);
        alert(`❌ API connection failed: ${error.message}`);
    } finally {
        testBtn.textContent = originalText;
        testBtn.disabled = false;
    }
}

async function analyzeWebsiteWithGemini() {
    if (!GEMINI_API_KEY) {
        showStatus('❌ Please configure your Gemini API key first', 'error');
        return;
    }

    const url = document.getElementById('websiteUrl').value.trim();
    if (!url) {
        showStatus('Please enter a website URL to analyze.', 'error');
        return;
    }
    
    // Show analyzing status
    showStatus('🤖 AI is analyzing the website...', 'analyzing');
    
    const analyzeBtn = document.querySelector('.analyze-btn');
    const originalText = analyzeBtn.innerHTML;
    analyzeBtn.innerHTML = '🤖 AI Analyzing...';
    analyzeBtn.disabled = true;
    
    try {
        // Step 1: Fetch website content
        showStatus('📡 Fetching website content...', 'analyzing');
        const websiteContent = await fetchWebsiteContent(url);
        console.log('Website content fetched:', websiteContent);
        
        // Step 2: Analyze with Gemini AI
        showStatus('🧠 AI analyzing content for animal welfare practices...', 'analyzing');
        const aiAnalysis = await analyzeWithGemini(websiteContent, url);
        console.log('AI analysis completed:', aiAnalysis);
        
        // Step 3: Process and display results
        showStatus('✅ AI analysis complete!', 'success');
        displayResults(aiAnalysis);
        
    } catch (error) {
        console.error('Analysis error:', error);
        
        // Provide specific error messages
        if (error.message.includes('403')) {
            showStatus(`❌ API access forbidden. Please check your API key permissions.`, 'error');
        } else if (error.message.includes('401')) {
            showStatus(`❌ Invalid API key. Please check your API key in Settings.`, 'error');
        } else if (error.message.includes('404')) {
            showStatus(`❌ API endpoint not found. The service may be temporarily unavailable.`, 'error');
        } else if (error.message.includes('429')) {
            showStatus(`❌ Rate limit exceeded. Please try again in a few minutes.`, 'error');
        } else if (error.message.includes('fetch')) {
            showStatus(`❌ Unable to fetch website content. Trying with basic analysis...`, 'analyzing');
            
            // Try with fallback analysis
            try {
                const fallbackAnalysis = createFallbackAnalysis({
                    url: url,
                    title: new URL(url.startsWith('http') ? url : 'https://' + url).hostname,
                    content: `Analysis of ${url}`
                }, url);
                showStatus('✅ Basic analysis completed!', 'success');
                displayResults(fallbackAnalysis);
            } catch (fallbackError) {
                showStatus(`❌ All analysis methods failed: ${fallbackError.message}`, 'error');
            }
        } else {
            showStatus(`❌ Analysis failed: ${error.message}`, 'error');
        }
    } finally {
        // Restore button state
        analyzeBtn.innerHTML = originalText;
        analyzeBtn.disabled = false;
    }
}

async function fetchWebsiteContent(url) {
    // Normalize URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    try {
        // Try multiple methods to fetch content
        console.log('Fetching content from:', url);
        
        // Try direct fetch first
        try {
            const response = await fetch(url, {
                mode: 'cors',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (response.ok) {
                const html = await response.text();
                return parseHTML(html, url);
            }
        } catch (corsError) {
            console.log('Direct fetch failed, trying proxy...');
        }
        
        // Fallback to proxy
        const response = await fetchWithProxy(url);
        return {
            url: url,
            title: response.title || 'Unknown Title',
            content: response.content.substring(0, 5000) // Limit content for Gemini
        };
    } catch (error) {
        console.error('All fetch methods failed:', error);
        
        // Return minimal data based on URL for basic analysis
        const domain = new URL(url).hostname;
        return {
            url: url,
            title: domain,
            content: `Website: ${domain}. Unable to fetch full content due to access restrictions.`
        };
    }
}

async function fetchWithProxy(url) {
    const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://cors-anywhere.herokuapp.com/${url}`
    ];
    
    for (const proxyUrl of proxies) {
        try {
            console.log('Trying proxy:', proxyUrl);
            const response = await fetch(proxyUrl);
            
            if (!response.ok) continue;
            
            let data;
            if (proxyUrl.includes('allorigins')) {
                data = await response.json();
                return parseHTML(data.contents, url);
            } else {
                const html = await response.text();
                return parseHTML(html, url);
            }
        } catch (error) {
            console.log(`Proxy ${proxyUrl} failed:`, error);
            continue;
        }
    }
    
    throw new Error('All proxy methods failed');
}

function parseHTML(html, url) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const title = doc.title || new URL(url).hostname;
        
        // Remove script and style elements
        const scripts = doc.querySelectorAll('script, style, noscript');
        scripts.forEach(el => el.remove());
        
        const content = doc.body ? (doc.body.textContent || doc.body.innerText || '') : '';
        
        return {
            title: title.trim(),
            content: content.trim()
        };
    } catch (error) {
        console.error('HTML parsing error:', error);
        return {
            title: new URL(url).hostname,
            content: html.substring(0, 1000) // Fallback to raw HTML excerpt
        };
    }
}

async function analyzeWithGemini(websiteData, url) {
    const prompt = `Analyze this website for animal welfare and compassion practices. \n\nWebsite URL: ${url}\nWebsite Title: ${websiteData.title}\nContent: ${websiteData.content.substring(0, 3000)}\n\nRate the website on animal welfare practices from 1-100 points and 1-5 stars. Consider:\n- Use of animal products (leather, fur, etc.)\n- Animal testing policies\n- Vegan/plant-based offerings\n- Certifications (PETA, Leaping Bunny)\n- Ethical messaging\n- Transparency and sustainability\n\nRespond with ONLY a valid JSON object in this format:\n{\n  "totalScore": 75,\n  "starRating": 4,\n  "confidence": 85,\n  "summary": "Brief summary of findings",\n  "breakdown": [\n    {"category": "Animal Products", "score": 4, "reason": "explanation"},\n    {"category": "Animal Testing", "score": 5, "reason": "explanation"},\n    {"category": "Vegan Offerings", "score": 3, "reason": "explanation"}\n  ],\n  "findings": [\n    {"type": "positive", "text": "positive finding"},\n    {"type": "negative", "text": "concerning finding"}\n  ]}`;

    try {
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        };

        console.log('Making API request to:', GEMINI_API_URL);
        console.log('Using API key (first 10 chars):', GEMINI_API_KEY.substring(0, 10) + '...');

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            
            // Provide more specific error messages
            if (response.status === 400) {
                throw new Error(`Bad request (400): The request was malformed. Check API key format.`);
            } else if (response.status === 401) {
                throw new Error(`Unauthorized (401): Invalid API key. Please check your API key.`);
            } else if (response.status === 403) {
                throw new Error(`Forbidden (403): API key doesn't have permission or quota exceeded.`);
            } else if (response.status === 404) {
                throw new Error(`Not found (404): API endpoint not found. The service may have changed.`);
            } else if (response.status === 429) {
                throw new Error(`Rate limited (429): Too many requests. Please wait and try again.`);
            } else {
                throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('Invalid response structure:', data);
            throw new Error('Invalid response structure from Gemini API');
        }

        const aiResponse = data.candidates[0].content.parts[0].text;
        console.log('AI Response Text:', aiResponse);
        
        try {
            // Try to parse JSON directly first
            let analysis;
            try {
                analysis = JSON.parse(aiResponse);
            } catch (directParseError) {
                // If direct parse fails, try to extract JSON from the response
                const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error('No valid JSON found in AI response');
                }
                analysis = JSON.parse(jsonMatch[0]);
            }
            
            // Validate and fill in missing fields
            analysis = validateAndFixAnalysis(analysis);
            return analysis;
            
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.log('Raw AI Response:', aiResponse);
            
            // Return a fallback analysis
            return createFallbackAnalysis(websiteData, url);
        }
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw error;
    }
}

function validateAndFixAnalysis(analysis) {
    // Ensure all required fields exist
    const validated = {
        totalScore: analysis.totalScore || 50,
        starRating: analysis.starRating || Math.round((analysis.totalScore || 50) / 20),
        confidence: analysis.confidence || 75,
        summary: analysis.summary || "Analysis completed with limited data.",
        breakdown: analysis.breakdown || [
            {"category": "Animal Products", "score": 3, "reason": "No clear information found"},
            {"category": "Animal Testing", "score": 3, "reason": "No clear information found"},
            {"category": "Vegan Offerings", "score": 3, "reason": "No clear information found"}
        ],
        findings: analysis.findings || [
            {"type": "neutral", "text": "Limited information available for analysis"}
        ]
    };
    
    // Ensure star rating is between 1-5
    validated.starRating = Math.max(1, Math.min(5, validated.starRating));
    
    // Ensure total score is between 1-100
    validated.totalScore = Math.max(1, Math.min(100, validated.totalScore));
    
    return validated;
}

function createFallbackAnalysis(websiteData, url) {
    // Simple keyword-based analysis as fallback
    const content = (websiteData.content + ' ' + websiteData.title).toLowerCase();
    
    let score = 50; // Start neutral
    let findings = [];
    
    // Check for positive indicators
    if (content.includes('vegan') || content.includes('plant-based')) {
        score += 10;
        findings.push({"type": "positive", "text": "Mentions vegan or plant-based content"});
    }
    
    if (content.includes('cruelty-free') || content.includes('no animal testing')) {
        score += 15;
        findings.push({"type": "positive", "text": "Claims to be cruelty-free"});
    }
    
    // Check for negative indicators
    if (content.includes('leather') || content.includes('fur')) {
        score -= 10;
        findings.push({"type": "negative", "text": "Mentions animal-derived materials"});
    }
    
    if (content.includes('meat') || content.includes('dairy')) {
        score -= 5;
        findings.push({"type": "negative", "text": "Promotes animal products"});
    }
    
    score = Math.max(1, Math.min(100, score));
    
    return {
        totalScore: score,
        starRating: Math.round(score / 20),
        confidence: 60,
        summary: `Fallback analysis for ${url}. Limited AI processing available.`,
        breakdown: [
            {"category": "Animal Products", "score": Math.round(score/20), "reason": "Keyword-based assessment"},
            {"category": "Overall Ethics", "score": Math.round(score/20), "reason": "General content analysis"}
        ],
        findings: findings.length > 0 ? findings : [{"type": "neutral", "text": "No significant indicators found"}]
    };
}

function displayResults(analysis) {
    analysisResults = analysis;
    
    // Update star rating
    updateStarRating(analysis.starRating);
    
    // Update total score
    document.getElementById('totalScore').textContent = analysis.totalScore;
    
    // Update confidence
    document.getElementById('confidenceScore').textContent = analysis.confidence + '%';
    document.getElementById('confidenceFill').style.width = analysis.confidence + '%';
    
    // Show summary
    if (analysis.summary) {
        document.getElementById('summaryText').textContent = analysis.summary;
        document.getElementById('analysisSummary').style.display = 'block';
    }
    
    // Display breakdown
    displayBreakdown(analysis.breakdown);
    
    // Display findings
    displayFindings(analysis.findings);
    
    // Update overall rating
    updateOverallRating(analysis.totalScore);
    
    // Show results section
    document.getElementById('resultsSection').style.display = 'block';
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

function updateStarRating(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        star.classList.remove('filled', 'half');
        if (index < Math.floor(rating)) {
            star.classList.add('filled');
        } else if (index < rating) {
            star.classList.add('half');
        }
    });
}

function displayBreakdown(breakdown) {
    const breakdownDiv = document.getElementById('scoreBreakdown');
    breakdownDiv.innerHTML = '';
    
    breakdown.forEach(item => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';

        // Clamp score between 0 and 5 to avoid negative repeat counts
        const filledStars = Math.max(0, Math.min(5, item.score));
        const emptyStars = Math.max(0, 5 - filledStars);
        const stars = '★'.repeat(filledStars) + '☆'.repeat(emptyStars);

        scoreItem.innerHTML = `
            <div>
                <strong>${item.category}</strong>
                <div style="font-size: 0.9em; color: #666; margin-top: 4px;">${item.reason}</div>
            </div>
            <div style="text-align: right;">
                <div style="color: #ffd700; font-size: 1.2em;">${stars}</div>
                <div><strong>${Math.max(1, Math.min(5, item.score))}/5</strong></div>
            </div>
        `;
        breakdownDiv.appendChild(scoreItem);
    });
}

function displayFindings(findings) {
    const matchesDiv = document.getElementById('keywordMatches');
    matchesDiv.innerHTML = '';
    
    findings.forEach(finding => {
        const findingElement = document.createElement('div');
        findingElement.className = `keyword-match match-${finding.type}`;
        findingElement.innerHTML = `<strong>${finding.type.toUpperCase()}</strong><br><small>${finding.text}</small>`;
        matchesDiv.appendChild(findingElement);
    });
}

function updateOverallRating(score) {
    const ratingDiv = document.getElementById('ratingDiv');
    let ratingText, ratingClass;
    
    if (score >= 80) {
        ratingText = '🐾 Highly Compassionate';
        ratingClass = 'highly-compassionate';
    } else if (score >= 50) {
        ratingText = '⚖ Neutral / Mixed Practices';
        ratingClass = 'neutral-mixed';
    } else {
        ratingText = '❌ Cruelty-Prone / Unethical';
        ratingClass = 'cruelty-prone';
    }
    
    ratingDiv.textContent = ratingText;
    ratingDiv.className = `rating ${ratingClass}`;
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('analysisStatus');
    statusDiv.textContent = message;
    statusDiv.className = `analysis-status status-${type}`;
    statusDiv.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Compassion Scorer with Gemini AI initialized');
    
    // Test the API on load
    if (GEMINI_API_KEY) {
        console.log('API key configured');
    } else {
        console.log('No API key configured');
    }
    // Attach event listeners for buttons
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeWebsiteWithGemini);
    }
    const quickTestBtn = document.getElementById('quickTestBtn');
    if (quickTestBtn) {
        quickTestBtn.addEventListener('click', runQuickTest);
    }
});

// Quick test function
async function runQuickTest() {
    if (!GEMINI_API_KEY) {
        alert('Please configure your API key first');
        return;
    }

    const testBtn = event.target;
    const originalText = testBtn.textContent;
    testBtn.textContent = '🔄 Testing...';
    testBtn.disabled = true;

    try {
        showStatus('🧪 Running quick API test...', 'analyzing');
        
        // Test with a simple prompt
        const testResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Please respond with: "Test successful"'
                    }]
                }]
            })
        });

        console.log('Quick Test Response Status:', testResponse.status);

        if (testResponse.ok) {
            const data = await testResponse.json();
            console.log('Quick Test Response:', data);
            showStatus('✅ API test successful! Ready to analyze websites.', 'success');
        } else {
            const errorText = await testResponse.text();
            console.error('Quick Test failed:', errorText);
            showStatus(`❌ API test failed: ${testResponse.status} - Check console for details`, 'error');
        }
    } catch (error) {
        console.error('Quick Test error:', error);
        showStatus(`❌ Test failed: ${error.message}`, 'error');
    } finally {
        testBtn.textContent = originalText;
        testBtn.disabled = false;
    }
} 