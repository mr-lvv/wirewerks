
def createValue (value) :
    jsontext = ""
    jsontext = "{ \"value\" : \" "
    jsontext += value
    jsontext += "\", \"description\": \"\","
    jsontext += "\"shortDescription\": \"\","
    jsontext += "\"finePrint\": \"\","
    jsontext += "\"attributes\" : ["
    return jsontext

def addAttr ( value, first) :
    jsontext = ""
    if first == False :
        jsontext+= ","
    jsontext += "{\"label\" : \""
    jsontext += value
    jsontext += "\", \"bold\": false }"
    return jsontext

def endAttr():
    return "]"

def endCreateValue () :
    jsontext = ""
    jsontext += "}"
    return jsontext

f = open('test2.csv', 'r')

file = mylist = f.read().splitlines()

firstValue = True
firstAttribute = True
newValue = True
jsontext = "["
for value in file :
    print "extracting: " + value
    if value == "" :
        newValue = True
        if firstAttribute == False:
            jsontext += endAttr ()
        jsontext += endCreateValue ()
        firstAttribute = True
    else :


        if newValue == True :
            if firstValue == False :
                jsontext += ","
            jsontext += createValue( value)
            newValue = False
            firstValue = False
        else :
            jsontext += addAttr( value, firstAttribute)
            firstAttribute = False
jsontext += "]}"
jsontext += "]"
print "blah: " + jsontext


