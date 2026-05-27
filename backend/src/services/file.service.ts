import fs from 'fs';
import pdf from 'pdf-parse';
import logger from '../config/logger';

export const extractTextFromFile = async (filePath: string, mimetype: string): Promise<string> => {
  try {
    if (mimetype === 'application/pdf' || filePath.endsWith('.pdf')) {
      const buffer = fs.readFileSync(filePath);
      const data = await pdf(buffer);
      return data.text.trim();
    } else if (mimetype === 'text/plain' || filePath.endsWith('.txt')) {
      return fs.readFileSync(filePath, 'utf-8').trim();
    }
    return '';
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to extract text from ${filePath}: ${errMsg}`);
    return '';
  }
};
