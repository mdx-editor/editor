/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import express from 'express'
import multer, { diskStorage } from 'multer'
import { extname } from 'path'

// Set up the storage configuration for Multer
const storage = diskStorage({
  destination: './uploads',
  filename: function (_req, file, callback) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const extension = extname(file.originalname)
    callback(null, file.fieldname + '-' + uniqueSuffix + extension)
  }
})

// Create the Multer upload instance
const upload = multer({ storage: storage })

// Create an Express application
const app = express()

// Serve the uploaded files
app.use('/uploads', express.static('./uploads'))

// Define a route with the upload middleware
app.post('/uploads/new', upload.single('image'), (req, res) => {
  // Get the file URL
  const fileUrl = req.protocol + '://' + req.get('host') + '/uploads/' + req.file.filename

  // Return the file URL
  res.send({ url: fileUrl })
})

// Start the server
const port = 65432
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})
