const express = require('express')
const router = express.Router()
const Author = require('../models/author')

// Todos los autores route
router.get('/', async (req, res) => {
    //Para buscar autores
    let searchOptions = {}
    if(req.query.name != null && req.query !== '') {
        searchOptions.name = new RegExp(req.query.name, 'i')
    }
    try {
        const authors = await Author.find(searchOptions)
        res.render('authors/index', { 
            authors: authors, 
            searchOptions: req.query
        })
    } catch  {
        res.redirect('/')
    }
})

// Nuevo autor form route 
router.get('/new', (req, res) => {
    res.render('authors/new', { author: new Author() })
})

// Crear autor route
router.post('/', async (req, res) => {
    const author = new Author({
        name: req.body.name
    })
    try {
        const newAuthor = await author.save()
        //res.redirect(`authors/${newAuthor.id}`)
        res.redirect('authors')
    } catch {
        res.render('authors/new', {
            author: author,
            errorMessage: 'Error al crear el autor'
        })
    }
})

module.exports = router