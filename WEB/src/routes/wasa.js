const router = require('express').Router();
const db = require('../database');
const path = require('path');
const ExcelJS = require('exceljs');

router.post('/cargarExcel', (req, res) => {
  let excel = req.files.fileExcel,
    nombreArchivo = `x${req.user.PKCRE_NCODIGO}x${excel.name}`,
    rutaArchivo = path.resolve(`./src/public/doc/excel/${nombreArchivo}`);
  // * Guardar Excel
  excel.mv(rutaArchivo, (err) => {
    if (err) {
      return res.status(500).send({ message: err });
    } else {
      // * Leer Excel
      const workbook = new ExcelJS.Workbook();
      let arrPhones = [];
      workbook.xlsx
        .readFile(rutaArchivo)
        .then(() => {
          let hojas = workbook.worksheets.map((sheet) => sheet.name),
            selectedHoja1 = workbook.getWorksheet(hojas[0]),
            rows = selectedHoja1.actualRowCount,
            phone,
            phoneInvalid = 0;
          for (let i = 1; i <= rows; i++) {
            phone = selectedHoja1.getRow(i).getCell(1).toString();
            // * Validar Numeros del Excel
            if (phone.length > 12 || isNaN(phone)) {
              phoneInvalid = i;
              break;
            }
            arrPhones.push(phone);
          }
          if (phoneInvalid) {
            req.flash('messageWarning', `El Numero de la celda <span style="color: #27ae60;">A${phoneInvalid}</span> es incorrecto`);
            res.redirect('wasa/dashboard');
          } else {
            // * Consultar Psicologos
            const sqlPsicologos = 'SELECT * FROM dbp_usuarios.tbl_rcredencial INNER JOIN dbp_usuarios.tbl_rpermiso ON dbp_usuarios.tbl_rcredencial.PKCRE_NCODIGO = dbp_usuarios.tbl_rpermiso.FKPER_NCRE_NCODIGO WHERE dbp_usuarios.tbl_rpermiso.PER_CNIVEL = "Psicologo"';
            db.promise()
              .query(sqlPsicologos)
              .then(([result, fields]) => {
                let dataPsicologos = [];
                result.forEach((psicologo) => {
                  dataPsicologos.push(psicologo);
                });
                return res.status(200).render('wasa/envioMasivo', { title: 'Envio Masivo', arrPhones, nombreExcel: excel.name, dataPsicologos });
              })
              .catch((err) => console.log('ERROR::', err));
          }
        })
        .catch((err) => console.log(err));
    }
  });
});

