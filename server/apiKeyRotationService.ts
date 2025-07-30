import Groq from "groq-sdk";
import { Resend } from 'resend';

interface ApiKeyPool {
  keys: string[];
  currentIndex: number;
  failedKeys: Set<string>;
  lastFailureTime: Map<string, number>;
  cooldownPeriod: number; // in milliseconds
}

interface ServiceConfig {
  name: string;
  envPrefix: string;
  maxRetries: number;
  cooldownPeriod: number;
}

class ApiKeyRotationService {
  private groqPool: ApiKeyPool;
  private resendPool: ApiKeyPool;
  private groqClients: Map<string, Groq> = new Map();
  private resendClients: Map<string, Resend> = new Map();

  constructor() {
    // Initialize Groq key pool
    this.groqPool = this.initializeKeyPool('GROQ_API_KEY', {
      name: 'Groq',
      envPrefix: 'GROQ_API_KEY',
      maxRetries: 3,
      cooldownPeriod: 60000 // 1 minute cooldown
    });

    // Initialize Resend key pool
    this.resendPool = this.initializeKeyPool('RESEND_API_KEY', {
      name: 'Resend',
      envPrefix: 'RESEND_API_KEY',
      maxRetries: 3,
      cooldownPeriod: 300000 // 5 minute cooldown for email service
    });

    // Initialize clients
    this.initializeGroqClients();
    this.initializeResendClients();

    console.log(`🔄 API Key Rotation Service initialized:`);
    console.log(`   - Groq keys available: ${this.groqPool.keys.length}`);
    console.log(`   - Resend keys available: ${this.resendPool.keys.length}`);
  }

  private initializeKeyPool(envPrefix: string, config: ServiceConfig): ApiKeyPool {
    const keys: string[] = [];
    
    // Check for multiple API keys with numbered suffixes
    for (let i = 1; i <= 10; i++) {
      const keyName = i === 1 ? envPrefix : `${envPrefix}_${i}`;
      const key = process.env[keyName];
      if (key && key.trim()) {
        keys.push(key.trim());
      }
    }

    // If no numbered keys found, check the base key
    if (keys.length === 0) {
      const baseKey = process.env[envPrefix];
      if (baseKey && baseKey.trim()) {
        keys.push(baseKey.trim());
      }
    }

    return {
      keys,
      currentIndex: 0,
      failedKeys: new Set(),
      lastFailureTime: new Map(),
      cooldownPeriod: config.cooldownPeriod
    };
  }

  private initializeGroqClients(): void {
    this.groqPool.keys.forEach(key => {
      try {
        const client = new Groq({ apiKey: key });
        this.groqClients.set(key, client);
      } catch (error) {
        console.warn(`Failed to initialize Groq client for key: ${key.substring(0, 10)}...`);
      }
    });
  }

  private initializeResendClients(): void {
    this.resendPool.keys.forEach(key => {
      try {
        const client = new Resend(key);
        this.resendClients.set(key, client);
      } catch (error) {
        console.warn(`Failed to initialize Resend client for key: ${key.substring(0, 10)}...`);
      }
    });
  }

  private getNextWorkingKey(pool: ApiKeyPool): string | null {
    const now = Date.now();
    const totalKeys = pool.keys.length;
    
    if (totalKeys === 0) return null;

    // Try to find a working key, starting from current index
    for (let attempts = 0; attempts < totalKeys; attempts++) {
      const key = pool.keys[pool.currentIndex];
      
      // Check if key is in cooldown
      const lastFailure = pool.lastFailureTime.get(key);
      const isInCooldown = lastFailure && (now - lastFailure) < pool.cooldownPeriod;
      
      if (!pool.failedKeys.has(key) || !isInCooldown) {
        // Remove from failed keys if cooldown period has passed
        if (isInCooldown === false) {
          pool.failedKeys.delete(key);
          pool.lastFailureTime.delete(key);
        }
        
        return key;
      }
      
      // Move to next key
      pool.currentIndex = (pool.currentIndex + 1) % totalKeys;
    }

    // If all keys are failed and in cooldown, return the least recently failed
    let oldestFailureKey = pool.keys[0];
    let oldestFailureTime = pool.lastFailureTime.get(oldestFailureKey) || 0;

    for (const key of pool.keys) {
      const failureTime = pool.lastFailureTime.get(key) || 0;
      if (failureTime < oldestFailureTime) {
        oldestFailureTime = failureTime;
        oldestFailureKey = key;
      }
    }

    return oldestFailureKey;
  }

