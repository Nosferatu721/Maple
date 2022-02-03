const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { Client, Buttons, List } = require('whatsapp-web.js');
const mysql = require('mysql2');
const { database } = require('./keys');

let connDB = mysql.createConnection({
  host: database.host,
  user: database.user,
  database: database.database,
  password: database.password,
  dateStrings: true,
});

const DB = database.database;
const ARR_TEL_AUTORIZADOS = ['*573106542257', '573053599685', '573013775932']; // Lineas que aceptan comandos
const GUION_BOT = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'guionBot.json')));

const clientWP = new Client({
  puppeteer: {
    headless: false,
    executablePath: '/usr/bin/google-chrome',
  },
  authTimeoutMs: 3600000,
  clientId: 'sesion_mibot',
});

clientWP.initialize();

// * ===============================================
// * ====== [ EVENTOS ]
// * ===============================================

// * --- se genera código qr
clientWP.on('qr', (qr) => {
  // console.log('QR RECEIVED', qr);
  qrcode.generate(qr, { small: true });
});

// * --- cliente listo
clientWP.on('ready', () => {
  console.log(`${getFechaActual()} ${getHoraActual()} READY (cliente listo)`);

  // cuando WP web está ok se ejecuta lo de abajo (despues de 4 seg)
  setTimeout(() => {
    // empieza a vigilar Bot (varias funciones)
    recuVigilarBot();
    // verifica chats no leidos
    procesarMsgNoLeidos();
    // mensajes que el agente envia atravez de la web
    recuBotEnviaMsgAgente();
  }, 4000);
});

// * --- sesión exitosa en wp web
clientWP.on('authenticated', () => {
  console.log(`${getFechaActual()} ${getHoraActual()} AUTHENTICATED (sesión exitosa)`);
});

// * --- sesión no exitosa en wp web
clientWP.on('auth_failure', (msg) => {
  // Fired if session restore was unsuccessfull
  console.error(`${getFechaActual()} ${getHoraActual()} AUTHENTICATION FAILURE (sesión no exitosa)`, msg);
});

// * --- persona escribe a chat de bot
clientWP.on('message', (objMsg) => {
  // console.log(objMsg);
  procesarMsgPersona(objMsg);
});

// * ===============================================
// * ====== [ FUNCIONES ] Propias
// * ===============================================

