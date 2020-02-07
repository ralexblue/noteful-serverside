const express =require('express');
const path= require('path');
const logger =require('./logger');
const notesRouter = express.Router();
const bodyParser=express.json();
const uuid =require('uuid/v4');
const notesService =require('./notesService')
const xss = require('xss')

const serializeNotes = notes => ({
    id: notes.id,
    author: xss(notes.author),
    content:xss(notes.content),
    folder:notes.folder
})

notesRouter
.route('/')
.get((req,res,next)=>{
    notesService.getAllnotes(req.app.get('db'))
    .then(notes=>{
        res.json(notes.map(serializeNotes))
    })
    .catch(next)
})
.post(bodyParser,(req,res,next)=>{
    const{author,content,folder} = req.body;
    const newNote = {author,content,folder}
    for (const [key, value] of Object.entries(newNote)){
      if (value == null){
            return res.status(400).json({
            error: { message: `Missing '${key}' in request body` }
            })
        }
    }
    notesService.addanitem(req.app.get('db'),newNote)
    .then(note=>{
        res.status(201)
        .location(path.posix.join(req.originalUrl, `/${note.id}`))
        .json(serializeNotes(note))
    })
    .catch(next)
})
notesRouter
.route('/:id')
.all((req,res,next)=>{
    const noteid = req.params.id
    notesService.getById(req.app.get('db'), noteid)
    .then(note=>{
        if(!note){
            logger.error(`Folder with id ${noteid} not found`)
            return res.status(404).json({
                error: { message: `Note Not Found` }
              })
        }
    })
    .catch(next)
})
.get((req,res)=>{
    res.json(serializeFolders(res.folder))
})
.delete((req, res, next) => {
const { noteid } = req.params.id
notesService.deleteanitem(req.app.get('db'),noteid)
    .then(numRowsAffected => {
    logger.info(`Bookmark with id ${noteid} deleted.`)
    res.status(204).end()
    })
    .catch(next)
})
.patch(bodyParser, (req, res, next) => {
    const { author,content,folder} = req.body
    const NoteToUpdate = {author,content,folder}

    const numberOfValues = Object.values(NoteToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
        return res.status(400).json({
        error: {
            message: `Request body must contain either 'author','content,'folder'`
        }
        })
    }
    notesService.updateitem(req.app.get('db'),req.params.folderid,NoteToUpdate)
    .then(numRowsAffected => {
        res.status(204).end()
        })
    .catch(next);
})

module.exports = notesRouter;