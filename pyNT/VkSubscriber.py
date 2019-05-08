import pika
import json
from VkApi import *

connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
channel = connection.channel()

channel.queue_declare(queue='vkQueue', durable=True)
channel.basic_qos(prefetch_count=1)


def callback(ch, method, properties, body):
    vk = VkApi("0dce64cd0dce64cd0dce64cdd70da8276100dce0dce64cd56669b6e0611fe0967f5d750")
    # res = vk.get_data_by_ids('photo_max_orig, has_photo', body)
    loaded_json = json.loads(body.decode("utf-8"))
    res = vk.get_data_by_ids('photo_max_orig, has_photo', ','.join(loaded_json["file"]))

    channel.basic_publish(exchange='',
                          body=res,
                          routing_key="epQueue")

    ch.basic_ack(delivery_tag=method.delivery_tag)


channel.basic_consume(callback,
                      queue='vkQueue',
                      no_ack=False)

print(' [*] Waiting for messages. To exit press CTRL+C')
channel.start_consuming()
