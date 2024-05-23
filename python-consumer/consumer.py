import pika
import json
from pymongo import MongoClient

RABBITMQ_URL = 'amqp://rabbitmq'
MONGODB_URL = 'mongodb://mongodb:27017'
QUEUE_NAME = 'userQueue'

def callback(ch, method, properties, body):
    data = json.loads(body)
    print("Received %r" % data)
    
    client = MongoClient(MONGODB_URL)
    db = client.userDB
    users = db.users
    users.insert_one(data)
    print("Data inserted into MongoDB")

connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
channel = connection.channel()

channel.queue_declare(queue=QUEUE_NAME)

channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback, auto_ack=True)

print('Waiting for messages. To exit press CTRL+C')
channel.start_consuming()
