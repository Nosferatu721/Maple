// * ====================
// * MODULOS ============
// * ====================

const { WAConnection, MessageType, MessageOptions, Mimetype, proto } = require('@adiwajshing/baileys');
const fs = require('fs');
const mysql2 = require('mysql2');
const { EnCrypt, DeCrypt } = require('./Class2');
const path = require('path');

// * ================================================
// * CONSTANTES Y VARIABLES GLOBALES ================
// * ================================================

const ARR_TEL_AUTORIZADOS = ['3106542257', '3053599685', '3013775932']; // Lineas que aceptan comandos

//Conexion a bases de datos
/* const IP_SERVIDOR = Class2.DeCrypt("5A6D526D416D5A6C5A7A486D416D5A6A5A7A486D416D57795A6D566D5A6A3D3D");
const USUARIO_SERVIDOR = Class2.DeCrypt("41775A324D77706D414A4C325A6D706C417A443D");
const CONTRASENA_SERVIDOR = Class2.DeCrypt("417770324147706D416D443242474D7A417A4832416D4C31417A48324147706C417752324C6D4C6D417A4C335A6D41755A6D566D5A515A6C5A6D4E3D");
const BD_SERVIDOR = Class2.DeCrypt("417744325A77706A41484C3341774C35416D56334151703141775232446D703241775A3241514C3541775232446A3D3D"); */

const IP_SERVIDOR = '172.70.7.23'; // 172.70.7.15
const USUARIO_SERVIDOR = 'cos_crm';
const CONTRASENA_SERVIDOR = 'gestiongeneralcos:2020';
const BD_SERVIDOR = 'dbp_whatsappreclutamiento';

const TEXTO_MSG_FIN1 = '😊 Gracias!\nEn breves instantes uno de nuestros psicólogos se contactaŕa contigo para continuar con el siguiente filtro de selección';
const TEXTO_MSG_FIN2 = 'ℹ️ Tu hoja de vida ya se encuentra en proceso de revisión. Te recomendamos estar atento a tus medios de contacto a la espera de nuestra comunicación';
const TEXTO_MSG_FIN3 = 'Si deseas conocer más ofertas nuestras puedes encontrarnos como *Group COS (Colombian Outsourcing Solutions)* en nuestras redes de trabajo.\nHasta la próxima 👋';
const TEXTO_MSG_DEFECTO = `👋😁 Hola!\n	Somos *Grupo COS Contac Center* (*Colombian Outsourcing Solutions*). Si deseas conocer más sobre nuestras ofertas y quieres vivir una experiencia diferente, envia tu hoja de vida a este chat 👉 https://wa.link/a1tmja. Contamos con toda la experiencia en el mercado para hacer realidad tu proyecto laboral.`;

/* const obj = {
	"IP_SERVIDOR": Class2.Encrypt("172.70.7.15"),
	"USUARIO_SERVIDOR": Class2.Encrypt("cos_crm"),
	"CONTRASENA_SERVIDOR": Class2.Encrypt("gestiongeneralcos:2020"),
	"BD_SERVIDOR": Class2.Encrypt("dbp_whatsappreclutamiento")
} */

let connDB = mysql2.createConnection({
  host: IP_SERVIDOR,
  user: USUARIO_SERVIDOR,
  password: CONTRASENA_SERVIDOR,
  database: BD_SERVIDOR,
});

// ? VARIABLES GLOBALES
let connWP; //Conexión Whatsapp
let nivelBateria = 'Desconocido';
let telBot = 'No obtenido aún';

