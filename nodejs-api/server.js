const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib/callback_api');
const Joi = require('joi');

const app = express();
app.use(bodyParser.json());

const userSchema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    age: Joi.number().integer().min(0).required()
});

const RABBITMQ_URL = 'amqp://rabbitmq';

app.post('/users', (req, res) => {
    const { error } = userSchema.validate(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    amqp.connect(RABBITMQ_URL, (err, connection) => {
        if (err) {
            return res.status(500).send('Failed to connect to RabbitMQ');
        }

        connection.createChannel((err, channel) => {
            if (err) {
                return res.status(500).send('Failed to create channel');
            }

            const queue = 'userQueue';
            const msg = JSON.stringify(req.body);

            channel.assertQueue(queue, { durable: false });
            channel.sendToQueue(queue, Buffer.from(msg));

            console.log(" [x] Sent %s", msg);
            res.send('User information received and forwarded for processing');
        });

        setTimeout(() => {
            connection.close();
        }, 500);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
