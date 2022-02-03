// * getData -> Peticiones Fetch GET - Recibe como parametro una ruta Ej: "/prueba"
// * --- Ejemplo - Misma idea con el resto de funciones Fetch
// *  getData("/rutaNode")
// *    then((res) => console.log(res))
const getData = async (route) => {
  try {
    let res = await fetch(route);
    let json = await res.json();
    if (!res.ok) throw { status: res.status, statusText: res.statusText };
    return json;
  } catch (err) {
    console.error(err);
    Toast.fire({
      icon: 'error',
      title: `Error en getData(): ${(err.status, err.statusText)}`,
    });
  }
};

// * postData -> Peticiones Fetch POST - Recibe como parametro una ruta y un JSON Ej: "/prueba", {x:1,y:2}
const postData = async (route, data = {}) => {
  try {
    let res = await fetch(route, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    let json = await res.json();

    if (!res.ok) throw { status: res.status, statusText: res.statusText };
    return json;
  } catch (err) {
    console.log(err);
  }
};

// * deleteData -> Peticiones Fetch DELETE - Recibe como parametro una ruta Ej: "/delete/:id"
const deleteData = async (route) => {
  try {
    let res = await fetch(route, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    let json = await res.json();
    if (!res.ok) throw { status: res.status, statusText: res.statusText };
    return json;
  } catch (err) {
    console.log(err);
  }
};

// * Toast -> Pequeñas alertas, si modificas esto se modifican TODAS
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end', // * Posicion
  showConfirmButton: false,
  timer: 4000, // * Time
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

// * inputMayus -> Pasar a MAYUSCULAS el texto de los inputs
// * --- los cuales son seleccionados antes con 'let inputTal = document.getElementById("inputTal")'
// * --- se pasan los campos por Array de forma dinamica Ej: inputsMayus([inputTal, etc...])
// TODO --- Para un ejemplo ver input en el Login
const inputsMayus = (arrInputs = []) => {
  arrInputs.forEach((element) => {
    element.addEventListener('keyup', (e) => {
      element.value = element.value.toUpperCase();
    });
  });
};
// * limpiarCampos -> Limpia inputs Materialize - Misma idea de la function inputsMayus()
const limpiarCampos = (arrInputs = []) => {
  arrInputs.forEach((element) => {
    element.value = '';
    element.nextElementSibling.classList.remove('active');
  });
};
// * mensajeSuccess -> Muestra una alerta tomando el nombre de '<div id="messageSuccess" data-message="{{success}}"></div>'
// * --- ver en views/partials/messages.hbs
const mensajeSweetalert2 = () => {
  let message = '';
  const messageSuccess = document.getElementById('messageSuccess'),
    messageInfo = document.getElementById('messageInfo'),
    messageWarning = document.getElementById('messageWarning'),
    messageError = document.getElementById('messageError');
  if (messageSuccess) {
    message = messageSuccess.dataset.message;
    Toast.fire({ icon: 'success', title: message });
  } else if (messageInfo) {
    message = messageInfo.dataset.message;
    Toast.fire({ icon: 'info', title: message });
  } else if (messageWarning) {
    message = messageWarning.dataset.message;
    Toast.fire({ icon: 'warning', title: message });
  } else if (messageError) {
    message = messageError.dataset.message;
    Toast.fire({ icon: 'error', title: message });
  }
};
document.addEventListener('DOMContentLoaded', (e) => {
  mensajeSweetalert2();
});

// * Funciones Cargar y Ocultar loader
const containerLoader = document.getElementById('containerLoader'),
  textLoader = document.getElementById('textLoader'),
  cargarLoader = (message = 'Cargando...') => {
    containerLoader.classList.remove('hidden');
    textLoader.textContent = message;
  },
  ocultarLoader = () => {
    containerLoader.classList.add('hidden');
    textLoader.textContent = '';
  };
