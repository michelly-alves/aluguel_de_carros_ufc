const express = require('express');
const cookieParser = require('cookie-parser');
const basicAuth = require('express-basic-auth');
const nodemailer = require('nodemailer');
var CookieSession = require('cookie-session');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const router = express.Router();
const { ObjectId } = require('mongodb');

module.exports = router;
const app = express()
const port = 3000

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('public'));
app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))

const mongoRepository = require('./repository/mongo-repository')

app.use(cookieParser());

app.use(
  session({
    secret: 'docedebananaébom',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      secure: false,
      httpOnly: true,
    },
    store: MongoStore.create({
      mongoUrl: 'mongodb://root:rootpwd@localhost:27017',
      ttl: 24 * 60 * 60,
    }),
  })
);

const adminAuth = basicAuth({
  authorizer: async (email, password, callback) => {
    const admin = await mongoRepository.getAdmin(email, password);
    if (!admin || admin.password !== password) {
      return callback(null, false);
    }
    callback(null, true);
  },
  unauthorizedResponse: 'Acesso não autorizado como administrador'
});


const clientAuth = basicAuth({
  authorizer: async (email, password, callback) => {
    const client = await mongoRepository.getUsers(email, password);

    if (!client || client.password !== password) {
      return callback(null, false);
    }

    callback(null, true);
  },
  unauthorizedResponse: 'Acesso não autorizado como cliente'
});

app.get('/', (req, res) => {
  console.log('GET - index');

  mongoRepository.getAllCarros().then((foundCarros) => {
    res.render('index', {
      carros: foundCarros,
      user: req.session.user
    });
  });
});

app.get('/signup', function (req, res) {
  message = req.body.message
  res.render('user/signup.ejs');
});

app.post('/signup', async (req, res) => {
  try {
    let email = req.body.email
    const isEmailRegistered = await mongoRepository.isEmailAlreadyRegistered(email);
    if (isEmailRegistered) {
      console.log(email)
      res.render('user/signup.ejs', {
        message: 'Esse email já está em uso'
      });
    } else {
      mongoRepository.saveUser(req.body).then((insertedUser) => {
        console.log('Inserted User')
        console.log(insertedUser)
        console.log(email)

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'testeEstudosFaculdade@gmail.com',
            pass: 'cybvmljdthjrzvkr'
          }
        });
        const mailOptions = {
          from: 'testeEstudosFaculdade@gmail.com',
          to: req.body.email,
          subject: 'Confirmação de cadastro',
          text: `Olá ${req.body.name}, seu cadastro foi confirmado. Obrigado!`
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.error(error);
          } else {
            console.log('Email enviado: ' + info.response);
          }
        });
        res.redirect('/loja')
      })
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }

});

app.get('/signin', function (req, res) {
  message = req.body.message
  res.render('user/signin.ejs');
  console.log(" app.get user/signin")
});

app.post('/signin', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = await mongoRepository.getUsers(email, password);

  if (user.length !== 0) {
    req.session.user = {
      name: req.body.name,
      dataNascimento: req.body.dataNascimento,
      genero: req.body.genero,
      telefone: req.body.telefone,
      email: req.body.email,
      password: req.body.password
    };
    console.log(req.session.user)
    req.session.userAuthenticated = true;
    console.log("Usuário existe:", user);
    res.redirect('/loja');
  } else {
    console.log("Usuário não existe");
    res.render('user/signin.ejs', {
      message: 'Email ou senha incorretos'
    });
  }
});

app.get('/admin', function (req, res) {
  message = req.body.message
  res.render('admin/signin.ejs');
  console.log(" app.get admin/signin")
});

app.post('/admin', async (req, res) => {
  console.log("/admin auth", req.session.adminAuthenticated);
  const email = req.body.email;
  const password = req.body.password;

  const admin = await mongoRepository.getAdmin(email, password);

  if (admin.length !== 0) {
    req.session.user = {
      email: req.body.email
    };
    req.session.adminAuthenticated = true; 
    console.log("admin existe", admin);
    console.log("adm auth", req.session.adminAuthenticated);
    res.redirect('/admin/loja'); 
  } else {
    console.log("admin não existe");
    res.render('admin/signin.ejs', {
      message: 'Email ou senha incorretos'
    });
  }
});

app.get('/loja', (req, res) => {
  if (req.session.userAuthenticated) {

    console.log('GET - index')
    mongoRepository.getAllCarros().then((foundCarros) => {
      res.render('loja/loja', {
        carros: foundCarros,
        user: req.session.user
      })
    })
  } else {
    res.redirect('/signin');
  }

})
app.get('/loja/conta', async (req, res) => {
  console.log('loja conta edit loja/conta get', req.session.user)
  if (req.session.userAuthenticated) {
    res.render('loja/conta', {
      user: await mongoRepository.isEmailAlreadyRegistered(req.session.user.email)
    });
  } else {
    res.redirect('/signin');
  }
});

