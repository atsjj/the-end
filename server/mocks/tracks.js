/*jshint node:true*/
'use strict';

const EventEmitter  = require('events').EventEmitter;
const restify       = require('restify');
const UI            = require('ember-cli/lib/ui');
const url           = require('url');
const ws            = require('ws');

class Pusher extends EventEmitter {
  constructor(options) {
    super();

    this.autoReconnect  = true;
    this.ui             = options.ui;
    this.webSocket      = undefined;
  }

  connect() {
    this.ui.writeLine(['Pusher', 'connect'].join(' '));

    const webSocket = ws.connect(this.path, this.open.bind(this));

    webSocket.on('message', this.message.bind(this));
    webSocket.on('close', this.close.bind(this));

    process.on('beforeExit', this.disconnect.bind(this));

    this.autoReconnect  = true;
    this.webSocket      = webSocket;
  }

  disconnect() {
    this.ui.writeLine(['Pusher', 'disconnect'].join(' '));

    this.autoReconnect = false;

    this.webSocket.terminate();
  }

  get path() {
    return `wss://pusherw.tunegenie.com/ws/kndd?_=${Date.now()}&tag=&time=&eventid=`;
  }

  open() {
    this.ui.writeLine(['Pusher', 'open'].join(' '));
  }

  message(data, flags) {
    this.ui.writeLine(['Pusher', 'message', data, 'flags', flags].join(' '));

    this.emit('updated');
  }

  close() {
    this.ui.writeLine(['Pusher', 'close'].join(' '));

    this.webSocket.removeListener('message', this.message.bind(this));
    this.webSocket.removeListener('close', this.close.bind(this));

    process.removeListener('beforeExit', this.disconnect.bind(this));

    if (this.autoReconnect) {
      this.webSocket = undefined;
      this.connect();
    }
  }
}

class Apple {
  constructor(options) {
    this.ui = options.ui;
  }

  get client() {
    return restify.createJsonClient({
      url: 'https://itunes.apple.com'
    });
  }

  get path() {
    return '/lookup?country=us&id=';
  }

  request(id) {
    if (id instanceof Array) {
      id = id.join(',');
    }

    this.ui.writeLine(['Apple', 'request'].join(' '));
    return new Promise((resolve, reject) => {
      this.client.get(`${this.path}${id}`, (error, request, response, json) => {
        if (error) {
          this.ui.writeLine(['Apple', 'request', 'promise', 'reject', `${this.path}${id}`].join(' '));
          reject(error);
        } else {
          this.ui.writeLine(['Apple', 'request', 'promise', 'resolve'].join(' '));
          resolve(json);
        }
      });
    });
  }
}

class Radio {
  constructor(options) {
    this.cache  = undefined;
    this.ui     = options.ui;
  }

  get client() {
    return restify.createJsonClient({
      url: 'http://api.tunegenie.com'
    });
  }

  get path() {
    return '/v1/brand/nowplaying/?b=kndd&apiid=entercom&count=10';
  }

  request() {
    return this.requestLive();
  }

  requestLive() {
    this.ui.writeLine('Radio', 'request');
    return new Promise((resolve, reject) => {
      this.client.get(this.path, (error, request, response, json) => {
        if (error) {
          this.ui.writeLine(['Radio', 'request', 'promise', 'reject'].join(' '));
          reject(error);
        } else {
          this.ui.writeLine(['Radio', 'request', 'promise', 'resolve'].join(' '));
          resolve(json);
        }
      });
    });
  }

  requestStatic() {
    this.ui.writeLine('Radio', 'request');
    this.ui.writeLine(['Radio', 'request', 'promise', 'resolve'].join(' '));
    return Promise.resolve({
      response: [
        { sid: 941366737 },
        { sid: 1052966705 },
        { sid: 547449577 },
        { sid: 807600196 },
        { sid: 1061243229 },
        { sid: 988868008 },
        { sid: 1049012545 },
        { sid: 936832277 },
        { sid: 1032583597 },
        { sid: 974485474 },
        { sid: 1022164261 },
        { sid: 973556123 },
      ]
    });
  }
}

