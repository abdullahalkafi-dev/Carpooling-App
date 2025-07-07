import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

const unlinkFile = async (file: string): Promise<void> => {
  try {
    const filePath = path.join('uploads', file);
    
    // Check if file exists before trying to delete
    if (fs.existsSync(filePath)) {
      await unlinkAsync(filePath);
      console.log(`Successfully deleted file: ${filePath}`);
    } else {
      console.warn(`File not found for deletion: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error deleting file ${file}:`, error);
    throw error;
  }
};

// Keep the synchronous version for backward compatibility
const unlinkFileSync = (file: string): void => {
  try {
    const filePath = path.join('uploads', file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Successfully deleted file: ${filePath}`);
    } else {
      console.warn(`File not found for deletion: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error deleting file ${file}:`, error);
    throw error;
  }
};

export default unlinkFile;
export { unlinkFileSync };
