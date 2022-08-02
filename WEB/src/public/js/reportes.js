document.addEventListener('DOMContentLoaded', () => {
  let table = '';
  let table1 = '';
  let information = [];
  let casosAbiertos = 0;
  let casosCerrados = 0;
  let casosPendientes = 0;
  let hora1;
  let hora2;
  let hora3;
  let hora4;
  let hora5;
  let mychart;
  let idclick;
  /*
  setTimeout(() => {
    
    M.toast({html: 'CARGANDO... ESPERE POR FAVOR'});  
  }, 1000);*/

 cargarLoader("Espere por favor...");
  
  setTimeout(() => {
    ocultarLoader();
  }, 6000);
  /*
  setTimeout(() => {
    M.toast({html: 'CARGANDO..'})  
  }, 2000);
  setTimeout(() => {
    M.toast({html: 'CARGANDO.'})  
  }, 3000);
  */
  
  
mychart=document.getElementById('mychar').getContext('2d');
setTimeout(() => {
  hora1=  new Date().getHours()-1;
  hora2= new Date().getHours()-2;
  hora3= new Date().getHours()-3;
  hora4= new Date().getHours()-4;
  hora5=new Date().getHours()-5;
/*
  hora1.setHours(hora1-1);
  hora2.setHours(hora2-2);
  hora3.setHours(hora3-3);
  hora4.setHours(hora4-4);
  hora5.setHours(hora5-5);
*/

  setInterval(() => {
    //captura fechas
  hora1=  new Date().getHours()-1;
  hora2= new Date().getHours()-2;
  hora3= new Date().getHours()-3;
  hora4= new Date().getHours()-4;
  hora5=new Date().getHours()-5;

console.log("las horas son",hora=new Date().getHours());

}, 10000);

}, 2000);


  const RefreshtableCasosPendientes=() =>{
  getData('/GECARep/allCasosPendientes').then((res) => {
      //console.log("HERRRRRRRRRRRR");
      table = '';
      console.log("heyyyyyyyyyyyyyyyyyyyy",res);
      if (res.result==0) {
      
        table += '  <td> ' +"No hay datos disponibles por el momento"+ '</td>';
        table += '  <td>' +"No hay datos disponibles por el momento"+'</td>';
        table += '  <td>' +"No hay datos disponibles por el momento"+ '</td>';
        table += '</tr>';
        document.getElementById('table2').innerHTML = table;
      }
      else if (res.result!=0) {
        res.result.forEach((mensaje) => {
          table += '<tr class="clickable-row modal-trigger" data-idsito2="' + mensaje.PKGES_CODIGO + '" href="#">';
          
          console.log("el jodido mensaje essssssssssssssssss ",mensaje.GES_NUMERO_COMUNICA);
        
        
            table += '  <td> ' + mensaje.GES_NUMERO_COMUNICA + '</td>';
            table += '  <td>' + mensaje.GES_CFECHA_REGISTRO + '</td>';
            table += '  <td>' + mensaje.GES_CESTADO + '</td>';
              
                
          table += '</tr>';
          
          
        });
        document.getElementById('table2').innerHTML = table;    
      }
      

     // clickTrs();
    });
    // ! Repeat
    setTimeout(() => {
      RefreshtableCasosPendientes();
    }, 2000);

  }
  RefreshtableCasosPendientes();
  //refresco data de las tablas

//esta primera es la grafica de torta

setInterval(function updateData() {
  getData('/GECARep/countCasosOpen').then((res) => {
    casosAbiertos = res.contador;
    sessionStorage.setItem('casosAbiertos', res.contador);
  });
  getData('/GECARep/countCasosClosed').then((res) => {
    casosCerrados = res.contador;
    sessionStorage.setItem('casosCerrados', res.contador);
  });
  getData('/GECARep/countCasosPending').then((res) => {
    casosPendientes = res.contador;
    sessionStorage.setItem('casosPending', res.contador);
  });
/***********/
 

  
}, 4000);

  setTimeout(function grafica() {
    //console.log("LOS VALORES QUE RECOJO",casosAbiertos,casosCerrados,casosPendientes);
    massPopchart = new Chart(mychart, {
      type: 'doughnut',
      data: {
        labels: ['EN GESTION', 'CERRADOS','EN COLA'],
        datasets: [
          {
            label: 'METRICAS CHATS',
            data: [sessionStorage.getItem('casosAbiertos'), sessionStorage.getItem('casosCerrados'), sessionStorage.getItem('casosPending')],
            backgroundColor: ['rgb(255,172,51)' ,'rgb(119, 255, 51)' ,'rgb(240, 128, 128)'],
          },
        ],
      },
      options: {
        animation: false
      },
    });
    
    setInterval(() => {
      //massPopchart.data.labels.pop();
      if(massPopchart.data.datasets.length!=0){

        
          massPopchart.data.datasets.pop();
          console.log("HEY WACHE ESTO>>>>>>>>>>>>>>>>>>",massPopchart.data.datasets.length);
          let label =['EN GESTION', 'CERRADOS','EN COLA'];
          let casabierto;
          let cascerrado;
          let caspendiente;
          casabierto=sessionStorage.getItem('casosAbiertos');
          cascerrado=sessionStorage.getItem('casosCerrados');
          caspendiente=sessionStorage.getItem('casosPending');
          let dataS=[casabierto,cascerrado ,caspendiente];
          //massPopchart.data.labels.push(label);
          massPopchart.data.datasets.push({
            label:label,
            data:dataS,
            backgroundColor: ['rgb(255,172,51)' ,'rgb(119, 255, 51)' ,'rgb(240, 128, 128)']
            
          });
          massPopchart.update();
          
        
        
        


      }
      
    }, 8000);


    //updateChartDonut(mychart);
  }, 5000);

});
