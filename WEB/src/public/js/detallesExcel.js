document.addEventListener('DOMContentLoaded', () => {
  const columnExcelList = document.querySelectorAll('.columnExcel');
  columnExcelList.forEach((columnExcelName) => {
    columnExcelName.addEventListener('click', () => {
      // * Tomar valor a agregar al cuerpo del mensaje
      let nameColumn = columnExcelName.textContent.trim();
      // * Tomar cuerpo actual
      const cuerpoMsg = document.querySelector('#cuerpoMsg');
      let arrValueCuerpoMsg = cuerpoMsg.value.split(''),
        selectNow = cuerpoMsg.selectionStart;

      // * Agregar valor al cuerpo del mensaje
      let valueFinal = [...arrValueCuerpoMsg.slice(0, selectNow), `(${nameColumn})`, ...arrValueCuerpoMsg.slice(selectNow, arrValueCuerpoMsg.length)];
      cuerpoMsg.value = valueFinal.join('');
    });
  });

  const btnEnviarMsgs = document.querySelector('#btnEnviarMsgs');
  btnEnviarMsgs.addEventListener(
    'click',
    () => {
      // * Validar si agrego mensaje
      let cuerpoMsg = document.getElementById('cuerpoMsg');
      if (!cuerpoMsg.value) {
        Toast.fire({
          icon: 'error',
          title: `Agrege un mensaje`,
        });
        e.preventDefault();
      } else {
        cargarLoader('Cargando... Espere Por Favor');
      }
    },
    false
  );

  const cuerpoMsgInput = document.querySelector('#cuerpoMsg');
  const titleAndValue = document.querySelectorAll('.columnExcel');
  let columnasInExcel = {}
  titleAndValue.forEach((el) => {
    console.log(el.dataset.title);
    columnasInExcel[el.dataset.title] = el.dataset.titlevalue;
  });
  cuerpoMsgInput.addEventListener('keyup', () => {
    let cuerpoMsg = cuerpoMsgInput.value;

    let arr = cuerpoMsg.split('('),
      columnasInMsg = [];
    arr.forEach((el) => {
      if (el.includes(')')) {
        let nColumn = el.split(')')[0];
        columnasInMsg.push(nColumn);
      }
    });

    let newMsg = cuerpoMsg
    columnasInMsg.forEach((el) => {
      newMsg = newMsg.replace(`(${el})`, columnasInExcel[el])
    });
    
    const preview = document.querySelector('#preview');
    preview.textContent = newMsg;
  });
});