router.post('/envioMasivo', (req, res) => {
  const { nombreExcel, mensajeOferta, mensajeWasa, cBoxPsicologo, tipoEnvioMasivo } = req.body;
  const data = {
    FKENV_NCRE_NCODIGO: req.user.PKCRE_NCODIGO,
    ENV_CCOD_ENVIO: Date.now(),
    ENV_CNUMERO_DESTINO: '313...',
    ENV_CTIPO: 'TEXTO',
    ENV_CTEXTO_OFERTA: mensajeOferta || null,
    ENV_CMENSAJE: mensajeWasa,
    ENV_CESTADO_ENVIO: 'POR ENVIAR',
    ENV_CTIPO_MASIVO: tipoEnvioMasivo === 'on' ? 'ARBOL' : 'UNICO',
    ENV_CBANNER: null,
    ENV_PSICOLOGOS: cBoxPsicologo !== undefined ? (typeof cBoxPsicologo !== 'string' ? cBoxPsicologo.join('|') : cBoxPsicologo) : null,
    ENV_CDETALLE_REGISTRO: 'REGISTRO INICIAL DEL SISTEMA',
    ENV_CESTADO: 'Activo',
  };
  if (tipoEnvioMasivo) {
    let imgBanner = req.files.fileBanner,
      nombreImgBanner = `x${Date.now()}x${imgBanner.name}`,
      rutaImgBanner = path.resolve(`./src/public/doc/img/${nombreImgBanner}`);
    // * Guardar Img Banner
    imgBanner.mv(rutaImgBanner, (err) => {
      if (err) {
        return res.status(500).send({ message: err });
      } else {
        data.ENV_CBANNER = nombreImgBanner;
        // * Buscar Excel
        let nombreArchivo = `x${req.user.PKCRE_NCODIGO}x${nombreExcel}`,
          rutaArchivo = path.resolve(`./src/public/doc/excel/${nombreArchivo}`),
          arrPhones = [];
        const workbook = new ExcelJS.Workbook();
        // * Leer Numeros del Excel
        workbook.xlsx
          .readFile(rutaArchivo)
          .then(() => {
            let hojas = workbook.worksheets.map((sheet) => sheet.name),
              selectedHoja1 = workbook.getWorksheet(hojas[0]),
              rows = selectedHoja1.actualRowCount;
            for (let i = 1; i <= rows; i++) {
              arrPhones.push(selectedHoja1.getRow(i).getCell(1).toString());
            }
            const sqlInsert = 'INSERT INTO dbp_whatsappreclutamiento.tbl_enviar_mensaje SET ?';
            // * Registrar Cada Numero
            arrPhones.forEach((phone) => {
              data.ENV_CNUMERO_DESTINO = phone;
              db.promise()
                .query(sqlInsert, [data])
                .then(([result]) => {
                  console.log('Registrado', phone);
                })
                .catch((err) => console.log('ERROR::', err));
            });
            req.flash('messageSuccess', `Se enviaron <span style="color: #27ae60;">${rows}</span> mensajes <i class='bx bxl-whatsapp' style="color: #17aa70;"></i>`);
            res.redirect('/inicio');
          })
          .catch((err) => console.log(err));
      }
    });
  } else {
    // * Buscar Excel
    let nombreArchivo = `x${req.user.PKCRE_NCODIGO}x${nombreExcel}`,
      rutaArchivo = path.resolve(`./src/public/doc/excel/${nombreArchivo}`),
      arrPhones = [];
    const workbook = new ExcelJS.Workbook();
    // * Leer Numeros del Excel
    workbook.xlsx
      .readFile(rutaArchivo)
      .then(() => {
        let hojas = workbook.worksheets.map((sheet) => sheet.name),
          selectedHoja1 = workbook.getWorksheet(hojas[0]),
          rows = selectedHoja1.actualRowCount;
        for (let i = 1; i <= rows; i++) {
          arrPhones.push(selectedHoja1.getRow(i).getCell(1).toString());
        }
        const sqlInsert = 'INSERT INTO dbp_whatsappreclutamiento.tbl_enviar_mensaje SET ?';
        // * Registrar Cada Numero
        arrPhones.forEach((phone) => {
          data.ENV_CNUMERO_DESTINO = phone;
          db.promise()
            .query(sqlInsert, [data])
            .then(([result]) => {
              console.log('Registrado', phone);
            })
            .catch((err) => console.log('ERROR::', err));
        });
        req.flash('messageSuccess', `Se enviaron <span style="color: #27ae60;">${rows}</span> mensajes <i class='bx bxl-whatsapp' style="color: #17aa70;"></i>`);
        res.redirect('/inicio');
      })
      .catch((err) => console.log(err));
  }
});

router.get('/informeMensajes', (req, res) => {
  const sql = 'SELECT *, convert(GES_CFECHA_REGISTRO, date) as SoloFecha FROM dbp_whatsappreclutamiento.tbl_gestion';
  db.promise()
    .query(sql)
    .then(([result, fields]) => {
      res.render('wasa/informeMensajes', { title: 'Generar Informe', resultMensajes: result });
    });
});

