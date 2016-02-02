(function () {

  var getThumbnail = function(original) {
    var canvas = document.createElement("canvas")

    canvas.width = 100;
    canvas.height = 100;
    canvas.id = original.id;

    canvas.getContext("2d").drawImage(original, 0, 0, canvas.width, canvas.height)

    return canvas
  }

  var worker = new Worker('js/uploader.js');

  worker.onmessage = function(e) {
    if (!e.data.err) {
      var store = getObjectStore("images", "readwrite");
      var request = store.delete(e.data.id);
      request.onerror = function(event) {
        console.log("Error deleting data", event);
      }
      document.getElementById(e.data.name).remove();
    }
  }


  window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB,
    IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction,
    dbVersion = 2;

  var request = indexedDB.open("images", dbVersion);
  var db;

  // Get window.URL object
  var URL = window.URL || window.webkitURL;

  var takePicture = document.querySelector("#picture"),
    pending = document.querySelector("#pending");


  request.onsuccess = function (event) {
    console.log("Success creating/accessing IndexedDB database");
    db = request.result;

    db.onerror = function (event) {
      console.log(event.target.errorCode);
      alert('DB Error');
    };

    // Populate saved images
    var store = getObjectStore("images", "readonly");
    store.openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        var image = new Image();
        image.addEventListener('load', function(){
          pending.appendChild(getThumbnail(this));
        });
        image.id = cursor.value.name;
        image.src = URL.createObjectURL(cursor.value);
        cursor.continue();
      } else {
        console.log('No more entries');
      }
    };
  };

  createObjectStore = function (dataBase) {
    // Create an objectStore
    console.log("Creating objectStore")
    dataBase.createObjectStore("images", {autoIncrement: true});
  },

  //For future use. Currently only in latest Firefox versions
  request.onupgradeneeded = function (event) {
    createObjectStore(event.target.result);
  };

  getObjectStore = function(storeName, mode) {
    return db.transaction(storeName, mode).objectStore(storeName);
  }


  if (takePicture && pending) {

    // Set events
    takePicture.onchange = function (event) {

      // Get a reference to the taken picture or chosen file
      var files = event.target.files,
        file;
      if (files) {
        var store = getObjectStore("images", "readwrite");
        for (var i = 0; i < files.length; i ++) {
          file = files[i];
          try {

            store.put(file);

            var image = new Image();
            image.addEventListener('load', function(){
              pending.appendChild(getThumbnail(this));
            });
            image.id = file.name;
            image.src = URL.createObjectURL(file);

          } catch (e) {
            alert('Error processing image');
            console.log(e);
          }
        }
      }
    };

    document.querySelector("#reset").onclick = function() {
      getObjectStore("images", "readwrite").clear();
      pending.innerHTML = '';
    };


    document.querySelector("#upload").onclick = function() {
      var store = getObjectStore("images", "readonly");
      store.openCursor().onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
          worker.postMessage({id: cursor.key, image: cursor.value});
          cursor.continue();
        } else {
          console.log('All done');
        }
      };
    };

  }
})();
