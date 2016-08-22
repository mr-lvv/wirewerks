#!/usr/bin/python

import json
import sys
import os

'''
this creates a PartGroup json object from a csv file
'''

def extractFinePrint(value):
    return len(value.split("*"))-1


if len(sys.argv) != 2:
    print "usage extact2.py <file.csv>"
    quit()

filename = "./"
filename = os.path.join(filename, sys.argv[1])

if os.path.isfile(filename) != True:
    print "File doesn't exist"
    exit()


partCategory = {}
partCategory['title']=""
partCategory['type']=""
partCategory['parts'] = []
partCategory['finePrint']=""

f = open(filename, 'r')
mylist = f.read().splitlines()

#first is type and then title

type = mylist[0]
typeLength = len(type)
partCategory['type'] = type[:1]


finePrintNumber = extractFinePrint(mylist[1])
partCategory['finePrint'] = '*'*finePrintNumber
if finePrintNumber > 1 :
    partCategory['title'] = mylist[1][:-finePrintNumber]
else:
    partCategory['title'] = mylist[1]
partCategory['length'] = typeLength

isLength = partCategory['title'].find("LENGTH") >= 0

'''
here we loop to do the array of partCategories
'''

newPartBegin = True
part = {}
for i in xrange(2,len(mylist)):

    value = mylist[i]
    finePrintNumber = extractFinePrint(value)
    if finePrintNumber > 0 :
        value = value[:-finePrintNumber]
    newPart = (len(value) == typeLength and (newPartBegin == True or value != part['value']))
    if newPartBegin == True or newPart == True:
        if newPartBegin == False:
            partCategory['parts'].append(part)
        part = {}
        newPartBegin = False
        part['description'] = ""
        part['shortDescription'] = ""
        part['finePrint'] = ""
        part['attributes'] = []
        part['finePrint'] = '*'*finePrintNumber

        if newPart == False:
            part['value'] = 'X'*typeLength
        else:
            part['value'] = value
    else:
        #it's an attribute
        attribute = {}
        attribute['label'] = mylist[i]
        if mylist[i] == "Bend Insensitive":
            attribute['bold'] = True
        else:
            attribute['bold'] = False
        part['attributes'].append(attribute)

partCategory['parts'].append(part)

outfilename = filename +".json"
with open(outfilename, 'w') as outfile:
    json.dump(partCategory, outfile,indent=4, sort_keys=True)





