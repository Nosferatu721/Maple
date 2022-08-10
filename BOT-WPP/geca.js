const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { Client, Buttons, List, MessageMedia, LocalAuth } = require('whatsapp-web.js');
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
const Outbound = new db_DML.Outbound();
const QR = new db_DML.QR();

var LineasAutorizadas = ['3053599685', '3013775932', '3054818254', '3106542257', '3006870762'];

const clientWP = new Client({
  puppeteer: {
    headless: false,
    //executablePath: getRutaChrome(),
  },
  authTimeoutMs: 3600000,
  clientId: 'sesion_mibot',
  authStrategy: new LocalAuth({ clientId: 'cliente-one' }),
});

clientWP.initialize();

clientWP.on('qr', async (qr) => {
  if (await QR.existQRDB()) {
    console.log('Ya hay un registro');
    QR.updateQR(qr)
  } else {
    console.log('No hay registro');
    QR.insertQR(qr)
  }
  console.log('QR RECEIVED', qr, '\n');
  qrcode.generate(qr, { small: true });
});

clientWP.on('ready', async () => {
  // * Ver Envios Masivos en DB
  envioMasivo();
  //
  await send_mensaje();
  //no permite que pase de los 10 chats VERIFICAR&&&&&&&&&&&&&&
  eliminarExesoChats();
  //chatsResagados();
  VerificarChatsNoLeidos();
  // Enviar encuestas
  initEncuesta();
});

