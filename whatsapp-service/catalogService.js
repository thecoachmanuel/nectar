// ─── Catalog Service ────────────────────────────────────────────────────────
// Fetches active categories and products live from MongoDB with 5-min caching

const NodeCache = require("node-cache");
const { ObjectId } = require("mongodb");

const catalogCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 minutes TTL

async function getCategories(db) {
  const cacheKey = "all_active_categories";
  const cached = catalogCache.get(cacheKey);
  if (cached) return cached;

  try {
    const categoriesCollection = db.collection("itemcategories");
    const categories = await categoriesCollection
      .find({ status: { $ne: false } })
      .sort({ sortOrder: 1, name: 1 })
      .project({ _id: 1, name: 1, slug: 1 })
      .toArray();

    const formatted = categories.map((cat) => ({
      id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
    }));

    catalogCache.set(cacheKey, formatted);
    return formatted;
  } catch (err) {
    console.error("⚠️ Error fetching categories:", err.message);
    return [];
  }
}

async function getItemsByCategory(db, categoryId) {
  const cacheKey = `items_cat_${categoryId}`;
  const cached = catalogCache.get(cacheKey);
  if (cached) return cached;

  try {
    const itemsCollection = db.collection("items");
    let query;
    try {
      query = {
        $or: [
          { categoryId: new ObjectId(categoryId) },
          { categoryId: categoryId },
        ],
        status: { $ne: false },
      };
    } catch {
      query = { categoryId: categoryId, status: { $ne: false } };
    }

    const items = await itemsCollection
      .find(query)
      .sort({ name: 1 })
      .project({ _id: 1, name: 1, price: 1, description: 1, variations: 1 })
      .toArray();

    const formatted = items.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      price: Number(item.price) || 0,
      description: item.description || "",
    }));

    catalogCache.set(cacheKey, formatted);
    return formatted;
  } catch (err) {
    console.error("⚠️ Error fetching items by category:", err.message);
    return [];
  }
}

async function searchItems(db, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) return [];
  const term = searchTerm.trim();
  const cacheKey = `search_${term.toLowerCase()}`;
  const cached = catalogCache.get(cacheKey);
  if (cached) return cached;

  try {
    const itemsCollection = db.collection("items");
    const regex = new RegExp(term, "i");

    const items = await itemsCollection
      .find({
        status: { $ne: false },
        $or: [{ name: { $regex: regex } }, { description: { $regex: regex } }],
      })
      .limit(10)
      .project({ _id: 1, name: 1, price: 1, description: 1 })
      .toArray();

    const formatted = items.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      price: Number(item.price) || 0,
      description: item.description || "",
    }));

    catalogCache.set(cacheKey, formatted);
    return formatted;
  } catch (err) {
    console.error("⚠️ Error searching items:", err.message);
    return [];
  }
}

function clearCatalogCache() {
  catalogCache.flushAll();
}

module.exports = {
  getCategories,
  getItemsByCategory,
  searchItems,
  clearCatalogCache,
};
