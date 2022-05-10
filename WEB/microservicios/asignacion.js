'use strict';
const express = require('express');
const morgan = require('morgan');
const app = express();
const { database } = require('../src/keys');
const mysql = require('mysql2');
const cors = require('cors');
const config = require('./config');
//const router = require('express').Router();
const PORT = 5002;

const DB = database.database;
//*settings */
app.set('port', process.env.PORT || 5002);
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
app.post('/chatsAsignados', (req, res) => {
  const { PKPER_NCODIGO } = req.body;
  console.log('LLAVE PRIMARIA DE LA TABLA RPERMISO', PKPER_NCODIGO);

  const sql = 'select count(*) as contador from dbp_whatsappmapple.tbl_gestion where FKGES_NPER_CODIGO=? and GES_ESTADO_CASO="ABIERTO";';
  conn
    .promise()
    .query(sql, [PKPER_NCODIGO])
    .then(([result, fields]) => {
      console.log('+++++++++++++++++++++CANTIDAD DE CASOS QUE TIENE ASIGNADOS :', result[0].contador, 'EL USUARIO ', PKPER_NCODIGO, '+++++++++++++++');

      res.json({ contador: result[0].contador });
    });
});
app.post('/asignacionSelect', async (req, res) => {
  //const { PKPER_NCODIGO} = req.body;

  //console.log("recibo de id y de estado",PKPER_NCODIGO,PER_AUXILIAR);

  const sql = `SELECT * FROM dbp_whatsappmapple.tbl_gestion WHERE FKGES_NPER_CODIGO IS NULL AND GES_ESTADO_CASO IS NULL AND GES_CULT_MSGBOT = "MSG_FIN" AND GES_CESTADO = "Activo" ORDER BY GES_CMSGOUTBOUND DESC LIMIT 1`;
  conn.promise()
    .query(sql)
    .then(async ([result, fields]) => {
      if (result.length > 0) {
        const sqlOutbound = `SELECT * FROM dbp_whatsappmapple.tbl_outbount WHERE PKOUT_CODIGO = ?`;
        let [rowsOutbound] = await conn.promise().query(sqlOutbound, [result[0].GES_FK_OUTBOUND]);
        res.json({ result, outbound: rowsOutbound[0] });
      } else {
        // console.log("responde",result[0].contador);
        res.json({ result });
      }
    });
});
app.post('/asignacionUpdate', (req, res) => {
  const { PKGES_CODIGO, FKGES_NPER_CODIGO } = req.body;
  console.log('****************ASIGNANDO EL CASO ***********', PKGES_CODIGO, '**********AL USUARIO:', FKGES_NPER_CODIGO, '***************************');

  const sqlUpdate = 'UPDATE dbp_whatsappmapple.tbl_gestion SET FKGES_NPER_CODIGO = ?,GES_ESTADO_CASO="ABIERTO"  WHERE PKGES_CODIGO = ?;';
  conn
    .promise()
    .query(sqlUpdate, [FKGES_NPER_CODIGO, PKGES_CODIGO])
    .then(([result, fields]) => {
      // console.log("responde",result[0].contador);
      res.json({ xd: 'Enviado' });
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
//

app.listen(PORT, () => console.log('Server running', PORT));
