window = {};

importScripts('https://sdk.amazonaws.com/js/aws-sdk-2.2.33.min.js');
importScripts('https://rawgit.com/broofa/node-uuid/master/uuid.js');

window.AWS.config.credentials = {};

window.AWS.config.httpOptions.timeout = 0;
window.AWS.config.httpOptions.xhrAsync = false;

// Configure your region
window.AWS.config.region = 'us-east-1';
var bucket = new window.AWS.S3({params: {Bucket: 'mantika-plates'}});
var queue = [];

setInterval(function(){
  if (queue.length > 0 ) {
    var imgData = queue[0];
    var params = {Key: window.uuid.v4(), ContentType: imgData.image.type, Body: imgData.image};
    bucket.makeUnauthenticatedRequest('putObject', params, function(err, data) {
      if (!err) {
        postMessage({err: err, id: imgData.id, name: imgData.image.name});
        queue.splice(0, 1);
      }
    });
  }
}, 5000);

onmessage = function(e) {
  queue.push(e.data);
}

