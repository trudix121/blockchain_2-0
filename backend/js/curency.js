const express = require('express');
const app = express();
const body = require('body-parser');
const ejs = require('ejs');
const router = express.Router();
const db = require('../db/db.js');
const currentDate = new Date();

router.use(body.json());
router.use(body.urlencoded({ extended:true }));
app.set('view engine', 'ejs');
app.set('views', [
  '../../frontend/admin',
'  ../../frontend/blockchain',
'  ../../frontend/index',
'  ../../frontend/quests',
'  ../../frontend/curency',
'  ../../frontend/games',
"../../frontend/chat"

]);

app.use(router);

function generateRandomNumber(maxValue) {
  return Math.floor(Math.random() * maxValue) + 1;
}
const fetchData = require('../utils/eth_price.js');

// Now you can call the fetchData function


let currency_price ; // Variabila globala pentru pretul valutei

async function get_price(){
  const price = await fetchData()
  currency_price = price
}
get_price()
if(currency_price == undefined ){
  currency_price = 10000
}
console.log(currency_price)
// Generare pret initial

router.get('/', async (req, res) => {
  const username = req.query.username;
  const referrer = req.headers.referer || '';
  const redirectUrl = 'http://localhost:3000';

  // Verifică dacă Gigel a fost redirecționat de pe localhost:3000/
  if (!referrer.startsWith(redirectUrl)) {
    return res.status(403).send('Accesul refuzat!');
  }

  try {
    const result = await db.find_one('blockchain', 'accounts', { username: username });
    res.render('curency', { price: currency_price, username: username, ethm: result.ethm, money: result.money });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/buy', async (req, res) => {
  const username = req.query.username;
  const { ethm } = req.body;
  const referrer = req.headers.referer || '';
  const redirectUrl = 'http://localhost:3000';

  // Verifică dacă Gigel a fost redirecționat de pe localhost:3000/
  if (!referrer.startsWith(redirectUrl)) {
    return res.status(403).send('Accesul refuzat!');
  }

  const user = await db.find_one('blockchain', 'accounts', { username: username });
  try {
    if (user) {
      if (user.money >= currency_price * ethm) {
        if(user.battlepass=== 1){
        await db.update('blockchain', 'accounts', { username: username }, {
          $inc: {
            money: -currency_price * parseInt(ethm),
            ethm_buyed: parseInt(ethm),
            ethm: parseInt(ethm)
          }
        });
        currency_price += 10;
        const after_result = await db.find_one('blockchain', 'accounts', { username: username });
        res.send(`Success! You have ${after_result.money}$`);
        }
        else{
          await db.update('blockchain', 'accounts', { username: username }, {
            $inc: {
              money: -currency_price * parseInt(ethm),
              ethm: parseInt(ethm)
            }
          });
          currency_price += 10;
          const after_result = await db.find_one('blockchain', 'accounts', { username: username });
          res.send(`Success! You have ${after_result.money}$`);

        }

      } else {
        res.send(`You don't have enough money. You need ${ethm * currency_price} $`);
      }
    } else {
      res.send('Internal Server Error');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/sell', async (req, res) => {
  const username = req.query.username;
  const { ethm } = req.body;
  const referrer = req.headers.referer || '';
  const redirectUrl = 'http://localhost:3000';

  // Verifică dacă Gigel a fost redirecționat de pe localhost:3000/
  if (!referrer.startsWith(redirectUrl)) {
    return res.status(403).send('Accesul refuzat!');
  }

  try {
    const result = await db.find_one('blockchain', 'accounts', { username: username });
    if (result) {
      const price = currency_price * ethm;
      if (result.ethm < ethm) {
        res.send('You don\'t have enough ethm');
      } else {
        if(result.battlepass === 1){
          await db.update('blockchain', 'accounts', { username: username }, {
            $inc: {
              money: parseInt(price),
              ethm: -parseInt(ethm),
              ethm_sell: parseInt(ethm),
            }
          });
          currency_price -= 10;
          res.send('Success');
        }
        else{
          await db.update('blockchain', 'accounts', { username: username }, {
            $inc: {
              money: parseInt(price),
              ethm: -parseInt(ethm),
            }
          });
          currency_price -= 10;
          res.send('Success');
        }

      }
    } else {
      res.send('Internal Server Error');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