function procesarMsgPersona(objMsg) {
  const MSG_PERSONA = limpiarMsgPersona(objMsg.body);
  const TIPO_MSG_PERSONA = objMsg.type;
  // console.log('MSG_PERSONA', MSG_PERSONA, 'TIPO_MSG_PERSONA', TIPO_MSG_PERSONA);
  const ID_PERSONA = objMsg.from; // 573106542257@c.us
  const TEL_PERSONA = ID_PERSONA.replace('@c.us', ''); // 573106542257

  // GES_CDETALLE: Nombre de la persona que se comunica
  // GES_CDETALLE1: Especialidad o consulta
  // GES_CDETALLE2: Nombre del paciente
  // GES_CDETALLE3: Parentesco de la persona que se comunica con el paciente
  // GES_CDETALLE4: ¿Ha tenido contacto con alguien covid positivo en los ultimos 14 días o ha tenido contacto estrecho?
  // GES_CDETALLE5: (vacio xD)
  // GES_CDETALLE6: EPS que remite la autorización
  // GES_CDETALLE7: Fecha de expedición de la autorización (formato: dd-mm-aaaa)
  // GES_CDETALLE8: Fecha de vencimiento o vigencia de la autorización (formato: dd-mm-aaaa)
  // GES_CSINTOMAS: JSON con los sintomas que tiene el paciente

  // info: Si la persona está dentro del array de telefonos autorizados no sigue el proceso normal, solo le llegan los mensajes exclusivos de desarrollador
  if (ARR_TEL_AUTORIZADOS.includes(TEL_PERSONA)) {
    // * ===== Comandos para desarrolladores
    switch (MSG_PERSONA) {
      case '!CHATS':
        clientWP.getChats().then((chats) => {
          objMsg.reply(`El bot tiene ${chats.length} chats abiertos`).then(() => {
            borrarChat(ID_PERSONA, 2500);
          });
        });
        break;

      case '!RBOT':
        const DELAY = 3200;
        objMsg
          .reply(`El bot se reiniciará. _Delay de ${DELAY}ms_`)
          .then(() => {
            setTimeout(() => {
              process.exit(1);
            }, DELAY);
          })
          .then(() => {
            borrarChat(ID_PERSONA, 2500);
          });
        break;

      case '!IBOT':
        const objInfo = clientWP.info;
        objMsg
          .reply(
            `
          ℹ️ *Información general*\n
          • *Nombre usuario (bot)*: ${objInfo.pushname}
          • *Plataforma SO*: ${objInfo.platform}
          • *Telefono bot*: ${objInfo.wid.user}
          `
          )
          .then(() => {
            borrarChat(ID_PERSONA);
          });
        break;

      case '!LISTA':
        const sectionsEjemplo = [{ title: 'title ejemplo', rows: [{ title: 'Opcion 1' }, { title: 'Opcion 2' }, { title: 'Opcion 3' }] }];
        const listaEjemplo = new List(`body lista`, 'title abrir lista', sectionsEjemplo);

        clientWP.sendMessage(ID_PERSONA, listaEjemplo).then(() => {
          borrarChat(ID_PERSONA);
        });
        break;

      case '!BOTON':
        // ! No funciona en beta!
        const btnEjemplo = new Buttons(`titulo botones`, [{ body: 'Si' }, { body: 'No' }], 'botones', 'mas botones');

        clientWP.sendMessage(ID_PERSONA, btnEjemplo).then(() => {
          borrarChat(ID_PERSONA);
        });
        break;

      default:
      // objMsg.reply('No entiendo tu mensaje de desarrollador').then(() => {
      //   borrarChat(ID_PERSONA);
      // });
    }
  } else {
    // * ===== Proceso normal para personas
    // 1. Busca a la persona en 'tbl_gestion'
    // notas: Si la persona existe en la bd con tal campo = tal entonces
    sql = `SELECT PKGES_CODIGO, GES_CULT_MSGBOT, FKGES_NPER_CODIGO, GES_ESTADO_CASO FROM ${DB}.tbl_gestion WHERE GES_NUMERO_COMUNICA = ?`;
    connDB
      .promise()
      .query(sql, [TEL_PERSONA])
      .then(([results]) => {
        if (results.length > 0) {
          // 1.1. La persona SI existe en 'tbl_gestion'
          const ULT_MSGBOT = results[0].GES_CULT_MSGBOT;
          const ESTADO_CASO = results[0].GES_ESTADO_CASO;
          const ID_AGENTE = results[0].FKGES_NPER_CODIGO;
          const PKGES_CODIGO = results[0].PKGES_CODIGO;

          switch (ULT_MSGBOT) {
            case 'MSG_SALUDO':
              if (TIPO_MSG_PERSONA === 'chat') {
                // guarda rta de 'saludoInicial' en DB -> (persona debe responder con el nombre)
                sql = `UPDATE ${DB}.tbl_gestion SET GES_CDETALLE = ? WHERE GES_NUMERO_COMUNICA = ?`;
                connDB
                  .promise()
                  .query(sql, [MSG_PERSONA, TEL_PERSONA])
                  .then(([results]) => {
                    if (results.affectedRows > 0) {
                      botHabla({ enviaMsg: 'MSG1', idPersona: ID_PERSONA, telPersona: TEL_PERSONA });
                    }
                  })
                  .catch((error) => console.log(error));
              } else {
                botHabla({ enviaMsg: 'MSG_NOMBRE', idPersona: ID_PERSONA, telPersona: TEL_PERSONA, msgExtra: '🤔 Lo siento no entendí tu respuesta\n\n' });
              }
              break;

            case 'MSG1':
              if (TIPO_MSG_PERSONA === 'chat') {
                // guarda rta de 'msg1' en DB -> (persona debe responder especialidad)
                sql = `UPDATE ${DB}.tbl_gestion SET GES_CDETALLE1 = ? WHERE GES_NUMERO_COMUNICA = ?`;
                connDB
                  .promise()
                  .query(sql, [MSG_PERSONA, TEL_PERSONA])
                  .then(([results]) => {
                    if (results.affectedRows > 0) {
                      botHabla({ enviaMsg: 'MSG2', idPersona: ID_PERSONA, telPersona: TEL_PERSONA });
                    }
                  })
                  .catch((error) => console.log(error));
              } else {
                botHabla({ enviaMsg: 'MSG1', idPersona: ID_PERSONA, telPersona: TEL_PERSONA, msgExtra: '🤔 Lo siento no entendí tu respuesta\n\n' });
              }
              break;

            case 'MSG2':
              if (TIPO_MSG_PERSONA === 'chat') {
                // guarda rta de 'msg2' en DB -> (persona debe responder nombre paciente)
                sql = `UPDATE ${DB}.tbl_gestion SET GES_CDETALLE2 = ? WHERE GES_NUMERO_COMUNICA = ?`;
                connDB
                  .promise()
                  .query(sql, [MSG_PERSONA, TEL_PERSONA])
                  .then(([results]) => {
                    if (results.affectedRows > 0) {
                      botHabla({ enviaMsg: 'MSG3', idPersona: ID_PERSONA, telPersona: TEL_PERSONA });
                    }
                  })
                  .catch((error) => console.log(error));
              } else {
                botHabla({ enviaMsg: 'MSG2', idPersona: ID_PERSONA, telPersona: TEL_PERSONA, msgExtra: '🤔 Lo siento no entendí tu respuesta\n\n' });
              }
              break;

            case 'MSG3':
              if (TIPO_MSG_PERSONA === 'chat') {
                // guarda rta de 'msg3' en DB -> (persona debe responder parentesco)
                sql = `UPDATE ${DB}.tbl_gestion SET GES_CDETALLE3 = ? WHERE GES_NUMERO_COMUNICA = ?`;
                connDB
                  .promise()
                  .query(sql, [MSG_PERSONA, TEL_PERSONA])
                  .then(([results]) => {
                    if (results.affectedRows > 0) {
                      botHabla({ enviaMsg: 'MSG4', idPersona: ID_PERSONA, telPersona: TEL_PERSONA });
                    }
                  })
                  .catch((error) => console.log(error));
              } else {
                botHabla({ enviaMsg: 'MSG3', idPersona: ID_PERSONA, telPersona: TEL_PERSONA, msgExtra: '🤔 Lo siento no entendí tu respuesta\n\n' });
              }
              break;

            case 'MSG4':
              // guarda rta de 'msg4' en DB -> (persona debe responder si tuvo contacto con COVID)
              if (MSG_PERSONA === 'SI' || MSG_PERSONA === 'NO') {
                let enviaMsg = MSG_PERSONA === 'NO' ? 'MSG5' : 'MSG_FINCOVID';

                sql = `UPDATE ${DB}.tbl_gestion SET GES_CDETALLE4 = ? WHERE GES_NUMERO_COMUNICA = ?`;
                connDB
                  .promise()
                  .query(sql, [MSG_PERSONA, TEL_PERSONA])
                  .then(([results]) => {
                    if (results.affectedRows > 0) {
                      botHabla({ enviaMsg, idPersona: ID_PERSONA, telPersona: TEL_PERSONA });
                    }
                  })
                  .catch((error) => console.log(error));
              } else {
                botHabla({ enviaMsg: 'MSG4', idPersona: ID_PERSONA, telPersona: TEL_PERSONA, msgExtra: '🤔 Lo siento no entendí tu respuesta\n\n' });
              }
              break;

            case 'MSG5':
              if (MSG_PERSONA === 'SI' || MSG_PERSONA === 'NO') {
                // guarda rta de 'msg5' en DB -> (persona debe responder Si/No)

                // 1. Traigo el JSON de respuestas de los sintomas de la DB
                sql = `SELECT GES_CSINTOMAS FROM ${DB}.tbl_gestion WHERE GES_NUMERO_COMUNICA = ?`;
                connDB
                  .promise()
                  .query(sql, [TEL_PERSONA])
                  .then(([results]) => {
                    const JSON_SINTOMASDB = results[0].GES_CSINTOMAS;

                    const TAMANO_JSON_SINTOMASDB = JSON_SINTOMASDB === null ? 0 : Object.keys(JSON_SINTOMASDB).length;

                    if (GUION_BOT.sintomas.length - 1 === TAMANO_JSON_SINTOMASDB) {
                      botHabla({ enviaMsg: 'MSG6', idPersona: ID_PERSONA, telPersona: TEL_PERSONA });
                    } else {
                      JSONParaGES_CSINTOMAS = JSON_SINTOMASDB === null ? {} : JSON_SINTOMASDB;
                      JSONParaGES_CSINTOMAS[GUION_BOT.sintomas[TAMANO_JSON_SINTOMASDB]] = `${MSG_PERSONA}`;
                      JSONParaGES_CSINTOMAS = JSON.stringify(JSONParaGES_CSINTOMAS);

                      sql = `UPDATE ${DB}.tbl_gestion SET GES_CSINTOMAS = ? WHERE GES_NUMERO_COMUNICA = ?`;
                      connDB
                        .promise()
                        .query(sql, [JSONParaGES_CSINTOMAS, TEL_PERSONA])
                        .then(([results]) => {
                          if (results.affectedRows > 0) {
                            botHabla({ enviaMsg: 'MSG5', idPersona: ID_PERSONA, telPersona: TEL_PERSONA });
                          }
                        })
                        .catch((error) => console.log(error));
                    }
                  });
              } else {
                botHabla({ enviaMsg: 'MSG5', idPersona: ID_PERSONA, telPersona: TEL_PERSONA, msgExtra: '🤔 Lo siento no entendí tu respuesta\n\n' });
              }
              break;

            case 'MSG6':
              if (TIPO_MSG_PERSONA === 'chat') {
                // guarda rta de 'msg6' en DB -> (persona debe responder eps)
                sql = `UPDATE ${DB}.tbl_gestion SET GES_CDETALLE6 = ? WHERE GES_NUMERO_COMUNICA = ?`;
                connDB
                  .promise()
                  .query(sql, [MSG_PERSONA, TEL_PERSONA])
                  .then(([results]) => {
                    if (results.affectedRows > 0) {
                      botHabla({ enviaMsg: 'MSG7', idPersona: ID_PERSONA, telPersona: TEL_PERSONA });
                    }
                  })
                  .catch((error) => console.log(error));
              } else {
                botHabla({ enviaMsg: 'MSG6', idPersona: ID_PERSONA, telPersona: TEL_PERSONA, msgExtra: '🤔 Lo siento no entendí tu respuesta\n\n' });
              }
              break;

            case 'MSG7':
              // guarda rta de 'msg7' en DB -> (persona debe responder fecha expedición)
              [dia, mes, ano] = MSG_PERSONA.split('-');

              if (!isNaN(new Date(`${mes}-${dia}-${ano}`))) {
                // * true: es fecha
                sql = `UPDATE ${DB}.tbl_gestion SET GES_CDETALLE7 = ? WHERE GES_NUMERO_COMUNICA = ?`;
                connDB
                  .promise()
                  .query(sql, [MSG_PERSONA, TEL_PERSONA])
                  .then(([results]) => {
                    if (results.affectedRows > 0) {
                      0;
                      botHabla({ enviaMsg: 'MSG8', idPersona: ID_PERSONA, telPersona: TEL_PERSONA });
                    }
                  })
                  .catch((error) => console.log(error));
              } else {
                // * false: no es fecha
                botHabla({ enviaMsg: 'MSG7', idPersona: ID_PERSONA, telPersona: TEL_PERSONA, msgExtra: '❗ Por favor ingresa una fecha valida\n\n' });
              }
              break;

            case 'MSG8':
              // guarda rta de 'msg8' en DB -> (persona debe responder fecha vencimiento)
              [dia, mes, ano] = MSG_PERSONA.split('-');

              if (!isNaN(new Date(`${mes}-${dia}-${ano}`))) {
                // * true: es fecha
                sql = `UPDATE ${DB}.tbl_gestion SET GES_CDETALLE8 = ? WHERE GES_NUMERO_COMUNICA = ?`;
                connDB
                  .promise()
                  .query(sql, [MSG_PERSONA, TEL_PERSONA])
                  .then(([results]) => {
                    if (results.affectedRows > 0) {
                      botHabla({ enviaMsg: 'MSG_ESPERE', idPersona: ID_PERSONA, telPersona: TEL_PERSONA });
                    }
                  })
                  .catch((error) => console.log(error));
              } else {
                // * false: no es fecha
                botHabla({ enviaMsg: 'MSG8', idPersona: ID_PERSONA, telPersona: TEL_PERSONA, msgExtra: '❗ Por favor ingresa una fecha valida\n\n' });
              }
              break;

            case 'MSG_FIN':
              // todo ¿esto mejor meterno en una función llamada procesarMsgChatAgente o algo así?
              // null: La persona no ha sido asignada a ningún agente
              // ABIERTO: La persona ha sido asgianada a un agente
              // CERRADO: La persona ya se le cerró su interacción (su caso), si vuelve a hablar se crea un nuevo registro ?? Otro arbol o nueva interacción con agente??
              if (ESTADO_CASO === null && ID_AGENTE === null) {
                botHabla({ enviaMsg: 'MSG_ESPERE', idPersona: ID_PERSONA, telPersona: TEL_PERSONA });
              }

              if (ESTADO_CASO === 'ABIERTO' && ID_AGENTE !== null) {
                let msgPersona = MSG_PERSONA.toLowerCase();
                msgPersona = msgPersona[0].toUpperCase() + msgPersona.slice(1); // primera letra a mayus y se le concatena el resto de la palabra
                // persona habla se guarda un registro nuevo en bd
                sql = `INSERT INTO ${DB}.tbl_mensajes_chat (FK_GES_CODIGO, MEN_ESTADO_MENSAJE, MEN_NUMERO_ORIGEN, MEN_TEXTO, MEN_TIPO_MENSAJE) VALUES (?,?,?,?,?)`;
                connDB
                  .promise()
                  .query(sql, [PKGES_CODIGO, 'RECIBIDO', TEL_PERSONA, msgPersona, TIPO_MSG_PERSONA])
                  .then(([results]) => {});
              }

              if (ESTADO_CASO === 'CERRADO' && ID_AGENTE !== null) {
              }

              break;

            case 'MSG_FINCOVID':
              // todo Ya que la persona se puede comunicar dentro de 20 días, entonces verficar la fecha de registro y si ya han pasado los 20 días
              // todo hacer que este registro se elimine o alguna mondá
              botHabla({ enviaMsg: 'MSG_FINCOVID', idPersona: ID_PERSONA, telPersona: TEL_PERSONA });

              break;
          }
        } else {
          // 1.2. La persona NO existe en 'tbl_gestion'
          botHabla({ enviaMsg: 'MSG_SALUDO', idPersona: ID_PERSONA, telPersona: TEL_PERSONA });
        }
      });
  }
}

