# mytaxicrm hepler


Getting Started:

1. Clone repo, install dependencies

`git clone <git-repo-url> && cd <myTaxiCrm Helper> && npm i`

2. Set up local environment variables

`cp .env.example .env`

3. create db

`node node_modules/db-migrate/bin/db-migrate db:create main`

4. run migrations

`node node_modules/db-migrate/bin/db-migrate up`

5. Add telegram chat ids

`sqlite3`
`.open main.db`
`insert into autoparks_chat(chat_id,chat_title,autopark_id) values(<chat_id>,"<chat_title>","<my_taxi_crm_autopark_id>");`

6. Install PM2 

`sudo npm install pm2@latest -g`

7. Start process with PM2, save it to start with PM2 and make PM2 starts on boot
`pm2 start ecosystem.config.js`
`pm2 save`
`pm2 startup`

8. Save current trip plan

`npm run update_plan`
