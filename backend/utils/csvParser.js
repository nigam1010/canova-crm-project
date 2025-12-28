import fs from 'fs';

export const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.trim().split('\n');
      
      if (lines.length < 2) {
        reject(new Error('CSV file is empty or has no data rows'));
        return;
      }
      
      // Get headers (first row)
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Validate required columns
      const requiredColumns = ['name', 'email', 'source', 'date', 'location', 'language'];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
        return;
      }
      
      // Parse data rows
      const data = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim());
        const row = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        // Validate row has required fields
        if (row.name && row.email && row.language) {
          data.push({
            name: row.name,
            email: row.email,
            source: row.source,
            date: row.date,
            location: row.location,
            language: row.language
          });
        }
      }
      
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};

export const validateCSVStructure = (data) => {
  const errors = [];
  
  data.forEach((row, index) => {
    if (!row.name) errors.push(`Row ${index + 2}: Name is required`);
    if (!row.email) errors.push(`Row ${index + 2}: Email is required`);
    if (!row.language) errors.push(`Row ${index + 2}: Language is required`);
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
