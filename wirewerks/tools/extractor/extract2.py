#!/usr/bin/python

import json
import sys
import os

'''
this creates a PartGroup json object from a csv file
'''

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

f = open(filename, 'r')
mylist = f.read().splitlines()

#first value is title and second is type
partCategory['title'] = mylist[0]
partCategory['type'] = mylist[1]


'''
here we loop to do the array of partCategories
'''
newPart = True
part = {}
for i in xrange(3,len(mylist)):
    #print mylist[i]
    if newPart == True:
        newPart = False
        part['value'] = mylist[i]
        part['description'] = ""
        part['shortDescription'] = ""
        part['finePrint'] = ""
        part['attributes'] = []
    elif mylist[i] != "":
        #it's an attribute
        attribute = {}
        attribute['label'] = mylist[i]
        attribute['bold'] = False
        part['attributes'].append(attribute)
    else:
        #finish
        partCategory['parts'].append(part)
        part = {}
        newPart = True

partCategory['parts'].append(part)

outfilename = filename +".json"
with open(outfilename, 'w') as outfile:
    json.dump(partCategory, outfile,indent=4, sort_keys=True)





