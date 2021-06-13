const express = require('express')
const router = express.Router()
const Book = require('../models/book')
const Author = require('../models/author')
const imageMimeTypes = ['image/jpeg', 'image/png', 'images/gif']

// Route todos los libros
router.get('/', async (req, res) => {
    // Para filtrat por título
    let query = Book.find()
    if (req.query.title != null && req.query.title != '') {
        query = query.regex('title', new RegExp(req.query.title, 'i'))
    }
    // Para filtrar por fecha
    if (req.query.publishedBefore != null && req.query.publishedBefore != '') {
        query = query.lte('publishDate', req.query.publishedBefore)
    }
    if (req.query.publishedAfter != null && req.query.publishedAfter != '') {
        query = query.gte('publishDate', req.query.publishedAfter)
    }
    //Aqui empieza recien para obtener todos los libros
    try {
        // Buscamos los libros, recordar que query = Book.find()
        const books = await query.exec()
        // Renderiza los libros y le pasamos los parámetros correspondientes: books y searchOptions
        res.render('books/index', {
        books: books,
        searchOptions: req.query
        })
    } catch {
        // Si no encuentra los libros, redirigimos a la página principal
        res.redirect('/')
  }
})

// Nuevo libro form route
router.get('/new', async (req, res) => {
    renderNewPage(res, new Book())
})

// Crear libro route
router.post('/', async (req, res) => {
    //Nuevo libro
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        description: req.body.description
    })
    saveCover(book, req.body.cover)

    try {
        //Guardamos en mongodb el libro creado
        const newBook = await book.save()
        //Redirigimos a todos los libros luego de crear el libro
        res.redirect(`books/${newBook.id}`)
    } catch {
        renderNewPage(res, book, true)
    }
})

// Mostrar libro routes
router.get('/:id', async (req, res) => {
    try {
        //Buscamos el libro por id
        const book = await Book.findById(req.params.id).populate('author').exec()
        // Renderizamos la página de books/show para que muestre el libro 
        res.render('books/show', { book: book })
    } catch {
        //Si hay error vuelve a la página principal
        res.redirect('/')
    }
})

// Editar libro route get
router.get('/:id/edit', async (req, res) => {
    try {
        //Buscamos por id para editar el libro 
        const book = await Book.findById(req.params.id)
        //Renderizamos la página correspondiente al libro
        renderEditPage(res, book)
    } catch {
        //Si hay error vuelve a la página principal
        res.redirect('/')
    }
})

// Editar libro put
router.put('/:id', async (req, res) => {
    let book

    try {
        //Buscamos por id el libro que queremos editar, le pasamos los parametros para editar
        book = await Book.findById(req.params.id)
        book.title = req.body.title
        book.author = req.body.author
        book.publishDate = new Date(req.body.publishDate)
        book.pageCount = req.body.pageCount
        book.description = req.body.description
        //Si el cover no es null o tiene string vacío
        if (req.body.cover != null && req.body.cover !== '') {
            saveCover(book, req.body.cover)
        }
        //Guardamos el libro en mongodb
        await book.save()
        //Redirigimos al libro editado
        res.redirect(`/books/${book.id}`)
    } catch {
        //Errores
        if (book != null) {
            renderEditPage(res, book, true)
        } else {
            //Redirigimos a la página principal si no encuentra el error
            res.redirect('/')
        }
    } 
})

// Eliminar libro route
router.delete('/:id', async (req, res) => {
    let book
    try {
        //Buscamos el libro por id para eliminarlo
        book = await Book.findById(req.params.id)
        //removemos el libro en mongodb
        await book.remove()
        // Redirigimos a /books
        res.redirect('/books')
    } catch {
        //Si hay error muestra un mensaje
        if (book != null) {
        res.render('books/show', {
        book: book,
        errorMessage: 'No se pudo eliminar el libro'
        })
        } else {
            // Si no encuentra el error entonces redirige al inicio
            res.redirect('/')
        }
    }
})

//Para crear un libro => hacemos esto para limpiar mejor el código
async function renderNewPage(res, book, hasError = false) {
    renderFormPage(res, book, 'new', hasError)
}

// Para editar un libro => hacemos esto para limpiar mejor el código
async function renderEditPage(res, book, hasError = false) {
    renderFormPage(res, book, 'edit', hasError)
}

// Función form page => para limpiar aun más el código
async function renderFormPage(res, book, form, hasError = false) {
    try {
        //Buscamos el autor
        const authors = await Author.find({})
        // Parametros 
        const params = {
            authors: authors,
            book: book
        }
        // Si existe error
        if (hasError) {
            if (form === 'edit') {
                params.errorMessage = 'Error Updating Book'
            } else {
                params.errorMessage = 'Error Creating Book'
            }
        }
        //Renderiza la página
        res.render(`books/${form}`, params)
    } catch {
        // Si no funciona redirige a /books
        res.redirect('/books')
    }
}

//Función para guardar la img de la portada
function saveCover(book, coverEncoded) {
    //Checkeamos si el cover es un cover válido
    if (coverEncoded == null) return
    //Parseamos a JSON
    const cover = JSON.parse(coverEncoded)
    // Si el cover es distinto de null u si es del tipo correcto
    if (cover != null && imageMimeTypes.includes(cover.type)) {
        book.coverImage = new Buffer.from(cover.data, 'base64')
        book.coverImageType = cover.type
    }
}

module.exports = router