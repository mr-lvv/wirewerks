Wirewerks
========

Prerequisite
------------

 * Node 6.4.0

Setup
-------

**Server** (only thing you will ever need)
```
cd wirewerks/server/app-server
npm install
```

Then to serve everything on port 3000 (usually best just run from IntelliJ)
```
cd wirewerks/server/app-server
node index.js
```


**Web client only**
```
cd wirewerks/client/ui
npm install
cd src
npm install
```

Start serving the ui

```
cd wirewerks/client/ui
npm start
```

**Lib sass (for css)**

Sass files are build to .css by Intellij.

```
cd wirewerks
cd server
cd ww-libsass
npm install
cd node_sass
npm install
```


**IntelliJ**
Install NodeJs plugin
Install FileWatchers plugin


Modules
---------


**Client**

Client-side stuff

 * ui

	UI for client

**Server**

Server stuff


 * app-server

	The main server app


Deployement
-----------

**Heroku Commands**

heroku logs --app wirewerks --tail
run bash --app wirewerks
