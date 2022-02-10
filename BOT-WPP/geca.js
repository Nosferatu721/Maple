const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { Client, Buttons, List, MessageMedia } = require('whatsapp-web.js');
const db_DML = require('./DB_DML');
const mysql = require('mysql2');
//const { database } = require('./keys');
const os = require('os');
const { options } = require('../WEB/src/routes/GECA');

RutaEjecutablePrograma = __dirname;
EjecutablePrograma = __filename;
RutaEjecutableProgram = __dirname;
EjecutableProgram = __filename;

const Gestion = new db_DML.Gestion();
//const Permiso = new db_DML.Permiso();
const Mensaje = new db_DML.Mensaje();

var LineasAutorizadas = ['3053599685', '3013775932', '3054818254', '3106542257', '3006870762'];

const clientWP = new Client({
  puppeteer: {
    headless: false,
    //executablePath: getRutaChrome(),
  },
  authTimeoutMs: 3600000,
  clientId: 'sesion_mibot',
});

clientWP.initialize();

clientWP.on('qr', (qr) => {
  // console.log('QR RECEIVED', qr);
  qrcode.generate(qr, { small: true });
});

clientWP.on('ready', async () => {
  // * Ver Envios Masivos en DB
  // envioMasivo()
  //
  await send_mensaje();
  //no permite que pase de los 10 chats VERIFICAR&&&&&&&&&&&&&&
  eliminarExesoChats();
  //chatsResagados();
  VerificarChatsNoLeidos();
});

// * --- sesión exitosa en wp web
clientWP.on('authenticated', () => {
  console.log(`${GetFechaActual()} ${getHoraActual()} AUTHENTICATED (sesión exitosa)`);
});

// * --- sesión no exitosa en wp web
clientWP.on('auth_failure', (msg) => {
  // Fired if session restore was unsuccessfull
  console.error(`${GetFechaActual()} ${getHoraActual()} AUTHENTICATION FAILURE (sesión no exitosa)`, msg);
});

