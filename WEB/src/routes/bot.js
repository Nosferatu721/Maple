const router = require("express").Router();
const fetch = require("node-fetch");
const { exec, spawn } = require("child_process");
// const fetch = require("");
const db = require("../database");

router.get("/verMas/:id", (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM dbp_virtualvcdial.tbl_rbots WHERE PKBOT_NCODIGO = ? AND BOT_NCONSULTA = "ControlInicioBot" AND BOT_CDETALLE8 = ? AND BOT_CDETALLE9 = ? AND BOT_CDETALLE10 = ? AND BOT_CESTADO = "Activo"';
  db.promise()
    .query(sql, [id, req.user.rpermiso.PER_CCLIENTE, req.user.rpermiso.PER_CCAMPANA, req.user.rpermiso.PER_CAREA])
    .then(([result, fields]) => {
      const ip = result[0].BOT_CDETALLE2,
        user = result[0].BOT_CDETALLE3,
        pass = result[0].BOT_CDETALLE4,
        campaña = result[0].BOT_CDETALLE6;
      let url = `http://${ip}/vicidial/non_agent_api.php?source=test&user=${user}&pass=${pass}&function=logged_in_agents&stage=pipe&campaigns=${campaña}`;
      // * http://172.70.7.20/vicidial/non_agent_api.php?source=test&user=1022390687&pass=1022390687&function=logged_in_agents&stage=pipe&campaigns=FAMIBLAS
      fetch(url)
        .then((res) => res.text())
        .then((body) => {
          let arrAgentes = [];
          let agentes = body.split("\n");
          agentes.forEach((element) => {
            if (element !== "") {
              let agente = element.split("|");
              arrAgentes.push(agente);
            }
          });
          res.json({ ok: true, arrAgentes, result: result[0] });
        })
        .catch((err) => console.log("ERROR::", err));
    });
});

router.get("/getCamp/:id", (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT BOT_CDETALLE5, BOT_CDETALLE7 FROM dbp_virtualvcdial.tbl_rbots WHERE PKBOT_NCODIGO = ? AND BOT_NCONSULTA = "ControlInicioBot" AND BOT_CDETALLE8 = ? AND BOT_CDETALLE9 = ? AND BOT_CDETALLE10 = ? AND BOT_CESTADO = "Activo"';
  db.promise()
    .query(sql, [id, req.user.rpermiso.PER_CCLIENTE, req.user.rpermiso.PER_CCAMPANA, req.user.rpermiso.PER_CAREA])
    .then(([result, fields]) => {
      res.json({ result: result[0] });
    })
    .catch((err) => console.log("ERROR::", err));
});

router.get("/all", (req, res) => {
  const sql = 'SELECT * FROM dbp_virtualvcdial.tbl_rbots WHERE BOT_NCONSULTA = "ControlInicioBot" AND BOT_CDETALLE1 != "0" AND BOT_CDETALLE8 = ? AND BOT_CDETALLE9 = ? AND BOT_CDETALLE10 = ? AND BOT_CESTADO = "Activo"';
  db.promise()
    .query(sql, [req.user.rpermiso.PER_CCLIENTE, req.user.rpermiso.PER_CCAMPANA, req.user.rpermiso.PER_CAREA])
    .then(([result, fields]) => {
      let fechaActual = Math.round(Date.now() / 1000);
      result.forEach((row) => {
        let fechaDB = new Date(row.BOT_CFECHA_MODIFICACION).getTime() / 1000;
        let diferenciaTiempo = fechaActual - fechaDB;
        if (diferenciaTiempo > 60 && row.BOT_CDETALLE1 == "3") {
          const sqlUpdate = "UPDATE dbp_virtualvcdial.tbl_rbots SET BOT_CDETALLE1 = ?, BOT_CDETALLE7 = ? WHERE PKBOT_NCODIGO = ?";
          db.promise()
            .query(sqlUpdate, [1, "DETENER", row.PKBOT_NCODIGO])
            .then(([result, fields]) => {
              console.log(result);
            })
            .catch((err) => console.log("ERROR::", err));
        }
      });
      res.json({ result });
    })
    .catch((err) => console.log("ERROR::", err));
});

router.get("/porId/:id", (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM dbp_virtualvcdial.tbl_rbots WHERE PKBOT_NCODIGO = ? AND BOT_NCONSULTA = "ControlInicioBot" AND BOT_CDETALLE8 = ? AND BOT_CDETALLE9 = ? AND BOT_CDETALLE10 = ? AND BOT_CESTADO = "Activo"';
  db.promise()
    .query(sql, [id, req.user.rpermiso.PER_CCLIENTE, req.user.rpermiso.PER_CCAMPANA, req.user.rpermiso.PER_CAREA])
    .then(([result, fields]) => {
      res.json({ result: result[0] });
    })
    .catch((err) => console.log("ERROR::", err));
});

router.get("/detener/:id", (req, res) => {
  const { id } = req.params;
  const sql = "UPDATE dbp_virtualvcdial.tbl_rbots SET BOT_CDETALLE1 = ?, BOT_CDETALLE7 = ? WHERE PKBOT_NCODIGO = ?";
  db.promise()
    .query(sql, [1, "DETENER", id])
    .then(([result]) => {
      console.log(result);
      res.json({ result });
    })
    .catch((err) => console.log("ERROR::", err));
});

