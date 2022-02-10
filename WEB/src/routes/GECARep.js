const router = require('express').Router();
const db = require('../database');
const path = require('path');
const { userInfo } = require('os');
const keys = require('../keys');
const { query } = require('../database');
///!RUTAS PARA REPORTES.

router.get('/reportes', async (req, res) => {
  const sqlAgentes = `SELECT * FROM ${keys.database.database}.tbl_rpermiso WHERE PER_CNIVEL = 'AGENTE'`;
  let [rowsAgentes] = await db.promise().query(sqlAgentes);

  for await (element of rowsAgentes) {
    let promise = new Promise(async (resolve, reject) => {
      let añoYmesActual = new Date(Date.now()).toJSON().substr(0, 10).split('-'),
        fecha = `${añoYmesActual[0]}-${añoYmesActual[1]}-${añoYmesActual[2]}`;

      const sqlChatsGes = `SELECT COUNT(*) AS chatsGesCount FROM ${keys.database.database}.tbl_gestion WHERE FKGES_NPER_CODIGO = ? AND GES_ESTADO_CASO = 'CERRADO' AND DATE(GES_CFECHA_MODIFICACION) >= ? AND DATE(GES_CFECHA_MODIFICACION) <= ?`;
      let [rowsChatsGes] = await db.promise().query(sqlChatsGes, [element.PKPER_NCODIGO, fecha, fecha]);
      resolve('¡Éxito!'); // ¡Todo salió bien!
      element['chatsGesCount'] = rowsChatsGes[0].chatsGesCount;
    });
    await promise;
  }

  const sqlChatsLive = `SELECT * FROM ${keys.database.database}.tbl_gestion INNER JOIN dbp_whatsappmapple.tbl_rpermiso ON FKGES_NPER_CODIGO = PKPER_NCODIGO WHERE GES_ESTADO_CASO = 'ABIERTO'`;
  let [rowsChatsLive] = await db.promise().query(sqlChatsLive);
  res.render('GECA/reportes', { title: 'Reportes', agentes: rowsAgentes, chatsLive: rowsChatsLive });
});

router.get('/allUser', (req, res) => {
  const sql =
    'SELECT PKPER_NCODIGO, CRE_CUSUARIO, CONCAT(CRE_CNOMBRE, " ", CRE_CNOMBRE2, " ",CRE_CAPELLIDO, " ",CRE_CAPELLIDO2) AS NOMBRE, CRE_CDOCUMENTO AS DOCUMENTO , PER_AUXILIAR, (SELECT COUNT(*) FROM dbp_whatsappmapple.tbl_gestion, dbp_whatsappmapple.tbl_rpermiso, dbp_whatsappmapple.tbl_rcredencial WHERE  FKGES_NPER_CODIGO = PKPER_NCODIGO AND FKPER_NCRE_NCODIGO = PKCRE_NCODIGO AND CRE_CDOCUMENTO = DOCUMENTO AND GES_ESTADO_CASO = "ABIERTO" AND PER_CESTADO = "Activo" AND CRE_CESTADO = "Activo") AS CANTIDAD_CHAT FROM dbp_whatsappmapple.tbl_rcredencial,dbp_whatsappmapple.tbl_rpermiso where dbp_whatsappmapple.tbl_rpermiso.FKPER_NCRE_NCODIGO= dbp_whatsappmapple.tbl_rcredencial.PKCRE_NCODIGO and PER_CNIVEL="AGENTE" order by CANTIDAD_CHAT desc ;';
  db.promise()
    .query(sql)
    .then(([result]) => {
      res.json({ result });
    });
});
router.get('/countCasosOpen', (req, res) => {
  const sql = 'SELECT COUNT(*) as contador FROM dbp_whatsappmapple.tbl_gestion WHERE GES_ESTADO_CASO="ABIERTO";';
  db.promise()
    .query(sql)
    .then(([result]) => {
      res.json({ contador: result[0].contador });
    });
});
router.get('/countCasosClosed', (req, res) => {
  const sql = 'SELECT COUNT(*)  as contador FROM dbp_whatsappmapple.tbl_gestion WHERE GES_ESTADO_CASO="CERRADO";';
  db.promise()
    .query(sql)
    .then(([result]) => {
      res.json({ contador: result[0].contador });
    });
});

