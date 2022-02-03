const passport = require("passport");
const LocalStratregy = require("passport-local").Strategy;
//modulo de conexion a directorio activo
const ActiveDirectory = require("activedirectory2").promiseWrapper;
//Modulo de encriptacion RPA
var Class2 = require(".//Class2");
const helpers = require(".//helper");
const keys = require("../keys");
const con = require("../database");
var os = require( 'os' );
var array = [];

var groupName = Class2.DeCrypt(
  "414748335A6D7031417752335A774C3541784C335A6A3D3D"
);



passport.use("local.login",new LocalStratregy(
    {
      usernameField: "username",
      passwordField: "password",
      passReqToCallback: true,
    },
    (req, Usuario, Password, done) => {

      var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
      //Declaracion de variables para el directorio  activo
      var query ="sAMAccountName="+ Usuario;
      Usuario=Usuario+keys.domain
      keys.config.username = Usuario
      keys.config.password = Password
      var ad = new ActiveDirectory(keys.config);
      
      //Valida si el usuario tiene mas de dos intentos
      var validator = true;
      for (i = 0; i < array.length; i++) {
        d = array[i][0];
        if (d.nombre == Usuario && d.Intentos == "1") {
          let min = new Date();
          let minutoss = min.getMinutes();
          if ((array[i][1] + 2 < minutoss) || (array[i][1] + 2 < 59 && minutoss < 2 )) {
            delete array[i];
            array.splice(i, 1);
          }
          validator = false;
          //le envia error por exceder los intentos
          done(null,false,req.flash("messageError","A excedido los intentos de logueo, por favor espere unos minutos antes de volver a intentar"));
        }
      }
      if (validator) {
        var networkInterfaces = os.networkInterfaces( );
        // valida con el usuario en directorio activo 
        ad.authenticate(Usuario, Password, function async(err, auth) {
          if (err) {
            console.log("ERROR: " + JSON.stringify(err));
          }
          if (auth) {
            ad.findUsers(query, true, function async(err, users) {
              if (err) {
                console.log("ERROR: " + JSON.stringify(err));
                return;
              }
              if (!users || users.length == 0) console.log("No users found.");
              else {
                // console.log('\n findUsers: ' + JSON.stringify(users) + '\n');
                var taskId = helpers.obtain(users, "distinguishedName");
                if (taskId.grupo){
                  con
                  .promise()
                  .query(
                    "SELECT * FROM "+keys.database.database+".tbl_rpermiso where PER_CUSUARIO = '"+(Usuario.split("@"))[0]+"';")
                    .then(async ([caso, fields]) => {
                      console.log('peloooooooooooo');
                      console.log(caso.length)
                      if (caso.length > 0 && ((caso[0].PER_CESTADO_LOGUEO != 'LIBRE') && (caso[0].PER_CESTADO_LOGUEO != 'DELOGUEO'))){
                        //console.log("#ENTRA EN EL DUPLICADOOO#"+caso[0].PER_CESTADO_LOGUEO )
                        const user = {'Nombre':taskId.nombre,'Usuario':(Usuario.split("@"))[0],'Duplicated':'1','PKPER_NCODIGO':caso[0].PKPER_NCODIGO,'PER_CNIVEL':caso[0].PER_CNIVEL};
                        done(null,user,req.flash("messageSuccess", "Welcome"));
                      }else if  (caso.length > 0 && ((caso[0].PER_CESTADO_LOGUEO == 'LIBRE') || (caso[0].PER_CESTADO_LOGUEO == 'DELOGUEO'))){
                        console.log("entra en update!!!")
                        await con
                      .promise()
                      .query(
                        "UPDATE "+keys.database.database+".tbl_rpermiso SET PER_CESTADO_LOGUEO = '"+ip+"' WHERE (PKPER_NCODIGO = '"+caso[0].PKPER_NCODIGO+"');")
                        const user = {'Nombre':taskId.nombre,'Usuario':(Usuario.split("@"))[0],'permiso':caso[0].PER_CNIVEL, 'Duplicated':'0'};
                        done(null,user,req.flash("messageSuccess", "Welcome"));
                        console.log("\nAutenticado\n");
                      }else{
                        console.log("lo agrega")
                        con
                        .promise()
                        .query(
                          "INSERT INTO "+keys.database.database+".tbl_rpermiso (FKPER_CUSUARIOS, PER_CFECHA_LOGUEO, PER_CTIPOLOGUEO, PER_CESTADO_LOGUEO) VALUES ('"+(Usuario.split("@"))[0]+"', now(), 'Simple', 'Usted ya tiene una sesion iniciada en la ubicacion "+ip+" a la hora "+new Date()+"');"
                        ) 
                        const user = {'Nombre':taskId.nombre,'Usuario':(Usuario.split("@"))[0], 'Duplicated':'0'};
                        done(null,user,req.flash("messageSuccess", "Welcome"));
                        console.log("\nAutenticado\n");
                      }
                  });

                }else{
                    done(null,false,req.flash("messageError", "No pertenece a esta campaña"));
                    console.log("\n No grupo\n");
                  }
              }
              
            });
          } else {
            var err2 = JSON.stringify(err)
            let split = err2.split(",")
            codigo = split[2]
            //console.log(codigo)
            if (codigo ==" data 775"){
              console.log("si entra a el error")
              done(
                null,
                false,
                req.flash("messageError", "Usuario bloqueado en directorio activo por favor solicite ayuda de IT")
              );
            }else{
            if (array.length > 0) {
              for (i = 0; i < array.length; i++) {
                d = array[i][0];
                if (d.nombre == Usuario) {
                  if (d.nombre == Usuario && d.Intentos == 1) {
                    d.Intentos = 1;
                    let min0 = new Date();
                    let minutos = min0.getMinutes();
                    array[i][1] = minutos;
                    var encontrado = true;
                    break;
                  }
                  var encontrado = true;
                  break;
                } else {
                  var encontrado = false;
                }
              }
              //console.log(encontrado);
              if (encontrado) {
              } else {
                console.log("lo agrega por que no lo encontro");
                let elemento = { nombre: Usuario, Intentos: 1 };
                let min0 = new Date();
                let minutos = min0.getMinutes();
                array.push([elemento, minutos]);
              }
            } else {
              console.log("lo agrega");
              let elemento = { nombre: Usuario, Intentos: 1 };
              let min0 = new Date();
              let minutos = min0.getMinutes();
              array.push([elemento, minutos]);
            }
            //console.log(array);
            console.log("Autenticacion fallida!");
            done(
              null,
              false,
              req.flash("messageError", "Verifique el usuario y la contraseña")
            );
          }
        }});
      }
    }
  )
);


passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser(async (user, done) => {
  //console.log(user);
  done(null, user);
})
