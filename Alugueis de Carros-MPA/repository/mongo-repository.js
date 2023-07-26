const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');


const url = 'mongodb://root:rootpwd@localhost:27017';
const client = new MongoClient(url);

const dbName = 'aluguelCarros';

var user_collection;
var carros_collection;
var admin_collection;
var aluguel_collection;

async function main() {
 
  await client.connect();
  console.log('Connected successfully to Mongo server');
  const db = client.db(dbName);
  user_collection = db.collection('user');
  carros_collection = db.collection('carros');
  admin_collection =db.collection('admin');
  aluguel_collection =db.collection('aluguel');
   
  return 'done.';
}

main()
  .then(console.log)
  .catch(console.error);

async function getUsers(email, password) {
    const findResult = await user_collection.find({email: email, password: password}).toArray();
    console.log('Repository - getUsers - Found documents =>', findResult);
    return findResult;
}

async function getCarroByName(nome) {
  const findResult = await carros_collection.findOne({ nome: nome });
  console.log('Repository - getCarroByName - Found document:', findResult);
  return findResult;
}

async function getAluguelByEmail(email) {
  const findResult = await aluguel_collection.find({ nomeUser: email }).toArray();
  console.log('Repository - getAluguelByEmail - Found document:', findResult);
  return findResult;
}

async function editCarro(nomeCarro, novasInformacoes) {
  const updateResult = await carros_collection.updateOne({ nome: nomeCarro }, { $set: novasInformacoes });
  console.log('Repository - editCarro - Updated document:', updateResult);
  return updateResult;
}

async function editAluguel(idAluguel, novasInformacoes) {
  const filter = { _id: new ObjectId(idAluguel) };
  const update = { $set: novasInformacoes };
  const updateResult = await aluguel_collection.updateOne(filter, update);
  console.log('Repository - editAluguel - Updated document:', updateResult);
  return updateResult;
}

async function editUserPass(password, novasInformacoes) {
  const updateResult = await user_collection.updateOne({ password: password }, { $set: novasInformacoes });
  console.log('Repository - editUserPass - Updated document:', updateResult);
  return updateResult;
}


async function editUser(emailUser, novasInformacoes) {
  const updateResult = await user_collection.updateOne({ email: emailUser }, {$set: novasInformacoes  });
  console.log('Repository - editUserPass - Updated document:', updateResult);
  return updateResult;
}

async function getAdmin(email, password) {
  const findResult = await admin_collection.find({email: email, password: password}).toArray();
  console.log('Repository - getAdmin - Found documents =>', findResult);
  return findResult;
}

async function getUsersFromDB() {
  const users = await user_collection.find({}).toArray();
  console.log('Found users:', users);
  return users.map(({ email, password }) => ({ email, password }));
}

async function saveCarros(carros){
  const result = await carros_collection.insertOne(carros)
  console.log('Repository - saveCarro - Inserted carro')
  console.log(result)
  return result;
}

async function isEmailAlreadyRegistered(email) {
  try {
    const user = await user_collection.findOne({ email });
    return user;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function saveUser(user){
  const result = await user_collection.insertOne(user)
  console.log('Repository - saveuser - Inserted user')
  console.log(result)
  return result;
}

async function deleteUser(user) {
  const result = await user_collection.deleteOne(user)
  console.log(`Usuario com value ${deleteUser.name} excluída do banco de dados`)
  return result
}

async function deleteCarros(carros) {
  const result = await carros_collection.deleteOne(carros)
  console.log(`Carro com id ${carros} excluído do banco de dados`)
  return result
}

async function getAluguelByUser(user) {
  console.log('getAluguelByUser - Username param:', user.username)
  
  const query = { "nomeUser": user.name};
  const findResult = await aluguel_collection.find(query).toArray();
  console.log('Repository - getAluguelByUser - Found documents =>', findResult);
  return findResult;
}

async function getAllCarros() {
  const findResult = await carros_collection.find({}).toArray();
  console.log('Repository - getAllCarros - Found documents =>', findResult);
  return findResult;
}

async function getAllAlugueis() {
  const findResult = await aluguel_collection.find({}).toArray();
  console.log('Repository - getAllAlugueis - Found documents =>', findResult);
  return findResult;
}

async function saveAluguel(aluguel) {
  const result = await aluguel_collection.insertOne(aluguel);
  console.log('Repository - saveAluguel - Inserted aluguel');
  console.log(result);
  return result;
}

async function compareEmails(user) {
  const findResult = await user_collection.find({}).toArray();
  console.log('Repository - compareEmail - Found documents =>', findResult);
  return findResult;
}

exports.deleteUser = deleteUser;
exports.deleteCarros = deleteCarros;
exports.saveUser = saveUser;
exports.getUsers = getUsers;
exports.getAdmin = getAdmin;
exports.editCarro = editCarro;
exports.editUser = editUser;
exports.editUserPass = editUserPass;
exports.editAluguel = editAluguel;
exports.getAluguelByEmail = getAluguelByEmail;
exports.getCarroByName = getCarroByName;
exports.getAluguelByUser = getAluguelByUser;
exports.getAllCarros = getAllCarros;
exports.compareEmails = compareEmails;
exports.getAllAlugueis = getAllAlugueis;
exports.isEmailAlreadyRegistered = isEmailAlreadyRegistered;
exports.saveCarros = saveCarros;
exports.saveAluguel = saveAluguel;
exports.getUsersFromDB = getUsersFromDB;