router.post('/mensajesPorFecha', (req, res) => {
  const { fechaInicioM, fechaFinalM } = req.body;
  console.log(fechaInicioM, fechaFinalM);
  const sql = 'SELECT *, convert(GES_CFECHA_REGISTRO, date) as SoloFecha FROM dbp_whatsappreclutamiento.tbl_gestion WHERE DATE(GES_CFECHA_REGISTRO) between ? AND ?';
  db.promise()
    .query(sql, [fechaInicioM, fechaFinalM])
    .then(([result, fields]) => {
      res.json({ result });
    });
});

router.get('/registrarPsicologo', (req, res) => {
  const dataCredencial = {
    CRE_CUSUARIO: 'Sandrap.Martinez ',
    CRE_CNOMBRE: 'Sandra',
    CRE_CNOMBRE2: 'Paola',
    CRE_CAPELLIDO: 'Martinez',
    CRE_CAPELLIDO2: 'Vargas',
    CRE_CDOCUMENTO: '1018469894',
    CRE_CDETALLE_REGISTRO: 'Registrado por el Sistema',
    CRE_CESTADO: 'Activo',
  };
  const sqlSelectPsicologo = 'SELECT * FROM dbp_usuarios.tbl_rcredencial WHERE CRE_CDOCUMENTO = ?';
  db.promise()
    .query(sqlSelectPsicologo, [dataCredencial.CRE_CDOCUMENTO])
    .then(([resultSelectPsicologo]) => {
      if (resultSelectPsicologo.length > 0) {
        res.json({ message: 'Ya existe el Psicologo' });
      } else {
        // * Registrar Psicologo
        const sqlInsertCredencial = 'INSERT INTO dbp_usuarios.tbl_rcredencial SET ?';
        db.promise()
          .query(sqlInsertCredencial, [dataCredencial])
          .then(([resultInsertCredencial]) => {
            if (resultInsertCredencial.insertId) {
              const dataRPermiso = {
                FKPER_NCRE_NCODIGO: resultInsertCredencial.insertId,
                PER_CNIVEL: 'Psicologo',
                PER_CPERMISO: 'Lectura',
                PER_CCLIENTE: 'COS',
                PER_CCAMPANA: 'RECLUTAMIENTO',
                PER_CAREA: 'WHATSAPP',
                PER_CCARGO: 'Psicologo',
                PER_CNUMERO_CONTACTO: '3213247889',
                PER_CTIPOLOGUEO: 'SIMPLE',
                PER_CESTADO_LOGUEO: 'LIBRE',
                PER_CDETALLE_REGISTRO: 'Registrado por el Sistema',
                PER_CESTADO: 'Activo',
              };
              const sqlInsertRPermiso = 'INSERT INTO dbp_usuarios.tbl_rpermiso SET ?';
              db.promise()
                .query(sqlInsertRPermiso, [dataRPermiso])
                .then(([resultInsertRPermiso]) => {
                  console.log(`${dataCredencial.CRE_CUSUARIO} - Registrado. - IDCredencial: ${resultInsertCredencial.insertId} - IDRPermiso: ${resultInsertRPermiso.insertId}`);
                  res.json({ message: `${dataCredencial.CRE_CUSUARIO} - Registrado. - IDCredencial: ${resultInsertCredencial.insertId} - IDRPermiso: ${resultInsertRPermiso.insertId}` });
                })
                .catch((err) => console.log('ERROR::', err));
            }
          })
          .catch((err) => console.log('ERROR::', err));
      }
    });
});

