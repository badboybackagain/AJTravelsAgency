// ============================================================
// AJ Travels — Admin Blog Routes (/api/admin/blogs)
// Protected by JWT auth and ADMIN role requirement
// ============================================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const upload = require('../middleware/upload');
const {
  adminGetAllBlogs,
  adminGetBlogById,
  createBlog,
  updateBlog,
  togglePublishStatus,
  deleteBlog,
  uploadBlogImage,
} = require('../controllers/blogController');

// All admin blog endpoints require authentication and admin privileges
router.use(auth);
router.use(adminOnly);

// Image upload middleware configuring 'blogs' category
const uploadBlogImageMiddleware = (req, res, next) => {
  req.uploadCategory = 'blogs';
  next();
};

// POST /api/admin/blogs/upload-image — Upload featured/inline image
router.post(
  '/upload-image',
  uploadBlogImageMiddleware,
  upload.single('image'),
  uploadBlogImage
);

// GET /api/admin/blogs — List all articles (published & drafts)
router.get('/', adminGetAllBlogs);

// GET /api/admin/blogs/:id — Get article for editing
router.get('/:id', adminGetBlogById);

// POST /api/admin/blogs — Create new blog article
router.post('/', createBlog);

// PUT /api/admin/blogs/:id — Update existing blog article
router.put('/:id', updateBlog);

// PATCH /api/admin/blogs/:id/publish-status — Toggle publish/draft
router.patch('/:id/publish-status', togglePublishStatus);

// DELETE /api/admin/blogs/:id — Delete blog article
router.delete('/:id', deleteBlog);

module.exports = router;

