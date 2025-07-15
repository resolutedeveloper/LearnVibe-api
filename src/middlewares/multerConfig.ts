import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
     const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});
// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (_req, file, cb) => {
//     cb(null, file.originalname); // ✅ Keep the same name
//   },
// });
export const upload = multer({ storage: storage });