router.post('/registrarUser', (req, res) => {
  console.log(req.body);
  const dataCredencial = {
    CRE_CUSUARIO: req.body.CRE_CUSUARIO || null,
    CRE_CNOMBRE: req.body.CRE_CNOMBRE || null,
    CRE_CNOMBRE2: req.body.CRE_CNOMBRE2 || null,
    CRE_CAPELLIDO: req.body.CRE_CAPELLIDO || null,
    CRE_CAPELLIDO2: req.body.CRE_CAPELLIDO2 || null,
    CRE_CDOCUMENTO: req.body.CRE_CDOCUMENTO || null,
    CRE_CDETALLE_REGISTRO: 'Registrado por el Sistema',
    CRE_CESTADO: 'Activo',
  };
  const sqlSelectPsicologo = 'SELECT * FROM dbp_usuarios.tbl_rcredencial WHERE CRE_CDOCUMENTO = ?';
  db.promise()
    .query(sqlSelectPsicologo, [dataCredencial.CRE_CDOCUMENTO])
    .then(([resultSelectPsicologo]) => {
      if (resultSelectPsicologo.length > 0) {
        res.json({ message: 'Ya existe el Usuario' });
      } else {
        // * Registrar Psicologo
        const sqlInsertCredencial = 'INSERT INTO dbp_usuarios.tbl_rcredencial SET ?';
        db.promise()
          .query(sqlInsertCredencial, [dataCredencial])
          .then(([resultInsertCredencial]) => {
            if (resultInsertCredencial.insertId) {
              const dataRPermiso = {
                FKPER_NCRE_NCODIGO: resultInsertCredencial.insertId,
                PER_CNIVEL: req.body.PER_CNIVEL || null, // *
                PER_CPERMISO: 'Lectura',
                PER_CCLIENTE: req.body.PER_CCLIENTE || null, // *
                PER_CCAMPANA: req.body.PER_CCAMPANA || null, // *
                PER_CAREA: req.body.PER_CAREA || null, // *
                PER_CCARGO: req.body.PER_CCARGO || null, // *
                PER_CTIPOLOGUEO: 'SIMPLE',
                PER_CESTADO_LOGUEO: 'LIBRE',
                PER_CDETALLE_REGISTRO: 'Registrado por el Sistema',
                PER_CESTADO: 'Activo',
              };
              const sqlInsertRPermiso = 'INSERT INTO dbp_usuarios.tbl_rpermiso SET ?';
              db.promise()
                .query(sqlInsertRPermiso, [dataRPermiso])
                .then(([resultInsertRPermiso]) => {
                  console.log(`${dataCredencial.CRE_CUSUARIO} - Registrado. - IDCredencial: ${resultInsertCredencial.insertId} - IDRPermiso: ${resultInsertRPermiso.insertId}`);
                  res.json({ message: `${dataCredencial.CRE_CUSUARIO} - Registrado. - IDCredencial: ${resultInsertCredencial.insertId} - IDRPermiso: ${resultInsertRPermiso.insertId}` });
                })
                .catch((err) => console.log('ERROR::', err));
            }
          })
          .catch((err) => console.log('ERROR::', err));
      }
    });
});

