//https://github.com/yagop/node-telegram-bot-api/issues/540
process.env.NTBA_FIX_319 = 1;

const EMAIL_REGEX =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const TelegramBot = require("node-telegram-bot-api");
const ApprovedEmail = require("./models/ApprovedEmail.schema");

module.exports = async () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("TELEGRAM_BOT_TOKEN environment variable not set.");
    return;
  }

  let admins = [];
  try {
    admins = JSON.parse(process.env.TELEGRAM_ADMINS);
  } catch (err) {
    console.log(err);
    return;
  }

  const bot = new TelegramBot(token, { polling: { interval: 500 } });

  bot.onText(/id/, async (msg, match) => {
    bot.sendMessage(
      msg.chat.id,
      `User ID: ${msg.from.id}\nChat ID: ${msg.chat.id}`
    );
  });

  bot.onText(/\/approve (.+)/, async (msg, match) => {
    if (admins.includes(msg.from.id)) {
      const email = match[1];
      if (EMAIL_REGEX.test(email)) {
        const approvedEmail = await ApprovedEmail.findOne({ email });
        if (approvedEmail) {
          bot.sendMessage(msg.chat.id, "Already approved: " + email);
        } else {
          await ApprovedEmail.updateOne({ email }, { email }, { upsert: true });
          bot.sendMessage(msg.chat.id, "Approved email: " + email);
        }
      } else {
        bot.sendMessage(msg.chat.id, "Invalid email.", {
          reply_to_message_id: msg.message_id,
        });
      }
    } else {
      bot.sendMessage(msg.chat.id, "You are not an admin.", {
        reply_to_message_id: msg.message_id,
      });
    }
  });

  bot.onText(/\/approve/, (msg, match) => {
    if (admins.includes(msg.from.id)) {
      if (msg.text.replace(/\/approve /g, "").length === 0) {
        bot.sendMessage(
          msg.chat.id,
          "Invalid usage. Usage: /approve username@email.com"
        );
      }
    } else {
      bot.sendMessage(msg.chat.id, "You are not an admin.", {
        reply_to_message_id: msg.message_id,
      });
    }
  });
};