// * --- sesión exitosa en wp web
clientWP.on('authenticated', () => {
  console.log(`${GetFechaActual()} ${getHoraActual()} AUTHENTICATED (sesión exitosa)`);
  QR.updateQR2()
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
    // Validar si la persona tiene que responder la Encuesta o entra al Arbol normal
    let chatCerrado = await Gestion.getChatCerrado(numero_chat);
    if (chatCerrado) {
      if (chatCerrado.GES_CENCUESTA === 'ENCUESTAR') {
        // ! Primera pregunta de la Encuesta
        if (chatCerrado.GES_CULT_MSGBOT == 'MSG_ENCUESTAP1' && msg.type === 'list_response') {
          let idArbol = await Gestion.select_id_arbol_by_numberCerrado(numero_chat);
          console.log('LLEGA EL ARBOL ', idArbol, chatCerrado.PKGES_CODIGO);
          let updateByName = await Gestion.update_gestion(idArbol, 'MSG_ENCUESTAP2', msg.body, 'GES_CDETALLE14');
          clientWP.sendMessage(msg.from, '¿Recomendarías nuestro WhatsApp de Maple Respiratory? Marca de cero a diez, donde 10 es definitivamente la recomendarías y 0 definitivamente no la recomendarías.');
        }
        // ? VALIDAR
        else if (chatCerrado.GES_CULT_MSGBOT == 'MSG_ENCUESTAP1' && msg.type !== 'list_response') {
          clientWP.sendMessage(msg.from, 'Por Favor selecciona una opcion de la lista');
        }
        // ! Segunda pregunta de la Encuesta
        else if (chatCerrado.GES_CULT_MSGBOT == 'MSG_ENCUESTAP2' && msg.type === 'chat' && msg.body >= 0 && msg.body <= 10) {
          let idArbol = await Gestion.select_id_arbol_by_numberCerrado(numero_chat);
          console.log('LLEGA EL ARBOL ', idArbol, chatCerrado.PKGES_CODIGO);
          let updateByName = await Gestion.update_gestion(idArbol, 'MSG_ENCUESTAP3', msg.body, 'GES_CDETALLE15');

          clientWP.sendMessage(msg.from, '¿Quieres dejarnos tu opinión?\n Escribe *No* Para finalizar, de lo contrario escribe tu opinion');
        }
        // ? Validar Segunda pregunta de la Encuesta
        else if (chatCerrado.GES_CULT_MSGBOT == 'MSG_ENCUESTAP2' && msg.type === 'chat' && isNaN(msg.body)) {
          clientWP.sendMessage(msg.from, 'Por favor coloca una valoracion del 0 al 10');
        }
        // ! Tercera pregunta de la Encuesta
        else if (chatCerrado.GES_CULT_MSGBOT == 'MSG_ENCUESTAP3' && msg.type === 'chat') {
          let idArbol = await Gestion.select_id_arbol_by_numberCerrado(numero_chat);
          console.log('LLEGA EL ARBOL ', idArbol, chatCerrado.PKGES_CODIGO);
          let updateByName = await Gestion.update_gestion(idArbol, 'MSG_FINENCUESTA', msg.body, 'GES_CDETALLE16');
          let updateByName2 = await Gestion.update_gestion(idArbol, 'MSG_FINENCUESTA', 'ENCUESTADO', 'GES_CENCUESTA');

          clientWP.sendMessage(msg.from, 'Gracias por tu valoración, la tendremos en cuenta para mejorar');
        }
      }
    } else {
      //funcion para hacer seguimiento sobre que posicione esta el asesor,obtiene idAsesor,estado del caso y si ya es mensaje fin
      let resultadosss = await Gestion.get_data_list_from_number(numero_chat);
      //enviamos el numero a que en la clase gestión en el metodo get_msg_by_numero se verifique si ya existe ese numero en base de datos
      let msg_control = await Gestion.get_msg_by_numero(numero_chat);
      console.log('>>>>>>>>>>>', msg_control, msg.type);
      if (msg_control == '') {
        let comprobar = await Gestion.insert_gestion(numero_chat, 'MSG_SALUDO', 'Activo');

        // si se insertó el mensaje de saludo respondo
        if (comprobar == true) {
          //   const MensajeActualAsesor = `Hola, bienvenido al Chat Respira de Maple Respiratory, para gestionar de forma oportuna su requerimiento por favor tener a la mano lapiz, papel y la documentacion necesaria. Si tiene alguna duda en cuanto a las políticas de funcionamiento del chat ingrese al siguiente link:https://www.maplerespiratory.co/de-su-interes/normatividad/.
          // Horario de atencion es de Lunes a Viernes de 7am a 7 pm y los sabados de 7am a 1pm
          // ¿Con quién tengo el gusto de hablar? (Por favor escriba su nombre) ⬇️`;

          const options = [{ title: 'INFORMACIÓN DE CONTACTO' }, { title: 'INFORMACIÓN DE SEDES' }, { title: 'RECOMENDACIONES GENERALES' }, { title: 'TIPOS Y PREPARACIONES PARA EXÁMENES' }, { title: 'DEBERES Y DERECHOS' }, { title: 'PASO A AGENTE' }];
          const menu = [{ title: 'Opciones:', rows: options }];
          const lista = new List('Bienvenido al ChatBot de Maple Respiratory. Este es el menú principal: ', 'Seleccione una opción', menu);
          clientWP.sendMessage(msg.from, lista);
        }
      }

      // ? VALIDAR RESPONIO LA LISTA MSG_SALUDO
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SALUDO' && msg.type !== 'list_response') {
        clientWP.sendMessage(msg.from, 'Por Favor selecciona una opcion de la lista');
      }

      // ! CUANDO RESPONDE CON EL NOMBRE Y DEVUELVE EL PARENTEZCO
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SALUDO' && msg.type === 'list_response' && msg.body === 'PASO A AGENTE') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        let updateByName = await Gestion.update_gestion(idArbol, 'MSG_SOLIAUT', msg.body, 'GES_CDETALLE1');

        const options = [{ title: 'Si' }, { title: 'No' }];
        const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
        const lista = new List(
          `Hola, bienvenido al Chat Respiratory, para gestionar de forma oportuna su requerimiento. Si tiene alguna duda en cuanto a las políticas de funcionamiento del chat ingrese al siguiente link: https://www.maplerespiratory.co/de-su-interes/normatividad/ \n
Señor usuario con la expedición de la ley 1581 del 2012 y el decreto 1377 del 2013. Usted autoriza a Maple Respiratory al tratamiento y uso de datos personales: \n
Acepta: `,
          'Seleccione una opción',
          menu
        );
        clientWP.sendMessage(msg.from, lista);
      }

      // ? VALIDAR
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SOLIAUT' && msg.type !== 'list_response') {
        clientWP.sendMessage(msg.from, 'Por Favor selecciona una opcion de la lista');
      }

      // !!!***!!! CUANDO NO ES 'PASO A AGENTE'
      else if ((resultadosss[0].GES_CULT_MSGBOT == 'MSG_SALUDO' || resultadosss[0].GES_CULT_MSGBOT == 'MSG_TIPMENUINFO') && msg.type === 'list_response' && msg.body !== 'PASO A AGENTE') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        let updateByName = await Gestion.update_gestion(idArbol, 'MSG_TIPMENUINFO', msg.body, 'GES_CDETALLE1');
        // *** INFORMACIÓN DE CONTACTO
        if (msg.body === 'INFORMACIÓN DE CONTACTO') {
          clientWP.sendMessage(
            msg.from,
            `*Líneas de Atención:*
  Bogotá: 4863232
  Línea Celular: 3208899553
  Nacional: 01 800 0186660
  @: servicioalcliente@maplerespiratory.co
  www.maplerespiratory.co`
          );
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }

        // *** INFORMACIÓN DE SEDES
        if (msg.body === 'INFORMACIÓN DE SEDES') {
          clientWP.sendMessage(
            msg.from,
            `*Sedes*
Medellín: Calle 33ª N° 76 – 29 Barrio Laureles
Ibagué: Carrera 4D N° 36 – 24 Barrio Cádiz
Cali: Carrera 40 N° 5B - 29 Barrio Tequendama
Sogamoso: Carrera 9a N° 14 – 133 Barrio San Martin
Manizales: Calle 58 # 23 - 52 Barrio Belén
Bogotá: Carrera 46 N° 95 – 35 Barrio Castellana
Barranquilla: Calle 85 # 50-159 Piso 8 Consultorio 809 Edificio Quantum Tower
Valledupar: Calle 16 # 19d-28 Consultorio 405 - 406 Piso 4 Unidad Médica Las Flores Y/O Edificio Sanitas, El Que Queda Por El Éxito
Bucaramanga: Kilómetro 7 Vía Bucaramanga Piedecuesta, Centro Internacional De Especialistas, Torre Sur Tercer Piso Consultorio 304
Pereira: Carrera 14 Bis # 10-47 Edificio Los Alpes 10 – Consultorios 707-708-709. Barrio: Alpes`
          );
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }

        // *** RECOMENDACIONES GENERALES
        if (msg.body === 'RECOMENDACIONES GENERALES') {
          const options = [{ title: 'Citas generales' }, { title: 'Entrega de equipo' }, { title: 'Entrega de resultados de Diagnostico' }, { title: 'Copagos y cuotas moderadoras' }];
          const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
          const lista = new List('Por favor seleccione una opción de esta lista', 'Seleccione una opción', menu);
          clientWP.sendMessage(msg.from, lista);
        }
        if (msg.body === 'Citas generales') {
          clientWP.sendMessage(
            msg.from,
            `- Traer cédula original
- Puede asistir a la cita con un acompañante.
- Llevar la tarjeta del equipo o el equipo completo si presenta fallas
- Debe presentarse 15 minutos antes de la cita asignada.
- Recuerde que su hora de llegada debe ser puntual de lo contrario perderá su cita y se le presenta algún inconveniente antes de la cita o no puede asistir por favor comuníquese al: Bogotá: 4863232, Móvil: 3208899553 Nacional: 018000 186660`
          );
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }
        if (msg.body === 'Entrega de equipo') {
          clientWP.sendMessage(
            msg.from,
            `- Traer cédula original, 2 fotocopias de la cedula tamaño normal fotocopia de la última polisomnografía basal y de la titulación de cpap
- Puede asistir a la cita con un acompañante.
- Debe presentarse 15 minutos antes de la cita asignada.
- Recuerde que su hora de llegada debe ser puntual de lo contrario perderá su cita y se le presenta algún inconveniente antes de la cita o no puede asistir por favor comuníquese al: Bogotá: 4863232, Móvil: 3208899553 Nacional: 018000 186660`
          );
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }
        if (msg.body === 'Entrega de resultados de Diagnostico') {
          clientWP.sendMessage(
            msg.from,
            `- El resultado de sus exámenes estará disponible 15 días hábiles posterior a la toma del mismo
- SI en este tiempo no ha recibido respuesta, puede comunicarse a las líneas de servicio al cliente para consultar es estado de su resultado`
          );
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }
        if (msg.body === 'Copagos y cuotas moderadoras') {
          clientWP.sendMessage(msg.from, `De acuerdo con lo establecido por el Gobierno Nacional, MAPLE RESPIRATORY, da a conocer los valores que cada cotizante y beneficiario, deberán cancelar, al momento de solicitar los servicios de nuestra empresa. Estos valores son establecidos por: el Consejo Nacional en Seguridad en Salud y la Comisión de Regulación en Salud`);
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }

        // *** TIPOS Y PREPARACIONES PARA EXÁMENEN
        if (msg.body === 'TIPOS Y PREPARACIONES PARA EXÁMENES') {
          const options = [{ title: 'POLISOMNOGRAFÍA BASAL' }, { title: 'POLISOMNOGRAFÍA DE TITULACIÓN' }, { title: 'POLIGRAFÍA RESPIRATORIA' }, { title: 'AUTOTITULACIÓN' }];
          const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
          const lista = new List('Por favor seleccione una opción de esta lista', 'Seleccione una opción', menu);
          clientWP.sendMessage(msg.from, lista);
        }
        if (msg.body === 'POLISOMNOGRAFÍA BASAL') {
          clientWP.sendMessage(
            msg.from,
            `Estudio diagnóstico electrofisiológico que se utiliza para identificar diversas patologías durante el sueño. El paciente debe asistir a las instalaciones de la IPS durante toda la noche para su realización.
* Preparacion para el examen:*
• Lleve sus documentos de identificación y orden médica para el estudio
• Evite las bebidas como el chocolate, el té, el café.
• Evite fumar
• Lleve el cabello limpio y seco, no use ningún producto químico como el gel o laca.
• Lleve pijama de dos piezas.
• Si toma medicamentos para otras enfermedades tómelos como lo hace habitualmente.
• Si toma medicamentos para dormir llévelos junto con su fórmula médica.
• Si tiene estudios previos llévelos al estudio.
• Todos los pacientes mayores de 75 años deben asistir con acompañante, de acuerdo a su condición, el técnico define si es necesario o no que se quede durante la realización del estudio. (No olvide revisar la indicación de acompañante en la orden entregada por el medico el día de la consulta)`
          );
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }
        if (msg.body === 'POLISOMNOGRAFÍA DE TITULACIÓN') {
          clientWP.sendMessage(
            msg.from,
            `Estudio electrofisiológico que se realiza luego de un diagnóstico positivo para Síndrome de apnea obstructiva de sueño, con el objetivo de definir una presión de aire como tratamiento que permita manejar la enfermedad a través de una máscara adaptada para cada paciente.  Para este estudio el paciente debe asistir a dormir durante toda la noche en nuestras instalaciones.
* Preparacion para el examen:*
• Lleve sus documentos de identificación y orden médica para el estudio
• Evite las bebidas como el chocolate, el té, el café.
• Evite fumar
• Lleve el cabello limpio y seco, no use ningún producto químico como el gel o laca.
• Lleve pijama de dos piezas.
• Si toma medicamentos para otras enfermedades tómelos como lo hace habitualmente.
• Si toma medicamentos para dormir llévelos junto con su fórmula médica.
• Si tiene estudios previos llévelos al estudio.
• Todos los pacientes mayores de 75 años deben asistir con acompañante, de acuerdo a su condición, el técnico define si es necesario o no que se quede durante la realización del estudio. (No olvide revisar la indicación de acompañante en la orden entregada por el medico el día de la consulta)`
          );
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }
        if (msg.body === 'POLIGRAFÍA RESPIRATORIA') {
          clientWP.sendMessage(
            msg.from,
            `Estudio diagnóstico electrofisiológico ambulatorio, que se utiliza para identificar trastornos respiratorios durante el sueño. En la consulta de valoración inicial el médico realizará la entrega de un equipo portátil que debe utilizar durante toda la noche mientras duerme en su casa. Este equipo debe ser devuelto en la sede de la IPS al día siguiente en horas de la mañana para obtener una lectura eficaz del estudio realizado.
Si usted es definido en la consulta de valoración inicial por medicina como apto para la realización de un estudio de poligrafía, se recomienda seguir las instrucciones de colocación y manejo dadas por el médico en el proceso de entrega para obtener un estudio óptimo.`
          );
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }
        if (msg.body === 'AUTOTITULACIÓN') {
          clientWP.sendMessage(
            msg.from,
            `Estudio que permite definir la presión de tratamiento óptima para corregir los eventos obstructivos del paciente con Síndrome de apnea obstructiva de sueño. Se realizará la entrega de un equipo y una máscara, los cuales debe utilizar en su casa durante 5 noches mientras duerme, y asistir el día siguiente a las instalaciones de la IPS a devolver el equipo suministrado para determinar el resultado del estudio. Para este estudio se recomienda dormir todos los días a la misma hora, sin tener distracciones como televisión, celulares u otro dispositivo que le impida conciliar el sueño rápidamente.`
          );
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }

        // *** DEBERES Y DERECHOS
        if (msg.body === 'DEBERES Y DERECHOS') {
          const options = [{ title: 'El paciente tiene el deber de:' }, { title: 'El paciente tiene derecho a:' }];
          const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
          const lista = new List('Por favor seleccione una opción de esta lista', 'Seleccione una opción', menu);
          clientWP.sendMessage(msg.from, lista);
        }
        if (msg.body === 'El paciente tiene el deber de:') {
          clientWP.sendMessage(
            msg.from,
            `1. Conocer políticas administrativas de su institución prestadora de salud Maple Respiratory Colombia para la prestación de los servicios.
2. Precisar antes de asistir a la prestación de servicio de salud que todos los trámites, requerimientos, autorizaciones y vigencias necesarias según la entidad a la que se encuentre afiliado, estén en orden para que Maple Respiratory Colombia le pueda prestar el servicio a satisfacción.
3. Colaborar con el cumplimiento de las normas, requerimientos e instrucciones administrativas establecidas por las autoridades de salud de Maple Respiratory Colombia.
4. Solicitar información necesaria que se requiera sobre las normas y funcionamiento para la prestación del servicio de salud en Maple Respiratory Colombia.
5. Responsabilizarse de los tratamientos (transcripción de tratamientos, autorización de procedimientos, consultas e incapacidad y/o indicación brindada por el terapeuta o especialista) ante Maple Respiratory Colombia.
6. Tratar con máximo respeto a todo el personal de Maple Respiratory Colombia, a los demás pacientes y a los acompañantes.
7. Conocer los canales de comunicación e información de Maple Respiratory Colombia, a través de la coordinación de atención al usuario, sobre preguntas, sugerencias, reclamaciones y quejas relacionadas con la prestación de sus servicios.
8. Firmar su historia clínica en caso de no aceptación, al método de tratamiento, sugerido por el médico tratante.
9. Velar por la confidencialidad de su historia clínica en cumplimiento de la Resolución 1995 / 1999 (custodia conservación de la historia clínica)`
          );
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }
        if (msg.body === 'El paciente tiene derecho a:') {
          clientWP.sendMessage(
            msg.from,
            `1. Ser orientado e informado de las políticas administrativas de su institución prestadora de salud Maple Respiratory Colombia para la prestación de su servicio.
2. El respeto de su personalidad, dignidad humana e intimidad, sin que sea discriminado por razones de tipo racial, social, económica, religioso o política.
3. La confidencialidad de toda información registrada en su historia clínica, diagnóstico y tratamiento, salvo por exigencias legales que lo hagan imprescindible.
4. Recibir información completa, continua de todo lo relativo a su enfermedad, incluyendo diagnóstico, alternativas del tratamiento, riesgos y pronósticos, que será facilitada en un lenguaje comprensible.  En caso de  que el paciente tenga algún tipo de déficit cognitivo para recibir la información, este deberá proporcionarse a los familiares o persona legalmente responsable.
5. A la libre decisión entre diferentes opciones que le presente el médico tratante o terapeuta, siendo preciso su consentimiento expreso previo a cualquier actuación; excepto en los siguientes casos: cuando el tratamiento sea una urgencia o no permita demoras, cuando el no seguir el tratamiento suponga un riesgo para la salud pública, cuando no esté capacitado para tomar decisiones, en cuyo caso el derecho corresponderá a sus familiares y/o persona legalmente responsable.
6. A negarse al tratamiento excepto en las circunstancias descritas en el punto anterior.  Solicitando su salida voluntaria.
7. A que le asignen una terapeuta cuyo nombre debe conocer y que sea un interlocutor válido con el equipo asistencial. En caso de ausencia y/o inconformidad otro terapeuta del equipo asumirá la atención.
8. A que su historia clínica esté todo el proceso de su enfermedad y quede consignado según la normatividad vigente. 
9. A que no se realicen investigaciones, experimentos o ensayos clínicos sin una información clara y precisa de los métodos, riesgos y fines.  Será imprescindible la autorización por escrito del paciente (consentimiento informado).
10. Al correcto funcionamiento de los servicios asistenciales y condiciones adecuadas de higiene, seguridad y respeto a su intimidad e integridad.
11. A conocer los mecanismos formales para presentar sugerencias, quejas o reclamos y a recibir una respuesta por escrito, a través de las vías para comunicarse con la administración de Maple Respiratory Colombia.
12. A que Maple Respiratory Colombia proporcione una asistencia correcta con personal calificado.  Un aprovechamiento máximo de las terapeutas disponibles, una asistencia con los mínimos riesgos, dolores y molestias psíquicas y físicas.`
          );
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }

        // *** MANEJO DE MASCARAS Y EQUIPO
        if (msg.body === 'MANEJO DE MASCARAS Y EQUIPO') {
          clientWP.sendMessage(msg.from, `*Falta definir texto*`);
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }

        // *** DEBERES Y DERECHOS
        if (msg.body === 'RECOMENDACIONES DEL EQUIPO DE SALUD') {
          const options = [{ title: 'Recomendación de su Nutricionista' }, { title: 'Recomendaciones de su Psicólogo' }, { title: 'Recomendaciones de su Terapeuta' }, { title: 'Recomendaciones de su Medico Experto' }];
          const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
          const lista = new List('Por favor seleccione una opción de esta lista', 'Seleccione una opción', menu);
          clientWP.sendMessage(msg.from, lista);
        }
        if (msg.body === 'Recomendación de su Nutricionista') {
          clientWP.sendMessage(
            msg.from,
            `1. Fraccionar la alimentación en 5 tiempos de comida, manejando horarios establecidos cada 3 horas aproximadamente
2. Evitar bebidas oscuras y estimulantes como café, te, gaseosas, bebidas energizantes, pues pueden provocar alteración en el sueño y sistema nervioso.
3. No omitir ninguna comida principal (desayuno, almuerzo y cena), teniendo en cuenta que la cena preferiblemente debe ser tomada antes de las 7 pm.
4. Realizar actividad física mínimo 3 días a la semana 30 a 50 minutos cardiovascular (caminar, montar bicicleta, elíptica entre otros), esto ayudara a mejorar su calidad de vida junto con una alimentación balanceada de acuerdo a sus necesidades nutricionales.
5. Evitar alimentos industrializados como caldos de cubo, salsas tipo mayonesa, salsa de tomate entre otras, sopas de sobre o de caja, encurtidos y enlatados como salchichas.
6. Masticar despacio y con bocados pequeños hará que haya una mejor digestión y asimilación de nutrientes.`
          );
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }
        if (msg.body === 'Recomendaciones de su Psicólogo') {
          clientWP.sendMessage(
            msg.from,
            `1. Identifica si el uso del equipo de presión positiva te genera emociones o pensamientos negativos que eviten la asimilación y aceptación del tratamiento. Una vez identificados trata de aislarlos pensando en la información que tienes sobre el SAHOS y los beneficios que este tratamiento aportara para el mejoramiento de tu calidad de vida, de esta manera eliminaras pre disposiciones frente al tratamiento y facilitaras la consciencia de tu diagnóstico. Sino cuentas con información clara frente a tu diagnóstico o no lo has comprendido, solicitala en tu próxima consulta con los profesionales de Maple Respiratory.
2. Practica ejercicios de relajación y respiración antes de acostarse, esto puede contribuir a que duermas mejor. Por ejemplo, efectuá una respiración lenta y relajada, piensa en algo que le produzca tranquilidad, inhala y exhala de forma lenta durante un par de minutos antes de usar el equipo de presión positiva.
3. Evita los pensamientos negativos repetitivos que puedan afectar tu higiene de sueño y tu tratamiento. Si tienes preocupaciones cotidianas o tareas pendientes que no te dejan dormir, apúntalas en un cuaderno para empezar a resolverlas al día siguiente. Escribirlas te ayudará a no darle demasiadas vueltas en la cabeza cuando estas en la cama.
4. Si te genera temor o angustia usar el equipo de presión positiva (cpap-vpap), te recomendamos que te acerques y manipules tu equipo durante las horas del día, poniéndotelo por breves periodos mientras realizas actividades como ver televisión o leer, de esa manera facilitaras que tengas una mayor asimilación de tu tratamiento a la hora de dormir.
5. Evita quedarte despierto en la cama, si no logras conciliar el sueño. Si han pasado 30 minutos desde que se acostó y sigue aún sin dormir, levántese de la cama, vaya a otra habitación y haga algo que no lo active demasiado, como leer una revista o ver la televisión, por ejemplo. Cuando vuelva a tener sueño regrese a su dormitorio. La idea es que su cerebro asocie el dormitorio y la cama a la actividad de dormir.
6. Trata de mantener buenas relaciones en tu hogar, ya que estar en un ambiente socio-familiar adecuado favorece la expresión de emociones positivas y tu tranquilidad a la hora de irte a dormir. Si, encuentras conflictos que no puedas manejar con tu pareja o demás familiares, debes buscar orientación profesional.`
          );
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }
        if (msg.body === 'Recomendaciones de su Terapeuta') {
          clientWP.sendMessage(msg.from, `*Falta por definir*`);
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }
        if (msg.body === 'Recomendaciones de su Medico Experto') {
          clientWP.sendMessage(
            msg.from,
            `1. Para garantizar un sueño reparador es recomendable una habitación cómoda, oscura y silenciosa, con una temperatura agradable. No debe tener el televisor ni ningún aparato electrónico en la habitación.
2. No debe permanecer en la cama más allá del tiempo necesario para dormir. Reducir el tiempo de permanencia en la cama mejora el sueño, evitando despertares en la noche y sensación de cansancio en la mañana.
3. Evite consumo de café después de las 3 de la tarde, así como el consumo de bebidas energizantes, de bebidas alcohólicas y el cigarrillo, ya que afectan la calidad del sueño. 
4. Realizar actividad física regularmente, durante al menos una hora al día con luz solar, y preferentemente en la mañana, favorece un buen dormir, un mejor control de peso y la sensación de bienestar y tranquilidad.
5. El uso de la terapia de presión positiva debe ser todas las horas de sueño y todos los días, para lograr el beneficio de tratamiento y mejoría de los síntomas de la apnea de sueño`
          );
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }

        // *** PREGUNTAS FRECUENTES
        if (msg.body === 'PREGUNTAS FRECUENTES') {
          clientWP.sendMessage(msg.from, `Lo invitamos a consultar el siguiente enlace donde encontrar respuestas a las situaciones más frecuentes relacionadas con el tratamiento proporcionado por Maple: https://maplerespiratory.co/informacion-al-usuario/preguntas-frecuentes/.`);
          await Gestion.deleteChat(msg.from.toString().replace('@c.us', ''));
        }
      }

      // ! VALIDA
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SOLIAUT' && msg.type === 'list_response') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        if (msg.body === 'Si') {
          let updateByName = await Gestion.update_gestion(idArbol, 'MSG_NOMBRE', msg.body, 'GES_CDETALLE2');
          clientWP.sendMessage(msg.from, '¿Cuál es su nombre?');
        } else {
          let updateByName = await Gestion.cerrarChat(idArbol);
          clientWP.sendMessage(msg.from, 'Gracias por comunicarse con Maple Respiratory Colombia, lo esperamos en una próxima oportunidad, que tenga un feliz día');
        }
      }

      // ! VALIDA
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_NOMBRE' && msg.type === 'chat') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        let updateByName = await Gestion.update_gestion(idArbol, 'MSG_TIPOPACIENTE', msg.body, 'GES_CDETALLE3');

        const options = [{ title: 'Paciente' }, { title: 'Familiar' }, { title: 'Conocido' }, { title: 'Asegurador(funcionario)' }];
        const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
        const lista = new List('¿Que parentesco tiene con el paciente?', 'Seleccione una opción', menu);
        clientWP.sendMessage(msg.from, lista);
      }

      // ! VALIDA
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_TIPOPACIENTE' && msg.type === 'list_response') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        let updateByName = await Gestion.update_gestion(idArbol, 'MSG_TIPODOCUMENTO', msg.body, 'GES_CDETALLE4');

        const options = [{ title: 'Cedula de Ciudadania' }, { title: 'Tarjeta de Identidad' }, { title: 'Registro Civil' }, { title: 'Cedula de Extranjeria' }, { title: 'Tarjeta de Extranjeria' }, { title: 'NIT' }, { title: 'Pasaporte' }, { title: 'Permiso de Permanencia' }];
        const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
        const lista = new List('Seleccione el tipo de documento del paciente', 'Seleccione una opción', menu);
        clientWP.sendMessage(msg.from, lista);
      }
      // ? VALIDAR
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_TIPOPACIENTE' && msg.type !== 'list_response') {
        clientWP.sendMessage(msg.from, 'Por Favor selecciona una opcion de la lista');
      }

      // ! VALIDA
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_TIPODOCUMENTO' && msg.type === 'list_response') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        let updateByName = await Gestion.update_gestion(idArbol, 'MSG_NDOCPACIENTE', msg.body, 'GES_CDETALLE5');

        clientWP.sendMessage(msg.from, 'Me indica número de documento del paciente:');
      }

      // ! VALIDA
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_NDOCPACIENTE' && msg.type === 'chat') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        let updateByName = await Gestion.update_gestion(idArbol, 'MSG_CONFIRNUMEROPACIENTE', msg.body, 'GES_CDETALLE6');

        clientWP.sendMessage(msg.from, 'Me confirma dos números de contacto con el paciente. Por ejemplo: 3216549870 - 9876541:');
      }

      // ! VALIDA
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_CONFIRNUMEROPACIENTE' && msg.type === 'chat') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        let updateByName = await Gestion.update_gestion(idArbol, 'MSG_CIUDAD', msg.body, 'GES_CDETALLE7');

        clientWP.sendMessage(msg.from, '¿De qué ciudad se comunica?');
      }

      // ! VALIDA
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_CIUDAD' && msg.type === 'chat') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        let updateByName = await Gestion.update_gestion(idArbol, 'MSG_ENTIDAD', msg.body, 'GES_CDETALLE8');

        const options = [{ title: 'Sanitas' }, { title: 'Famisanar' }, { title: 'Salud Total' }, { title: 'Nueva Eps' }, { title: 'Seguros Bolívar' }, { title: 'Medplus' }, { title: 'Particular' }, { title: 'Otros' }];
        const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
        const lista = new List('¿Cuál es la Entidad que lo remite?', 'Seleccione una opción', menu);
        clientWP.sendMessage(msg.from, lista);
      }

      // ! VALIDA
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_ENTIDAD' && msg.type === 'list_response') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        let updateByName = await Gestion.update_gestion(idArbol, 'MSG_SEDE', msg.body, 'GES_CDETALLE9');

        const options = [
          { title: 'Medellín: Calle 33ª N° 76 – 29 Barrio Laureles' },
          { title: 'Ibagué: Carrera 4D N° 36 – 24 Barrio Cádiz' },
          { title: 'Cali: Carrera 40 N° 5B - 29 Barrio Tequendama' },
          { title: 'Sogamoso: Carrera 9a N° 14 – 133 Barrio San Martin' },
          { title: 'Manizales: Calle 58 # 23 - 52 Barrio Belén' },
          { title: 'Bogotá: Carrera 46 N° 95 – 35 Barrio Castellana' },
          { title: 'Barranquilla: Calle 85 # 50-159 Piso 8 Consultorio 809 Edificio Quantum Tower' },
          { title: 'Valledupar: Calle 16 # 19d-28 Consultorio 405 - 406 Piso 4 Unidad Médica Las Flores Y/O Edificio Sanitas, El Que Queda Por El Éxito' },
          { title: 'Bucaramanga: Kilómetro 7 Vía Bucaramanga Piedecuesta, Centro Internacional De Especialistas, Torre Sur Tercer Piso Consultorio 304' },
          { title: 'Pereira: Carrera 14 Bis # 10-47 Edificio Los Alpes 10 – Consultorios 707-708-709. Barrio: Alpes' },
        ];
        const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
        const lista = new List('Indique a que sede lo están remitiendo:', 'Seleccione una opción', menu);
        clientWP.sendMessage(msg.from, lista);
      }
      // ? VALIDAR
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_ENTIDAD' && msg.type !== 'list_response') {
        clientWP.sendMessage(msg.from, 'Por Favor selecciona una opcion de la lista');
      }

      // ! VALIDA
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SEDE' && msg.type === 'list_response') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        let updateByName = await Gestion.update_gestion(idArbol, 'MSG_SOLICITUD', msg.body, 'GES_CDETALLE10');

        const options = [{ title: 'Asignación de cita' }, { title: 'Cancelación de cita' }, { title: 'Confirmación de cita' }, { title: 'Información del tratamiento' }, { title: 'Información de un tramite' }];
        const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
        const lista = new List('¿Cuál es su solicitud?', 'Seleccione una opción', menu);
        clientWP.sendMessage(msg.from, lista);
      }
      // ? VALIDAR
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SEDE' && msg.type !== 'list_response') {
        clientWP.sendMessage(msg.from, 'Por Favor selecciona una opcion de la lista');
      }

      // *** Inicio SubMenu
      // ! VALIDA
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SOLICITUD' && msg.type === 'list_response' && msg.body === 'Asignación de cita') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        let updateByName = await Gestion.update_gestion(idArbol, 'MSG_SOLICITUDSUBMENU', msg.body, 'GES_CDETALLE11');

        const options = [{ title: 'Primera cita con Maple (valoración)' }, { title: 'Estudios de diagnostico' }, { title: 'Entrega de equipo ' }, { title: 'Controles' }, { title: 'Mantenimiento' }];
        const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
        const lista = new List('¿Cuál es su solicitud? para *Asignación de cita*', 'Seleccione una opción', menu);
        clientWP.sendMessage(msg.from, lista);
      }
      // ! VALIDA
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SOLICITUD' && msg.type === 'list_response' && msg.body === 'Cancelación de cita') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        let updateByName = await Gestion.update_gestion(idArbol, 'MSG_SOLICITUDSUBMENU', msg.body, 'GES_CDETALLE11');

        const options = [{ title: 'Primera cita con Maple (valoración)' }, { title: 'Estudios de diagnostico' }, { title: 'Entrega de equipo ' }, { title: 'Controles' }, { title: 'Mantenimiento' }];
        const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
        const lista = new List('¿Cuál es su solicitud? para *Cancelación de cita*', 'Seleccione una opción', menu);
        clientWP.sendMessage(msg.from, lista);
      }
      // ! VALIDA
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SOLICITUD' && msg.type === 'list_response' && msg.body === 'Confirmación de cita') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        let updateByName = await Gestion.update_gestion(idArbol, 'MSG_SOLICITUDSUBMENU', msg.body, 'GES_CDETALLE11');

        const options = [{ title: 'Primera cita con Maple (valoración)' }, { title: 'Estudios de diagnostico' }, { title: 'Entrega de equipo ' }, { title: 'Controles' }, { title: 'Mantenimiento' }];
        const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
        const lista = new List('¿Cuál es su solicitud? para *Confirmación de cita*', 'Seleccione una opción', menu);
        clientWP.sendMessage(msg.from, lista);
      }
      // ! VALIDA
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SOLICITUD' && msg.type === 'list_response' && msg.body === 'Información del tratamiento') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        let updateByName = await Gestion.update_gestion(idArbol, 'MSG_SOLICITUDSUBMENU', msg.body, 'GES_CDETALLE11');

        const options = [{ title: 'Uso del equipo' }, { title: 'Falla del equipo' }, { title: 'Otros' }];
        const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
        const lista = new List('¿Cuál es su solicitud? para *Información del tratamiento*', 'Seleccione una opción', menu);
        clientWP.sendMessage(msg.from, lista);
      }
      // ! VALIDA
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SOLICITUD' && msg.type === 'list_response' && msg.body === 'Información de un tramite') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        let updateByName = await Gestion.update_gestion(idArbol, 'MSG_SOLICITUDSUBMENU', msg.body, 'GES_CDETALLE11');

        const options = [{ title: 'Historia clínica' }, { title: 'Queja, reclamo o solicitud' }, { title: 'Escalamiento pendiente respuesta' }];
        const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
        const lista = new List('¿Cuál es su solicitud? para *Información del tratamiento*', 'Seleccione una opción', menu);
        clientWP.sendMessage(msg.from, lista);
      }
      // ? VALIDAR
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SOLICITUD' && msg.type !== 'list_response') {
        clientWP.sendMessage(msg.from, 'Por Favor selecciona una opcion de la lista');
      }
      // *** Fin SubMenu

      // ! VALIDA
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SOLICITUDSUBMENU' && msg.type === 'list_response') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        let updateByName = await Gestion.update_gestion(idArbol, 'MSG_FIN', msg.body, 'GES_CDETALLE12');

        clientWP.sendMessage(msg.from, 'Por favor permítanos un momento, un asesor antes de las 48 horas lo atenderá, gracias');
      }
      // ? VALIDAR
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_SOLICITUDSUBMENU' && msg.type !== 'list_response') {
        clientWP.sendMessage(msg.from, 'Por Favor selecciona una opcion de la lista');
      }

      // ! VALIDA TERMINO ARBOL
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_FIN' && msg.type === 'chat' && resultadosss[0].GES_ESTADO_CASO !== 'ABIERTO') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);

        clientWP.sendMessage(msg.from, 'Por favor permitanos un momento, en un asesor lo atendera, gracias ');
      }

      // ! VALIDA TERMINO ARBOL OUT
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_OUTBOUND' && msg.type === 'list_response') {
        let idArbol = await Gestion.select_id_arbol_by_number(numero_chat);
        console.log('LLEGA EL ARBOL ', idArbol, resultadosss[0].PKGES_CODIGO);
        if (msg.body === 'Si') {
          let updateByName = await Gestion.update_gestion(idArbol, 'MSG_FIN', msg.body, 'GES_CMSGOUTBOUND');
          clientWP.sendMessage(msg.from, 'Por favor permitanos un momento, un asesor en unos minutos lo atendera, gracias');
        } else {
          let updateByName = await Gestion.cerrarOutbound(idArbol, msg.body);
          clientWP.sendMessage(msg.from, 'Gracias por su atencion, que tengas un buen dia');
        }
      }
      // ? VALIDAR RESPONIO LA LISTA MSG_EPS
      else if (resultadosss[0].GES_CULT_MSGBOT == 'MSG_OUTBOUND' && msg.type !== 'list_response') {
        clientWP.sendMessage(msg.from, 'Por Favor selecciona una opcion de la lista');
      }

      // ocasion para cuando el cliente esta en cola de espera le responde esto
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
      // TODO ocasion para cuando ya se asigna el arbol, el bot solo pone en la BD.
      else if (resultadosss[0].FKGES_NPER_CODIGO != null && resultadosss[0].GES_ESTADO_CASO != null && resultadosss[0].GES_CULT_MSGBOT == 'MSG_FIN') {
        let id_gestion = await Gestion.get_id_by_numero(numero_chat);
        console.log('si entro cuando ya no son nulos jajajaja');
        await Mensaje.insert_mensaje(id_gestion, numero_chat, msg.body, 'chat');
      }
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

