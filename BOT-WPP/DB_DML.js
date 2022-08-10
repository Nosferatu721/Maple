'use strict';
const mysql = require('mysql2');
const fs = require('fs');
const { database } = require('./keys');
const DB = database.database;
let connDB = mysql.createConnection({
  host: database.host,
  user: database.user,
  database: database.database,
  password: database.password,
  dateStrings: true,
});
/*
class Permiso {
  async valid_numero(numero_chat) {
    let estado = "Activo";
    let nivel = "MOTORIZADO";
    let nombre = "";
    const sql = `SELECT * FROM ${DB}.tbl_rpermiso WHERE PER_NUMERO_CELULAR ='${numero_chat}' AND PER_CNIVEL = '${nivel}' AND PER_CESTADO = '${estado}';`;

    await connDB
      .promise()
      .query(sql)
      .then(([results, fields]) => {
        if (results.length > 0) {
          nombre = results[0].PER_CUSUARIO;
        } else {
          nombre = "";
        }
      })
      .catch((Error) => ControlErrores(Error));
    return nombre;
  }
  ControlErrores(Error) {
    var FechaActual = GetFechaActual();
    var HoraActual = getHoraActual();
  
    if (!fs.existsSync("logs")) {
      fs.mkdirSync("logs");
    }
    var logger = fs.createWriteStream(`./logs/log_${FechaActual}.txt`, {
      flags: "a",
    });
    var DetalleError = dumpError(Error);
    logger.write(`${Error} ${DetalleError} ${FechaActual} - ${HoraActual}\n`);
  }
}
*/
class Gestion {
  //inserta en gestión el nuevo caso
  async insert_gestion(numero, msg, estado, outboundID = '0') {
    let comprobar = false;
    let kind = 'INBOUND';
    const sql = `INSERT INTO ${DB}.tbl_gestion (GES_NUMERO_COMUNICA, GES_CULT_MSGBOT,GES_CDETADICIONAL, GES_CESTADO, GES_FK_OUTBOUND) VALUES ('${numero}', '${msg}', '${kind}','${estado}', '${outboundID}')`;
    await connDB
      .promise()
      .query(sql)
      .then(() => {
        comprobar = true;
      });
    return comprobar;
  }
  //verifica si el numero ya esta  en el arbol
  async get_msg_by_numero(numero_chat) {
    let estado = 'Activo';
    let msg_bot = '';
    const sql = `SELECT * FROM ${DB}.tbl_gestion WHERE GES_NUMERO_COMUNICA ='${numero_chat}' AND GES_CESTADO = '${estado}';`;
    await connDB
      .promise()
      .query(sql)
      .then(([results, fields]) => {
        if (results.length > 0) {
          msg_bot = results[0].GES_CULT_MSGBOT;
        } else {
          msg_bot = '';
        }
      })
      .catch((Error) => ControlErrores(Error));

    return msg_bot;
  }
  //obtiene el id de gestión del arbol pra luego insertarlo  en la tabla de los mensajes
  async get_id_by_numero(numero_chat) {
    let estado = 'Activo';
    let id_gestion = '';
    const sql = `SELECT * FROM ${DB}.tbl_gestion WHERE GES_NUMERO_COMUNICA ='${numero_chat}' AND GES_CESTADO = '${estado}';`;
    await connDB
      .promise()
      .query(sql)
      .then(([results, fields]) => {
        if (results.length > 0) {
          id_gestion = results[0].PKGES_CODIGO;
        } else {
          id_gestion = '';
        }
      })
      .catch((Error) => ControlErrores(Error));
    return id_gestion;
  }
  //este probablemente no lo necesite ya que cambia a MSG_FIN despues de responder la lista
  async update_gestion(id, msg, respuesta, column) {
    let comprobar = false;
    // let estado = 'Activo';
    const sql = `UPDATE ${DB}.tbl_gestion SET GES_CULT_MSGBOT = '${msg}', GES_CDETALLE = '${respuesta}', ${column} = '${respuesta}' WHERE PKGES_CODIGO = '${id}'`;
    await connDB
      .promise()
      .query(sql)
      .then(() => {
        comprobar = true;
      });
    return comprobar;
  }

