const { PassThrough } = require('stream');
var Class2 = require('.//Class2');
//no olvidar cifrar
const ip = '172.70.7.70';
const userServer = 'cos_crm';
const pass = 'gestiongeneralcos:2020';
const DB = 'dbp_whatsappmapple';

// const ip=Class2.DeCrypt('5A6D526D416D5A6C5A7A486D416D5A6A5A7A486D416D57795A6D566D5A6A3D3D');
// const userServer=Class2.DeCrypt('41775A324D77706D414A4C325A6D706C417A443D');
// const pass=Class2.DeCrypt('417770324147706D416D443242474D7A417A4832416D4C31417A48324147706C417752324C6D4C6D417A4C335A6D41755A6D566D5A515A6C5A6D4E3D');
// const DB=Class2.DeCrypt('416D486D41775A6D5A6D566D41515A6A5A6D4C6D42515A6C5A6D743145774C30417756335A514954416D703242514C6B416D44335A6D4C6B416D4E335A514C6C41784C3D')

module.exports = {
  database: {
    host : ip,
    user : userServer,
    password : pass,
    database : DB
  },
  // database: {
  //   host: '127.0.0.1',
  //   user: 'root',
  //   password: '',
  //   database: 'dbp_whatsappmapple',
  // },
};
console.log('credenciales', ip, userServer, pass, DB);
