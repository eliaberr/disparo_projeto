const axios = require("axios");
const Contact = require("../models/Contact");
const Campaign = require("../models/Campaign");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

exports.run = async (campaignId) => {
  try {
    const campaignRes = await Campaign.findById(campaignId);
    const campaign = campaignRes.rows[0];

    if (!campaign) return;

    const contacts = await Contact.pending(campaignId);

    await Campaign.start(campaignId);
    await Campaign.updateTotal(campaignId, contacts.rows.length);

    for (const c of contacts.rows) {
      try {
        console.log("Enviando para", c.number);

        const text = campaign.message.replace(
          "{nome}",
          c.name || "Cliente"
        );

        await axios.post(
          `${process.env.EVOLUTION_URL}/message/sendText/${process.env.INSTANCE}`,
          {
            number: c.number,
            text
          },
          {
            headers: {
              apikey: process.env.EVOLUTION_KEY
            }
          }
        );

        await Contact.markSent(c.id);
        await Campaign.increment(campaignId);

      } catch (err) {
        await Campaign.incrementError(campaignId);
      }

      await sleep(3000);
    }

    await Campaign.finish(campaignId);

    console.log("✔ Finalizado");

  } catch (err) {
    console.log(err.message);
  }
};