async function procesarMsgNoLeidos() {
  // nota: La hice con async/await para hacer el código un poco más legible y corto
  let objMsgSinLeer = null;
  let arrObjMsgSinLeer = [];

  const arrChats = await clientWP.getChats();

  for (let objChat of arrChats) {
    if (objChat.unreadCount > 0) {
      objMsgSinLeer = await objChat.fetchMessages({ limit: objChat.unreadCount }); // devuelve un array (cada persona tiene un array de mensajes sin leer)
      objMsgSinLeer = objMsgSinLeer.pop();

      if (objMsgSinLeer.fromMe === false) {
        arrObjMsgSinLeer.push(objMsgSinLeer);
      }
    }
  }

  let cantMsgNoLeidos = arrObjMsgSinLeer.length;

  if (cantMsgNoLeidos > 0) {
    console.log(`${getFechaActual()} ${getHoraActual()} Mensajes no leidos (${cantMsgNoLeidos}) Recuperando...`);
    recuProcesarMsgNoLeidos(cantMsgNoLeidos, arrObjMsgSinLeer);
  }

  function recuProcesarMsgNoLeidos() {
    cantMsgNoLeidos--; // ↓↓ porque es para index de arrObjMsgSinLeer
    procesarMsgPersona(arrObjMsgSinLeer[cantMsgNoLeidos]);

    if (cantMsgNoLeidos === 0) {
      console.log(`${getFechaActual()} ${getHoraActual()} Se terminaron de procesar los mensajes no leidos`);
      return;
    }

    setTimeout(() => {
      recuProcesarMsgNoLeidos();
    }, 5000);
  }
}

