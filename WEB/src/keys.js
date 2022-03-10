
var Class2 = require("./public/js/Class2")

//// Variables de usuario active directorty
url = Class2.DeCrypt('41785A3241514C6B416D4E6D444757545A784C32416D706C41784C334147706A41775A324577706D5A7848325A6D4D544178443D')
baseDN = Class2.DeCrypt('415144305A6D4152417770335A774D54416D48335A514C6D41784C335A6D5751415144305A6D415241775A3245774D52')
username = ''
password = ''

domain = Class2.DeCrypt('41514E32416D706C41784C334147706A41775A324577706D5A7848325A6D4D544178443D')
module.exports = {
  // database: {
  //   host: '172.70.7.70',
  //   user: 'cos_crm',
  //   password: 'gestiongeneralcos:2020',
  //   database: 'dbp_whatsappmapple',
  // },
  database: {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'dbp_whatsappmapple',
  },
  // Variables de configuracion de active directory
  config: {
    url: 'LDAP://172.70.7.11:389',
    baseDN: baseDN,
    username: username,
    password: password,
  },
  domain,
};