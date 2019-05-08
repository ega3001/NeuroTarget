import urllib.parse
import urllib.request


class VkApi:
    def __init__(self, access_key):
        self.access_key = access_key

    def get_data_by_ids(self, fields, ids):
        params = {
            "user_ids": ids,
            "fields": fields,
            'name_case': 'nom',
            'v': '5.52',
            'access_token': self.access_key
        }
        link = "https://api.vk.com/method/users.get?" + urllib.parse.urlencode(params)
        response = urllib.request.urlopen(link)
        return response.read()