class Playlist {
  constructor(options) {
    this.apple  = new Apple(options);
    this.cache  = [];
    this.pusher = new Pusher(options);
    this.radio  = new Radio(options);
    this.ui     = options.ui;

    this.pusher.on('updated', this.updated.bind(this));

    this.pusher.connect();
    this.updated();
  }

  updated() {
    this.ui.writeLine('Playlist', 'updated', 'promise');
    return this.radio.request()
      .then(data => data.response)
      .then(songs => {
        return songs
          .map(song => song.sid)
          .filter(id => id !== null && id !== undefined);
      })
      .then(ids => this.apple.request(ids))
      .then(data => data['results'])
      .then(results => {
        this.ui.writeLine(['Playlist', 'updated', 'promise', 'resolved'].join(' '));

        let json = {
          data: [],
          included: []
        };

        results.forEach(result => {
          let artist = {
            type:             'artists',
            id:               result.artistId,
            attributes: {
              name:           result.artistName,
              genre:          result.primaryGenreName
            },
            relationships: {
              albums: {
                links: {
                  self: '',
                  related: ''
                },
                data: [
                  { type: 'albums', id: result.collectionId }
                ]
              }
            },
            links: {
              self: ''
            }
          };

          let album = {
            type:             'albums',
            id:               result.collectionId,
            attributes: {
              name:             result.collectionName,
              'created-at':     result.releaseDate,
              'large-artwork':  result.artworkUrl100,
              'medium-artwork': result.artworkUrl60,
              'small-artwork':  result.artworkUrl30,
              discs:            result.discCount,
              tracks:           result.trackCount
            },
            relationships: {
              artist: {
                links: {
                  self: '',
                  related: ''
                },
                data: {
                  type: 'artist',
                  id: result.artistId
                }
              },
              songs: {
                links: {
                  self: '',
                  related: ''
                },
                data: [
                  { type: 'songs', id: result.trackId }
                ]
              }
            },
            links: {
              self: ''
            }
          };

          let song = {
            type:             'songs',
            id:               result.trackId,
            attributes: {
              'created-at':     result.releaseDate,
              name:             result.trackName,
              genre:            result.primaryGenreName,
              time:             result.trackTimeMillis,
              disc:             result.discNumber,
              track:            result.trackNumber
            },
            relationships: {
              artist: {
                links: {
                  self: '',
                  related: ''
                },
                data: {
                  type: 'artist',
                  id: result.artistId
                }
              },
              album: {
                links: {
                  self: '',
                  related: ''
                },
                data: {
                  type: 'album',
                  id: result.collectionId
                }
              }
            },
            links: {
              self: ''
            }
          };

          json.data.push(song);
          json.included.push(artist);
          json.included.push(album);
        });

        this.cache = json;
      })
      .catch(error => {
        this.ui.writeLine(['Playlist', 'updated', 'promise', 'rejected', error].join(' '));
      });
  }

  get tracks() {
    return this.cache;
  }
}

const ui = new UI({
  inputStream:  process.stdin,
  outputStream: process.stdout,
  errorStream:  process.stderr
});

const playlist = new Playlist({ ui: ui });

module.exports = function(app) {
  var express = require('express');
  var tracksRouter = express.Router();

  tracksRouter.get('/', function(req, res) {
    res.send(playlist.tracks);
  });

  tracksRouter.post('/', function(req, res) {
    res.status(201).end();
  });

  tracksRouter.get('/:id', function(req, res) {
    res.send({
      'tracks': {
        id: req.params.id
      }
    });
  });

  tracksRouter.put('/:id', function(req, res) {
    res.send({
      'tracks': {
        id: req.params.id
      }
    });
  });

  tracksRouter.delete('/:id', function(req, res) {
    res.status(204).end();
  });

  // The POST and PUT call will not contain a request body
  // because the body-parser is not included by default.
  // To use req.body, run:

  //    npm install --save-dev body-parser

  // After installing, you need to `use` the body-parser for
  // this mock uncommenting the following line:
  //
  //app.use('/api/tracks', require('body-parser'));
  app.use('/api/albums',  tracksRouter);
  app.use('/api/artists', tracksRouter);
  app.use('/api/songs',   tracksRouter);
  app.use('/api/tracks',  tracksRouter);
};
