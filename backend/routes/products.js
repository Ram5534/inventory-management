const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./inventory.db");

const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });



// ======================================================
// 1️⃣ ADD PRODUCT — POST /api/products
// ======================================================
router.post("/add-products", (req, res) => {
    const { name, unit, category, brand, stock, status, image } = req.body;

    if (!name || stock === undefined) {
        return res.status(400).json({ error: "Name and stock are required" });
    }

    const query = `
        INSERT INTO products (name, unit, category, brand, stock, status, image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [name, unit, category, brand, stock, status, image], function (err) {
        if (err) {
            if (err.message.includes("UNIQUE")) {
                return res.status(400).json({ error: "Product name already exists" });
            }
            return res.status(500).json({ error: err.message });
        }

        res.json({ message: "Product added successfully", id: this.lastID });
    });
});


// ======================================================
// 2️⃣ GET ALL PRODUCTS — GET /api/products
// With Pagination + Sorting
// ======================================================
router.get("/products", (req, res) => {
    let { page = 1, limit = 10, sort = "id", order = "ASC" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const validSort = ["id", "name", "category", "brand", "stock"];
    if (!validSort.includes(sort)) sort = "id";

    order = order.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const query = `
        SELECT * FROM products
        ORDER BY ${sort} ${order}
        LIMIT ? OFFSET ?
    `;

    db.all(query, [limit, offset], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
            page,
            limit,
            sort,
            order,
            data: rows,
        });
    });
});


// ======================================================
// 3️⃣ GET SINGLE PRODUCT — GET /api/products/:id
// ======================================================
router.get("/products/:id", (req, res) => {
    const query = `SELECT * FROM products WHERE id = ?`;

    db.get(query, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!row) return res.status(404).json({ error: "Product not found" });

        res.json(row);
    });
});


// ======================================================
// 4️⃣ UPDATE PRODUCT — PUT /api/products/:id
// ======================================================
router.put("/products/:id", (req, res) => {
    const { name, unit, category, brand, stock, status, image } = req.body;

    const query = `
        UPDATE products SET 
        name=?, 
        unit=?, 
        category=?, 
        brand=?, 
        stock=?,      
        status=?, 
        image=?
        WHERE id=?
    `;

    db.run(
        query,
        [name, unit, category, brand, stock, status, image, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            if (this.changes === 0)
                return res.status(404).json({ error: "Product not found" });

            res.json({ message: "Product updated successfully" });
        }
    );
});


// ======================================================
// 5️⃣ DELETE PRODUCT — DELETE /api/products/:id
// ======================================================
router.delete("/products/:id", (req, res) => {
    const query = `DELETE FROM products WHERE id = ?`;

    db.run(query, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        if (this.changes === 0)
            return res.status(404).json({ error: "Product not found" });

        res.json({ message: "Product deleted successfully" });
    });
});


// ======================================================
// 6️⃣ UPDATE STOCK & LOG HISTORY — PATCH /api/products/:id/stock
// ======================================================
router.patch("/products/:id/stock", (req, res) => {
    const { newStock, user } = req.body;

    if (newStock === undefined)
        return res.status(400).json({ error: "newStock is required" });

    const getQuery = `SELECT stock FROM products WHERE id=?`;

    db.get(getQuery, [req.params.id], (err, product) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!product) return res.status(404).json({ error: "Product not found" });

        const oldStock = product.stock;

        const updateQuery = `UPDATE products SET stock=? WHERE id=?`;

        db.run(updateQuery, [newStock, req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Insert into history
            const historyQuery = `
                INSERT INTO inventory_history (product_id, old_quantity, new_quantity, change_date, user_info)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.run(historyQuery, [
                req.params.id,
                oldStock,
                newStock,
                new Date().toISOString(),
                user || "Unknown"
            ]);

            res.json({
                message: "Stock updated",
                oldStock,
                newStock
            });
        });
    });
});


// IMPORT PRODUCTS
router.post("/import", upload.single("csvFile"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "CSV file required" });
    }

    const filePath = req.file.path;

    let added = 0;
    let skipped = 0;
    let pending = 0;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
            pending++;

            const { name, unit, category, brand, stock, status, image } = row;

            if (!name || !stock) {
                skipped++;
                pending--;
                return;
            }

            db.get("SELECT id FROM products WHERE name = ?", [name], (err, existing) => {
                if (existing) {
                    skipped++;
                    pending--;
                } else {
                    db.run(
                        `INSERT INTO products (name, unit, category, brand, stock, status, image)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [name, unit, category, brand, stock, status, image],
                        (err) => {
                            if (err) skipped++;
                            else added++;

                            pending--;
                        }
                    );
                }
            });
        })
        .on("end", () => {
            const timer = setInterval(() => {
                if (pending === 0) {
                    clearInterval(timer);
                    fs.unlinkSync(filePath);

                    return res.json({
                        message: "Import completed",
                        added,
                        skipped,
                    });
                }
            }, 100);
        })
        .on("error", (err) => {
            res.status(500).json({ error: err.message });
        });
});

router.get("/export", (req, res) => {
    const query = "SELECT * FROM products";

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        if (!rows.length) {
            return res.status(404).json({ message: "No products found" });
        }

        // Generate CSV manually
        const headers = Object.keys(rows[0]).join(",") + "\n";

        const csvRows = rows
            .map(row =>
                Object.values(row)
                    .map(val => `"${val ?? ""}"`)
                    .join(",")
            )
            .join("\n");

        const csvData = headers + csvRows;

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="products.csv"');

        return res.status(200).send(csvData);
    });
});

router.get("/debug/products", (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        res.json(rows);
    });
});

router.get("/test/export", (req, res) => {
    res.send("Export route is working");
});

router.get("/debug/all", (req, res) => {
    db.all(
        "SELECT name FROM sqlite_master WHERE type='table'",
        [],
        (err, tables) => {
            if (err) return res.json({ error: err.message });

            let output = { tables };

            // Check products table if exists
            db.all("SELECT * FROM products", [], (err2, rows) => {
                output.products = err2 ? err2.message : rows;

                res.json(output);
            });
        }
    );
});







module.exports = router;
