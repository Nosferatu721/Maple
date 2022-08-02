document.addEventListener('DOMContentLoaded', () => {
  var lenOriginal = 0;
  var lengAux = 0;

  var lenOriginalOut = 0;
  var lengAuxOut = 0;


  const chat_313481 = document.getElementById('chat_313481'),
    inputMensaje1 = document.getElementById('inputMensaje1'),
    btnEnvioMensaje_313481 = document.getElementById('btnEnvioMensaje_313481');

  btnAgregarChat = document.getElementById('btnAgregarCHat');
///FUNCION ENCARGADA DE RECIBIR DE LA RUTA DE EXPRESS LOS MENSAJES DESDE LA BASE DE DATOS
//SOLO SE EJECUTA UNA SOLA VEZ AL INICIO
  function lecturaMensaje() {
    
    let url = 'http://localhost:8083/samaritana/mensasjespen';
    fetch(url)
      .then((response) => response.json())
      .then((datos) => {
        var obj = JSON.parse(JSON.stringify(datos));
        lenOriginal = obj.length;
        console.log(`EL TAMAÑO DEL ARREGLO ES ${obj.length}`);
        for (let index = 0; index < obj.length; index++) {
          menssage = obj[index].MEN_TEXTO;
          fecha = obj[index].MEN_CFECHA_REGISTRO;
          mostrar(menssage,fecha);
        }
        //obj.len console.log(obj);
      });
  }
///FUNCION ENCARGADA DE RECIBIR DE LA RUTA DE EXPRESS LOS MENSAJES DESDE LA BASE DE DATOS
//LO HACE RECURRENTEMENTE CADA SEGUNDO
  setInterval(function refreshMessages() {
    

    let url2 = 'http://localhost:8083/samaritana/mensasjespen';
    fetch(url2)
      .then((response) => response.json())
      .then((datos) => {
        var obj1 = JSON.parse(JSON.stringify(datos));
        lengAux = obj1.length;
      });

    let url = 'http://localhost:8083/samaritana/lastmensajespen';
    fetch(url)
      .then((response) => response.json())
      .then((datos) => {
        var obj = JSON.parse(JSON.stringify(datos));

        //console.log(`EL TAMAÑO QUE CONSULTO ES  ${lengAux}`);
        //console.log(`EL TAMAÑO ORIGINAL ES   ${lenOriginal}`);
        // console.log(`${lengAux} ==  ${lenOriginal}`);
        if (lenOriginal != lengAux) {
          console.log(`${lengAux} !=  ${lenOriginal}`);
          for (let index = 0; index < obj.length; index++) {
            menssage = obj[index].MEN_TEXTO;

            console.log(menssage);
            mostrar(menssage);
            lenOriginal = lengAux;
          }
        }

        //obj.len console.log(obj);
      });
  }, 1000 * 1);

///FUNCION ENCARGADA DE RECIBIR DE LA RUTA DE EXPRESS LOS MENSAJES DESDE LA BASE DE DATOS
//ESTA FUNCION TRAE LOS MENSAJES DE LA BD QUE YO ENVIO DESDE LA PAGINA
//SOLO SE EJECUTA UNA SOLA VEZ AL INICIO
  function lecturaMensajeSalida() {
    
    
    let url = 'http://localhost:8083/samaritana/mensajespenOut';
    fetch(url)
      .then((response) => response.json())
      .then((datos) => {
        var obj = JSON.parse(JSON.stringify(datos));
        lenOriginalOut = obj.length;
        console.log(`EL TAMAÑO DEL ARREGLO ES ${obj.length}`);
        for (let index = 0; index < obj.length; index++) {
          id= obj[index].PKMEN_NCODIGO;
          menssage = obj[index].MEN_TEXTO;
          fecha = obj[index].MEN_CFECHA_REGISTRO;
          estado=obj[index].MEN_ESTADO_MENSAJE;
          console.log(menssage);
          console.log("SOY ESTADO",estado)
          mostrarOut(id,menssage,fecha,estado);
        }
        //obj.len console.log(obj);
      });
  }
///FUNCION ENCARGADA DE RECIBIR DE LA RUTA DE EXPRESS LOS MENSAJES DESDE LA BASE DE DATOS
//LO HACE RECURRENTEMENTE CADA SEGUNDO
  setInterval(function refreshMessagesOut() {
   

    let url2 = 'http://localhost:8083/samaritana/mensajespenOut';
    fetch(url2)
      .then((response) => response.json())
      .then((datos) => {
        var obj1 = JSON.parse(JSON.stringify(datos));
        lengAuxOut = obj1.length;
      });

    let url = 'http://localhost:8083/samaritana/lastMensajesOut';
    fetch(url)
      .then((response) => response.json())
      .then((datos) => {
        var obj = JSON.parse(JSON.stringify(datos));

        //console.log(`EL TAMAÑO QUE CONSULTO ES  ${lengAux}`);
        //console.log(`EL TAMAÑO ORIGINAL ES   ${lenOriginal}`);
        // console.log(`${lengAux} ==  ${lenOriginal}`);
        if (lenOriginalOut != lengAuxOut) {
          console.log(`${lengAuxOut} !=  ${lenOriginalOut}`);
          for (let index = 0; index < obj.length; index++) {
            id= obj[index].PKMEN_NCODIGO;
            menssage = obj[index].MEN_TEXTO;
            fecha = obj[index].MEN_CFECHA_REGISTRO;
            estado=obj[index].MEN_ESTADO_MENSAJE;
            console.log(menssage);

            mostrarOut(id,menssage,fecha,estado);
            lenOriginalOut = lengAuxOut;
          }
        }

        //obj.len console.log(obj);
      });
  }, 1000 * 1);
  //FUNCION ENCARGADA DE MOSTRAR EL SELECT PRINCIPAL
  const mostrar = (mensaje,fecha) => {
    fecha=fecha;
    var hora=fecha.slice(11,16)
    //mensajes_recibidos= document.createElement('div');
    //mensajes_recibidos.className="mensaje_recivido"
    //chat_313481.innerHTML += `<div class='mensaje_recivido'><span></span></div>`;

    ;
   //<div class='mensaje_enviado'><span>Buenas<span>15:31 <i class='bx bx-check-double'></i></span></span></div>
    chat_313481.innerHTML += `<div class='mensaje_recivido'><span>${mensaje}<span>${hora}</span></span></div>`;;
    console.log(mensaje);
    chat_313481.scrollTo({
      top: chat_313481.scrollHeight,
    });
  };
  //FUNCION ENCARGADA DE MOSTRAR EL SELECT PRINCIPAL DE SALIDA
  const mostrarOut = (id,mensaje,fecha,estado) => {
    
    //mensajes_recibidos= document.createElement('div');
    //mensajes_recibidos.className="mensaje_recivido"
    //chat_313481.innerHTML += `<div class='mensaje_recivido'><span></span></div>`;
    //chat_313481.innerHTML += `<div class='mensaje_enviado'><span>${mensaje} <span>${fecha} <i class='bx bx-check-double'></i></span> </span></div>`;}
    id= id;
    fecha=fecha;
    estado=estado;
    console.log("ME LLEGA EL ESTADO",estado);
    console.log("ME LLEGA LA FECHA",fecha);
    console.log(fecha);
    var hora=fecha.slice(11,16)
    console.log("la division",fecha.slice(11,16)); 

    if (estado=="POR ENVIAR") {
      chat_313481.innerHTML += `<div id=${id} class='mensaje_enviado'><span>${mensaje} <span>${hora}<i class='bx bx-time-five'></i></span> </span></div>`;
    } else if(estado=="ENVIADO") {
      chat_313481.innerHTML += `<div id=${id} class='mensaje_enviado'><span>${mensaje} <span>${hora}<i class='bx bx-check' ></i></span> </span></div>`;  
    }

    
    ;
    //
    
    
    chat_313481.scrollTo({
      top: chat_313481.scrollHeight,
    });
  };
  


  







  const enviarMensaje = () => {
    if (inputMensaje1.value === '') {
      Toast.fire({ icon: 'info', title: 'Ingrese Mensaje' });
    } else {
      postData('/samaritana/enviarMensaje', { MEN_TEXTO: inputMensaje1.value }).then((res) => {
        console.log(res);
      });
      console.log('HICE UNA PÉTICIÓN JEJE');
      //chat_313481.innerHTML += `<div class='mensaje_enviado'><span>${inputMensaje1.value}</span></div>`;
      inputMensaje1.value = '';
      chat_313481.scrollTo({
        top: chat_313481.scrollHeight,
      });
    }
  };
/*
  set interval (function actualizarEstado(){
    const ids = [...document.querySelectorAll('.mensaje_enviado')].map(el => el.id);
    console.log(ids)

  },3000 * 1);
*/


  inputMensaje1.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      enviarMensaje();

      inputMensaje1.focus();
    }
  });

  btnEnvioMensaje_313481.addEventListener('click', () => {
    enviarMensaje();
    inputMensaje1.focus();
  });

  lecturaMensaje();
  lecturaMensajeSalida();







  /*******DEPRECATED********/
  /*
  const showLast = (mensaje) => {
    //FUNCION ENCARGADA DE MOSTRAR EL SELECT CONTINUO
    //mensajes_recibidos= document.createElement('div');
    //mensajes_recibidos.className="mensaje_recivido"
    //chat_313481.innerHTML += `<div class='mensaje_recivido'><span></span></div>`;

    chat_313481.innerHTML += `<div class='mensaje_recivido'><span>${mensaje}</span></div>`;
    console.log(mensaje);
    chat_313481.scrollTo({
      top: chat_313481.scrollHeight,
    });
  };
*/
  

  /*******DEPRECATED********/
  /*
  const showLastOut = (mensaje) => {
    //FUNCION ENCARGADA DE MOSTRAR EL SELECT CONTINUO
    //mensajes_recibidos= document.createElement('div');
    //mensajes_recibidos.className="mensaje_recivido"
    //chat_313481.innerHTML += `<div class='mensaje_recivido'><span></span></div>`;

    chat_313481.innerHTML += `<div class='mensaje_enviado'><span>${mensaje}</span></div>`;
    console.log(mensaje);
    chat_313481.scrollTo({
      top: chat_313481.scrollHeight,
    });
  };

*/



});
