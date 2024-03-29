const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const fs = require('fs');

// serce static files from the assets directory
app.use('/assets', express.static(path.join(__dirname, 'assets')))

const getFiles = (directoryPath) => {
  try {
    const files = fs.readdirSync(directoryPath);
    return files;
  } catch (err) {
    console.error(err);
    return [];
  }
};

const assetsDirectoryPath = path.join(__dirname, 'assets');
const files = getFiles(assetsDirectoryPath);

// GET /getFiles to get the list of files in the assets directory
app.get('/getFiles', (req, res) => {
  const filesWithId = files.map((file, index) => {
    return {
      id: index + 1,
      name: file
    };
  });
  res.status(200).send({ data: filesWithId });
}
);

const upload = multer({ dest: path.join(__dirname, 'assets') });

// POST /uploadFile to upload a file to the assets directory with the name of the file as the directory name
app.post('/uploadFile', upload.single('file'), async (req, res) => {
  const file = req.file;
  const fileName = path.parse(file.originalname).name;

  const directoryPath = path.join(__dirname, 'assets', fileName);
  // Check if the directory exists and remove it if it does
  if (fs.existsSync(directoryPath)) {
    try {
      await fs.promises.rm(directoryPath, { recursive: true });
      // Directory removed successfully
    } catch (err) {
      console.error(err);
      return res.status(500).send('Error removing directory');
    }
  }

  // Create the directory with the name of the file
  try {
    await fs.promises.mkdir(directoryPath, { recursive: true });
    // Directory created successfully
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error creating directory');
  }

  const filePath = path.join(directoryPath, file.originalname);

  // Move the file to the directory with the name of the file and the original name of the file
  // If the file already exists, it will be replaced
  fs.rename(file.path, filePath, async (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error saving file');
    }
    if (fs.existsSync(file.path)) {

      try {
        await fs.promises.rm(file.path, { recursive: true });
      } catch (err) {
        console.error(err);
        return res.status(500).send('Error removing file');
      }
    }
    res.status(200).send('File uploaded successfully');
  });

});
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});