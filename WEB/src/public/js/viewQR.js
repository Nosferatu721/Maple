document.addEventListener('DOMContentLoaded', () => {
  const imgQR = document.getElementById('imgQR'),
    sincronizadoMSG = document.getElementById('sincronizadoMSG');

  let QRString = '';

  const MostrarQR = () => {
    console.log('Buscando QR');
    getData('/GECA/getQR').then((res) => {
      if (res.result === true) {
        console.log('Sincronizado');
        sincronizadoMSG.classList.remove('hidden');
        imgQR.classList.add('hidden');
      } else {
        if (!(QRString === res.result.EST_CDETALLE)) {
          QRString = res.result.EST_CDETALLE;
          new QRious({ element: imgQR, value: res.result.EST_CDETALLE, size: 600 });
        }
        setTimeout(() => {
          MostrarQR();
        }, 1000);
      }
    });
  };
  MostrarQR();
});
