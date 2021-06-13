const mongoose = require('mongoose')
const Book = require('./book')

const authorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
})

// Para que no se elimine un autor que está asociado a un libro 
authorSchema.pre('remove', function(next) {
    Book.find({ author: this.id }, (err, books) => {
        if(err) {
            nex(err)
        } else if (books.length > 0) {
            next(new Error('Este autor posee un libro'))
        } else {
            next()
        }
    })
})

module.exports = mongoose.model('Author', authorSchema)