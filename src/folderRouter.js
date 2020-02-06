const express =require('express');
const path= require('path');
const logger =require('./logger');
const folderRouter = express.Router();
const bodyParser=express.json();
const uuid =require('uuid/v4');
const folderService =require('./folderService')
const xss = require('xss')

const serializeFolders = folder => ({
    id: folder.id,
    title: xss(folder.title),
})
folderRouter
.route('/')
.get((req,res,next)=>{
    const knexInstance=req.app.get('db');
    folderService.getAllFolders(knexInstance)
    .then(folders =>{
        res.json(folders.map(serializeFolders))
    })
    .catch(next)
})
.post(bodyParser,(req,res)=>{
    const {id,title} = req.body;
    if(!title){
        logger.error('Title is required');
      return res
        .status(400)
        .send('missing title');
    }
    const newfolder={
        id,
        title
    };
    folderService.addanitem(req.app.get('db'),newfolder)
    .then(folder=>{
        logger.info(`added folder with id ${folder.id}`)
        res.status(201)
        .location(path.posix.join(req.originalUrl,`/${folder.id}`))
        .json(serializeFolders(folder))
    })
})
folderRouter
.route('/:id')
.all((req,res,next)=>{
    const folderid = req.params.id
    //console.log(req.params.id);
    folderService.getById(req.app.get('db'), folderid)
    .then(folder=>{
        if(!folder){
            logger.error(`Folder with id ${folderid} not found`)
            return res.status(404).json({
                error: { message: `Folder Not Found` }
              })
        }
    })
    .catch(next)
})
.get((req,res)=>{
    res.json(serializeFolders(res.folder))
})
.delete((req, res, next) => {
    const  folderid  = req.params.id
    //console.log(req.params);
    console.log(folderid);
    folderService.deleteanitem(req.app.get('db'),folderid)
        .then(numRowsAffected => {
        logger.info(`Bookmark with id ${folderid} deleted.`)
        res.status(204).end()
        })
        .catch(next)
})
.patch(bodyParser, (req, res, next) => {
    const {title} = req.body
    const folderToUpdate = title;
    const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
        return res.status(400).json({
        error: {
            message: `Request body must contain either 'title'`
        }
        })
    }

    folderService.updateitem(req.app.get('db'),req.params.folderid,folderToUpdate)
    .then(numRowsAffected => {
        res.status(204).end()
        })
    .catch(next);
})


module.exports = folderRouter;