import fs from 'fs';
import path from 'path';

// Manual .env file loader (no dotenv package)
export const loadEnv = () => {
  try {
    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      console.log('⚠️ No .env file found, using defaults');
      return;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      line = line.trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) return;
      
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      
      if (key && value) {
        process.env[key.trim()] = value;
      }
    });
    
    console.log('✅ Environment variables loaded');
  } catch (error) {
    console.error('❌ Error loading .env file:', error.message);
  }
};
