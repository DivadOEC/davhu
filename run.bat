rem SET DEBUG=blg:* & npm start
start C:\devsoft\mongodb2.6.1\bin\mongod --dbpath ../blog/ &
ping -n 5 127.0.0.1

supervisor ./bin/www