import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure 'public/uploads' folder exists
const uploadDirectory = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Set up multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    },
});

// Filter for image and PDF files only
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        return cb(new Error('Only .pdf, .jpeg, and .png formats allowed!'), false);
    }
};

// Configure multer middleware with size limit and file type filter
const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // Max file size 25MB
    fileFilter: fileFilter,
}).single('file');

// Middleware function
const uploadMiddleware = (req, res, next) => {
    console.log('Received Request, Multer Middleware');

    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Handle Multer-specific errors
            console.error('Multer Error:', err.message);
            return res.status(400).json({ error: err.message });
        } else if (err) {
            // Handle other errors
            console.error('Error:', err.message);
            return res.status(400).json({ error: err.message });
        }

        // No file uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded!' });
        }

        // Read the file from disk and convert to base64
        const filePath = req.file.path;
        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.error('File Read Error:', err.message);
                return res.status(500).json({ error: 'Error reading file' });
            }

            const base64Image = data.toString('base64');
            // Optionally, you can store the base64 string in the request object for further processing
            req.base64Image = base64Image;

            // Proceed to the next middleware or controller
            next();
        });
    });
};

export default uploadMiddleware;
