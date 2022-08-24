const router = require('express').Router();
const db = require('../database');
const path = require('path');
const { userInfo } = require('os');
const keys = require('../keys');
const { query } = require('../database');
const ExcelJS = require('exceljs');
const { log } = require('console');

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
router.get('/backoffice', async (req, res) => {
  const sqlSelect = `SELECT * FROM ${keys.database.database}.tbl_gestion INNER JOIN ${keys.database.database}.tbl_rpermiso ON FKGES_NPER_CODIGO = PKPER_NCODIGO WHERE GES_ESTADO_CASO = 'CERRADO' ORDER BY PKGES_CODIGO DESC`;
  let [rows] = await db.promise().query(sqlSelect);
  log(rows);
  res.render('GECA/backoffice', { title: 'BackOffice', chatsCerrados: rows });
});

router.get('/detalleChat/:id', async (req, res) => {
  const idChatGes = req.params.id;
  const sqlSelectGes = `SELECT * FROM ${keys.database.database}.tbl_gestion INNER JOIN ${keys.database.database}.tbl_rpermiso ON FKGES_NPER_CODIGO = PKPER_NCODIGO WHERE GES_ESTADO_CASO = 'CERRADO' AND PKGES_CODIGO = ?`;
  let [rowsSelectGes] = await db.promise().query(sqlSelectGes, [idChatGes]),
    numeroChat = await rowsSelectGes[0].GES_NUMERO_COMUNICA,
    idArbol = await rowsSelectGes[0].PKGES_CODIGO;

  const sqlSelectMen = `SELECT * FROM ${keys.database.database}.tbl_mensajes_chat WHERE MEN_NUMERO_ORIGEN = ? OR MEN_NUMERO_DESTINO = ? AND FK_GES_CODIGO = ?`;
  let [rowsSelectMen] = await db.promise().query(sqlSelectMen, [numeroChat, numeroChat, idArbol]);

  let l = rowsSelectMen.length;

  // res.json({rowsSelectGes: rowsSelectGes[0], rowsSelectMen })
  res.render('GECA/detalleChat', { title: 'Detalles', rowsSelectGes: rowsSelectGes[0], rowsSelectMen, fFin: rowsSelectMen[l - 1].MEN_CFECHA_REGISTRO });
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
router.post('/asignacionSelect', async (req, res) => {
  //const { PKPER_NCODIGO} = req.body;

  //console.log("recibo de id y de estado",PKPER_NCODIGO,PER_AUXILIAR);

  const sql = `SELECT * FROM ${keys.database.database}.tbl_gestion WHERE FKGES_NPER_CODIGO IS NULL AND GES_ESTADO_CASO IS NULL AND GES_CULT_MSGBOT = "MSG_FIN" AND GES_CESTADO = "Activo" ORDER BY GES_CMSGOUTBOUND DESC LIMIT 1`;
  db.promise()
    .query(sql)
    .then(async ([result, fields]) => {
      if (result.length > 0) {
        const sqlOutbound = `SELECT * FROM ${keys.database.database}.tbl_outbount WHERE PKOUT_CODIGO = ?`;
        let [rowsOutbound] = await db.promise().query(sqlOutbound, [result[0].GES_FK_OUTBOUND]);
        res.json({ result, outbound: rowsOutbound[0] });
      } else {
        // console.log("responde",result[0].contador);
        res.json({ result });
      }
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
  const { PKGES_CODIGO, selectTipChat1, selectEspChat1 } = req.body;
  console.log('*******************--------recibo de id y de estado-----------------****************', PKGES_CODIGO);

  const sqlUpdate = `UPDATE ${keys.database.database}.tbl_gestion SET GES_ESTADO_CASO = ?, GES_CENCUESTA = 'ENCUESTAR', GES_CDETALLE17 = ?, GES_CDETALLE18 = ?, GES_CESTADO = ? WHERE PKGES_CODIGO = ?`;
  db.promise()
    .query(sqlUpdate, ['CERRADO', selectTipChat1, selectEspChat1, 'Inactivo', PKGES_CODIGO])
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
    const sqlSelect = `SELECT * FROM ${keys.database.database}.TBL_RESTANDAR WHERE EST_CCONSULTA = 'cmbPlantillas'`;
    let [rows] = await db.promise().query(sqlSelect);
    res.json(rows);
  } catch (error) {
    console.log(`Error:: ${error}`);
  }
});

// * Cargue Masivo
router.get('/viewCargue', (req, res) => {
  res.render('GECA/viewCargue', { title: 'Cargue Masivo' });
});
router.post('/cargarExcel', (req, res) => {
  try {
    let excel = req.files.fileExcel,
      nombreArchivo = `x${req.user.PKPER_NCODIGO}x${excel.name}`,
      rutaArchivo = path.resolve(`./src/public/doc/Excel/${nombreArchivo}`);
    // * Guardar Excel
    excel.mv(rutaArchivo, (err) => {
      if (err) {
        return res.status(500).send({ message: err });
      } else {
        const workbook = new ExcelJS.Workbook();
        workbook.xlsx
          .readFile(rutaArchivo)
          .then(async () => {
            let hojas = workbook.worksheets.map((sheet) => sheet.name),
              selectedHoja1 = workbook.getWorksheet(hojas[0]),
              rowsExcel = selectedHoja1.actualRowCount,
              columnsExcel = selectedHoja1.actualColumnCount;

            let titleColumns = [];
            for (let i = 2; i <= columnsExcel; i++) {
              let title = selectedHoja1.getRow(1).getCell(i).toString(),
                titleValue = selectedHoja1.getRow(2).getCell(i).toString();
              if (titleValue.includes('GMT')) {
                let fecha = new Date(`${titleValue}`).toISOString();
                // * SI es Fecha
                if (fecha.split('T')[1].split(':')[1] === '00') {
                  titleValue = fecha.split('T')[0].split('-').join('/');
                  console.log(titleValue);
                } else {
                  // * SI es Hora
                  titleValue = new Date(titleValue).toUTCString().split(' ')[4].split(':').slice(0, 2).join(':');
                }
              }
              titleColumns.push({ title, titleValue });
            }
            let numerosExcel = [];
            for (let i = 2; i <= rowsExcel; i++) {
              numerosExcel.push(selectedHoja1.getRow(i).getCell(1).toString());
            }

            res.render('GECA/detallesExcel', { title: 'Detalle Envio', message: 'Archivo Guardado', nombreArchivo, rutaArchivo, nombreOriginal: excel.name, titleColumns, numerosCount: rowsExcel - 1, numerosExcel });
          })
          .catch((error) => console.log(error));
      }
    });
  } catch (error) {
    console.log(error);
  }
});
router.post('/envioMasivo', (req, res) => {
  let { rutaExcel, cuerpoMsg, nombreExcel } = req.body;
  // * Sacar columnas seleccionadas del Mensaje
  let arr = cuerpoMsg.split('('),
    columnasInMsg = [];
  arr.forEach((el) => {
    if (el.includes(')')) {
      let nColumn = el.split(')')[0];
      columnasInMsg.push(nColumn);
    }
  });

  const workbook = new ExcelJS.Workbook();
  workbook.xlsx
    .readFile(rutaExcel)
    .then(async () => {
      let hojas = workbook.worksheets.map((sheet) => sheet.name),
        selectedHoja1 = workbook.getWorksheet(hojas[0]),
        rowsExcel = selectedHoja1.actualRowCount,
        columnsExcel = selectedHoja1.actualColumnCount;

      // * Obtener columnas seleccionadas del excel para con su Indice para colocar en el msg
      let columnasInExcel = {};
      for (let i = 2; i <= columnsExcel; i++) {
        let titleColumn = selectedHoja1.getRow(1).getCell(i).toString();
        columnasInExcel[titleColumn] = i;
      }

      // * Generar el msg con las columnas seleccionadas
      let promises = [];
      for (let i = 2; i <= rowsExcel; i++) {
        let numero = selectedHoja1.getRow(i).getCell(1).toString(),
          cuerpoMsgNew = cuerpoMsg;
        columnasInMsg.forEach((el) => {
          let valor = selectedHoja1.getRow(i).getCell(columnasInExcel[el]).toString();
          // * Validar si es Fecha o Hora
          if (valor.includes('GMT')) {
            // * SI es Fecha
            let fecha = new Date(`${valor}`).toISOString();
            // * SI es Fecha
            if (fecha.split('T')[1].split(':')[1] === '00') {
              titleValue = fecha.split('T')[0].split('-').join('/');
              console.log(titleValue);
              cuerpoMsgNew = cuerpoMsgNew.replace(`(${el})`, titleValue);
            } else {
              // * SI es Hora
              cuerpoMsgNew = cuerpoMsgNew.replace(`(${el})`, new Date(valor).toUTCString().split(' ')[4].split(':').slice(0, 2).join(':'));
            }
          } else {
            cuerpoMsgNew = cuerpoMsgNew.replace(`(${el})`, valor);
          }
        });

        const data = {
          OUT_NUMERO_COMUNICA: numero,
          OUT_CULT_MSGBOT: cuerpoMsgNew,
          OUT_CDETALLE: 'POR ENVIAR',
          OUT_CDETALLE1: nombreExcel,
        };

        console.log(cuerpoMsgNew);
        // * Crear inserts por fila
        const sqlInsert = `INSERT INTO ${keys.database.database}.tbl_outbount SET ?`;
        promises.push(db.promise().query(sqlInsert, [data]));
      }

      // * Ejecutar promesas simultaneas previamente creadas en el for - Hola (NOMBRE) su cita sera el (FECHA CITA) a las (HORA CITA)
      Promise.all(promises).then((resPromiseAll) => {
        resPromiseAll.forEach((resPromise) => {
          console.log(resPromise[0].insertId);
        });
        req.flash('messageSuccess', `Se han enviado <span style="color: #27ae60; font-weight: bold;">${resPromiseAll.length}</span> mensajes`);
        res.redirect('/GECA/viewCargue');
      });
    })
    .catch((error) => console.log(error));
});

//**revisa si tiene los  mismos casos asignados o si ya se lo quitaron para limpiar la parte visual */
router.post('/reviewVars', async (req, res) => {
  const { FKGES_NPER_CODIGO, PKGES_CODIGO, GES_NUMERO_COMUNICA } = req.body;
  console.log('recibo el numero', GES_NUMERO_COMUNICA, 'y el id', PKGES_CODIGO);
  const sqlConsulta = `SELECT * FROM ${keys.database.database}.tbl_gestion WHERE  GES_ESTADO_CASO='ABIERTO' AND GES_NUMERO_COMUNICA=? AND PKGES_CODIGO =? AND FKGES_NPER_CODIGO =?; `;
  let [rows] = await db.promise().query(sqlConsulta, [GES_NUMERO_COMUNICA, PKGES_CODIGO, FKGES_NPER_CODIGO]);
  console.log(sqlConsulta);
  console.log(rows);

  res.json(rows);
});

// * Reportes Encuestas
router.get('/encuestas', async (req, res) => {
  const sql = `SELECT * FROM tbl_gestion INNER JOIN tbl_rpermiso ON tbl_gestion.FKGES_NPER_CODIGO = tbl_rpermiso.PKPER_NCODIGO WHERE GES_CENCUESTA = 'ENCUESTADO'`;
  let [result] = await db.promise().query(sql);
  res.render('GECA/encuestas', { title: 'Encuestas', encuestas: result });
});

// * QR Vista
router.get('/viewQR', async (req, res) => {
  res.render('GECA/viewQR', { title: 'QR' });
});
router.get('/getQR', async (req, res) => {
  const sqlSelectQR = `SELECT * FROM TBL_RESTANDAR WHERE EST_CCONSULTA = 'cmbQR' AND EST_CDETALLE1 = 'Por Sincronizar'`;
  let [result] = await db.promise().query(sqlSelectQR);
  if (result.length === 0) {
    res.json({ result: true });
  } else {
    res.json({ result: result[0] });
  }
});

module.exports = router;
