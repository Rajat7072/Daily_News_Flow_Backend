const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "articlesImages",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else resolve(result);
      },
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};
module.exports = uploadToCloudinary;
