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

5.1 Add remonline cashbox id to parse it
`INSERT INTO remonline_cashboxes(id, last_transaction_created_at,auto_park_id,auto_park_cashbox_id,default_contator_id) VALUES('270856','1716444000000','499e334b-8916-42ab-b41a-0f0b979d6f69','3cc1b081-aeb2-4d48-be69-15ed256577d6','51ed3eff-ad7d-49e4-b0f0-806f99d9870f')`


6. Install PM2 

`sudo npm install pm2@latest -g`

7. Start process with PM2, save it to start with PM2 and make PM2 starts on boot
`pm2 start ecosystem.config.js`
`pm2 save`
`pm2 startup`

8. Save current trip plan

`npm run update_plan`