// * --- persona escribe a chat de bot
clientWP.on('message', async (msg) => {
  //limpiamos numeros para que no se vayan con el wild o identificador tipico de whatsapp
  let numero_chat = msg.from.toString().replace('@c.us', '');
  console.log('ESTE ES EL TIPO DE MENSAJE QUE LLEGA ', msg.type);
  console.log('MIRAMOS SI LLEGA VACIO ', msg.body);
  //verifico si el mensaje que llega es diferente de nulo, esto se realiza por que whatsapp
  //genera dos eventos de mensaje uno vacio y uno con mensaje, descartamos el mensaje vacio de esta forma
  if (msg.body != '') {
    //funcion para hacer seguimiento sobre que posicione esta el asesor,obtiene idAsesor,estado del caso y si ya es mensaje fin
    let resultadosss = await Gestion.get_data_list_from_number(numero_chat);

    //enviamos el numero a que en la clase gestión en el metodo get_msg_by_numero se verifique si ya existe ese numero en base de datos
    let msg_control = await Gestion.get_msg_by_numero(numero_chat);
    console.log('>>>>>>>>>>>', msg_control, msg.type);
    if (msg_control == '') {
      let comprobar = await Gestion.insert_gestion(numero_chat, 'MSG_SALUDO', 'Activo');

      // si se insertó el mensaje de saludo respondo
      if (comprobar == true) {
        const MensajeActualAsesor = `Hola, bienvenido al Chat Respira de Maple Respiratory, para gestionar de forma oportuna su requerimiento por favor tener a la mano lapiz, papel y la documentacion necesaria. Si tiene alguna duda en cuanto a las políticas de funcionamiento del chat ingrese al siguiente link:https://www.maplerespiratory.co/de-su-interes/normatividad/.
      Horario de atencion es de Lunes a Viernes de 7am a 7 pm y los sabados de 7am a 1pm
      ¿Con quién tengo el gusto de hablar? (Por favor escriba su nombre) ⬇️`;
        clientWP.sendMessage(msg.from, MensajeActualAsesor);
      }
    }

    // ! CUANDO RESPONDE CON EL NOMBRE Y DEVUELVE EL PARENTEZCO
    else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SALUDO' && msg.type === 'chat') {
      let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
      console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
      let updateByName = await Gestion.update_gestion(idArbol, 'MSG_NOMBRE', msg.body, 'GES_CDETALLE1');

      const options = [{ title: 'Paciente' }, { title: 'Familiar' }, { title: 'Conocido' }, { title: 'Asegurador(funcionario)' }];
      const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
      const lista = new List('¿Que parentesco tiene con el paciente?', 'Seleccione una opción', menu);
      clientWP.sendMessage(msg.from, lista).then(() => {});
    }

    // ! VALIDA SI LLEGA EL TIPO DE PACIENTE Y RETORNA LISTA DE TIPO DE DOCUMENTO
    else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_NOMBRE' && msg.type === 'list_response') {
      let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
      console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
      let updateByName = await Gestion.update_gestion(idArbol, 'MSG_TIPOPACIENTE', msg.body, 'GES_CDETALLE2');

      const options = [{ title: 'Cedula de Ciudadania' }, { title: 'Tarjeta de Identidad' }, { title: 'Registro Civil' }, { title: 'Cedula de Extranjeria' }, { title: 'Tarjeta de Extranjeria' }, { title: 'NIT' }, { title: 'Pasaporte' }, { title: 'Permiso de Permanencia' }];
      const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
      const lista = new List('Seleccione el tipo de documento del paciente', 'Seleccione una opción', menu);
      clientWP.sendMessage(msg.from, lista).then(() => {});
    }
    // ? VALIDAR RESPONIO LA LISTA MSG_TIPOPACIENTE
    else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_NOMBRE' && msg.type !== 'list_response') {
      clientWP.sendMessage(msg.from, 'Por Favor selecciona una opcion de la lista');
    }

    // ! VALIDA SI LLEGA EL TIPO DE DOCUMENTO Y RETORNA CONFIRMACION NOMBRE PACIENTE
    else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_TIPOPACIENTE' && msg.type === 'list_response') {
      let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
      console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
      let updateByName = await Gestion.update_gestion(idArbol, 'MSG_TIPODOCUMENTO', msg.body, 'GES_CDETALLE3');

      clientWP.sendMessage(msg.from, 'Me confirma nombre del paciente');
    }
    // ? VALIDAR RESPONIO LA LISTA MSG_TIPODOCUMENTO
    else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_TIPOPACIENTE' && msg.type !== 'list_response') {
      clientWP.sendMessage(msg.from, 'Por Favor selecciona una opcion de la lista');
    }

    // ! VALIDA SI LLEGA CONFIRMACION NOMBRE PACIENTE Y RETORNA CONFIRMACION DE NUMEROS DEL PACIENTE
    else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_TIPODOCUMENTO' && msg.type === 'chat') {
      let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
      console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
      let updateByName = await Gestion.update_gestion(idArbol, 'MSG_CONFIRNOMBRE', msg.body, 'GES_CDETALLE4');

      clientWP.sendMessage(msg.from, 'Me confirma dos numeros de contacto con el paciente \n Por ejemplo: 3216549870 - 9876541');
    }

    // ! VALIDA SI LLEGA CONFIRMACION NUMEROS PACIENTE Y RETORNA CONTACTO COVID ¿?
    else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_CONFIRNOMBRE' && msg.type === 'chat') {
      let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
      console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
      let updateByName = await Gestion.update_gestion(idArbol, 'MSG_CONFIRNUMEROS', msg.body, 'GES_CDETALLE5');

      const options = [{ title: 'Si' }, { title: 'No' }];
      const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
      const lista = new List('¿Ha tenido contacto con alguien covid positivo en los ultimos 14 días o ha tenido contacto estrecho?', 'Seleccione una opción', menu);
      clientWP.sendMessage(msg.from, lista).then(() => {});
    }

    // ! VALIDA SI LLEGA CONTACTO COVID ¿? Y RETORNA LISTA SINTOMAS
    else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_CONFIRNUMEROS' && msg.type === 'list_response') {
      let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
      console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
      let updateByName = await Gestion.update_gestion(idArbol, 'MSG_CONTACTCOVID', msg.body, 'GES_CDETALLE6');

      const options = [{ title: 'Fiebre' }, { title: 'Congestion Nasal' }, { title: 'Dolor de Cabeza' }, { title: 'Dificultad al respirar' }, { title: 'Dolor de garganta' }, { title: 'Perdida del gusto' }, { title: 'Perdida del olfato' }];
      const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
      const lista = new List('¿Ha tenido en los ultimos 14 dias alguno de los siguientes sintomas?', 'Seleccione una opción', menu);
      clientWP.sendMessage(msg.from, lista).then(() => {});
    }
    // ? VALIDAR RESPONIO LA LISTA MSG_CONTACTCOVID
    else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_CONFIRNUMEROS' && msg.type !== 'list_response') {
      clientWP.sendMessage(msg.from, 'Por Favor selecciona una opcion de la lista');
    }

    // ! VALIDA SI LLEGA SINTOMA Y RETORNA SOLICITUD CIUDAD
    else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_CONTACTCOVID' && msg.type === 'list_response') {
      let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
      console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
      let updateByName = await Gestion.update_gestion(idArbol, 'MSG_SINTOMA', msg.body, 'GES_CDETALLE7');

      clientWP.sendMessage(msg.from, '¿De que ciudad se comunica?');
    }

    // ! VALIDA SI LLEGA CIUDAD Y RETORNA LISTA EPS
    else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SINTOMA' && msg.type === 'chat') {
      let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
      console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
      let updateByName = await Gestion.update_gestion(idArbol, 'MSG_CIUDAD', msg.body, 'GES_CDETALLE8');

      const options = [{ title: 'Sanitas' }, { title: 'Famisanar' }, { title: 'Salud Total' }, { title: 'Medimas' }, { title: 'Nueva EPS' }, { title: 'Seguros Bolivar' }, { title: 'Medplus' }, { title: 'Particular' }, { title: 'Otros' }];
      const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
      const lista = new List('¿Cuál es la Eps que lo remite?', 'Seleccione una opción', menu);
      clientWP.sendMessage(msg.from, lista).then(() => {});
    }

    // ! VALIDA SI LLEGA EPS Y RETORNA SOLICITUD SEDE
    else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_CIUDAD' && msg.type === 'list_response') {
      let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
      console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
      let updateByName = await Gestion.update_gestion(idArbol, 'MSG_EPS', msg.body, 'GES_CDETALLE9');

      clientWP.sendMessage(msg.from, 'Indique a que sede lo estan remitiendo');
    }
    // ? VALIDAR RESPONIO LA LISTA MSG_EPS
    else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_CIUDAD' && msg.type !== 'list_response') {
      clientWP.sendMessage(msg.from, 'Por Favor selecciona una opcion de la lista');
    }

    // ! VALIDA SI LLEGA SEDE Y RETORNA CUAL ES SU SOLICITUD ¿?
    else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_EPS' && msg.type === 'chat') {
      let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
      console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
      let updateByName = await Gestion.update_gestion(idArbol, 'MSG_SEDE', msg.body, 'GES_CDETALLE10');

      clientWP.sendMessage(msg.from, '¿Cuál es su solicitud?');
    }

    // ! VALIDA SI LLEGA DSC SOLICITUD Y RETORNA MENSAJE FINAL
    else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SEDE' && msg.type === 'chat') {
      let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
      console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
      let updateByName = await Gestion.update_gestion(idArbol, 'MSG_FIN', msg.body, 'GES_CDETALLE11');

      clientWP.sendMessage(msg.from, 'Por favor permitanos un momento, un asesor en unos minutos lo atendera, gracias ');
    }

    // ! VALIDA TERMINO ARBOL
    else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SOLICITUD' && msg.type === 'chat') {
      let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
      console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);

      clientWP.sendMessage(msg.from, 'Por favor permitanos un momento, un asesor en unos minutos lo atendera, gracias ');
    }

    //ocasion para cuando el cliente esta en cola de espera le responde esto
    else if (resultadosss[0] == null && resultadosss[1] == null && resultadosss[2] == 'MSG_FIN') {
      console.log('SI ENTREEEEEEEEEEEEEEEEEEEEEEEEEEEEE');

      let id_tree = await Gestion.select_id_arbol_by_number(numero_chat);
      console.log(id_tree);
      let position = await Gestion.select_position(id_tree);
      console.log('this is the position/', position);
      if (position == 0) {
        let mensajeEspera = `Seràs el pròximo en ser atendido por favor aguarda un momento ⌛ `;
        clientWP.sendMessage(msg.from, mensajeEspera);
      } else {
        let mensajeEspera = `Nuestros asesores estan a tope 👀, hay ${position} personas por atender despues de ti, se paciente por favor ⌛ `;
        clientWP.sendMessage(msg.from, mensajeEspera);
      }
    }
    //ocasion para cuando ya se asigna el arbol, el bot solo pone en la BD.
    else if (resultadosss[0].FKGES_NPER_CODIGO != null && resultadosss[0].GES_ESTADO_CASO != null && resultadosss[0].GES_CULT_MSGBOT == 'MSG_FIN') {
      let id_gestion = await Gestion.get_id_by_numero(numero_chat);
      console.log('si entro cuando ya no son nulos jajajaja');
      await Mensaje.insert_mensaje(id_gestion, numero_chat, msg.body, 'chat');
    }
  } else {
    if (msg.type == 'e2e_notification') {
      console.log('NO HAGO NADA GGGGG');
    } else {
      const MensajeNoEntiende = `Disculpa no entiendo lo que dices,asegurate que sea solo *texto o emojis* 😅`;
      clientWP.sendMessage(msg.from, MensajeNoEntiende);
    }
  }
});

