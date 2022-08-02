const router = require('express').Router();
const db = require('../database');
const path = require('path');
const ExcelJS = require('exceljs');
const fs = require('fs');
const { userInfo } = require('os');

router.get('/reportesExcel', (req, res) => {
  res.render('samaritana/reportExcel', { title: 'Reportes export' });
});



router.post('/generarExcelPapitas', (req, res) => {

  const { fechaIni,fechaFin } = req.body;
console.log("ESTA ES LA INFO QUE LLEGA",fechaIni,fechaFin);
  // * Crear Copia de la plantilla
  let rutaInformePlantilla = path.resolve('./src/public/doc/Excel/ExcelPlantilla.xlsx'),
    rutaInformeFinal = path.resolve('./src/public/doc/Excel/ExcelInforme.xlsx');
  // * Se toma el Excel plantilla para crear el nuevo Excel
  fs.copyFile(rutaInformePlantilla, rutaInformeFinal, async (err) => {
    if (err) throw err;
    try {
      let workbook = new ExcelJS.Workbook();
      // * Leer Excel que se acabo de crear
      workbook = await workbook.xlsx.readFile(rutaInformeFinal);
      let hojas = workbook.worksheets.map((sheet) => sheet.name),
        worksheet = workbook.getWorksheet(hojas[0]);

      // * Tomar data de DB para insertar en el Excel, POR PARTES :V
      const sqlSelect1 = `SELECT GES_NUMERO_COMUNICA ,GES_CDETALLE2,concat(CRE_CNOMBRE,CRE_CNOMBRE2,CRE_CAPELLIDO2) as NombreAsesor, CRE_CDOCUMENTO as documentoAsesor, GES_CFECHA_REGISTRO,GES_CFECHA_MODIFICACION,GES_CDETALLE6 as EPS,GES_CDETALLE7 as fechaAuth,(SELECT MEN_CFECHA_REGISTRO FROM dbp_what_samaritana.tbl_mensajes_chat WHERE FK_GES_CODIGO = PKGES_CODIGO AND MEN_ESTADO_MENSAJE != 'RECIBIDO' ORDER BY PKMEN_NCODIGO ASC LIMIT 1) as fechaIni,(SELECT MEN_CFECHA_REGISTRO FROM dbp_what_samaritana.tbl_mensajes_chat WHERE FK_GES_CODIGO = PKGES_CODIGO AND MEN_ESTADO_MENSAJE != 'RECIBIDO' ORDER BY PKMEN_NCODIGO DESC LIMIT 1) as fechaFin, GES_CDETALLE8 as fechaVencimiento,GES_CDETALLE9 as cups,GES_CDETALLE10 as tipoDoc,GES_CDETALLE11 as numberDoc, GES_CDETALLE12 as NumeroAuth FROM dbp_what_samaritana.tbl_rpermiso,dbp_what_samaritana.tbl_gestion,dbp_what_samaritana.tbl_mensajes_chat,dbp_what_samaritana.tbl_rcredencial where FKPER_NCRE_NCODIGO=PKCRE_NCODIGO and FKGES_NPER_CODIGO=PKPER_NCODIGO and PKGES_CODIGO=FK_GES_CODIGO and GES_CFECHA_REGISTRO between ? and ? group by FK_GES_CODIGO order by PKGES_CODIGO asc;`;
      await db
        .promise()
        .query(sqlSelect1,[fechaIni,fechaFin])
        .then(async ([result]) => {
          result.forEach(elem => {
            worksheet.addRow(Object.values(elem));
          });
        })
        .catch((err) => console.log('ERROR::', err));

      // * Despues de Insertar se Guarda el Excel
      workbook.xlsx.writeFile(rutaInformeFinal);
      res.json({ generated: true });
    } catch (err) {
      console.log(err);
    }
  });
});






module.exports = router;