async function connectToWhatsApp() {
  connWP = new WAConnection();

  // connWP.logger.level = 'debug'; Muestra más info

  // * =========================
  // * EVENTOS WP ==============
  // * =========================

  // ? Controlador de sesion de whatsapp web
  // Para no tener que escanear el QR de whatsapp cada vez que se inicie el robot

  // ! Aveces si la cuenta se loguea en otro dispositivo, esta conexión ya deja de servir, hacer que si ocurre ese error se borre este archivo json
  if (fs.existsSync('src/auth_info.json')) {
    connWP.loadAuthInfo('src/auth_info.json'); // cargará las credenciales del archivo JSON
  } else {
    connWP.on('open', (infoBotWP) => {
      // guardará las credenciales siempre que se actualicen
      console.log(`credentials updated!`);
      const authInfo = connWP.base64EncodedAuthInfo(); // obtiene toda la información de autenticación para restaurar esta sesión
      fs.writeFileSync('src/auth_info.json', JSON.stringify(authInfo, null, '\t')); // guarda esta información en un JSON
    });
  }

  // called when WA sends chats
  // this can take up to a few minutes if you have thousands of chats!
  // obtiene los mensajes no leidos, incluso los que envio yo pero que no los haya visto
  // * NOTA: Para que el mensaje del cliente no quede rezagado, al parecer mi bot le debe contestar (ι´Д｀)ﾉ
  connWP.on('chats-received', async ({ hasNewChats }) => {
    console.log(`you have ${connWP.chats.length} chats, new chats available: ${hasNewChats}`);

    const unread = await connWP.loadAllUnreadMessages();
    // console.log('No leidos', unread);
    console.log('you have ' + unread.length + ' unread messages');
    // console.log('mensaje', unread.message);
    let objMsgRezagados = {}; // no contestados por el bot (rezagados)

    // identifica los mensajes rezagados
    // llena el 'objMsgRezagados' solo con el ultimo mensaje que el aspirante dijo y que está rezagado
    unread.forEach((msg) => {
      // valida que sean los mensajes del aspirante y no del propio bot (false == son del aspirante)
      if (msg.key.fromMe === false) {
        objMsgRezagados[msg.key.remoteJid] = msg; // ultimo mensaje
      }
    });

    // const messages = await connWP.loadConversation(msg.key.remoteJid, 1);
    // const message = messages[0] // get the last message from this conversation
    // await connWP.forwardMessage()

    const tamanoObjMsgRezagados = Object.keys(objMsgRezagados).length;
    let n = 0;

    if (tamanoObjMsgRezagados === 0) {
      console.log('No hay mensajes rezagados');
    } else {
      console.log('Mensajes rezagados:', tamanoObjMsgRezagados);
      recursivaMensajesRezagados();
    }

    function recursivaMensajesRezagados() {
      const objLlave = Object.keys(objMsgRezagados)[n]; // metodo keys practicamente 'convierte' el objeto en un array entonces se puede traer cada key por posiciones (como un array indexado)

      const telAspirante = objMsgRezagados[objLlave].key.remoteJid.replace('@s.whatsapp.net', ''); // '573106542257'
      const tipoMensaje = Object.keys(objMsgRezagados[objLlave].message)[0];
      resAspirante = getResAspirante(tipoMensaje, objMsgRezagados[objLlave]);
      resAspirante = limpiarRespuesta(resAspirante);
      const chatId = objMsgRezagados[objLlave].key.remoteJid; // Persona que me habla | r: '573053599685@s.whatsapp.net'

      // console.log('telAspirante', telAspirante);
      // console.log('tipoMensaje', tipoMensaje);
      // console.log('resAspirante', resAspirante);
      // console.log('chatId', chatId);

      procesarRespuesta(telAspirante, tipoMensaje, resAspirante, chatId, objMsgRezagados[objLlave]);
      connWP.chatRead(chatId);
      n++;

      if (tamanoObjMsgRezagados > n) {
        setTimeout(() => {
          recursivaMensajesRezagados();
        }, 2000);
      }
    }
  });

  // called when WA sends chats
  // this can take up to a few minutes if you have thousands of contacts!
  connWP.on('contacts-received', () => {
    //console.log("you have " + Object.keys(connWP.contacts).length + " contacts");
  });

  connWP.on('qr', (qr) => {
    // Now, use the 'qr' string to display in QR UI or send somewhere
    // 'qr' es el string con el código
    console.log('mi qr', qr);
    //Este string del qr va a quedar guardado en la base de datos para que la pagina pueda acceder a el (Elkin transforma el string en qr)
    connDB
      .promise()
      .query(`UPDATE ${BD_SERVIDOR}.tbl_restandar SET EST_CDETALLE = ? WHERE EST_CCONSULTA = ? AND EST_CESTADO = ?`, [qr, 'ControlCodigoqr', 'Activo'])
      .then(([results, fields]) => {
        if (results.affectedRows > 0) {
          console.log('QR enviado a la base de datos');
        }
      })
      .catch((error) => console.log(error));
  });

  // * =======================================================
  // * (EVENTO WP) CADA QUE ALGUIEN LE HABLA AL BOT ==========
  // * =======================================================
  connWP.on('chat-update', (chatUpdate) => {
    // `chatUpdate` is a partial object, containing the updated properties of the chat
    // received a new message
    if (chatUpdate.messages && chatUpdate.count) {
      // * ===============================================
      // * VARIABLES Y CONSTANTES DE 'chat-update' =======
      // * ===============================================

      const objMessage = chatUpdate.messages.all()[0];
      //console.log('>>> objeto Mensaje:', objMessage);
      const telCliente = objMessage.key.remoteJid.substr(2, 10); // tel persona que me habla | r: 3106542257
      const tipoMensaje = Object.keys(objMessage.message)[0]; // identifica el tipo de mensaje
      console.log('\n >>> Tipo msg aspirante:', tipoMensaje);
      const chatId = objMessage.key.remoteJid; // Persona que me habla | r: '573053599685@s.whatsapp.net'
      const telAspirante = objMessage.key.remoteJid.replace('@s.whatsapp.net', ''); // tel persona que me habla con el indicativo de país | r: 573106542257
      console.log(`\nMe habla (chatId) ${chatId}`);
      let sql = null;
      let resAspirante = null;

      // ? Extraer el string del objMensaje para ser evaluado má adelante en los ifs
      resAspirante = getResAspirante(tipoMensaje, objMessage);
      // ? Limpieza de respuesta aspirante
      resAspirante = limpiarRespuesta(resAspirante);
      console.log(`Mensaje cliente (resAspirante) ${resAspirante}\n`);

      procesarRespuesta(telAspirante, tipoMensaje, resAspirante, chatId, objMessage);
      // * ===============================================
      // * Comandos para desarrolladores =================
      // * ===============================================

      // ? Mensaje informativo para desarrolladores
      if (ARR_TEL_AUTORIZADOS.includes(telCliente)) {
        let msgRes = null;
        const objRespuestas = {
          '!chats': `El bot tiene ${connWP.chats.length} chats abiertos`,
        };
        msgRes = objRespuestas[resAspirante];

        if (msgRes !== undefined) {
          connWP.sendMessage(chatId, msgRes, MessageType.text);
        }
      }
    }
  });

  // Evento para la batería
  connWP.on(`CB:action,,battery`, (json) => {
    // { value: '66', live: 'true', powersave: 'false' }
    const batteryLevelStr = json[2][0][1].value;
    const batterylevel = parseInt(batteryLevelStr);
    const isBatteryCharging = json[2][0][1].live;

    console.log(`Batería: ${batteryLevelStr}%`, `| ¿Está cargando?: ${isBatteryCharging}`);

    connDB
      .promise()
      .query(`UPDATE ${BD_SERVIDOR}.tbl_info_whatsapp SET WHA_CNIVEL_BATERIA = ?, WHA_CCARGANDO = ? WHERE WHA_CNUMERO_BOT = ? AND WHA_CESTADO = ?`, [batteryLevelStr, isBatteryCharging, telBot, 'Activo'])
      .then(([results, fields]) => {
        if (results.length > 0) {
          console.log(results);
        }
      })
      .catch((error) => console.log(error));
  });

  // * =========================
  // * CONEXIÓN A WP WEB ======
  // * =========================

  await connWP.connect().then(() => {
    // ? Se borra el código QR de la base de datos, ya que la conexión fué exitosa
    connDB
      .promise()
      .query(`UPDATE ${BD_SERVIDOR}.tbl_restandar SET EST_CDETALLE = ? WHERE EST_CCONSULTA = ? AND EST_CESTADO = ?`, [null, 'ControlCodigoqr', 'Activo'])
      .then(([results, fields]) => {
        if (results.affectedRows > 0) {
          console.log('¡Conexión exitosa! QR borrado de la base de datos');
        }
      })
      .catch((error) => console.log(error));

    // ? Con los datos de la conexión se crea la información del robot
    telBot = connWP.user.jid.substr(2, 10);
    let nombreBot = connWP.user.name;

    console.log('telBot', telBot);
    console.log('nombreBot', nombreBot);

    connDB
      .promise()
      .query(`SELECT WHA_CNUMERO_BOT FROM ${BD_SERVIDOR}.tbl_info_whatsapp WHERE WHA_CNUMERO_BOT = ? AND WHA_CESTADO = ?`, [telBot, 'Activo'])
      .then(([results, fields]) => {
        console.log(results);

        if (results.length > 0) {
          //Nada  (por ahora)
          console.log('INFO:', 'El robot ya se encuentra registrado en base de datos');
        } else {
          //Inserta el nuevo bot
          connDB
            .promise()
            .query(`INSERT INTO ${BD_SERVIDOR}.tbl_info_whatsapp (WHA_CNUMERO_BOT, WHA_CNOMBRE_BOT, WHA_CESTADO) VALUES (?, ?, ?)`, [telBot, nombreBot, 'Activo'])
            .then(([results, fields]) => {
              if (results.length > 0) {
                console.log('INFO:', `Se ha registrado el nuevo robot ${telBot} en la base de datos`);
              }
            })
            .catch((error) => console.log(error));
        }
      })
      .catch((error) => console.log(error));
  });
}

// * ===========================
// * FUNCIONES PROPIAS =========
// * ===========================

