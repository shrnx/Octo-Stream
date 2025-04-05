import multer from 'multer'

const storage = multer.diskStorage({        // We are using diskStorage format here, we can also use memoryStorage.
    destination: function (req, file, cb) {         // cb is nothing but callback
        cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})


export const upload = multer({
    storage
})


// Minor Tweak -> Update filename to be unique for every files.

// We can say form to lete jarahe ho jara image bhi lete jana.