const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  name: String,
  data: String,
});

const Image = mongoose.model("Image", ImageSchema);

module.exports = Image;
