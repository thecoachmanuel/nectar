const { initAuthCreds, BufferJSON, proto } = require("@whiskeysockets/baileys");

const useMongoDBAuthState = async (collection) => {
  const writeData = async (data, id) => {
    try {
      // Stringify using Baileys' custom JSON replacer which handles Buffers
      const stringified = JSON.stringify(data, BufferJSON.replacer);
      await collection.updateOne(
        { _id: id },
        { $set: { data: stringified } },
        { upsert: true }
      );
    } catch (err) {
      console.warn(`⚠️ Error saving auth key ${id}:`, err.message);
    }
  };

  const readData = async (id) => {
    try {
      const doc = await collection.findOne({ _id: id });
      if (doc && doc.data) {
        // Parse using Baileys' custom JSON reviver
        return JSON.parse(doc.data, BufferJSON.reviver);
      }
    } catch (err) {
      console.warn(`⚠️ Error reading/parsing auth key ${id}:`, err.message);
    }
    return null;
  };

  const removeData = async (id) => {
    try {
      await collection.deleteOne({ _id: id });
    } catch (err) {
      console.warn(`⚠️ Error deleting auth key ${id}:`, err.message);
    }
  };

  // Load existing credentials or initialize new ones safely
  let creds = null;
  try {
    creds = await readData("creds");
  } catch (_) {}

  if (!creds || !creds.noiseKey || !creds.signedIdentityKey) {
    creds = initAuthCreds();
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              try {
                let value = await readData(`${type}-${id}`);
                if (type === "app-state-sync-key" && value) {
                  value = proto.Message.AppStateSyncKeyData.fromObject(value);
                }
                data[id] = value;
              } catch (_) {
                data[id] = null;
              }
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