  async cerrarOutbound(id, respuesta) {
    let comprobar = false;
    const sql = `UPDATE ${DB}.tbl_gestion SET GES_CULT_MSGBOT = 'MSG_CLOSE', GES_CMSGOUTBOUND = '${respuesta}', GES_CESTADO = 'Inactivo' WHERE PKGES_CODIGO = '${id}' AND GES_CESTADO = 'Activo'`;
    console.log(sql);
    await connDB
      .promise()
      .query(sql)
      .then(() => {
        comprobar = true;
      });
    return comprobar;
  }

  async cerrarChat(id) {
    let comprobar = false;
    const sql = `UPDATE ${DB}.tbl_gestion SET GES_CULT_MSGBOT = 'MSG_CLOSE', GES_CESTADO = 'Inactivo' WHERE PKGES_CODIGO = '${id}' AND GES_CESTADO = 'Activo'`;
    console.log(sql);
    await connDB
      .promise()
      .query(sql)
      .then(() => {
        comprobar = true;
      });
    return comprobar;
  }

  // ! Sin Responder el arbol
  async getNoResolvedCases() {
    const sql = `SELECT * FROM ${DB}.tbl_gestion WHERE GES_CULT_MSGBOT != 'MSG_FIN' AND GES_CESTADO = 'Activo';`;
    let [result] = await connDB.promise().query(sql);
    return result;
  }
  // ! update_gestion_No_Answered
  async update_gestion_No_Answered(id) {
    const sql = `UPDATE ${DB}.tbl_gestion SET GES_CESTADO = 'Inactivo' WHERE PKGES_CODIGO = ${id}`;
    let [result] = await connDB.promise().query(sql);
    return result;
  }

  //retornar los 3 datos que necesito para el arbol estado, estado del mensaje e id del asesor asignado, solo retornar esta
  //data pero de los arboles activos
  async get_data_list_from_number(numberPhone) {
    let estado = 'Activo';
    const sql = `SELECT * FROM ${DB}.tbl_gestion WHERE GES_NUMERO_COMUNICA ='${numberPhone}' AND GES_CESTADO = '${estado}';`;
    let datatable = [];
    await connDB
      .promise()
      .query(sql)
      .then(([results, fields]) => {
        if (results.length > 0) {
          datatable.push(results[0]);
        } else {
          id_tree = 'NO EXISTE ARBOL CON ESE NUMERO ACTIVO';
        }
      })
      .catch((Error) => ControlErrores(Error));
    return datatable;
  }
  // Buscar Conversaciones Cerradas para realizar encuesta desde el Bot
  async getChatCerrado(numberPhone) {
    const sql = `SELECT * FROM ${DB}.tbl_gestion WHERE GES_NUMERO_COMUNICA ='${numberPhone}' AND GES_CENCUESTA = 'ENCUESTAR' AND GES_ESTADO_CASO = 'CERRADO' AND GES_CESTADO = 'Inactivo'`;
    let [result] = await connDB.promise().query(sql);
    return result.length ? result[0] : false;
  }

  async getChatsCerrado() {
    const sql = `SELECT * FROM ${DB}.tbl_gestion WHERE GES_ESTADO_CASO = 'CERRADO' AND GES_CESTADO = 'Inactivo' AND GES_CENCUESTA = 'ENCUESTAR'`;
    let [result] = await connDB.promise().query(sql);
    return result.length ? result[0] : false;
  }

  //funcion encargada de responder al cliente si se encuentra en cola para que no se vaya, para ello debe consultar con el numero
  //de cel cual es su id en la base de datos.
  async select_id_arbol_by_number(numberPhone) {
    let estado = 'Activo';
    let id_tree;
    const sql = `SELECT PKGES_CODIGO FROM ${DB}.tbl_gestion WHERE GES_NUMERO_COMUNICA ='${numberPhone}' AND GES_CESTADO = '${estado}';`;
    //console.log(sql);
    await connDB
      .promise()
      .query(sql)
      .then(([results, fields]) => {
        if (results.length > 0) {
          id_tree = results[0].PKGES_CODIGO;
        } else {
          id_tree = 'NO EXISTE ARBOL CON ESE NUMERO ACTIVO';
        }
      })
      .catch((Error) => ControlErrores(Error));

    return id_tree;
  }
  //funcion encargada de responder al cliente si se encuentra en cola para que no se vaya, para ello debe consultar con el numero
  //de cel cual es su id en la base de datos.
  async select_id_arbol_by_numberCerrado(numberPhone) {
    let estado = 'Activo';
    let id_tree;
    const sql = `SELECT PKGES_CODIGO FROM ${DB}.tbl_gestion WHERE GES_NUMERO_COMUNICA ='${numberPhone}' AND GES_ESTADO_CASO = 'CERRADO' AND GES_CENCUESTA = 'ENCUESTAR' AND GES_CESTADO = 'Inactivo'`;
    //console.log(sql);
    await connDB
      .promise()
      .query(sql)
      .then(([results, fields]) => {
        if (results.length > 0) {
          id_tree = results[0].PKGES_CODIGO;
        } else {
          id_tree = 'NO EXISTE ARBOL CON ESE NUMERO ACTIVO';
        }
      })
      .catch((Error) => ControlErrores(Error));

    return id_tree;
  }