router.get('/countCasosPending', (req, res) => {
  const sql = 'SELECT COUNT(*) as contador FROM dbp_whatsappmapple.tbl_gestion WHERE GES_ESTADO_CASO is null AND GES_CULT_MSGBOT="MSG_FIN";';
  db.promise()
    .query(sql)
    .then(([result]) => {
      res.json({ contador: result[0].contador });
    });
});

async function datosChat(ArrayDatos) {
  console.log(ArrayDatos);
  Contador = 0;
  ArrayDatos.forEach((element) => {
    Contador = Contador + 1;
  });

  Dato = '';

  for (let index = 0; index < Contador; index++) {
    sql1 =
      "SELECT timestampdiff(MINUTE,(SELECT MEN_CFECHA_REGISTRO FROM dbp_whatsappmapple.tbl_mensajes_chat WHERE FK_GES_CODIGO = '" +
      ArrayDatos[index].PKGES_CODIGO +
      "' AND MEN_ESTADO_MENSAJE != 'RECIBIDO' ORDER BY PKMEN_NCODIGO ASC LIMIT 1),(SELECT MEN_CFECHA_REGISTRO FROM dbp_whatsappmapple.tbl_mensajes_chat WHERE FK_GES_CODIGO = '" +
      ArrayDatos[index].PKGES_CODIGO +
      "' AND MEN_ESTADO_MENSAJE != 'RECIBIDO' ORDER BY PKMEN_NCODIGO DESC LIMIT 1)) AS DIFERENCIA_ATENCION_ASESOR FROM dbp_whatsappmapple.tbl_mensajes_chat WHERE FK_GES_CODIGO = '" +
      ArrayDatos[index].PKGES_CODIGO +
      "' GROUP BY FK_GES_CODIGO LIMIT 1";
    console.log('Holaaaaaaaaaaaaaaaaaaaaaaaa', sql1);
    await db
      .promise()
      .query(sql1)
      .then(([rows, fields]) => {
        if (rows.length > 0) {
          Dato = Dato + ArrayDatos[index].PKGES_CODIGO + '|' + ArrayDatos[index].GES_NUMERO_COMUNICA + '|' + ArrayDatos[index].DIFERENCIA + '|' + rows[0].DIFERENCIA_ATENCION_ASESOR + '-';
        } else {
          Dato = Dato + ArrayDatos[index].PKGES_CODIGO + '|' + ArrayDatos[index].GES_NUMERO_COMUNICA + '|' + ArrayDatos[index].DIFERENCIA + '|' + '0' + '-';
        }
      });
  }

  return Dato.slice(0, -1);
}

router.post('/consultaFeatures', async (req, res) => {
  const { PKPER_NCODIGO } = req.body;
  let id = PKPER_NCODIGO;
  console.log('ESTOY ENTRANDO CUANTAS VECES?');

  //console.log("ESTE ES EL FORMATO ",formatedNumber);
  ArrayDatos = '';
  var Dato1 = '';
  const sql = 'SELECT PKGES_CODIGO, GES_NUMERO_COMUNICA, (timestampdiff(MINUTE,GES_CFECHA_REGISTRO,GES_CFECHA_MODIFICACION)) AS DIFERENCIA FROM dbp_whatsappmapple.tbl_gestion WHERE FKGES_NPER_CODIGO= ? AND GES_ESTADO_CASO="ABIERTO";';
  console.log('SOY CONSULTA JEJEEEEEEEEEEEEEEEEE ', sql);
  Dato1 = await db
    .promise()
    .query(sql, [id])
    .then(([result, fields]) => {
      ArrayDatos = result;
      //res.json({ result });
      // console.log('>>>>>>>>>>>>>>>>>>>>>>>DEVUELVO', result);
    })
    .then(async (numeros) => {
      var numeros2 = await datosChat(ArrayDatos);
      //numeros2 = numeros2.split("-");
      console.log('PILLEEEEEEEEEEEEEEEEEEE', numeros2);
      res.json({ numeros2 });
    });
});

router.get('/allCasosPendientes', (req, res) => {
  const sql = 'SELECT  * from dbp_whatsappmapple.tbl_gestion where GES_ESTADO_CASO is null and GES_CULT_MSGBOT="MSG_FIN" and GES_CESTADO ="Activo" ;';
  db.promise()
    .query(sql)
    .then(([result]) => {
      if (result.length == 0) {
        res.json({ result: 0 });
      } else {
        res.json({ result });
      }
    });
});

module.exports = router;
