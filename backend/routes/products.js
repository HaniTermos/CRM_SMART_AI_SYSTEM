const express = require('express');
const router = express.Router({ mergeParams: true }); // Important: to access :storeId from parent
const productController = require('../controllers/productController');
const { authenticate, requireStoreAccess, requireStoreAdmin } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const storeId = req.params.storeId;
    const dir = path.join(__dirname, '..', 'uploads', storeId);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: (process.env.MAX_FILE_SIZE_MB || 5) * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.get('/slug/:slug', productController.getBySlug);
router.use(authenticate);
router.post('/', requireStoreAdmin, productController.create);
router.put('/:id', requireStoreAdmin, productController.update);
router.delete('/:id', requireStoreAdmin, productController.delete);
router.post(
  '/upload', 
  requireStoreAdmin, 
  upload.single('file'), 
  productController.uploadImage
);

module.exports = router;
