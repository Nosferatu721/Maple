document.addEventListener('DOMContentLoaded', () => {

  var elems = document.querySelectorAll('.datepicker');
  var instance = M.Datepicker.getInstance(elems);

  cargarLoader("Espere por favor...");
  
  setTimeout(() => {
    ocultarLoader();
  }, 4000);

  fechaIni=document.getElementById('timeInit').value;
  fechaFin=document.getElementById('timeFin').value;
  buttonDownload=document.getElementById('buttonDown');
  buttonGen=document.getElementById('generateReport');
  buttonDownload.style.display = 'none'; 

  buttonGen.addEventListener("click",()=>{

    if (document.getElementById('timeInit').value!="" && document.getElementById('timeInit').value!= "" ) {
      let fechaInis= document.getElementById('timeInit').value+" 00:00:00";
      let fechaFins= document.getElementById('timeFin').value+" 23:59:59";
      buttonDownload.style.display = 'visible';
      buttonDownload.style.display = 'inline-block';
      
      
      
  
      console.log("ENTRO AL IF",fechaInis,fechaFins);
  postData('/samaritanaRepExport/generarExcelPapitas',{ fechaIni:fechaInis,fechaFin:fechaFins }).then((res) => {
        
      
      });
    
      document.getElementById('timeInit').value="";
      document.getElementById('timeFin').value="";
      M.toast({html: 'ATENCIÓN: seleccione el botón para descargar el archivo excel'})
    }
    else {
      console.log("no ha ingresado fecha");
      M.toast({html: 'DILIGENCIE TODOS LOS CAMPOS'})
      
    }
      

  });



})

