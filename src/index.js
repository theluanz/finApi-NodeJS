const express = require('express');
const { v4: uuid } = require('uuid');

const app = express();
app.use(express.json());
const customers = [];

app.post('/account', (req, res) => {
  const { cpf, name } = req.body;
  const customerAlredyExists = customers.some((customer) => customer.cpf === cpf);

  if (customerAlredyExists) {
    return res.status(400).json({ message: 'CPF já existe' }).send();
  }

  customers.push({ id: uuid(), cpf, name, statement: [] });

  return res.status(201).send();
});

app.listen(3333);
