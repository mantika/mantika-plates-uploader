function storageAvailable(type) {
  try {
    var storage = window[type],
      x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  }
  catch(e) {
    return false;
  }
}

(function () {

  var worker = new Worker('js/uploader.js');

  worker.onmessage = function(e) {
    if (!e.data.err) {
      var store = getObjectStore("images", "readwrite");
      store.delete(e.data.id);
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
      alert('Error opening DB');
    };

    // Populate saved images
    var store = getObjectStore("images", "readonly");
    store.openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        pending.innerHTML += '<div id="'+cursor.value.name+'">'+cursor.value.name+'</div>';
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
            pending.innerHTML += '<div id="'+file.name+'">'+file.name+'</div>';

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