app.get('/loja/conta-editar', async (req, res) => {
  message = req.body.message
  console.log('loja conta edit app.get', req.session.user)
  if (req.session.userAuthenticated) {
    res.render('loja/conta-editar', {
      user: await mongoRepository.isEmailAlreadyRegistered(req.session.user.email)
    });
  } else {
    res.redirect('/signin');
  }
});

app.post('/loja/conta-editar', async (req, res) => {
  console.log('loja conta edit app.get', req.session.user)
  message = req.body.message
  if (req.session.userAuthenticated) {
    try {
      let emailUser = req.session.user.email; 
      const novasInformacoes = {
        name: req.body.name,
        dataNascimento: req.body.dataNascimento,
        genero: req.body.genero,
        telefone: req.body.telefone,
        email: req.body.email,
      };

      console.log("email user", emailUser)


      await mongoRepository.editUser(emailUser, novasInformacoes);
      req.session.user = {
        name: req.body.name,
        dataNascimento: req.body.dataNascimento,
        genero: req.body.genero,
        telefone: req.body.telefone,
        email: req.body.email,
        password: req.session.user.password
      };
      console.log("await mongoRepository.editUser(emailUser, novasInformacoes);", await mongoRepository.editUser(emailUser, novasInformacoes))
      res.redirect('/loja/conta');
    } catch (err) {
      console.error(`Erro ao editar o user: ${err}`);
      res.redirect('/loja/conta');
    }
  } else {
    res.redirect('/signin');
  }
});

app.get('/loja/senha-editar', (req, res) => {
  message = req.body.message
  if (req.session.userAuthenticated) {
    res.render('loja/senha-editar.ejs');
  } else {
    res.redirect('/signin');
  }
});

app.get('/loja/senha-editar', (req, res) => {
  message = req.body.message
  if (req.session.userAuthenticated) {
    res.render('loja/senha-editar.ejs');
  } else {
    res.redirect('/signin');
  }
});

app.post('/loja/senha-editar', async (req, res) => {
  message = req.body.message
  let oldpassword = req.body.oldpassword;
  if (req.session.userAuthenticated) {
    if (oldpassword != req.session.user.password) {  
      res.render('loja/senha-editar', {
        message: 'senha anterior invalida'
      });
    } else {
    try {
      if (oldpassword === req.session.user.password) {
        let emailUser = req.session.user.email;
        const novasInformacoes = {
          password: req.body.password
        };

        console.log("emaiol user", emailUser)


        await mongoRepository.editUserPass(emailUser, novasInformacoes);
        req.session.user.password = req.body.password;
        console.log("await mongoRepository.editUser(emailUser, novasInformacoes);", password)
        res.render('/loja');
      }

    } catch (err) {
      console.error(`Erro ao editar o user: ${err}`);
      res.redirect('/loja/conta');
    }
  }
  } else {
    res.redirect('/signin');
  }
})


app.get('/loja/alugar/:nome', async (req, res) => {
  if (req.session.userAuthenticated) {
  console.log(req.session.user.email, "app.get('/loja/alugar/:nome'")
  console.log("Entrou");
  const nomeCarro = req.params.nome;
  const carro = await mongoRepository.getCarroByName(nomeCarro);
  res.render('loja/alugar', {
    carros: carro
  });
} else {
  res.redirect('/signin');
}

})

app.post('/loja/alugar/:nome', async (req, res) => {
  if (req.session.userAuthenticated) {
  console.log("req nome admin/edt carro", req.params.nome);
  const nomeCarro = req.params.nome; 
  const carro = await mongoRepository.getCarroByName(nomeCarro);
  const aluguel = {
    nomeUser: req.session.user.email,
    carro: carro,
    dataInicio: req.body.datainicio,
    dataFim: req.body.dataFim,
    valorTotal: req.body.valorTotal,
    formaPagamento: req.body.formaPagamento, 
    status: "Aguardando Confirmação"
  };

  console
  await mongoRepository.saveAluguel(aluguel);
  res.redirect('/loja/aluguel');
} else {
  res.redirect('/signin');
}
});

app.get('/loja/aluguel', async (req, res) => {
  if (req.session.userAuthenticated) {
    const aluguel = await mongoRepository.getAluguelByEmail(req.session.user.email);
    res.render('loja/aluguel', {
      aluguel: aluguel 
    });
  } else {
    res.redirect('/signin');
  }
});

app.get('/admin/aluguel', async (req, res) => {
  console.log("admin aluguel get")
  if (req.session.adminAuthenticated) {
    const aluguel = await mongoRepository.getAllAlugueis();
    res.render('admin/aluguel', {
      aluguel: aluguel 
    });
  } else {
    res.redirect('/signin');
  }
});

