const { initAuthCreds, BufferJSON, proto } = require("@whiskeysockets/baileys");

const useMongoDBAuthState = async (collection) => {
  const writeData = async (data, id) => {
    // Stringify using Baileys' custom JSON replacer which handles Buffers
    const stringified = JSON.stringify(data, BufferJSON.replacer);
    await collection.updateOne(
      { _id: id },
      { $set: { data: stringified } },
      { upsert: true }
    );
  };

  const readData = async (id) => {
    const doc = await collection.findOne({ _id: id });
    if (doc) {
      // Parse using Baileys' custom JSON reviver
      return JSON.parse(doc.data, BufferJSON.reviver);
    }
    return null;
  };

  const removeData = async (id) => {
    await collection.deleteOne({ _id: id });
  };

  // Load existing credentials or initialize new ones
  const creds = (await readData("creds")) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === "app-state-sync-key" && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(value, key) : removeData(key));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => {
      return writeData(creds, "creds");
    },
  };
};

module.exports = { useMongoDBAuthState };
