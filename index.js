require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

// Express middleware
app.use(express.json())
app.use(cors())
app.use(express.static('build')) 
// Morgan middleware
morgan.token('body', function (req, res) {
  return JSON.stringify(req.body)
})
// app.use(morgan(':body :method :url :status :res[content-length] - :response-time ms'))

const errorHandler = (error, request, response, next) => {
  console.log(error.message)

  if(error.name === 'CastError') {
    return response.status(400).send({error: 'malformatted id'})
  } else if(error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({error: 'unknown endpoint'})
}


// Fetching all persons
app.get('/api/persons', (request, response, next) => {
  Person.find({})
    .then((persons) => {
      response.json(persons)
    })
    .catch(error => next(error))
})

// Info route
app.get('/api/info', (request, response) => {
  Person.find({}).then((persons) => {
    response.send(`<div>
    <p>Phonebook has info for ${persons.length} people</p>
    <p>${new Date()}</p>`)
  })
})

// Fetching individual person
app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if(person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})


// Deleting a contact
app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

// Creating a new contact
app.post('/api/persons', (request, response, next) => {
  const body = request.body


  // Repeated name
  // persons.forEach(person => {
  //   if(person.name === body.name) {
  //     return response.status(400).json({
  //       error: 'The contact is already in phonebook'
  //     })
  //   }
  // })

  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person.save()
    .then(savedPerson => {
      response.json(savedPerson)
    })
    .catch(error => next(error))
})


app.put('/api/persons/:id', (request, response, next) => {
  const {name, number} = request.body

  Person
      .findByIdAndUpdate(
        request.params.id,
        { name, number },
        { new: true, runValidators: true, context: 'query' }
        )
      .then(updatedPerson => {
        response.json(updatedPerson)
      })
      .catch(error => next(error))
})

app.use(unknownEndpoint)
app.use(errorHandler)
const PORT = process.env.PORT
app.listen(PORT)
console.log(`Server Running on port ${PORT}`)