  async select_position(idArbol) {
    let position;
    const sql = `SELECT count(*) as position FROM ${DB}.tbl_gestion WHERE PKGES_CODIGO<${idArbol} and GES_CESTADO='Activo' and GES_ESTADO_CASO is null;`;
    console.log(sql);
    await connDB
      .promise()
      .query(sql)
      .then(([results, fields]) => {
        if (results.length > 0) {
          position = results[0].position;
        } else {
          position = 'NO EXISTE ARBOL CON ESE NUMERO ACTIVO';
        }
      })
      .catch((Error) => ControlErrores(Error));

    return position;
  }

  async deleteChat(numero) {
    let estado = 'Activo';
    const sql = `DELETE FROM ${DB}.tbl_gestion WHERE GES_NUMERO_COMUNICA ='${numero}' AND GES_CESTADO = '${estado}';`;
    await connDB
      .promise()
      .query(sql)
      .then(([results, fields]) => {
        return true;
      })
      .catch((Error) => ControlErrores(Error));
  }
}

class Mensaje {
  //busca los mensajes que estan por enviar
  async get_mensaje() {
    let estado = 'Activo';
    let estado_mensaje = 'POR ENVIAR';
    let respuesta = null;
    const sql = `SELECT PKMEN_NCODIGO, MEN_NUMERO_DESTINO, MEN_TEXTO FROM ${DB}.tbl_mensajes_chat WHERE MEN_ESTADO_MENSAJE ='${estado_mensaje}' AND MEN_CESTADO = '${estado}' LIMIT 1;`;
    await connDB
      .promise()
      .query(sql)
      .then(([results, fields]) => {
        if (results.length > 0) {
          respuesta = results[0];
        } else {
          respuesta = null;
        }
      })
      .catch((Error) => ControlErrores(Error));
    return respuesta;
  }
  //esos mensajes por enviar los actualiza a enviados
  async update_mensaje(id, msg) {
    let comprobar = false;
    let estado = 'Activo';
    const sql = `UPDATE ${DB}.tbl_mensajes_chat SET MEN_ESTADO_MENSAJE = '${msg}' WHERE PKMEN_NCODIGO = '${id}' AND MEN_CESTADO = '${estado}';`;
    await connDB
      .promise()
      .query(sql)
      .then(() => {
        comprobar = true;
      });
    return comprobar;
  }
  //inserta los mensajes que se verán en la pagina web
  async insert_mensaje(gestion, numero, mensaje, tipo_mensaje) {
    let comprobar = false;
    let estado = 'Activo';
    let estado_mensaje = 'RECIBIDO';
    let detalle = 'Registrado por el Bot';
    const sql = `INSERT INTO ${DB}.tbl_mensajes_chat (FK_GES_CODIGO, MEN_ESTADO_MENSAJE, MEN_NUMERO_ORIGEN, MEN_TIPO_MENSAJE, MEN_TEXTO, MEN_CDETALLE_REGISTRO, MEN_CESTADO) VALUES ('${gestion}','${estado_mensaje}','${numero}','${tipo_mensaje}','${mensaje}','${detalle}','${estado}');`;
    await connDB
      .promise()
      .query(sql)
      .then(() => {
        comprobar = true;
      });
    return comprobar;
  }

