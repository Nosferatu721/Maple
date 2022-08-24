document.addEventListener('DOMContentLoaded', () => {
  ///*************************************APARTADO DE VAIRABLES**************************///
  var lenOriginal = 0;
  var lengAux = 0;
  var lenOriginal2 = 0;
  var lengAux2 = 0;
  var lenOriginal3 = 0;
  var lengAux3 = 0;
  var idPer = 0;
  var lenOriginalOut = 0;
  var lengAuxOut = 0;
  var number1 = 0;
  var number2 = 0;
  var number3 = 0;
  var contadorMensjNew = 0;
  var contadorMensjNew2 = 0;
  var msjConcatenado = '';
  var msjConcatenado2 = '';
  var msjConcatenado3 = '';
  var contadorMensjNew3 = 0;
  var auxState = 0;
  let state = false;
  var idArbol = 0;
  var idArbol2 = 0;
  var idArbol3 = 0;
  let countMessagesChat1 = 0;
  var numberRecepcion = 0;
  let countMessagesChat2 = 0;

  let countMessagesChat3 = 0;
  var fechassschat1;
  var valuechat1;

  var fechassschat2;
  var valuechat2;

  var fechassschat3;
  var valuechat3;

  let infoChatBotInit = null;

  //const chat_313481 = document.getElementById('chat_313481'),
  const chat = document.getElementById('chat');

  var elems = document.querySelectorAll('select');

  var instances = M.FormSelect.init(elems);

  ///*************************************APARTADO DE SELECTS E INPUTS*****************************//
  // BOTONES E INPUTS
  inputMensaje1 = document.getElementById('inputMensaje1');
  btnEnvioMensaje_1 = document.getElementById('btnEnvioMensaje_1');
  inputMensaje2 = document.getElementById('inputMensaje2');
  inputMensaje3 = document.getElementById('inputMensaje3');
  btnEnvioMensaje_3 = document.getElementById('btnEnvioMensaje_3');
  //SELECTS DEL MODAL GRANDE
  auxState = document.querySelector('.estados');

  selectChat1 = document.getElementById('registryChat1');
  selectChat2 = document.getElementById('registryChat2');
  selectChat3 = document.getElementById('registryChat3');
  //BOTON BUSCAR NUMERO

  btnBuscarNum1 = document.getElementById('searchRegistryChat1');
  btnBuscarNum2 = document.getElementById('searchRegistryChat2');
  btnBuscarNum3 = document.getElementById('searchRegistryChat3');
  //BOTON REALIZAR BUSQUEDA
  btnSelectNum1 = document.getElementById('buscarChat1');
  btnSelectNum2 = document.getElementById('buscarChat2');
  btnSelectNum3 = document.getElementById('buscarChat3');

  //BOTON DE LLAMADO DEL MODAL
  closeChat1 = document.getElementById('closeChat1');
  closeChat2 = document.getElementById('closeChat2');
  closeChat3 = document.getElementById('closeChat3');
  //para crear chats
  createChat1 = document.getElementById('createChat1');
  createChat2 = document.getElementById('createChat2');
  createChat3 = document.getElementById('createChat3');

  //boton dentro del modal que los crea
  crearChat1 = document.getElementById('crearChat1');
  crearChat2 = document.getElementById('crearChat2');
  crearChat3 = document.getElementById('crearChat3');

  cleanChat1 = document.getElementById('limpiarConsultaChat1');
  cleanChat2 = document.getElementById('limpiarConsultaChat2');
  cleanChat3 = document.getElementById('limpiarConsultaChat3');

  // * Botones Mostrar PLantillas
  let getPlantillas1 = document.getElementById('getPlantillas1');
  let getPlantillas2 = document.getElementById('getPlantillas2');
  let getPlantillas3 = document.getElementById('getPlantillas3');

  tipificacion1 = document.getElementById('tipification1');
  subtipificacion1 = document.getElementById('subtipification1');

  tipificacion2 = document.getElementById('tipification2');
  subtipificacion2 = document.getElementById('subtipification2');

  tipificacion3 = document.getElementById('tipification3');
  subtipificacion3 = document.getElementById('subtipification3');

  cargarLoader('Espere por favor...');

  setTimeout(() => {
    ocultarLoader();
  }, 5000);

  //SIEMPRE QUE ENTRE EL USUARIO VA A ESTAR ACTVIO PERO PRIMERO DEBE VALIDAR SI TIENE UN ESTADO ANTERIOR
  //SI ES NULO SIGNIFICA QUE NO SE LE HA ASIGNADO NADA Y LO PONE COMO EN ESTADO ACTIVO
  //SI SIGNIFICA QUE SI REFRESCA LA PÁGINA NO VA A PERDER EL ESTADO EN EL QUE ESTA, DE OTRA FORMA LO ASIGNA EN ACTIVO
  if (localStorage.getItem('estadoUser') != null) {
    console.log('YA TIENE UN ESTADO CON ANTERIORIDAD');
  } else {
    let ACTIVO = 'ACTIVO';
    localStorage.setItem('estadoUser', ACTIVO);
  }

  //OBTENGO EL ID DEL USUARIO QUE SE LOGUEÓ
  function getId() {
    getData('/GECA/getId').then((res) => {
      idPer = res.idPer;
      console.log('CODEE>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', idPer);
      if (localStorage.getItem('estadoUser') != null) {
        console.log('YA TIENE UN ESTADO CON ANTERIORIDAD');
      } else {
        let ACTIVO = 'ACTIVO';
        localStorage.setItem('estadoUser', ACTIVO);
        console.log('ENVIANDO PARA CAMBIO DE AUXILIAR', 'ID DEL USUARIO', idPer, 'AUXILIAR', ACTIVO);
        postData('/samaritana/cambioEstado', { PKPER_NCODIGO: idPer, PER_AUXILIAR: ACTIVO }).then((result) => {
          console.log(result);
        });
      }
    });
  }
  getId();

  // VERIFICA SI TIENE CHATS ASIGNADOS
  //CONSTA DE DOS PARTES, UN SELECT QUE ELIGE UN CAMPO QUE CUMPLA CON LOS REQUISITOS Y UN UPDATE
  //QUE ACTUALIZA LOS CAMPOS
  const ChatsAsignados = () => {
    console.log('Asignando');
    //REALIZA UNA CONSULTA PARA VERIFICAR CON ESE NUMERO LOS MENSAJES RECIBDIDOS
    postData('http://172.70.7.70:5032/chatsAsignados', { PKPER_NCODIGO: idPer }).then(async (res) => {
      localStorage.setItem('cantidad', res.contador);
      let cantidad = localStorage.getItem('cantidad');
      if (res.contador < 3 && localStorage.getItem('estadoUser') === 'ACTIVO') {
        // console.log('ESTOY ENTRANDO AL IFFFFFFFFFFFFFFFFFFF');
        if (localStorage.getItem('number1') === null) {
          // console.log('@@@@@@@@@ENTRO ASIGNO AL CHAT1');
          postData('http://172.70.7.70:5032/asignacionSelect').then(async (res) => {
            if (res.result.length === 0) return;
            if (res.result[0].GES_CMSGOUTBOUND === 'Si') {
              console.log(res);
              let idArboll = res.result[0].PKGES_CODIGO;
              numberRecepcion = res.result[0].GES_NUMERO_COMUNICA;
              //let ultMSJ = mensaje.GES_CDETALLE;
              let mensajeBienvenida = 'Tiene un nuevo cliente en este chat';
              // console.log('************************ESTE ES EL MENSAJE', mensaje);
              idArbol = idArboll;
              let msjConcatenadoo = mensajeBienvenida + '<br>' + '<b>Este es un chat Outbound</b> - Cargue: ' + res.outbound.OUT_CDETALLE1 +'<br>';
              msjConcatenadoo = msjConcatenadoo + '<b>Mensaje Masivo Enviado:</b><br><i>' + res.outbound.OUT_CULT_MSGBOT + '</i>';

              asignacion(idPer, idArbol);
              //    console.log('##################este es el', numberRecepcion);

              localStorage.setItem('number1', numberRecepcion);
              localStorage.setItem('Msj1', msjConcatenadoo);
              localStorage.setItem('arbol1', idArboll);
              Toast.fire({ icon: 'info', title: 'Tiene un nuevo usuario en el chat 1' });
            } else {
              res.result.forEach(async (mensaje) => {
                infoChatBotInit =
                `
                <b>Nombre:</b> ${mensaje.GES_CDETALLE3} ` +
                  '<br>' +
                  `
                <b>Parentesco:</b> ${mensaje.GES_CDETALLE4} ` +
                  '<br>' +
                  `
                <b>Tipo Documento:</b> ${mensaje.GES_CDETALLE5} ` +
                  '<br>' +
                  `
                <b>N° Documento:</b> ${mensaje.GES_CDETALLE6} ` +
                  '<br>' +
                  `
                <b>Numeros de Contacto:</b> ${mensaje.GES_CDETALLE7} ` +
                  '<br>' +
                  `
                <b>Ciudad:</b> ${mensaje.GES_CDETALLE8} ` +
                  '<br>' +
                  `
                <b>EPS:</b> ${mensaje.GES_CDETALLE9} ` +
                  '<br>' +
                  `
                <b>Sede:</b> ${mensaje.GES_CDETALLE10} ` +
                  '<br>' +
                  `
                <b>Solicitud Principal Cliente:</b> ${mensaje.GES_CDETALLE11} ` +
                  '<br>' +
                  `
                <b>Solicitud Secundaria Cliente:</b> ${mensaje.GES_CDETALLE12} ` +
                  '<br>' +
                  `
              `;
                let idArboll = mensaje.PKGES_CODIGO;
                numberRecepcion = mensaje.GES_NUMERO_COMUNICA;
                //let ultMSJ = mensaje.GES_CDETALLE;
                let mensajeBienvenida = 'Tiene un nuevo cliente en este chat';
                // console.log('************************ESTE ES EL MENSAJE', mensaje);
                idArbol = idArboll;
                let msjConcatenadoo = mensajeBienvenida + '<br>' + infoChatBotInit;

                asignacion(idPer, idArbol);
                //    console.log('##################este es el', numberRecepcion);

                localStorage.setItem('number1', numberRecepcion);
                localStorage.setItem('Msj1', msjConcatenadoo);
                localStorage.setItem('arbol1', idArboll);
                Toast.fire({ icon: 'info', title: 'Tiene un nuevo usuario en el chat 1' });
              });
            }
          });

          //        numberRecepcion=0;
        } else if (localStorage.getItem('number2') === null) {
          postData('http://172.70.7.70:5032/asignacionSelect').then(async (res) => {
            if (res.result.length === 0) return;
            if (res.result[0].GES_CMSGOUTBOUND === 'Si') {
              let idArboll = res.result[0].PKGES_CODIGO;
              numberRecepcion = res.result[0].GES_NUMERO_COMUNICA;
              //let ultMSJ = mensaje.GES_CDETALLE;
              let mensajeBienvenida = 'Tiene un nuevo cliente en este chat';
              // console.log('************************ESTE ES EL MENSAJE', mensaje);
              idArbol = idArboll;
              let msjConcatenadoo = mensajeBienvenida + '<br>' + '<b>Este es un chat Outbound</b> - Cargue: ' + res.outbound.OUT_CDETALLE1 +'<br>';
              msjConcatenadoo = msjConcatenadoo + '<b>Mensaje Masivo Enviado:</b><br><i>' + res.outbound.OUT_CULT_MSGBOT + '</i>';

              asignacion(idPer, idArbol);
              //    console.log('##################este es el', numberRecepcion);

              localStorage.setItem('number2', numberRecepcion);
              localStorage.setItem('Msj2', msjConcatenadoo);
              localStorage.setItem('arbol2', idArboll);
              Toast.fire({ icon: 'info', title: 'Tiene un nuevo usuario en el chat 2' });
            } else {
              res.result.forEach((mensaje) => {
                infoChatBotInit =
                `
                <b>Nombre:</b> ${mensaje.GES_CDETALLE3} ` +
                  '<br>' +
                  `
                <b>Parentesco:</b> ${mensaje.GES_CDETALLE4} ` +
                  '<br>' +
                  `
                <b>Tipo Documento:</b> ${mensaje.GES_CDETALLE5} ` +
                  '<br>' +
                  `
                <b>N° Documento:</b> ${mensaje.GES_CDETALLE6} ` +
                  '<br>' +
                  `
                <b>Numeros de Contacto:</b> ${mensaje.GES_CDETALLE7} ` +
                  '<br>' +
                  `
                <b>Ciudad:</b> ${mensaje.GES_CDETALLE8} ` +
                  '<br>' +
                  `
                <b>EPS:</b> ${mensaje.GES_CDETALLE9} ` +
                  '<br>' +
                  `
                <b>Sede:</b> ${mensaje.GES_CDETALLE10} ` +
                  '<br>' +
                  `
                <b>Solicitud Principal Cliente:</b> ${mensaje.GES_CDETALLE11} ` +
                  '<br>' +
                  `
                <b>Solicitud Secuindaria Cliente:</b> ${mensaje.GES_CDETALLE12} ` +
                  '<br>' +
                  `
              `;
                let idArboll = mensaje.PKGES_CODIGO;
                numberRecepcion = mensaje.GES_NUMERO_COMUNICA;
                //let ultMSJ = mensaje.GES_CDETALLE;
                let mensajeBienvenida = 'Tiene un nuevo cliente en este chat';
                idArbol2 = idArboll;
                let msjConcatenadoo = mensajeBienvenida + '<br>' + infoChatBotInit;

                asignacion(idPer, idArbol2);
                //    console.log('##################este es el numero', numberRecepcion);
                localStorage.setItem('arbol2', idArboll);
                localStorage.setItem('number2', numberRecepcion);
                localStorage.setItem('Msj2', msjConcatenadoo);
                Toast.fire({ icon: 'info', title: 'Tiene un nuevo usuario en el chat 2' });
              });
            }
          });
        } else if (localStorage.getItem('number3') === null) {
          postData('http://172.70.7.70:5032/asignacionSelect').then(async (res) => {
            if (res.result.length === 0) return;
            if (res.result[0].GES_CMSGOUTBOUND === 'Si') {
              let idArboll = res.result[0].PKGES_CODIGO;
              numberRecepcion = res.result[0].GES_NUMERO_COMUNICA;
              //let ultMSJ = mensaje.GES_CDETALLE;
              let mensajeBienvenida = 'Tiene un nuevo cliente en este chat';
              // console.log('************************ESTE ES EL MENSAJE', mensaje);
              idArbol = idArboll;
              let msjConcatenadoo = mensajeBienvenida + '<br>' + '<b>Este es un chat Outbound</b> - Cargue: ' + res.outbound.OUT_CDETALLE1 +'<br>';
              msjConcatenadoo = msjConcatenadoo + '<b>Mensaje Masivo Enviado:</b><br><i>' + res.outbound.OUT_CULT_MSGBOT + '</i>';

              asignacion(idPer, idArbol);
              //    console.log('##################este es el', numberRecepcion);

              localStorage.setItem('number3', numberRecepcion);
              localStorage.setItem('Msj3', msjConcatenadoo);
              localStorage.setItem('arbol3', idArboll);
              Toast.fire({ icon: 'info', title: 'Tiene un nuevo usuario en el chat 3' });
            } else {
              res.result.forEach((mensaje) => {
                infoChatBotInit =
                `
                <b>Nombre:</b> ${mensaje.GES_CDETALLE3} ` +
                  '<br>' +
                  `
                <b>Parentesco:</b> ${mensaje.GES_CDETALLE4} ` +
                  '<br>' +
                  `
                <b>Tipo Documento:</b> ${mensaje.GES_CDETALLE5} ` +
                  '<br>' +
                  `
                <b>N° Documento:</b> ${mensaje.GES_CDETALLE6} ` +
                  '<br>' +
                  `
                <b>Numeros de Contacto:</b> ${mensaje.GES_CDETALLE7} ` +
                  '<br>' +
                  `
                <b>Ciudad:</b> ${mensaje.GES_CDETALLE8} ` +
                  '<br>' +
                  `
                <b>EPS:</b> ${mensaje.GES_CDETALLE9} ` +
                  '<br>' +
                  `
                <b>Sede:</b> ${mensaje.GES_CDETALLE10} ` +
                  '<br>' +
                  `
                <b>Solicitud Principal Cliente:</b> ${mensaje.GES_CDETALLE11} ` +
                  '<br>' +
                  `
                <b>Solicitud Secuindaria Cliente:</b> ${mensaje.GES_CDETALLE12} ` +
                  '<br>' +
                  `
              `;
                let mensajeBienvenida = 'Tiene un nuevo cliente en este chat';
                let idArboll = mensaje.PKGES_CODIGO;
                numberRecepcion = mensaje.GES_NUMERO_COMUNICA;
                //let ultMSJ = mensaje.GES_CDETALLE;

                idArbol3 = idArboll;
                let msjConcatenadoo = mensajeBienvenida + '<br>' + infoChatBotInit;

                asignacion(idPer, idArbol3);
                //   console.log('##################este es el numero', numberRecepcion);

                localStorage.setItem('number3', numberRecepcion);
                localStorage.setItem('Msj3', msjConcatenadoo);
                localStorage.setItem('arbol3', idArboll);
                Toast.fire({ icon: 'info', title: 'Tiene un nuevo usuario en el chat 3' });
              });
            }
          });
        } else {
          //console.log("##################NUMBER1 QUEDO COMO",number1);
          // console.log('NO PASA NAHHHH');
        }
      } else {
        //  console.log('TERMINE LA GESTION ');
      }
    });

    // ! Repeat
    setTimeout(() => {
      ChatsAsignados();
    }, 8000);
  };
  ChatsAsignados();
  //ESTA FUNCION RECIBE EL ID DEL USUARIO Y EL ID DEL ARBOL, AQUI SE HACE LA ASIGNACION OSEA EL UPDATE
  async function asignacion(myID, IDTree) {
    let x = await postData('http://172.70.7.70:5032/asignacionUpdate', { PKGES_CODIGO: IDTree, FKGES_NPER_CODIGO: myID });
    return x;
  }

  //LEGADA DE TRANSFERENCIA, DESPUES DE CONSULTAR QUE TODO ESTA OK, PROCEDO A
  // DISTRIBUIR LOS NUMEROS EN EL GRID, ENTONCES PRIMERO AISGNO EN EL DIV DE ARRIBA EL NUMERO
  //CAMBIO LAS CLASES.

  let chat1Init = 'chat_1';
  let chat1Init2 = 'chat_2';
  let chat1Init3 = 'chat_3';
  setInterval(function cambio_ids() {
    console.log('Interval');
    //ACA PINTO LOS NUMEROS Y SUS ID
    //OBTENGO LAS VARIABLES DEL LOCAL STORAGE
    number1 = localStorage.getItem('number1');
    number2 = localStorage.getItem('number2');
    number3 = localStorage.getItem('number3');
    //console.log('EL COMPILADO DE NUMEROS ES ', number1, number2, number3);
    // AQUI CAMBIO LOS ID DE LOS GRID PERO COMO SE CAMBIAN AL EJECUTARSE POR PRIMERA VEZ ESTA FUNC
    //LO QUE HACE ENTONCES ES ES VERIFICAR CUANDO CAMBIO Y ASIGNAR DE NUEVO EL ID CUANDO HAYA CAMBIADO
    // console.log(chat1Init, number1);
    if (chat1Init != number1) {
      document.getElementById(chat1Init).id = number1;
      chat1Init = number1;
    }
    if (chat1Init2 != number2) {
      document.getElementById(chat1Init2).id = number2;
      chat1Init2 = number2;
    }
    if (chat1Init3 != number3) {
      document.getElementById(chat1Init3).id = number3;
      chat1Init3 = number3;
    }

    // PINTO EN EL DIV LOS NUMEROS
    if (number1 != 0) {
      document.getElementById('numero_chat1').innerHTML = number1;
    }
    if (number2 != 0) {
      document.getElementById('numero_chat2').innerHTML = number2;
    }

    if (number3 != 0) {
      document.getElementById('numero_chat3').innerHTML = number3;
    }

    // console.log('EL ID  DEL ARBOL1 ES ', idArbol);
    // console.log('EL ID  DEL ARBOL2 ES ', idArbol2);
    //console.log('EL ID  DEL ARBOL3 ES ', idArbol3);

    //document.getElementById('chat_2').id = number2;

    //document.getElementById('chat_3').id = number3;

    //numero1.innerHTML=number1;
  }, 5000);

  ///ESTAS 3 FUNCIONES SON LAS ENCARGADAS DE REALIZAR LA TOMA INICIAL DEL TAMAÑO DEL ARREGLO
  //TOMA EL TAMAÑO DE UN ARREGLO QUE CONSULTA LOS MENSAJES UNICAMENTE "RECIBIDOS"
  //ESTO SE HACE PARA NOTIFICAR EL SONIDO Y EL NUMERO DE MENSAJES
  setTimeout(function sizeMensajesOrigenChat1() {
    //console.log('entre al tamaño de la funcion size mensaje');
    //console.log('desde el size decimos que el numero 1 es  ', number1);
    postData('http://172.70.7.70:5033/consultaMensajesOrigen', { MEN_NUMERO_DESTINO: number1 }).then((res) => {
      let lengthData = 0;
      res.result.forEach((mensaje) => {
        lengthData += 1;
      });

      lenOriginal = lengthData;
    });
  }, 2000);
  setTimeout(function sizeMensajesOrigenChat2() {
    postData('http://172.70.7.70:5033/consultaMensajesOrigen', { MEN_NUMERO_DESTINO: number2 }).then((res) => {
      let lengthData = 0;
      res.result.forEach((mensaje) => {
        lengthData += 1;
      });

      lenOriginal2 = lengthData;
    });
  }, 2000);
  setTimeout(function sizeMensajesOrigenChat3() {
    postData('http://172.70.7.70:5033/consultaMensajesOrigen', { MEN_NUMERO_DESTINO: number3 }).then((res) => {
      let lengthData = 0;
      res.result.forEach((mensaje) => {
        lengthData += 1;
      });

      lenOriginal3 = lengthData;
    });
  }, 2000);
  function notificar() {
    var sonido = new Audio('/audio/soundWpp.mp3');
    sonido.play();
  }
  //cambio_ids();

  // sizeMensajesOrigenChat1();
  // sizeMensajesOrigenChat2();
  //sizeMensajesOrigenChat3();

  //LISTENER ENCARGADO DE ESCUCHAR CUANDO SE CAMBIA UN TAB EN LA PLATAFORMA, CUANDO SE CAMBIA A OTRA TAB
  //REALIZA UN CAMBIO DE BOOLEANO EN LA VARIABLE STATE, TRUE CUANDO CAMBIA--) FALSE CUANDO NO CAMBIA
  document.addEventListener('visibilitychange', function () {
    console.log(document.hidden);
    state = document.hidden;
  });

  const refreshMessagesChat1 = () => {
    //CHAT1
    //OBTENEMOS EL NUMERO DEL PRIMER GRID DONDE SE VA A ESCRIBIR
    //LA FUNCIÓN EXPLICADA AQUI SE VALIDA PARA LAS OTRAS DOS POR LO CUAL NO ES NECESARIO EXPLICAR SU PROCEDIMIENTO
    let chat_1 = document.getElementById(number1);
    //FUNCION RECURRENTE QUE VA A CONSULTAR LOS MENSAJES QUE SE ESCRIBIERON
    //POSEE OTRAS FUNCIONES COMO LAS NOTIFICACIONES DE CUANDO LLEGA UN NUEVO MENSAJE
    //REALIZA UNA CONSULTA PARA VERIFICAR CON ESE NUMERO LOS MENSAJES RECIBDIDOS
    postData('http://172.70.7.70:5033/consultaMensajesOrigen', { MEN_NUMERO_DESTINO: number1 }).then((res) => {
      let lengthData = 0;
      res.result.forEach((mensaje) => {
        lengthData += 1;
      });
      //GUARDA EL LENGTH DE LA CONSULTA CONSTANTE CON EL FIN DE COMPARARLA CON LA INICIAL
      lengAux = lengthData;
    });
    // console.log('ESTE ES EL MENSAJE', state);
    //LLEGADOS A ESTE PUNTO LAS FUNCIONES AQUI ABAJO LO QUE REALIZAN ES
    //UNA VALIDACION DE SI CAMBIO EL LENGTH DE LOS MENSAJES Y VERIFICA SI SE CAMBIO LA PESTAÑA

    if (lenOriginal != lengAux && state == false) {
      //ESTA FUNCION SOLO MUESTRA SONIDO SINO SE CAMBIO LA PESTAÑA
      console.log('me llego algo nuevo');
      notificar();
      lenOriginal = lengAux;
    } else if (lenOriginal != lengAux && state == true) {
      //ESTA FUNCION MUESTRA SONIDO Y HACE LA SUMA DE CUANTOS MENSAJES HAN LLEGADO, COMO SE SABE
      //EL LENGTH SOLO TRAE UN MENSAJE DE MAS, UNO A LA VEZ POR LO CUAL SE PUEDE SUMAR  LA CANTIDAD
      //DE VECES QUE ENTRA A ESTE CONDICIONAL
      console.log('cambio');
      console.log('me llego algo nuevo');
      notificar();
      contadorMensjNew += 1;
      lenOriginal = lengAux;

      document.title = `Mensajes nuevos(${contadorMensjNew})`;
    } else if (lenOriginal == lengAux && state == false) {
      //CAMBIAMOS A EL TITULO ORIGINAL Y LIMPIAMOS LA VARIABLE, NORMALMENTE DESPUES DE NAVEGAR
      //EN OTRAS PESTAÑAS Y VOLVER A ESTA SE CAMBIAN LOS MENSAJES PENDIENTES Y SE DEJA EL TITULO ORIGINAL
      contadorMensjNew = 0;
      //console.log('dentro del else ');
      document.title = 'Transferencias';
    }
    //ESTE OTRO POSTDATA LO QUE HACE ES VERIFICAR TODOS LOS NUMEROS Y DEPENDIENDO DEL TIPO SE VERIFICA
    //SI ES RECIBIDO O ENVIADO Y LOS PINTA EN EL HTML
    //lo declaro no global para evitar que se ponga en 0 cada vez que refresco
    let arboll1 = localStorage.getItem('arbol1');
    postData('http://172.70.7.70:5033/mensajesChat', { MEN_NUMERO_DESTINO: number1, FK_GES_CODIGO: arboll1 }).then((res) => {
      chat_1.innerHTML = '';
      msjConcatenado = localStorage.getItem('Msj1');
      if (msjConcatenado != null) {
        //console.log('..........................EL MENSAJE CONCATENADO ES..................', msjConcatenado);
        chat_1.innerHTML += `<div class='mensaje_recivido'><span>${msjConcatenado}</span></div>`;

        res.result.forEach((mensaje) => {
          //EXTRAEMOS DATOS DEL JSON
          id = mensaje.PKMEN_NCODIGO;
          menssage = mensaje.MEN_TEXTO;
          fecha = mensaje.MEN_CFECHA_REGISTRO;
          estado = mensaje.MEN_ESTADO_MENSAJE;

          //ARREGLO EL DATO DE LA FECHA
          var hora = fecha.slice(11, 16);

          //VALIDO Y PINTO CON ICONOS EL MENSAJE
          if (estado == 'POR ENVIAR') {
            chat_1.innerHTML += `<div id=${id} class='mensaje_enviado'><span>${menssage} <span>${hora}<i class='bx bx-time-five'></i></span> </span></div>`;
          } else if (estado == 'ENVIADO') {
            chat_1.innerHTML += `<div id=${id} class='mensaje_enviado'><span>${menssage} <span>${hora}<i class='bx bx-check' ></i></span> </span></div>`;
          } else if (estado == 'RECIBIDO') {
            chat_1.innerHTML += `<div class='mensaje_recivido'><span>${menssage}<span>${hora}</span></span></div>`;
          }
        });
        //ACA VALIDAMOS SI EL LENGTH DE LOS MENSAJES CAMBIO Y SI CAMBIO SE HACE UN SCROLL HACIA ABAJO
        //SE HACE UN SCROLL AL INICIO YA QUE DETECTA QUE NO SON IGUALES, PERO LUEGO LAS VARIABLES SE IGUALAN
        // Y YA NO VUELVEN A HACER SCROLL A MENOS QUE LLEGUE UN MENSAJE NUEVO
        if (countMessagesChat1 != res.result.length) {
          console.log('Scrollsito');
          chat_1.scrollTo({
            top: chat_1.scrollHeight,
          });
          countMessagesChat1 = res.result.length;
        } else {
          //console.log('Sin Envios');
        }
      }
    });
    // ! Repeat
    setTimeout(() => {
      refreshMessagesChat1();
    }, 2000);
  };
  setTimeout(() => {
    refreshMessagesChat1();
  }, 5000);

  //CHAT2

  const refreshMessagesChat2 = () => {
    let chat_2 = document.getElementById(number2);
    postData('http://172.70.7.70:5033/consultaMensajesOrigen', { MEN_NUMERO_DESTINO: number2 }).then((res) => {
      let lengthData = 0;
      res.result.forEach((mensaje) => {
        lengthData += 1;
      });

      lengAux2 = lengthData;
    });
    //console.log('EL ESTADO DE LA VENTANA ES ', state);

    if (lenOriginal2 != lengAux2 && state == false) {
      console.log('me llego algo nuevo');
      notificar();
      lenOriginal2 = lengAux2;
    } else if (lenOriginal2 != lengAux2 && state == true) {
      console.log('cambio');

      console.log('me llego algo nuevo');
      notificar();
      lenOriginal2 = lengAux2;
      contadorMensjNew2 += 1;
      document.title = `Mensajes nuevos(${contadorMensjNew2})`;
    } else if (lenOriginal2 == lengAux2 && state == false) {
      contadorMensjNew2 = 0;
      //console.log('dentro del else ');
      document.title = 'Transferencias';
    }
    let arboll2 = localStorage.getItem('arbol2');
    postData('http://172.70.7.70:5033/mensajesChat', { MEN_NUMERO_DESTINO: number2, FK_GES_CODIGO: arboll2 }).then((res) => {
      //lenOriginalOut = obj.result.length;
      chat_2.innerHTML = '';
      msjConcatenado2 = localStorage.getItem('Msj2');
      if (msjConcatenado2 != null) {
        //   console.log('..........................EL MENSAJE CONCATENADO ES..................', msjConcatenado2);
        chat_2.innerHTML += `<div class='mensaje_recivido'><span>${msjConcatenado2}</span></div>`;
        res.result.forEach((mensaje) => {
          id = mensaje.PKMEN_NCODIGO;
          menssage = mensaje.MEN_TEXTO;
          fecha = mensaje.MEN_CFECHA_REGISTRO;
          estado = mensaje.MEN_ESTADO_MENSAJE;

          var hora = fecha.slice(11, 16);
          if (estado == 'POR ENVIAR') {
            chat_2.innerHTML += `<div id=${id} class='mensaje_enviado'><span>${menssage} <span>${hora}<i class='bx bx-time-five'></i></span> </span></div>`;
          } else if (estado == 'ENVIADO') {
            chat_2.innerHTML += `<div id=${id} class='mensaje_enviado'><span>${menssage} <span>${hora}<i class='bx bx-check' ></i></span> </span></div>`;
          } else if (estado == 'RECIBIDO') {
            chat_2.innerHTML += `<div class='mensaje_recivido'><span>${menssage}<span>${hora}</span></span></div>`;
          }

          //console.log(obj);
        });
        if (countMessagesChat2 != res.result.length) {
          console.log('Scrollsito');
          chat_2.scrollTo({
            top: chat_2.scrollHeight,
          });
          countMessagesChat2 = res.result.length;
        } else {
          //console.log('Sin Envios');
        }
      }
    });
    // ! Repeat

    setTimeout(() => {
      refreshMessagesChat2();
    }, 2000);
  };
  setTimeout(() => {
    refreshMessagesChat2();
  }, 5000);

  //CHAT3

  const refreshMessagesChat3 = () => {
    let chat_3 = document.getElementById(number3);
    postData('http://172.70.7.70:5033/consultaMensajesOrigen', { MEN_NUMERO_DESTINO: number3 }).then((res) => {
      let lengthData = 0;
      res.result.forEach((mensaje) => {
        lengthData += 1;
      });

      lengAux3 = lengthData;
    });
    if (lenOriginal3 != lengAux3 && state == false) {
      console.log('me llego algo nuevo');
      notificar();
      lenOriginal3 = lengAux3;
    } else if (lenOriginal3 != lengAux3 && state == true) {
      console.log('cambio');

      console.log('me llego algo nuevo');
      notificar();
      contadorMensjNew3 += 1;
      lenOriginal3 = lengAux3;
      document.title = `Mensajes nuevos(${contadorMensjNew3})`;
    } else if (lenOriginal3 == lengAux3 && state == false) {
      contadorMensjNew3 = 0;
      // console.log('dentro del else ');
      document.title = 'Transferencias';
    }
    let arboll3 = localStorage.getItem('arbol3');
    postData('http://172.70.7.70:5033/mensajesChat', { MEN_NUMERO_DESTINO: number3, FK_GES_CODIGO: arboll3 }).then((res) => {
      //lenOriginalOut = obj.result.length;
      chat_3.innerHTML = '';
      msjConcatenado3 = localStorage.getItem('Msj3');
      if (msjConcatenado3 != null) {
        //console.log('..........................EL MENSAJE CONCATENADO ES..................', msjConcatenado3);
        chat_3.innerHTML += `<div class='mensaje_recivido'><span>${msjConcatenado3}</span></div>`;
        res.result.forEach((mensaje) => {
          id = mensaje.PKMEN_NCODIGO;
          menssage = mensaje.MEN_TEXTO;
          fecha = mensaje.MEN_CFECHA_REGISTRO;
          estado = mensaje.MEN_ESTADO_MENSAJE;

          var hora = fecha.slice(11, 16);
          if (estado == 'POR ENVIAR') {
            chat_3.innerHTML += `<div id=${id} class='mensaje_enviado'><span>${menssage} <span>${hora}<i class='bx bx-time-five'></i></span> </span></div>`;
          } else if (estado == 'ENVIADO') {
            chat_3.innerHTML += `<div id=${id} class='mensaje_enviado'><span>${menssage} <span>${hora}<i class='bx bx-check' ></i></span> </span></div>`;
          } else if (estado == 'RECIBIDO') {
            chat_3.innerHTML += `<div class='mensaje_recivido'><span>${menssage}<span>${hora}</span></span></div>`;
          }

          //console.log(obj);
        });

        if (countMessagesChat3 != res.result.length) {
          console.log('Scrollsito');
          chat_3.scrollTo({
            top: chat_3.scrollHeight,
          });
          countMessagesChat3 = res.result.length;
        } else {
          //console.log('Sin Envios');
        }
      }
    });
    // ! Repeat

    setTimeout(() => {
      refreshMessagesChat3();
    }, 2000);
  };
  setTimeout(() => {
    refreshMessagesChat3();
  }, 5000);
  ///OCULTA BOTONES.
  setInterval(function hidebutton() {
    //console.log("ESTOY CON EL ESTADO",localStorage.getItem('estadoUser'),"y con la cantidad",localStorage.getItem('cantidad'));
    if (localStorage.getItem('estadoUser') == 'ACTIVO' && (localStorage.getItem('cantidad') > 0 || localStorage.getItem('cantidad') == 0)) {
      //console.log("ESTOY ENTRANDO A VALIDAR ELE STADO, ESTA ACTIVO Y CON MAS DE UN CASO");
      document.getElementById('close_session').style.display = 'none';
      closeChat1.style.visibility = 'visible';
      closeChat1.style.display = 'inline';
      closeChat2.style.visibility = 'visible';
      closeChat2.style.display = 'inline';
      closeChat3.style.visibility = 'visible';
      closeChat3.style.display = 'inline';
      document.getElementById('createChat1').style.display = 'none';
      document.getElementById('createChat2').style.display = 'none';
      document.getElementById('createChat3').style.display = 'none';
      //PONEMOS VISIBLES LOS BOTONES DE CERRAR CHATS
      document.getElementById('cerrarChat1').style.display = 'block';
      document.getElementById('cerrarChat2').style.display = 'block';
      document.getElementById('cerrarChat3').style.display = 'block';

      //PONEMOS VISIBLES LOS INPUTS Y SUS BOTONES
      document.getElementById('btnEnvioMensaje_1').style.display = 'visible';
      document.getElementById('btnEnvioMensaje_1').style.display = 'inline';
      document.getElementById('inputMensaje1').style.display = 'visible';
      document.getElementById('inputMensaje1').style.display = 'inline';
      document.getElementById('btnEnvioMensaje_2').style.display = 'visible';
      document.getElementById('btnEnvioMensaje_2').style.display = 'inline';
      document.getElementById('inputMensaje2').style.display = 'visible';
      document.getElementById('inputMensaje2').style.display = 'inline';
      document.getElementById('btnEnvioMensaje_3').style.display = 'visible';
      document.getElementById('btnEnvioMensaje_3').style.display = 'inline';
      document.getElementById('inputMensaje3').style.display = 'visible';
      document.getElementById('inputMensaje3').style.display = 'inline';
      document.getElementById('consultarChat1').style.display = 'none';
      document.getElementById('consultarChat2').style.display = 'none';
      document.getElementById('consultarChat3').style.display = 'none';
      document.getElementById('limpiarConsultaChat1').style.display = 'none';
      document.getElementById('limpiarConsultaChat2').style.display = 'none';
      document.getElementById('limpiarConsultaChat3').style.display = 'none';
    } else if (localStorage.getItem('estadoUser') == 'BREAK' && localStorage.getItem('cantidad') != 0) {
      closeChat1.style.visibility = 'visible';
      closeChat1.style.display = 'inline';
      closeChat2.style.visibility = 'visible';
      closeChat2.style.display = 'inline';
      closeChat3.style.visibility = 'visible';
      closeChat3.style.display = 'inline';
      document.getElementById('createChat1').style.display = 'none';
      document.getElementById('createChat2').style.display = 'none';
      document.getElementById('createChat3').style.display = 'none';
      document.getElementById('limpiarConsultaChat1').style.display = 'none';
      document.getElementById('limpiarConsultaChat2').style.display = 'none';
      document.getElementById('limpiarConsultaChat3').style.display = 'none';
      //console.log("ESTOY ENTRANDO A VALIDAR EL ESTADO, ESTA EN BREAK Y CON MAS DE UN CASO O NINGUN CASOS");
      //document.getElementById('close_session').style.visibility='hidden';
      document.getElementById('close_session').style.display = 'none';
    } else if (localStorage.getItem('estadoUser') == 'BREAK' && localStorage.getItem('cantidad') == 0) {
      //console.log("ESTOY EN VALIDACION DE CANTIDAD 0 Y BREAK");
      // console.log("ESTOY ENTRANDO A VALIDAR EL ESTADO, ESTA EN BREAK Y CON MAS DE UN CASO O NINGUN CASOS");
      //document.getElementById('close_session').style.visibility='hidden';
      document.getElementById('closeChat1').style.display = 'none';
      document.getElementById('closeChat2').style.display = 'none';
      document.getElementById('closeChat3').style.display = 'none';
      document.getElementById('close_session').style.display = 'none';

      document.getElementById('createChat1').style.display = 'none';
      document.getElementById('createChat2').style.display = 'none';
      document.getElementById('createChat3').style.display = 'none';

      document.getElementById('consultarChat1').style.display = 'none';
      document.getElementById('consultarChat2').style.display = 'none';
      document.getElementById('consultarChat3').style.display = 'none';

      document.getElementById('limpiarConsultaChat1').style.display = 'none';
      document.getElementById('limpiarConsultaChat2').style.display = 'none';
      document.getElementById('limpiarConsultaChat3').style.display = 'none';
    } else if (localStorage.getItem('estadoUser') == 'ALMUERZO' && localStorage.getItem('cantidad') == 0) {
      //console.log("ESTOY EN VALIDACION DE CANTIDAD 0 Y ALMUERZO");
      // console.log("ESTOY ENTRANDO A VALIDAR EL ESTADO, ESTA EN ALMUERZO Y CON MAS DE UN CASO O NINGUN CASOS");
      //document.getElementById('close_session').style.visibility='hidden';
      document.getElementById('closeChat1').style.display = 'none';
      document.getElementById('closeChat2').style.display = 'none';
      document.getElementById('closeChat3').style.display = 'none';
      document.getElementById('close_session').style.display = 'none';

      document.getElementById('createChat1').style.display = 'none';
      document.getElementById('createChat2').style.display = 'none';
      document.getElementById('createChat3').style.display = 'none';

      document.getElementById('consultarChat1').style.display = 'none';
      document.getElementById('consultarChat2').style.display = 'none';
      document.getElementById('consultarChat3').style.display = 'none';

      document.getElementById('limpiarConsultaChat1').style.display = 'none';
      document.getElementById('limpiarConsultaChat2').style.display = 'none';
      document.getElementById('limpiarConsultaChat3').style.display = 'none';
    } else if (localStorage.getItem('estadoUser') == 'TURNO CERRADO' && localStorage.getItem('cantidad') == 0) {
      document.getElementById('closeChat1').style.display = 'none';
      document.getElementById('closeChat2').style.display = 'none';
      document.getElementById('closeChat3').style.display = 'none';
      document.getElementById('close_session').style.visibility = 'visible';
      document.getElementById('close_session').style.display = 'inline';

      document.getElementById('createChat1').style.display = 'none';
      document.getElementById('createChat2').style.display = 'none';
      document.getElementById('createChat3').style.display = 'none';
    } else if (localStorage.getItem('estadoUser') == 'ACTIVO_ENVIO_MENSAJES' && localStorage.getItem('cantidad') == 0) {
      //PONEMOS VISIBLES LOS BOTONES AZULES DE CREAR CHATS
      document.getElementById('close_session').style.display = 'none';
      document.getElementById('createChat1').style.display = 'block';

      document.getElementById('createChat2').style.display = 'block';

      document.getElementById('createChat3').style.display = 'block';
      //PONEMOS VISIBLES LOS BOTONES DE CERRAR CHATS
      document.getElementById('cerrarChat1').style.display = 'block';
      document.getElementById('cerrarChat2').style.display = 'block';
      document.getElementById('cerrarChat3').style.display = 'block';

      //PONEMOS VISIBLES LOS INPUTS Y SUS BOTONES
      document.getElementById('btnEnvioMensaje_1').style.display = 'visible';
      document.getElementById('btnEnvioMensaje_1').style.display = 'inline';
      document.getElementById('inputMensaje1').style.display = 'visible';
      document.getElementById('inputMensaje1').style.display = 'inline';
      document.getElementById('btnEnvioMensaje_2').style.display = 'visible';
      document.getElementById('btnEnvioMensaje_2').style.display = 'inline';
      document.getElementById('inputMensaje2').style.display = 'visible';
      document.getElementById('inputMensaje2').style.display = 'inline';
      document.getElementById('btnEnvioMensaje_3').style.display = 'visible';
      document.getElementById('btnEnvioMensaje_3').style.display = 'inline';
      document.getElementById('inputMensaje3').style.display = 'visible';
      document.getElementById('inputMensaje3').style.display = 'inline';

      document.getElementById('consultarChat1').style.display = 'none';
      document.getElementById('consultarChat2').style.display = 'none';
      document.getElementById('consultarChat3').style.display = 'none';

      document.getElementById('limpiarConsultaChat1').style.display = 'none';
      document.getElementById('limpiarConsultaChat2').style.display = 'none';
      document.getElementById('limpiarConsultaChat3').style.display = 'none';
    } else if (localStorage.getItem('estadoUser') == 'CONSULTA CHAT' && localStorage.getItem('cantidad') == 0) {
      document.getElementById('close_session').style.display = 'none';
      document.getElementById('btnEnvioMensaje_1').style.display = 'none';
      document.getElementById('inputMensaje1').style.display = 'none';
      document.getElementById('btnEnvioMensaje_2').style.display = 'none';
      document.getElementById('inputMensaje2').style.display = 'none';
      document.getElementById('btnEnvioMensaje_3').style.display = 'none';
      document.getElementById('inputMensaje3').style.display = 'none';
      //BOTONES MODALES DE CREAR Y CERRAR SE DEBEN OCULTAR TAMBIEN
      document.getElementById('cerrarChat1').style.display = 'none';
      document.getElementById('cerrarChat2').style.display = 'none';
      document.getElementById('cerrarChat3').style.display = 'none';

      document.getElementById('createChat1').style.display = 'none';
      document.getElementById('createChat2').style.display = 'none';
      document.getElementById('createChat3').style.display = 'none';

      document.getElementById('consultarChat1').style.display = 'block';
      document.getElementById('consultarChat2').style.display = 'block';
      document.getElementById('consultarChat3').style.display = 'block';

      document.getElementById('limpiarConsultaChat1').style.display = 'block';
      document.getElementById('limpiarConsultaChat2').style.display = 'block';
      document.getElementById('limpiarConsultaChat3').style.display = 'block';
    }
  }, 1000);

  //METODOS USADOS PARA CERRAR EL CHAT.
  async function cerrarCaso(idArbol, selectTipChat1, selectEspChat1) {
    console.log('************ME LLEGA************* ', idArbol);

    //console.log('************ME LLEGA************* ', sessionStorage.getItem('tipificacion1'));
    //console.log('************ME LLEGA************* ', sessionStorage.getItem('subtipificacion1'));

    let x = await postData('/GECA/casoCerrado', { PKGES_CODIGO: idArbol, selectTipChat1, selectEspChat1 });
    return x;
  }

  closeChat1.addEventListener('click', async () => {
    let chat_1 = document.getElementById(number1);
    let arbol1 = localStorage.getItem('arbol1');
    let selectTipChat1 = document.getElementById('selectTipChat1');
    let selectEspChat1 = document.getElementById('selectEspChat1');
    if (selectTipChat1.value === '' || selectEspChat1.value === '') {
      Toast.fire({ icon: 'warning', title: 'Por favor Selecciona la Tipificacion' });
      return;
    }
    console.log(selectTipChat1.value, selectEspChat1.value);
    //M.toast({html: 'I am a toast!'})
    console.log('************ME LLEGA************* ', arbol1);
    const mensajeFin = 'Gracias por comunicarte con Maple Respiratory Colombia. Para nosotros es muy importante conocer tu opinión sobre el servicio recibido en ésta conversación, por lo que te agradecemos responder éstas 3 preguntas. ¡Que tengas un buen día!';

    postData('http://172.70.7.70:5031/enviarMensaje', { MEN_NUMERO_DESTINO: number1, MEN_TEXTO: mensajeFin, FK_GES_CODIGO: arbol1 }).then((res) => {
      console.log(res);
    });

    await cerrarCaso(arbol1, selectTipChat1.value, selectEspChat1.value);
    //console.log('::::::::', respuestaXD);

    localStorage.removeItem('number1');
    localStorage.removeItem('arbol1');
    localStorage.removeItem('Msj1');
    chat_1.innerHTML = '';
    document.getElementById('numero_chat1').innerHTML = ' ';
    console.log('CERRÉ EL CHAT UWU');
    //document.getElementById('tipification1').selectedIndex=0;
    //document.getElementById('tipification2').selectedIndex=0;
  });

  closeChat2.addEventListener('click', async () => {
    let chat_2 = document.getElementById(number2);
    let arbol2 = localStorage.getItem('arbol2');
    let selectTipChat2 = document.getElementById('selectTipChat2');
    let selectEspChat2 = document.getElementById('selectEspChat2');
    if (selectTipChat2.value === '' || selectEspChat2.value === '') {
      Toast.fire({ icon: 'warning', title: 'Por favor Selecciona la Tipificacion' });
      return;
    }
    const mensajeFin = 'Gracias por comunicarte con Maple Respiratory Colombia. Para nosotros es muy importante conocer tu opinión sobre el servicio recibido en ésta conversación, por lo que te agradecemos responder éstas 3 preguntas. ¡Que tengas un buen día!';

    postData('http://172.70.7.70:5031/enviarMensaje', { MEN_NUMERO_DESTINO: number2, MEN_TEXTO: mensajeFin, FK_GES_CODIGO: arbol2 }).then((res) => {
      console.log(res);
    });

    await cerrarCaso(arbol2, selectTipChat2.value, selectEspChat2.value);
    localStorage.removeItem('number2');
    localStorage.removeItem('arbol2');
    localStorage.removeItem('Msj2');
    chat_2.innerHTML = '';
    document.getElementById('numero_chat2').innerHTML = ' ';
    console.log('CERRÉ EL CHAT UWU');
  });

  closeChat3.addEventListener('click', async () => {
    let chat_3 = document.getElementById(number3);
    let arbol3 = localStorage.getItem('arbol3');
    let selectTipChat3 = document.getElementById('selectTipChat3');
    let selectEspChat3 = document.getElementById('selectEspChat3');
    if (selectTipChat3.value === '' || selectEspChat3.value === '') {
      Toast.fire({ icon: 'warning', title: 'Por favor Selecciona la Tipificacion' });
      return;
    }
    const mensajeFin = 'Gracias por comunicarte con Maple Respiratory Colombia. Para nosotros es muy importante conocer tu opinión sobre el servicio recibido en ésta conversación, por lo que te agradecemos responder éstas 3 preguntas. ¡Que tengas un buen día!';

    postData('http://172.70.7.70:5031/enviarMensaje', { MEN_NUMERO_DESTINO: number3, MEN_TEXTO: mensajeFin, FK_GES_CODIGO: arbol3 }).then((res) => {
      console.log(res);
    });

    await cerrarCaso(arbol3, selectTipChat3.value, selectEspChat3.value);
    localStorage.removeItem('number3');
    localStorage.removeItem('arbol3');
    localStorage.removeItem('Msj3');
    chat_3.innerHTML = '';
    document.getElementById('numero_chat3').innerHTML = ' ';
    console.log('CERRÉ EL CHAT UWU');
  });

  //LISENER ENCARGADO DE CAMBIAR LOS ESTADOS DEL AGENTE EN LA BD
  auxState.addEventListener('change', (event) => {
    const resultado = event.target.value;
    let BREAK = 'BREAK';
    let ALMUERZO = 'ALMUERZO';
    let ACTIVO = 'ACTIVO';
    let FINTURNO = 'TURNO CERRADO';
    let OUTMSG = 'ACTIVO_ENVIO_MENSAJES';
    let SELECTCHAT = 'CONSULTA CHAT';

    if (resultado == 'BREAK') {
      console.log('ATENCION: SE ELIGIÓ ', resultado);
      var estadoBreak = resultado;
      postData('/GECA/cambioEstado', { PKPER_NCODIGO: idPer, PER_AUXILIAR: estadoBreak }).then((result) => {
        console.log(result);
      });
      localStorage.setItem('estadoUser', BREAK);
    } else if (resultado == 'ALMUERZO') {
      console.log('ATENCION: SE ELIGIÓ ', resultado);
      var estadoAlmuerzo = resultado;
      postData('/GECA/cambioEstado', { PKPER_NCODIGO: idPer, PER_AUXILIAR: estadoAlmuerzo }).then((result) => {
        console.log(result);
      });
      localStorage.setItem('estadoUser', ALMUERZO);
    } else if (resultado == 'CERRAR TURNO') {
      if (localStorage.getItem('estadoUser') == 'BREAK') {
        alert('ADVERTENCIA USTED ESTABA EN BREAK NO PUEDE CERRAR SESIÓN, SE ACTIVARÁ EL ESTADO ACTIVO ');

        var estadoActivo = 'ACTIVO';
        postData('/GECA/cambioEstado', { PKPER_NCODIGO: idPer, PER_AUXILIAR: estadoActivo }).then((result) => {
          console.log(result);
          localStorage.setItem('estadoUser', estadoActivo);
        });
      } else if (localStorage.getItem('estadoUser') == 'ACTIVO') {
        console.log('ATENCION: SE ELIGIÓ', resultado);
        var estadoCerrarTurno = resultado;
        postData('/GECA/cambioEstado', { PKPER_NCODIGO: idPer, PER_AUXILIAR: estadoCerrarTurno }).then((result) => {
          console.log(result);
        });
        localStorage.setItem('estadoUser', FINTURNO);
      } else if (localStorage.getItem('estadoUser') == 'ACTIVO_ENVIO_MENSAJES') {
        console.log('ATENCION: SE ELIGIÓ', resultado);
        var estadoCerrarTurnoo = resultado;
        postData('/GECA/cambioEstado', { PKPER_NCODIGO: idPer, PER_AUXILIAR: estadoCerrarTurnoo }).then((result) => {
          console.log(result);
        });
        localStorage.setItem('estadoUser', FINTURNO);
      } else if (localStorage.getItem('estadoUser') == 'CONSULTA CHAT') {
        console.log('ATENCION: SE ELIGIÓ', resultado);
        var estadoCerrarTurnoo = resultado;
        postData('/GECA/cambioEstado', { PKPER_NCODIGO: idPer, PER_AUXILIAR: estadoCerrarTurnoo }).then((result) => {
          console.log(result);
        });
        localStorage.setItem('estadoUser', FINTURNO);
      }
    } else if (resultado == 'ACTIVO') {
      if (localStorage.getItem('estadoUser') == 'CONSULTA CHAT') {
        localStorage.removeItem('number1');
        localStorage.removeItem('Msj1');
        localStorage.removeItem('arbol1');
        localStorage.removeItem('number2');
        localStorage.removeItem('Msj2');
        localStorage.removeItem('arbol2');
        localStorage.removeItem('number3');
        localStorage.removeItem('Msj3');
        localStorage.removeItem('arbol3');
      }
      console.log('ATENCION: SE ELIGIÓ ', resultado);
      var activo = resultado;

      postData('/GECA/cambioEstado', { PKPER_NCODIGO: idPer, PER_AUXILIAR: activo }).then((result) => {
        console.log(result);
      });
      localStorage.setItem('estadoUser', ACTIVO);
    } else if (resultado == 'ACTIVO_ENVIO_MENSAJES') {
      if (localStorage.getItem('estadoUser') == 'CONSULTA CHAT') {
        localStorage.removeItem('number1');
        localStorage.removeItem('Msj1');
        localStorage.removeItem('arbol1');
        localStorage.removeItem('number2');
        localStorage.removeItem('Msj2');
        localStorage.removeItem('arbol2');
        localStorage.removeItem('number3');
        localStorage.removeItem('Msj3');
        localStorage.removeItem('arbol3');
      }
      console.log('ATENCION: SE ELIGIÓ ', resultado);
      var outMsj = resultado;

      postData('/GECA/cambioEstado', { PKPER_NCODIGO: idPer, PER_AUXILIAR: outMsj }).then((result) => {
        console.log(result);
      });
      localStorage.setItem('estadoUser', OUTMSG);
    } else if (resultado == 'CONSULTA CHAT') {
      console.log('ATENCION: SE ELIGIÓ ', resultado);
      let consultaChat = resultado;

      postData('/GECA/cambioEstado', { PKPER_NCODIGO: idPer, PER_AUXILIAR: consultaChat }).then((result) => {
        console.log(result);
      });
      localStorage.setItem('estadoUser', SELECTCHAT);
    }
  });

  //AQUI SE REALIZA LA ESCUCHA DEL BOTON ENTER O DEL CLICK EN EL BOTON DE ENVIO
  //METODO ENCARGADO DE ENVIO DE MENSAJE, ESTA FUNCION RECIBE DOS PARAMETROS, EL NUMERO A ENVIAR
  //Y EL MENSAJE, LOS CHATS USAN LA MISMA RUTA PARA ENVIAR LOS MENSAJES PERO NO PUEDEN USAR EL MISMO SCROLL
  //ASÍ QUE TIENEN METODOS DISTINTOS

  inputMensaje1.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      texto = inputMensaje1.value;
      enviarMensaje(number1, texto);
      inputMensaje1.focus();
    }
  });

  btnEnvioMensaje_1.addEventListener('click', () => {
    texto = inputMensaje1.value;

    enviarMensaje(number1, texto);
    inputMensaje1.focus();
  });

  // inputMensaje2.removeEventListener('keyup', false)

  inputMensaje2.addEventListener('keypress', (e) => {
    // IE
    console.log('antes de preguntar la tecla');
    if (e.keyCode == 13) {
      //console.log("dentro del if");
      //console.log('Enter +++++++++++++++++++++++++++++++++++++++++++++++++');

      number = number2;

      Tnumber = number;
      console.log('ANTES DE ENTRAR AL NUMERO');
      inputMensaje2.focus();
      enviarMensaje2(number2, inputMensaje2.value);

      //console.log("***************************EL VALOR ES ES ",inputMensaje2.value);
    }
  });

  const btnEnvioMensaje_2 = document.getElementById('btnEnvioMensaje_2');
  btnEnvioMensaje_2.addEventListener('click', () => {
    console.log('ENTRO AL CLICK');
    console.log('+++++++++++++++++++++++++++++++++++++++++++++++++');
    texto = inputMensaje2.value;
    enviarMensaje2(number2, texto);
    inputMensaje2.focus();
  });

  inputMensaje3.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      number = number3;
      texto = inputMensaje3.value;

      Tnumber = number;
      console.info('este es el valor y el numero que estoy recogiendo del input 3', Tnumber, texto);
      enviarMensaje3(Tnumber, texto);

      inputMensaje3.focus();
    }
  });

  btnEnvioMensaje_3.addEventListener('click', () => {
    number = number3;
    texto = inputMensaje3.value;

    Tnumber = number;
    console.info('este es el valor y el numero que estoy recogiendo del input 3', Tnumber, texto);
    enviarMensaje3(Tnumber, texto);
    inputMensaje3.focus();
  });

  const enviarMensaje = (numero, mensaje) => {
    let chat_1 = document.getElementById(number1);
    if (inputMensaje1.value === '') {
      //Toast.fire({ icon: 'info', title: 'Ingrese Mensaje' });
      console.log('ENTRÓ UNO VACIO');
    } else {
      let arboll1 = localStorage.getItem('arbol1');
      postData('http://172.70.7.70:5031/enviarMensaje', { MEN_NUMERO_DESTINO: numero, MEN_TEXTO: mensaje, FK_GES_CODIGO: arboll1 }).then((res) => {
        console.log(res);
      });
      inputMensaje1.value = '';
      chat_1.scrollTo({
        top: chat_1.scrollHeight,
      });
    }
  };

  const enviarMensaje2 = (numero, mensaje) => {
    let chat_2 = document.getElementById(number2);
    if (inputMensaje2.value === '') {
      Toast.fire({ icon: 'info', title: 'Ingrese Mensaje' });
    } else {
      let arboll2 = localStorage.getItem('arbol2');
      console.log('OBTENGO ', numero, mensaje);
      postData('http://172.70.7.70:5031/enviarMensaje', { MEN_NUMERO_DESTINO: numero, MEN_TEXTO: mensaje, FK_GES_CODIGO: arboll2 }).then((res) => {
        console.log(res);
      });
      console.log('HICE UNA PÉTICIÓN JEJE');
      //chat_313481.innerHTML += `<div class='mensaje_enviado'><span>${inputMensaje1.value}</span></div>`;
      inputMensaje2.value = '';
      chat_2.scrollTo({
        top: chat_2.scrollHeight,
      });
    }
    console.log('HICE UNA PÉTICIÓN JEJE2');
  };

  const enviarMensaje3 = (numero, mensaje) => {
    let chat_3 = document.getElementById(number3);
    if (inputMensaje3.value === '') {
      Toast.fire({ icon: 'info', title: 'Ingrese Mensaje' });
    } else {
      let arboll3 = localStorage.getItem('arbol3');
      postData('http://172.70.7.70:5031/enviarMensaje', { MEN_NUMERO_DESTINO: numero, MEN_TEXTO: mensaje, FK_GES_CODIGO: arboll3 }).then((res) => {
        console.log(res);
      });
      console.log('HICE UNA PÉTICIÓN JEJE');
      //chat_313481.innerHTML += `<div class='mensaje_enviado'><span>${inputMensaje1.value}</span></div>`;
      inputMensaje3.value = '';
      chat_3.scrollTo({
        top: chat_3.scrollHeight,
      });
    }
  };

  btnLogOut = document.getElementById('close_session');
  btnLogOut.addEventListener('click', () => {
    console.log('HOOOOOOOOOOOOOOOOOOOOLIRIJILLA');
    localStorage.removeItem('number1');
    localStorage.removeItem('arbol1');
    localStorage.removeItem('Msj1');
    localStorage.removeItem('number2');
    localStorage.removeItem('arbol2');
    localStorage.removeItem('Msj2');
    localStorage.removeItem('number3');
    localStorage.removeItem('arbol3');
    localStorage.removeItem('Msj3');
    localStorage.removeItem('cantidad');
    localStorage.removeItem('estadoUser');
  });

  setInterval(function ping() {
    let state = localStorage.getItem('estadoUser');
    postData('/GECA/cambioEstado', { PKPER_NCODIGO: idPer, PER_AUXILIAR: state }).then((result) => {
      console.log('MAKING PING....!', result);
    });
  }, 100000);

  //las validaciones de aqui donde si el arbol1 o 2 esta vacio es por que la plataforma asigna en orden de izquierda a derecha
  //para no perder esa trazabilidad lo mejor es que los chats se abran en orden y no en desorden, es decir
  //no abrir el chat 3 sin haber abierto el chat 2 y el chat1, el chat 3 no se abrira sino se llenan los 2 primeros chats
  //el chat1 se puede abrir cuandos sea, si se quiere saber mas mirar el cambio_ids ya que ayuda a entender el por que
  crearChat1.addEventListener('click', async () => {
    let numberCame = document.getElementById('number1').value;
    console.log('me llega esta joda', numberCame);
    if (numberCame == '') {
      M.toast({ html: 'diligencie el campo del numero por favor' });
      numberCame.value = '';
    } else if (numberCame != '') {
      let numberRecepcion1;
      let msjConcatenado1 = 'Chat asignado con exito ya puede escribirle al usuario';
      let idArboll1;
      postData('/GECA/newConversation', { FKGES_NPER_CODIGO: idPer, GES_NUMERO_COMUNICA: numberCame }).then(async (res) => {
        //console.log(result);
        res.result.forEach((mensaje) => {
          numberRecepcion1 = mensaje.GES_NUMERO_COMUNICA;
          idArboll1 = mensaje.PKGES_CODIGO;
        });
        localStorage.setItem('number1', numberRecepcion1);
        localStorage.setItem('Msj1', msjConcatenado1);
        localStorage.setItem('arbol1', idArboll1);
      });
    }
    document.getElementById('number1').value = '';
  });

  crearChat2.addEventListener('click', async () => {
    let numberCame = document.getElementById('number2').value;
    console.log('me llega esta joda', numberCame);
    if (numberCame == '') {
      M.toast({ html: 'diligencie el campo del numero por favor' });
      numberCame.value = '';
    } else if (numberCame != '') {
      if (localStorage.getItem('arbol1') === null) {
        M.toast({ html: 'Por favor abra los chats de izquierda a derecha' });
      } else if ((localStorage.getItem('arbol1') != null && localStorage.getItem('arbol3') != null) || (localStorage.getItem('arbol1') != null && localStorage.getItem('arbol3') === null)) {
        let numberRecepcion2;
        let msjConcatenado2 = 'Chat asignado con exito ya puede escribirle al usuario';
        let idArboll2;
        postData('/GECA/newConversation', { FKGES_NPER_CODIGO: idPer, GES_NUMERO_COMUNICA: numberCame }).then(async (res) => {
          //console.log(result);
          res.result.forEach((mensaje) => {
            numberRecepcion2 = mensaje.GES_NUMERO_COMUNICA;
            idArboll2 = mensaje.PKGES_CODIGO;
          });
          localStorage.setItem('number2', numberRecepcion2);
          localStorage.setItem('Msj2', msjConcatenado2);
          localStorage.setItem('arbol2', idArboll2);
        });
      }
    }
    document.getElementById('number2').value = '';
  });

  crearChat3.addEventListener('click', async () => {
    let numberCame = document.getElementById('number3').value;
    console.log('me llega esta joda', numberCame);
    if (numberCame == '') {
      M.toast({ html: 'diligencie el campo del numero por favor' });
      numberCame.value = '';
    } else if (numberCame != '') {
      if (localStorage.getItem('arbol1') === null || localStorage.getItem('arbol2') === null) {
        M.toast({ html: 'Por favor abra los chats de izquierda a derecha dejando esta casilla de últimas en llenar' });
      } else if (localStorage.getItem('arbol1') != null && localStorage.getItem('arbol2') != null) {
        let numberRecepcion3;
        let msjConcatenado3 = 'Chat asignado con exito ya puede escribirle al usuario';
        let idArboll3;
        postData('/GECA/newConversation', { FKGES_NPER_CODIGO: idPer, GES_NUMERO_COMUNICA: numberCame }).then(async (res) => {
          //console.log(result);
          res.result.forEach((mensaje) => {
            numberRecepcion3 = mensaje.GES_NUMERO_COMUNICA;
            idArboll3 = mensaje.PKGES_CODIGO;
          });
          localStorage.setItem('number3', numberRecepcion3);
          localStorage.setItem('Msj3', msjConcatenado3);
          localStorage.setItem('arbol3', idArboll3);
        });
      }
    }
    document.getElementById('number3').value = '';
  });
  //HOSTORIAL CHAT 1
  btnBuscarNum1.addEventListener('click', () => {
    let numberSelect = document.getElementById('num1').value;

    let fechas;
    let idArboles;
    let options = '';
    if (numberSelect == '') {
      M.toast({ html: 'diligencie el campo del numero por favor' });
      document.getElementById('num1').value = '';
    }
    if (numberSelect != ' ' && (numberSelect == localStorage.getItem('number2') || numberSelect == localStorage.getItem('number3'))) {
      M.toast({ html: 'Ya tiene una consulta en otro chat  con ese número, por favor digite otro numero' });
      document.getElementById('num1').value = '';
      selectChat1.selectedIndex = 0;
    } else if (numberSelect != '') {
      postData('/GECA/searchChat', { GES_NUMERO_COMUNICA: numberSelect }).then(async (res) => {
        console.log(res);
        options += "<option selected='true' disabled='disabled'>SELECCIONE UNA FECHA</option>";
        res.result.forEach((mensaje) => {
          fechas = mensaje.GES_CFECHA_REGISTRO;
          idArboles = mensaje.PKGES_CODIGO;
          console.log('-----------', fechas);
          console.log('..............', idArboles);

          options += '<option value=' + idArboles + ' >' + fechas + '</option>';

          //selectChat1.add(new Option(fechas));
          //$('registryChat1').formSelect();
        });
        //selectChat1.innerHTML=' ';

        selectChat1.innerHTML = options;
        M.FormSelect.init(elems);
      });
    }
  });

  selectChat1.addEventListener('change', function () {
    let selectedOption = this.options[selectChat1.selectedIndex];
    fechassschat1 = selectedOption.text;
    valuechat1 = selectChat1.value;

    console.log('lo que elegi', selectedOption.text, 'VALUEEEEEE', selectChat1.value);
  });
  //encargado de buscar la conversacion
  btnSelectNum1.addEventListener('click', () => {
    let numberSelect = document.getElementById('num1').value;
    console.log('TENGO', fechassschat1, valuechat1);
    if (numberSelect == '' || fechassschat1 == null || (numberSelect == '' && fechassschat1 == null)) {
      M.toast({ html: 'diligencie los campos por favor' });
    } else {
      localStorage.setItem('number1', numberSelect);
      localStorage.setItem('Msj1', 'Chat recuperado');
      localStorage.setItem('arbol1', valuechat1);
    }
  });

  //HISTORIAL CHAT 2

  btnBuscarNum2.addEventListener('click', () => {
    let numberSelect = document.getElementById('num2').value;

    let fechas;
    let idArboles;
    let options = '';
    if (numberSelect == '') {
      M.toast({ html: 'diligencie el campo del numero por favor' });
      document.getElementById('num2').value = '';
    }
    if (numberSelect != ' ' && (numberSelect == localStorage.getItem('number1') || numberSelect == localStorage.getItem('number3'))) {
      M.toast({ html: 'Ya tiene una consulta en otro chat  con ese número, por favor digite otro numero' });
      document.getElementById('num2').value = '';
      selectChat2.selectedIndex = 0;
    } else if (numberSelect != '') {
      postData('/GECA/searchChat', { GES_NUMERO_COMUNICA: numberSelect }).then(async (res) => {
        console.log(res);
        options += "<option selected='true' disabled='disabled'>SELECCIONE UNA FECHA</option>";
        res.result.forEach((mensaje) => {
          fechas = mensaje.GES_CFECHA_REGISTRO;
          idArboles = mensaje.PKGES_CODIGO;
          console.log('-----------', fechas);
          console.log('..............', idArboles);

          options += '<option value=' + idArboles + ' >' + fechas + '</option>';

          //selectChat1.add(new Option(fechas));
          //$('registryChat1').formSelect();
        });
        //selectChat1.innerHTML=' ';

        selectChat2.innerHTML = options;
        M.FormSelect.init(elems);
      });
    }
  });

  selectChat2.addEventListener('change', function () {
    let selectedOption = this.options[selectChat2.selectedIndex];
    fechassschat2 = selectedOption.text;
    valuechat2 = selectChat2.value;

    console.log('lo que elegi', selectedOption.text, 'VALUEEEEEE', selectChat2.value);
  });
  //encargado de buscar la conversacion
  btnSelectNum2.addEventListener('click', () => {
    let numberSelect = document.getElementById('num2').value;
    console.log('TENGO', fechassschat2, valuechat2);
    if (numberSelect == '' || fechassschat2 == null || (numberSelect == '' && fechassschat2 == null)) {
      document.getElementById('num2').value = '';
      M.toast({ html: 'diligencie los campos por favor' });
    }
    if (numberSelect != '' && localStorage.getItem('arbol1') === null) {
      document.getElementById('num2').value = '';
      selectChat2.selectedIndex = 0;
      selectChat2.innerHTML = '';
      M.FormSelect.init(elems);
      M.toast({ html: 'Por favor asigne las consultas en orden de izquierda a derecha' });
    } else {
      localStorage.setItem('number2', numberSelect);
      localStorage.setItem('Msj2', 'Chat recuperado');
      localStorage.setItem('arbol2', valuechat2);
    }
  });

  //HISTORIAL CHAT 3
  btnBuscarNum3.addEventListener('click', () => {
    let numberSelect = document.getElementById('num3').value;

    let fechas;
    let idArboles;
    let options = '';
    if (numberSelect == '') {
      M.toast({ html: 'diligencie el campo del numero por favor' });
      document.getElementById('num3').value = '';
    }
    if (numberSelect != ' ' && (numberSelect == localStorage.getItem('number1') || numberSelect == localStorage.getItem('number2'))) {
      M.toast({ html: 'Ya tiene una consulta en otro chat  con ese número, por favor digite otro numero' });
      document.getElementById('num3').value = '';
      selectChat3.selectedIndex = 0;
    } else if (numberSelect != '') {
      postData('/GECA/searchChat', { GES_NUMERO_COMUNICA: numberSelect }).then(async (res) => {
        console.log(res);
        options += "<option selected='true' disabled='disabled'>SELECCIONE UNA FECHA</option>";
        res.result.forEach((mensaje) => {
          fechas = mensaje.GES_CFECHA_REGISTRO;
          idArboles = mensaje.PKGES_CODIGO;
          console.log('-----------', fechas);
          console.log('..............', idArboles);

          options += '<option value=' + idArboles + ' >' + fechas + '</option>';

          //selectChat1.add(new Option(fechas));
          //$('registryChat1').formSelect();
        });
        //selectChat1.innerHTML=' ';

        selectChat3.innerHTML = options;
        M.FormSelect.init(elems);
      });
    }
  });

  selectChat3.addEventListener('change', function () {
    let selectedOption = this.options[selectChat3.selectedIndex];
    fechassschat3 = selectedOption.text;
    valuechat3 = selectChat3.value;

    console.log('lo que elegi', selectedOption.text, 'VALUEEEEEE', selectChat3.value);
  });
  //encargado de buscar la conversacion
  btnSelectNum3.addEventListener('click', () => {
    let numberSelect = document.getElementById('num3').value;
    console.log('TENGO', fechassschat3, valuechat3);
    if (numberSelect == '' || fechassschat3 == null || (numberSelect == '' && fechassschat3 == null)) {
      M.toast({ html: 'diligencie los campos por favor' });
      document.getElementById('num3').value = '';
      selectChat3.selectedIndex = 0;
    }
    if (numberSelect != '' && (localStorage.getItem('arbol1') === null || localStorage.getItem('arbol2') === null)) {
      document.getElementById('num3').value = '';
      selectChat3.selectedIndex = 0;
      selectChat3.innerHTML = '';
      M.FormSelect.init(elems);
      M.toast({ html: 'Por favor asigne las consultas en orden de izquierda a derecha,dejando este de último' });
    } else {
      localStorage.setItem('number3', numberSelect);
      localStorage.setItem('Msj3', 'Chat recuperado');
      localStorage.setItem('arbol3', valuechat3);
    }
  });

  cleanChat1.addEventListener('click', () => {
    localStorage.removeItem('number1');
    localStorage.removeItem('arbol1');
    localStorage.removeItem('Msj1');
  });

  cleanChat2.addEventListener('click', () => {
    localStorage.removeItem('number2');
    localStorage.removeItem('arbol2');
    localStorage.removeItem('Msj2');
  });

  cleanChat3.addEventListener('click', () => {
    localStorage.removeItem('number3');
    localStorage.removeItem('arbol3');
    localStorage.removeItem('Msj3');
  });

  setInterval(function cambiosAux() {
    document.getElementById('inputState').value = localStorage.getItem('estadoUser');
  }, 1000);

  setInterval(async () => {
    let num1 = localStorage.getItem('number1');
    let ar1 = localStorage.getItem('arbol1');

    //console.log("aca abajo el number1 es ",number1);
    let chat_1 = document.getElementById(number1);

    let res = await reviewCasesChat1(ar1, num1, idPer);

    //console.log("LA RES DEL CHAT1",res);

    if (res.length == 0 && num1 != null && ar1 != null && number1 != null) {
      document.getElementById(number1).id = chat1Init;
      console.log('CHAT1');
      localStorage.removeItem('number1');
      localStorage.removeItem('arbol1');
      localStorage.removeItem('Msj1');
      localStorage.removeItem('typemsj1');
      chat_1.innerHTML = '';
      document.getElementById('numero_chat1').innerHTML = ' ';
      // document.getElementById('createChat1').style.display = 'block';
      console.log('CERRÉ EL CHAT UWU');

      console.log('LIMPIADO DEL CHAT1');
    } else if (res.length >= 1) {
      console.log('CHECK DE ACTIVIDAD CHAT1');
    }
  }, 10000);
  setInterval(async () => {
    let num1 = localStorage.getItem('number1');
    let ar1 = localStorage.getItem('arbol1');

    //console.log("aca abajo el number1 es ",number1);
    let chat_1 = document.getElementById(number1);

    let res = await reviewCasesChat2(ar1, num1, idPer);

    //console.log("LA RES DEL CHAT1",res);

    if (res.length == 0 && num1 != null && ar1 != null && number1 != null) {
      document.getElementById(number1).id = chat1Init;
      console.log('CHAT1');
      localStorage.removeItem('number1');
      localStorage.removeItem('arbol1');
      localStorage.removeItem('Msj1');
      localStorage.removeItem('typemsj1');
      chat_1.innerHTML = '';
      document.getElementById('numero_chat1').innerHTML = ' ';
      // document.getElementById('createChat1').style.display = 'block';
      console.log('CERRÉ EL CHAT UWU');

      console.log('LIMPIADO DEL CHAT1');
    } else if (res.length >= 1) {
      console.log('CHECK DE ACTIVIDAD CHAT1');
    }
  }, 10000);
  setInterval(async () => {
    let num1 = localStorage.getItem('number1');
    let ar1 = localStorage.getItem('arbol1');

    //console.log("aca abajo el number1 es ",number1);
    let chat_1 = document.getElementById(number1);

    let res = await reviewCasesChat3(ar1, num1, idPer);

    //console.log("LA RES DEL CHAT1",res);

    if (res.length == 0 && num1 != null && ar1 != null && number1 != null) {
      document.getElementById(number1).id = chat1Init;
      console.log('CHAT1');
      localStorage.removeItem('number1');
      localStorage.removeItem('arbol1');
      localStorage.removeItem('Msj1');
      localStorage.removeItem('typemsj1');
      chat_1.innerHTML = '';
      document.getElementById('numero_chat1').innerHTML = ' ';
      // document.getElementById('createChat1').style.display = 'block';
      console.log('CERRÉ EL CHAT UWU');

      console.log('LIMPIADO DEL CHAT1');
    } else if (res.length >= 1) {
      console.log('CHECK DE ACTIVIDAD CHAT1');
    }
  }, 10000);

  async function reviewCasesChat1(arbo, number, idPer) {
    let res = await postData('/GECA/reviewVars', { FKGES_NPER_CODIGO: idPer, PKGES_CODIGO: arbo, GES_NUMERO_COMUNICA: number });
    return res;
  }
  async function reviewCasesChat2(arbo, number, idPer) {
    let res = await postData('/GECA/reviewVars', { FKGES_NPER_CODIGO: idPer, PKGES_CODIGO: arbo, GES_NUMERO_COMUNICA: number });
    return res;
  }
  async function reviewCasesChat3(arbo, number, idPer) {
    let res = await postData('/GECA/reviewVars', { FKGES_NPER_CODIGO: idPer, PKGES_CODIGO: arbo, GES_NUMERO_COMUNICA: number });
    return res;
  }

  // * addEventListener Botones Mostrar PLantillas
  getPlantillas1.addEventListener('click', async () => {
    const divPlantillas = document.querySelector('#modalPlantillas .plantillas');
    let resPlantillas = await getData('/GECA/getPlantillas');

    let htmlPlantillas = ``;
    resPlantillas.forEach((element) => {
      htmlPlantillas += `
        <div class='divPlant'>
          <p>${element.EST_CDETALLE}</p>
          <i class='bx bxs-copy-alt btnCopyPlantilla' ></i>
        </div>
      `;
    });

    divPlantillas.innerHTML = htmlPlantillas;

    document.querySelectorAll('.btnCopyPlantilla').forEach((elem) => {
      elem.addEventListener('click', () => {
        inputMensaje1.value = elem.parentElement.textContent.trim();
        let instance = M.Modal.getInstance(elemsModal[9]);
        instance.close();
      });
    });
  });
  getPlantillas2.addEventListener('click', async () => {
    const divPlantillas = document.querySelector('#modalPlantillas .plantillas');
    let resPlantillas = await getData('/GECA/getPlantillas');

    let htmlPlantillas = ``;
    resPlantillas.forEach((element) => {
      htmlPlantillas += `
        <div class='divPlant'>
          <p>${element.EST_CDETALLE}</p>
          <i class='bx bxs-copy-alt btnCopyPlantilla' ></i>
        </div>
      `;
    });

    divPlantillas.innerHTML = htmlPlantillas;

    document.querySelectorAll('.btnCopyPlantilla').forEach((elem) => {
      elem.addEventListener('click', () => {
        inputMensaje2.value = elem.parentElement.textContent.trim();
        let instance = M.Modal.getInstance(elemsModal[9]);
        instance.close();
      });
    });
  });
  getPlantillas3.addEventListener('click', async () => {
    const divPlantillas = document.querySelector('#modalPlantillas .plantillas');
    let resPlantillas = await getData('/GECA/getPlantillas');

    let htmlPlantillas = ``;
    resPlantillas.forEach((element) => {
      htmlPlantillas += `
        <div class='divPlant'>
          <p>${element.EST_CDETALLE}</p>
          <i class='bx bxs-copy-alt btnCopyPlantilla' ></i>
        </div>
      `;
    });

    divPlantillas.innerHTML = htmlPlantillas;

    document.querySelectorAll('.btnCopyPlantilla').forEach((elem) => {
      elem.addEventListener('click', () => {
        inputMensaje3.value = elem.parentElement.textContent.trim();
        let instance = M.Modal.getInstance(elemsModal[9]);
        instance.close();
      });
    });
  });
});