//Funcion de espera
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function send_mensaje() {
  setInterval(async () => {
    let respuesta = await Mensaje.get_mensaje();
    if (respuesta != null) {
      console.log(respuesta);
      clientWP.sendMessage(respuesta.MEN_NUMERO_DESTINO + '@c.us', respuesta.MEN_TEXTO);
      await Mensaje.update_mensaje(respuesta.PKMEN_NCODIGO, 'ENVIADO');
    }
  }, 2000);
}

async function chatsResagados() {
  try {
    const chatIds = await clientWP.pupPage.evaluate(async () => {
      const chats = await window.WWebJS.getChats();

      return chats.map((chat) => chat);
    });
    for (let chats of chatIds) {
      console.log('----->', chatIds);
      var EstadoMensaje = chats.unreadCount;
      console.log('ññññññ', EstadoMensaje);
      console.log('serializado', chats.id._serialized);
      if (EstadoMensaje >= 1) {
        clientWP.sendMessage(chats.id._serialized, 'Holirijilla');
        msg.reply('Puedes repetir lo que dijiste por favor?');
      }
    }
  } catch (error) {
    ControlErrores(error);
  }
}

async function VerificarChatsNoLeidos() {
  Correcto = true;

  clientWP.getChats().then((Chats) => {
    //console.log(Chats);
    Chats.map(async (Chat) => MensajeChat(await Chat.fetchMessages({ limit: 1 }), Chat));
  });
  await sleep(10000);
}

function MensajeChat(Mensaje, Chat) {
  if (Mensaje[0].fromMe == false && Chat.unreadCount > 0) {
    console.log('**************************** Recuperar', Chat.id.user);
    clientWP.sendMessage(Chat.id._serialized, 'Reenvia el ultimo mensaje');
  }
}

async function eliminarExesoChats() {
  Correcto = true;
  while (Correcto == true) {
    clientWP.getChats().then((Chats) => {
      //Eliminar el exeso de chats
      if (Chats.length > 10) {
        for (let index = 10; index < Chats.length; index++) {
          if (Chats[index].unreadCount <= 0) {
            Chats[index].delete();
          }
        }
      }
    });
    await sleep(60000);
  }
}

const envioMasivo = async () => {
  const interval = () => {
    console.log('Esperando Numero');
    setTimeout(() => {
      interval();
    }, 3000);
  };
  interval();
};

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
