const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { Client, Buttons, List, MessageMedia } = require('whatsapp-web.js');
const db_DML = require('./DB_DML');
const mysql = require('mysql2');
//const { database } = require('./keys');
const os = require('os');

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
  //  chatsResagados();
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
  if (msg.body != '' && (msg.type == 'chat' || msg.type == 'ciphertext')) {
    //funcion para hacer seguimiento sobre que posicione esta el asesor,obtiene idAsesor,estado del caso y si ya es mensaje fin
    let resultadosss = await Gestion.get_data_list_from_number(numero_chat);
    console.log('thisssssssssssss', resultadosss[0]);
    //enviamos el numero a que en la clase gestión en el metodo get_msg_by_numero se verifique si ya existe ese numero en base de datos
    let msg_control = await Gestion.get_msg_by_numero(numero_chat);
    console.log('>>>>>>>>>>>', msg_control);
    if (msg_control == '') {
      let comprobar = await Gestion.insert_gestion(numero_chat, 'MSG_FIN', 'Activo');

      // si se insertó el mensaje de saludo respondo
      if (comprobar == true) {
        const MensajeActualAsesor = `Bienvenido a Maple, en breves minutos un asesor se contactará con usted.`;
        clientWP.sendMessage(msg.from, MensajeActualAsesor);
      }
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
    else if (resultadosss[0] != null && resultadosss[1] != null && resultadosss[2] == 'MSG_FIN') {
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
      var EstadoMensaje = chats.unreadCount;
      console.log('ññññññ', EstadoMensaje);
      console.log('serializado', chats.id._serialized);
      if (EstadoMensaje == 1) {
        clientWP.sendMessage(chats.id._serialized, 'Holirijilla');
        msg.reply('Puedes repetir lo que dijiste por favor?');
      }
    }
  } catch (error) {
    ControlErrores(error);
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
      interval()
    }, 3000);
  }
  interval()
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
