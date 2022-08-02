document.addEventListener("DOMContentLoaded", function () {
  // * Materialize
  window.elemsModal = document.querySelectorAll(".modal");
  M.Modal.init(elemsModal);
  var elemsSelect = document.querySelectorAll('.select');
  M.FormSelect.init(elemsSelect);
  // * Maximo Caracteres Inputs Materialize
  $('[data-length]').characterCounter();
  // * Tabs Cards Materialize
  // $(document).ready(function () {
  //   $("ul.tabs").tabs();
  // });
  // * Collapsible //
  let elemsCollapsible = document.querySelectorAll('.collapsible');
  M.Collapsible.init(elemsCollapsible);
  // * MaterialBox //
  let elemsMaterialBox = document.querySelectorAll('.materialboxed');
  M.Materialbox.init(elemsMaterialBox);
  // * Picker //
  let elemsPicker = document.querySelectorAll('.datepicker');
  M.Datepicker.init(elemsPicker);
  $('.datepicker').datepicker({
    autoClose: true,
    format: 'yyyy-mm-dd',
    container: 'body',
    i18n: {
      months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      weekdays: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    },
  });
});
