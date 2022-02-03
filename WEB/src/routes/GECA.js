const router = require('express').Router();
const db = require('../database');
const path = require('path');
const { userInfo } = require('os');
const keys = require('../keys');
const { query } = require('../database');

// * Vistas
router.get('/transferencias', (req, res) => {
  res.render('GECA/transferencias', { title: 'Transferencias' });
});

/*
router.get('/reportes', (req, res) => {
  res.render('samaritana/reportes', { title: 'Reportes' });
});
*/

// * Rutas
router.get('/papitas', (req, res) => {
  const sql = 'SELECT * FROM dbp_usuarios.tbl_rcredencial';
  db.promise()
    .query(sql)
    .then(([result]) => {
      res.json({ primero: result[0], result });
    });
});

//HAGO EL ENVIO A LA BASE DE DATOS
router.post('/enviarMensaje', (req, res) => {
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
  const sql = `INSERT INTO ${keys.database.database}.tbl_mensajes_chat SET ?`;
  db.promise()
    .query(sql, [dataMensajesChat])
    .then(([result, fields]) => res.json({ xd: 'Enviado' }))
    .catch((err) => console.log('ERROR::', err));

  console.log('DESPUES DEL INSERT');
});

///CONSULTO CON EL NUMERO DEL CELULAR Y ARBOL
router.post('/mensajesChat', (req, res) => {
  const { MEN_NUMERO_DESTINO, FK_GES_CODIGO } = req.body;
  console.log(MEN_NUMERO_DESTINO, FK_GES_CODIGO);
  //573006870762@c.us

  let number = MEN_NUMERO_DESTINO;

  let formatedNumber = number;
  let arbol = FK_GES_CODIGO;
  // console.log("ESTE ES EL FORMATO ",formatedNumber);

  const sql = 'SELECT * FROM ' + keys.database.database + '.tbl_mensajes_chat WHERE (MEN_NUMERO_DESTINO = ? or MEN_NUMERO_ORIGEN = ?) AND FK_GES_CODIGO=? ORDER BY PKMEN_NCODIGO;';
  db.promise()
    .query(sql, [formatedNumber, formatedNumber, arbol])
    .then(([result, fields]) => {
      res.json({ result });
    });
});

///CONSULTO CON EL NUMERO DEL CELULAR
router.post('/consultaMensajesOrigen', (req, res) => {
  const { MEN_NUMERO_DESTINO } = req.body;
  //console.log(MEN_NUMERO_DESTINO);
  //573006870762@c.us

  let number = MEN_NUMERO_DESTINO;

  let formatedNumber = number;

  //console.log("ESTE ES EL FORMATO ",formatedNumber);

  const sql = 'SELECT * FROM ' + keys.database.database + '.tbl_mensajes_chat WHERE  MEN_NUMERO_ORIGEN=? ORDER BY PKMEN_NCODIGO;';
  db.promise()
    .query(sql, [formatedNumber, formatedNumber])
    .then(([result, fields]) => {
      res.json({ result });
    });
});

router.get('/getId', (req, res) => {
  console.log('CODEEEEEEEEEEEEEEEEE', req.user.PKPER_NCODIGO);
  res.json({ idPer: req.user.PKPER_NCODIGO });
});

router.post('/chatsAsignados', (req, res) => {
  const { PKPER_NCODIGO } = req.body;
  console.log('LLAVE PRIMARIA DE LA TABLA RPERMISO', PKPER_NCODIGO);

  const sql = 'SELECT count(*) as contador FROM ' + keys.database.database + '.tbl_gestion WHERE FKGES_NPER_CODIGO=? AND GES_ESTADO_CASO="ABIERTO";';
  db.promise()
    .query(sql, [PKPER_NCODIGO])
    .then(([result, fields]) => {
      // console.log("responde",result[0].contador);
      res.json({ contador: result[0].contador });
    });
});

router.post('/cambioEstado', (req, res) => {
  const { PKPER_NCODIGO, PER_AUXILIAR } = req.body;
  console.log('recibo de id y de estado', PKPER_NCODIGO, PER_AUXILIAR);

  const sqlUpdate = 'UPDATE ' + keys.database.database + '.tbl_rpermiso SET PER_AUXILIAR = ? WHERE PKPER_NCODIGO = ?';
  db.promise()
    .query(sqlUpdate, [PER_AUXILIAR, PKPER_NCODIGO])
    .then(([result, fields]) => {
      // console.log("responde",result[0].contador);
      res.json({ xd: 'Enviado' });
    });
});

