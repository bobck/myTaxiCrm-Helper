
import { Telegram } from 'telegraf';

const bot = new Telegram(process.env.TELEGRAM_API_KEY);

export async function sendInfoToChatRoom({ chat_id, tripsCount }) {

    // Поїздок зараз: 835
    // План на день: 1350
    // До виконання денного добового плану залишилось: 515

    let text = `Поїздок зараз: ${tripsCount}`

    bot.sendMessage(chat_id, text);
}
