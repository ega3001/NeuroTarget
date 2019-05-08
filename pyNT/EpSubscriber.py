import pika
from EpApi import *
import json
connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
channel = connection.channel()

channel.queue_declare(queue='epQueue', durable=True)
channel.basic_qos(prefetch_count=1)

print("----------------------------------------------------------")


def callback(ch, method, properties, body):
    ep = EpApi("cokmCeAAm5ukt2Mr8ljADcpPkxQRqKYioj0uddPm",
               "dXfku53759ntKOGQ51146vU0kuwFUmmAJN8Q407sFUKHO4osnu")
    print("c1")
    decoded_msg = json.loads(body.decode("utf-8"))

    for people in decoded_msg["response"]:
        res = (ep.get_key(people["photo_max_orig"], people['id']))
        print(res['status'])

    ch.basic_ack(delivery_tag=method.delivery_tag)


def callback2(ch, method, properties, body):
    ep = EpApi("cokmCeAAm5ukt2Mr8ljADcpPkxQRqKYioj0uddPm",
               "dXfku53759ntKOGQ51146vU0kuwFUmmAJN8Q407sFUKHO4osnu")
    print("c2")
    decoded_msg = json.loads(body.decode("utf-8"))

    for people in decoded_msg["response"]:
        res = (ep.get_key(people["photo_max_orig"], people['id']))
        print(res['status'])

    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(callback,
                      queue='epQueue',
                      no_ack=False)

channel.basic_consume(callback2,
                      queue='epQueue',
                      no_ack=False)

# print(' [*] Waiting for messages. To exit press CTRL+C')
channel.start_consuming()