///SON DOS RUTAS UNA RECOGE LOS ULTIMOS CASOS CON UN SELECT Y  LA SEGUNDA LE PONE LA LLAVE DE RPERMISO A ESTA TABLA
router.post('/asignacionSelect', (req, res) => {
  //const { PKPER_NCODIGO} = req.body;

  //console.log("recibo de id y de estado",PKPER_NCODIGO,PER_AUXILIAR);

  const sql = 'SELECT * FROM ' + keys.database.database + '.tbl_gestion WHERE  FKGES_NPER_CODIGO is null  AND GES_ESTADO_CASO is null AND GES_CULT_MSGBOT="MSG_FIN" AND GES_CESTADO="Activo" ORDER BY PKGES_CODIGO asc LIMIT 1 ;';
  db.promise()
    .query(sql)
    .then(([result, fields]) => {
      // console.log("responde",result[0].contador);
      res.json({ result });
    });
});

router.post('/asignacionUpdate', (req, res) => {
  const { PKGES_CODIGO, FKGES_NPER_CODIGO } = req.body;
  console.log('*******************recibo de id y de estado****************', PKGES_CODIGO, FKGES_NPER_CODIGO);

  const sqlUpdate = 'UPDATE ' + keys.database.database + '.tbl_gestion SET FKGES_NPER_CODIGO = ?,GES_ESTADO_CASO="ABIERTO"  WHERE PKGES_CODIGO = ?;';
  db.promise()
    .query(sqlUpdate, [FKGES_NPER_CODIGO, PKGES_CODIGO])
    .then(([result, fields]) => {
      // console.log("responde",result[0].contador);
      res.json({ xd: 'Enviado' });
    });
});

router.post('/casoCerrado', (req, res) => {
  const { PKGES_CODIGO } = req.body;
  console.log('*******************--------recibo de id y de estado-----------------****************', PKGES_CODIGO);

  const sqlUpdate = 'UPDATE ' + keys.database.database + '.tbl_gestion SET GES_ESTADO_CASO="CERRADO",GES_CESTADO="Inactivo"  WHERE PKGES_CODIGO = ?;';
  db.promise()
    .query(sqlUpdate, [PKGES_CODIGO])
    .then(([result, fields]) => {
      // console.log("responde",result[0].contador);
      res.json({ xd: 'Enviado' });
    });
});

/*
///MODULO DE REPORTERIA 
router.get('/allUser', (req, res) => {
  const sql = 'SELECT * FROM dbp_what_samaritana.tbl_rcredencial,dbp_what_samaritana.tbl_rpermiso WHERE dbp_what_samaritana.tbl_rpermiso.FKPER_NCRE_NCODIGO= dbp_what_samaritana.tbl_rcredencial.PKCRE_NCODIGO;';
  db.promise()
    .query(sql)
    .then(([result]) => {
      res.json({result});
    });
});
*/

///PARA CREAR EL CASO EN EL ARBOL

router.post('/newConversation', (req, res) => {
  const { FKGES_NPER_CODIGO, GES_NUMERO_COMUNICA } = req.body;
  console.log('recibo el numero', GES_NUMERO_COMUNICA);
  let msg = 'MSG_FIN';
  let kind = 'OUTBOUND';
  let estado = 'Activo';
  let estadoChat = 'ABIERTO';
  const sql = `INSERT INTO ${keys.database.database}.tbl_gestion (FKGES_NPER_CODIGO,GES_ESTADO_CASO,GES_NUMERO_COMUNICA, GES_CULT_MSGBOT,GES_CDETADICIONAL, GES_CESTADO) VALUES ('${FKGES_NPER_CODIGO}','${estadoChat}','${GES_NUMERO_COMUNICA}', '${msg}', '${kind}','${estado}')`;
  db.promise()
    .query(sql, [GES_NUMERO_COMUNICA])
    .then(([result, fields]) => {
      const sqlConsulta = `SELECT * FROM ${keys.database.database}.tbl_gestion WHERE GES_NUMERO_COMUNICA=${GES_NUMERO_COMUNICA} and GES_CESTADO='${estado}'; `;
      db.promise()
        .query(sqlConsulta, [GES_NUMERO_COMUNICA])
        .then(([result, fields]) => {
          res.json({ result });
        });

      //  res.json({ xd: 'Insertado' });
    });
});

//CONSULTAR HISTORICO

router.post('/searchChat', (req, res) => {
  const { GES_NUMERO_COMUNICA } = req.body;
  console.log(GES_NUMERO_COMUNICA);
  //573006870762@c.us

  // console.log("ESTE ES EL FORMATO ",formatedNumber);

  const sql = 'SELECT * FROM ' + keys.database.database + '.tbl_gestion WHERE GES_NUMERO_COMUNICA=?;';
  db.promise()
    .query(sql, [GES_NUMERO_COMUNICA])
    .then(([result, fields]) => {
      res.json({ result });
    });
});

// * Cunsultar Plantillas
router.get('/getPlantillas', async (req, res) => {
  try {
    const sqlSelect = `SELECT * FROM dbp_whatsappmapple.TBL_RESTANDAR WHERE EST_CCONSULTA = 'cmbPlantillas'`;
    let [rows] = await db.promise().query(sqlSelect);
    res.json(rows);
  } catch (error) {
    console.log(`Error:: ${error}`);
  }
});

module.exports = router;
