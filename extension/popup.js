// Unified AutoJobr Extension Popup
const API_BASE_URL = 'https://fce2901e-6020-4c23-97dc-13c7fd7f97c3-00-15wzli1eenkr6.picard.replit.dev';

class AutoJobrExtension {
  constructor() {
    this.currentTab = null;
    this.userProfile = null;
    this.jobData = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.cache = new Map();
    this.stats = {
      todayApplications: 0,
      todayJobsSaved: 0,
      todayAutofills: 0
    };
    this.init();
  }

  async init() {
    try {
      console.log('🚀 AutoJobr Extension initializing...');
      
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      
      // Initialize UI
      this.initializeEventListeners();
      this.showLoading(true);
      
      // Load settings
      await this.loadSettings();
      
      // Check connection and authentication
      await this.checkConnection();
      
      // Load user data if authenticated
      if (this.isAuthenticated) {
        await this.loadUserProfile();
        await this.loadStats();
      }
      
      // Analyze current page
      await this.analyzeCurrentPage();
      
      this.showLoading(false);
      console.log('✅ AutoJobr Extension initialized successfully');
      
    } catch (error) {
      console.error('❌ Extension initialization error:', error);
      this.showError('Failed to initialize extension');
      this.showLoading(false);
    }
  }

  initializeEventListeners() {
    // Main action buttons
    document.getElementById('autofillBtn').addEventListener('click', () => this.handleAutofill());
    document.getElementById('analyzeBtn').addEventListener('click', () => this.handleAnalyze());
    document.getElementById('saveJobBtn').addEventListener('click', () => this.handleSaveJob());
    document.getElementById('coverLetterBtn').addEventListener('click', () => this.handleGenerateCoverLetter());
    
    // Quick action buttons
    document.getElementById('resumeBtn').addEventListener('click', () => this.handleResumeAction());
    document.getElementById('profileBtn').addEventListener('click', () => this.handleProfileAction());
    document.getElementById('historyBtn').addEventListener('click', () => this.handleHistoryAction());
    
    // Footer actions
    document.getElementById('openDashboard').addEventListener('click', () => this.openDashboard());
    document.getElementById('helpBtn').addEventListener('click', () => this.openHelp());

    // Settings toggles
    this.initializeToggle('autofillToggle', 'autofillEnabled');
    this.initializeToggle('trackingToggle', 'trackingEnabled');
    this.initializeToggle('notificationsToggle', 'notificationsEnabled');
    this.initializeToggle('autoSaveToggle', 'autoSaveEnabled');

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }

  initializeToggle(elementId, storageKey) {
    const toggle = document.getElementById(elementId);
    
    // Load current state
    chrome.storage.sync.get([storageKey], (result) => {
      const isEnabled = result[storageKey] !== false;
      toggle.classList.toggle('active', isEnabled);
    });

    // Handle clicks
    toggle.addEventListener('click', () => {
      const isActive = toggle.classList.contains('active');
      const newState = !isActive;
      
      toggle.classList.toggle('active', newState);
      chrome.storage.sync.set({ [storageKey]: newState });
      
      // Show feedback
      this.showNotification(
        `${this.formatSettingName(storageKey)} ${newState ? 'enabled' : 'disabled'}`,
        newState ? 'success' : 'info'
      );
    });
  }

  formatSettingName(key) {
    return key.replace('Enabled', '').replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  }

  async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get([
        'autofillEnabled',
        'trackingEnabled', 
        'notificationsEnabled',
        'autoSaveEnabled'
      ]);
      
      // Apply settings to UI
      Object.entries(settings).forEach(([key, value]) => {
        const toggleId = key.replace('Enabled', 'Toggle');
        const toggle = document.getElementById(toggleId);
        if (toggle) {
          toggle.classList.toggle('active', value !== false);
        }
      });
      
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async checkConnection() {
    try {
      // Test server connection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const healthResponse = await fetch(`${API_BASE_URL}/api/health`, {
        signal: controller.signal,
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      this.isConnected = healthResponse.ok;
      
      if (this.isConnected) {
        // Check authentication
        const authResponse = await this.makeApiRequest('/api/user', { method: 'GET' });
        this.isAuthenticated = authResponse && !authResponse.error;
      }
      
      this.updateConnectionStatus();
      
    } catch (error) {
      console.error('Connection check failed:', error);
      this.isConnected = false;
      this.isAuthenticated = false;
      this.updateConnectionStatus();
    }
  }

