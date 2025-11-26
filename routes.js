import express from 'express';
import sql from 'mssql';
import 'dotenv/config'

const router = express.Router();

const db_connection_string = process.env.DB_CONNECTION_STRING;

//GET: /api/sports/
router.get('/', async (req, res) => {

  //Get a collection of sport objects from the database
  await sql.connect(db_connection_string)

  const result = await sql.query`SELECT a.[Title] as SportTitle, a.[Description], a.[Location], a.[SportDate], a.[PhotoPath],c.[OwnerId], c.[Name] as OwnerName, b.[CategoryId], b.[Name] as CategoryName
FROM [dbo].[Sport] a
INNER JOIN [dbo].[Category] b
ON a.[CategoryId] = b.[CategoryId]
INNER JOIN [dbo].[Owner] c
ON a.[OwnerId] = c.[OwnerId]
ORDER BY a.[SportDate] DESC`;

  //return the result recordset as a JSON
  res.json(result.recordset);
});

//GET /api/sports/1
router.get('/:id', async (req, res) => {
    const id = req.params.id;

    if(isNaN(id)){
      return res.status(400).json({error: "Invalid sport ID. It must be a number."})
    }

    //Get a collection of sport objects from the database
    await sql.connect(db_connection_string)

    const result = await sql.query`SELECT a.[Title] as SportTitle, a.[Description], a.[Location], a.[SportDate], a.[PhotoPath],c.[OwnerId], c.[Name] as OwnerName, b.[CategoryId], b.[Name] as CategoryName
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

// POST: /api/sports/purchase
router.post('/purchase', async (req, res) => {
  console.log("RAW BODY:", req.body);
  const purchase = req.body;

  if (!purchase) {
    return res.status(400).send("No body received!");
  }


  //Validate input

  const totalPrice = purchase.Quantity * purchase.PricePerTicket;
  const purchaseDate = new Date().toISOString();

  //Get a one sport object from the database
  await sql.connect(db_connection_string);

  const result = await sql.query`INSERT INTO [dbo].[Purchase]
        (Quantity, TotalPrice, PricePerTicket, BuyerName, BuyerEmail, purchaseDate, SportId)
      VALUES
        (${purchase.Quantity},
         ${totalPrice},
         ${purchase.PricePerTicket},
         ${purchase.BuyerName},
         ${purchase.BuyerEmail},
         ${purchaseDate},
         ${purchase.SportId});
    ;`;

  if(result.rowsAffected[0] === 0) {
    return res.status(500).json({error: "Failed to insert purchase."})
  }
  else {
    res.send('Purchase inserted into db.')
  }

});

export default router;