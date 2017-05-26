'use strict';

var eventsToListen = ['message'];
var socket = {};
var disconnectedInerval;
var url = '', token = '', path = 'socket.io';
var title = document.title;

$(function () {
  $('.disconnected-alert, .connected-alert').hide();
  $('#eventPanels').prepend(makePanel('message'));

  $("#connect").submit(function (e) {
    e.preventDefault();
    
    url = $("#connect input:first").val().trim();
    token = $("#token").val().trim();
    path = $("#path").val().trim() || path;
    
    if(url === '') {
      console.error('Invalid URL given');
    } 
    else {
      console.log('#connect url: ', url, '  token: ', token, '   path: ', path);
      
      socket = io(url, {
          path: '/' + path,
          query: 'token=' + token,
//        transports: ['websocket', 'xhr-polling']
      });
      
      setHash();
      
      socket.on('event', function (event) {
        console.log('on event... event: ', event);
      });

      socket.on('error', function (err) {
        console.log('on error...', err);
      });

      socket.on('connect-error', function (err) {
        console.log('on connect-error...', err);
      });

      socket.on('ping', function () {
        console.log('on ping...');
      });

      socket.on('connect', function () {
        console.log('on connect event.....');
          
        $('#emitDataMenuButton').removeClass('disabled');
        clearInterval(disconnectedInerval);
        document.title = title;
        $('.disconnected-alert').hide();
        $('.connected-alert').show().delay(5000).fadeOut(1000);
        $("#connectionPanel").prepend('<p><span class="text-muted">'+Date.now()+'</span> Connected</p>');
      });
      
      socket.on('disconnect', function (sock) {
        console.log('on disconnect event.....');
          
        $('#emitDataMenuButton').addClass('disabled');
        disconnectedInerval = setInterval(function(){
          if(document.title === "Disconnected") {
            document.title = title;
          } else {
            document.title = "Disconnected";
          }
        }, 800);
        $('.disconnected-alert').hide();
        $('.disconnected-alert').show();
        $("#connectionPanel").prepend('<p><span class="text-muted">'+Date.now()+'</span> Disconnected --> '+sock+'</p>');
      });
      
      registerEvents();
    }
  });

  $("#addListener").submit(function (e) {
    e.preventDefault();
    var event = $("#addListener input:first").val().trim();
    if(event !== '') {
      eventsToListen.push(event);
      $('#eventPanels').prepend(makePanel(event));
      $("#addListener input:first").val('');
      setHash();
      registerEvents();
    } else {
      console.error('Invalid event name');
    }
  });

  $("#emitData").submit(function (e) {
    if(socket.io) {
      var event = $("#emitData #event-name").val().trim();
      var data = $("#emitData #data-text").val().trim();
      if(event !== '' && data !== '') {
        $('#emitData #event-name').val('');
        $("#emitData #data-text").val('');
        socket.emit(event, data);
        $('#emitDataModal').modal('toggle');
      } else {
        console.error('Emitter - Invalid event name or data');
      }
    } else {
      console.error('Emitter - not connected');
    }
    e.preventDefault();
  });
  
  processHash();
});

function setHash() {
  if(url !== '' && eventsToListen.length > 0) {
    var hashEvents = eventsToListen.slice();
    var messageIndex = hashEvents.indexOf('message');
    if(messageIndex !== -1) {
      hashEvents.splice(messageIndex, 1);
    }
    location.hash = "url="+window.btoa(url) + "&path="+window.btoa(path) + "&token="+window.btoa(token) + "&events="+hashEvents.join();
  }
}

function processHash () {
  var hash = location.hash.substr(1);
  if(hash.indexOf('url=') !== -1 && hash.indexOf('events=')  !== -1) {
    var hashUrl = window.atob(hash.substr(hash.indexOf('url=')).split('&')[0].split('=')[1]);
    var hashPath = window.atob(hash.substr(hash.indexOf('path=')).split('&')[0].split('=')[1]);
    var hashToken = window.atob(hash.substr(hash.indexOf('token=')).split('&')[0].split('=')[1]);
    var hashEvents = hash.substr(hash.indexOf('events=')).split('&')[0].split('=')[1].split(',');
    $.merge(eventsToListen, hashEvents);
    $.each(hashEvents, function (index, value) {
      $('#eventPanels').prepend(makePanel(value));
    });
    $('#connect input:first').val(hashUrl);
    $('#path').val(hashPath);
    $('#token').val(hashToken);
    $('#connect').submit();
  }
}

function registerEvents() {
  if(socket.io) {
    $.each(eventsToListen, function (index, value) {
      var selector = jq("panel-"+value+"-content");
      socket.on(value, function (data) {
        data = data === undefined ? '-- NO DATA --' : data;
        $(selector).prepend('<p><span class="text-muted">'+Date.now()+'</span><strong> '+JSON.stringify(data)+'</strong></p>');
      });
    });
  }
}

// escape any special chars for jquery selector
function jq( myid ) {
    return "#" + myid.replace( /(\*|:|\.|\[|\]|,|=|@)/g, "\\$1" );
}

function makePanel(event) {
  return '<div class="panel panel-primary" id="panel-'+event+'"> <div class="panel-heading"> <button type="button" class="btn btn-warning btn-xs pull-right" data-toggle="collapse" data-target="#panel-'+event+'-content" aria-expanded="false" aria-controls="panel-'+event+'-content">Toggle panel</button> <h3 class="panel-title">On "'+event+'" Events</h3> </div> <div id="panel-'+event+'-content" class="panel-body"></div> </div>';
}
