'use strict';
const express = require('express');
const morgan = require('morgan');
const app = express();
const { database } = require('../src/keys');
const mysql = require('mysql2');
const cors = require('cors');
const config = require('./config');
//const router = require('express').Router();
const PORT = 5003;

const DB = database.database;
//*settings */
app.set('port', process.env.PORT || 5003);
app.use(cors({ origin: true }));
app.use(morgan('dev'));
app.use(express.json());
//start the server
let conn = mysql.createConnection({
  host: database.host,
  user: database.user,
  database: database.database,
  password: database.password,
  dateStrings: true,
});
app.use((req, res, next) => {
  console.log(`${req.url}-${req.method}`);
  next();
});

app.get('/papitas', (req, res) => {
  const sql = 'SELECT * FROM ' + DB + '.tbl_rcredencial';
  conn
    .promise()
    .query(sql)
    .then(([result]) => {
      res.json({ primero: result[0], result });
    });
  //res.json({ primero: 'sex' });
});

app.post('/consultaMensajesOrigen', (req, res) => {
  const { MEN_NUMERO_DESTINO } = req.body;
  //console.log(MEN_NUMERO_DESTINO);
  //573006870762@c.us

  let number = MEN_NUMERO_DESTINO;

  let formatedNumber = number;

  //console.log("ESTE ES EL FORMATO ",formatedNumber);

  const sql = 'select * from dbp_whatsappmapple.tbl_mensajes_chat where  MEN_NUMERO_ORIGEN=? ORDER BY PKMEN_NCODIGO;';
  conn
    .promise()
    .query(sql, [formatedNumber, formatedNumber])
    .then(([result, fields]) => {
      res.json({ result });
    });
});

app.post('/mensajesChat', (req, res) => {
  const { MEN_NUMERO_DESTINO, FK_GES_CODIGO } = req.body;
  console.log(MEN_NUMERO_DESTINO, FK_GES_CODIGO);

  let number = MEN_NUMERO_DESTINO;
  let formatedNumber = number;
  let arbol = FK_GES_CODIGO;
  // console.log("ESTE ES EL FORMATO ",formatedNumber);
  console.log('--------------------SELECCIONANDO CHATS DEL NUMERO DE CELULAR', formatedNumber, 'Y DE EL ID DE ARBOL', arbol, '-----------');
  const sql = 'SELECT * FROM dbp_whatsappmapple.tbl_mensajes_chat where (MEN_NUMERO_DESTINO = ? or MEN_NUMERO_ORIGEN = ?) and FK_GES_CODIGO=? ORDER BY PKMEN_NCODIGO;';
  conn
    .promise()
    .query(sql, [formatedNumber, formatedNumber, arbol])
    .then(([result, fields]) => {
      res.json({ result });
    });
});

setInterval(() => {
  const sql = 'select 1 ;';
  conn
    .promise()
    .query(sql)
    .then(([result, fields]) => {
      console.log('checking de actividad');
    });
}, 1800000);
app.listen(PORT, () => console.log('Server running', PORT));