router.get("/activar/:id", (req, res) => {
  const { id } = req.params;
  const sqlUpdate = "UPDATE dbp_virtualvcdial.tbl_rbots SET BOT_CDETALLE1 = 0, BOT_CDETALLE7 = NULL WHERE PKBOT_NCODIGO = ?";
  db.promise()
    .query(sqlUpdate, [id])
    .then(([result]) => {
      res.json({ result });
      const sql = 'SELECT BOT_CDETALLE FROM dbp_virtualvcdial.tbl_rbots WHERE PKBOT_NCODIGO = ? AND BOT_NCONSULTA = "ControlInicioBot" AND BOT_CESTADO = "Activo"';
      db.promise()
        .query(sql, [id])
        .then(([resultSelect, fields]) => {
          console.log(resultSelect[0].BOT_CDETALLE);
          ejecutarPython(resultSelect[0].BOT_CDETALLE);
        })
        .catch((err) => console.log("ERROR::", err));
    })
    .catch((err) => console.log("ERROR::", err));
});

router.post(
  "/new",
  (req, res, next) => {
    // Validar si ya existe el Bot por Nombre
    const { nombre_bot } = req.body;
    const sql = 'SELECT * FROM dbp_virtualvcdial.tbl_rbots WHERE BOT_NCONSULTA = "ControlInicioBot" AND BOT_CDETALLE = ? AND BOT_CESTADO = "Activo"';
    db.promise()
      .query(sql, [nombre_bot])
      .then(([result, fields]) => {
        if (result.length) {
          res.json({ nombre_bot });
        } else {
          next();
        }
      })
      .catch((err) => console.log(err));
  },
  (req, res) => {
    const { nombre_bot, ip, user, password } = req.body;
    const data_bot = {
      BOT_NCONSULTA: "ControlInicioBot",
      BOT_CDETALLE: nombre_bot,
      BOT_CDETALLE1: 0,
      BOT_CDETALLE2: ip,
      BOT_CDETALLE3: user,
      BOT_CDETALLE4: password,
      BOT_CDETALLE8: req.user.rpermiso.PER_CCLIENTE,
      BOT_CDETALLE9: req.user.rpermiso.PER_CCAMPANA,
      BOT_CDETALLE10: req.user.rpermiso.PER_CAREA,
      BOT_CDETALLE12: "RATIO",
      BOT_CDETALLE13: 60,
      BOT_CDETALLE14: 5,
      BOT_CESTADO: "Activo",
      BOT_CDETALLE_REGISTRO: "REGISTRO INICIAL DEL SISTEMA",
    };

    const sqlInsert = "INSERT INTO dbp_virtualvcdial.tbl_rbots SET ?";
    db.promise()
      .query(sqlInsert, [data_bot])
      .then(([result]) => {
        res.json({ result });
        ejecutarPython(nombre_bot);
      })
      .catch((err) => console.log("ERROR::", err));
  }
);

router.post(
  "/agregarCamp",
  (req, res, next) => {
    const { selectCamp, ip } = req.body;
    const sql = 'SELECT * FROM dbp_virtualvcdial.tbl_rbots WHERE BOT_NCONSULTA = "ControlInicioBot" AND BOT_CDETALLE2 = ? AND BOT_CDETALLE6 = ? AND BOT_CDETALLE8 = ? AND BOT_CDETALLE9 = ? AND BOT_CDETALLE10 = ? AND BOT_CESTADO = "Activo";';
    db.promise()
      .query(sql, [ip, selectCamp, req.user.rpermiso.PER_CCLIENTE, req.user.rpermiso.PER_CCAMPANA, req.user.rpermiso.PER_CAREA])
      .then(([result, fields]) => {
        if (result.length) {
          res.json({ campExiste: true, result: result[0].BOT_CDETALLE });
        } else {
          next();
        }
      });
  },
  (req, res) => {
    const { id_bot, selectCamp } = req.body;
    const sqlUpdate = "UPDATE dbp_virtualvcdial.tbl_rbots SET BOT_CDETALLE6 = ? WHERE PKBOT_NCODIGO = ?";
    db.promise()
      .query(sqlUpdate, [selectCamp, id_bot])
      .then((result) => {
        res.json({ result });
      })
      .catch((err) => console.log("ERROR::", err));
    // ? ResultSetHeader {
    // ?   fieldCount: 0,
    // ?   affectedRows: 1,
    // ?   insertId: 0,
    // ?   info: 'Rows matched: 1  Changed: 1  Warnings: 0',
    // ?   serverStatus: 2,
    // ?   warningStatus: 0,
    // ?   changedRows: 1
    // ? } true
  }
);

router.post("/config", (req, res) => {
  const { id_config, periodoCambio, limiteDisponible, selectRatio } = req.body;
  const sqlUpdate = "UPDATE dbp_virtualvcdial.tbl_rbots SET BOT_CDETALLE12 = ?, BOT_CDETALLE13 = ?, BOT_CDETALLE14 = ? WHERE PKBOT_NCODIGO = ?";
  console.log(req.body);
  db.promise()
    .query(sqlUpdate, [selectRatio, periodoCambio, limiteDisponible, id_config])
    .then(([result]) => {
      console.log(result);
      res.json({ result });
    })
    .catch((err) => console.log("ERROR::", err));
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  // * DELETE FROM dbp_virtualvcdial.tbl_rbots WHERE PKBOT_NCODIGO = ?
  const sqlDelete = "DELETE FROM dbp_virtualvcdial.tbl_rbots WHERE PKBOT_NCODIGO = ?";
  db.promise()
    .query(sqlDelete, [id])
    .then(([result]) => {
      console.log(result);
      res.json({ result });
    })
    .catch((err) => console.log("ERROR::", err));
});

const ejecutarPython = (nombre_bot) => {
  const child = spawn("python3", ["-u", "vcdial-py/AdminVcdial.py", nombre_bot]);
  child.stdout.on("data", (data) => {
    console.log(`stdout:\n${data}`);
  });
  child.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });
};

module.exports = router;
