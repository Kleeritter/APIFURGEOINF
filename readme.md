# REST-API
In diesem Ordner findet ihr alles, was ihr braucht, um selber eine REST-API zu erstellen, welche im Hintergrund auf die Datenbank im Docker-Container postgres zugreift (siehe hierzu den Exkurs:Docker).

## Node.js & npm Packages
Die REST-API erstellen wir mit Node.js. Dies ist ein Framework, das uns erlaubt, JavaScript Code auch serverseitig auszuführen (eigentlich kann JS ja nur im Browser ausgeführt werden). Node.js stellt eine ganze Reihe an fertigen Modulen (auch Packages) genannt bereit, die man nutzen kann. So gibt es beispielsweise ein Package, das man nutzen kann, um eine Verbindung zu einer PostgreSQL Datenbank herzustellen. Dieses Package heißt 'pg' (https://www.npmjs.com/package/pg).

Alle Packages, die man nutzen möchte, kann man in der package.json auflisten. Es wird in Packages unterschieden, die zwingend für die Anwendung benötigt werden (dependencies) und in Packages, die man während der Entwicklung der Anwendung aus Bequemlichkeit einsetzt (devDependencies).

Während der Entwicklung nutzen wir das Package nodemon, um einen live-reload zu haben, wenn wir eine Datei unserer REST-API in VS-Code editieren und speichern (so ähnlich wie das LiveServer Plugin). Dieses Package wird in der package.json unter devDependencies aufgelistet, weil es während der Entwicklung unserer API sehr hilfreich ist, aber man es nicht zwingend benötigt, damit die API läuft.

Um neue Packages im Docker-Container zu installieren, muss der Container einmal neu erstellt werden. Dieser Schritt ist immer notwendig, wenn ihr etwas an der package.json verändert. Änderungen unter ./src werden automatisch über den live-reload angezeigt.

## Starten & Stoppen des Containers
Erstellen und Starten des Containers über die Konsole/Terminal mit

```
docker compose up --build
```
Es werden automatisch alle benötigten Packages installiert und nodemon wird ausgeführt, um den live-reload zu ermöglichen. In der Konsole wird Folgendes geloggt:

```
api-1  | > rest_api_nitrat@1.0.0 dev
api-1  | > nodemon --legacy-watch src/app.js                                                                                 
api-1  |                                                                                                                     
api-1  | [nodemon] 3.1.0                                                                                                     
api-1  | [nodemon] to restart at any time, enter `rs`
api-1  | [nodemon] watching path(s): *.*                                                                                     
api-1  | [nodemon] watching extensions: js,mjs,cjs,json                                                                      
api-1  | [nodemon] starting `node src/app.js`
api-1  | API listens on Port 5000               
```

Stoppen des Containers über die Konsole mit:
```
STRG + C
```
