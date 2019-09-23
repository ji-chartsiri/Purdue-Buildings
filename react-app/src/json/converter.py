import json

file = open('WALC.json', 'r')
data = json.loads(file.read())
temp = open('temp.txt', 'w')


for i in data[1].keys():
    data[1][i]['lat'] *= 976.0/450.0
    data[1][i]['lon'] *= 1651.0/600.0
    temp.write(f'\t"{i}": {{\n \
            "lat": {data[1][i]["lat"]},\n \
            "lon": {data[1][i]["lon"]},\n \
            "floor": {data[1][i]["floor"]},\n \
            "adj": {data[1][i]["adj"]}\n \
        }},\n')

temp.close()
file.close()