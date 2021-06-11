const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']
const Book = require('../models/book')
const Author = require('../models/author')
const uploadPath = path.join('public', Book.coverImageBasePath)
const { param } = require('./authors')
const upload = multer({
    dest: uploadPath,
    fileFilter: (req, file, callback) => {
        callback(null, imageMimeTypes.includes(file.mimetype))
    }
})

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
router.post('/', upload.single('cover'), async (req, res) => {
    //Si el filename es nullo
    const fileName = req.file != null ? req.file.filename : null
    //Si el file name no es nulo entonces crea un nuevo Libro
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: parseInt(req.body.pageCount),
        coverImageName: fileName,
        description: req.body.description
    })
    try {
        //Guardamos en mongodb el libro creado
        const newBook = await book.save()
        //res.redirect(`books/${newbook.id}`)
        //Redirigimos a todos los libros luego de crear el libro
        res.redirect('books')
    } catch {
        // Para manejar errores => si la cover image es distinta de null
        if(book.coverImageName != null) {
            removeBookCover(book.coverImageName)
        }
        renderNewPage(res, book, true)
    }
})

function removeBookCover(fileName) {
    //Removemos el file que no queremos en nuestro server => por si hay un error al crear el libro
    fs.unlink(path.join(uploadPath, fileName), err => {
        if (err) console.err(err)
    })
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