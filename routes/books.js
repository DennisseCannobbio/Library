const express = require('express')
const router = express.Router()
const Book = require('../models/book')
const Author = require('../models/author')
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']


// Todos los libros route
router.get('/', async (req, res) => {
    //Para filtrar por título
    let query = Book.find()
    if(req.query.title != null && req.query.title != '') {
        query = query.regex('title', new RegExp(req.query.title, 'i'))
    }
    //Para filtrar por fecha
    if(req.query.publishedBefore != null && req.query.publishedBefore != '') {
        query = query.lte('publishDate', req.query.publishedBefore)
    }
    if(req.query.publishedAfter!= null && req.query.publishedAfter != '') {
        query = query.gte('publishDate', req.query.publishedAfter)
    }
    try {
        const books = await query.exec()
        res.render('books/index', {
            books: books,
            searchOptions: req.query
        })
    } catch  {
        res.redirect('/')
    }

})

// Nuevo libro form route 
router.get('/new', async (req, res) => {
    renderNewPage(res, new Book())
})

// Crear libro route
router.post('/', async (req, res) => {
    //Si el filename es nullo
    const fileName = req.file != null ? req.file.filename : null
    //Si el file name no es nulo entonces crea un nuevo Libro
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: parseInt(req.body.pageCount),
        description: req.body.description
    })
    saveCover(book, req.body.cover)

    try {
        //Guardamos en mongodb el libro creado
        const newBook = await book.save()
        //res.redirect(`books/${newbook.id}`)
        //Redirigimos a todos los libros luego de crear el libro
        res.redirect('books')
    } catch {
        renderNewPage(res, book, true)
    }
})

//Función para guardar la img de la portada
function saveCover(book, coverEncoded) {
    //Checkeamos si el cover es un cover válido
    if(coverEncoded == null) return
    //Parseamos a JSON
    const cover = JSON.parse(coverEncoded)
    //Si el cover es distinto de null y si es del tipo correcto
    if(cover != null && imageMimeTypes.includes(cover.type)) {
        book.coverImage = new Buffer.from(cover.data, 'base64')
        book.coverImageType = cover.type
    }
}

//Para renderizar una nueva página => hacemos esto para limpiar mejor el código
async function renderNewPage(res, book, hasError = false) {
    try {
        const authors = await Author.find({})
        const params = {
            authors: authors,
            book: book
        }
        if(hasError) params.errorMessage = 'Error al crear el libro'
        res.render('books/new', params)
    } catch  {
        res.redirect('/books')
    }
}

module.exports = router