import pika

connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
channel = connection.channel()

channel.queue_declare(queue='vkQueue', durable=True)

channel.basic_publish(exchange='',
                      body='1,2,3',
                      routing_key="vkQueue")
print(" [x] Sent '[1, 2, 3]'")
connection.close()
