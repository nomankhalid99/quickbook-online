import AWS from "aws-sdk";
import path from "path";
import fs from "fs";
//working code
// Configure AWS SDK with IAM user credentials
const extractTextFromImage = async (req, res,next) => {
  AWS.config.update(
    {
      accessKeyId: process.env.AMAZON_ACCESS_KEY_ID,
      secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY,
      region: 'us-west-1', // e.g., 'us-east-1'
    }
  );

  const s3 = new AWS.S3();
  const textract = new AWS.Textract();

  try {
    console.log('Reading file path');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, req.file.filename);

    // Log the resolved file path
    console.log('Resolved file path:', filePath);

    const fileContent = fs.readFileSync(filePath);
    console.log(fileContent);

    // Upload file to S3
    const s3Params = {
      Bucket: 'qucikbook-imgs-bucket',
      Key: `uploads/${req.file.filename}`,
      Body: fileContent,
      ContentType: req.file.mimetype,
    };

    const s3Data = await s3.upload(s3Params).promise();
    console.log(`File uploaded successfully. Key: ${s3Data.Key}`);
    console.log(`File uploaded successfully. Bucket: ${s3Data.Bucket}`);

    // Analyze the document with Amazon Textract
    const textractParams = {
      Document: {
        S3Object: {
          Bucket: `${s3Data.Bucket}`,
          Name: `${s3Data.Key}`,
        },
      },
    };

    const textractData = await textract.detectDocumentText(textractParams).promise();

    // Extract Blocks from Textract response
    const blocks = textractData.Blocks;
    
    // Process WORD and LINE blocks
    const text = blocks
      .filter(block => block.BlockType === 'LINE')
      .map(block => block.Text);

    // Log the extracted text
    console.log('Extracted Text:', JSON.stringify(text, null, 2));
    // console.log(text);

    // Send response with extracted text data
    req.body.extractedText=text
    next()
    // res.json({ text });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('An error occurred.');
  }
};

export default extractTextFromImage;
