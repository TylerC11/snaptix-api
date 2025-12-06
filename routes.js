import express from 'express';
import sql from 'mssql';
import 'dotenv/config'

const router = express.Router();

const db_connection_string = process.env.DB_CONNECTION_STRING;

//GET: /api/sports/
router.get('/', async (req, res) => {

  //Get a collection of sport objects from the database
  await sql.connect(db_connection_string)

  const result = await sql.query`SELECT a.[SportId], a.[Title] as SportTitle, a.[Description], a.[Location], a.[SportDate], a.[PhotoPath],c.[OwnerId], c.[Name] as OwnerName, b.[CategoryId], b.[Name] as CategoryName
FROM [dbo].[Sport] a
INNER JOIN [dbo].[Category] b
ON a.[CategoryId] = b.[CategoryId]
INNER JOIN [dbo].[Owner] c
ON a.[OwnerId] = c.[OwnerId]
ORDER BY a.[SportDate] DESC`;

  //return the result recordset as a JSON
  res.json(result.recordset);
});


// GET: /api/sports/purchase — get all purchases
router.get('/purchase', async (req, res) => {
  await sql.connect(db_connection_string);

  const result = await sql.query`SELECT * FROM [dbo].[Purchase] ORDER BY PurchaseDate DESC`;

  // Return as JSON
  res.json(result.recordset);
});

// POST: /api/sports/purchase
// POST: /api/sports/purchase
router.post('/purchase', async (req, res) => {
  const purchase = req.body;
  console.log("RAW BODY:", req.body);

  if (!purchase) {
    return res.status(400).send("No body received!");
  }

  // Validation
  const errors = [];

  // Required numeric fields
  if (purchase.Quantity == null || isNaN(purchase.Quantity) || purchase.Quantity <= 0) {
    errors.push("Quantity must be a positive number.");
  }

  if (purchase.PricePerTicket == null || isNaN(purchase.PricePerTicket) || purchase.PricePerTicket <= 0) {
    errors.push("PricePerTicket must be a positive number.");
  }

  // Required string fields
  if (!purchase.BuyerName || purchase.BuyerName.trim().length < 2) {
    errors.push("BuyerName is required and must be at least 2 characters.");
  }

  if (!purchase.BuyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(purchase.BuyerEmail)) {
    errors.push("BuyerEmail must be a valid email.");
  }

  // SportId numeric check
  if (!purchase.SportId || isNaN(purchase.SportId)) {
    errors.push("SportId must be a valid number.");
  }

  // Card validation - EXACT digit requirements
  if (!purchase.CardNumber || !/^\d{16}$/.test(purchase.CardNumber.replace(/\s/g, ''))) {
    errors.push("CardNumber must be exactly 16 digits.");
  }

  if (!purchase.CardHolderName || purchase.CardHolderName.trim().length < 2) {
    errors.push("CardHolderName is required and must be at least 2 characters.");
  }

  if (!purchase.ExpiryDate || !/^\d{4}$/.test(purchase.ExpiryDate)) {
    errors.push("ExpiryDate must be exactly 4 digits (MMYY format).");
  }

  if (!purchase.CVV || !/^\d{3}$/.test(purchase.CVV)) {
    errors.push("CVV must be exactly 3 digits.");
  }

  // If any validation errors occurred:
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const totalPrice = purchase.Quantity * purchase.PricePerTicket;
  const purchaseDate = new Date().toISOString();

  // Connect to database
  await sql.connect(db_connection_string);

  const result = await sql.query`INSERT INTO [dbo].[Purchase]
        (Quantity, TotalPrice, PricePerTicket, BuyerName, BuyerEmail, PurchaseDate, SportId, CardNumber, CardHolderName, ExpiryDate, CVV)
      VALUES
        (${purchase.Quantity},
         ${totalPrice},
         ${purchase.PricePerTicket},
         ${purchase.BuyerName},
         ${purchase.BuyerEmail},
         ${purchaseDate},
         ${purchase.SportId},
         ${purchase.CardNumber},
         ${purchase.CardHolderName},
         ${purchase.ExpiryDate},
         ${purchase.CVV});
    ;`;

  if(result.rowsAffected[0] === 0) {
    return res.status(500).json({error: "Failed to insert purchase."})
  }
  else {
    res.send('Purchase inserted into db.')
  }
});

//GET /api/sports/1
router.get('/:id', async (req, res) => {
    const id = req.params.id;

    if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid sport ID. It must be a number." });
  }

    //Get a collection of sport objects from the database
    await sql.connect(db_connection_string)

    const result = await sql.query`SELECT a.[SportId], a.[Title] as SportTitle, a.[Description], a.[Location], a.[SportDate], a.[PhotoPath],c.[OwnerId], c.[Name] as OwnerName, b.[CategoryId], b.[Name] as CategoryName
FROM [dbo].[Sport] a
INNER JOIN [dbo].[Category] b
ON a.[CategoryId] = b.[CategoryId]
INNER JOIN [dbo].[Owner] c
ON a.[OwnerId] = c.[OwnerId]
    WHERE a.[SportId] = ${id}`;

if(result.recordset.length == 0) {
  //sport not found
  return res.status(404).json({ error:
    "Listing not found"
  });
}

  //return the result recordset as a JSON
  res.json(result.recordset);
});

export default router;