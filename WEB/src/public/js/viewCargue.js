document.addEventListener('DOMContentLoaded', (req, res) => {
  const btnCargarExcel = document.getElementById('btnCargarExcel');

  btnCargarExcel.addEventListener(
    'click',
    (e) => {
      // * Validar si agrego Excel
      let fileExcel = document.getElementById('fileExcel');
      if (!fileExcel.value) {
        Toast.fire({
          icon: 'error',
          title: `Seleccione un Excel`,
        });
        e.preventDefault();
      }
    },
    false
  );
});
