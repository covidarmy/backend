const Schema = mongoose.Schema;

var fraudSchema = new Schema({
  "Title": {
    "type": "String"
  },
  "Number": {
    "type": [
      "Number"
    ]
  },
  "Stash": {
    "type": [
      "Number"
    ]
  }});
  module.exports = mongoose.model('Fraud',fraudSchema,"Fraud");