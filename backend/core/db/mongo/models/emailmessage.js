'use strict';

var mongoose = require('mongoose');

var MessageAttachmentSchema = new mongoose.Schema({
  _id: {type: mongoose.Schema.Types.ObjectId, required: true},
  name: {type: String, required: false},
  contentType: {type: String, required: true},
  length: {type: Number, required: true}
});

var EmailMessageSchema = new mongoose.Schema({
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  objectType: {type: String, required: true, default: 'email'},
  author: {type: mongoose.Schema.ObjectId, required: true},
  language: {type: String, required: false},
  headers: [mongoose.Schema.Mixed],
  body: {
    text: {type: String, required: false},
    html: {type: String, required: false}
  },
  attachments: {type: [MessageAttachmentSchema], required: false },
  shares: [{
    objectType: {type: String},
    id: {type: String}
  }],
  responses: [mongoose.Schema.Mixed]
}, { collection: 'messages' });

module.exports = mongoose.model('EmailMessage', EmailMessageSchema);
