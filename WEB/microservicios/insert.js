'use strict';
const express = require('express');
const morgan = require('morgan');
const app = express();
const { database } = require('../src/keys');
const mysql = require('mysql2');
const cors = require('cors');
const config = require('./config');
//const router = require('express').Router();
const PORT = 5001;

const DB = database.database;
//*settings */
app.set('port', process.env.PORT || 5001);
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
app.post('/enviarMensaje', (req, res) => {
  console.log('---------------------------------ENTRE A LA RUTA');
  const { MEN_NUMERO_DESTINO, MEN_TEXTO, FK_GES_CODIGO } = req.body;
  console.log('YA PASE EL REQ.BODY');

  const dataMensajesChat = {
    MEN_ESTADO_MENSAJE: 'POR ENVIAR',
    MEN_NUMERO_DESTINO,
    FK_GES_CODIGO,
    MEN_TIPO_MENSAJE: 'chat',
    MEN_TEXTO,
    MEN_CDETALLE_REGISTRO: 'REGISTRO INICIAL DE MENSAJE POR ENVIAR',
    MEN_CESTADO: 'Activo',
  };
  console.log('ANTES DEL INSERT');
  const sql = `INSERT INTO dbp_whatsappmapple.tbl_mensajes_chat SET ?`;
  conn.promise()
    .query(sql, [dataMensajesChat])
    .then(([result, fields]) => res.json({ xd: 'Enviado' }))
    .catch((err) => console.log('ERROR::', err));

  console.log('DESPUES DEL INSERT');
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