function enviarSpam() {
  let tiempoEspera = 0;
  let mensajeRecordatorio = '';
  let tiempoRecordatorio = '';

  // ? Consulta el tiempo de espera de la función recursiva que verifica si hay envio de mensajes masivos
  connDB
    .promise()
    .query(`SELECT EST_CDETALLE FROM ${BD_SERVIDOR}.tbl_restandar WHERE EST_CCONSULTA = ? AND EST_CESTADO = ? ORDER BY PKEST_NCODIGO ASC LIMIT 1`, ['ControlTiempoEspera', 'Activo'])
    .then(([results, fields]) => {
      if (results.length > 0) {
        tiempoEspera = parseInt(results[0].EST_CDETALLE, 10);
        console.log(results);
      }
    })
    .catch((error) => controlErrores(error));

  // ? Se busca en BD si hay mensajes con estado envio 'POR ENVIAR'
  // La función valida cada 3 segundos
  recursivaHayPorEnviarBD();

  function recursivaHayPorEnviarBD() {
    sql = `SELECT PKENV_NCODIGO, ENV_CBANNER, ENV_CNUMERO_DESTINO, ENV_CTEXTO_OFERTA, ENV_CTIPO_MASIVO, ENV_CMENSAJE FROM ${BD_SERVIDOR}.tbl_enviar_mensaje WHERE ENV_CESTADO_ENVIO = ? LIMIT 1`;
    connDB
      .promise()
      .query(sql, ['POR ENVIAR', 'Activo'])
      .then(([results, fields]) => {
        if (results.length > 0) {
          console.log('>> Envio de mensajes encontrado!');
          let chatId, msgRes, idEnvio;
          let cantRegistrosDB = results.length - 1;

          recursivaBotEnvioInicial(); // Recursiva hija

          function recursivaBotEnvioInicial(n = 0) {
            tipoMasivo = results[0].ENV_CTIPO_MASIVO;
            idEnvio = results[0].PKENV_NCODIGO;
            msgOferta = results[0].ENV_CTEXTO_OFERTA;
            chatId = `${results[0].ENV_CNUMERO_DESTINO}@s.whatsapp.net`; //Numero telefonico al que se le enviará el mensaje
            msgInicial = results[0].ENV_CMENSAJE;
            imgBanner = path.join('src', 'public', 'doc', 'img', results[0].ENV_CBANNER);
            imgMymetypeBD = imgBanner.split('.').pop();

            // * bot envia por wp -> imagen
            connWP
              .sendMessage(chatId, { url: imgBanner }, MessageType.image, { mimetype: Mimetype[imgMymetypeBD], caption: '¡Perfil de la oferta COS!' })
              .then(() => {
                console.log(`Se envió imagen a ${chatId}`);
              })
              .catch((e) => {
                console.log('>>> Error al enviar mensaje inicial (imagen) >>>', e);
              });

            if (tipoMasivo === 'ARBOL') {
              // * bot envia por wp -> mensaje y botones de confirmación
              const buttonsSiNoInicial = [
                { buttonId: 'id1', buttonText: { displayText: 'Si' }, type: 1 },
                { buttonId: 'id2', buttonText: { displayText: 'No' }, type: 1 },
              ];

              const btnMsgInicial = {
                contentText: `${msgInicial}\n\n*¿Deseas continuar con el proceso?*`,
                footerText: 'Elije una opción',
                buttons: buttonsSiNoInicial,
                headerType: 1,
              };

              connWP
                .sendMessage(chatId, btnMsgInicial, MessageType.buttonsMessage)
                .then((res) => {
                  connDB
                    .promise()
                    .query(`UPDATE ${BD_SERVIDOR}.tbl_enviar_mensaje set ENV_CESTADO_ENVIO = ? WHERE PKENV_NCODIGO = ? AND ENV_CESTADO = ?`, ['ENVIADO', idEnvio, 'Activo'])
                    .then((result) => {
                      if (result.affectedRows > 0) {
                        console.log(`Mensaje masivo actualizado a ENVIADO a ${chatId}`);
                      }
                    })
                    .catch((e) => {
                      console.log(`>>> Error al hacer update 'ENVIADO' a BD >>>`, e);
                    });
                  console.log(`El mensaje inicial se envió a ${chatId}`);
                })
                .catch((e) => {
                  console.log('>>> Error al enviar mensaje inicial (botones) >>>', e);
                });
            } else if (tipoMasivo === 'UNICO') {
              // * bot envia por wp -> mensaje unico
              connWP
                .sendMessage(chatId, `${msgInicial}`, MessageType.text)
                .then((res) => {
                  connDB
                    .promise()
                    .query(`UPDATE ${BD_SERVIDOR}.tbl_enviar_mensaje set ENV_CESTADO_ENVIO = ?, ENV_CESTADO = ? WHERE PKENV_NCODIGO = ? AND ENV_CESTADO = ?`, ['ENVIADO', 'Inactivo', idEnvio, 'Activo'])
                    .then((result) => {
                      if (result.affectedRows > 0) {
                        console.log(`Mensaje masivo unico enviado a ${chatId}`);
                      }
                    })
                    .catch((e) => {
                      console.log(`>>> Error al hacer update 'ENVIADO' a BD >>>`, e);
                    });
                })
                .catch((e) => {
                  console.log('Error al enviar mensaje unico', e);
                });
            }

            if (n == cantRegistrosDB) {
              setTimeout(() => {
                recursivaHayPorEnviarBD(); //Recursiva padre
              }, 5000); //10 Segundos (para que no enloquezca)
              return;
            }

            setTimeout(() => {
              return recursivaBotEnvioInicial(n + 1); //Recursiva hija
            }, 3000);
          }
        } else {
          // console.log('No hay data para enviar');
          setTimeout(() => {
            recursivaHayPorEnviarBD(); //Recursiva padre
          }, 5000); //10 Segundos (para que no enloquezca)
        }
      })
      .catch((error) => console.log(error));
  }
}