// * Rutas Psicologos
router.get('/aspirantePsicologo', (req, res) => {
  // * Verificar si tiene un aspirante asignado
  const sqlAspiranteAsignado = 'SELECT * FROM dbp_whatsappreclutamiento.tbl_gestion WHERE GES_CDETALLE11 = ? AND GES_CDETALLE12 = "POR GESTIONAR"';
  db.promise()
    .query(sqlAspiranteAsignado, req.user.PKCRE_NCODIGO)
    .then(([resultAspiranteAsignado]) => {
      if (resultAspiranteAsignado.length > 0) {
        // * Si ya tiene Asignado un aspirante
        console.log(req.user.CRE_CUSUARIO, 'Tiene asignado un Aspirante');
        const sqlEnvioMasivoRelacionado = 'SELECT * FROM dbp_whatsappreclutamiento.tbl_enviar_mensaje WHERE PKENV_NCODIGO = ?';
        db.promise()
          .query(sqlEnvioMasivoRelacionado, resultAspiranteAsignado[0].FKGES_NENV_CODIGO)
          .then(([resultEnvioMasivoRelacionado]) => {
            if (resultEnvioMasivoRelacionado.length > 0) {
              res.render('wasa/aspirantePsicologo', { title: 'Proceso Aspirante', aspiranteAsignado: resultAspiranteAsignado[0], envioMasivoRelacionado: resultEnvioMasivoRelacionado[0] });
            }
          });
      } else {
        // * Si No tiene Asignado un aspirante
        console.log(req.user.CRE_CUSUARIO, 'No tiene asignado un Aspirante');
        const sqlAspirantePreAsignado = 'SELECT * FROM dbp_whatsappreclutamiento.tbl_gestion WHERE GES_CDETALLE10 LIKE "%?%" AND GES_CDETALLE12 = "POR GESTIONAR" ORDER BY GES_CFECHA_REGISTRO DESC';
        db.promise()
          .query(sqlAspirantePreAsignado, req.user.PKCRE_NCODIGO)
          .then(([resultAspirantePreAsignado]) => {
            if (resultAspirantePreAsignado.length > 0) {
              // * Si tiene aspirantes por asignar y asignarle uno
              // * Seleccionar PKGES_CODIGO del primer registro encontrado
              let idPKGES_CODIGO = resultAspirantePreAsignado[0].PKGES_CODIGO;
              const sqlUpdate = 'UPDATE dbp_whatsappreclutamiento.tbl_gestion SET GES_CDETALLE11 = ? WHERE PKGES_CODIGO = ?';
              db.promise()
                .query(sqlUpdate, [req.user.PKCRE_NCODIGO, idPKGES_CODIGO])
                .then((resultUpdate) => {
                  console.log('Asignando');
                  db.promise()
                    .query(sqlAspiranteAsignado, req.user.PKCRE_NCODIGO)
                    .then(([resultAspiranteAsignado]) => {
                      if (resultAspiranteAsignado.length > 0) {
                        // * Si ya tiene Asignado un aspirante
                        console.log(req.user.CRE_CUSUARIO, 'Tiene asignado un Aspirante');
                        const sqlEnvioMasivoRelacionado = 'SELECT * FROM dbp_whatsappreclutamiento.tbl_enviar_mensaje WHERE PKENV_NCODIGO = ?';
                        db.promise()
                          .query(sqlEnvioMasivoRelacionado, resultAspiranteAsignado[0].FKGES_NENV_CODIGO)
                          .then(([resultEnvioMasivoRelacionado]) => {
                            if (resultEnvioMasivoRelacionado.length > 0) {
                              res.render('wasa/aspirantePsicologo', { title: 'Proceso Aspirante', aspiranteAsignado: resultAspiranteAsignado[0], envioMasivoRelacionado: resultEnvioMasivoRelacionado[0], nuevoAspirante: true });
                            }
                          });
                      }
                    });
                })
                .catch((err) => console.log('ERROR::', err));
            } else {
              // * Si no tiene aspirantes por asignar
              console.log('--> NO TIENE ASPIRANTE POR GESTIONAR');
              res.render('wasa/aspirantePsicologo', { title: 'Proceso Aspirante', sinAsignacion: true });
            }
          })
          .catch((err) => console.log('ERROR::', err));
      }
    })
    .catch((err) => console.log('ERROR::', err));
});

router.post('/envioGestionAspirante/:id', (req, res) => {
  const { observacion, tipificacion } = req.body;
  const { id } = req.params;
  const sqlUpdate = 'UPDATE dbp_whatsappreclutamiento.tbl_gestion SET GES_CDETALLE12 = "GESTIONADO", GES_CDETALLE13 = ?, GES_CDETALLE14 = ? WHERE PKGES_CODIGO = ?';
  db.promise()
    .query(sqlUpdate, [observacion, tipificacion, id])
    .then((resultUpdate) => {
      req.flash('messageSuccess', `Proceso terminado para el aspirante`);
      res.redirect('/wasa/aspirantePsicologo');
    })
    .catch((err) => console.log('ERROR::', err));
});

module.exports = router;
// TODO 1012339663
