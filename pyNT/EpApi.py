import mysql.connector
import urllib.parse
import urllib.request
import json


class EpApi:
    def __init__(self, client_id, secret):
        self.key = ""
        self.client_id = client_id
        self.secret = secret
        self.cnx = mysql.connector.connect(user='root', password='dJgUiNTcjoL9Uai', host='localhost',
                                           database='targetingDB')
        self.get_key_from_db()

    def get_key_from_db(self):
        sql = "SELECT * FROM EpKey"
        cursor = self.cnx.cursor()
        cursor.execute(sql)
        for res in cursor:
            self.key = res[1]

    def get_key_from_class_field(self):
        return self.key

    def refresh_key(self):
        local_key = self.key
        self.get_key_from_db()
        if local_key == self.key:
            link = "https://api.everypixel.com/oauth/token?client_id=" + self.client_id + "&client_secret=" + self.secret + "&grant_type=client_credentials"
            response = json.loads((urllib.request.urlopen(link).read()).decode("utf-8"))
            self.key = response["access_token"]
            sql = "UPDATE EpKey SET textKey = '" + response["access_token"] + "' WHERE id = 1"
            self.cnx.cursor().execute(sql)
            self.cnx.commit()
            print("UPDATE KEY: " + self.key)

    def get_keywords_from_ep_api(self, url):

        params = {'url': url, 'num_keywords': 50}
        link = "https://api.everypixel.com/v1/keywords?" + urllib.parse.urlencode(params)

        # dssadf

        loop_counts = 2
        count = 0
        result = []
        while count < loop_counts:
            invalid_keys = 0
            # loop body
            key = "Bearer " + self.key
            headers = {"Authorization": key}
            req = urllib.request.Request(link, headers=headers)
            try:
                response = (urllib.request.urlopen(req).read()).decode("utf-8")
                result = json.loads(response)
                print("Запрос прошел успешно")
                break
            except urllib.error.HTTPError:
                invalid_keys += 1

            if count == 0 and invalid_keys > 0:
                self.get_key_from_db()
                print("Пробуем достать ключ из БД, мало ли кто обновил")
            elif count == 1 and invalid_keys > 0:
                print("Пробуем получить новый ключ от EP")
                self.refresh_key()
            elif count > 1 and invalid_keys > 0:
                result = {"status": "Не удалось получить корректный ключ"}
                print("Не удалось получить ключ")
            # loop body
            count += 1

        return result

    def get_key(self, url, id):
        try:
            print(id)
            result = self.get_res(url)
        except:
            try:
                self.get_key_from_db()
                result = self.get_res(url)
            except:
                try:
                    self.ref_key()
                    self.get_key_from_db()
                    result = self.get_res(url)
                except:
                    return {"status": "gavno"}

        return result

    def get_res(self, url):

        params = {'url': url, 'num_keywords': 50}
        link = "https://api.everypixel.com/v1/keywords?" + urllib.parse.urlencode(params)

        key = "Bearer " + self.key
        headers = {"Authorization": key}
        req = urllib.request.Request(link, headers=headers)

        response = (urllib.request.urlopen(req).read()).decode("utf-8")
        return json.loads(response)

    def ref_key(self):
        link = "https://api.everypixel.com/oauth/token?client_id=" + self.client_id + "&client_secret=" + self.secret + "&grant_type=client_credentials"
        response = json.loads((urllib.request.urlopen(link).read()).decode("utf-8"))
        self.key = response["access_token"]
        sql = "UPDATE EpKey SET textKey = '" + response["access_token"] + "' WHERE id = 1"
        self.cnx.cursor().execute(sql)
        self.cnx.commit()
        print("UPDATE KEY: " + self.key)
