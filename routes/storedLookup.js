const express = require('express');
const Wappalyzer = require('wappalyzer');
const router = express.Router();
var amqp = require('amqplib/callback_api');
const uuidv4 = require('uuid/v4');


const options = {
  browser: 'zombie',
  debug: false,
  delay: 500,
  maxDepth: 1,
  maxUrls: 2,
  maxWait: 5000,
  recursive: false,
  userAgent: 'Wappalyzer',
  htmlMaxCols: 2000,
  htmlMaxRows: 2000,
};

/* GET simple lookup. */
router.get('/v1/', function(req, res) {
  let { query: { url } } = req;
  if (url) {
        //new Wappalyzer(url, options).analyze().then(json => res.send(json)).catch(error => res.status(500).send(error))
        var scan_uuid = uuidv4();
        var start = Math.floor(Date.now()/1000);
        new Wappalyzer(url, options).analyze().then(results => 
            {
            var finish = Math.floor(Date.now()/1000);
            //FIXME read RABBITMQ name from ENV
            amqp.connect('amqp://rabbitmq-service', function(error0, connection) {
                if (error0) {
                    console.log("Could not connect to RabbitMQ")
                    throw error0;
                }
                connection.createChannel(function(error1, channel) {
                    if (error1) {
                        throw error1;
                    }
                    var queue = 'wappalyzer-results';
                    var msg = { "uuid": scan_uuid,
                        "start": start,
                        "finish": finish,
                        "url": url,
                        "res":results
                        };
                    console.log(msg);
        
                    channel.assertQueue(queue, {
                        durable: false
                    });
        
                    channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)));
                    res.status(200).send(`URL processed uuid: ${scan_uuid}`);
                });
                setTimeout(function() {
                    connection.close();
                    console.log("Done, closing connection");
                    }, options.maxWait);
            });
        }).catch(error => res.status(500).send(error))
    } else {
    res.status(500).send(`URL is required`);
  }
});

module.exports = router;
