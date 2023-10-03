1. Copy all these files into an empty directory on your server. The rest of the source code is not needed, it will be downloaded into the container automatically.
1. Create a folder named `dist` in the same directory as the files.
1. Build the web files using `docker compose up build-mortarcalc`
1. Ignore any warnings about file size. 
1. Check the `./dist` folder to confirm you have an `index.html` file.
1. Start the webserver with `docker compose up -d serve-mortarcalc` (don't forget the `-d` in this one)
1. Access the application at `http://127.0.0.1:80`.

You can modify the `nginx.conf` file if you would like to use a different port, or if you would like to create a reverse-ssl-proxy. 