async function initEncuesta() {
  setTimeout(async () => {
    // ENCUESTAR
    let chatsCerrado = await Gestion.getChatsCerrado();
    if (chatsCerrado)
      if (chatsCerrado.GES_CULT_MSGBOT === 'MSG_FIN' && chatsCerrado.GES_CENCUESTA === 'ENCUESTAR') {
        console.log('Enviando Encuesta ->', chatsCerrado.PKGES_CODIGO);
        await Gestion.update_gestion(chatsCerrado.PKGES_CODIGO, 'MSG_ENCUESTAP1', '', 'GES_CDETALLE14');

        const options = [{ title: 'Si' }, { title: 'No' }];
        const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
        const lista = new List(`El asesor resolvió tu solicitud:`, 'Seleccione una opción', menu);
        clientWP.sendMessage(`${chatsCerrado.GES_NUMERO_COMUNICA}@c.us`, lista);
      }
    initEncuesta();
  }, 5000);
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

function MensajeChat(Mensajes, Chat) {
  if (Mensajes[0] !== undefined) {
    if (Mensajes[0].id.fromMe == false && Chat.unreadCount > 0) {
      console.log('**************************** Recuperar', Chat.id.user);
      clientWP.sendMessage(Chat.id._serialized, 'Reenvia el ultimo mensaje');
    }
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
  const mensajeMasivo = async () => {
    try {
      let chatPorEnviar = await Outbound.porEnviar();
      // * Validar si hay un mensaje Outbound por enviar
      if (chatPorEnviar) {
        // * Enviar Mensaje Outbound
        clientWP.sendMessage(`${chatPorEnviar.OUT_NUMERO_COMUNICA}@c.us`, chatPorEnviar.OUT_CULT_MSGBOT).then(async (res) => {
          // * Enviar lista si desea el cliente hablar con un agente
          const options = [{ title: 'Si' }, { title: 'No' }];
          const menu = [{ title: 'Por favor seleccione una opción de esta lista', rows: options }];
          const lista = new List('¿Desea comunicarse con un Agente?', 'Seleccione una opción', menu);
          clientWP.sendMessage(`${chatPorEnviar.OUT_NUMERO_COMUNICA}@c.us`, lista);
          // * Despues de enviar se actualiza el registro y se registra en tabla tbl_gestion
          await Outbound.actualizar(chatPorEnviar.PKOUT_CODIGO);
          await Gestion.insert_gestion(chatPorEnviar.OUT_NUMERO_COMUNICA, 'MSG_OUTBOUND', 'Activo', chatPorEnviar.PKOUT_CODIGO);
          console.log('Envio Masivo', chatPorEnviar.OUT_NUMERO_COMUNICA);
        });
      }

      // ? Repito
      setTimeout(() => {
        mensajeMasivo();
      }, 15000);
    } catch (error) {
      console.log(error);
    }
  };
  mensajeMasivo();
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
setInterval(async function closeCaseswithoutTerms() {
  var fecha = new Date();
  var hora_actual = fecha.getHours();

  let chatsConBot = await Gestion.getNoResolvedCases();
  // console.log(chatsConBot.length);
  chatsConBot.forEach(async (chat) => {
    let ultimaHoraChat = parseInt(new Date(chat.GES_CFECHA_MODIFICACION).toLocaleString().split(' ')[1].split(':')[0]);
    if (hora_actual - ultimaHoraChat >= 4) {
      console.log(chatsConBot.length, 'Se cierra el chat por inactividad');
      await Gestion.update_gestion_No_Answered(chat.PKGES_CODIGO);
    }
  });
}, 600000);
