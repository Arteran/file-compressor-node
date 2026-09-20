'use strict';

const http = require('http');
const fs = require('fs');
const zlib = require('zlib');
const { formidable } = require('formidable');

function createServer() {
  const server = http.Server();

  server.on('request', (req, res) => {
    if (req.url === '/' && req.method === 'GET') {
      fs.readFile('./public/form.html', (err, data) => {
        if (!err) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);

          return;
        }

        res.statusCode = 500;
        res.end('Server error');
      });

      return;
    }

    if (req.url === '/compress') {
      if (req.method === 'GET') {
        res.statusCode = 400;
        res.end('Bad request');

        return;
      }

      if (req.method === 'POST') {
        const form = formidable();

        form.parse(req, (err, fields, files) => {
          if (err) {
            res.statusCode = 400;
            res.end('Bad Request');

            return;
          }

          const fileFromForm = files.file && files.file[0];
          const compressionType =
            fields.compressionType && fields.compressionType[0];

          if (!fileFromForm || !compressionType) {
            res.statusCode = 400;
            res.end('Bad Request');

            return;
          }

          const extensions = {
            gzip: 'gz',
            deflate: 'dfl',
            br: 'br',
          };

          const extension = extensions[compressionType];

          if (!extension) {
            res.statusCode = 400;
            res.end('Bad Request');

            return;
          }

          let zip;

          switch (compressionType) {
            case 'gzip':
              zip = zlib.createGzip();
              break;

            case 'deflate':
              zip = zlib.createDeflate();
              break;

            case 'br':
              zip = zlib.createBrotliCompress();
              break;

            default:
              res.statusCode = 400;
              res.end('Bad Request');

              return;
          }

          res.writeHead(200, {
            'Content-Disposition': `attachment; filename=${fileFromForm.originalFilename}.${extension}`,
          });

          const fileStream = fs.createReadStream(fileFromForm.filepath);

          fileStream.pipe(zip).pipe(res);

          fileStream.on('error', () => {
            res.destroy();
          });

          zip.on('error', () => {
            res.destroy();
          });

          res.on('close', () => {
            fileStream.destroy();
            zip.destroy();
          });
        });

        return;
      }
    }

    res.statusCode = 404;
    res.end('Not Found');
  });

  server.on('error', () => {});

  return server;
}

module.exports = {
  createServer,
};
