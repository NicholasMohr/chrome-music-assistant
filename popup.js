// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getAudibleTabs(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    audible: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    // console.assert(tabs.length == 1, 'you should only be listening to one thing at once')
    // if(tabs.length == 1) {
    //   var tab = tabs[0];
    // }

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    // var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    // console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(tabs);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, function(tabs) {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

function hasTable() {

}

function addToTable(time, favorite) {
  var tbody = document.getElementById('tbody');

  var tr = "<tr>";
  debugger
  /* Must not forget the $ sign */
  if (favorite !== null && typeof favorite === 'object' && Object.keys(favorite).length > 0) {
    tr += "<td>" + time + "</td>" + "<td>" + favorite.title + "<td>" + "<button class=deleteBtn id='" + time + "'>delete</button>"  + "</td>" + "</td></tr>";
  } else {
    tr += "<td>" + time + "</td>" + "<td>" + favorite + "<td>" + "<button class=deleteBtn id='" + time + "'>delete</button>"  + "</td>" + "</td></tr>";

  }
  /* We add the table row to the table body */
  tbody.innerHTML += tr;
}

function clearTable() {
  var tbody = document.getElementById('tbody');
  tbody.innerHTML = '';
}


function renderTable() {
  chrome.storage.sync.get(function(data){
    for (var time in data) {
      addToTable(time, data[time]);
    }
    deleteButtons = document.getElementsByClassName("deleteBtn")
    for (var i = deleteButtons.length - 1; i >= 0; i--) {
      var btn = deleteButtons[i];
      btn.addEventListener("click", function(evt){
        chrome.storage.sync.remove(evt.currentTarget.id, rerenderTable);
      });
    }
  });
}

function rerenderTable() {
  clearTable();
  renderTable();
}

document.addEventListener('DOMContentLoaded', function() {
  renderTable();
});

function addToStorage(hostname, info) {
  newSongRecord = {}
  newSongRecord[Date() + hostname] = info
  chrome.storage.sync.set(newSongRecord);
}

chrome.runtime.onMessage.addListener(function (message) {
  addToStorage(message[0], message[1])
})

chrome.commands.onCommand.addListener(function() {
  getAudibleTabs(function(tabs) {
    for (var tabIndex in tabs) {
      tab = tabs[tabIndex];
      var hostname = new URL(tab.url).hostname;
      chrome.tabs.executeScript(tab.id, {file: "jquery-3.1.0.min.js"}, function (){
        switch(hostname) {
          case "play.spotify.com":
            addToStorage(hostname, tab);
            chrome.tabs.executeScript(tab.id, {file: "siteHandlers/spotify.js"});
            break;
          case "noonpacific.com":
            chrome.tabs.executeScript(tab.id, {file: "siteHandlers/noonpacific.js"});
            break;
          case "soundcloud.com":
            addToStorage(hostname, tab);
            chrome.tabs.executeScript(tab.id, {file: "siteHandlers/soundcloud.js"});
            break;
          case "8tracks.com":
            addToStorage(hostname, tab);
            chrome.tabs.executeScript(tab.id, {file: "siteHandlers/8tracks.js"});
            break;
          case "songza.com":
            addToStorage(hostname, tab);
            chrome.tabs.executeScript(tab.id, {file: "siteHandlers/songza.js"});
            break;
          default:
            addToStorage(hostname, tab);
            chrome.tabs.executeScript(tab.id, {file: "siteHandlers/default.js"});
        };
      });

    }
  });
});