function procesarRespuesta(telAspirante, tipoMensaje, resAspirante, chatId, objMessage) {
  // 1. Node verifica si el aspirante que habla ya se ecuentra registrado en 'tbl_enviar_mensaje' (solo trae el registro más reciente y solo trae uno)
  sql = `SELECT PKENV_NCODIGO, ENV_CCOD_ENVIO, ENV_CESTADO_ENVIO, ENV_CTIPO_MASIVO, ENV_PSICOLOGOS FROM ${BD_SERVIDOR}.tbl_enviar_mensaje WHERE ENV_CNUMERO_DESTINO = ? AND ENV_CESTADO_ENVIO = ? ORDER BY ENV_CFECHA_MODIFICACION DESC LIMIT 1`;
  connDB
    .promise()
    .query(sql, [telAspirante, 'ENVIADO'])
    .then(([results, fields]) => {
      if (results.length > 0) {
        const COD_ENVIO = results[0].ENV_CCOD_ENVIO;
        const FKCOD_ENVIO = results[0].PKENV_NCODIGO;
        const LISTA_PSICOLOGOS = results[0].ENV_PSICOLOGOS;
        const TIPO_MASIVO = results[0].ENV_CTIPO_MASIVO;

        if (TIPO_MASIVO === 'ARBOL') {
          // 2. Node verifica cual es el mensaje en 'tbl_gestion' (solo trae el registro más reciente y solo trae uno)
          sql = `SELECT GES_NUMERO_COMUNICA FROM ${BD_SERVIDOR}.tbl_gestion WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? ORDER BY GES_CFECHA_MODIFICACION DESC LIMIT 1`;
          connDB
            .promise()
            .query(sql, [telAspirante, COD_ENVIO])
            .then(([results, fields]) => {
              if (results.length > 0) {
                // Si ya se encuentra en 'tbl_gestion' verificar en que parte de la conversación quedó (solo busca los 'Activos')
                sql = `SELECT * FROM ${BD_SERVIDOR}.tbl_gestion WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ? ORDER BY GES_CFECHA_MODIFICACION DESC LIMIT 1`;
                connDB
                  .promise()
                  .query(sql, [telAspirante, COD_ENVIO, 'Activo'])
                  .then(([results, fields]) => {
                    if (results.length > 0) {
                      // * =======================================================
                      // * VALIDACIÓN EN QUE PARTE DE LA CONVERSACIÓN QUEDÓ ======
                      // * =======================================================

                      // * PREGUNTAS o PASOS QUE HACE EL ROBOT
                      // PREG1  => Interesado en oferta | guarda rta en => GES_CDETALLE1 (r: Si/No)
                      // PREG2  => Que ciudad | guarda rta en => GES_CDETALLE2 (r: Ciudad)
                      // PREG3  => Tiene equipo? | guarda rta en => GES_CDETALLE3 (r: Si/No)
                      // PREG4  => Cuantas megas de internet? | guarda rta en => GES_CDETALLE4 (r: MB)
                      // PREG5  => Cuantas gigas de ram? | guarda rta en => GES_CDETALLE5 (r: GB)
                      // PREG6  => Desea participar en la oferta? | guarda rta en => GES_CDETALLE6 (r: Si/No)
                      // PREG7  => Cumple con el perfil? | guarda rta en => GES_CDETALLE7 (r: Si/No)
                      // PREG8  => Aquí guarda el nombre del archivo hoja de vida | guarda rta en => GES_CDETALLE8 (r: HV)
                      // PREG9  => En caso de que digan "No" en la pregunta 6, aqui se guarda la respuesta de ¿que te disgusta? | guarda rta en => GES_CDETALLE9 (r: )

                      const ULT_MSGBOT = results[0].GES_CULT_MSGBOT;

                      // ? switch => Cual fue la ultima pregunta que hizo el bot?
                      switch (ULT_MSGBOT) {
                        // si el usuario respondio algo diferente a "SI/NO" igual ya está en BD, eso quiere decir que ya lo atiende el switch
                        case 'MSG1': // Este caso es solo para la primera pregunta del bot
                          if (resAspirante == 'SI') {
                            sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CDETALLE1 = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
                            connDB
                              .promise()
                              .query(sql, [resAspirante, telAspirante, COD_ENVIO, 'Activo'])
                              .then(([results, fields]) => {
                                if (results.affectedRows > 0) {
                                  console.log('INFO ⓘ Aspirante interesado');
                                  // ? Se hace pregunta (2) de en que ciudad resides - Tipo lista
                                  botHabla({ paso: 'paso2', telAspirante, chatId, codEnvio: COD_ENVIO });
                                }
                              })
                              .catch((error) => console.log(error));
                          } else if (resAspirante == 'NO') {
                            // Pone todos los campos en N/A y envia mensaje de agradecimiento final
                            sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CDETALLE1 = ?, GES_CDETALLE2 = ?, GES_CDETALLE3 = ?, GES_CDETALLE4 = ?, GES_CDETALLE5 = ?, GES_CDETALLE6 = ?, GES_CDETALLE7 = ?, GES_CDETALLE8 = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
                            connDB
                              .promise()
                              .query(sql, [resAspirante, 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', telAspirante, COD_ENVIO, 'Activo'])
                              .then(([results, fields]) => {
                                if (results.affectedRows > 0) {
                                  console.log('INFO ⓘ Aspirante no sigue el proceso');

                                  // ? Envia mensaje final 3 - 'si deseas más ofertas tales...'
                                  botHabla({ paso: 'paso_fin', tipoMsgFin: 'MSG_FIN3', msgFin: TEXTO_MSG_FIN3, telAspirante, chatId, codEnvio: COD_ENVIO });
                                }
                              })
                              .catch((error) => console.log(error));
                          } else {
                            // Se le repite pregunta (1)
                            botHabla({ paso: 'paso1', telAspirante, chatId, msgExtra: '🤔 Lo siento no entendí tu respuesta\n\n', codEnvio: COD_ENVIO });
                          }

                          break;

                        case 'MSG2':
                          if (results[0].GES_CDETALLE1 == 'SI') {
                            // respuesta en BD de pregunta (1)

                            if (resAspirante === 'BARRANQUILLA' || resAspirante === 'BOGOTA' || resAspirante === 'MEDELLIN') {
                              // respuesta WP de aspirante a pregunta (2)
                              // guarda respuesta 2 en BD
                              sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CDETALLE2 = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
                              connDB
                                .promise()
                                .query(sql, [resAspirante, telAspirante, COD_ENVIO, 'Activo'])
                                .then(([results, fields]) => {
                                  if (results.affectedRows > 0) {
                                    console.log('INFO ⓘ Ciudad guardada en BD');

                                    // ? Pregunta (3) posee equipo propio - Tipo Botones
                                    botHabla({ paso: 'paso3', telAspirante, chatId, codEnvio: COD_ENVIO });
                                  }
                                })
                                .catch((error) => console.log(error));
                            } else if (resAspirante == 'NINGUNA DE LAS ANTERIORES') {
                              sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CDETALLE2 = ?, GES_CDETALLE3 = ?, GES_CDETALLE4 = ?, GES_CDETALLE5 = ?, GES_CDETALLE6 = ?, GES_CDETALLE7 = ?, GES_CDETALLE8 = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_CESTADO = ?`;
                              connDB
                                .promise()
                                .query(sql, [resAspirante, 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', telAspirante, 'Activo'])
                                .then(([results, fields]) => {
                                  if (results.affectedRows > 0) {
                                    console.log('INFO ⓘ Aspirante no sigue el proceso por ciudad');

                                    // ? Envia mensaje final 3 - 'si deseas más ofertas tales...'
                                    botHabla({ paso: 'paso_fin', tipoMsgFin: 'MSG_FIN3', msgFin: '\nHasta la próxima 👋', telAspirante, chatId, codEnvio: COD_ENVIO, msgExtra: 'Lo sentimos no nos encontramos en más ciudades.\n\n' });
                                  }
                                })
                                .catch((error) => console.log(error));
                            } else {
                              // No se entendió resAspirante (repite pregunta 2)
                              botHabla({ paso: 'paso2', telAspirante, chatId, codEnvio: COD_ENVIO, msgExtra: '🤔 Lo siento no entendí tu respuesta\n\n' });
                            }
                          }
                          break;

                        case 'MSG3':
                          const CIUDAD_DB = results[0].GES_CDETALLE2.trim();
                          if (CIUDAD_DB === 'BARRANQUILLA' || CIUDAD_DB === 'BOGOTA' || CIUDAD_DB === 'MEDELLIN') {
                            // respuesta en BD de pregunta (2)
                            if (resAspirante === 'SI') {
                              // respuesta en WP a pregunta (3)
                              // guarda respuesta (3) en BD
                              sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CDETALLE3 = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
                              connDB
                                .promise()
                                .query(sql, [resAspirante, telAspirante, COD_ENVIO, 'Activo'])
                                .then(([results, fields]) => {
                                  if (results.affectedRows > 0) {
                                    // ? Pregunta (4) Cuantas megas de internet
                                    botHabla({ paso: 'paso4', telAspirante, chatId, codEnvio: COD_ENVIO });
                                  }
                                })
                                .catch((error) => console.log(error));
                            } else if (resAspirante === 'NO') {
                              // guarda respuesta 3 en BD
                              sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CDETALLE3 = ?, GES_CDETALLE4 = ?, GES_CDETALLE5 = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
                              connDB
                                .promise()
                                .query(sql, [resAspirante, 'N/A', 'N/A', telAspirante, COD_ENVIO, 'Activo'])
                                .then(([results, fields]) => {
                                  if (results.affectedRows > 0) {
                                    // ? Pregunta (6) Desea participar en la oferta?
                                    botHabla({ paso: 'paso6', telAspirante, chatId, codEnvio: COD_ENVIO });
                                  }
                                })
                                .catch((error) => console.log(error));
                            } else {
                              botHabla({ paso: 'paso3', telAspirante, chatId, codEnvio: COD_ENVIO, msgExtra: '🤔 Lo siento no entendí tu respuesta\n\n' });
                            }
                          }
                          break;

                        case 'MSG4':
                          const EQUIPO_DB = results[0].GES_CDETALLE3.trim();
                          if (EQUIPO_DB === 'SI') {
                            // respuesta en BD de pregunta (3)
                            if (['10 MB', '20 MB', '40 MB', '60 MB O MAS'].includes(resAspirante) || resAspirante === 'NO TENGO INTERNET') {
                              // respuesta en WP a pregunta (4)
                              // guarda respuesta (4) en BD
                              sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CDETALLE4 = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
                              connDB
                                .promise()
                                .query(sql, [resAspirante, telAspirante, COD_ENVIO, 'Activo'])
                                .then(([results, fields]) => {
                                  if (results.affectedRows > 0) {
                                    // ? Pregunta (5) Cuanta ram tiene tu equipo
                                    botHabla({ paso: 'paso5', telAspirante, chatId, codEnvio: COD_ENVIO });
                                  }
                                })
                                .catch((error) => console.log(error));
                            } else {
                              botHabla({ paso: 'paso4', telAspirante, chatId, codEnvio: COD_ENVIO, msgExtra: '🤔 Lo siento no entendí tu respuesta\n\n' });
                            }
                          }
                          break;

                        case 'MSG5':
                          const MEGAS_INTERNET = results[0].GES_CDETALLE4.trim();
                          if (MEGAS_INTERNET.includes('MB') || MEGAS_INTERNET === 'NO TENGO INTERNET') {
                            // respuesta en BD de pregunta (4)

                            if (['4 GB', '6 GB', '8 GB', '12 GB O MAS'].includes(resAspirante)) {
                              // respuesta en WP a pregunta (5)
                              // guarda respuesta (5) en BD
                              sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CDETALLE5 = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
                              connDB
                                .promise()
                                .query(sql, [resAspirante, telAspirante, COD_ENVIO, 'Activo'])
                                .then(([results, fields]) => {
                                  if (results.affectedRows > 0) {
                                    // ? Pregunta (6) Desea participar en la oferta?
                                    botHabla({ paso: 'paso6', telAspirante, chatId, codEnvio: COD_ENVIO });
                                  }
                                })
                                .catch((error) => console.log(error));
                            } else {
                              botHabla({ paso: 'paso5', telAspirante, chatId, codEnvio: COD_ENVIO, msgExtra: '🤔 Lo siento no entendí tu respuesta\n\n' });
                            }
                          }
                          break;

                        case 'MSG6':
                          const RAM_DB = results[0].GES_CDETALLE5.trim();
                          if (RAM_DB.includes('GB') || RAM_DB === 'N/A') {
                            // respuesta en BD de pregunta (5)
                            if (resAspirante === 'SI') {
                              // respuesta en WP a pregunta (6)
                              // guarda respuesta (6) en BD
                              sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CDETALLE6 = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
                              connDB
                                .promise()
                                .query(sql, [resAspirante, telAspirante, COD_ENVIO, 'Activo'])
                                .then(([results, fields]) => {
                                  if (results.affectedRows > 0) {
                                    // ? Pregunta (7) Cumple con el perfil?
                                    botHabla({ paso: 'paso7', telAspirante, chatId, codEnvio: COD_ENVIO });
                                  }
                                })
                                .catch((error) => console.log(error));
                            } else if (resAspirante === 'NO') {
                              // guarda respuesta (6) en BD
                              sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CDETALLE6 = ?, GES_CDETALLE7 = ?, GES_CDETALLE8 = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
                              connDB
                                .promise()
                                .query(sql, [resAspirante, 'N/A', 'N/A', telAspirante, COD_ENVIO, 'Activo'])
                                .then(([results, fields]) => {
                                  if (results.affectedRows > 0) {
                                    // ? Pregunta (9) ¿Que te disgusta de la oferta?
                                    botHabla({ paso: 'paso9', telAspirante, chatId, codEnvio: COD_ENVIO });
                                  }
                                })
                                .catch((error) => console.log(error));
                            } else {
                              botHabla({ paso: 'paso6', telAspirante, chatId, codEnvio: COD_ENVIO, msgExtra: '🤔 Lo siento no entendí tu respuesta\n\n' });
                            }
                          }
                          break;

                        case 'MSG7':
                          const PARTICIPA = results[0].GES_CDETALLE6.trim();
                          if (PARTICIPA === 'SI') {
                            // respuesta en BD de pregunta (6)
                            if (resAspirante === 'SI' || resAspirante === 'NO') {
                              // respuesta en WP a pregunta (7)
                              // guarda respuesta (7) en BD
                              sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CDETALLE7 = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
                              connDB
                                .promise()
                                .query(sql, [resAspirante, telAspirante, COD_ENVIO, 'Activo'])
                                .then(([results, fields]) => {
                                  if (results.affectedRows > 0) {
                                    if (resAspirante === 'SI') {
                                      // ? Pregunta (8) Adjunta hoja de vida
                                      botHabla({ paso: 'paso8', telAspirante, chatId, codEnvio: COD_ENVIO });
                                    }

                                    if (resAspirante === 'NO') {
                                      // Aquí envia un mensaje el bot, diciendo que gracias y puedes encontrarnos en bla bla
                                      // ? Envia mensaje de agradecimiento al aspirante que se negó
                                      botHabla({ paso: 'paso_fin', tipoMsgFin: 'MSG_FIN3', msgFin: TEXTO_MSG_FIN3, telAspirante, chatId, codEnvio: COD_ENVIO });
                                    }
                                  }
                                })
                                .catch((error) => console.log(error));
                            } else {
                              botHabla({ paso: 'paso7', telAspirante, chatId, codEnvio: COD_ENVIO, msgExtra: '🤔 Lo siento no entendí tu respuesta\n\n' });
                            }
                          }
                          break;

                        case 'MSG8':
                          const CUMPLE_PERFIL = results[0].GES_CDETALLE7.trim();
                          if (CUMPLE_PERFIL == 'SI') {
                            // respuesta en BD de pregunta (7)

                            if (tipoMensaje === 'documentMessage') {
                              console.log('mimetype?:', objMessage.message.documentMessage.mimetype);

                              const mimeDocAspirante = objMessage.message.documentMessage.mimetype.trim();
                              const mimePDF = 'application/pdf';
                              const mimeDOC = 'application/msword';
                              const mimeDOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                              const mimeODT = 'application/vnd.oasis.opendocument.text';

                              const arrMimesAdmitidos = [mimePDF, mimeDOC, mimeDOCX, mimeODT];

                              if (arrMimesAdmitidos.includes(mimeDocAspirante)) {
                                const ARCHIVO_HV = `hv_${FKCOD_ENVIO}_${telAspirante}`;
                                const RUTA_HV = path.join('src', 'public', 'doc', 'hv', ARCHIVO_HV);

                                // ? Descarga hoja de vida que envia la persona y lo guarda en el servidor
                                connWP.downloadMediaMessage(objMessage).then((res) => {
                                  savedFilename = connWP.downloadAndSaveMediaMessage(objMessage, RUTA_HV);
                                  console.log(`Archivo obtenido :${objMessage.key.remoteJid}, guardado en: ${savedFilename}`);

                                  // guarda respuesta (8) en BD (nombre del archivo)
                                  sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CDETALLE8 = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
                                  connDB
                                    .promise()
                                    .query(sql, [ARCHIVO_HV, telAspirante, COD_ENVIO, 'Activo'])
                                    .then(([results, fields]) => {
                                      if (results.affectedRows > 0) {
                                        // ? Envia mensaje final 1 - 'uno de nuestro psci...
                                        botHabla({ paso: 'paso_fin', tipoMsgFin: 'MSG_FIN1', msgFin: TEXTO_MSG_FIN1, telAspirante, chatId, codEnvio: COD_ENVIO });
                                      }
                                    });
                                });
                              } else {
                                botHabla({ paso: 'paso8', telAspirante, chatId, codEnvio: COD_ENVIO, msgExtra: '❕ Solo se admiten archivos de tipo *PDF* o *WORD*\n\n' });
                              }
                            } else {
                              botHabla({ paso: 'paso8', telAspirante, chatId, codEnvio: COD_ENVIO, msgExtra: '❕ Solo se admiten archivos de tipo *PDF* o *WORD*\n\n' });
                            }
                          }
                          break;

                        case 'MSG9':
                          if (results[0].GES_CDETALLE8.trim() != null) {
                            if (tipoMensaje === 'conversation' || tipoMensaje === 'extendedTextMessage') {
                              // guarda respuesta (9) en BD
                              sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CDETALLE9 = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
                              connDB
                                .promise()
                                .query(sql, [resAspirante, telAspirante, COD_ENVIO, 'Activo'])
                                .then(([results, fields]) => {
                                  if (results.affectedRows > 0) {
                                    // ? Bot envia mensaje final 3
                                    botHabla({ paso: 'paso_fin', tipoMsgFin: 'MSG_FIN3', msgFin: TEXTO_MSG_FIN3, telAspirante, chatId, codEnvio: COD_ENVIO });
                                  }
                                })
                                .catch((error) => console.log(error));
                            } else {
                              // ? Pregunta (9) ¿Que te disgusta de la oferta?
                              botHabla({ paso: 'paso9', telAspirante, chatId, codEnvio: COD_ENVIO, msgExtra: '❕ Solo se admite texto\n\n' });
                            }
                          }
                          break;

                        case 'MSG_FIN1':
                        case 'MSG_FIN2':
                          if (results[0].GES_CDETALLE8.trim() != null) {
                            // ? Envia mensaje final 2 - 'tu hoja de vida ya tales...'
                            botHabla({ paso: 'paso_fin', tipoMsgFin: 'MSG_FIN2', msgFin: TEXTO_MSG_FIN2, telAspirante, chatId, codEnvio: COD_ENVIO });
                          }
                          break;

                        default:
                          break;
                      }
                    } else {
                      console.log(`${telAspirante} Al parecer es un aspirante que ya está Inactivo`);
                    }
                  });
              } else {
                // Si no se se encuentra en tbl_gestion, significa que es el primer mensaje que el aspirante envia al bot.
                // Se hace el primer registro en tbl_gestion

                // ? Respuesta pregunta (1)
                if (resAspirante === 'SI') {
                  sql = `INSERT INTO ${BD_SERVIDOR}.tbl_gestion (GES_NENV_CODIGO, FKGES_NENV_CODIGO, GES_NUMERO_COMUNICA, GES_CULT_MSGBOT, GES_CDETALLE1, GES_CDETALLE10, GES_CESTADO) VALUES (?,?,?,?,?,?,?)`;
                  connDB
                    .promise()
                    .query(sql, [COD_ENVIO, FKCOD_ENVIO, telAspirante, 'MSG1', resAspirante, LISTA_PSICOLOGOS, 'Activo'])
                    .then(([results, fields]) => {
                      if (results.affectedRows > 0) {
                        console.log('INFO:', `Se ha registrado una nueva conversación con el usuario ${telAspirante} en la base de datos`);

                        // ? Se hace pregunta (2) de en que ciudad resides - Tipo lista
                        botHabla({ paso: 'paso2', telAspirante, chatId, codEnvio: COD_ENVIO });
                      }
                    })
                    .catch((error) => console.log(error));
                } else if (resAspirante === 'NO') {
                  // Pone todos los campos en N/A y envia mensaje de agradecimiento final
                  sql = `INSERT INTO ${BD_SERVIDOR}.tbl_gestion (GES_NENV_CODIGO, FKGES_NENV_CODIGO, GES_NUMERO_COMUNICA, GES_CDETALLE1, GES_CDETALLE2, GES_CDETALLE3, GES_CDETALLE4, GES_CDETALLE5, GES_CDETALLE6, GES_CDETALLE7, GES_CDETALLE8, GES_CDETALLE10, GES_CESTADO) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
                  connDB
                    .promise()
                    .query(sql, [COD_ENVIO, FKCOD_ENVIO, telAspirante, resAspirante, 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', LISTA_PSICOLOGOS, 'Activo'])
                    .then(([results, fields]) => {
                      if (results.affectedRows > 0) {
                        console.log('INFO ⓘ Aspirante no sigue el proceso');

                        // ? Envia mensaje de agradecimiento al aspirante que se negó
                        botHabla({ paso: 'paso_fin', tipoMsgFin: 'MSG_FIN3', msgFin: TEXTO_MSG_FIN3, telAspirante, chatId, codEnvio: COD_ENVIO });
                      }
                    })
                    .catch((error) => console.log(error));
                } else {
                  // si responde algo diferente a si o no, igual se agrega la conversación nueva a BD pero no se guarda su respuesta (GES_CDETALLE1 = NULL)
                  sql = `INSERT INTO ${BD_SERVIDOR}.tbl_gestion (GES_NENV_CODIGO, FKGES_NENV_CODIGO, GES_NUMERO_COMUNICA, GES_CULT_MSGBOT, GES_CDETALLE10, GES_CESTADO) VALUES (?,?,?,?,?,?)`;
                  connDB
                    .promise()
                    .query(sql, [COD_ENVIO, FKCOD_ENVIO, telAspirante, 'MSG1', LISTA_PSICOLOGOS, 'Activo'])
                    .then(([results, fields]) => {
                      if (results.affectedRows > 0) {
                        console.log('INFO:', `Se ha registrado una nueva conversación con el usuario ${telAspirante} en la base de datos`);

                        // ? Se hace pregunta (1) de nuevo
                        botHabla({ paso: 'paso1', telAspirante, chatId, msgExtra: '🤔 Lo siento no entendí tu respuesta\n\n' });
                      }
                    })
                    .catch((error) => console.log(error));
                }
              }
            })
            .catch((error) => console.log(error));
        }
      } else {
        // ? ==================================================================================
        // ? Se le envia mensaje por defecto si no se encuentra en 'tbl_enviar_mensaje' =======
        // ? ==================================================================================

        const rutaImgQR = path.join('src', 'public', 'doc', 'img', 'qr-chat.png');
        connWP.sendMessage(chatId, TEXTO_MSG_DEFECTO, MessageType.text).then(() => {
          connWP
            .sendMessage(
              chatId,
              // fs.readFileSync(rutaImgQR), // load a image and send it
              { url: rutaImgQR },
              MessageType.image,
              { mimetype: Mimetype.png, caption: 'También puedes escanear el código QR para ingresar al chat!' }
            )
            .then(() => {
              // marca el mensaje como leído
              connWP.chatRead(chatId);
            })
            .catch((e) => {
              console.log('>>> Error al enviar img QR', e);
            });

          console.log(`Mensaje a persona desconocida enviado ${chatId}`);
        });
      }
    })
    .catch((error) => console.log(error));
}

function botHabla(objData) {
  // ? ObjData luce algo así:
  // objData = {
  // chatId: 573053599685@s.whatsapp.net
  // 	paso: 'paso1',
  // tipoMsgFin: 'MSG_FIN1'
  // 	msgFin: 'Adios, nos vemos'
  // 	msgExtra: 'Lo sentimos bla bla',
  // 	telAspirante: 3106542257,
  // 	codEnvio: 23
  // }

  // En caso de que no vengan en los parámetros
  if (objData.msgExtra === undefined) {
    objData.msgExtra = '';
  }

  switch (objData.paso) {
    case 'paso1':
      // Esta pregunta inicial no se puede meter aquí ya que es diferente a las demás
      // Esta primero consulta si el número del aspirante está en 'tbl_enviar_msg' (lo cual solo se hace la 1ra vez)
      // Luego hace una consulta de los datos del envio masivo para así poder enviar el primer mensaje y guardarlo en 'tbl_gestion' (lo cual solo se hace la 1ra vez)
      // Entonces reciclar esta pregunta es un complique

      // * --- Por eso la recliclo parcialmente

      const buttonsSiNoInicial = [
        { buttonId: 'id1', buttonText: { displayText: 'Si' }, type: 1 },
        { buttonId: 'id2', buttonText: { displayText: 'No' }, type: 1 },
      ];

      const btnMsgInicial = {
        contentText: `${objData.msgExtra}*¿Deseas continuar con el proceso?*`,
        footerText: 'Elije una opción',
        buttons: buttonsSiNoInicial,
        headerType: 1,
      };

      connWP.sendMessage(objData.chatId, btnMsgInicial, MessageType.buttonsMessage).then(() => {
        sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
        connDB
          .promise()
          .query(sql, ['MSG1', objData.telAspirante, objData.codEnvio, 'Activo'])
          .then(([results, fields]) => {
            if (results.affectedRows > 0) {
              console.log('ACTUALIZÓ CON MSG1');
            }
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'paso2':
      //Creación de lista
      const rowsCiudades = [
        { title: 'Barranquilla', description: '', rowId: 'rowid1' },
        { title: 'Bogotá', description: '', rowId: 'rowid2' },
        { title: 'Medellín', description: '', rowId: 'rowid3' },
        { title: 'Ninguna de las anteriores', description: '', rowId: 'rowid4' },
      ];

      const sectionsCiudades = [{ title: '¿En qué ciudad resides?', rows: rowsCiudades }];

      const btnListaCiudades = {
        buttonText: 'Clic para elegir',
        description: `${objData.msgExtra}🏙️ *¿En qué ciudad resides?*`,
        sections: sectionsCiudades,
        listType: 1,
      };

      connWP.sendMessage(objData.chatId, btnListaCiudades, MessageType.listMessage).then(() => {
        sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
        connDB
          .promise()
          .query(sql, ['MSG2', objData.telAspirante, objData.codEnvio, 'Activo'])
          .then(([results, fields]) => {
            if (results.affectedRows > 0) {
              console.log('ACTUALIZÓ CON MSG2');
            }
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'paso3':
      // send a buttons message!
      const btnsSiNoPoseePC = [
        { buttonId: 'id1', buttonText: { displayText: 'Si' }, type: 1 },
        { buttonId: 'id2', buttonText: { displayText: 'No' }, type: 1 },
      ];

      const btnMsgPoseePC = {
        contentText: `${objData.msgExtra}🖥️ *¿Posee computador propio?*`,
        footerText: 'Elije una opción',
        buttons: btnsSiNoPoseePC,
        headerType: 1,
      };

      connWP
        .sendMessage(objData.chatId, btnMsgPoseePC, MessageType.buttonsMessage) //R: Promesa
        .then(() => {
          sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
          connDB
            .promise()
            .query(sql, ['MSG3', objData.telAspirante, objData.codEnvio, 'Activo'])
            .then(([results, fields]) => {
              if (results.affectedRows > 0) {
              }
            })
            .catch((error) => console.log(error));
        });
      break;

    case 'paso4':
      //Creación de MEGAS internet
      const rowsInternet = [
        { title: 'No tengo internet', description: '', rowId: 'rowid1' },
        { title: '10 MB', description: '', rowId: 'rowid2' },
        { title: '20 MB', description: '', rowId: 'rowid3' },
        { title: '40 MB', description: '', rowId: 'rowid4' },
        { title: '60 MB o más', description: '', rowId: 'rowid4' },
      ];

      const sectionsInternet = [{ title: '¿Cuantas MB de internet tienes en tu hogar?', rows: rowsInternet }];

      const btnListaInternet = {
        buttonText: 'Clic para elegir',
        description: `${objData.msgExtra}🌐 *¿Cuantos MB de internet tienes en tu hogar?*`,
        sections: sectionsInternet,
        listType: 1,
      };

      connWP.sendMessage(objData.chatId, btnListaInternet, MessageType.listMessage).then(() => {
        sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
        connDB
          .promise()
          .query(sql, ['MSG4', objData.telAspirante, objData.codEnvio, 'Activo'])
          .then(([results, fields]) => {
            if (results.affectedRows > 0) {
            }
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'paso5':
      //Creación de lista RAM internet
      const rowsRam = [
        { title: '4 GB', description: '', rowId: 'rowid1' },
        { title: '6 GB', description: '', rowId: 'rowid2' },
        { title: '8 GB', description: '', rowId: 'rowid3' },
        { title: '12 GB o más', description: '', rowId: 'rowid4' },
      ];

      const sectionsRam = [{ title: '¿Cuanta RAM posee su computador?', rows: rowsRam }];

      const btnListaRam = {
        buttonText: 'Clic para elegir',
        description: `${objData.msgExtra}💻 *¿Cuanta RAM posee su computador?*`,
        sections: sectionsRam,
        listType: 1,
      };

      connWP.sendMessage(objData.chatId, btnListaRam, MessageType.listMessage).then(() => {
        sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
        connDB
          .promise()
          .query(sql, ['MSG5', objData.telAspirante, objData.codEnvio, 'Activo'])
          .then(([results, fields]) => {
            if (results.affectedRows > 0) {
            }
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'paso6':
      sql = `SELECT ENV_CTEXTO_OFERTA FROM ${BD_SERVIDOR}.tbl_enviar_mensaje WHERE ENV_CNUMERO_DESTINO = ? AND ENV_CESTADO = ?`;
      connDB
        .promise()
        .query(sql, [objData.telAspirante, 'Activo'])
        .then(([results, fields]) => {
          if (results.length > 0) {
            const textoOferta = results[0].ENV_CTEXTO_OFERTA;

            // send a buttons message!
            const btnsSinoOferta = [
              { buttonId: 'id1', buttonText: { displayText: 'Si' }, type: 1 },
              { buttonId: 'id2', buttonText: { displayText: 'No' }, type: 1 },
            ];

            const btnMsgOferta = {
              contentText: `${objData.msgExtra}📄 *Descripción:* \n${textoOferta} \n👔 *¿Deseas participar en la oferta?*`,
              footerText: 'Elije una opción',
              buttons: btnsSinoOferta,
              headerType: 1,
            };

            connWP.sendMessage(objData.chatId, btnMsgOferta, MessageType.buttonsMessage).then(() => {
              sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
              connDB
                .promise()
                .query(sql, ['MSG6', objData.telAspirante, objData.codEnvio, 'Activo'])
                .then(([results, fields]) => {
                  if (results.affectedRows > 0) {
                  }
                })
                .catch((error) => console.log(error));
            });
          }
        });
      break;

    case 'paso7':
      // send a buttons message!
      const btnsSiNoPerfil = [
        { buttonId: 'id1', buttonText: { displayText: 'Si' }, type: 1 },
        { buttonId: 'id2', buttonText: { displayText: 'No' }, type: 1 },
      ];

      const btnMsgPerfil = {
        contentText: `${objData.msgExtra}❓ ¿Cumples con el perfil descrito en la oferta laboral?`,
        footerText: 'Elije una opción',
        buttons: btnsSiNoPerfil,
        headerType: 1,
      };

      connWP.sendMessage(objData.chatId, btnMsgPerfil, MessageType.buttonsMessage).then(() => {
        sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
        connDB
          .promise()
          .query(sql, ['MSG7', objData.telAspirante, objData.codEnvio, 'Activo'])
          .then(([results, fields]) => {
            if (results.affectedRows > 0) {
            }
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'paso8':
      connWP.sendMessage(objData.chatId, `${objData.msgExtra}📄 Por favor adjunta hoja de vida actualizada`, MessageType.text).then(() => {
        sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
        connDB
          .promise()
          .query(sql, ['MSG8', objData.telAspirante, objData.codEnvio, 'Activo'])
          .then(([results, fields]) => {
            if (results.affectedRows > 0) {
            }
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'paso9':
      connWP.sendMessage(objData.chatId, `${objData.msgExtra}🤔 ¿Puedes contarnos qué te disgusta de la oferta laboral?`, MessageType.text).then(() => {
        sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CULT_MSGBOT = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
        connDB
          .promise()
          .query(sql, ['MSG9', objData.telAspirante, objData.codEnvio, 'Activo'])
          .then(([results, fields]) => {
            if (results.affectedRows > 0) {
            }
          })
          .catch((error) => console.log(error));
      });
      break;

    case 'paso_fin':
      connWP.sendMessage(objData.chatId, `${objData.msgExtra}${objData.msgFin}`, MessageType.text).then(() => {
        const TIPO_MSG_FIN = objData.tipoMsgFin;
        let estadoNuevo = null;
        if (TIPO_MSG_FIN === 'MSG_FIN2' || TIPO_MSG_FIN === 'MSG_FIN3') {
          estadoNuevo = 'Inactivo';

          // inactiva el registro del envio
          sql = `UPDATE ${BD_SERVIDOR}.tbl_enviar_mensaje SET ENV_CESTADO = ? WHERE ENV_CNUMERO_DESTINO = ? AND ENV_CCOD_ENVIO = ? AND ENV_CESTADO = ?`;
          connDB
            .promise()
            .query(sql, [estadoNuevo, objData.telAspirante, objData.codEnvio, 'Activo'])
            .then(([results, fields]) => {
              if (results.affectedRows > 0) {
              }
            })
            .catch((error) => console.log(error));
        } else {
          estadoNuevo = 'Activo';
        }

        gestionar = TIPO_MSG_FIN === 'MSG_FIN3' ? 'N/A' : 'POR GESTIONAR';

        // update del ultimo msg bot y en caso dado inactivación
        sql = `UPDATE ${BD_SERVIDOR}.tbl_gestion SET GES_CULT_MSGBOT = ?, GES_CDETALLE12 = ?, GES_CESTADO = ? WHERE GES_NUMERO_COMUNICA = ? AND GES_NENV_CODIGO = ? AND GES_CESTADO = ?`;
        connDB
          .promise()
          .query(sql, [TIPO_MSG_FIN, gestionar, estadoNuevo, objData.telAspirante, objData.codEnvio, 'Activo'])
          .then(([results, fields]) => {
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

function controlErrores(error) {
  var FechaActual = getFechaActual();
  var HoraActual = getHoraActual();

  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
  }
  var logger = fs.createWriteStream(`./logs/log_${FechaActual}.txt`, {
    flags: 'a',
  });
  var DetalleError = dumpError(error);
  logger.write(`${error} ${DetalleError} ${FechaActual} - ${HoraActual}\n`);
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

function getFechaActual() {
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

// Obtiene la hora actual
function getHoraActual() {
  Hora = new Date().getHours() + 1;
  if (Hora >= 1 && Hora < 10) {
    Hora = '0' + Hora.toString();
  }
  Minuto = new Date().getMinutes();
  if (Minuto >= 1 && Minuto < 10) {
    Minuto = '0' + Minuto.toString();
  }
  Segundo = new Date().getSeconds();
  if (Segundo >= 1 && Segundo < 10) {
    Segundo = '0' + Segundo.toString();
  }
  var HoraActual = Hora + ':' + Minuto + ':' + Segundo;
  return HoraActual;
}

function limpiarRespuesta(str) {
  if (typeof str === 'string') {
    str = str.trim();
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // quita tildes y otros caracteres raros
    str = str.toUpperCase(); // pasa a mayus

    return str;
  }

  return 'no_string';
}

function getResAspirante(tipoMensaje, objMessage) {
  let msg = null;
  // ? Extraer el string del objMensaje para ser evaluado má adelante en los ifs
  switch (tipoMensaje) {
    case 'conversation':
      msg = objMessage.message.conversation;
      break;

    case 'extendedTextMessage':
      msg = objMessage.message.extendedTextMessage.text;
      break;

    case 'buttonsResponseMessage':
      msg = objMessage.message.buttonsResponseMessage.selectedDisplayText;
      break;

    case 'listResponseMessage':
      msg = objMessage.message.listResponseMessage.title;
      break;

    case 'stickerMessage':
      // ? Que hacer ?
      msg = objMessage.message.stickerMessage;
      break;

    case 'documentMessage':
      msg = objMessage.message.documentMessage.title;
      break;

    default:
      console.log('No se identificó el tipo de mensaje');
      break;
  }
  return msg;
}

// run in main file
// * ================================
// * ===== EJECUCIÓN FUNCIONES ======
// * ================================

connectToWhatsApp().catch((err) => console.log('unexpected error: ' + err)); // catch any errors
enviarSpam(); //Envio de mensaje inicial para iniciar conversación