app.post('/admin/aluguel/:id', async (req, res) => {
  console.log("admin aluguel post");
  if (req.session.adminAuthenticated) {
    try {
      const idAluguel =  req.params.id;
      const status = req.body.status;

      const novoAluguel = {
        status: req.body.status
      };
     console.log("admin aluguel post", idAluguel);
      console.log("admin aluguel post", status);
     
      const aluguel = await mongoRepository.getAllAlugueis();
     await mongoRepository.editAluguel(idAluguel, novoAluguel);
  
      console.log("admin aluguel post", await mongoRepository.editAluguel(idAluguel, novoAluguel));
      res.rendirect('admin/aluguel')
    } catch (err) {
      console.error(`Erro ao editar o aluguel: ${err}`);
      res.redirect('/admin/aluguel');
    }
  } else {
    res.redirect('/admin');
  }
});

app.get('/admin/loja', function (req, res) {
  console.log("/admin/loja auth", req.session.adminAuthenticated);
  const user = req.session.user;
  if (req.session.adminAuthenticated) {
    mongoRepository.getAllCarros().then((foundCarros) => {
      res.render('admin/loja.ejs', {
        carros: foundCarros,
      });
      console.log("get admin/loja");
    });
  } else {
    res.redirect('/admin');
  }
});

app.get('/admin/add-carro', function (req, res) {
  if (req.session.adminAuthenticated) {
    res.render('admin/add-carro.ejs');
    console.log(" admin/add-carro")
  } else {
    res.redirect('/admin');
  }

});

app.post('/add-carro', (req, res) => {
  console.log("/admin/loja auth", req.session.adminAuthenticated);
  console.log('POST - /admin/add-carro')
  const user = req.session.user;
  let newCarro = req.body;
  newCarro.createdBy = user;
  console.log(newCarro)
  if (req.session.adminAuthenticated) {
    mongoRepository.saveCarros(req.body).then((insertedCarro) => {
      console.log('Inserted Carro')
      console.log(insertedCarro)
      res.redirect('admin/loja')
    })
  } else {
    res.redirect('/admin');
  }

})

app.get('/deletar-carro', (req, res) => {
  if (req.session.adminAuthenticated) {
    let deleteCarros = req._id
    console.error(deleteCarros);
    mongoRepository.deleteCarros(deleteCarros)
      .then(() => {
        console.log(`Categoria com id ${deleteCarros} excluída com sucesso`)
        res.redirect('admin/loja')
      })
  } else {
    res.redirect('/admin');
  }

})

app.get('/admin/carro-editar/:nome', async (req, res) => {
  const nomeCarro = req.params.nome;
  if (req.session.adminAuthenticated) {
    console.log("req AAAAAAAAnome admin/edt carro", nomeCarro);
    try {
      const carro = await mongoRepository.getCarroByName(nomeCarro);
      if (!carro) {
        console.error('Carro não encontrado');
        res.redirect('/admin/loja');
        return;
      }
      res.render('admin/carro-editar', {
        carros: carro
      });
    } catch (err) {
      console.error(`Erro ao obter informações do carro: ${err}`);
      res.redirect('/admin/loja');
    }
  } else {
    res.redirect('/admin');
  }
});

app.post('/admin/editar-carro/:nome', async (req, res) => {
  console.log("req nome admin/edt carro", req.params.nome)
  if (req.session.adminAuthenticated) {
    try {
      const nomeCarro = req.params.nome; 
      const novasInformacoes = {
        imagem: req.body.imagem,
        marca: req.body.marca,
        cor: req.body.cor,
        valor: req.body.valor,
        precoDiaria: req.body.precoDiaria,
      };

      await mongoRepository.editCarro(nomeCarro, novasInformacoes);
      res.redirect('/admin/loja');
    } catch (err) {
      console.error(`Erro ao editar o carro: ${err}`);
      res.redirect('/admin/loja');
      const carro = await mongoRepository.getCarroByName(nomeCarro);
    }
  } else {
    res.redirect('/admin');
  }

});

app.post('/busca', (req, res) => {
  const nome = req.body.busca.toLowerCase(); 
  const marca = req.body.busca.toLowerCase(); 

  mongoRepository.getAllCarros()
    .then(carros => {
      const carrosEncontrados = carros.filter(carro =>
        carro.nome.toLowerCase().includes(nome) ||
        carro.marca.toLowerCase().includes(marca)
      );

      res.render('loja/loja.ejs', {
        carros: carrosEncontrados
      });
    })
    .catch(err => {
      console.error(`Erro ao buscar carros: ${err.message}`);
      res.redirect('loja/loja');
    });
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao destruir a sessão:', err);
      res.sendStatus(500);
    } else {
      res.redirect('/'); 
    }
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})