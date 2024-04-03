const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const https = require('https');

// const options = {
//   key: fs.readFileSync('./cert/key.pem'),
//   cert: fs.readFileSync('./cert/cert.pem'),
// };

const app = express();

app.use(express.static(path.join(__dirname, 'assets')));

app.get('/api/getAsset/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, 'assets/', fileName, fileName + '.glb');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  }
  else {
    res.status(404).send('File not found');
  }
}
);

const getFiles = (directoryPath) => {
  try {
    const files = fs.readdirSync(directoryPath);
    return files;
  } catch (err) {
    console.error(err);
    return [];
  }
};

const convertToJpg = async (filePath) => {
  const input = filePath;
  const output = filePath.replace('.glb', '.jpg');
  const command = `npx screenshot-glb -i ${input} -o ${output} -h 100 -w 100&`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Command stderr: ${stderr}`);
      return;
    }
    console.log(`Command stdout: ${stdout}`);
  });
};

// GET /getFiles to get the list of files in the assets directory
app.get('/api/getFiles', (req, res) => {
  const assetsDirectoryPath = path.join(__dirname, 'assets');
  const files = getFiles(assetsDirectoryPath);

  const filesWithId = files.map((file, index) => {
    return {
      id: index + 1,
      name: file,
      lastModified: fs.statSync(path.join(assetsDirectoryPath, file)).mtime,
      img: `${file}/${file}.jpg`
    };
  });
  res.status(200).send({ data: filesWithId });
}
);

const upload = multer({ dest: path.join(__dirname, 'assets') });

// POST /uploadFile to upload a file to the assets directory with the name of the file as the directory name
app.post('/api/uploadFile', upload.single('file'), async (req, res) => {
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

    const covertToJpg = await convertToJpg(filePath).then(() => {
      res.status(200).send('File uploaded successfully');
    }
    );
  });

});
// https.createServer(options, app).listen(3000, () => {
//   console.log('HTTPS Server is running on port 3000');
// });

// app.listen(3000, () => {
//   console.log('Server is running on port 3000');
// });