function borrarChat(idPersona, delayDev = 4000) {
  // el chat no se borra para la persona, solo para el robot
  setTimeout(() => {
    clientWP.getChatById(idPersona).then((objChat) => {
      objChat.delete().then((deleteRes) => {
        if (deleteRes) {
          // console.log(`${getFechaActual()} ${getHoraActual()} Chat eliminado ${idPersona}`);
        } else {
          console.log(`${getFechaActual()} ${getHoraActual()} No se pudo eliminar chat ${idPersona}`);
        }
      });
    });
  }, delayDev);
}

function botHabla(objData) {
  // * bot envia mensaje por whatsapp
  // * se guarda registro en la DB de el ultimo mensaje que envió el bot
  // objDta = {
  //  enviaMsg: 'MSG1',
  //  idPersona: '573106542257@c.us',
  //  telPersona: '573106542257',
  //  msgExtra: 'Lo siento no entendí tu respuesta',
  //  sintoma: 'fiebre',
  //  msgChatweb: 'Lo que diga el agente',
  //  idMsgWeb: 123
  // };

  const MSG_EXTRA = objData.msgExtra || '';
  const MSG_CHATWEB = objData.msgChatweb || '';
  const ID_MSGWEB = objData.idMsgWeb || 0;

  switch (objData.enviaMsg) {
    case 'MSG_SALUDO':
      // -> Se envia mensaje inicial
      // -> Se inserta la persona en 'tbl_gestion'
      clientWP.sendMessage(objData.idPersona, GUION_BOT.saludoInicial).then(() => {
        sql = `INSERT INTO ${DB}.tbl_gestion (GES_NUMERO_COMUNICA, GES_CULT_MSGBOT) VALUES (?, ?)`;
        connDB
          .promise()
          .query(sql, [objData.telPersona, 'MSG_SALUDO'])
          .then(() => {
            console.log(`Nuevo registro en DB para persona [ ${objData.telPersona} ]`);
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'MSG_NOMBRE':
      // -> Este solo se usa en caso de que la persona haya respondido un mensaje diferente a tipo 'chat'
      // -> Solo pregunta la ultima parte del saludo = ¿Cual es su nombre?
      // -> Se inserta la persona en 'tbl_gestion'
      clientWP.sendMessage(objData.idPersona, GUION_BOT.preguntaNombre).then(() => {
        sql = `UPDATE ${DB}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ?`;
        connDB
          .promise()
          .query(sql, ['MSG_SALUDO', objData.telPersona])
          .then(() => {
            console.log(`${getFechaActual()} ${getHoraActual()} Nuevo registro en DB para persona [ ${objData.telPersona} ]`);
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'MSG1':
      clientWP.sendMessage(objData.idPersona, `${MSG_EXTRA}${GUION_BOT.msg1}`).then(() => {
        sql = `UPDATE ${DB}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ?`;
        connDB
          .promise()
          .query(sql, ['MSG1', objData.telPersona])
          .then(([results]) => {
            if (results.affectedRows > 0) {
            }
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'MSG2':
      clientWP.sendMessage(objData.idPersona, `${MSG_EXTRA}${GUION_BOT.msg2}`).then(() => {
        sql = `UPDATE ${DB}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ?`;
        connDB
          .promise()
          .query(sql, ['MSG2', objData.telPersona])
          .then(([results]) => {
            if (results.affectedRows > 0) {
            }
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'MSG3':
      clientWP.sendMessage(objData.idPersona, `${MSG_EXTRA}${GUION_BOT.msg3}`).then(() => {
        sql = `UPDATE ${DB}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ?`;
        connDB
          .promise()
          .query(sql, ['MSG3', objData.telPersona])
          .then(([results]) => {
            if (results.affectedRows > 0) {
            }
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'MSG4':
      // const btnContactoCOVID = new Buttons(`${MSG_EXTRA}${GUION_BOT.msg4}`, [{ body: 'Si' }, { body: 'No' }], '', `Por favor seleccione una opción`);

      const sectionsContactoCOVID = [{ title: 'Por favor seleccione una opción', rows: [{ title: 'Si' }, { title: 'No' }] }];
      const listaContactoCOVID = new List(`${MSG_EXTRA}${GUION_BOT.msg4}`, 'Por favor seleccione una opción', sectionsContactoCOVID);

      clientWP.sendMessage(objData.idPersona, listaContactoCOVID).then(() => {
        sql = `UPDATE ${DB}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ?`;
        connDB
          .promise()
          .query(sql, ['MSG4', objData.telPersona])
          .then(([results]) => {
            if (results.affectedRows > 0) {
            }
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'MSG5':
      sql = `SELECT GES_CSINTOMAS FROM ${DB}.tbl_gestion WHERE GES_NUMERO_COMUNICA = ?`;
      connDB
        .promise()
        .query(sql, [objData.telPersona])
        .then(([results]) => {
          const JSON_SINTOMASDB = results[0].GES_CSINTOMAS;
          const TAMANO_JSON_SINTOMASDB = JSON_SINTOMASDB === null ? 0 : Object.keys(JSON_SINTOMASDB).length; // Si no está en DB, se pone en 0
          const SINTOMA = limpiarSintomaGuion(GUION_BOT.sintomas[TAMANO_JSON_SINTOMASDB]);
          // const btnSintoma = new Buttons(`${MSG_EXTRA}¿${SINTOMA}?`, [{ body: 'Si' }, { body: 'No' }], '', 'Por favor seleccione una opción');

          const sectionsSintoma = [{ title: 'Por favor seleccione una opción', rows: [{ title: 'Si' }, { title: 'No' }] }];
          const listaSintoma = new List(`${MSG_EXTRA}¿${SINTOMA}?`, 'Por favor seleccione una opción', sectionsSintoma);

          if (JSON_SINTOMASDB === null) {
            // Si el JSON Sintomas no existe en DB, el bot envia el msg5 y seguido envia la pregunta del primer sintoma
            clientWP.sendMessage(objData.idPersona, `${MSG_EXTRA}${GUION_BOT.msg5}`).then(() => {
              // 1. Traigo el JSON de respuestas de los sintomas de la DB
              clientWP.sendMessage(objData.idPersona, listaSintoma).then(() => {
                sql = `UPDATE ${DB}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ?`;
                connDB
                  .promise()
                  .query(sql, ['MSG5', objData.telPersona])
                  .then(([results]) => {
                    if (results.affectedRows > 0) {
                    }
                  })
                  .catch((error) => console.log(error));
              });
            });
          } else {
            // Si el JSON Sintomas ya existe en DB, se envia solo el sintoma
            clientWP.sendMessage(objData.idPersona, listaSintoma).then(() => {
              sql = `UPDATE ${DB}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ?`;
              connDB
                .promise()
                .query(sql, ['MSG5', objData.telPersona])
                .then(([results]) => {
                  if (results.affectedRows > 0) {
                  }
                })
                .catch((error) => console.log(error));
            });
          }
        });
      break;

    case 'MSG6':
      clientWP.sendMessage(objData.idPersona, `${MSG_EXTRA}${GUION_BOT.msg6}`).then(() => {
        sql = `UPDATE ${DB}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ?`;
        connDB
          .promise()
          .query(sql, ['MSG6', objData.telPersona])
          .then(([results]) => {
            if (results.affectedRows > 0) {
            }
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'MSG7':
      clientWP.sendMessage(objData.idPersona, `${MSG_EXTRA}${GUION_BOT.msg7}`).then(() => {
        sql = `UPDATE ${DB}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ?`;
        connDB
          .promise()
          .query(sql, ['MSG7', objData.telPersona])
          .then(([results]) => {
            if (results.affectedRows > 0) {
            }
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'MSG8':
      clientWP.sendMessage(objData.idPersona, `${MSG_EXTRA}${GUION_BOT.msg8}`).then(() => {
        sql = `UPDATE ${DB}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ?`;
        connDB
          .promise()
          .query(sql, ['MSG8', objData.telPersona])
          .then(([results]) => {
            if (results.affectedRows > 0) {
            }
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'MSG_FINCOVID':
      clientWP.sendMessage(objData.idPersona, `${MSG_EXTRA}${GUION_BOT.msgFinCovid}`).then(() => {
        sql = `UPDATE ${DB}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ?`;
        connDB
          .promise()
          .query(sql, ['MSG_FINCOVID', objData.telPersona])
          .then(([results]) => {
            if (results.affectedRows > 0) {
            }
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'MSG_ESPERE':
      clientWP.sendMessage(objData.idPersona, `${MSG_EXTRA}${GUION_BOT.msgEspere}`).then(() => {
        sql = `UPDATE ${DB}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ?`;
        connDB
          .promise()
          .query(sql, ['MSG_FIN', objData.telPersona])
          .then(([results]) => {
            if (results.affectedRows > 0) {
            }
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'MSG_CHATWEB':
      clientWP.sendMessage(objData.idPersona, `${MSG_EXTRA}${MSG_CHATWEB}`).then(() => {
        sql = `UPDATE ${DB}.tbl_mensajes_chat SET MEN_ESTADO_MENSAJE = ? WHERE PKMEN_NCODIGO = ?`;
        connDB
          .promise()
          .query(sql, ['ENVIADO', ID_MSGWEB])
          .then(([results]) => {
            if (results.affectedRows > 0) {
            }
          })
          .catch((error) => console.log(error));
      });
      break;

    default:
      break;
  }
}

function limpiarMsgPersona(str) {
  if (typeof str === 'string') {
    str = str.trim();
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // quita tildes y otros caracteres raros
    str = str.toUpperCase(); // pasa a mayus

    return str;
  }

  return 'no_string';
}

function limpiarSintomaGuion(str) {
  if (typeof str === 'string') {
    str = str.toLowerCase();
    str = str.replace(/_/g, ' '); // reemplaza "_" por espacio
    str = str[0].toUpperCase() + str.slice(1); // Primera letra a mayus y se le concatena el resto de la palabra

    return str;
  }

  return 'no_string';
}

function recuVigilarBot() {
  // * Esta función recursiva tiene varias funciones que se ejecutan cada 30seg

  // --- Función 1
  // a las 5 : 58 a.m. aprox, finaliza el proceso (botwp.js)
  // hay un python vigilando para reiniciarlo cuando este finalice
  const hoy = new Date(),
    hora = hoy.getHours(),
    min = hoy.getMinutes(),
    sec = hoy.getSeconds(),
    between = sec >= 10 && sec <= 20;

  if (hora === 5 && min === 58 && between) {
    console.log(`\n[${hora}:${min}] Fin proceso de bot por node`);
    process.exit(1);
  }

  // --- Función 2
  borraUltimoChat();

  setTimeout(() => {
    recuVigilarBot();
  }, 30000); // cada 30 seg
}

function getFechaActual() {
  const HOY = new Date();
  const ARR_MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const MES = ARR_MESES[HOY.getMonth()];
  const DIA_MES = HOY.getDate();

  return `${DIA_MES}/${MES}`;
}

function getHoraActual() {
  const HOY = new Date();
  const HORA = HOY.getHours();
  let MIN = HOY.getMinutes();
  MIN = MIN.toString().length === 1 ? `0${MIN}` : MIN;

  return `${HORA}:${MIN}`;
}

function borraUltimoChat() {
  // si hay más de 10 chats, borra el más viejo
  // si hay 11 chats, borraria el chat #11 y deja de borrar cuando solo hayan 10 chats
  clientWP.getChats().then((arrChats) => {
    if (arrChats.length > 10) {
      const OBJ_ULT_CHAT = arrChats.pop();

      OBJ_ULT_CHAT.fetchMessages().then((objUltMsgChat) => {
        objUltMsgChat = objUltMsgChat.pop(); // ultimo mensaje del ultimo chat
        const ID_PERSONA = objUltMsgChat.to; // 573138850936@c.us

        // borra el ultimo mensaje independientemente si el ultimo hablante fue el bot o la persona
        // ya que al terminar un proceso, el bot ya deja de hablar a la persona y el ultimo msg sería de la persona
        // ! if (objUltMsgChat.id.fromMe === true) {
        borrarChat(ID_PERSONA);
        // ! }
      });
    }
  });
}

function recuBotEnviaMsgAgente() {
  // verifica si en la "tbl_mensajes_chat" hay mensajes con "POR ENVIAR"
  // si es así el bot coge el mensaje y lo envia por WP
  sql = `SELECT PKMEN_NCODIGO, FK_GES_CODIGO, MEN_ESTADO_MENSAJE, MEN_NUMERO_ORIGEN, MEN_NUMERO_DESTINO, MEN_TEXTO FROM ${DB}.tbl_mensajes_chat WHERE MEN_ESTADO_MENSAJE = ?`;
  connDB
    .promise()
    .query(sql, ['POR ENVIAR'])
    .then(([results]) => {
      if (results.length > 0) {
        const TEL_PERSONA = results[0].MEN_NUMERO_DESTINO;
        const ID_PERSONA = `${TEL_PERSONA}@c.us`;
        const ID_MSGWEB = results[0].PKMEN_NCODIGO;
        const MSG_CHATWEB = results[0].MEN_TEXTO;
        const FK_GES_CODIGO = results[0].FK_GES_CODIGO;

        // console.log(TEL_PERSONA, ID_PERSONA, ID_MSGWEB, MSG_CHATWEB);

        const TEXTO_REPETIDO = 'gracias por contactarnos nos estaremos viendo en proximas ocasiones';

        if (MSG_CHATWEB === TEXTO_REPETIDO) {
          sql = `SELECT COUNT(PKMEN_NCODIGO) AS CANT_REPETIDOS FROM ${DB}.tbl_mensajes_chat WHERE MEN_TEXTO = ? AND FK_GES_CODIGO = ?`;
          connDB
            .promise()
            .query(sql, [TEXTO_REPETIDO, FK_GES_CODIGO])
            .then(([results]) => {
              const CANT_REPETIDOS = results[0].CANT_REPETIDOS;

              if (CANT_REPETIDOS > 1) {
                sql = `DELETE FROM ${DB}.tbl_mensajes_chat WHERE PKMEN_NCODIGO = ?`;
                connDB
                  .promise()
                  .query(sql, [ID_MSGWEB])
                  .then(([results]) => {});
              } else {
                botHabla({ enviaMsg: 'MSG_CHATWEB', idPersona: ID_PERSONA, telPersona: TEL_PERSONA, idMsgWeb: ID_MSGWEB, msgChatweb: MSG_CHATWEB });
              }
            });
        } else {
          botHabla({ enviaMsg: 'MSG_CHATWEB', idPersona: ID_PERSONA, telPersona: TEL_PERSONA, idMsgWeb: ID_MSGWEB, msgChatweb: MSG_CHATWEB });
        }
      }

      // ! estar pendiente porque si "botHabla()" no lo cambia rapidamente a 'ENVIADO', se puede volver a enviar el mismo mensaje
      setTimeout(() => {
        recuBotEnviaMsgAgente();
      }, 2000);
    });
}
