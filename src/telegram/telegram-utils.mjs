import { Telegram } from 'telegraf';

const bot = new Telegram(process.env.TELEGRAM_API_KEY);

export async function sendInfoToChatRoom({ chat_id, plan_trips, tripsCount }) {
  let text = `Поїздок зараз: ${tripsCount}`;
  if (plan_trips) {
    text += '\n';
    text += `План на день: ${plan_trips}`;

    const leftToPlanDone = plan_trips - tripsCount;
    if (leftToPlanDone > 0) {
      text += '\n\n';
      text += `До виконання добового плану залишилось: ${leftToPlanDone}`;
    }

    if (leftToPlanDone <= 0) {
      text += '\n\n';
      text += `Вітаю денний план виконано!`;
    }
  }

  bot.sendMessage(chat_id, text);
}