  ControlErrores(Error) {
    var FechaActual = GetFechaActual();
    var HoraActual = getHoraActual();

    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }
    var logger = fs.createWriteStream(`./logs/log_${FechaActual}.txt`, {
      flags: 'a',
    });
    var DetalleError = dumpError(Error);
    logger.write(`${Error} ${DetalleError} ${FechaActual} - ${HoraActual}\n`);
  }
}

class QR {
  async existQRDB() {
    let vtt = false;
    const sqlSelectQR = `SELECT * FROM tbl_restandar WHERE EST_CCONSULTA = 'cmbQR'`;
    let [resultQR] = await connDB.promise().query(sqlSelectQR);
    if (resultQR.length === 0) {
      return vtt;
    } else {
      vtt = true;
      return vtt;
    }
  }
  async insertQR(qr) {
    let vtt = false,
      data = {
        EST_CCONSULTA: 'cmbQR',
        EST_CDETALLE: qr,
        EST_CDETALLE1: 'Por Sincronizar',
      };
    const sqlInsertQR = `INSERT INTO tbl_restandar SET ?`;
    let [resultInsertQR] = await connDB.promise().query(sqlInsertQR, data);
    return resultInsertQR;
  }
  async updateQR(qr) {
    let vtt = false,
      data = {
        EST_CCONSULTA: 'cmbQR',
        EST_CDETALLE: qr,
        EST_CDETALLE1: 'Por Sincronizar',
      };
    const sqlUpdateQR = `UPDATE tbl_restandar SET ? WHERE EST_CCONSULTA = 'cmbQR'`;
    let [resultUpdateQR] = await connDB.promise().query(sqlUpdateQR, data);
    return resultUpdateQR;
  }
  async updateQR2() {
    let vtt = false,
      data = {
        EST_CCONSULTA: 'cmbQR',
        EST_CDETALLE1: 'Sincronizado',
      };
    const sqlUpdateQR = `UPDATE tbl_restandar SET ? WHERE EST_CCONSULTA = 'cmbQR'`;
    let [resultUpdateQR] = await connDB.promise().query(sqlUpdateQR, data);
    console.log('Sincronizado');
    return resultUpdateQR;
  }
}

function GetFechaActual() {
  Mes = new Date().getMonth() + 1;
  if (Mes >= 1 && Mes < 10) {
    Mes = '0' + Mes.toString();
  }
  Dia = new Date().getDate();
  if (Dia >= 1 && Dia < 10) {
    Dia = '0' + Dia.toString();
  }
  var FechaActual = new Date().getFullYear() + '-' + Mes + '-' + Dia;
  return FechaActual;
}

function getHoraActual() {
  const HOY = new Date();
  const HORA = HOY.getHours();
  let MIN = HOY.getMinutes();
  MIN = MIN.toString().length === 1 ? `0${MIN}` : MIN;

  return `${HORA}:${MIN}`;
}

function dumpError(err) {
  if (typeof err === 'object') {
    if (err.message) {
      return ' Message: ' + err.message;
    }
    if (err.stack) {
      return err.stack;
    }
  } else {
    return 'dumpError :: El arcumento no es de tipo Objeto.';
  }
}

function ControlErrores(Error) {
  var FechaActual = GetFechaActual();
  var HoraActual = getHoraActual();

  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
  }
  var logger = fs.createWriteStream(`./logs/log_${FechaActual}.txt`, {
    flags: 'a',
  });
  var DetalleError = dumpError(Error);
  logger.write(`${Error} ${DetalleError} ${FechaActual} - ${HoraActual}\n`);
}

class Outbound {
  async porEnviar() {
    const selectOutbount = `SELECT * FROM ${DB}.tbl_outbount WHERE OUT_CDETALLE = 'POR ENVIAR' LIMIT 1`;
    let [resSelectOutbount] = await connDB.promise().query(selectOutbount);
    return resSelectOutbount[0];
  }
  async actualizar(idMsgOutbound) {
    const updateOutbount = `UPDATE ${DB}.tbl_outbount SET OUT_CDETALLE = 'ENVIADO' WHERE PKOUT_CODIGO = ?`;
    let [resUpdateOutbount] = await connDB.promise().query(updateOutbount, [idMsgOutbound]);
    return resUpdateOutbount;
  }
}

module.exports = { Gestion, Mensaje, Outbound, QR };