  private markKeyAsFailed(pool: ApiKeyPool, key: string): void {
    pool.failedKeys.add(key);
    pool.lastFailureTime.set(key, Date.now());
    
    // Move to next key
    const keyIndex = pool.keys.indexOf(key);
    if (keyIndex !== -1) {
      pool.currentIndex = (keyIndex + 1) % pool.keys.length;
    }

    console.warn(`🚨 API key marked as failed: ${key.substring(0, 10)}... (${pool.failedKeys.size}/${pool.keys.length} failed)`);
  }

  private isRateLimitError(error: any): boolean {
    const errorString = error?.toString()?.toLowerCase() || '';
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code?.toString() || '';
    const status = error?.status || error?.response?.status;

    return (
      status === 429 ||
      errorCode === '429' ||
      errorString.includes('rate limit') ||
      errorString.includes('too many requests') ||
      errorString.includes('quota exceeded') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      errorMessage.includes('quota exceeded')
    );
  }

  private isTemporaryError(error: any): boolean {
    const status = error?.status || error?.response?.status;
    return status >= 500 || this.isRateLimitError(error);
  }

  async executeWithGroqRotation<T>(
    operation: (client: Groq) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const key = this.getNextWorkingKey(this.groqPool);
      
      if (!key) {
        throw new Error('No Groq API keys available');
      }

      const client = this.groqClients.get(key);
      if (!client) {
        this.markKeyAsFailed(this.groqPool, key);
        continue;
      }

      try {
        console.log(`🤖 Using Groq key: ${key.substring(0, 10)}... (attempt ${attempt + 1}/${maxRetries})`);
        const result = await operation(client);
        
        // Success - remove key from failed list if it was there
        this.groqPool.failedKeys.delete(key);
        this.groqPool.lastFailureTime.delete(key);
        
        return result;
      } catch (error) {
        lastError = error;
        console.error(`Groq operation failed with key ${key.substring(0, 10)}...:`, error);

        // Mark key as failed if it's a rate limit or server error
        if (this.isTemporaryError(error)) {
          this.markKeyAsFailed(this.groqPool, key);
        }

        // If it's not a temporary error, don't rotate keys
        if (!this.isTemporaryError(error)) {
          throw error;
        }

        // Short delay before retry
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('All Groq API keys exhausted');
  }

  async executeWithResendRotation<T>(
    operation: (client: Resend) => Promise<T>,
    maxRetries: number = 2
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const key = this.getNextWorkingKey(this.resendPool);
      
      if (!key) {
        throw new Error('No Resend API keys available');
      }

      const client = this.resendClients.get(key);
      if (!client) {
        this.markKeyAsFailed(this.resendPool, key);
        continue;
      }

      try {
        console.log(`📧 Using Resend key: ${key.substring(0, 10)}... (attempt ${attempt + 1}/${maxRetries})`);
        const result = await operation(client);
        
        // Success - remove key from failed list if it was there
        this.resendPool.failedKeys.delete(key);
        this.resendPool.lastFailureTime.delete(key);
        
        return result;
      } catch (error) {
        lastError = error;
        console.error(`Resend operation failed with key ${key.substring(0, 10)}...:`, error);

        // Mark key as failed if it's a rate limit or server error
        if (this.isTemporaryError(error)) {
          this.markKeyAsFailed(this.resendPool, key);
        }

        // If it's not a temporary error, don't rotate keys
        if (!this.isTemporaryError(error)) {
          throw error;
        }

        // Longer delay for email service
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('All Resend API keys exhausted');
  }

  getStatus() {
    return {
      groq: {
        totalKeys: this.groqPool.keys.length,
        failedKeys: this.groqPool.failedKeys.size,
        currentIndex: this.groqPool.currentIndex,
        availableKeys: this.groqPool.keys.length - this.groqPool.failedKeys.size
      },
      resend: {
        totalKeys: this.resendPool.keys.length,
        failedKeys: this.resendPool.failedKeys.size,
        currentIndex: this.resendPool.currentIndex,
        availableKeys: this.resendPool.keys.length - this.resendPool.failedKeys.size
      }
    };
  }

  // Method to manually reset failed keys (useful for admin endpoints)
  resetFailedKeys(service?: 'groq' | 'resend'): void {
    if (!service || service === 'groq') {
      this.groqPool.failedKeys.clear();
      this.groqPool.lastFailureTime.clear();
      console.log('🔄 Groq failed keys reset');
    }
    
    if (!service || service === 'resend') {
      this.resendPool.failedKeys.clear();
      this.resendPool.lastFailureTime.clear();
      console.log('🔄 Resend failed keys reset');
    }
  }
}

// Export singleton instance
export const apiKeyRotationService = new ApiKeyRotationService();