  async makeApiRequest(endpoint, options = {}) {
    try {
      // Check cache for GET requests
      const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
      if (options.method === 'GET' && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < 30000) {
          return cached.data;
        }
      }

      // Get session token
      const result = await chrome.storage.local.get(['sessionToken']);
      const sessionToken = result.sessionToken;
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      
      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Handle authentication errors
      if (response.status === 401) {
        await chrome.storage.local.remove(['sessionToken', 'userId']);
        this.isAuthenticated = false;
        this.updateConnectionStatus();
        return { error: 'Authentication required' };
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache GET responses
      if (options.method === 'GET') {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`Request timeout for ${endpoint}`);
        return { error: 'Request timeout' };
      }
      console.error(`API request failed for ${endpoint}:`, error);
      return { error: error.message };
    }
  }

  updateConnectionStatus() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('connectionStatus');
    
    if (this.isConnected && this.isAuthenticated) {
      statusDot.classList.remove('disconnected');
      statusText.textContent = 'Connected & Ready';
      this.enableActionButtons();
    } else if (this.isConnected && !this.isAuthenticated) {
      statusDot.classList.add('disconnected');
      statusText.innerHTML = 'Not signed in - <button class="login-btn" id="loginBtn">Sign In</button>';
      this.disableActionButtons();
      
      // Add login handler
      setTimeout(() => {
        document.getElementById('loginBtn')?.addEventListener('click', () => this.handleLogin());
      }, 100);
    } else {
      statusDot.classList.add('disconnected');
      statusText.textContent = 'Server unreachable';
      this.disableActionButtons();
    }
  }

  async handleLogin() {
    try {
      this.showNotification('Opening login page...', 'info');
      
      const loginUrl = `${API_BASE_URL}/auth/extension-login`;
      const tab = await chrome.tabs.create({ url: loginUrl });
      
      // Listen for successful authentication
      const listener = (tabId, changeInfo, updatedTab) => {
        if (tabId === tab.id && changeInfo.url) {
          if (changeInfo.url.includes('/auth/extension-success')) {
            const url = new URL(changeInfo.url);
            const token = url.searchParams.get('token');
            const userId = url.searchParams.get('userId');
            
            if (token && userId) {
              chrome.storage.local.set({ 
                sessionToken: token, 
                userId: userId 
              }).then(() => {
                chrome.tabs.remove(tab.id);
                this.checkConnection();
                this.loadUserProfile();
                this.loadStats();
                this.showNotification('Successfully signed in!', 'success');
              });
            }
            
            chrome.tabs.onUpdated.removeListener(listener);
          }
        }
      };
      
      chrome.tabs.onUpdated.addListener(listener);
      
      // Cleanup after 5 minutes
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
      }, 300000);
      
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Failed to open login page');
    }
  }

  async analyzeCurrentPage() {
    const pageInfo = document.getElementById('pageInfo');
    const url = this.currentTab?.url || '';
    
    // Supported job boards
    const supportedSites = [
      { domain: 'linkedin.com', name: 'LinkedIn', icon: '💼' },
      { domain: 'indeed.com', name: 'Indeed', icon: '🔍' },
      { domain: 'glassdoor.com', name: 'Glassdoor', icon: '🏢' },
      { domain: 'ziprecruiter.com', name: 'ZipRecruiter', icon: '⚡' },
      { domain: 'monster.com', name: 'Monster', icon: '👹' },
      { domain: 'dice.com', name: 'Dice', icon: '🎲' },
      { domain: 'stackoverflow.com', name: 'Stack Overflow', icon: '💻' },
      { domain: 'greenhouse.io', name: 'Greenhouse', icon: '🌱' },
      { domain: 'lever.co', name: 'Lever', icon: '⚖️' },
      { domain: 'workday.com', name: 'Workday', icon: '📅' },
      { domain: 'myworkdayjobs.com', name: 'Workday', icon: '📅' },
      { domain: 'angel.co', name: 'AngelList', icon: '👼' },
      { domain: 'wellfound.com', name: 'Wellfound', icon: '🚀' }
    ];

    const detectedSite = supportedSites.find(site => url.includes(site.domain));
    
    if (detectedSite) {
      pageInfo.className = 'page-info supported';
      pageInfo.innerHTML = `
        <div class="page-info-header">
          <div class="page-info-icon" style="background: #22c55e; color: white;">✓</div>
          <strong>${detectedSite.icon} ${detectedSite.name} detected</strong>
        </div>
        <div style="font-size: 12px; opacity: 0.8;">Auto-fill and job analysis available</div>
      `;
      
      // Try to detect job details
      await this.detectJobDetails();
      
    } else {
      pageInfo.className = 'page-info unsupported';
      pageInfo.innerHTML = `
        <div class="page-info-header">
          <div class="page-info-icon" style="background: #ef4444; color: white;">!</div>
          <strong>Unsupported job board</strong>
        </div>
        <div style="font-size: 12px; opacity: 0.8;">Navigate to a supported job board to enable features</div>
      `;
      
      this.disableActionButtons();
    }
  }

  async detectJobDetails() {
    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'extractJobDetails'
      });

      if (response && response.success && response.jobData) {
        this.jobData = response.jobData;
        
        // Show job info
        if (this.jobData.title) {
          const jobInfo = document.getElementById('jobInfo');
          const jobTitle = document.getElementById('jobTitle');
          const jobCompany = document.getElementById('jobCompany');
          const jobLocation = document.getElementById('jobLocation');
          
          jobTitle.textContent = this.jobData.title;
          jobCompany.textContent = this.jobData.company || 'Company not detected';
          jobLocation.textContent = this.jobData.location || '';
          jobInfo.style.display = 'block';
          
          // Auto-analyze if authenticated
          if (this.isAuthenticated && this.userProfile) {
            await this.performJobAnalysis();
          }
        }
      }
    } catch (error) {
      console.error('Failed to detect job details:', error);
    }
  }

  async performJobAnalysis() {
    if (!this.jobData || !this.userProfile) return;

    try {
      const analysis = await this.makeApiRequest('/api/analyze-job-match', {
        method: 'POST',
        body: JSON.stringify({
          jobData: this.jobData,
          userProfile: this.userProfile
        })
      });

      if (analysis && !analysis.error) {
        this.showJobScore(analysis.matchScore || 0);
      }
    } catch (error) {
      console.error('Job analysis failed:', error);
    }
  }

  showJobScore(score) {
    const scoreSection = document.getElementById('scoreSection');
    const matchScore = document.getElementById('matchScore');
    const scoreFill = document.getElementById('scoreFill');

    matchScore.textContent = `${score}%`;
    
    // Animate score fill
    setTimeout(() => {
      scoreFill.style.width = `${score}%`;
    }, 100);
    
    scoreSection.style.display = 'block';

    // Update colors based on score
    let color = '#ef4444';
    if (score >= 80) color = '#22c55e';
    else if (score >= 60) color = '#f59e0b';
    else if (score >= 40) color = '#f97316';

    scoreFill.style.background = `linear-gradient(90deg, ${color}, ${color}cc)`;
    matchScore.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
    matchScore.style.webkitBackgroundClip = 'text';
    matchScore.style.webkitTextFillColor = 'transparent';
  }

  async loadUserProfile() {
    if (!this.isAuthenticated) return;

    try {
      const profile = await this.makeApiRequest('/api/extension/profile');
      if (profile && !profile.error) {
        this.userProfile = profile;
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  async loadStats() {
    if (!this.isAuthenticated) return;

    try {
      const stats = await this.makeApiRequest('/api/extension/stats');
      if (stats && !stats.error) {
        this.stats = stats;
        this.updateStatsDisplay();
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  updateStatsDisplay() {
    document.getElementById('todayApplications').textContent = this.stats.todayApplications || 0;
    document.getElementById('todayJobsSaved').textContent = this.stats.todayJobsSaved || 0;
    document.getElementById('todayAutofills').textContent = this.stats.todayAutofills || 0;
    document.getElementById('statsSection').style.display = 'block';
  }

  // Action Handlers
  async handleAutofill() {
    if (!this.isAuthenticated) {
      this.showError('Please sign in to use auto-fill');
      return;
    }

    if (!this.userProfile) {
      this.showError('User profile not loaded');
      return;
    }

    this.showLoading(true);

    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'startAutofill',
        userProfile: this.userProfile
      });

      if (response && response.success) {
        this.showNotification(
          `✅ Auto-filled ${response.fieldsFilled}/${response.fieldsFound} fields!`,
          'success'
        );
        
        // Update stats
        this.stats.todayAutofills++;
        this.updateStatsDisplay();
        
        // Track application
        await this.trackApplication();
      } else {
        throw new Error(response?.error || 'Auto-fill failed');
      }
    } catch (error) {
      console.error('Auto-fill error:', error);
      this.showError('Auto-fill failed. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleAnalyze() {
    if (!this.isAuthenticated) {
      this.showError('Please sign in to analyze jobs');
      return;
    }

    this.showLoading(true);

    try {
      await this.detectJobDetails();
      await this.performJobAnalysis();
      this.showNotification('✅ Job analysis completed!', 'success');
    } catch (error) {
      console.error('Analysis error:', error);
      this.showError('Job analysis failed. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleSaveJob() {
    if (!this.isAuthenticated || !this.jobData) {
      this.showError('Please ensure you\'re signed in and on a job page');
      return;
    }

    this.showLoading(true);

    try {
      const result = await this.makeApiRequest('/api/saved-jobs', {
        method: 'POST',
        body: JSON.stringify({
          jobTitle: this.jobData.title,
          company: this.jobData.company,
          location: this.jobData.location,
          jobUrl: this.currentTab.url,
          description: this.jobData.description,
          source: 'extension'
        })
      });

      if (result && !result.error) {
        this.showNotification('✅ Job saved successfully!', 'success');
        
        // Update stats
        this.stats.todayJobsSaved++;
        this.updateStatsDisplay();
      } else {
        throw new Error(result?.error || 'Failed to save job');
      }
    } catch (error) {
      console.error('Save job error:', error);
      this.showError('Failed to save job. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleGenerateCoverLetter() {
    if (!this.isAuthenticated || !this.jobData) {
      this.showError('Please ensure you\'re signed in and on a job page');
      return;
    }

    this.showLoading(true);

    try {
      const result = await this.makeApiRequest('/api/generate-cover-letter', {
        method: 'POST',
        body: JSON.stringify({
          jobData: this.jobData,
          userProfile: this.userProfile
        })
      });

      if (result && !result.error) {
        await navigator.clipboard.writeText(result.coverLetter);
        this.showNotification('✅ Cover letter generated and copied!', 'success');
        
        // Try to fill cover letter field
        chrome.tabs.sendMessage(this.currentTab.id, {
          action: 'fillCoverLetter',
          coverLetter: result.coverLetter
        });
        
      } else {
        throw new Error(result?.error || 'Failed to generate cover letter');
      }
    } catch (error) {
      console.error('Cover letter error:', error);
      this.showError('Failed to generate cover letter. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleResumeAction() {
    chrome.tabs.create({
      url: `${API_BASE_URL}/resume`
    });
  }

  async handleProfileAction() {
    chrome.tabs.create({
      url: `${API_BASE_URL}/profile`
    });
  }

  async handleHistoryAction() {
    chrome.tabs.create({
      url: `${API_BASE_URL}/applications`
    });
  }

  async trackApplication() {
    if (!this.jobData) return;

    try {
      await this.makeApiRequest('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          jobTitle: this.jobData.title,
          company: this.jobData.company,
          location: this.jobData.location,
          jobUrl: this.currentTab.url,
          source: 'extension',
          status: 'applied'
        })
      });
      
      // Update stats
      this.stats.todayApplications++;
      this.updateStatsDisplay();
      
    } catch (error) {
      console.error('Failed to track application:', error);
    }
  }

  handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case '1':
          e.preventDefault();
          this.handleAutofill();
          break;
        case '2':
          e.preventDefault();
          this.handleAnalyze();
          break;
        case '3':
          e.preventDefault();
          this.handleSaveJob();
          break;
        case '4':
          e.preventDefault();
          this.handleGenerateCoverLetter();
          break;
      }
    }
  }

  enableActionButtons() {
    const buttons = ['autofillBtn', 'analyzeBtn', 'saveJobBtn', 'coverLetterBtn'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      }
    });
  }

  disableActionButtons() {
    const buttons = ['autofillBtn', 'analyzeBtn', 'saveJobBtn', 'coverLetterBtn'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      }
    });
  }

  showLoading(show = true) {
    const content = document.querySelector('.content');
    const loading = document.getElementById('loading');
    
    if (show) {
      content.style.display = 'none';
      loading.style.display = 'block';
    } else {
      content.style.display = 'block';
      loading.style.display = 'none';
    }
  }

  showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  showError(message) {
    this.showNotification(`❌ ${message}`, 'error');
  }

  openDashboard() {
    chrome.tabs.create({
      url: `${API_BASE_URL}/applications`
    });
  }

  openHelp() {
    chrome.tabs.create({
      url: `${API_BASE_URL}/help/extension`
    });
  }
}

// Initialize extension when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AutoJobrExtension();
});