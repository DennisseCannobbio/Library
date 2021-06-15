//Trae todos los styles del root element
const rootStyles = window.getComputedStyle(document.documentElement)

//Si la variable --book-cover-width-large es distinta de null y empty string => podemos acceder a la variable
if (rootStyles.getPropertyValue('--book-cover-width-large') != null && rootStyles.getPropertyValue('--book-cover-width-large') !== '') {
    ready()
} else {
    //Si no es distinta de null, es decir, si aún no carga => llamamos a la id main-css agregada en layouts-ejs en la referencia del stylesheet
    document.getElementById('main-css').addEventListener('load', ready)
}

function ready() {
    //Usamos la propiedad
    const coverWidth = parseFloat(rootStyles.getPropertyValue('--book-cover-width-large'))
    const coverAspectRatio = parseFloat(rootStyles.getPropertyValue('--book-cover-aspect-ratio'))
    const coverHeight = coverWidth / coverAspectRatio

    //Para que se muestre un preview al subir la portada del libro 
    FilePond.registerPlugin(
        FilePondPluginImagePreview,
        FilePondPluginImageResize,
        FilePondPluginFileEncode,
    )

    FilePond.setOptions({
        stylePanelAspectRatio: 1 / coverAspectRatio,
        imageResizeTargetWidth: coverWidth,
        imageResizeTargetHeight: coverHeight
    })
  
    FilePond.parse(document.body)
}