// Enhanced AutoJobr Content Script v2.0
console.log('🚀 AutoJobr Content Script v2.0 loading...');

class AutoJobrContentScript {
  constructor() {
    this.isProcessing = false;
    this.processedFields = new Set();
    this.jobData = null;
    this.userProfile = null;
    this.floatingButton = null;
    this.popupContainer = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.fieldSelectors = this.getFieldSelectors();
    this.init();
  }

  init() {
    // Mark as loaded
    window.autojobrContentScriptLoaded = true;
    
    // Set up message listener
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Indicates async response
    });

    // Create floating button
    this.createFloatingButton();
    
    // Auto-detect job postings
    setTimeout(() => this.detectJobPosting(), 2000);
    
    console.log('✅ AutoJobr Content Script initialized');
  }

  getFieldSelectors() {
    return {
      // Personal Information
      firstName: [
        'input[name*="first" i][name*="name" i]',
        'input[id*="first" i][id*="name" i]',
        'input[placeholder*="first" i][placeholder*="name" i]',
        'input[aria-label*="first" i][aria-label*="name" i]',
        'input[name="firstName"]',
        'input[id="firstName"]',
        '#first-name',
        '.first-name input'
      ],
      lastName: [
        'input[name*="last" i][name*="name" i]',
        'input[id*="last" i][id*="name" i]',
        'input[placeholder*="last" i][placeholder*="name" i]',
        'input[aria-label*="last" i][aria-label*="name" i]',
        'input[name="lastName"]',
        'input[id="lastName"]',
        '#last-name',
        '.last-name input'
      ],
      fullName: [
        'input[name*="full" i][name*="name" i]',
        'input[name*="name" i]:not([name*="first" i]):not([name*="last" i]):not([name*="company" i])',
        'input[placeholder*="full name" i]',
        'input[placeholder*="your name" i]',
        '#full-name',
        '#fullName'
      ],
      email: [
        'input[type="email"]',
        'input[name*="email" i]',
        'input[id*="email" i]',
        'input[placeholder*="email" i]',
        'input[aria-label*="email" i]'
      ],
      phone: [
        'input[type="tel"]',
        'input[name*="phone" i]',
        'input[name*="mobile" i]',
        'input[id*="phone" i]',
        'input[id*="mobile" i]',
        'input[placeholder*="phone" i]',
        'input[placeholder*="mobile" i]',
        'input[aria-label*="phone" i]'
      ],
      address: [
        'input[name*="address" i]',
        'input[id*="address" i]',
        'input[placeholder*="address" i]',
        'textarea[name*="address" i]',
        'textarea[id*="address" i]'
      ],
      city: [
        'input[name*="city" i]',
        'input[id*="city" i]',
        'input[placeholder*="city" i]'
      ],
      state: [
        'select[name*="state" i]',
        'select[id*="state" i]',
        'input[name*="state" i]',
        'input[id*="state" i]'
      ],
      zipCode: [
        'input[name*="zip" i]',
        'input[name*="postal" i]',
        'input[id*="zip" i]',
        'input[id*="postal" i]',
        'input[placeholder*="zip" i]'
      ],
      country: [
        'select[name*="country" i]',
        'select[id*="country" i]',
        'input[name*="country" i]',
        'input[id*="country" i]'
      ],
      // Professional Information
      currentTitle: [
        'input[name*="title" i]',
        'input[name*="position" i]',
        'input[id*="title" i]',
        'input[id*="position" i]',
        'input[placeholder*="current title" i]',
        'input[placeholder*="job title" i]'
      ],
      currentCompany: [
        'input[name*="company" i]',
        'input[name*="employer" i]',
        'input[id*="company" i]',
        'input[id*="employer" i]',
        'input[placeholder*="company" i]',
        'input[placeholder*="employer" i]'
      ],
      experience: [
        'select[name*="experience" i]',
        'select[id*="experience" i]',
        'input[name*="experience" i]',
        'input[id*="experience" i]'
      ],
      salary: [
        'input[name*="salary" i]',
        'input[name*="compensation" i]',
        'input[id*="salary" i]',
        'input[id*="compensation" i]',
        'input[placeholder*="salary" i]'
      ],
      // Education
      education: [
        'select[name*="education" i]',
        'select[name*="degree" i]',
        'select[id*="education" i]',
        'select[id*="degree" i]',
        'input[name*="education" i]',
        'input[name*="degree" i]'
      ],
      university: [
        'input[name*="university" i]',
        'input[name*="school" i]',
        'input[name*="college" i]',
        'input[id*="university" i]',
        'input[id*="school" i]',
        'input[placeholder*="university" i]',
        'input[placeholder*="school" i]'
      ],
      // Cover Letter & Additional
      coverLetter: [
        'textarea[name*="cover" i]',
        'textarea[name*="letter" i]',
        'textarea[id*="cover" i]',
        'textarea[id*="letter" i]',
        'textarea[placeholder*="cover letter" i]',
        'textarea[placeholder*="why" i]',
        '.cover-letter textarea',
        '#coverLetter'
      ],
      additionalInfo: [
        'textarea[name*="additional" i]',
        'textarea[name*="comments" i]',
        'textarea[name*="notes" i]',
        'textarea[id*="additional" i]',
        'textarea[placeholder*="additional" i]'
      ],
      // LinkedIn specific
      linkedinProfile: [
        'input[name*="linkedin" i]',
        'input[id*="linkedin" i]',
        'input[placeholder*="linkedin" i]'
      ],
      // Portfolio/Website
      website: [
        'input[name*="website" i]',
        'input[name*="portfolio" i]',
        'input[id*="website" i]',
        'input[id*="portfolio" i]',
        'input[placeholder*="website" i]',
        'input[placeholder*="portfolio" i]'
      ]
    };
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'startAutofill':
          const autofillResult = await this.startAutofill(message.userProfile);
          sendResponse(autofillResult);
          break;

        case 'extractJobDetails':
          const jobDetails = await this.extractJobDetails();
          sendResponse(jobDetails);
          break;

        case 'detectJobPosting':
          const detection = await this.detectJobPosting();
          sendResponse(detection);
          break;

        case 'analyzeJob':
          await this.analyzeCurrentJob();
          sendResponse({ success: true });
          break;

        case 'saveCurrentJob':
          await this.saveCurrentJob();
          sendResponse({ success: true });
          break;

        case 'fillCoverLetter':
          const coverLetterResult = await this.fillCoverLetter(message.coverLetter);
          sendResponse(coverLetterResult);
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Content script message handler error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async startAutofill(userProfile) {
    if (this.isProcessing) {
      return { success: false, error: 'Auto-fill already in progress' };
    }

    this.isProcessing = true;
    this.processedFields.clear();
    this.userProfile = userProfile;
    this.retryCount = 0;

    try {
      console.log('🚀 Starting auto-fill process...');
      
      // Show progress indicator
      this.showProgressIndicator();
      
      // Wait for page to be ready
      await this.waitForPageReady();
      
      // Find and fill all form fields
      const result = await this.fillAllFields();
      
      // Hide progress indicator
      this.hideProgressIndicator();
      
      console.log('✅ Auto-fill completed:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Auto-fill error:', error);
      this.hideProgressIndicator();
      return { success: false, error: error.message };
    } finally {
      this.isProcessing = false;
    }
  }

  async fillAllFields() {
    let fieldsFound = 0;
    let fieldsFilled = 0;
    let fieldsSkipped = 0;

    // Process each field type
    for (const [fieldType, selectors] of Object.entries(this.fieldSelectors)) {
      try {
        const elements = this.findElements(selectors);
        
        if (elements.length > 0) {
          fieldsFound += elements.length;
          
          for (const element of elements) {
            // Skip if already processed
            const elementId = this.getElementId(element);
            if (this.processedFields.has(elementId)) {
              continue;
            }
            
            const filled = await this.fillField(element, fieldType);
            if (filled) {
              fieldsFilled++;
              this.processedFields.add(elementId);
            } else {
              fieldsSkipped++;
            }
            
            // Small delay between fields
            await this.delay(100);
          }
        }
      } catch (error) {
        console.error(`Error processing ${fieldType}:`, error);
        fieldsSkipped++;
      }
    }

    // Handle radio buttons and checkboxes separately
    const radioResult = await this.handleRadioButtons();
    fieldsFound += radioResult.found;
    fieldsFilled += radioResult.filled;
    fieldsSkipped += radioResult.skipped;

    return {
      success: true,
      fieldsFound,
      fieldsFilled,
      fieldsSkipped,
      message: `Filled ${fieldsFilled}/${fieldsFound} fields (${fieldsSkipped} skipped)`
    };
  }

  findElements(selectors) {
    const elements = [];
    const foundSelectors = new Set();

    for (const selector of selectors) {
      try {
        const found = document.querySelectorAll(selector);
        found.forEach(element => {
          // Avoid duplicates
          if (!foundSelectors.has(element)) {
            // Check if element is visible and interactable
            if (this.isElementInteractable(element)) {
              elements.push(element);
              foundSelectors.add(element);
            }
          }
        });
      } catch (error) {
        console.warn(`Invalid selector: ${selector}`, error);
      }
    }

    return elements;
  }

  isElementInteractable(element) {
    if (!element || element.disabled || element.readOnly) {
      return false;
    }

    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }

    return true;
  }

  getElementId(element) {
    return element.id || element.name || element.className || element.outerHTML.substring(0, 100);
  }

  async fillField(element, fieldType) {
    try {
      const value = this.getFieldValue(fieldType);
      if (!value) {
        console.log(`No value available for ${fieldType}`);
        return false;
      }

      // Focus the element first
      element.focus();
      await this.delay(50);

      // Handle different input types
      if (element.tagName.toLowerCase() === 'select') {
        return this.fillSelectField(element, value);
      } else if (element.type === 'checkbox') {
        return this.fillCheckboxField(element, value);
      } else if (element.type === 'radio') {
        return this.fillRadioField(element, value);
      } else {
        return this.fillTextField(element, value);
      }
    } catch (error) {
      console.error(`Error filling field ${fieldType}:`, error);
      return false;
    }
  }

  fillTextField(element, value) {
    try {
      // Clear existing value
      element.value = '';
      
      // Set new value
      element.value = value;
      
      // Trigger events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true }));
      
      console.log(`✅ Filled text field with: ${value}`);
      return true;
    } catch (error) {
      console.error('Error filling text field:', error);
      return false;
    }
  }

  fillSelectField(element, value) {
    try {
      // Find matching option
      const options = Array.from(element.options);
      const matchingOption = options.find(option => 
        option.text.toLowerCase().includes(value.toLowerCase()) ||
        option.value.toLowerCase().includes(value.toLowerCase())
      );

      if (matchingOption) {
        element.value = matchingOption.value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`✅ Selected option: ${matchingOption.text}`);
        return true;
      } else {
        console.log(`❌ No matching option found for: ${value}`);
        return false;
      }
    } catch (error) {
      console.error('Error filling select field:', error);
      return false;
    }
  }

  fillCheckboxField(element, value) {
    try {
      const shouldCheck = value === true || value === 'true' || value === 'yes' || value === '1';
      
      if (element.checked !== shouldCheck) {
        element.checked = shouldCheck;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`✅ ${shouldCheck ? 'Checked' : 'Unchecked'} checkbox`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error filling checkbox field:', error);
      return false;
    }
  }

  fillRadioField(element, value) {
    try {
      // For radio buttons, we need to find the right one in the group
      const name = element.name;
      if (!name) return false;

      const radioGroup = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
      
      for (const radio of radioGroup) {
        const label = this.getRadioLabel(radio);
        if (label && (
          label.toLowerCase().includes(value.toLowerCase()) ||
          radio.value.toLowerCase().includes(value.toLowerCase())
        )) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
          console.log(`✅ Selected radio: ${label}`);
          return true;
        }
      }
      
      console.log(`❌ No matching radio option found for: ${value}`);
      return false;
    } catch (error) {
      console.error('Error filling radio field:', error);
      return false;
    }
  }

  async handleRadioButtons() {
    let found = 0;
    let filled = 0;
    let skipped = 0;

    try {
      // Find all radio button groups
      const radioButtons = document.querySelectorAll('input[type="radio"]');
      const radioGroups = new Map();

      // Group radio buttons by name
      radioButtons.forEach(radio => {
        if (radio.name && this.isElementInteractable(radio)) {
          if (!radioGroups.has(radio.name)) {
            radioGroups.set(radio.name, []);
          }
          radioGroups.get(radio.name).push(radio);
        }
      });

      // Process each radio group
      for (const [groupName, radios] of radioGroups.entries()) {
        found++;
        
        // Skip if already processed
        if (this.processedFields.has(`radio_${groupName}`)) {
          continue;
        }

        try {
          // Try to determine the best option based on context
          const bestOption = this.selectBestRadioOption(radios, groupName);
          
          if (bestOption) {
            bestOption.checked = true;
            bestOption.dispatchEvent(new Event('change', { bubbles: true }));
            filled++;
            this.processedFields.add(`radio_${groupName}`);
            console.log(`✅ Selected radio option: ${this.getRadioLabel(bestOption)}`);
          } else {
            skipped++;
            console.log(`⏭️ Skipped radio group: ${groupName}`);
          }
        } catch (error) {
          console.error(`Error processing radio group ${groupName}:`, error);
          skipped++;
        }

        await this.delay(100);
      }
    } catch (error) {
      console.error('Error handling radio buttons:', error);
    }

    return { found, filled, skipped };
  }

  selectBestRadioOption(radios, groupName) {
    // Define preferred options for common radio groups
    const preferences = {
      // Work authorization
      'work_auth': ['yes', 'authorized', 'citizen', 'permanent'],
      'visa_status': ['citizen', 'permanent', 'green card', 'authorized'],
      'require_sponsorship': ['no', 'not required', 'false'],
      
      // Experience level
      'experience_level': ['mid', 'senior', 'experienced', '3-5', '5+'],
      
      // Education
      'education_level': ['bachelor', 'degree', 'college', 'university'],
      
      // Availability
      'availability': ['immediately', 'available', '2 weeks', 'asap'],
      'start_date': ['immediately', 'asap', '2 weeks'],
      
      // Remote work
      'remote_work': ['yes', 'remote', 'hybrid', 'flexible'],
      
      // Salary/Benefits
      'salary_negotiable': ['yes', 'negotiable', 'open'],
      
      // General yes/no questions
      'default_yes': ['yes', 'true', 'agree', 'accept'],
      'default_no': ['no', 'false', 'decline', 'not required']
    };

    // Try to match group name with preferences
    let preferredValues = [];
    const lowerGroupName = groupName.toLowerCase();
    
    for (const [key, values] of Object.entries(preferences)) {
      if (lowerGroupName.includes(key.replace('_', '')) || 
          lowerGroupName.includes(key.replace('_', ' '))) {
        preferredValues = values;
        break;
      }
    }

    // If no specific preferences, use common safe defaults
    if (preferredValues.length === 0) {
      if (lowerGroupName.includes('sponsor') || lowerGroupName.includes('visa')) {
        preferredValues = preferences.require_sponsorship;
      } else if (lowerGroupName.includes('auth') || lowerGroupName.includes('work')) {
        preferredValues = preferences.work_auth;
      } else {
        // Default to first option or most common positive response
        preferredValues = ['yes', 'true', 'agree'];
      }
    }

    // Find the best matching option
    for (const preferredValue of preferredValues) {
      for (const radio of radios) {
        const label = this.getRadioLabel(radio);
        const value = radio.value.toLowerCase();
        
        if (label.toLowerCase().includes(preferredValue) || 
            value.includes(preferredValue)) {
          return radio;
        }
      }
    }

    // If no preferred option found, return the first available option
    return radios.length > 0 ? radios[0] : null;
  }

  getRadioLabel(radio) {
    // Try to find associated label
    if (radio.id) {
      const label = document.querySelector(`label[for="${radio.id}"]`);
      if (label) return label.textContent.trim();
    }

    // Try parent label
    const parentLabel = radio.closest('label');
    if (parentLabel) {
      return parentLabel.textContent.replace(radio.value, '').trim();
    }

    // Try next sibling text
    if (radio.nextSibling && radio.nextSibling.nodeType === Node.TEXT_NODE) {
      return radio.nextSibling.textContent.trim();
    }

    // Try following element
    if (radio.nextElementSibling) {
      return radio.nextElementSibling.textContent.trim();
    }

    // Fallback to value
    return radio.value || 'Unknown';
  }

  getFieldValue(fieldType) {
    if (!this.userProfile) return null;

    const fieldMap = {
      firstName: this.userProfile.firstName || this.userProfile.name?.split(' ')[0],
      lastName: this.userProfile.lastName || this.userProfile.name?.split(' ').slice(1).join(' '),
      fullName: this.userProfile.name || `${this.userProfile.firstName || ''} ${this.userProfile.lastName || ''}`.trim(),
      email: this.userProfile.email,
      phone: this.userProfile.phone,
      address: this.userProfile.address,
      city: this.userProfile.city,
      state: this.userProfile.state,
      zipCode: this.userProfile.zipCode || this.userProfile.postalCode,
      country: this.userProfile.country || 'United States',
      currentTitle: this.userProfile.currentTitle || this.userProfile.title,
      currentCompany: this.userProfile.currentCompany || this.userProfile.company,
      experience: this.userProfile.experience || this.userProfile.yearsOfExperience,
      salary: this.userProfile.desiredSalary || this.userProfile.salary,
      education: this.userProfile.education || this.userProfile.degree,
      university: this.userProfile.university || this.userProfile.school,
      linkedinProfile: this.userProfile.linkedinProfile || this.userProfile.linkedin,
      website: this.userProfile.website || this.userProfile.portfolio,
      coverLetter: this.userProfile.coverLetter || this.generateDefaultCoverLetter(),
      additionalInfo: this.userProfile.additionalInfo || ''
    };

    return fieldMap[fieldType] || null;
  }

  generateDefaultCoverLetter() {
    if (!this.userProfile) return '';
    
    const name = this.userProfile.name || `${this.userProfile.firstName || ''} ${this.userProfile.lastName || ''}`.trim();
    const title = this.userProfile.currentTitle || this.userProfile.title || 'Professional';
    
    return `Dear Hiring Manager,

I am writing to express my strong interest in this position. As a ${title} with ${this.userProfile.experience || 'several years of'} experience, I am excited about the opportunity to contribute to your team.

My background in ${this.userProfile.skills?.slice(0, 3).join(', ') || 'relevant technologies'} aligns well with the requirements of this role. I am particularly drawn to this opportunity because of your company's reputation and growth potential.

I would welcome the opportunity to discuss how my skills and experience can benefit your organization. Thank you for your consideration.

Best regards,
${name}`;
  }

  async fillCoverLetter(coverLetter) {
    try {
      const coverLetterFields = this.findElements(this.fieldSelectors.coverLetter);
      
      if (coverLetterFields.length > 0) {
        const field = coverLetterFields[0];
        field.focus();
        await this.delay(100);
        
        field.value = coverLetter;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        
        return { success: true, message: 'Cover letter filled successfully' };
      } else {
        return { success: false, error: 'No cover letter field found' };
      }
    } catch (error) {
      console.error('Error filling cover letter:', error);
      return { success: false, error: error.message };
    }
  }

  async waitForPageReady() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Floating Button Implementation
  createFloatingButton() {
    // Remove existing button if any
    if (this.floatingButton) {
      this.floatingButton.remove();
    }

    // Create floating button
    this.floatingButton = document.createElement('div');
    this.floatingButton.id = 'autojobr-floating-btn';
    this.floatingButton.innerHTML = `
      <div class="autojobr-btn-icon">A</div>
      <div class="autojobr-btn-text">AutoJobr</div>
    `;

    // Add styles
    this.floatingButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
      cursor: pointer;
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
      font-weight: 600;
      font-size: 20px;
      border: 3px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
    `;

    // Add hover effects
    this.floatingButton.addEventListener('mouseenter', () => {
      this.floatingButton.style.transform = 'scale(1.1)';
      this.floatingButton.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.6)';
    });

    this.floatingButton.addEventListener('mouseleave', () => {
      this.floatingButton.style.transform = 'scale(1)';
      this.floatingButton.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
    });

    // Add click handler to reopen popup
    this.floatingButton.addEventListener('click', () => {
      this.openExtensionPopup();
    });

    document.body.appendChild(this.floatingButton);

    // Show button after a delay (simulating popup close)
    setTimeout(() => {
      this.showFloatingButton();
    }, 3000);
  }

  showFloatingButton() {
    if (this.floatingButton) {
      this.floatingButton.style.display = 'flex';
      setTimeout(() => {
        this.floatingButton.style.opacity = '1';
        this.floatingButton.style.transform = 'scale(1)';
      }, 100);
    }
  }

  hideFloatingButton() {
    if (this.floatingButton) {
      this.floatingButton.style.opacity = '0';
      this.floatingButton.style.transform = 'scale(0.8)';
      setTimeout(() => {
        this.floatingButton.style.display = 'none';
      }, 300);
    }
  }

  openExtensionPopup() {
    // Since we can't directly open the popup, we'll create an inline popup
    this.createInlinePopup();
  }

  createInlinePopup() {
    // Remove existing popup if any
    if (this.popupContainer) {
      this.popupContainer.remove();
    }

    // Create popup container
    this.popupContainer = document.createElement('div');
    this.popupContainer.id = 'autojobr-inline-popup';
    this.popupContainer.innerHTML = `
      <div class="autojobr-popup-overlay">
        <div class="autojobr-popup-content">
          <div class="autojobr-popup-header">
            <div class="autojobr-popup-title">
              <div class="autojobr-popup-logo">A</div>
              AutoJobr
            </div>
            <button class="autojobr-popup-close">&times;</button>
          </div>
          <div class="autojobr-popup-body">
            <div class="autojobr-action-grid">
              <button class="autojobr-action-btn" data-action="autofill">
                <div class="autojobr-btn-icon">✎</div>
                Auto-fill Form
              </button>
              <button class="autojobr-action-btn" data-action="analyze">
                <div class="autojobr-btn-icon">📊</div>
                Analyze Job
              </button>
              <button class="autojobr-action-btn" data-action="save">
                <div class="autojobr-btn-icon">💾</div>
                Save Job
              </button>
              <button class="autojobr-action-btn" data-action="cover-letter">
                <div class="autojobr-btn-icon">📝</div>
                Cover Letter
              </button>
            </div>
            <div class="autojobr-popup-footer">
              <button class="autojobr-dashboard-btn">Open Dashboard</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const styles = `
      <style>
        #autojobr-inline-popup {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10001;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .autojobr-popup-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
        }
        
        .autojobr-popup-content {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          width: 400px;
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          animation: slideIn 0.3s ease;
        }
        
        .autojobr-popup-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .autojobr-popup-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          font-size: 18px;
        }
        
        .autojobr-popup-logo {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        
        .autojobr-popup-close {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        
        .autojobr-popup-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .autojobr-popup-body {
          padding: 24px;
        }
        
        .autojobr-action-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .autojobr-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 12px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          color: #374151;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          text-align: center;
        }
        
        .autojobr-action-btn:hover {
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
        }
        
        .autojobr-action-btn .autojobr-btn-icon {
          width: 24px;
          height: 24px;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 8px;
        }
        
        .autojobr-dashboard-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .autojobr-dashboard-btn:hover {
          background: linear-gradient(135deg, #1d4ed8, #1e40af);
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { transform: translateY(-20px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      </style>
    `;

    // Add styles to head
    const styleElement = document.createElement('div');
    styleElement.innerHTML = styles;
    this.popupContainer.appendChild(styleElement);

    // Add event listeners
    this.popupContainer.querySelector('.autojobr-popup-close').addEventListener('click', () => {
      this.closeInlinePopup();
    });

    this.popupContainer.querySelector('.autojobr-popup-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeInlinePopup();
      }
    });

    // Add action button listeners
    this.popupContainer.querySelectorAll('.autojobr-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleInlinePopupAction(action);
      });
    });

    this.popupContainer.querySelector('.autojobr-dashboard-btn').addEventListener('click', () => {
      window.open('https://fce2901e-6020-4c23-97dc-13c7fd7f97c3-00-15wzli1eenkr6.picard.replit.dev/applications', '_blank');
      this.closeInlinePopup();
    });

    document.body.appendChild(this.popupContainer);
    this.hideFloatingButton();
  }

  closeInlinePopup() {
    if (this.popupContainer) {
      this.popupContainer.style.opacity = '0';
      setTimeout(() => {
        this.popupContainer.remove();
        this.popupContainer = null;
        this.showFloatingButton();
      }, 300);
    }
  }

  async handleInlinePopupAction(action) {
    this.closeInlinePopup();
    
    switch (action) {
      case 'autofill':
        // Get user profile from background script
        const profileResponse = await chrome.runtime.sendMessage({ action: 'getUserProfile' });
        if (profileResponse && profileResponse.profile) {
          await this.startAutofill(profileResponse.profile);
        }
        break;
      case 'analyze':
        await this.analyzeCurrentJob();
        break;
      case 'save':
        await this.saveCurrentJob();
        break;
      case 'cover-letter':
        await this.generateAndFillCoverLetter();
        break;
    }
  }

  // Progress indicator
  showProgressIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'autojobr-progress';
    indicator.innerHTML = `
      <div class="autojobr-progress-content">
        <div class="autojobr-spinner"></div>
        <div class="autojobr-progress-text">Auto-filling form...</div>
      </div>
    `;
    
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideInRight 0.3s ease;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      .autojobr-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #e5e7eb;
        border-top: 2px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(indicator);
  }

  hideProgressIndicator() {
    const indicator = document.getElementById('autojobr-progress');
    if (indicator) {
      indicator.style.animation = 'slideOutRight 0.3s ease forwards';
      setTimeout(() => indicator.remove(), 300);
    }
  }

  // Job detection and analysis methods
  async detectJobPosting() {
    try {
      const jobData = await this.extractJobDetails();
      if (jobData.success && jobData.jobData) {
        this.jobData = jobData.jobData;
        return { success: true, jobData: this.jobData };
      }
      return { success: false };
    } catch (error) {
      console.error('Job detection error:', error);
      return { success: false, error: error.message };
    }
  }

  async extractJobDetails() {
    try {
      const jobData = {
        title: this.extractJobTitle(),
        company: this.extractCompany(),
        location: this.extractLocation(),
        description: this.extractDescription(),
        url: window.location.href,
        platform: this.detectPlatform()
      };

      return { success: true, jobData };
    } catch (error) {
      console.error('Job extraction error:', error);
      return { success: false, error: error.message };
    }
  }

  extractJobTitle() {
    const selectors = [
      'h1[data-automation-id="jobPostingHeader"]', // Workday
      '.job-title', '.job-title h1', '.job-title a',
      '[data-testid="job-title"]',
      '.jobsearch-JobInfoHeader-title', // Indeed
      '[data-testid="jobTitle"]', // Glassdoor
      '.job-view-job-title', // ZipRecruiter
      'h1.job-title', 'h1[class*="title"]',
      '.top-card-layout__title', // LinkedIn
      'h1', 'h2' // Fallback
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }

    return document.title.split(' - ')[0] || 'Job Title Not Found';
  }

  extractCompany() {
    const selectors = [
      '[data-automation-id="jobPostingCompany"]', // Workday
      '.company-name', '.company', '[data-testid="company-name"]',
      '.jobsearch-InlineCompanyRating', // Indeed
      '[data-test="employer-name"]', // Glassdoor
      '.job-view-job-company', // ZipRecruiter
      '.top-card-layout__card .top-card-layout__second-subline', // LinkedIn
      '[class*="company"]', '[class*="employer"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }

    return 'Company Not Found';
  }

  extractLocation() {
    const selectors = [
      '[data-automation-id="jobPostingLocation"]', // Workday
      '.location', '[data-testid="location"]',
      '.jobsearch-JobInfoHeader-subtitle', // Indeed
      '[data-test="location"]', // Glassdoor
      '.job-view-job-location', // ZipRecruiter
      '.top-card-layout__card .top-card-layout__third-subline', // LinkedIn
      '[class*="location"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }

    return '';
  }

  extractDescription() {
    const selectors = [
      '[data-automation-id="jobPostingDescription"]', // Workday
      '.job-description', '.job-description-content',
      '#jobDescriptionText', // Indeed
      '.job-description-container', // Glassdoor
      '.job-view-job-description', // ZipRecruiter
      '.jobs-description', // LinkedIn
      '[class*="description"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim().substring(0, 1000); // Limit length
      }
    }

    return '';
  }

  detectPlatform() {
    const url = window.location.href.toLowerCase();
    
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('indeed.com')) return 'Indeed';
    if (url.includes('glassdoor.com')) return 'Glassdoor';
    if (url.includes('ziprecruiter.com')) return 'ZipRecruiter';
    if (url.includes('monster.com')) return 'Monster';
    if (url.includes('dice.com')) return 'Dice';
    if (url.includes('workday.com') || url.includes('myworkdayjobs.com')) return 'Workday';
    if (url.includes('greenhouse.io')) return 'Greenhouse';
    if (url.includes('lever.co')) return 'Lever';
    
    return 'Unknown Platform';
  }

  async analyzeCurrentJob() {
    try {
      if (!this.jobData) {
        await this.detectJobPosting();
      }
      
      if (this.jobData) {
        chrome.runtime.sendMessage({
          action: 'analyzeJob',
          data: this.jobData
        });
      }
    } catch (error) {
      console.error('Job analysis error:', error);
    }
  }

  async saveCurrentJob() {
    try {
      if (!this.jobData) {
        await this.detectJobPosting();
      }
      
      if (this.jobData) {
        chrome.runtime.sendMessage({
          action: 'saveJob',
          data: this.jobData
        });
      }
    } catch (error) {
      console.error('Save job error:', error);
    }
  }

  async generateAndFillCoverLetter() {
    try {
      if (!this.jobData) {
        await this.detectJobPosting();
      }
      
      if (this.jobData) {
        const response = await chrome.runtime.sendMessage({
          action: 'generateCoverLetter',
          data: this.jobData
        });
        
        if (response && response.success) {
          await this.fillCoverLetter(response.coverLetter);
        }
      }
    } catch (error) {
      console.error('Cover letter generation error:', error);
    }
  }
}

// Initialize content script
new AutoJobrContentScript();