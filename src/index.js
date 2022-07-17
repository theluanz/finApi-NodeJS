const express = require('express');
const { v4: uuid } = require('uuid');

const app = express();
app.use(express.json());

const customers = [];

// Middleware
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;
  const customer = customers.find((customer) => customer.cpf === cpf);
  if (!customer) {
    return response.status(400).json({ error: 'Usuário não encontrado' }).send();
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acumulador, operation) => {
    if (operation.type === 'credit') {
      return acumulador + operation.amount;
    } else {
      return acumulador - operation.amount;
    }
  }, 0);
  return balance;
}

app.post('/account', (request, response) => {
  const { cpf, name } = request.body;
  const customerAlredyExists = customers.some((customer) => customer.cpf === cpf);

  if (customerAlredyExists) {
    return response.status(400).json({ message: 'CPF já existe' }).send();
  }

  customers.push({ id: uuid(), cpf, name, statement: [] });

  return response.status(201).send();
});

app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;
  customer.name = name;

  return response.status(200).send();
});

app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  return response.status(200).json(customer).send();
});

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  return response.json(customer.statement).send();
});

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;
  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit',
  };
  customer.statement.push(statementOperation);
  return response.status(201).send();
});

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: 'Saldo insuficiente' }).send();
  }

  const statementOperation = {
    description: 'Saque',
    amount,
    created_at: new Date(),
    type: 'debit',
  };

  customer.statement.push(statementOperation);
  return response.status(201).send();
});

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;
  const dateFormat = new Date(date + ' 00:00');
  const statement = customer.statement.filter(
    (operation) => operation.created_at.toDateString() == new Date(dateFormat).toDateString(),
  );

  return response.json(statement).send();
});

app.listen(3333);
