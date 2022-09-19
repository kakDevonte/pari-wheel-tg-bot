import { config } from "dotenv";
import express from "express";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import { referralAPI } from "./api.js";

config();

const token = process.env.TELEGRAM_API_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const app = express();
let referrer = null;
let userId = null;
//const TELEGRAM_URI = `https://api.telegram.org/bot${process.env.TELEGRAM_API_TOKEN}/sendMessage`;

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

const sendStartMessage = (chatId) => {
  const resp =
    "Привет! \n" +
    "PARI хочет кое-что тебе подарить. Заинтересован? \n" +
    "\n" +
    "Тогда мигом играть: крути колесо фортуны, копи баллы, будь среди лучших\n" +
    "и получай призы – пятерка лучших игроков получит сертификаты Giftery и\n" +
    "еще пять получат фрибеты. Для участия необходимо иметь действующий\n" +
    "счет PARI, а итоги конкурса подведем 26 августа.\n" +
    "У тебя будет 5 попыток. Не переживай, они ежедневно обновляются. Можно,\n" +
    "конечно, схитрить и получить больше попыток…";
  bot.sendMessage(chatId, resp, game);
};

const game = {
  disable_web_page_preview: false,
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        {
          text: "Играть",
          web_app: { url: "https://server.bulochkin.site" },
        },
        {
          text: "Больше попыток",
          callback_data: `03`,
        },
      ],
    ],
  }),
};

const noSubscribe = {
  parse_mode: "markdown",
  disable_web_page_preview: false,
  reply_markup: JSON.stringify({
    inline_keyboard: [[{ text: "Я подписался", callback_data: "01" }]],
  }),
};

const noSubscribeSecond = {
  parse_mode: "markdown",
  disable_web_page_preview: false,
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        { text: "Канал PARI", url: "https://t.me/test_pari_chanel" },
        { text: "Я подписался", callback_data: "01" },
      ],
    ],
  }),
};

const isSubscribedToTheChannel = async (userId) => {
  try {
    let response = await bot.getChatMember(-1001780461970, userId);
    console.log(response);
    if (response.status === "left") return false;
    else return true;
  } catch (err) {
    return false;
  }
};

bot.onText(/\/start/, async (msg, match) => {
  const chatId = msg.chat.id;
  userId = msg.chat.id;
  referrer = msg.text.split(" ")[1];

  const isSubscribe = await isSubscribedToTheChannel(msg.from.id);
  if (referrer && isSubscribe) {
    const response = await referralAPI.getReferrals(referrer);
    let isActive = false;
    for (const ref of response.data.referrals) {
      if (ref.referral_id === msg.chat.id) isActive = true;
    }
    sendStartMessage(chatId);

    if (isActive) return;

    const resp =
      "Кто-то из друзей воспользовался твоей ссылкой! Уже начислили тебе попытки. Пойдем играть!";
    bot.sendMessage(referrer, resp, game);

    await referralAPI.addReferral({
      referrer_id: referrer,
      referral_id: userId,
      is_active: 1,
    });
  } else if (isSubscribe) {
    sendStartMessage(chatId);
  } else {
    const resp =
      "Кажется, ты ещё не подписан на наш канал!\n" +
      "Чтобы играть и участвовать в розыгрыше призов, нужно подписаться на ";

    bot.sendMessage(
      chatId,
      resp + "[канал PARI](https://t.me/test_pari_chanel)",
      noSubscribe
    );
    await referralAPI.addReferral({
      referrer_id: referrer,
      referral_id: userId,
      is_active: 0,
    });
  }
});

bot.on("callback_query", async (msg) => {
  const isSubscribe = await isSubscribedToTheChannel(msg.from.id);

  const response = await referralAPI.getReferrals(referrer);
  let isActive = false;
  let currReferral = null;

  if (response.data)
    for (const ref of response.data.referrals) {
      if (ref.referral_id === msg.chat.id && ref.is_active === 0) {
        isActive = true;
        currReferral = ref;
      }
    }

  if (msg.data == "01") {
    if (isSubscribe) {
      if (isActive) {
        await referralAPI.updateReferral({
          referrer_id: currReferral.referrer_id,
          referral_id: msg.from.id,
          is_active: 1,
        });

        const resp =
          "Кто-то из друзей воспользовался твоей ссылкой! Уже начислили тебе попытки. Пойдем играть!";
        bot.sendMessage(referrer, resp, game);
      }
      const resp =
        "Привет! \n" +
        "PARI хочет кое-что тебе подарить. Заинтересован? \n" +
        "\n" +
        "Тогда мигом играть: крути колесо фортуны, копи баллы, будь среди лучших\n" +
        "и получай призы – пятерка лучших игроков получит сертификаты Giftery и\n" +
        "еще пять получат фрибеты. Для участия необходимо иметь действующий\n" +
        "счет PARI, а итоги конкурса подведем 26 августа.\n" +
        "У тебя будет 5 попыток. Не переживай, они ежедневно обновляются. Можно,\n" +
        "конечно, схитрить и получить больше попыток…";
      bot.sendMessage(msg.from.id, resp, game);
    } else {
      const resp =
        "Ой, кажется, ты не подписан на наш канал. Чтобы участвовать в розыгрыше призов, подпишись на ";

      bot.sendMessage(
        msg.from.id,
        resp + "[канал PARI](https://t.me/test_pari_chanel)" + " в telegram.",
        noSubscribeSecond
      );
    }
  }
  if (msg.data == "03") {
    const str = "https://t.me/parimatch_kz_irs_bot?start=" + msg.from.id;
    const resp =
      "Чтобы получить дополнительные попытки, нужно совершить пару простых действий.\n" +
      "действий.\n" +
      "\n" +
      "Берешь ссылку и отправляешь своим друзьям. Как только твой друг\n" +
      "подпишется на Telegram-канал и запустит бота, ты получишь 5\n" +
      "дополнительных попыток! Ты можешь приглашать неограниченное\n" +
      "количество друзей :)\n" +
      "\n" +
      "Как только твой друг выполнит все условия, тебе придет уведомление!\n" +
      "Твоя уникальная ссылка: " +
      str;

    bot.sendMessage(msg.from.id, resp, game);
  }
});

bot.on("message", (msg) => {
  if (msg.text !== "/start") {
    console.log(msg);
    const chatId = msg.chat.id;
    const resp = "Пожалуйста, пользуйся кнопками.";
    bot.sendMessage(chatId, resp, game);
  }
});

const PORT = process.env.PORT || 8443;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
